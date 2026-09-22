import { NextResponse } from 'next/server';
import { sheetsSync } from '@/lib/sheetsSync';

// Sync all data from MongoDB to Google Sheets
export async function POST(request: Request) {
  try {
    const { action, type } = await request.json();

    if (action === 'sync-to-sheets') {
      // Sync data TO Google Sheets
      if (type && ['teams', 'candidates', 'programmes', 'results'].includes(type)) {
        const result = await sheetsSync.syncToSheets(type as any);
        return NextResponse.json({
          success: true,
          message: `Successfully synced ${result.count} ${type} records to Google Sheets`,
          result
        });
      }

      // Sync all types
      if (!type || type === 'all') {
        const types = ['teams', 'candidates', 'programmes', 'results'];
        const results = [];
        let totalCount = 0;

        for (let i = 0; i < types.length; i++) {
          const syncType = types[i];
          try {
            const result = await sheetsSync.syncToSheets(syncType as any);
            results.push(result);
            totalCount += result.count;

            // Add delay between syncs to avoid rate limits
            if (i < types.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error(`Error syncing ${syncType}:`, error);
            results.push({ count: 0, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }

        return NextResponse.json({
          success: true,
          message: `Successfully synced ${totalCount} total records to Google Sheets`,
          results
        });
      }

      return NextResponse.json({
        success: false,
        error: `Invalid type: ${type}. Supported types: teams, candidates, programmes, results, all`
      });
    }

    if (action === 'sync-from-sheets') {
      // Sync data FROM Google Sheets
      if (type && ['teams', 'candidates', 'programmes', 'results'].includes(type)) {
        const result = await sheetsSync.syncFromSheets(type as any);
        return NextResponse.json({
          success: true,
          message: `Successfully synced ${type} from Google Sheets: ${result.inserted} inserted, ${result.updated} updated`,
          result
        });
      }

      // Sync all types
      if (!type || type === 'all') {
        const types = ['teams', 'candidates', 'programmes', 'results'];
        const results = [];
        let totalInserted = 0;
        let totalUpdated = 0;

        for (let i = 0; i < types.length; i++) {
          const syncType = types[i];
          try {
            const result = await sheetsSync.syncFromSheets(syncType as any);
            results.push(result);
            totalInserted += result.inserted;
            totalUpdated += result.updated;

            // Add delay between syncs to avoid rate limits
            if (i < types.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error(`Error syncing ${syncType} from sheets:`, error);
            results.push({ inserted: 0, updated: 0, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }

        return NextResponse.json({
          success: true,
          message: `Successfully synced from Google Sheets: ${totalInserted} inserted, ${totalUpdated} updated`,
          results
        });
      }

      return NextResponse.json({
        success: false,
        error: `Invalid type: ${type}. Supported types: teams, candidates, programmes, results, all`
      });
    }

    return NextResponse.json({
      success: false,
      error: `Invalid action: ${action}. Supported actions: sync-to-sheets, sync-from-sheets`
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Get sync status and available options
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Google Sheets sync API is ready',
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      availableTypes: ['teams', 'candidates', 'programmes', 'results'],
      syncActions: ['sync-to-sheets', 'sync-from-sheets']
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}