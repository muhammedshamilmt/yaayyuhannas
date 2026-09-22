const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function debugRegistrationIssue() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Get programmes with different participant requirements
    const programmes = await db.collection('programmes').find({}).toArray();
    const candidates = await db.collection('candidates').find({}).toArray();
    const participants = await db.collection('programme_participants').find({}).toArray();
    
    console.log('📊 Current Data:');
    console.log(`- Total Programmes: ${programmes.length}`);
    console.log(`- Total Candidates: ${candidates.length}`);
    console.log(`- Total Registrations: ${participants.length}`);
    
    // Group programmes by required participants
    const programmesByRequirement = {};
    programmes.forEach(p => {
      const req = p.requiredParticipants;
      if (!programmesByRequirement[req]) {
        programmesByRequirement[req] = [];
      }
      programmesByRequirement[req].push(p);
    });
    
    console.log('\n🎯 Programmes by Required Participants:');
    Object.keys(programmesByRequirement).sort().forEach(req => {
      const progs = programmesByRequirement[req];
      console.log(`\n${req} Participant(s) Required: (${progs.length} programmes)`);
      progs.forEach(p => {
        const registrations = participants.filter(part => part.programmeId === p._id.toString());
        console.log(`  - ${p.code}: ${p.name} (${registrations.length} teams registered)`);
        registrations.forEach(reg => {
          console.log(`    * ${reg.teamCode}: ${reg.participants.join(', ')}`);
        });
      });
    });
    
    // Check for programmes with no registrations
    const unregisteredProgrammes = programmes.filter(p => {
      return !participants.some(part => part.programmeId === p._id.toString());
    });
    
    if (unregisteredProgrammes.length > 0) {
      console.log('\n⚠️ Programmes with NO registrations:');
      unregisteredProgrammes.forEach(p => {
        console.log(`  - ${p.code}: ${p.name} (requires ${p.requiredParticipants} participants)`);
      });
    }
    
    // Check candidates by team and section
    console.log('\n👥 Candidates by Team and Section:');
    const candidatesByTeamSection = {};
    candidates.forEach(c => {
      const key = `${c.team}-${c.section}`;
      if (!candidatesByTeamSection[key]) {
        candidatesByTeamSection[key] = [];
      }
      candidatesByTeamSection[key].push(c);
    });
    
    Object.keys(candidatesByTeamSection).forEach(key => {
      const [team, section] = key.split('-');
      const teamCandidates = candidatesByTeamSection[key];
      console.log(`  ${team} (${section}): ${teamCandidates.length} candidates`);
      console.log(`    ${teamCandidates.map(c => c.chestNumber).join(', ')}`);
    });
    
    // Test registration simulation
    console.log('\n🧪 Testing Registration Logic:');
    const testProgramme = programmes.find(p => p.requiredParticipants > 1);
    if (testProgramme) {
      console.log(`\nTesting with: ${testProgramme.name} (requires ${testProgramme.requiredParticipants} participants)`);
      
      // Find candidates for this programme's section
      const sectionCandidates = candidates.filter(c => 
        testProgramme.section === 'general' || c.section === testProgramme.section
      );
      
      console.log(`Available candidates for ${testProgramme.section} section: ${sectionCandidates.length}`);
      
      // Group by team
      const teamGroups = {};
      sectionCandidates.forEach(c => {
        if (!teamGroups[c.team]) {
          teamGroups[c.team] = [];
        }
        teamGroups[c.team].push(c);
      });
      
      Object.keys(teamGroups).forEach(team => {
        const teamCandidates = teamGroups[team];
        console.log(`  ${team}: ${teamCandidates.length} candidates available`);
        
        if (teamCandidates.length >= testProgramme.requiredParticipants) {
          console.log(`    ✅ Can register (has ${teamCandidates.length} >= ${testProgramme.requiredParticipants})`);
        } else {
          console.log(`    ❌ Cannot register (has ${teamCandidates.length} < ${testProgramme.requiredParticipants})`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugRegistrationIssue();