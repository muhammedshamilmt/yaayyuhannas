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
      "Muhammed Anshif P",
      "Sayyid Muhammed Rayyan",
      "Muhammed Sinan PP",
      "Irfan VV",
      "Thazeem Muhammed",
      "Sabith",
      "Khalid Vajeehudheen",
      "Rayyan AM",
      "Rushd",
      "Mishab PT",
      "Rayyan Hameed",
      "Muhammed Riyan",
      "Muhammed Nafi",
      "Muhammed Farhan",
      "Muhammed Ishan NP",
      "Muhammed Rayan P",
      "Muhammed Swalih",
      "Muhammed Hafiz",
      "Rabeeh P",
      "Haneen",
      "Ishan KP",
      "Muhammed Ajsal",
      "Eesa Mubashir",
      "Saheed PC",
      "Muhammed Fahim",
      "Abdulla K",
      "Muhammed Alan Ashik",
      "Yaseen Mahmood"
    ];

    console.log(`Deleting ${rawData.length} candidates...`);
    
    for (const name of rawData) {
      const cleanName = name.trim();
      const result = await candidatesCollection.deleteMany({ name: cleanName });
      console.log(`Deleted ${result.deletedCount} instances of: ${cleanName}`);
    }

    console.log('Done!');
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
