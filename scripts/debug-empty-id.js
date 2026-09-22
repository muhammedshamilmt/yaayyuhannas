const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function debug() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    const programmes = await db.collection('programmes').find({ _id: "" }).toArray();
    console.log('Programmes with empty _id:', programmes.length);
    if (programmes.length > 0) {
      console.log('Deleting them...');
      await db.collection('programmes').deleteMany({ _id: "" });
      console.log('Deleted');
    }
  } catch (error) {
    console.error('Failed', error);
  } finally {
    await client.close();
  }
}
debug();
