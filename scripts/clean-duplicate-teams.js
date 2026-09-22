const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanTeams() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('Fetching all teams...');
    const teams = await db.collection('teams').find({}).toArray();
    
    const keepIds = [];
    const deleteIds = [];
    const seenCodes = new Set();
    
    for (const team of teams) {
      if (!seenCodes.has(team.code)) {
        seenCodes.add(team.code);
        keepIds.push(team._id);
        console.log(`Keeping team: ${team.code} (${team.name})`);
      } else {
        deleteIds.push(team._id);
      }
    }
    
    if (deleteIds.length > 0) {
      console.log(`Deleting ${deleteIds.length} duplicate teams...`);
      const result = await db.collection('teams').deleteMany({ _id: { $in: deleteIds } });
      console.log(`Deleted ${result.deletedCount} teams.`);
    } else {
      console.log('No duplicate teams found.');
    }
    
    // Check total distinct teams
    const remainingTeams = await db.collection('teams').find({}).toArray();
    console.log('Remaining Teams:', remainingTeams.map(t => t.code));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

cleanTeams();
