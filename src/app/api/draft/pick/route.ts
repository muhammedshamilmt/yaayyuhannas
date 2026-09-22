import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { candidateId, teamCode } = await request.json();

    if (!candidateId || !teamCode) {
      return NextResponse.json(
        { success: false, message: 'Missing candidateId or teamCode' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Ensure candidate exists and is not already picked
    const candidateQuery = ObjectId.isValid(candidateId) ? { _id: new ObjectId(candidateId) } : { _id: candidateId };
    const candidate = await db.collection('candidates').findOne(candidateQuery);

    if (!candidate) {
      return NextResponse.json(
        { success: false, message: 'Candidate not found' },
        { status: 404 }
      );
    }

    if (candidate.team && candidate.team.trim() !== "") {
      return NextResponse.json(
        { success: false, message: 'Candidate already drafted to another team' },
        { status: 400 }
      );
    }

    // Draft candidate
    await db.collection('candidates').updateOne(
      candidateQuery,
      { $set: { team: teamCode, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Candidate drafted successfully',
      draftState: null
    });

  } catch (error) {
    console.error('Error in draft pick:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process pick' },
      { status: 500 }
    );
  }
}
