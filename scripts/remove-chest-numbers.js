const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    const candidatesCollection = db.collection('candidates');

    console.log(`Removing chest numbers from all candidates...`);
    
    const result = await candidatesCollection.updateMany(
      {}, // Match all candidates
      { 
        $set: { 
          chestNumber: '',
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} candidates (cleared chest numbers).`);
    console.log('Done!');
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
