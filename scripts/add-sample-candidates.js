const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const sampleCandidates = [
  // SUMUD Team (SMD)
  { chestNumber: 'SMD001', name: 'Ahmed Ali', team: 'SMD', section: 'senior', points: 0 },
  { chestNumber: 'SMD002', name: 'Fatima Hassan', team: 'SMD', section: 'senior', points: 0 },
  { chestNumber: 'SMD003', name: 'Omar Khalil', team: 'SMD', section: 'junior', points: 0 },
  { chestNumber: 'SMD004', name: 'Aisha Mohamed', team: 'SMD', section: 'junior', points: 0 },
  { chestNumber: 'SMD005', name: 'Yusuf Ibrahim', team: 'SMD', section: 'sub-junior', points: 0 },
  { chestNumber: 'SMD006', name: 'Zainab Ahmad', team: 'SMD', section: 'sub-junior', points: 0 },
  { chestNumber: 'SMD007', name: 'Khalid Mansour', team: 'SMD', section: 'senior', points: 0 },
  { chestNumber: 'SMD008', name: 'Mariam Saleh', team: 'SMD', section: 'senior', points: 0 },
  { chestNumber: 'SMD009', name: 'Hassan Noor', team: 'SMD', section: 'junior', points: 0 },
  { chestNumber: 'SMD010', name: 'Layla Farid', team: 'SMD', section: 'junior', points: 0 },
  { chestNumber: 'SMD011', name: 'Saeed Rashid', team: 'SMD', section: 'senior', points: 0 },
  { chestNumber: 'SMD012', name: 'Nour Abdel', team: 'SMD', section: 'senior', points: 0 },

  // INTIFADA Team (INT)
  { chestNumber: 'INT001', name: 'Mahmoud Zaid', team: 'INT', section: 'senior', points: 0 },
  { chestNumber: 'INT002', name: 'Rania Qasem', team: 'INT', section: 'senior', points: 0 },
  { chestNumber: 'INT003', name: 'Tariq Hamad', team: 'INT', section: 'junior', points: 0 },
  { chestNumber: 'INT004', name: 'Dina Fouad', team: 'INT', section: 'junior', points: 0 },
  { chestNumber: 'INT005', name: 'Amjad Samir', team: 'INT', section: 'sub-junior', points: 0 },
  { chestNumber: 'INT006', name: 'Hala Nasser', team: 'INT', section: 'sub-junior', points: 0 },
  { chestNumber: 'INT007', name: 'Fadi Karam', team: 'INT', section: 'senior', points: 0 },
  { chestNumber: 'INT008', name: 'Lina Habib', team: 'INT', section: 'senior', points: 0 },
  { chestNumber: 'INT009', name: 'Sami Taha', team: 'INT', section: 'junior', points: 0 },
  { chestNumber: 'INT010', name: 'Maya Sleiman', team: 'INT', section: 'junior', points: 0 },
  { chestNumber: 'INT011', name: 'Rami Ghazi', team: 'INT', section: 'senior', points: 0 },
  { chestNumber: 'INT012', name: 'Sara Mubarak', team: 'INT', section: 'senior', points: 0 },

  // AQSA Team (AQS)
  { chestNumber: 'AQS001', name: 'Bilal Othman', team: 'AQS', section: 'senior', points: 0 },
  { chestNumber: 'AQS002', name: 'Yasmin Darwish', team: 'AQS', section: 'senior', points: 0 },
  { chestNumber: 'AQS003', name: 'Nader Hijazi', team: 'AQS', section: 'junior', points: 0 },
  { chestNumber: 'AQS004', name: 'Rana Shehab', team: 'AQS', section: 'junior', points: 0 },
  { chestNumber: 'AQS005', name: 'Jad Khoury', team: 'AQS', section: 'sub-junior', points: 0 },
  { chestNumber: 'AQS006', name: 'Lara Badran', team: 'AQS', section: 'sub-junior', points: 0 },
  { chestNumber: 'AQS007', name: 'Wael Masri', team: 'AQS', section: 'senior', points: 0 },
  { chestNumber: 'AQS008', name: 'Nada Qaddoura', team: 'AQS', section: 'senior', points: 0 },
  { chestNumber: 'AQS009', name: 'Karim Sabbagh', team: 'AQS', section: 'junior', points: 0 },
  { chestNumber: 'AQS010', name: 'Laith Awad', team: 'AQS', section: 'junior', points: 0 },
  { chestNumber: 'AQS011', name: 'Tala Najjar', team: 'AQS', section: 'senior', points: 0 },
  { chestNumber: 'AQS012', name: 'Reem Salam', team: 'AQS', section: 'senior', points: 0 }
];

async function addSampleCandidates() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('festival');
    const collection = db.collection('candidates');

    // Clear existing candidates
    await collection.deleteMany({});
    console.log('Cleared existing candidates');

    // Add timestamps to candidates
    const candidatesWithTimestamps = sampleCandidates.map(candidate => ({
      ...candidate,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert sample candidates
    const result = await collection.insertMany(candidatesWithTimestamps);
    console.log(`Inserted ${result.insertedCount} sample candidates`);

    // Display inserted candidates by team
    const candidates = await collection.find({}).toArray();
    
    console.log('\n=== SAMPLE CANDIDATES ADDED ===');
    
    const teams = ['SMD', 'INT', 'AQS'];
    teams.forEach(teamCode => {
      const teamCandidates = candidates.filter(c => c.team === teamCode);
      console.log(`\n🏆 ${teamCode} TEAM (${teamCandidates.length} candidates):`);
      teamCandidates.forEach(c => {
        console.log(`  ${c.chestNumber}: ${c.name} (${c.section})`);
      });
    });

    console.log('\n✅ Sample candidates setup complete!');
    console.log('Now you can:');
    console.log('1. Go to http://localhost:3000/team-admin');
    console.log('2. Select a team (SMD, INT, or AQS)');
    console.log('3. View candidates in the Candidates tab');
    console.log('4. Go to Programmes tab and add participants to programmes');

  } catch (error) {
    console.error('Error adding sample candidates:', error);
  } finally {
    await client.close();
  }
}

addSampleCandidates();