const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function fixProgrammeRequirementsProperly() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Get current data
    const programmes = await db.collection('programmes').find({}).toArray();
    const candidates = await db.collection('candidates').find({}).toArray();
    
    // Analyze candidate availability
    const candidatesBySection = {};
    candidates.forEach(c => {
      if (!candidatesBySection[c.section]) {
        candidatesBySection[c.section] = {};
      }
      if (!candidatesBySection[c.section][c.team]) {
        candidatesBySection[c.section][c.team] = [];
      }
      candidatesBySection[c.section][c.team].push(c);
    });
    
    // Calculate total candidates per team (for general section)
    const candidatesByTeam = {};
    candidates.forEach(c => {
      if (!candidatesByTeam[c.team]) {
        candidatesByTeam[c.team] = [];
      }
      candidatesByTeam[c.team].push(c);
    });
    
    console.log('📊 Candidate Availability:');
    Object.keys(candidatesBySection).forEach(section => {
      console.log(`\n${section.toUpperCase()} Section:`);
      Object.keys(candidatesBySection[section]).forEach(team => {
        const count = candidatesBySection[section][team].length;
        console.log(`  ${team}: ${count} candidates`);
      });
    });
    
    console.log('\nTOTAL per team (for general programmes):');
    Object.keys(candidatesByTeam).forEach(team => {
      console.log(`  ${team}: ${candidatesByTeam[team].length} total candidates`);
    });
    
    // Fix programmes with realistic requirements
    const updates = [];
    
    for (const programme of programmes) {
      let maxAvailable = 0;
      let suggestedRequired = programme.requiredParticipants;
      
      if (programme.section === 'general') {
        // For general programmes, use total candidates per team
        maxAvailable = Math.max(...Object.keys(candidatesByTeam).map(team => 
          candidatesByTeam[team].length
        ));
      } else {
        // For specific sections
        if (candidatesBySection[programme.section]) {
          maxAvailable = Math.max(...Object.keys(candidatesBySection[programme.section]).map(team => 
            candidatesBySection[programme.section][team].length
          ));
        }
      }
      
      // Set realistic requirements
      if (programme.requiredParticipants > maxAvailable || programme.requiredParticipants <= 0) {
        if (programme.positionType === 'individual') {
          suggestedRequired = 1;
        } else if (programme.positionType === 'group') {
          suggestedRequired = Math.min(maxAvailable, Math.max(2, Math.floor(maxAvailable * 0.7)));
        } else {
          suggestedRequired = Math.min(maxAvailable, Math.max(1, Math.floor(maxAvailable * 0.5)));
        }
        
        updates.push({
          programme,
          currentRequired: programme.requiredParticipants,
          maxAvailable,
          suggestedRequired
        });
      }
    }
    
    if (updates.length > 0) {
      console.log('\n🔧 Updating programme requirements:');
      
      for (const update of updates) {
        await db.collection('programmes').updateOne(
          { _id: update.programme._id },
          { $set: { requiredParticipants: update.suggestedRequired } }
        );
        console.log(`✅ ${update.programme.name}: ${update.currentRequired} → ${update.suggestedRequired} participants`);
      }
      
      console.log(`\n🎉 Updated ${updates.length} programmes!`);
    }
    
    // Show final summary
    const updatedProgrammes = await db.collection('programmes').find({}).toArray();
    console.log('\n📋 Final Programme Requirements:');
    
    updatedProgrammes.forEach(p => {
      let maxAvailable = 0;
      if (p.section === 'general') {
        maxAvailable = Math.max(...Object.keys(candidatesByTeam).map(team => 
          candidatesByTeam[team].length
        ));
      } else if (candidatesBySection[p.section]) {
        maxAvailable = Math.max(...Object.keys(candidatesBySection[p.section]).map(team => 
          candidatesBySection[p.section][team].length
        ));
      }
      
      const canRegister = p.requiredParticipants <= maxAvailable && p.requiredParticipants > 0;
      console.log(`${p.code}: ${p.name} (${p.section}) - ${p.requiredParticipants} participants ${canRegister ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixProgrammeRequirementsProperly();