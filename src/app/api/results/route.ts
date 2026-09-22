import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Result } from '@/types';
import { ObjectId } from 'mongodb';
import { syncResultToSheets } from '@/lib/googleSheets';
import { cookies } from 'next/headers';


export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection<Result>('results');
    
    const cookieStore = await cookies();
    const activeFestId = cookieStore.get('activeFestId')?.value;
    
    let query: any = {};
    if (activeFestId) {
      query.festId = activeFestId;
    }
    
    const results = await collection.find(query).toArray();
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Add record to MongoDB
    const db = await getDatabase();
    const collection = db.collection<Result>('results');
    
    const cookieStore = await cookies();
    const activeFestId = cookieStore.get('activeFestId')?.value;

    const { _id, ...bodyWithoutId } = body;
    const newResult: Result & { festId?: string } = {
      ...bodyWithoutId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (activeFestId) {
      newResult.festId = activeFestId;
    }
    
    const result = await collection.insertOne(newResult);
    
    // Prepare result for Google Sheets sync
    const resultWithId = {
      _id: result.insertedId,
      ...newResult
    };
    
    // Auto-sync to Google Sheets
    try {
      await syncResultToSheets(resultWithId);
    } catch (syncError) {
      console.error('Error syncing to sheets:', syncError);
      // Don't fail the main operation if sync fails
    }
    
    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error creating result:', error);
    return NextResponse.json({ error: 'Failed to create result' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Update record in MongoDB
    const db = await getDatabase();
    const collection = db.collection<Result>('results');
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...body, 
          updatedAt: new Date() 
        } 
      }
    );

    // Auto-sync to Google Sheets
    try {
      // Get the updated result for sync
      const updatedResult = await collection.findOne({ _id: new ObjectId(id) });
      if (updatedResult) {
        await syncResultToSheets(updatedResult);
      }
    } catch (syncError) {
      console.error('Error syncing to sheets:', syncError);
      // Don't fail the main operation if sync fails
    }
    
    return NextResponse.json({ success: true, message: 'Result updated successfully' });
  } catch (error) {
    console.error('Error updating result:', error);
    return NextResponse.json({ error: 'Failed to update result' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }

    // Delete record from MongoDB
    const db = await getDatabase();
    const collection = db.collection<Result>('results');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    // Note: For deletion, we don't sync individual records to sheets
    // The sheets sync would need to be a full resync to remove the deleted record
    
    return NextResponse.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
  }
}