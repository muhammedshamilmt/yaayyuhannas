const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkProgrammes() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('festival-management');
    
    console.log('📋 All Programmes in Database:\n');
    
    const programmes = await db.collection('programmes').find({}).toArray();
    
    if (programmes.length === 0) {
      console.log('❌ No programmes found in database');
      return;
    }
    
    programmes.forEach((prog, index) => {
      console.log(`${index + 1}. ${prog.code} - ${prog.name}`);
      console.log(`   Section: ${prog.section}, Type: ${prog.positionType}`);
      console.log(`   Required Participants: ${prog.requiredParticipants} (type: ${typeof prog.requiredParticipants})`);
      console.log(`   Category: ${prog.category}${prog.subcategory ? ` (${prog.subcategory})` : ''}`);
      console.log('');
    });
    
    // Check for jumping programme specifically
    const jumpingProg = programmes.find(p => p.name.toLowerCase().includes('jump'));
    if (jumpingProg) {
      console.log('🏃 Found jumping programme:');
      console.log(`- Code: ${jumpingProg.code}`);
      console.log(`- Name: ${jumpingProg.name}`);
      console.log(`- Required: ${jumpingProg.requiredParticipants} (type: ${typeof jumpingProg.requiredParticipants})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkProgrammes();