import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Programme } from '@/types';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const db = await getDatabase();
    const collection = db.collection<Programme>('programmes');
    
    // If ID is provided, fetch single programme
    if (id) {
      const programme = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!programme) {
        return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
      }
      
      return NextResponse.json(programme);
    }
    
    // Otherwise, fetch all programmes
    // Filter out blank/empty programmes using MongoDB query
    const cookieStore = await cookies();
    let activeFestId = searchParams.get('festId') || cookieStore.get('activeFestId')?.value;
    
    // If no activeFestId provided, automatically default to the active festival
    if (!activeFestId) {
      const activeFest = await db.collection('fests').findOne({ status: 'active', name: /wattaqa/i })
        || await db.collection('fests').findOne({ status: 'active' });
      if (activeFest) {
        activeFestId = activeFest._id.toString();
      }
    }
    
    let query: any = {
      name: { $exists: true, $ne: '', $ne: null },
      code: { $exists: true, $ne: '', $ne: null },
      category: { $exists: true, $ne: '', $ne: null },
      section: { $exists: true, $ne: '', $ne: null },
      positionType: { $exists: true, $ne: '', $ne: null }
    };
    
    if (activeFestId) {
      const festIdValues: any[] = [activeFestId];
      if (ObjectId.isValid(activeFestId)) {
        festIdValues.push(new ObjectId(activeFestId));
      }
      query.festId = { $in: festIdValues };
    }
    
    let programmes = await collection.find(query).toArray();
    
    // Fallback: If 0 programmes returned for selected festId, fallback to active Wattaqa fest
    if (programmes.length === 0 && activeFestId) {
      const defaultFest = await db.collection('fests').findOne({ name: /wattaqa/i });
      if (defaultFest && defaultFest._id.toString() !== activeFestId) {
        programmes = await collection.find({
          ...query,
          festId: { $in: [defaultFest._id.toString(), defaultFest._id] }
        }).toArray();
      }
    }
    
    return NextResponse.json(programmes);
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return NextResponse.json({ error: 'Failed to fetch programmes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const collection = db.collection<Programme>('programmes');
    
    const cookieStore = await cookies();
    const activeFestId = cookieStore.get('activeFestId')?.value;

    const { _id, ...bodyWithoutId } = body;
    const newProgramme: Programme & { festId?: string } = {
      ...bodyWithoutId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (activeFestId) {
      newProgramme.festId = activeFestId;
    }
    
    const result = await collection.insertOne(newProgramme);
    
    // Auto-sync to Google Sheets
    try {
      const { sheetsSync } = await import('@/lib/sheetsSync');
      await sheetsSync.syncToSheets('programmes');
    } catch (syncError) {
      console.error('Error syncing to sheets:', syncError);
      // Don't fail the main operation if sync fails
    }
    
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating programme:', error);
    return NextResponse.json({ error: 'Failed to create programme' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    const body = await request.json();
    if (!id && (body._id || body.id)) {
      id = body._id || body.id;
    }
    
    if (!id) {
      return NextResponse.json({ error: 'Programme ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<Programme>('programmes');
    
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    delete updateData._id;
    delete updateData.id;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
    }
    
    // Auto-sync to Google Sheets in background
    import('@/lib/sheetsSync')
      .then(({ sheetsSync }) => sheetsSync.syncToSheets('programmes'))
      .catch(syncError => console.error('Error syncing to sheets in background:', syncError));

    return NextResponse.json({ success: true, message: 'Programme updated successfully' });
  } catch (error) {
    console.error('Error updating programme:', error);
    return NextResponse.json({ error: 'Failed to update programme' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Programme ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<Programme>('programmes');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
    }
    
    // Auto-sync to Google Sheets
    try {
      const { sheetsSync } = await import('@/lib/sheetsSync');
      await sheetsSync.syncToSheets('programmes');
    } catch (syncError) {
      console.error('Error syncing to sheets:', syncError);
      // Don't fail the main operation if sync fails
    }
    
    return NextResponse.json({ success: true, message: 'Programme deleted successfully' });
  } catch (error) {
    console.error('Error deleting programme:', error);
    return NextResponse.json({ error: 'Failed to delete programme' }, { status: 500 });
  }
}