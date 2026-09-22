const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function addSampleRegistrations() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Get some programmes and candidates
    const programmes = await db.collection('programmes').find({}).limit(5).toArray();
    const candidates = await db.collection('candidates').find({}).toArray();
    
    if (programmes.length === 0 || candidates.length === 0) {
      console.log('❌ Need programmes and candidates first');
      return;
    }
    
    // Group candidates by team and section
    const candidatesByTeamSection = {};
    candidates.forEach(candidate => {
      const key = `${candidate.team}-${candidate.section}`;
      if (!candidatesByTeamSection[key]) {
        candidatesByTeamSection[key] = [];
      }
      candidatesByTeamSection[key].push(candidate);
    });
    
    const registrations = [];
    
    // Create registrations for each programme
    for (const programme of programmes) {
      console.log(`\n📋 Creating registrations for: ${programme.name}`);
      
      // Find matching candidates for this programme's section
      const sectionKey = programme.section === 'general' ? 'general' : programme.section;
      
      Object.keys(candidatesByTeamSection).forEach(teamSectionKey => {
        const [team, section] = teamSectionKey.split('-');
        
        // Check if this team-section matches the programme
        if (sectionKey === 'general' || section === sectionKey) {
          const teamCandidates = candidatesByTeamSection[teamSectionKey];
          
          // Take required number of participants (or available candidates)
          const participantCount = Math.min(programme.requiredParticipants, teamCandidates.length);
          const selectedParticipants = teamCandidates.slice(0, participantCount);
          
          if (selectedParticipants.length > 0) {
            const registration = {
              programmeId: programme._id.toString(),
              programmeCode: programme.code,
              programmeName: programme.name,
              teamCode: team,
              participants: selectedParticipants.map(c => c.chestNumber),
              status: 'registered',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            registrations.push(registration);
            console.log(`  ✅ ${team}: ${selectedParticipants.map(c => c.chestNumber).join(', ')}`);
          }
        }
      });
    }
    
    if (registrations.length > 0) {
      // Clear existing registrations first
      await db.collection('programme_participants').deleteMany({});
      console.log('🗑️ Cleared existing registrations');
      
      // Insert new registrations
      const result = await db.collection('programme_participants').insertMany(registrations);
      console.log(`\n🎉 Added ${result.insertedCount} programme registrations!`);
      
      // Show summary
      console.log('\n📊 Registration Summary:');
      const summary = {};
      registrations.forEach(reg => {
        if (!summary[reg.programmeName]) {
          summary[reg.programmeName] = [];
        }
        summary[reg.programmeName].push(`${reg.teamCode} (${reg.participants.length})`);
      });
      
      Object.keys(summary).forEach(programme => {
        console.log(`${programme}:`);
        summary[programme].forEach(team => {
          console.log(`  - ${team}`);
        });
      });
      
    } else {
      console.log('❌ No registrations created');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

addSampleRegistrations();