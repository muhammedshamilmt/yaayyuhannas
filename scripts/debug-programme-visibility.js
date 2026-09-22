const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugProgrammeVisibility() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    console.log('🔍 Debugging Programme Visibility Issue...\n');
    
    // Check all programmes in database
    const programmes = await db.collection('programmes').find({}).toArray();
    console.log(`📋 Total programmes in database: ${programmes.length}`);
    
    if (programmes.length === 0) {
      console.log('❌ No programmes found in database');
      return;
    }
    
    console.log('\n📋 All Programmes:');
    programmes.forEach((prog, index) => {
      console.log(`${index + 1}. ${prog.code} - ${prog.name}`);
      console.log(`   Section: ${prog.section}`);
      console.log(`   Category: ${prog.category}${prog.subcategory ? ` (${prog.subcategory})` : ''}`);
      console.log(`   Position Type: ${prog.positionType}`);
      console.log(`   Required Participants: ${prog.requiredParticipants} (type: ${typeof prog.requiredParticipants})`);
      console.log(`   Status: ${prog.status}`);
      console.log(`   Created: ${prog.createdAt || 'N/A'}`);
      console.log('');
    });
    
    // Check team candidates to understand team sections
    const teams = ['SMD', 'INT', 'AQA'];
    
    for (const teamCode of teams) {
      const candidates = await db.collection('candidates').find({ team: teamCode }).toArray();
      console.log(`👥 ${teamCode} Team:`);
      console.log(`   Candidates: ${candidates.length}`);
      
      if (candidates.length > 0) {
        const sections = [...new Set(candidates.map(c => c.section))];
        console.log(`   Sections: ${sections.join(', ')}`);
        
        // Filter programmes available to this team
        const availableProgrammes = programmes.filter(p => {
          if (p.section === 'general') return true;
          return sections.includes(p.section);
        });
        
        console.log(`   Available programmes: ${availableProgrammes.length}`);
        availableProgrammes.forEach(p => {
          console.log(`     - ${p.code}: ${p.name} (${p.section})`);
        });
      }
      console.log('');
    }
    
    // Check if there are any database connection issues
    console.log('🔗 Database Connection Test:');
    const testQuery = await db.collection('programmes').findOne();
    console.log(`   Can read programmes: ${testQuery ? '✅ YES' : '❌ NO'}`);
    
    // Check the programmes API endpoint database
    console.log('\n🌐 API Endpoint Database Check:');
    console.log('   The team admin page calls /api/programmes');
    console.log('   Let me check what database that API uses...');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugProgrammeVisibility();