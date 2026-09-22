const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugResultsIssue() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    console.log('🔍 Debugging Results Issue...\n');
    
    // Check all programmes
    const programmes = await db.collection('programmes').find({}).toArray();
    console.log(`📋 Total programmes: ${programmes.length}`);
    
    programmes.forEach((prog, index) => {
      console.log(`${index + 1}. ${prog.code} - ${prog.name} (${prog.section})`);
    });
    
    // Check all results
    const results = await db.collection('results').find({}).toArray();
    console.log(`\n🏆 Total results: ${results.length}`);
    
    if (results.length > 0) {
      results.forEach((result, index) => {
        console.log(`${index + 1}. Programme: ${result.programme}`);
        console.log(`   Section: ${result.section}`);
        console.log(`   Position Type: ${result.positionType}`);
        console.log(`   First Place: ${result.firstPlace?.map(p => p.chestNumber).join(', ') || 'None'}`);
        console.log(`   Second Place: ${result.secondPlace?.map(p => p.chestNumber).join(', ') || 'None'}`);
        console.log(`   Third Place: ${result.thirdPlace?.map(p => p.chestNumber).join(', ') || 'None'}`);
        console.log(`   Created: ${result.createdAt}`);
        console.log('');
      });
      
      // Check which programmes have results
      const programmesWithResults = [...new Set(results.map(r => r.programme))];
      console.log(`📊 Programmes with results: ${programmesWithResults.length}`);
      programmesWithResults.forEach(progName => {
        console.log(`   - ${progName}`);
      });
      
      // Check which programmes don't have results
      const programmeNames = programmes.map(p => `${p.code} - ${p.name}`);
      const programmesWithoutResults = programmeNames.filter(name => !programmesWithResults.includes(name));
      console.log(`\n📊 Programmes without results: ${programmesWithoutResults.length}`);
      programmesWithoutResults.forEach(progName => {
        console.log(`   - ${progName}`);
      });
      
    } else {
      console.log('   No results found in database');
    }
    
    // Test if we can add a result for a programme that already has results
    if (results.length > 0) {
      const existingResult = results[0];
      console.log(`\n🧪 Testing duplicate result addition for: ${existingResult.programme}`);
      console.log('   The system should allow this unless there\'s frontend validation');
      console.log('   If you\'re seeing "not allowed" message, it\'s likely from the frontend UI');
    }
    
    console.log('\n💡 Possible reasons for "not allowed" message:');
    console.log('1. Frontend UI hiding programmes that already have results');
    console.log('2. Frontend validation preventing duplicate submissions');
    console.log('3. Custom business logic in the admin interface');
    console.log('4. The programme dropdown is filtered to exclude completed programmes');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugResultsIssue();