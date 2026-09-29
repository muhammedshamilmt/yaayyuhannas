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
        minCandidateParticipation: 1,
        maxCandidateParticipation: 3,
        minCandidateArtsParticipation: 1,
        maxCandidateArtsParticipation: 3,
        minCandidateSportsParticipation: 0,
        maxCandidateSportsParticipation: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(defaultInfo);
      festivalInfo = { ...defaultInfo, _id: result.insertedId.toString() };
    } else {
      // Ensure defaults if missing in existing document
      if (festivalInfo.minCandidateParticipation === undefined) {
        festivalInfo.minCandidateParticipation = 1;
      }
      if (festivalInfo.maxCandidateParticipation === undefined) {
        festivalInfo.maxCandidateParticipation = 3;
      }
      if (festivalInfo.minCandidateArtsParticipation === undefined) {
        festivalInfo.minCandidateArtsParticipation = festivalInfo.minCandidateParticipation ?? 1;
      }
      if (festivalInfo.maxCandidateArtsParticipation === undefined) {
        festivalInfo.maxCandidateArtsParticipation = festivalInfo.maxCandidateParticipation ?? 3;
      }
      if (festivalInfo.minCandidateSportsParticipation === undefined) {
        festivalInfo.minCandidateSportsParticipation = 0;
      }
      if (festivalInfo.maxCandidateSportsParticipation === undefined) {
        festivalInfo.maxCandidateSportsParticipation = festivalInfo.maxCandidateParticipation ?? 3;
      }
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
    
    if (body.minCandidateParticipation !== undefined) {
      body.minCandidateParticipation = parseInt(body.minCandidateParticipation, 10) || 1;
    }
    if (body.maxCandidateParticipation !== undefined) {
      body.maxCandidateParticipation = parseInt(body.maxCandidateParticipation, 10) || 3;
    }
    if (body.minCandidateArtsParticipation !== undefined) {
      body.minCandidateArtsParticipation = Math.max(0, parseInt(body.minCandidateArtsParticipation, 10) || 0);
    }
    if (body.maxCandidateArtsParticipation !== undefined) {
      body.maxCandidateArtsParticipation = Math.max(1, parseInt(body.maxCandidateArtsParticipation, 10) || 3);
    }
    if (body.minCandidateSportsParticipation !== undefined) {
      body.minCandidateSportsParticipation = Math.max(0, parseInt(body.minCandidateSportsParticipation, 10) || 0);
    }
    if (body.maxCandidateSportsParticipation !== undefined) {
      body.maxCandidateSportsParticipation = Math.max(1, parseInt(body.maxCandidateSportsParticipation, 10) || 3);
    }
    
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