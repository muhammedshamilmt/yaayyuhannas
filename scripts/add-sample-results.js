const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const sampleResults = [
  // Sports Results
  {
    programme: 'SP001', // Football (Senior Boys)
    section: 'senior',
    positionType: 'group',
    firstPlace: [
      { chestNumber: 'SMD001' }, { chestNumber: 'SMD007' }, { chestNumber: 'SMD011' },
      { chestNumber: 'SMD012' }, { chestNumber: 'SMD002' }, { chestNumber: 'SMD008' },
      { chestNumber: 'SMD003' }, { chestNumber: 'SMD009' }, { chestNumber: 'SMD004' },
      { chestNumber: 'SMD010' }, { chestNumber: 'SMD005' }
    ],
    secondPlace: [
      { chestNumber: 'INT001' }, { chestNumber: 'INT007' }, { chestNumber: 'INT011' },
      { chestNumber: 'INT012' }, { chestNumber: 'INT002' }, { chestNumber: 'INT008' },
      { chestNumber: 'INT003' }, { chestNumber: 'INT009' }, { chestNumber: 'INT004' },
      { chestNumber: 'INT010' }, { chestNumber: 'INT005' }
    ],
    thirdPlace: [
      { chestNumber: 'AQS001' }, { chestNumber: 'AQS007' }, { chestNumber: 'AQS011' },
      { chestNumber: 'AQS012' }, { chestNumber: 'AQS002' }, { chestNumber: 'AQS008' },
      { chestNumber: 'AQS003' }, { chestNumber: 'AQS009' }, { chestNumber: 'AQS004' },
      { chestNumber: 'AQS010' }, { chestNumber: 'AQS005' }
    ],
    firstPoints: 15,
    secondPoints: 10,
    thirdPoints: 5,
    notes: 'Exciting match with great teamwork from all teams'
  },
  {
    programme: 'SP002', // Basketball (Junior Girls)
    section: 'junior',
    positionType: 'group',
    firstPlace: [
      { chestNumber: 'INT004' }, { chestNumber: 'INT010' }, { chestNumber: 'INT003' },
      { chestNumber: 'INT009' }, { chestNumber: 'INT006' }
    ],
    secondPlace: [
      { chestNumber: 'AQS004' }, { chestNumber: 'AQS010' }, { chestNumber: 'AQS003' },
      { chestNumber: 'AQS009' }, { chestNumber: 'AQS006' }
    ],
    thirdPlace: [
      { chestNumber: 'SMD004' }, { chestNumber: 'SMD010' }, { chestNumber: 'SMD003' },
      { chestNumber: 'SMD009' }, { chestNumber: 'SMD006' }
    ],
    firstPoints: 12,
    secondPoints: 8,
    thirdPoints: 4,
    notes: 'Close competition with excellent sportsmanship'
  },
  {
    programme: 'SP003', // Athletics 100m (Senior)
    section: 'senior',
    positionType: 'individual',
    firstPlace: [{ chestNumber: 'AQS001' }],
    secondPlace: [{ chestNumber: 'SMD001' }],
    thirdPlace: [{ chestNumber: 'INT001' }],
    firstPoints: 10,
    secondPoints: 6,
    thirdPoints: 3,
    notes: 'Record-breaking performance by AQS001'
  },

  // Arts Results
  {
    programme: 'AS001', // Classical Dance (Senior)
    section: 'senior',
    positionType: 'individual',
    firstPlace: [{ chestNumber: 'SMD002' }],
    secondPlace: [{ chestNumber: 'INT002' }],
    thirdPlace: [{ chestNumber: 'AQS002' }],
    firstPoints: 8,
    secondPoints: 5,
    thirdPoints: 2,
    notes: 'Beautiful performances showcasing cultural heritage'
  },
  {
    programme: 'AS002', // Group Song (Junior)
    section: 'junior',
    positionType: 'group',
    firstPlace: [
      { chestNumber: 'AQS003' }, { chestNumber: 'AQS004' }, { chestNumber: 'AQS009' },
      { chestNumber: 'AQS010' }, { chestNumber: 'AQS005' }, { chestNumber: 'AQS006' }
    ],
    secondPlace: [
      { chestNumber: 'SMD003' }, { chestNumber: 'SMD004' }, { chestNumber: 'SMD009' },
      { chestNumber: 'SMD010' }, { chestNumber: 'SMD005' }, { chestNumber: 'SMD006' }
    ],
    thirdPlace: [
      { chestNumber: 'INT003' }, { chestNumber: 'INT004' }, { chestNumber: 'INT009' },
      { chestNumber: 'INT010' }, { chestNumber: 'INT005' }, { chestNumber: 'INT006' }
    ],
    firstPoints: 10,
    secondPoints: 6,
    thirdPoints: 3,
    notes: 'Harmonious melodies filled the auditorium'
  },
  {
    programme: 'AN001', // Painting (Senior)
    section: 'senior',
    positionType: 'individual',
    firstPlace: [{ chestNumber: 'INT007' }],
    secondPlace: [{ chestNumber: 'AQS007' }],
    thirdPlace: [{ chestNumber: 'SMD007' }],
    firstPoints: 6,
    secondPoints: 4,
    thirdPoints: 2,
    notes: 'Creative masterpieces displayed exceptional artistic talent'
  },

  // General Programme Results
  {
    programme: 'GEN001', // Quiz Competition
    section: 'general',
    positionType: 'group',
    firstPlace: [
      { chestNumber: 'SMD011' }, { chestNumber: 'SMD012' }, { chestNumber: 'SMD001' }
    ],
    secondPlace: [
      { chestNumber: 'AQS011' }, { chestNumber: 'AQS012' }, { chestNumber: 'AQS001' }
    ],
    thirdPlace: [
      { chestNumber: 'INT011' }, { chestNumber: 'INT012' }, { chestNumber: 'INT001' }
    ],
    firstPoints: 12,
    secondPoints: 8,
    thirdPoints: 4,
    notes: 'Intense battle of knowledge and quick thinking'
  },
  {
    programme: 'GEN002', // Debate Competition
    section: 'general',
    positionType: 'individual',
    firstPlace: [{ chestNumber: 'AQS008' }],
    secondPlace: [{ chestNumber: 'SMD008' }],
    thirdPlace: [{ chestNumber: 'INT008' }],
    firstPoints: 8,
    secondPoints: 5,
    thirdPoints: 2,
    notes: 'Compelling arguments and excellent oratory skills'
  }
];

async function addSampleResults() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('festival');
    const collection = db.collection('results');

    // Clear existing results
    await collection.deleteMany({});
    console.log('Cleared existing results');

    // Add timestamps to results
    const resultsWithTimestamps = sampleResults.map(result => ({
      ...result,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert sample results
    const result = await collection.insertMany(resultsWithTimestamps);
    console.log(`Inserted ${result.insertedCount} sample results`);

    // Update candidate points based on results
    const candidatesCollection = db.collection('candidates');
    
    for (const resultData of sampleResults) {
      // Update first place winners
      for (const winner of resultData.firstPlace) {
        await candidatesCollection.updateOne(
          { chestNumber: winner.chestNumber },
          { $inc: { points: resultData.firstPoints } }
        );
      }
      
      // Update second place winners
      for (const winner of resultData.secondPlace) {
        await candidatesCollection.updateOne(
          { chestNumber: winner.chestNumber },
          { $inc: { points: resultData.secondPoints } }
        );
      }
      
      // Update third place winners
      for (const winner of resultData.thirdPlace) {
        await candidatesCollection.updateOne(
          { chestNumber: winner.chestNumber },
          { $inc: { points: resultData.thirdPoints } }
        );
      }
    }

    // Update team points
    const teamsCollection = db.collection('teams');
    const teams = ['SMD', 'INT', 'AQS'];
    
    for (const teamCode of teams) {
      const teamCandidates = await candidatesCollection.find({ team: teamCode }).toArray();
      const totalPoints = teamCandidates.reduce((sum, candidate) => sum + candidate.points, 0);
      
      await teamsCollection.updateOne(
        { code: teamCode },
        { $set: { points: totalPoints } }
      );
    }

    console.log('\n=== SAMPLE RESULTS ADDED ===');
    console.log('✅ Results created for multiple programmes');
    console.log('✅ Candidate points updated');
    console.log('✅ Team points calculated');
    console.log('\nNow you can:');
    console.log('1. Go to http://localhost:3000/team-admin');
    console.log('2. Select a team and view Results page');
    console.log('3. Check Rankings to see team standings');
    console.log('4. View individual candidate performance');

  } catch (error) {
    console.error('Error adding sample results:', error);
  } finally {
    await client.close();
  }
}

addSampleResults();