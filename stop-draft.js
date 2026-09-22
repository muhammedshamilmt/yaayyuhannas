const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
async function stopDraft() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
  await db.collection('draft_state').updateOne({}, { $set: { status: 'stopped' } });
  console.log('Draft stopped');
  await client.close();
}
stopDraft();
