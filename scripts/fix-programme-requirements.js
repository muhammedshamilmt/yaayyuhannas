const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function fixProgrammeRequirements() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Get current data
    const programmes = await db.collection('programmes').find({}).toArray();
    const candidates = await db.collection('candidates').find({}).toArray();
    
    // Analyze candidate availability by section
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
    
    console.log('📊 Candidate Availability:');
    Object.keys(candidatesBySection).forEach(section => {
      console.log(`\n${section.toUpperCase()} Section:`);
      Object.keys(candidatesBySection[section]).forEach(team => {
        const count = candidatesBySection[section][team].length;
        console.log(`  ${team}: ${count} candidates`);
      });
    });
    
    // Find programmes that need fixing
    const programmesToFix = [];
    programmes.forEach(p => {
      const section = p.section;
      const maxAvailable = Math.max(...Object.keys(candidatesBySection[section] || {}).map(team => 
        (candidatesBySection[section][team] || []).length
      ));
      
      if (p.requiredParticipants > maxAvailable) {
        programmesToFix.push({
          programme: p,
          currentRequired: p.requiredParticipants,
          maxAvailable: maxAvailable,
          suggestedRequired: Math.min(maxAvailable, Math.max(1, Math.floor(maxAvailable * 0.8)))
        });
      }
    });
    
    if (programmesToFix.length > 0) {
      console.log('\n🔧 Programmes that need fixing:');
      programmesToFix.forEach(fix => {
        console.log(`\n${fix.programme.name}:`);
        console.log(`  Current required: ${fix.currentRequired}`);
        console.log(`  Max available per team: ${fix.maxAvailable}`);
        console.log(`  Suggested required: ${fix.suggestedRequired}`);
      });
      
      // Ask user if they want to fix
      console.log('\n🛠️ Fixing programme requirements...');
      
      for (const fix of programmesToFix) {
        const newRequired = fix.suggestedRequired;
        await db.collection('programmes').updateOne(
          { _id: fix.programme._id },
          { $set: { requiredParticipants: newRequired } }
        );
        console.log(`✅ Updated ${fix.programme.name}: ${fix.currentRequired} → ${newRequired} participants`);
      }
      
      console.log(`\n🎉 Fixed ${programmesToFix.length} programmes!`);
      
    } else {
      console.log('\n✅ All programmes have realistic participant requirements!');
    }
    
    // Show final summary
    const updatedProgrammes = await db.collection('programmes').find({}).toArray();
    console.log('\n📋 Final Programme Requirements:');
    updatedProgrammes.forEach(p => {
      const section = p.section;
      const maxAvailable = Math.max(...Object.keys(candidatesBySection[section] || {}).map(team => 
        (candidatesBySection[section][team] || []).length
      ));
      const canRegister = p.requiredParticipants <= maxAvailable;
      console.log(`${p.code}: ${p.name} - ${p.requiredParticipants} participants ${canRegister ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixProgrammeRequirements();