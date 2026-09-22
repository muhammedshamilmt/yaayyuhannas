import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const fest = await db.collection('fests').findOne({ _id: new ObjectId(id) });
    
    if (!fest) {
      return NextResponse.json({ error: 'Fest not found' }, { status: 404 });
    }
    
    return NextResponse.json(fest);
  } catch (error) {
    console.error('Error fetching fest:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fest' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const data = await request.json();
    const updateData: any = { updatedAt: new Date() };
    
    if (data.name) updateData.name = data.name;
    if (data.year) updateData.year = data.year;
    if (data.status) updateData.status = data.status;
    
    const result = await db.collection('fests').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ error: 'Fest not found' }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating fest:', error);
    return NextResponse.json(
      { error: 'Failed to update fest' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const result = await db.collection('fests').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Fest not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Fest deleted successfully' });
  } catch (error) {
    console.error('Error deleting fest:', error);
    return NextResponse.json(
      { error: 'Failed to delete fest' },
      { status: 500 }
    );
  }
}
