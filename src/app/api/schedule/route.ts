import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Schedule } from '@/types';

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection<Schedule>('schedule');
    
    const schedules = await collection.find({}).sort({ day: 1 }).toArray();
    
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const collection = db.collection<Schedule>('schedule');
    
    const newSchedule: Schedule = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(newSchedule);
    
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}