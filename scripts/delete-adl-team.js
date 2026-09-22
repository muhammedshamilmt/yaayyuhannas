const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function deleteAdlTeam() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('Deleting ADL team...');
    const result = await db.collection('teams').deleteMany({ code: 'ADL' });
    console.log(`Deleted ${result.deletedCount} teams with code ADL.`);
    
    // Check total distinct teams
    const remainingTeams = await db.collection('teams').find({}).toArray();
    console.log('Remaining Teams:', remainingTeams.map(t => t.code));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

deleteAdlTeam();
