const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugDatabaseConnection() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔍 Debugging Database Connection...\n');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    console.log('\n📊 Available databases:');
    databases.databases.forEach(db => {
      console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Check festival-management database
    const db = client.db('festival-management');
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections in festival-management:');
    
    if (collections.length === 0) {
      console.log('❌ No collections found in festival-management database');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`- ${collection.name}: ${count} documents`);
      }
    }
    
    // Try to add a test programme
    console.log('\n🧪 Testing programme insertion...');
    const testProgramme = {
      code: 'TEST001',
      name: 'Test Programme',
      category: 'general',
      section: 'general',
      positionType: 'individual',
      requiredParticipants: 3,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('programmes').insertOne(testProgramme);
    console.log('✅ Test programme inserted with ID:', result.insertedId);
    
    // Verify it was inserted
    const inserted = await db.collection('programmes').findOne({ code: 'TEST001' });
    if (inserted) {
      console.log('✅ Test programme found in database');
      console.log('- Required participants:', inserted.requiredParticipants, typeof inserted.requiredParticipants);
      
      // Clean up
      await db.collection('programmes').deleteOne({ code: 'TEST001' });
      console.log('🧹 Test programme cleaned up');
    } else {
      console.log('❌ Test programme not found after insertion');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugDatabaseConnection();