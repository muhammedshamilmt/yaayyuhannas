const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function clearTeams() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('Clearing team assignments for all candidates...');
    const result = await db.collection('candidates').updateMany(
      {}, 
      { $set: { team: "" } }
    );
    
    console.log(`Successfully cleared teams for ${result.modifiedCount} candidates!`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

clearTeams();
