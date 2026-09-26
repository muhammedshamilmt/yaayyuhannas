const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    const candidatesCollection = db.collection('candidates');

    console.log(`Assigning chest numbers...`);

    // 0. Clear all chest numbers first so we have a clean slate
    await candidatesCollection.updateMany({}, { $set: { chestNumber: '', updatedAt: new Date() } });

    // 1. Pre-assign specific chest numbers
    const preAssigned = [
      { name: "Muhammed eyas", chestNumber: "402", team: "ADL" },
      { name: "M.hisham EM", chestNumber: "401", team: "ADL" },
      { name: "M.Sahal Kt", chestNumber: "403", team: "ADL" },
      { name: "M.Anshid kp", chestNumber: "603", team: "SHJ" },
      { name: "Muneer tc", chestNumber: "602", team: "SHJ" },
      { name: "faseeh A", chestNumber: "601", team: "SHJ" },
      { name: "Shafeer KR", chestNumber: "203", team: "QIY" },
      { name: "Yaseen T", chestNumber: "202", team: "QIY" },
      { name: "Anshif p", chestNumber: "201", team: "QIY" }
    ];

    for (const p of preAssigned) {
      // Find candidate by case-insensitive name
      const res = await candidatesCollection.updateOne(
        { name: new RegExp('^' + p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
        { $set: { chestNumber: p.chestNumber, team: p.team, updatedAt: new Date() } }
      );
      if (res.matchedCount > 0) {
        console.log(`Pre-assigned ${p.chestNumber} to ${p.name}`);
      } else {
        console.log(`Failed to pre-assign to ${p.name} (not found in DB)`);
      }
    }

    // 2. Assign remaining for each team, ordered by section
    const teamsConfig = [
      { code: 'QIY', currentNumber: 204 },
      { code: 'ADL', currentNumber: 404 },
      { code: 'SHJ', currentNumber: 604 }
    ];
    
    const sectionOrder = { 'senior': 1, 'junior': 2, 'sub-junior': 3 };

    for (const config of teamsConfig) {
      // Find candidates in this team that don't have a chest number or it's empty
      const candidates = await candidatesCollection.find({
        team: config.code,
        $or: [{ chestNumber: '' }, { chestNumber: { $exists: false } }, { chestNumber: null }]
      }).toArray();

      // Sort candidates by section
      candidates.sort((a, b) => {
        const orderA = sectionOrder[a.section] || 99;
        const orderB = sectionOrder[b.section] || 99;
        return orderA - orderB;
      });

      console.log(`Assigning ${candidates.length} numbers for team ${config.code} starting from ${config.currentNumber}...`);

      for (const candidate of candidates) {
        await candidatesCollection.updateOne(
          { _id: candidate._id },
          { $set: { chestNumber: config.currentNumber.toString(), updatedAt: new Date() } }
        );
        console.log(`Assigned ${config.currentNumber} to ${candidate.name} (${candidate.section})`);
        config.currentNumber++;
      }
    }

    console.log('Done!');
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
