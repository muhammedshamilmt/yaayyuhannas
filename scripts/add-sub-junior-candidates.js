const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function addSubJuniorCandidates() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    console.log('👶 Adding Sub-Junior Candidates...\n');
    
    const subJuniorCandidates = [
      // SMD Team Sub-Junior Candidates
      { chestNumber: '101', name: 'Ali Hassan', team: 'SMD', section: 'sub-junior', points: 0 },
      { chestNumber: '102', name: 'Sara Ahmed', team: 'SMD', section: 'sub-junior', points: 0 },
      { chestNumber: '103', name: 'Omar Khalil', team: 'SMD', section: 'sub-junior', points: 0 },
      
      // INT Team Sub-Junior Candidates  
      { chestNumber: '104', name: 'Layla Noor', team: 'INT', section: 'sub-junior', points: 0 },
      { chestNumber: '105', name: 'Yusuf Saeed', team: 'INT', section: 'sub-junior', points: 0 },
      { chestNumber: '106', name: 'Amina Rashid', team: 'INT', section: 'sub-junior', points: 0 },
      
      // AQA Team Sub-Junior Candidates
      { chestNumber: '107', name: 'Hassan Ali', team: 'AQA', section: 'sub-junior', points: 0 },
      { chestNumber: '108', name: 'Fatima Zaid', team: 'AQA', section: 'sub-junior', points: 0 },
      { chestNumber: '109', name: 'Khalid Omar', team: 'AQA', section: 'sub-junior', points: 0 }
    ];
    
    // Add timestamps
    const candidatesWithTimestamps = subJuniorCandidates.map(candidate => ({
      ...candidate,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await db.collection('candidates').insertMany(candidatesWithTimestamps);
    
    console.log(`✅ Added ${result.insertedCount} sub-junior candidates`);
    
    // Show updated team breakdown
    const teams = ['SMD', 'INT', 'AQA'];
    
    for (const teamCode of teams) {
      const candidates = await db.collection('candidates').find({ team: teamCode }).toArray();
      const sections = [...new Set(candidates.map(c => c.section))];
      
      console.log(`\n👥 ${teamCode} Team (${candidates.length} candidates):`);
      sections.forEach(section => {
        const sectionCandidates = candidates.filter(c => c.section === section);
        console.log(`   ${section}: ${sectionCandidates.length} candidates`);
        sectionCandidates.forEach(c => {
          console.log(`     - ${c.chestNumber}: ${c.name}`);
        });
      });
    }
    
    console.log('\n🎉 Now all teams can participate in both programmes:');
    console.log('   - p001: jumbing (senior section)');
    console.log('   - ST01: story telling (sub-junior section)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

addSubJuniorCandidates();