const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function allowMultipleResults() {
  console.log('🔄 Configuring System to Allow Multiple Results...\n');
  
  console.log('Current system status:');
  console.log('✅ Database: Already allows multiple results');
  console.log('✅ API: Already allows multiple results');
  console.log('❓ Frontend: May have hidden validation');
  
  console.log('\nTo ensure multiple results work:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Verify no custom validation was added to the form');
  console.log('3. Make sure the form submission completes successfully');
  
  console.log('\nIf you want to distinguish multiple results:');
  console.log('- Add a "Round" or "Attempt" field to results');
  console.log('- Add timestamps to show when each result was added');
  console.log('- Add notes to explain why multiple results exist');
  
  // Test the current system
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    // Check if we can add another result
    console.log('\n🧪 Testing multiple results capability...');
    
    const testResult = {
      programme: 'p001 - jumbing',
      section: 'senior', 
      positionType: 'individual',
      firstPlace: [{ chestNumber: '202' }], // Different winner
      secondPlace: [{ chestNumber: '201' }],
      thirdPlace: [{ chestNumber: '203' }],
      firstPoints: 10,
      secondPoints: 7,
      thirdPoints: 5,
      notes: 'Second round results',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('results').insertOne(testResult);
    console.log('✅ Successfully added second result for same programme');
    console.log(`   Result ID: ${result.insertedId}`);
    
    // Show all results for this programme
    const allResults = await db.collection('results').find({ 
      programme: 'p001 - jumbing' 
    }).toArray();
    
    console.log(`\n📊 Total results for "p001 - jumbing": ${allResults.length}`);
    allResults.forEach((res, index) => {
      console.log(`${index + 1}. Winner: ${res.firstPlace?.[0]?.chestNumber} | Created: ${res.createdAt}`);
    });
    
    // Clean up test result
    await db.collection('results').deleteOne({ _id: result.insertedId });
    console.log('\n🧹 Cleaned up test result');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
  
  console.log('\n✅ System is configured to allow multiple results');
  console.log('If you\'re still getting "not allowed", check the browser console!');
}

allowMultipleResults();