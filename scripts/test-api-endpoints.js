const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function testAPIEndpoints() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Test different team codes to see what you might be using
    const testTeams = ['SMD', 'smd', 'SUMUD', 'sumud'];
    
    console.log('🧪 Testing API endpoints with different team codes:');
    
    for (const teamCode of testTeams) {
      console.log(`\n📡 Testing with team: "${teamCode}"`);
      
      // Simulate GET /api/candidates?team=${teamCode}
      const candidates = await db.collection('candidates').find({ team: teamCode }).toArray();
      console.log(`  GET /api/candidates?team=${teamCode} → ${candidates.length} candidates`);
      
      // Simulate GET /api/programme-participants?team=${teamCode}
      const participants = await db.collection('programme_participants').find({ teamCode: teamCode }).toArray();
      console.log(`  GET /api/programme-participants?team=${teamCode} → ${participants.length} registrations`);
      
      if (candidates.length > 0 || participants.length > 0) {
        console.log(`  ✅ Found data for team: "${teamCode}"`);
        
        if (candidates.length > 0) {
          console.log(`    Candidates: ${candidates.map(c => c.chestNumber).join(', ')}`);
        }
        
        if (participants.length > 0) {
          console.log(`    Registered programmes:`);
          participants.forEach(p => {
            console.log(`      - ${p.programmeName}: ${p.participants.join(', ')}`);
          });
        }
      } else {
        console.log(`  ❌ No data found for team: "${teamCode}"`);
      }
    }
    
    // Check what teams actually exist in the database
    console.log('\n🔍 Teams that actually exist in database:');
    
    const allCandidates = await db.collection('candidates').find({}).toArray();
    const candidateTeams = [...new Set(allCandidates.map(c => c.team))];
    console.log(`Candidate teams: ${candidateTeams.join(', ')}`);
    
    const allParticipants = await db.collection('programme_participants').find({}).toArray();
    const participantTeams = [...new Set(allParticipants.map(p => p.teamCode))];
    console.log(`Participant teams: ${participantTeams.join(', ')}`);
    
    const allTeams = await db.collection('teams').find({}).toArray();
    const teamCodes = allTeams.map(t => t.code);
    console.log(`Team codes in teams collection: ${teamCodes.join(', ')}`);
    
    // Test the exact URL you might be using
    console.log('\n🌐 URL Testing:');
    console.log('If you visit: /team-admin/programmes?team=SMD');
    console.log('The page should show:');
    console.log('- Available Programmes: 17');
    console.log('- Registered: 5');
    console.log('- Not Registered: 12');
    console.log('- 5 programmes should show as registered (green background)');
    
    console.log('\nIf you visit: /team-admin/programmes (without team parameter)');
    console.log('The page defaults to team=SMD and should show the same data');
    
    // Test if there's a case sensitivity issue
    console.log('\n🔤 Case Sensitivity Test:');
    const smdLower = await db.collection('candidates').find({ team: 'smd' }).toArray();
    const smdUpper = await db.collection('candidates').find({ team: 'SMD' }).toArray();
    console.log(`team: "smd" → ${smdLower.length} candidates`);
    console.log(`team: "SMD" → ${smdUpper.length} candidates`);
    
    if (smdLower.length !== smdUpper.length) {
      console.log('⚠️ Case sensitivity issue detected!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testAPIEndpoints();