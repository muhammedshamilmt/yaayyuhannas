const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function fixProgrammes() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('festival');
    const collection = db.collection('programmes');

    // Get all programmes
    const programmes = await collection.find({}).toArray();
    console.log(`Found ${programmes.length} programmes`);

    // Display current programmes
    programmes.forEach(p => {
      console.log(`${p.code}: ${p.name}`);
      console.log(`  Category: ${p.category}`);
      console.log(`  Subcategory: ${p.subcategory || 'NOT SET'}`);
      console.log(`  Section: ${p.section}`);
      console.log(`  Required Participants: ${p.requiredParticipants || 'NOT SET'}`);
      console.log('---');
    });

    // Fix programmes that are missing subcategory or requiredParticipants
    let fixedCount = 0;
    
    for (const programme of programmes) {
      const updates = {};
      
      // Fix missing requiredParticipants
      if (!programme.requiredParticipants) {
        updates.requiredParticipants = 1; // Default to 1
      }
      
      // Fix missing subcategory for arts programmes
      if (programme.category === 'arts' && !programme.subcategory) {
        // Default arts programmes to 'stage' if not specified
        updates.subcategory = 'stage';
      }
      
      if (Object.keys(updates).length > 0) {
        await collection.updateOne(
          { _id: programme._id },
          { $set: updates }
        );
        fixedCount++;
        console.log(`Fixed programme ${programme.code}:`, updates);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} programmes`);
    console.log('All programmes should now display properly in the team admin portal');

  } catch (error) {
    console.error('Error fixing programmes:', error);
  } finally {
    await client.close();
  }
}

fixProgrammes();