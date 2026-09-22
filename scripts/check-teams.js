const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkTeams() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('festival');
    const teams = await db.collection('teams').find({}).toArray();
    
    console.log('📊 Teams in database:');
    teams.forEach(team => {
      console.log(`  ${team.code}: ${team.name} (${team.color})`);
    });
    
    // Check if AQA exists instead of AQS
    const aqa = teams.find(t => t.code === 'AQA');
    const aqs = teams.find(t => t.code === 'AQS');
    
    if (aqa && !aqs) {
      console.log('\n🔧 Found AQA instead of AQS, fixing...');
      await db.collection('teams').updateOne(
        { code: 'AQA' },
        { $set: { code: 'AQS' } }
      );
      console.log('✅ Updated AQA to AQS');
    } else if (!aqa && !aqs) {
      console.log('\n❌ Neither AQA nor AQS found, creating AQS...');
      await db.collection('teams').insertOne({
        code: 'AQS',
        name: 'AQSA',
        color: '#F59E0B',
        captain: 'Team Captain AQS',
        leader: 'Team Leader AQS',
        description: 'AQSA Team',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created AQS team');
    } else {
      console.log('\n✅ Teams are correct');
    }
    
    // Show final teams
    const finalTeams = await db.collection('teams').find({}).toArray();
    console.log('\n📋 Final teams:');
    finalTeams.forEach(team => {
      console.log(`  ${team.code}: ${team.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkTeams();