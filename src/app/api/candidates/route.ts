import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Candidate } from '@/types';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');
    
    const db = await getDatabase();
    const collection = db.collection<Candidate>('candidates');
    
    // Build query with team filter if provided
    let query: any = {
      name: { $exists: true, $ne: '', $ne: null },
      chestNumber: { $exists: true, $ne: '', $ne: null },
      team: { $exists: true, $ne: '', $ne: null },
      section: { $exists: true, $ne: '', $ne: null }
    };
    
    // Add team filter if specified
    if (team) {
      query.team = team;
    }
    
    // Add festId filter
    const cookieStore = await cookies();
    const activeFestId = cookieStore.get('activeFestId')?.value;
    if (activeFestId) {
      query.festId = activeFestId;
    }
    
    const candidates = await collection.find(query).toArray();
    
    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const collection = db.collection<Candidate>('candidates');
    
    const cookieStore = await cookies();
    const activeFestId = cookieStore.get('activeFestId')?.value;

    const { _id, ...bodyWithoutId } = body;
    const newCandidate: Candidate & { festId?: string } = {
      ...bodyWithoutId,
      points: 0, // New candidates start with 0 points
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (activeFestId) {
      newCandidate.festId = activeFestId;
    }
    
    const result = await collection.insertOne(newCandidate);
    
    // Note: Candidates sync with Google Sheets through manual sync operations only
    // This prevents quota issues and allows for better control
    
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Update record in MongoDB
    const db = await getDatabase();
    const collection = db.collection<Candidate>('candidates');
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...body, 
          updatedAt: new Date() 
        } 
      }
    );

    // Note: Candidates sync with Google Sheets through manual sync operations only
    
    return NextResponse.json({ success: true, message: 'Candidate updated successfully' });
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    // Delete record from MongoDB
    const db = await getDatabase();
    const collection = db.collection<Candidate>('candidates');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    // Note: Candidates sync with Google Sheets through manual sync operations only
    
    return NextResponse.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}