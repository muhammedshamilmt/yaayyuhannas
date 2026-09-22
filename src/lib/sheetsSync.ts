import { getGoogleSheetsClient, SPREADSHEET_CONFIG, convertToSheetFormat, getSheetHeaders, convertFromSheetFormat } from './googleSheets';
import { getDatabase } from './mongodb';
import { Team, Candidate, Result } from '@/types';
import { ObjectId } from 'mongodb';

export class GoogleSheetsSync {
  private sheets: any;
  private db: any;

  constructor() {
    this.initializeClients();
  }

  private async initializeClients() {
    try {
      this.sheets = await getGoogleSheetsClient();
      this.db = await getDatabase();
    } catch (error) {
      console.error('Error initializing Google Sheets sync:', error);
    }
  }

  // Ensure sheet exists with proper headers
  private async ensureSheetExists(sheetName: string, type: string) {
    try {
      if (!this.sheets) await this.initializeClients();

      console.log(`Checking if sheet "${sheetName}" exists in spreadsheet: ${SPREADSHEET_CONFIG.SPREADSHEET_ID}`);

      // Check if sheet exists
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
      });

      const sheetExists = spreadsheet.data.sheets?.some((sheet: any) =>
        sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        console.log(`Creating sheet: ${sheetName}`);

        // Create the sheet
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }]
          }
        });

        // Add headers
        const headers = getSheetHeaders(type);
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
          range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers]
          }
        });

        console.log(`Sheet "${sheetName}" created with headers`);
      }
    } catch (error) {
      console.error(`Error ensuring sheet exists: ${sheetName}`, error);
      throw error;
    }
  }

  // Sync data from MongoDB to Google Sheets
  async syncToSheets(type: 'teams' | 'candidates' | 'programmes' | 'results', data?: any[]) {
    try {
      if (!this.sheets || !this.db) await this.initializeClients();

      const sheetName = SPREADSHEET_CONFIG.SHEETS[type.toUpperCase() as keyof typeof SPREADSHEET_CONFIG.SHEETS];
      await this.ensureSheetExists(sheetName, type);

      // Get data from MongoDB if not provided
      if (!data) {
        const collection = this.db.collection(type);
        data = await collection.find({}).toArray();
      }

      if (!data || data.length === 0) {
        console.log(`No ${type} data to sync`);
        return { success: true, count: 0 };
      }

      // Convert data to sheet format
      const sheetData = convertToSheetFormat(data, type);
      const headers = getSheetHeaders(type);

      // Clear existing data and add new data
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
        range: `${sheetName}!A2:Z`,
      });

      // Add headers and data
      const allData = [headers, ...sheetData];
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: allData
        }
      });

      console.log(`Successfully synced ${data?.length || 0} ${type} records to Google Sheets`);
      return { success: true, count: data?.length || 0 };
    } catch (error) {
      console.error(`Error syncing ${type} to sheets:`, error);
      throw error;
    }
  }

  // Sync data from Google Sheets to MongoDB
  async syncFromSheets(type: 'teams' | 'candidates' | 'programmes' | 'results') {
    try {
      if (!this.sheets || !this.db) await this.initializeClients();

      const sheetName = SPREADSHEET_CONFIG.SHEETS[type.toUpperCase() as keyof typeof SPREADSHEET_CONFIG.SHEETS];
      
      // Get data from Google Sheets
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_CONFIG.SPREADSHEET_ID,
        range: `${sheetName}!A:Z`,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        console.log(`No data found in ${sheetName} sheet`);
        return { success: true, inserted: 0, updated: 0 };
      }

      // Convert sheet data to MongoDB format
      const documents = convertFromSheetFormat(rows, type);
      
      if (documents.length === 0) {
        console.log(`No valid data to import from ${sheetName}`);
        return { success: true, inserted: 0, updated: 0 };
      }

      const collection = this.db.collection(type);
      let insertedCount = 0;
      let updatedCount = 0;

      // Process each document
      for (const doc of documents) {
        try {
          if (doc._id && ObjectId.isValid(doc._id)) {
            // Update existing document
            const result = await collection.updateOne(
              { _id: new ObjectId(doc._id) },
              { 
                $set: { 
                  ...doc, 
                  _id: new ObjectId(doc._id),
                  updatedAt: new Date() 
                } 
              },
              { upsert: true }
            );
            
            if (result.upsertedCount > 0) {
              insertedCount++;
            } else if (result.modifiedCount > 0) {
              updatedCount++;
            }
          } else {
            // Insert new document
            delete doc._id; // Remove invalid _id
            const result = await collection.insertOne({
              ...doc,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            insertedCount++;
          }
        } catch (docError) {
          console.error(`Error processing document:`, docError);
          // Continue with next document
        }
      }

      console.log(`Successfully synced from Google Sheets: ${insertedCount} inserted, ${updatedCount} updated`);
      return { success: true, inserted: insertedCount, updated: updatedCount };
    } catch (error) {
      console.error(`Error syncing ${type} from sheets:`, error);
      throw error;
    }
  }

  // Add a single record to both MongoDB and Google Sheets
  async addRecord(type: 'teams' | 'candidates' | 'programmes' | 'results', data: any) {
    try {
      if (!this.db) await this.initializeClients();

      // Add to MongoDB first
      const collection = this.db.collection(type);
      const result = await collection.insertOne({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Sync to Google Sheets
      await this.syncToSheets(type);

      return { success: true, id: result.insertedId.toString() };
    } catch (error) {
      console.error(`Error adding ${type} record:`, error);
      throw error;
    }
  }

  // Update a record in both MongoDB and Google Sheets
  async updateRecord(type: 'teams' | 'candidates' | 'programmes' | 'results', id: string, data: any) {
    try {
      if (!this.db) await this.initializeClients();

      const collection = this.db.collection(type);
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            ...data, 
            updatedAt: new Date() 
          } 
        }
      );

      if (result.modifiedCount > 0) {
        // Update Google Sheets
        await this.syncToSheets(type);
        return { success: true };
      }

      return { success: false, error: 'Record not found' };
    } catch (error) {
      console.error(`Error updating ${type} record:`, error);
      throw error;
    }
  }

  // Delete a record from both MongoDB and Google Sheets
  async deleteRecord(type: 'teams' | 'candidates' | 'programmes' | 'results', id: string) {
    try {
      if (!this.db) await this.initializeClients();

      const collection = this.db.collection(type);
      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount > 0) {
        // Sync to Google Sheets (this will remove the deleted record)
        await this.syncToSheets(type);
        return { success: true };
      }

      return { success: false, error: 'Record not found' };
    } catch (error) {
      console.error(`Error deleting ${type} record:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const sheetsSync = new GoogleSheetsSync();