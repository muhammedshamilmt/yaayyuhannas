const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
  const candidates = await db.collection('candidates').find({}).toArray();
  console.log('Total candidates:', candidates.length);
  const unassigned = candidates.filter(c => !c.team || c.team === '');
  console.log('Unassigned candidates:', unassigned.length);
  if (candidates.length > 0) {
    console.log('Sample candidate:', JSON.stringify(candidates[0], null, 2));
  }
  await client.close();
}
run().catch(console.error);
