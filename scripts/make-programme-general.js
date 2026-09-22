const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function makeProgrammeGeneral() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    console.log('🌐 Making Story Telling Programme General...\n');
    
    // Update the story telling programme to be general
    const result = await db.collection('programmes').updateOne(
      { code: 'ST01' },
      { 
        $set: { 
          section: 'general',
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('❌ Story telling programme (ST01) not found');
      return;
    }
    
    console.log('✅ Updated story telling programme to be general');
    
    // Verify the change
    const programme = await db.collection('programmes').findOne({ code: 'ST01' });
    if (programme) {
      console.log(`📋 Programme: ${programme.name} (${programme.code})`);
      console.log(`   Section: ${programme.section} ← Now available to all teams!`);
      console.log(`   Category: ${programme.category}${programme.subcategory ? ` (${programme.subcategory})` : ''}`);
      console.log(`   Required Participants: ${programme.requiredParticipants}`);
    }
    
    console.log('\n🎉 Now all teams can participate in both programmes:');
    console.log('   - p001: jumbing (senior section)');
    console.log('   - ST01: story telling (general - all sections)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

makeProgrammeGeneral();