// Run this script to initialize your MongoDB database with sample data
// Usage: node scripts/init-db.js

const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://wattaqa-2k25:DSvR9vIF9JZTuC63@wattaqa-2k25.snkdtfc.mongodb.net/?appName=wattaqa-2k25';
const dbName = 'wattaqa-festival-2k25';

async function initializeDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Initialize Festival Info
    const festivalInfo = {
      name: 'Wattaqa Arts Festival 2K25',
      year: '2025',
      startDate: new Date('2025-03-10'),
      endDate: new Date('2025-03-14'),
      venue: 'Wattaqa School Campus',
      description: 'Annual arts and sports festival celebrating creativity, talent, and teamwork among students.',
      status: 'ongoing',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('festival-info').replaceOne({}, festivalInfo, { upsert: true });
    console.log('✅ Festival info initialized');
    
    // Initialize Teams
    const teams = [
      {
        name: 'Team Sumud',
        color: 'green',
        description: 'Arts & Sports Excellence',
        captain: 'Ahmed Ali (001)',
        members: 45,
        points: 238,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Team Aqsa',
        color: 'gray',
        description: 'Creative & Athletic',
        captain: 'Fatima Hassan (002)',
        members: 45,
        points: 245,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Team Inthifada',
        color: 'red',
        description: 'Innovation & Competition',
        captain: 'Omar Khalil (003)',
        members: 45,
        points: 232,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('teams').deleteMany({});
    await db.collection('teams').insertMany(teams);
    console.log('✅ Teams initialized');
    
    // Initialize Programmes
    const programmes = [
      // Arts Programmes
      { code: 'P001', name: 'Classical Singing', category: 'arts', section: 'senior', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P002', name: 'Group Dance', category: 'arts', section: 'junior', positionType: 'group', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P003', name: 'Painting Competition', category: 'arts', section: 'sub-junior', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P004', name: 'Drama Performance', category: 'arts', section: 'senior', positionType: 'group', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P005', name: 'Poetry Recitation', category: 'arts', section: 'junior', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P006', name: 'Calligraphy', category: 'arts', section: 'general', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P007', name: 'Storytelling', category: 'arts', section: 'sub-junior', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P008', name: 'Instrumental Music', category: 'arts', section: 'senior', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      
      // Sports Programmes
      { code: 'P009', name: 'Football Tournament', category: 'sports', section: 'general', positionType: 'group', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P010', name: 'Basketball', category: 'sports', section: 'senior', positionType: 'group', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P011', name: 'Table Tennis', category: 'sports', section: 'junior', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P012', name: 'Badminton', category: 'sports', section: 'senior', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P013', name: 'Track & Field', category: 'sports', section: 'general', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P014', name: 'Chess Competition', category: 'sports', section: 'junior', positionType: 'individual', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { code: 'P015', name: 'Volleyball', category: 'sports', section: 'senior', positionType: 'group', status: 'active', createdAt: new Date(), updatedAt: new Date() }
    ];
    
    await db.collection('programmes').deleteMany({});
    await db.collection('programmes').insertMany(programmes);
    console.log('✅ Programmes initialized');
    
    // Initialize Schedule
    const schedule = [
      {
        day: 1,
        date: new Date('2025-03-10'),
        title: 'Opening Ceremony & Arts Competitions',
        events: 'Opening Ceremony & Arts Competitions',
        details: 'Classical Singing, Painting, Poetry',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day: 2,
        date: new Date('2025-03-11'),
        title: 'Dance & Drama Performances',
        events: 'Dance & Drama Performances',
        details: 'Group Dance, Drama Performance, Storytelling',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day: 3,
        date: new Date('2025-03-12'),
        title: 'Sports Events & Team Competitions',
        events: 'Sports Events & Team Competitions',
        details: 'Football, Basketball, Table Tennis',
        status: 'in-progress',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day: 4,
        date: new Date('2025-03-13'),
        title: 'Individual Sports & Arts Finals',
        events: 'Individual Sports & Arts Finals',
        details: 'Track & Field, Badminton, Calligraphy',
        status: 'upcoming',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day: 5,
        date: new Date('2025-03-14'),
        title: 'Closing Ceremony & Awards',
        events: 'Closing Ceremony & Awards',
        details: 'Final Results, Prize Distribution, Cultural Show',
        status: 'upcoming',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('schedule').deleteMany({});
    await db.collection('schedule').insertMany(schedule);
    console.log('✅ Schedule initialized');
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('Your festival management system is now ready with sample data.');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await client.close();
  }
}

initializeDatabase();