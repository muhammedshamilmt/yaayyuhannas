const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkAllDatabases() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔍 Checking All Databases...\n');
    
    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    
    for (const database of databases.databases) {
      if (database.name === 'admin' || database.name === 'local') continue;
      
      console.log(`📊 Database: ${database.name}`);
      const db = client.db(database.name);
      const collections = await db.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log('  ❌ No collections');
      } else {
        for (const collection of collections) {
          const count = await db.collection(collection.name).countDocuments();
          console.log(`  - ${collection.name}: ${count} documents`);
          
          // If it's programmes, show a sample
          if (collection.name === 'programmes' && count > 0) {
            const sample = await db.collection(collection.name).findOne();
            console.log(`    Sample: ${sample.code} - ${sample.name} (${sample.requiredParticipants} participants)`);
          }
          
          // If it's candidates, show team breakdown
          if (collection.name === 'candidates' && count > 0) {
            const teams = await db.collection(collection.name).distinct('team');
            console.log(`    Teams: ${teams.join(', ')}`);
          }
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkAllDatabases();