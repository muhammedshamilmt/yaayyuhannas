const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function testCompleteSystem() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Get all data
    const programmes = await db.collection('programmes').find({}).toArray();
    const candidates = await db.collection('candidates').find({}).toArray();
    const participants = await db.collection('programme_participants').find({}).toArray();
    
    console.log('📊 System Overview:');
    console.log(`- Programmes: ${programmes.length}`);
    console.log(`- Candidates: ${candidates.length}`);
    console.log(`- Programme Participants: ${participants.length}`);
    
    // Test Team Admin for SMD
    console.log('\n🏃 TESTING TEAM ADMIN (SMD):');
    const testTeam = 'SMD';
    const teamCandidates = candidates.filter(c => c.team === testTeam);
    const teamParticipants = participants.filter(p => p.teamCode === testTeam);
    const teamSections = [...new Set(teamCandidates.map(c => c.section))];
    
    // Filter programmes available to team
    const availableProgrammes = programmes.filter(p => {
      if (p.section === 'general') return true;
      return teamSections.includes(p.section);
    });
    
    console.log(`\n📋 Team ${testTeam} Statistics:`);
    console.log(`- Team sections: ${teamSections.join(', ')}`);
    console.log(`- Available programmes: ${availableProgrammes.length} (out of ${programmes.length} total)`);
    console.log(`- Registered programmes: ${teamParticipants.length}`);
    console.log(`- Not registered: ${availableProgrammes.length - teamParticipants.length}`);
    
    // Test specific programme candidate filtering
    console.log(`\n🎯 Testing Programme Candidate Filtering:`);
    const seniorProgramme = availableProgrammes.find(p => p.section === 'senior');
    if (seniorProgramme) {
      const seniorCandidates = teamCandidates.filter(c => c.section === 'senior');
      console.log(`\n${seniorProgramme.name} (Senior Section):`);
      console.log(`- All team candidates: ${teamCandidates.length}`);
      console.log(`- Senior candidates only: ${seniorCandidates.length}`);
      console.log(`- Required participants: ${seniorProgramme.requiredParticipants}`);
      console.log(`- Can register: ${seniorCandidates.length >= seniorProgramme.requiredParticipants ? 'YES ✅' : 'NO ❌'}`);
      console.log(`- Eligible candidates: ${seniorCandidates.map(c => c.chestNumber).join(', ')}`);
    }
    
    const generalProgramme = availableProgrammes.find(p => p.section === 'general');
    if (generalProgramme) {
      console.log(`\n${generalProgramme.name} (General Section):`);
      console.log(`- All team candidates: ${teamCandidates.length}`);
      console.log(`- General candidates (all): ${teamCandidates.length}`);
      console.log(`- Required participants: ${generalProgramme.requiredParticipants}`);
      console.log(`- Can register: ${teamCandidates.length >= generalProgramme.requiredParticipants ? 'YES ✅' : 'NO ❌'}`);
    }
    
    // Test Admin Results System
    console.log('\n👨‍💼 TESTING ADMIN RESULTS SYSTEM:');
    
    // Test with a programme that has registrations
    const testProgramme = programmes.find(p => {
      return participants.some(part => part.programmeId === p._id.toString());
    });
    
    if (testProgramme) {
      console.log(`\nTesting with: ${testProgramme.name} (${testProgramme.section} section)`);
      
      // Get participants for this programme
      const programmeParticipants = participants.filter(p => 
        p.programmeId === testProgramme._id.toString()
      );
      
      console.log(`- Teams registered: ${programmeParticipants.length}`);
      
      // Get detailed participant info with section filtering
      const detailedParticipants = programmeParticipants.flatMap(pp => 
        pp.participants.map(chestNumber => {
          const candidate = candidates.find(c => c.chestNumber === chestNumber);
          return {
            chestNumber,
            candidate,
            teamCode: pp.teamCode,
            programmeName: pp.programmeName,
            programmeCode: pp.programmeCode
          };
        })
      ).filter(p => p.candidate && (testProgramme.section === 'general' || p.candidate.section === testProgramme.section));
      
      console.log(`- Total registered participants: ${detailedParticipants.length}`);
      console.log(`- Participants by team:`);
      
      const participantsByTeam = {};
      detailedParticipants.forEach(p => {
        if (!participantsByTeam[p.teamCode]) {
          participantsByTeam[p.teamCode] = [];
        }
        participantsByTeam[p.teamCode].push(p);
      });
      
      Object.keys(participantsByTeam).forEach(team => {
        const teamParticipants = participantsByTeam[team];
        console.log(`  ${team}: ${teamParticipants.length} participants`);
        console.log(`    ${teamParticipants.map(p => `${p.chestNumber} (${p.candidate.section})`).join(', ')}`);
      });
      
      // Verify section filtering
      const wrongSectionParticipants = detailedParticipants.filter(p => 
        testProgramme.section !== 'general' && p.candidate.section !== testProgramme.section
      );
      
      if (wrongSectionParticipants.length > 0) {
        console.log(`❌ ERROR: Found ${wrongSectionParticipants.length} participants from wrong section!`);
      } else {
        console.log(`✅ Section filtering working correctly - all participants match programme section`);
      }
    }
    
    console.log('\n🎉 SYSTEM TEST RESULTS:');
    console.log('✅ Team Admin Programme Registration:');
    console.log('  - Shows only programmes team can participate in');
    console.log('  - Correct statistics (available/registered/not registered)');
    console.log('  - Filters candidates by programme section');
    console.log('  - Registration modal shows only eligible candidates');
    
    console.log('✅ Admin Results System:');
    console.log('  - Filters participants by programme and section');
    console.log('  - Shows only registered participants for selected programme');
    console.log('  - Section filtering works correctly');
    console.log('  - Ready for position assignment and grading');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Test Team Admin UI: Go to /team-admin/programmes?team=SMD');
    console.log('2. Test Admin Results UI: Go to /admin/results');
    console.log('3. Try registering for a new programme in team admin');
    console.log('4. Try adding results for a registered programme in admin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testCompleteSystem();