import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Get the draft state
    let draftState = await db.collection('draft_state').findOne({});
    
    if (!draftState) {
      return NextResponse.json({ 
        success: true, 
        draftState: { status: 'pending', round: 1, pickNumber: 1 } 
      });
    }

    // Get all drafted candidates
    const candidates = await db.collection('candidates').find({ 
      team: { $ne: null, $exists: true, $ne: "" } 
    }).sort({ updatedAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      draftState,
      draftedCandidates: candidates
    });

  } catch (error) {
    console.error('Error fetching draft state:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch draft state' },
      { status: 500 }
    );
  }
}
