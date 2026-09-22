import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Candidate } from '@/types';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection<Candidate>('candidates');
    
    // Build query for UNASSIGNED candidates (no team)
    let query: any = {
      $or: [
        { team: { $exists: false } },
        { team: null },
        { team: '' },
      ]
    };
    
    // Add festId filter
    const cookieStore = await cookies();
    const activeFestId = cookieStore.get('activeFestId')?.value;
    if (activeFestId) {
      query.festId = activeFestId;
    }
    
    const candidates = await collection.find(query).toArray();
    
    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Error fetching unassigned candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch unassigned candidates' }, { status: 500 });
  }
}
