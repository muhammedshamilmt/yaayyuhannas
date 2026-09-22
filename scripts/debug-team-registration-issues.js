const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function debugTeamRegistrationIssues() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Check what team you're testing with
    const testTeam = 'SMD'; // Change this to the team you're testing
    console.log(`🏃 Debugging for team: ${testTeam}`);
    
    // Get all data
    const programmes = await db.collection('programmes').find({}).toArray();
    const candidates = await db.collection('candidates').find({ team: testTeam }).toArray();
    const participants = await db.collection('programme_participants').find({}).toArray();
    const teamParticipants = participants.filter(p => p.teamCode === testTeam);
    
    console.log('\n📊 Raw Data:');
    console.log(`- Total programmes: ${programmes.length}`);
    console.log(`- Team candidates: ${candidates.length}`);
    console.log(`- All programme participants: ${participants.length}`);
    console.log(`- Team programme participants: ${teamParticipants.length}`);
    
    // Check team participants in detail
    console.log('\n🔍 Team Registrations Detail:');
    if (teamParticipants.length === 0) {
      console.log('❌ NO REGISTRATIONS FOUND for this team!');
    } else {
      teamParticipants.forEach((reg, index) => {
        console.log(`${index + 1}. Programme: ${reg.programmeName}`);
        console.log(`   Programme ID: ${reg.programmeId}`);
        console.log(`   Team: ${reg.teamCode}`);
        console.log(`   Participants: ${reg.participants.join(', ')}`);
        console.log(`   Status: ${reg.status}`);
        console.log('   ---');
      });
    }
    
    // Check if there's a mismatch in team codes
    console.log('\n🔍 Checking Team Code Consistency:');
    const allTeamCodes = [...new Set(participants.map(p => p.teamCode))];
    console.log(`Team codes in database: ${allTeamCodes.join(', ')}`);
    console.log(`Looking for team: ${testTeam}`);
    
    // Check candidates by section
    console.log('\n👥 Team Candidates by Section:');
    const candidatesBySection = {};
    candidates.forEach(c => {
      if (!candidatesBySection[c.section]) {
        candidatesBySection[c.section] = [];
      }
      candidatesBySection[c.section].push(c);
    });
    
    Object.keys(candidatesBySection).forEach(section => {
      console.log(`${section}: ${candidatesBySection[section].length} candidates`);
      console.log(`  ${candidatesBySection[section].map(c => c.chestNumber).join(', ')}`);
    });
    
    // Test programme requirements vs available candidates
    console.log('\n🎯 Programme Registration Feasibility:');
    programmes.forEach(programme => {
      let eligibleCandidates = [];
      if (programme.section === 'general') {
        eligibleCandidates = candidates;
      } else {
        eligibleCandidates = candidatesBySection[programme.section] || [];
      }
      
      const canRegister = eligibleCandidates.length >= programme.requiredParticipants;
      const isRegistered = teamParticipants.some(reg => reg.programmeId === programme._id.toString());
      
      console.log(`${programme.code}: ${programme.name}`);
      console.log(`  Section: ${programme.section}, Required: ${programme.requiredParticipants}`);
      console.log(`  Eligible candidates: ${eligibleCandidates.length}`);
      console.log(`  Can register: ${canRegister ? 'YES' : 'NO'}`);
      console.log(`  Is registered: ${isRegistered ? 'YES' : 'NO'}`);
      
      if (!canRegister) {
        console.log(`  ❌ Cannot register - need ${programme.requiredParticipants} but only have ${eligibleCandidates.length}`);
      }
      console.log('  ---');
    });
    
    // Check API endpoint simulation
    console.log('\n🔌 API Endpoint Simulation:');
    console.log(`GET /api/programme-participants?team=${testTeam}`);
    console.log(`Should return: ${teamParticipants.length} registrations`);
    
    console.log(`\nGET /api/candidates?team=${testTeam}`);
    console.log(`Should return: ${candidates.length} candidates`);
    
    console.log(`\nGET /api/programmes`);
    console.log(`Should return: ${programmes.length} programmes`);
    
    // Identify specific issues
    console.log('\n🚨 IDENTIFIED ISSUES:');
    
    if (teamParticipants.length === 0) {
      console.log('1. ❌ No registrations found - this explains why registered programmes are not showing');
    }
    
    const programmesWithInsufficientCandidates = programmes.filter(p => {
      let eligibleCandidates = [];
      if (p.section === 'general') {
        eligibleCandidates = candidates;
      } else {
        eligibleCandidates = candidatesBySection[p.section] || [];
      }
      return eligibleCandidates.length < p.requiredParticipants;
    });
    
    if (programmesWithInsufficientCandidates.length > 0) {
      console.log(`2. ❌ ${programmesWithInsufficientCandidates.length} programmes cannot be registered due to insufficient candidates:`);
      programmesWithInsufficientCandidates.forEach(p => {
        let eligibleCandidates = [];
        if (p.section === 'general') {
          eligibleCandidates = candidates;
        } else {
          eligibleCandidates = candidatesBySection[p.section] || [];
        }
        console.log(`   - ${p.name}: needs ${p.requiredParticipants}, has ${eligibleCandidates.length}`);
      });
    }
    
    // Check if the statistics calculation would be wrong
    const teamSections = [...new Set(candidates.map(c => c.section))];
    const availableProgrammes = programmes.filter(p => {
      if (p.section === 'general') return true;
      return teamSections.includes(p.section);
    });
    
    console.log('\n📊 Statistics Check:');
    console.log(`Available programmes for team: ${availableProgrammes.length}`);
    console.log(`Registered programmes: ${teamParticipants.length}`);
    console.log(`Not registered: ${availableProgrammes.length - teamParticipants.length}`);
    
    if (teamParticipants.length > 0 && teamParticipants.length !== availableProgrammes.length) {
      console.log('✅ Statistics should show correct numbers');
    } else if (teamParticipants.length === 0) {
      console.log('❌ Statistics will show 0 registered (which is correct if no registrations exist)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugTeamRegistrationIssues();