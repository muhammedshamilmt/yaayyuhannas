const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
  const draftState = await db.collection('draft_state').findOne({});
  console.log('Draft State:', JSON.stringify(draftState, null, 2));
  await client.close();
}
run().catch(console.error);
