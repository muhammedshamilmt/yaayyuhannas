const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Connection URL
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = process.env.MONGODB_DB || 'wattaqa-festival-2k25';

async function main() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('programmes');

    // 1. Delete existing programmes
    console.log('Deleting existing programmes...');
    const deleteResult = await collection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing programmes.`);

    // 2. Read programmes from backup
    const backupPath = path.join(process.cwd(), 'full-backup-1789801234258.json');
    console.log(`Reading backup file from ${backupPath}...`);
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    if (!backupData.programmes || backupData.programmes.length === 0) {
      console.log('No programmes found in backup data.');
      return;
    }

    console.log(`Found ${backupData.programmes.length} programmes in backup.`);

    // Convert _id strings to ObjectIds for MongoDB, and fix dates if needed
    const programmesToInsert = backupData.programmes.map(p => {
        const { _id, festId, ...rest } = p;
        const mapped = {
            ...rest
        };
        if (_id && typeof _id === 'string' && _id.length === 24) {
            mapped._id = new ObjectId(_id);
        } else {
            mapped._id = new ObjectId();
        }
        
        if (p.createdAt) mapped.createdAt = new Date(p.createdAt);
        if (p.updatedAt) mapped.updatedAt = new Date(p.updatedAt);
        if (festId) {
            // Keep it as ObjectId if valid, otherwise string
            try {
                mapped.festId = new ObjectId(festId);
            } catch (e) {
                mapped.festId = festId;
            }
        }
        return mapped;
    });

    // 3. Insert programmes
    console.log('Inserting programmes from backup...');
    const insertResult = await collection.insertMany(programmesToInsert);
    console.log(`Successfully inserted ${insertResult.insertedCount} programmes.`);

  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    // Close the connection
    await client.close();
  }
}

main();
