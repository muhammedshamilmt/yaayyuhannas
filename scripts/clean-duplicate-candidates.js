const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanCandidates() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('Fetching all candidates to find duplicates...');
    const candidates = await db.collection('candidates').find({}).toArray();
    
    const keepIds = [];
    const deleteIds = [];
    const seenChestNumbers = new Map();
    
    for (const c of candidates) {
      if (!c.chestNumber) continue;
      
      if (!seenChestNumbers.has(c.chestNumber)) {
        // First time seeing this candidate
        seenChestNumbers.set(c.chestNumber, c);
        keepIds.push(c._id);
      } else {
        // Duplicate found
        const existing = seenChestNumbers.get(c.chestNumber);
        
        // If the new one has a team but the existing one doesn't, swap them!
        if (c.team && !existing.team) {
           deleteIds.push(existing._id); // Delete the old one
           seenChestNumbers.set(c.chestNumber, c); // Keep the new one
           keepIds.push(c._id); // We'll keep this one
           
           // Remove the old one from keepIds
           const index = keepIds.indexOf(existing._id);
           if (index > -1) {
             keepIds.splice(index, 1);
           }
        } else {
           // Otherwise, just delete the new duplicate
           deleteIds.push(c._id);
        }
      }
    }
    
    if (deleteIds.length > 0) {
      console.log(`Deleting ${deleteIds.length} duplicate candidates...`);
      const result = await db.collection('candidates').deleteMany({ _id: { $in: deleteIds } });
      console.log(`Successfully deleted ${result.deletedCount} duplicate candidates.`);
    } else {
      console.log('No duplicate candidates found.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

cleanCandidates();
