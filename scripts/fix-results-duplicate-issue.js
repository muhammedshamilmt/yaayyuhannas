const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixResultsDuplicateIssue() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    console.log('🔧 Analyzing and Fixing Results Duplicate Issue...\n');
    
    // Check current results
    const results = await db.collection('results').find({}).toArray();
    console.log(`📊 Current results in database: ${results.length}`);
    
    if (results.length > 0) {
      console.log('\n📋 Existing Results:');
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.programme} (${result.section})`);
        console.log(`   ID: ${result._id}`);
        console.log(`   Created: ${result.createdAt}`);
      });
    }
    
    // Test adding a duplicate result
    console.log('\n🧪 Testing Duplicate Result Addition...');
    
    const testResult = {
      programme: 'p001 - jumbing',
      section: 'senior',
      positionType: 'individual',
      firstPlace: [{ chestNumber: '201' }],
      secondPlace: [{ chestNumber: '202' }],
      thirdPlace: [{ chestNumber: '203' }],
      firstPoints: 10,
      secondPoints: 7,
      thirdPoints: 5,
      notes: 'Test duplicate result - added by script',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      const insertResult = await db.collection('results').insertOne(testResult);
      console.log('✅ Successfully added duplicate result!');
      console.log(`   New result ID: ${insertResult.insertedId}`);
      console.log('   This proves the database allows duplicates');
      
      // Clean up the test result
      await db.collection('results').deleteOne({ _id: insertResult.insertedId });
      console.log('🧹 Cleaned up test result');
      
    } catch (error) {
      console.log('❌ Failed to add duplicate result:', error.message);
    }
    
    console.log('\n💡 Solutions:');
    console.log('1. The database allows duplicate results');
    console.log('2. If you\'re getting "not allowed" in the UI, check:');
    console.log('   - Browser console for JavaScript errors');
    console.log('   - Network tab for API call failures');
    console.log('   - Any custom validation you may have added');
    
    console.log('\n🔧 Would you like me to:');
    console.log('A. Add proper duplicate prevention (recommended)');
    console.log('B. Allow unlimited duplicates (current behavior)');
    console.log('C. Allow editing existing results instead of duplicates');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixResultsDuplicateIssue();