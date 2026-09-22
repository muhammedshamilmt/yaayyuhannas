const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function initializeTeamsWithEmail() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('festival_management');
    const teamsCollection = db.collection('teams');
    
    // Clear existing teams
    await teamsCollection.deleteMany({});
    console.log('🗑️  Cleared existing teams');
    
    // Create the 3 main festival teams with captain email
    const defaultTeams = [
      {
        code: 'SMD',
        name: 'SUMUD',
        color: '#22C55E',
        description: 'Team Sumud - Steadfastness and Perseverance',
        captain: 'Ahmed Al-Sumud',
        captainEmail: 'ahmed.sumud@wattaqa.edu',
        leaders: ['Fatima Al-Qasemi', 'Omar Al-Rashid'],
        members: 0,
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'INT',
        name: 'INTIFADA',
        color: '#EF4444',
        description: 'Team Intifada - Uprising and Resistance',
        captain: 'Layla Al-Intifada',
        captainEmail: 'layla.intifada@wattaqa.edu',
        leaders: ['Hassan Al-Muqawim', 'Zainab Al-Thawra'],
        members: 0,
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'AQS',
        name: 'AQSA',
        color: '#374151',
        description: 'Team Aqsa - Sacred and Noble',
        captain: 'Khalid Al-Aqsa',
        captainEmail: 'khalid.aqsa@wattaqa.edu',
        leaders: ['Mariam Al-Quds', 'Yusuf Al-Barakah'],
        members: 0,
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = await teamsCollection.insertMany(defaultTeams);
    console.log(`✅ Created ${result.insertedCount} teams with captain emails`);
    
    // Verify the teams
    const teams = await teamsCollection.find({}).toArray();
    console.log('\n📋 Created teams:');
    teams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (${team.code})`);
      console.log(`   Captain: ${team.captain}`);
      console.log(`   Captain Email: ${team.captainEmail}`);
      console.log(`   Leaders: ${team.leaders.join(', ')}`);
      console.log(`   Color: ${team.color}`);
      console.log('');
    });
    
    console.log('🎉 Teams initialization completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Visit http://localhost:3001/admin/teams to see the teams');
    console.log('2. Test creating/editing teams with captain email');
    console.log('3. Test Google Sheets syncing');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the initialization
initializeTeamsWithEmail().catch(console.error);