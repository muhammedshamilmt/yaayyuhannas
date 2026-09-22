const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function resetDraft() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log("Resetting draft state...");
    await db.collection('draft_state').deleteMany({});
    
    console.log("Removing team assignments from all candidates...");
    const candidatesResult = await db.collection('candidates').updateMany(
      {},
      { $unset: { team: "" } }
    );
    console.log(`Updated ${candidatesResult.modifiedCount} candidates.`);
    
    console.log("Resetting team stats to 0...");
    const teamsResult = await db.collection('teams').updateMany(
      {},
      { $set: { members: 0, points: 0 } }
    );
    console.log(`Updated ${teamsResult.modifiedCount} teams.`);
    
    console.log("Draft reset completely successfully!");
  } catch (error) {
    console.error("Error resetting draft:", error);
  } finally {
    await client.close();
  }
}

resetDraft();
