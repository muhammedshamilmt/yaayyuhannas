const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db();
    const candidatesCollection = db.collection('candidates');

    const rawData = [
      "152 Muhammed Anas K",
      "153 Muhammed Nahash KS",
      "217 Muhammed Afeef",
      "218 Muhammed Ali Ja'far VK",
      "219 Abdul Qadar",
      "220 Muhammed Ziyan CM",
      "221 Muahmmed Thanseer K",
      "222 Yousaf Raza Abdulla",
      "223 Muhammed Misbah VK",
      "224 Rishan Muhammed Saee",
      "225 Muhammed Saeed M",
      "226 Muhammad Fazal NT",
      "227 Muhammed Farzeen T",
      "228 Muhammed Sinan TK",
      "230 Sayyid Muhammed Mis'a",
      "231 Muhammed Adil CM",
      "261 Abdul Basith KP"
    ];

    const newCandidates = rawData.map(line => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (match) {
        return {
          chestNumber: match[1],
          name: match[2].trim(),
          section: 'junior',
          team: '',
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      return null;
    }).filter(c => c !== null);

    console.log(`Inserting ${newCandidates.length} candidates...`);
    
    for (const candidate of newCandidates) {
      // Check if exists
      const existing = await candidatesCollection.findOne({ chestNumber: candidate.chestNumber });
      if (!existing) {
        await candidatesCollection.insertOne(candidate);
        console.log(`Added: ${candidate.chestNumber} - ${candidate.name}`);
      } else {
        console.log(`Skipped (already exists): ${candidate.chestNumber} - ${candidate.name}`);
      }
    }

    console.log('Done!');
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
