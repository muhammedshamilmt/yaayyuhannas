const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function testResultsSystem() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Check if we have programmes and participants
    const programmes = await db.collection('programmes').find({}).toArray();
    const participants = await db.collection('programme_participants').find({}).toArray();
    const candidates = await db.collection('candidates').find({}).toArray();
    
    console.log('📊 Current Data:');
    console.log(`- Programmes: ${programmes.length}`);
    console.log(`- Programme Participants: ${participants.length}`);
    console.log(`- Candidates: ${candidates.length}`);
    
    if (programmes.length > 0) {
      console.log('\n🎯 Sample Programme:');
      const sampleProgramme = programmes[0];
      console.log(`- ${sampleProgramme.code} - ${sampleProgramme.name}`);
      console.log(`- Category: ${sampleProgramme.category}`);
      console.log(`- Section: ${sampleProgramme.section}`);
      console.log(`- Position Type: ${sampleProgramme.positionType}`);
    }
    
    if (participants.length > 0) {
      console.log('\n👥 Sample Participants:');
      participants.slice(0, 3).forEach(p => {
        console.log(`- Programme: ${p.programmeName}`);
        console.log(`- Team: ${p.teamCode}`);
        console.log(`- Participants: ${p.participants.join(', ')}`);
        console.log('---');
      });
    }
    
    if (candidates.length > 0) {
      console.log('\n🏃 Sample Candidates:');
      candidates.slice(0, 5).forEach(c => {
        console.log(`- ${c.chestNumber}: ${c.name} (${c.team}, ${c.section})`);
      });
    }
    
    console.log('\n✅ Results system is ready to test!');
    console.log('📝 Instructions:');
    console.log('1. Go to Admin > Results');
    console.log('2. Select a programme from the dropdown');
    console.log('3. Select a section (senior/junior/sub-junior/general)');
    console.log('4. You should see registered participants');
    console.log('5. Click position buttons (🥇 🥈 🥉) to assign positions');
    console.log('6. Use grade dropdown for participation grades');
    console.log('7. Set points and add notes');
    console.log('8. Submit the result');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testResultsSystem();