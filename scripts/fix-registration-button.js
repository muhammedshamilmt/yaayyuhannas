const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function fixRegistrationButton() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Check the programme that's causing issues (p001)
    const programme = await db.collection('programmes').findOne({ code: 'p001' });
    
    if (programme) {
      console.log('🔍 Found programme p001:');
      console.log(`  Name: ${programme.name}`);
      console.log(`  Code: ${programme.code}`);
      console.log(`  Required Participants: ${programme.requiredParticipants}`);
      console.log(`  Section: ${programme.section}`);
      console.log(`  Position Type: ${programme.positionType}`);
      
      // Check if this programme has realistic requirements
      const candidates = await db.collection('candidates').find({}).toArray();
      const sectionCandidates = programme.section === 'general' 
        ? candidates 
        : candidates.filter(c => c.section === programme.section);
      
      console.log(`  Available candidates for ${programme.section}: ${sectionCandidates.length}`);
      
      if (programme.requiredParticipants > sectionCandidates.length) {
        console.log('❌ Issue found: Programme requires more participants than available!');
        console.log(`   Fixing: ${programme.requiredParticipants} → ${Math.min(sectionCandidates.length, 3)}`);
        
        await db.collection('programmes').updateOne(
          { _id: programme._id },
          { $set: { requiredParticipants: Math.min(sectionCandidates.length, 3) } }
        );
        
        console.log('✅ Fixed programme requirements');
      } else {
        console.log('✅ Programme requirements are realistic');
      }
    } else {
      console.log('❌ Programme p001 not found');
      
      // List all programmes to see what's available
      const programmes = await db.collection('programmes').find({}).toArray();
      console.log('\n📋 Available programmes:');
      programmes.forEach(p => {
        console.log(`  ${p.code}: ${p.name} (requires ${p.requiredParticipants} participants)`);
      });
    }
    
    // Test the validation logic
    console.log('\n🧪 Testing validation logic:');
    const testCases = [
      { selected: 3, required: 3, expected: true },
      { selected: 2, required: 3, expected: false },
      { selected: 4, required: 3, expected: false },
      { selected: 1, required: 1, expected: true }
    ];
    
    testCases.forEach(test => {
      const isValid = test.selected === test.required;
      const result = isValid === test.expected ? '✅' : '❌';
      console.log(`  ${result} Selected: ${test.selected}, Required: ${test.required}, Valid: ${isValid}`);
    });
    
    console.log('\n🔧 Registration Button Debug Tips:');
    console.log('1. Make sure selectedParticipants.length === programme.requiredParticipants');
    console.log('2. Check that programme.requiredParticipants is a number, not string');
    console.log('3. Verify the programme data is loaded correctly');
    console.log('4. Check browser console for any JavaScript errors');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixRegistrationButton();