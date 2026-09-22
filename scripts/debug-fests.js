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
    
    const fests = await db.collection('fests').find().sort({ year: -1, createdAt: -1 }).toArray();
    console.log('Fests:', fests.map(f => ({ id: f._id.toString(), name: f.name })));
    
    if (fests.length > 1) {
      const prevFestId = fests[1]._id.toString(); // assuming index 0 is the newly created one
      console.log('Checking prevFestId:', prevFestId);
      
      const programmes = await db.collection('programmes').find({ festId: prevFestId }).count();
      console.log('Programmes count:', programmes);
      
      const candidates = await db.collection('candidates').find({ festId: prevFestId }).count();
      console.log('Candidates count:', candidates);
      
      const teams = await db.collection('teams').find({ festId: prevFestId }).count();
      console.log('Teams count:', teams);
    }
  } catch (error) {
    console.error('Failed', error);
  } finally {
    await client.close();
  }
}
debug();
