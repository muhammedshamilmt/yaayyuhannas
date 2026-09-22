const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Please set MONGODB_URI in your environment or .env.local file");
  process.exit(1);
}

const DB_NAME = process.env.MONGODB_DB || 'wattaqa-festival-2k25';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");
    
    const db = client.db(DB_NAME);
    const programmesCollection = db.collection('programmes');
    const resultsCollection = db.collection('results');
    
    // Get all programmes to build a map of points
    const programmes = await programmesCollection.find({}).toArray();
    const programmePointsMap = {};
    
    for (const prog of programmes) {
      // Use string ID for mapping (could be _id or id)
      const progId = prog._id.toString();
      programmePointsMap[progId] = {
        firstPoints: prog.firstPoints ?? 10,
        secondPoints: prog.secondPoints ?? 8,
        thirdPoints: prog.thirdPoints ?? 6,
        participationPoints: prog.participationPoints ?? 0
      };
      
      // Also map by prog.id if it exists for backwards compatibility
      if (prog.id) {
        programmePointsMap[prog.id] = programmePointsMap[progId];
      }
    }
    
    // Now get all results
    const results = await resultsCollection.find({}).toArray();
    let updatedCount = 0;
    
    for (const result of results) {
      const progId = result.programmeId;
      const points = programmePointsMap[progId];
      
      if (points) {
        // Update the result with the programme's points
        await resultsCollection.updateOne(
          { _id: result._id },
          { 
            $set: { 
              firstPoints: points.firstPoints,
              secondPoints: points.secondPoints,
              thirdPoints: points.thirdPoints,
              participationPoints: points.participationPoints
            } 
          }
        );
        updatedCount++;
      }
    }
    
    console.log(`Successfully updated ${updatedCount} results to match their programme's points.`);
    
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await client.close();
  }
}

main();
