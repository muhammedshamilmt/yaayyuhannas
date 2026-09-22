const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function fixTeamsCollection() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    
    // Check current teams
    const existingTeams = await db.collection('teams').find({}).toArray();
    console.log(`📊 Current teams in database: ${existingTeams.length}`);
    
    if (existingTeams.length === 0) {
      console.log('🔧 Adding missing teams...');
      
      const teams = [
        {
          code: 'SMD',
          name: 'SUMUD',
          color: '#3B82F6', // Blue
          captain: 'Team Captain SMD',
          leader: 'Team Leader SMD',
          description: 'SUMUD Team',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          code: 'INT',
          name: 'INTIFADA',
          color: '#10B981', // Green
          captain: 'Team Captain INT',
          leader: 'Team Leader INT',
          description: 'INTIFADA Team',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          code: 'AQS',
          name: 'AQSA',
          color: '#F59E0B', // Yellow
          captain: 'Team Captain AQS',
          leader: 'Team Leader AQS',
          description: 'AQSA Team',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await db.collection('teams').insertMany(teams);
      console.log('✅ Added 3 teams to database');
      
      teams.forEach(team => {
        console.log(`  - ${team.code}: ${team.name} (${team.color})`);
      });
    } else {
      console.log('✅ Teams already exist in database');
      existingTeams.forEach(team => {
        console.log(`  - ${team.code}: ${team.name}`);
      });
    }
    
    // Verify the fix
    const finalTeams = await db.collection('teams').find({}).toArray();
    console.log(`\n🎉 Final teams count: ${finalTeams.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixTeamsCollection();