const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');

    console.log('Connected to DB');

    // 1. Create a default fest
    const festData = {
      name: 'Wattaqa Arts Fest 2k25',
      year: 2025,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const festsCollection = db.collection('fests');
    
    // Check if fest already exists
    let defaultFest = await festsCollection.findOne({ year: 2025 });
    
    if (!defaultFest) {
      console.log('Creating default Fest...');
      const result = await festsCollection.insertOne(festData);
      defaultFest = { _id: result.insertedId, ...festData };
    } else {
      console.log('Default fest already exists:', defaultFest._id);
    }

    const festId = defaultFest._id.toString();

    // 2. Update collections to link to this festId
    const collectionsToUpdate = ['candidates', 'programmes', 'teams', 'results'];

    for (const collName of collectionsToUpdate) {
      console.log(`Updating ${collName}...`);
      const collection = db.collection(collName);
      
      const result = await collection.updateMany(
        { festId: { $exists: false } }, // only update those without a festId
        { $set: { festId: festId } }
      );
      
      console.log(`Updated ${result.modifiedCount} documents in ${collName}.`);
    }

    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrate();
