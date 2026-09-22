const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testRegistrationFix() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('festival-management');
    
    console.log('🧪 Testing Registration Fix...\n');
    
    // Get GEN001 programme (Quiz Competition - 3 participants)
    const quiz = await db.collection('programmes').findOne({ code: 'GEN001' });
    if (!quiz) {
      console.log('❌ GEN001 programme not found');
      return;
    }
    
    console.log('📋 GEN001 Programme Details:');
    console.log(`- Code: ${quiz.code}`);
    console.log(`- Name: ${quiz.name}`);
    console.log(`- Required Participants: ${quiz.requiredParticipants} (type: ${typeof quiz.requiredParticipants})`);
    
    // Test validation logic
    const selectedCount = 3;
    const requiredCount = quiz.requiredParticipants;
    
    console.log('\n🔍 Validation Tests:');
    console.log(`- Selected: ${selectedCount} (type: ${typeof selectedCount})`);
    console.log(`- Required: ${requiredCount} (type: ${typeof requiredCount})`);
    console.log(`- Direct comparison (===): ${selectedCount === requiredCount}`);
    console.log(`- With Number() conversion: ${selectedCount === Number(requiredCount)}`);
    console.log(`- Button should be enabled: ${selectedCount === Number(requiredCount) ? '✅ YES' : '❌ NO'}`);
    
    // Check team candidates
    const candidates = await db.collection('candidates').find({ team: 'SMD' }).toArray();
    console.log(`\n👥 SMD Team Candidates: ${candidates.length} found`);
    candidates.forEach(c => {
      console.log(`- ${c.chestNumber}: ${c.name} (${c.section})`);
    });
    
    console.log('\n✅ Fix should now work! Try registering again.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testRegistrationFix();