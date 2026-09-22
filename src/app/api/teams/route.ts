import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Team } from '@/types';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection<Team>('teams');
    
    const cookieStore = await cookies();
    const activeFestId = cookieStore.get('activeFestId')?.value;
    
    let query: any = {};
    if (activeFestId) {
      query.festId = activeFestId;
    }
    
    let teams = await collection.find(query).toArray();
    
    // If no teams exist, create the 3 fixed festival teams
    // These teams are permanent and cannot be deleted
    if (teams.length === 0) {
      const defaultTeams: Team[] = [
        {
          code: 'SMD',
          name: 'SUMUD',
          color: '#22C55E',
          description: 'Team Sumud - Steadfastness and Perseverance',
          captain: 'To be assigned',
          captainEmail: '',
          members: 0,
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(activeFestId && { festId: activeFestId })
        },
        {
          code: 'INT',
          name: 'INTIFADA',
          color: '#EF4444',
          description: 'Team Intifada - Uprising and Resistance',
          captain: 'To be assigned',
          captainEmail: '',
          members: 0,
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(activeFestId && { festId: activeFestId })
        },
        {
          code: 'AQS',
          name: 'AQSA',
          color: '#374151',
          description: 'Team Aqsa - Sacred and Noble',
          captain: 'To be assigned',
          captainEmail: '',
          members: 0,
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(activeFestId && { festId: activeFestId })
        }
      ];
      
      await collection.insertMany(defaultTeams);
      teams = await collection.find({}).toArray();
    }
    
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const collection = db.collection<Team>('teams');
    
    // Check if team code already exists
    const existingTeam = await collection.findOne({ code: body.code });
    if (existingTeam) {
      return NextResponse.json({ error: 'Team code already exists' }, { status: 400 });
    }
    
    const cookieStore = await cookies();
    const activeFestId = cookieStore.get('activeFestId')?.value;

    const { _id, ...bodyWithoutId } = body;
    const newTeam: Team & { festId?: string } = {
      ...bodyWithoutId,
      members: 0,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (activeFestId) {
      newTeam.festId = activeFestId;
    }
    
    const result = await collection.insertOne(newTeam);
    
    // Sync to Google Sheets
    try {
      const { sheetsSync } = await import('@/lib/sheetsSync');
      await sheetsSync.syncToSheets('teams');
      console.log('✅ Team synced to Google Sheets');
    } catch (syncError) {
      console.error('❌ Error syncing team to Google Sheets:', syncError);
      // Don't fail the request if sync fails
    }
    
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const db = await getDatabase();
    const collection = db.collection<Team>('teams');
    
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    delete updateData._id;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Sync to Google Sheets
    try {
      const { sheetsSync } = await import('@/lib/sheetsSync');
      await sheetsSync.syncToSheets('teams');
      console.log('✅ Team updated and synced to Google Sheets');
    } catch (syncError) {
      console.error('❌ Error syncing team to Google Sheets:', syncError);
      // Don't fail the request if sync fails
    }

    return NextResponse.json({ success: true, message: 'Team updated successfully' });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Note: The three main festival teams (SMD, INT, AQS) should not be deleted
    // This endpoint is kept for compatibility but main teams are protected
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');
    
    // Check if this is one of the main teams
    const team = await collection.findOne({ _id: new ObjectId(id) });
    if (team && ['SUMUD', 'INTIFADA', 'AQSA'].includes(team.name)) {
      return NextResponse.json({ error: 'Cannot delete main festival teams' }, { status: 403 });
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Sync to Google Sheets
    try {
      const { sheetsSync } = await import('@/lib/sheetsSync');
      await sheetsSync.syncToSheets('teams');
      console.log('✅ Team deleted and synced to Google Sheets');
    } catch (syncError) {
      console.error('❌ Error syncing team deletion to Google Sheets:', syncError);
      // Don't fail the request if sync fails
    }

    return NextResponse.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}