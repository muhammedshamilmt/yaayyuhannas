const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function updateTeams() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    const collection = db.collection('teams');
    
    console.log('Fetching existing teams...');
    const existingTeams = await collection.find({}).toArray();
    
    if (existingTeams.length !== 3) {
      console.log(`Expected 3 teams, found ${existingTeams.length}. Aborting.`);
      return;
    }

    const updates = [
      {
        name: 'ADĀLAH',
        code: 'ADL',
        color: '#3b82f6', // Blue
        description: 'Justice',
      },
      {
        name: 'SHAJĀʿAH',
        code: 'SHJ',
        color: '#ef4444', // Red
        description: 'Bravery',
      },
      {
        name: 'QIYĀDAH',
        code: 'QIY',
        color: '#22c55e', // Green
        description: 'Leadership',
      }
    ];
    
    for (let i = 0; i < 3; i++) {
      const teamToUpdate = existingTeams[i];
      const updateData = updates[i];
      
      console.log(`Updating ${teamToUpdate.code} -> ${updateData.code}`);
      
      await collection.updateOne(
        { _id: teamToUpdate._id },
        { 
          $set: {
            name: updateData.name,
            code: updateData.code,
            color: updateData.color,
            description: updateData.description,
            updatedAt: new Date()
          }
        }
      );
    }
    
    console.log('Successfully updated the teams while keeping the emails and IDs!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateTeams();
