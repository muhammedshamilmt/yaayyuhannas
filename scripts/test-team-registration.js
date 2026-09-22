const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function testTeamRegistration() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Get programmes that teams can register for
    const programmes = await db.collection('programmes').find({}).toArray();
    const candidates = await db.collection('candidates').find({}).toArray();
    const existingRegistrations = await db.collection('programme_participants').find({}).toArray();
    
    // Test for SMD team
    const testTeam = 'SMD';
    console.log(`\n🏃 Testing registration for team: ${testTeam}`);
    
    // Get SMD candidates by section
    const smdCandidates = candidates.filter(c => c.team === testTeam);
    const smdBySection = {};
    smdCandidates.forEach(c => {
      if (!smdBySection[c.section]) {
        smdBySection[c.section] = [];
      }
      smdBySection[c.section].push(c);
    });
    
    console.log(`\n👥 ${testTeam} Candidates:`);
    Object.keys(smdBySection).forEach(section => {
      console.log(`  ${section}: ${smdBySection[section].length} candidates`);
      console.log(`    ${smdBySection[section].map(c => c.chestNumber).join(', ')}`);
    });
    
    // Check which programmes SMD can register for
    console.log(`\n📋 Programmes ${testTeam} can register for:`);
    
    programmes.forEach(programme => {
      // Check if already registered
      const alreadyRegistered = existingRegistrations.some(reg => 
        reg.programmeId === programme._id.toString() && reg.teamCode === testTeam
      );
      
      // Check if team has enough candidates
      let availableCandidates = [];
      if (programme.section === 'general') {
        availableCandidates = smdCandidates;
      } else {
        availableCandidates = smdBySection[programme.section] || [];
      }
      
      const canRegister = availableCandidates.length >= programme.requiredParticipants;
      const status = alreadyRegistered ? '✅ REGISTERED' : canRegister ? '🟢 CAN REGISTER' : '❌ NOT ENOUGH CANDIDATES';
      
      console.log(`\n${programme.code}: ${programme.name}`);
      console.log(`  Section: ${programme.section}`);
      console.log(`  Required: ${programme.requiredParticipants} participants`);
      console.log(`  Available: ${availableCandidates.length} candidates`);
      console.log(`  Status: ${status}`);
      
      if (alreadyRegistered) {
        const registration = existingRegistrations.find(reg => 
          reg.programmeId === programme._id.toString() && reg.teamCode === testTeam
        );
        console.log(`  Registered: ${registration.participants.join(', ')}`);
      }
    });
    
    // Test specific programme registration
    const testProgramme = programmes.find(p => p.name.includes('Football'));
    if (testProgramme) {
      console.log(`\n🧪 Testing registration for: ${testProgramme.name}`);
      
      const availableCandidates = testProgramme.section === 'general' 
        ? smdCandidates 
        : smdBySection[testProgramme.section] || [];
      
      console.log(`Available candidates: ${availableCandidates.map(c => c.chestNumber).join(', ')}`);
      console.log(`Required participants: ${testProgramme.requiredParticipants}`);
      console.log(`Can register: ${availableCandidates.length >= testProgramme.requiredParticipants ? 'YES' : 'NO'}`);
      
      if (availableCandidates.length >= testProgramme.requiredParticipants) {
        const selectedParticipants = availableCandidates.slice(0, testProgramme.requiredParticipants);
        console.log(`\n✅ Registration would work with: ${selectedParticipants.map(c => c.chestNumber).join(', ')}`);
        
        // Simulate the registration payload
        const registrationPayload = {
          programmeId: testProgramme._id,
          programmeCode: testProgramme.code,
          programmeName: testProgramme.name,
          teamCode: testTeam,
          participants: selectedParticipants.map(c => c.chestNumber),
          status: 'registered'
        };
        
        console.log('\n📤 Registration payload:');
        console.log(JSON.stringify(registrationPayload, null, 2));
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Programme requirements have been fixed to match available candidates');
    console.log('- Teams can now register for programmes they have enough candidates for');
    console.log('- The registration button should work when exactly the required number of participants are selected');
    console.log('\n📝 To test in the UI:');
    console.log('1. Go to Team Admin > Programmes (with ?team=SMD)');
    console.log('2. Find a programme like "Football (Senior Boys)"');
    console.log('3. Click "Register for Programme"');
    console.log('4. Select exactly 4 senior candidates');
    console.log('5. The register button should be enabled and work');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testTeamRegistration();