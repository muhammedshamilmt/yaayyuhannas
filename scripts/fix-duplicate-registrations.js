const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function fixDuplicateRegistrations() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Get all programme participants
    const participants = await db.collection('programme_participants').find({}).toArray();
    
    console.log(`📊 Found ${participants.length} programme participant records`);
    
    // Group by team and programme to find duplicates
    const registrationMap = {};
    const duplicates = [];
    
    participants.forEach(p => {
      const key = `${p.teamCode}-${p.programmeId}`;
      if (registrationMap[key]) {
        // This is a duplicate
        duplicates.push(p);
        console.log(`🔍 Duplicate found: ${p.teamCode} - ${p.programmeName}`);
      } else {
        registrationMap[key] = p;
      }
    });
    
    console.log(`\n🚨 Found ${duplicates.length} duplicate registrations`);
    
    if (duplicates.length > 0) {
      console.log('\n🗑️ Removing duplicates...');
      
      // Remove duplicates
      for (const duplicate of duplicates) {
        await db.collection('programme_participants').deleteOne({ _id: duplicate._id });
        console.log(`✅ Removed duplicate: ${duplicate.teamCode} - ${duplicate.programmeName}`);
      }
      
      console.log(`\n🎉 Removed ${duplicates.length} duplicate registrations!`);
    } else {
      console.log('\n✅ No duplicates found');
    }
    
    // Show final clean data
    const cleanParticipants = await db.collection('programme_participants').find({}).toArray();
    console.log(`\n📊 Final count: ${cleanParticipants.length} programme participant records`);
    
    // Group by team for summary
    const teamSummary = {};
    cleanParticipants.forEach(p => {
      if (!teamSummary[p.teamCode]) {
        teamSummary[p.teamCode] = [];
      }
      teamSummary[p.teamCode].push(p.programmeName);
    });
    
    console.log('\n📋 Clean Registration Summary:');
    Object.keys(teamSummary).forEach(team => {
      console.log(`${team}: ${teamSummary[team].length} programmes`);
      teamSummary[team].forEach(programme => {
        console.log(`  - ${programme}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixDuplicateRegistrations();