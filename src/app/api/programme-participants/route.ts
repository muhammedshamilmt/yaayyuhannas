import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { syncProgrammeRegistrationToSheets } from '@/lib/googleSheets';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function connectToDatabase() {
  const client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function GET(request: NextRequest) {
  let client;
  try {
    client = await connectToDatabase();
    const db = client.db('wattaqa-festival-2k25');
    const collection = db.collection('programme_participants');

    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');
    const programme = searchParams.get('programme');
    const programmeId = searchParams.get('programmeId');

    let query: any = {};
    if (team) query.teamCode = team;
    if (programme) query.programmeId = programme;
    if (programmeId) query.programmeId = programmeId;

    const participants = await collection.find(query).toArray();
    
    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error fetching programme participants:', error);
    return NextResponse.json({ error: 'Failed to fetch programme participants' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  try {
    client = await connectToDatabase();
    const db = client.db('wattaqa-festival-2k25');
    const collection = db.collection('programme_participants');

    const body = await request.json();
    const { programmeId, programmeCode, programmeName, teamCode, participants, status = 'registered' } = body;

    // Validate required fields
    if (!programmeId || !teamCode || !participants || participants.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if team already registered for this programme
    const existing = await collection.findOne({
      programmeId,
      teamCode
    });

    if (existing) {
      return NextResponse.json({ error: 'Team already registered for this programme' }, { status: 400 });
    }

    const newParticipant = {
      programmeId,
      programmeCode,
      programmeName,
      teamCode,
      participants,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newParticipant);
    
    const createdParticipant = {
      _id: result.insertedId,
      ...newParticipant
    };
    
    // Sync to Google Sheets (don't block the response if it fails)
    try {
      await syncProgrammeRegistrationToSheets(createdParticipant);
      console.log(`✅ Programme registration synced to Google Sheets for team ${teamCode}`);
    } catch (error) {
      console.error('⚠️ Failed to sync to Google Sheets, but registration was saved:', error);
    }
    
    return NextResponse.json(createdParticipant, { status: 201 });
  } catch (error) {
    console.error('Error creating programme participant:', error);
    return NextResponse.json({ error: 'Failed to create programme participant' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function PUT(request: NextRequest) {
  let client;
  try {
    client = await connectToDatabase();
    const db = client.db('wattaqa-festival-2k25');
    const collection = db.collection('programme_participants');

    const body = await request.json();
    const { _id, programmeId, teamCode, participants, status } = body;

    // Support both _id and programmeId+teamCode for updates
    let query: any = {};
    if (_id) {
      query._id = new ObjectId(_id);
    } else if (programmeId && teamCode) {
      query = { programmeId, teamCode };
    } else {
      return NextResponse.json({ error: 'Either _id or both programmeId and teamCode are required' }, { status: 400 });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (participants) updateData.participants = participants;
    if (status) updateData.status = status;

    const result = await collection.updateOne(query, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Programme participant not found' }, { status: 404 });
    }

    // Get the updated document for syncing
    const updatedDoc = await collection.findOne(query);
    
    // Sync to Google Sheets (don't block the response if it fails)
    try {
      if (updatedDoc) {
        await syncProgrammeRegistrationToSheets(updatedDoc);
        console.log(`✅ Programme registration update synced to Google Sheets for team ${updatedDoc.teamCode}`);
      }
    } catch (error) {
      console.error('⚠️ Failed to sync update to Google Sheets, but update was saved:', error);
    }

    return NextResponse.json({ message: 'Programme participant updated successfully' });
  } catch (error) {
    console.error('Error updating programme participant:', error);
    return NextResponse.json({ error: 'Failed to update programme participant' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function DELETE(request: NextRequest) {
  let client;
  try {
    client = await connectToDatabase();
    const db = client.db('wattaqa-festival-2k25');
    const collection = db.collection('programme_participants');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Programme participant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Programme participant deleted successfully' });
  } catch (error) {
    console.error('Error deleting programme participant:', error);
    return NextResponse.json({ error: 'Failed to delete programme participant' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}