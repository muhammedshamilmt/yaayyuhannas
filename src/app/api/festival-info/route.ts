import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { FestivalInfo } from '@/types';
import { ObjectId } from 'mongodb';


export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection<FestivalInfo>('festival-info');
    
    let festivalInfo = await collection.findOne({});
    
    // If no festival info exists, create default data
    if (!festivalInfo) {
      const defaultInfo: FestivalInfo = {
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
      
      const result = await collection.insertOne(defaultInfo);
      festivalInfo = { ...defaultInfo, _id: result.insertedId.toString() };
    }
    
    return NextResponse.json(festivalInfo);
  } catch (error) {
    console.error('Error fetching festival info:', error);
    return NextResponse.json({ error: 'Failed to fetch festival info' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Update record in MongoDB
    const db = await getDatabase();
    const collection = db.collection<FestivalInfo>('festival-info');
    
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    const result = await collection.updateOne(
      {},
      { $set: updateData },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error updating festival info:', error);
    return NextResponse.json({ error: 'Failed to update festival info' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Add record to MongoDB
    const db = await getDatabase();
    const collection = db.collection<FestivalInfo>('festival-info');
    
    const result = await collection.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error creating festival info:', error);
    return NextResponse.json({ error: 'Failed to create festival info' }, { status: 500 });
  }
}