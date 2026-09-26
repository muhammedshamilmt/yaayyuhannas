const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    const programmesCollection = db.collection('programmes');

    const programmes = await programmesCollection.find({}).toArray();

    const seen = new Map();

    // Group by code and section to find duplicates
    for (const p of programmes) {
      if (!p.code) continue; // Skip if no code
      const key = `${p.code.trim().toLowerCase()}|${p.section}`;
      if (seen.has(key)) {
        seen.get(key).push(p);
      } else {
        seen.set(key, [p]);
      }
    }

    let deletedCount = 0;

    for (const [key, list] of seen.entries()) {
      if (list.length > 1) {
        // Keep the first entry, delete all subsequent ones in the group
        const toDelete = list.slice(1);
        for (const p of toDelete) {
          await programmesCollection.deleteOne({ _id: p._id });
          deletedCount++;
          console.log(`Deleted duplicate: "${p.name}" (Code: ${p.code}, Section: ${p.section})`);
        }
      }
    }

    if (deletedCount === 0) {
      console.log('\nNo duplicates with the same code and section found to delete.');
    } else {
      console.log(`\nSuccessfully deleted ${deletedCount} duplicate programmes.`);
    }

  } finally {
    await client.close();
  }
}

run().catch(console.dir);
