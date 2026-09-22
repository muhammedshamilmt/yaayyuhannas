const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function resetTeamStats() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('Resetting members and points for all teams to 0...');
    
    const result = await db.collection('teams').updateMany(
      {},
      { 
        $set: { 
          members: 0,
          points: 0 
        } 
      }
    );
    
    console.log(`Successfully reset stats for ${result.modifiedCount} teams.`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

resetTeamStats();
