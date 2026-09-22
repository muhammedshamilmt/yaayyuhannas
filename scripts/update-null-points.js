// scripts/update-null-points.js
// Run this script using: node scripts/update-null-points.js

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' }); // Make sure to have dotenv installed or run with env vars

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Please set MONGODB_URI in your environment or .env.local file");
  process.exit(1);
}

const DB_NAME = process.env.MONGODB_DB || 'wattaqa-festival-2k25';

// Default points mapping based on the UI
const DEFAULT_POINTS = {
  firstPoints: 10,
  secondPoints: 8,
  thirdPoints: 6,
  participationPoints: 0
};

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");
    
    const db = client.db(DB_NAME);
    
    // 1. Update Programmes with null points
    const programmesCollection = db.collection('programmes');
    const programmesUpdateResult = await programmesCollection.updateMany(
      { 
        $or: [
          { firstPoints: null }, 
          { secondPoints: null }, 
          { thirdPoints: null },
          { firstPoints: { $exists: false } }
        ] 
      },
      { 
        $set: { 
          firstPoints: DEFAULT_POINTS.firstPoints,
          secondPoints: DEFAULT_POINTS.secondPoints,
          thirdPoints: DEFAULT_POINTS.thirdPoints,
          participationPoints: DEFAULT_POINTS.participationPoints
        } 
      }
    );
    console.log(`Updated ${programmesUpdateResult.modifiedCount} programmes with default points.`);

    // 2. Update Results with null points
    const resultsCollection = db.collection('results');
    const resultsUpdateResult = await resultsCollection.updateMany(
      { 
        $or: [
          { firstPoints: null }, 
          { secondPoints: null }, 
          { thirdPoints: null },
          { firstPoints: { $exists: false } }
        ] 
      },
      { 
        $set: { 
          firstPoints: DEFAULT_POINTS.firstPoints,
          secondPoints: DEFAULT_POINTS.secondPoints,
          thirdPoints: DEFAULT_POINTS.thirdPoints,
          participationPoints: DEFAULT_POINTS.participationPoints
        } 
      }
    );
    console.log(`Updated ${resultsUpdateResult.modifiedCount} results with default points.`);

    // 3. Update Candidates with null points
    const candidatesCollection = db.collection('candidates');
    const candidatesUpdateResult = await candidatesCollection.updateMany(
      { 
        $or: [
          { points: null },
          { points: { $exists: false } }
        ] 
      },
      { $set: { points: 0 } }
    );
    console.log(`Updated ${candidatesUpdateResult.modifiedCount} candidates with 0 points.`);

    // 4. Update Teams with null points
    const teamsCollection = db.collection('teams');
    const teamsUpdateResult = await teamsCollection.updateMany(
      { 
        $or: [
          { points: null },
          { points: { $exists: false } }
        ] 
      },
      { $set: { points: 0 } }
    );
    console.log(`Updated ${teamsUpdateResult.modifiedCount} teams with 0 points.`);

    console.log("Finished updating null points in the database.");
  } catch (error) {
    console.error("An error occurred while updating the database:", error);
  } finally {
    await client.close();
  }
}

main();
