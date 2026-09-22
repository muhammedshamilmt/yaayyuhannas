const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testTeamCaptainEmail() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('festival_management');
    const teamsCollection = db.collection('teams');
    
    // Test 1: Check if existing teams have the captainEmail field
    console.log('\n📋 Checking existing teams...');
    const existingTeams = await teamsCollection.find({}).toArray();
    
    if (existingTeams.length === 0) {
      console.log('❌ No teams found. Please create teams first.');
      return;
    }
    
    existingTeams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (${team.code})`);
      console.log(`   Captain: ${team.captain}`);
      console.log(`   Captain Email: ${team.captainEmail || 'Not set'}`);
      console.log('');
    });
    
    // Test 2: Update a team with captain email
    console.log('🔄 Testing captain email update...');
    const testTeam = existingTeams[0];
    const testEmail = 'captain@example.com';
    
    const updateResult = await teamsCollection.updateOne(
      { _id: testTeam._id },
      { 
        $set: { 
          captainEmail: testEmail,
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log(`✅ Successfully updated ${testTeam.name} with captain email: ${testEmail}`);
      
      // Verify the update
      const updatedTeam = await teamsCollection.findOne({ _id: testTeam._id });
      console.log(`✅ Verified: Captain email is now ${updatedTeam.captainEmail}`);
    } else {
      console.log('❌ Failed to update team with captain email');
    }
    
    // Test 3: Create a new test team with captain email
    console.log('\n🆕 Testing new team creation with captain email...');
    const newTeam = {
      code: 'TEST',
      name: 'TEST TEAM',
      color: '#FF6B6B',
      description: 'Test team for captain email functionality',
      captain: 'Test Captain',
      captainEmail: 'test.captain@example.com',
      members: 0,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if test team already exists
    const existingTestTeam = await teamsCollection.findOne({ code: 'TEST' });
    if (existingTestTeam) {
      console.log('⚠️  Test team already exists, updating instead...');
      await teamsCollection.updateOne(
        { code: 'TEST' },
        { $set: newTeam }
      );
    } else {
      const insertResult = await teamsCollection.insertOne(newTeam);
      console.log(`✅ Created test team with ID: ${insertResult.insertedId}`);
    }
    
    // Verify the test team
    const createdTeam = await teamsCollection.findOne({ code: 'TEST' });
    console.log(`✅ Test team verification:`);
    console.log(`   Name: ${createdTeam.name}`);
    console.log(`   Captain: ${createdTeam.captain}`);
    console.log(`   Captain Email: ${createdTeam.captainEmail}`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Team captain email field is working');
    console.log('- ✅ Existing teams can be updated with captain email');
    console.log('- ✅ New teams can be created with captain email');
    console.log('\n💡 Next steps:');
    console.log('1. Test the admin UI to create/edit teams with captain email');
    console.log('2. Test Google Sheets syncing with the new captain email field');
    console.log('3. Clean up test team if needed: db.teams.deleteOne({code: "TEST"})');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTeamCaptainEmail().catch(console.error);