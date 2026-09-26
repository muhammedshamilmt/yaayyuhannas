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

    for (const p of programmes) {
      const key = `${p.name.trim().toLowerCase()}|${p.section}`;
      if (seen.has(key)) {
        seen.get(key).push(p);
      } else {
        seen.set(key, [p]);
      }
    }

    let duplicateGroupsFound = 0;

    for (const [key, list] of seen.entries()) {
      if (list.length > 1) {
        duplicateGroupsFound++;
        console.log(`\nDuplicate Group ${duplicateGroupsFound}: "${list[0].name}" in section "${list[0].section}" (${list.length} entries)`);
        list.forEach(p => {
          console.log(`  - ID: ${p._id}, Code: ${p.code}, Name: "${p.name}", Section: ${p.section}`);
        });
      }
    }

    if (duplicateGroupsFound === 0) {
      console.log('\nNo duplicates found!');
    } else {
      console.log(`\nFound ${duplicateGroupsFound} groups of duplicates.`);
    }

  } finally {
    await client.close();
  }
}

run().catch(console.dir);
