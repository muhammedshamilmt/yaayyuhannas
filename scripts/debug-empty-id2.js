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
    
    for (const col of ['candidates', 'teams', 'results', 'fests']) {
      const items = await db.collection(col).find({ _id: "" }).toArray();
      console.log(`${col} with empty _id:`, items.length);
      if (items.length > 0) {
        console.log(`Deleting ${items.length} items from ${col}...`);
        await db.collection(col).deleteMany({ _id: "" });
        console.log(`Deleted from ${col}`);
      }
    }
  } catch (error) {
    console.error('Failed', error);
  } finally {
    await client.close();
  }
}
debug();
