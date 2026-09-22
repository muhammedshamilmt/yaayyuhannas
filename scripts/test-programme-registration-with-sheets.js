const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testProgrammeRegistrationWithSheets() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('festival-management');
    
    console.log('🧪 Testing Programme Registration with Google Sheets Integration...\n');
    
    // Ensure we have programmes and candidates
    const programmes = await db.collection('programmes').find({}).toArray();
    const candidates = await db.collection('candidates').find({ team: 'SMD' }).toArray();
    
    console.log(`📋 Found ${programmes.length} programmes`);
    console.log(`👥 Found ${candidates.length} SMD candidates`);
    
    if (programmes.length === 0) {
      console.log('❌ No programmes found. Run add-sample-programmes.js first');
      return;
    }
    
    if (candidates.length === 0) {
      console.log('❌ No SMD candidates found. Run add-sample-candidates.js first');
      return;
    }
    
    // Test with Quiz Competition (3 participants required)
    const quizProg = programmes.find(p => p.name.includes('Quiz') || p.code === 'GEN001');
    if (!quizProg) {
      console.log('❌ Quiz programme not found');
      return;
    }
    
    console.log(`\n🎯 Testing with programme: ${quizProg.name} (${quizProg.code})`);
    console.log(`- Required participants: ${quizProg.requiredParticipants} (type: ${typeof quizProg.requiredParticipants})`);
    
    // Check if already registered
    const existing = await db.collection('programme_participants').findOne({
      programmeId: quizProg._id.toString(),
      teamCode: 'SMD'
    });
    
    if (existing) {
      console.log('⚠️ SMD already registered for this programme. Removing existing registration...');
      await db.collection('programme_participants').deleteOne({ _id: existing._id });
    }
    
    // Test registration via API
    const registrationData = {
      programmeId: quizProg._id.toString(),
      programmeCode: quizProg.code,
      programmeName: quizProg.name,
      teamCode: 'SMD',
      participants: candidates.slice(0, Number(quizProg.requiredParticipants)).map(c => c.chestNumber),
      status: 'registered'
    };
    
    console.log('\n📝 Registration data:');
    console.log(JSON.stringify(registrationData, null, 2));
    
    // Test the API endpoint
    console.log('\n🚀 Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/programme-participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Registration successful!');
      console.log('📄 Response:', result);
      
      // Check database
      const dbRecord = await db.collection('programme_participants').findOne({
        programmeId: quizProg._id.toString(),
        teamCode: 'SMD'
      });
      
      if (dbRecord) {
        console.log('✅ Record saved to database');
        console.log('📊 Database record:', dbRecord);
      }
      
      console.log('\n📊 Google Sheets Integration:');
      console.log('- Main sheet: Programme_Registrations');
      console.log('- Team sheet: SMD_Registrations');
      console.log('- Check your Google Spreadsheet for the new data!');
      
    } else {
      const error = await response.json();
      console.log('❌ Registration failed:', error);
    }
    
    // Test statistics calculation
    console.log('\n📈 Testing Statistics Calculation...');
    const allParticipants = await db.collection('programme_participants').find({ teamCode: 'SMD' }).toArray();
    const uniqueRegistrations = [...new Set(allParticipants.map(p => p.programmeId))];
    
    console.log(`- Total participant records: ${allParticipants.length}`);
    console.log(`- Unique programme registrations: ${uniqueRegistrations.length}`);
    console.log(`- Available programmes: ${programmes.length}`);
    console.log(`- Not registered: ${programmes.length - uniqueRegistrations.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testProgrammeRegistrationWithSheets();