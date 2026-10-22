import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Programme } from '@/types';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { resolveActiveFestId, getFestIdFilter } from '@/lib/festHelper';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const db = await getDatabase();
    const collection = db.collection<Programme>('programmes');
    
    const cookieStore = await cookies();
    const activeFestId = await resolveActiveFestId(db, {
      requestedFestId: searchParams.get('festId'),
      cookieFestId: cookieStore.get('activeFestId')?.value,
      allowInactiveAdmin: true
    });

    // If ID is provided, fetch single programme
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid programme ID' }, { status: 400 });
      }

      const programme = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!programme) {
        return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
      }

      // Check if this programme belongs to the active fest
      const progFestId = programme.festId?.toString();
      if (progFestId && progFestId !== activeFestId) {
        // If programme is from another/inactive fest, find matching one in active fest
        const activeMatch = await collection.findOne({
          code: programme.code,
          section: programme.section,
          festId: getFestIdFilter(activeFestId)
        });
        if (activeMatch) {
          return NextResponse.json(activeMatch);
        }
        return NextResponse.json({ error: 'Programme belongs to an inactive festival' }, { status: 404 });
      }
      
      return NextResponse.json(programme);
    }
    
    // Otherwise, fetch all programmes for the active festival
    let query: any = {
      name: { $exists: true, $ne: '', $ne: null },
      code: { $exists: true, $ne: '', $ne: null },
      category: { $exists: true, $ne: '', $ne: null },
      section: { $exists: true, $ne: '', $ne: null },
      positionType: { $exists: true, $ne: '', $ne: null },
      festId: getFestIdFilter(activeFestId)
    };
    
    let programmes = await collection.find(query).toArray();
    
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
    const activeFestId = await resolveActiveFestId(db, {
      cookieFestId: cookieStore.get('activeFestId')?.value
    });

    const { _id, ...bodyWithoutId } = body;
    const newProgramme: Programme & { festId?: string } = {
      ...bodyWithoutId,
      festId: activeFestId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
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