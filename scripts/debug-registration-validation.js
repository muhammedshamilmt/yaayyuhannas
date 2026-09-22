const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugRegistrationValidation() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('festival-management');
    
    console.log('🔍 Debugging Registration Validation Issue...\n');
    
    // Check programme data types
    const programmes = await db.collection('programmes').find({}).toArray();
    console.log('📋 Programme Data Analysis:');
    programmes.forEach(prog => {
      console.log(`- ${prog.code}: requiredParticipants = ${prog.requiredParticipants} (type: ${typeof prog.requiredParticipants})`);
    });
    
    console.log('\n🔧 Fixing requiredParticipants data types...');
    
    // Fix any string values to numbers
    const updateResult = await db.collection('programmes').updateMany(
      { requiredParticipants: { $type: "string" } },
      [{ $set: { requiredParticipants: { $toInt: "$requiredParticipants" } } }]
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} programmes with string requiredParticipants`);
    
    // Verify the fix
    const updatedProgrammes = await db.collection('programmes').find({}).toArray();
    console.log('\n✅ After Fix - Programme Data:');
    updatedProgrammes.forEach(prog => {
      console.log(`- ${prog.code}: requiredParticipants = ${prog.requiredParticipants} (type: ${typeof prog.requiredParticipants})`);
    });
    
    // Check specific programme P001
    const p001 = await db.collection('programmes').findOne({ code: 'P001' });
    if (p001) {
      console.log('\n🎯 P001 Programme Details:');
      console.log(`- Code: ${p001.code}`);
      console.log(`- Name: ${p001.name}`);
      console.log(`- Required Participants: ${p001.requiredParticipants} (type: ${typeof p001.requiredParticipants})`);
      console.log(`- Section: ${p001.section}`);
      console.log(`- Position Type: ${p001.positionType}`);
    }
    
    console.log('\n🧪 Testing Validation Logic:');
    const selectedCount = 3;
    const requiredCount = p001?.requiredParticipants || 3;
    
    console.log(`- Selected Count: ${selectedCount} (type: ${typeof selectedCount})`);
    console.log(`- Required Count: ${requiredCount} (type: ${typeof requiredCount})`);
    console.log(`- Strict Equality (===): ${selectedCount === requiredCount}`);
    console.log(`- Loose Equality (==): ${selectedCount == requiredCount}`);
    console.log(`- Number Conversion: ${Number(selectedCount) === Number(requiredCount)}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugRegistrationValidation();