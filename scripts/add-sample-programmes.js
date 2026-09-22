const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const sampleProgrammes = [
  // Sports Programmes
  {
    code: 'SP001',
    name: 'Football (Senior Boys)',
    category: 'sports',
    section: 'senior',
    positionType: 'group',
    requiredParticipants: 11,
    status: 'active'
  },
  {
    code: 'SP002', 
    name: 'Basketball (Junior Girls)',
    category: 'sports',
    section: 'junior',
    positionType: 'group',
    requiredParticipants: 5,
    status: 'active'
  },
  {
    code: 'SP003',
    name: 'Athletics 100m (Senior)',
    category: 'sports',
    section: 'senior',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  },
  
  // Sports General Programmes
  {
    code: 'SPG001',
    name: 'Marathon (Open)',
    category: 'sports',
    section: 'general',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  },
  {
    code: 'SPG002',
    name: 'Tug of War (Open)',
    category: 'sports',
    section: 'general',
    positionType: 'group',
    requiredParticipants: 8,
    status: 'active'
  },

  // Arts Stage Programmes
  {
    code: 'AS001',
    name: 'Classical Dance (Senior)',
    category: 'arts',
    subcategory: 'stage',
    section: 'senior',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  },
  {
    code: 'AS002',
    name: 'Group Song (Junior)',
    category: 'arts',
    subcategory: 'stage',
    section: 'junior',
    positionType: 'group',
    requiredParticipants: 6,
    status: 'active'
  },
  {
    code: 'AS003',
    name: 'Drama (Sub Junior)',
    category: 'arts',
    subcategory: 'stage',
    section: 'sub-junior',
    positionType: 'group',
    requiredParticipants: 8,
    status: 'active'
  },

  // Arts Stage General Programmes
  {
    code: 'ASG001',
    name: 'Fashion Show (Open)',
    category: 'arts',
    subcategory: 'stage',
    section: 'general',
    positionType: 'group',
    requiredParticipants: 10,
    status: 'active'
  },
  {
    code: 'ASG002',
    name: 'Stand-up Comedy (Open)',
    category: 'arts',
    subcategory: 'stage',
    section: 'general',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  },

  // Arts Non-Stage Programmes
  {
    code: 'AN001',
    name: 'Painting (Senior)',
    category: 'arts',
    subcategory: 'non-stage',
    section: 'senior',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  },
  {
    code: 'AN002',
    name: 'Calligraphy (Junior)',
    category: 'arts',
    subcategory: 'non-stage',
    section: 'junior',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  },
  {
    code: 'AN003',
    name: 'Craft Making (Sub Junior)',
    category: 'arts',
    subcategory: 'non-stage',
    section: 'sub-junior',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  },

  // Arts Non-Stage General Programmes
  {
    code: 'ANG001',
    name: 'Photography Contest (Open)',
    category: 'arts',
    subcategory: 'non-stage',
    section: 'general',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  },
  {
    code: 'ANG002',
    name: 'Digital Art (Open)',
    category: 'arts',
    subcategory: 'non-stage',
    section: 'general',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  },

  // General Programmes
  {
    code: 'GEN001',
    name: 'Quiz Competition',
    category: 'general',
    section: 'general',
    positionType: 'group',
    requiredParticipants: 3,
    status: 'active'
  },
  {
    code: 'GEN002',
    name: 'Debate Competition',
    category: 'general',
    section: 'general',
    positionType: 'individual',
    requiredParticipants: 1,
    status: 'active'
  }
];

async function addSampleProgrammes() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('festival');
    const collection = db.collection('programmes');

    // Clear existing programmes
    await collection.deleteMany({});
    console.log('Cleared existing programmes');

    // Add timestamps to programmes
    const programmesWithTimestamps = sampleProgrammes.map(programme => ({
      ...programme,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert sample programmes
    const result = await collection.insertMany(programmesWithTimestamps);
    console.log(`Inserted ${result.insertedCount} sample programmes`);

    // Display inserted programmes by category
    const programmes = await collection.find({}).toArray();
    
    console.log('\n=== SAMPLE PROGRAMMES ADDED ===');
    console.log('\n🏃 SPORTS PROGRAMMES:');
    programmes.filter(p => p.category === 'sports' && p.section !== 'general')
      .forEach(p => console.log(`  ${p.code}: ${p.name} (${p.section}, ${p.requiredParticipants} participants)`));
    
    console.log('\n🏃 SPORTS GENERAL PROGRAMMES:');
    programmes.filter(p => p.category === 'sports' && p.section === 'general')
      .forEach(p => console.log(`  ${p.code}: ${p.name} (${p.section}, ${p.requiredParticipants} participants)`));
    
    console.log('\n🎭 ARTS STAGE PROGRAMMES:');
    programmes.filter(p => p.category === 'arts' && p.subcategory === 'stage' && p.section !== 'general')
      .forEach(p => console.log(`  ${p.code}: ${p.name} (${p.section}, ${p.requiredParticipants} participants)`));
    
    console.log('\n🎭 ARTS STAGE GENERAL PROGRAMMES:');
    programmes.filter(p => p.category === 'arts' && p.subcategory === 'stage' && p.section === 'general')
      .forEach(p => console.log(`  ${p.code}: ${p.name} (${p.section}, ${p.requiredParticipants} participants)`));
    
    console.log('\n🎨 ARTS NON-STAGE PROGRAMMES:');
    programmes.filter(p => p.category === 'arts' && p.subcategory === 'non-stage' && p.section !== 'general')
      .forEach(p => console.log(`  ${p.code}: ${p.name} (${p.section}, ${p.requiredParticipants} participants)`));
    
    console.log('\n🎨 ARTS NON-STAGE GENERAL PROGRAMMES:');
    programmes.filter(p => p.category === 'arts' && p.subcategory === 'non-stage' && p.section === 'general')
      .forEach(p => console.log(`  ${p.code}: ${p.name} (${p.section}, ${p.requiredParticipants} participants)`));
    
    console.log('\n🌟 GENERAL PROGRAMMES:');
    programmes.filter(p => p.category === 'general')
      .forEach(p => console.log(`  ${p.code}: ${p.name} (${p.section}, ${p.requiredParticipants} participants)`));

    console.log('\n✅ Sample programmes setup complete!');
    console.log('You can now test the Team Admin Portal at: http://localhost:3000/team-admin');

  } catch (error) {
    console.error('Error adding sample programmes:', error);
  } finally {
    await client.close();
  }
}

addSampleProgrammes();