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
    
    // 1. Get current draft state
    const draftState = await db.collection('draft_state').findOne({});
    
    if (!draftState || draftState.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, message: 'Draft is not active' },
        { status: 400 }
      );
    }

    // 2. Validate turn
    if (draftState.currentTurn !== teamCode) {
      return NextResponse.json(
        { success: false, message: `It is not your turn. Current turn: ${draftState.currentTurn}` },
        { status: 403 }
      );
    }

    // 3. Ensure candidate exists and is not already picked
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

    // 4. Draft candidate
    await db.collection('candidates').updateOne(
      candidateQuery,
      { $set: { team: teamCode, updatedAt: new Date() } }
    );

    // 5. Calculate next turn (Snake Draft logic)
    const numTeams = draftState.turnOrder.length;
    const nextPickNumber = draftState.pickNumber + 1;
    const nextRound = Math.floor((nextPickNumber - 1) / numTeams) + 1;
    const pickInRound = (nextPickNumber - 1) % numTeams;
    const isReversedRound = nextRound % 2 === 0;
    
    // Base order is always the turnOrder from round 1 (or sorted list)
    // We assume turnOrder stored in state is the base order (e.g. ['team1', 'team2', 'team3'])
    const index = isReversedRound ? (numTeams - 1 - pickInRound) : pickInRound;
    const nextTurn = draftState.turnOrder[index];

    const nextState = {
      pickNumber: nextPickNumber,
      round: nextRound,
      currentTurn: nextTurn,
      updatedAt: new Date()
    };

    await db.collection('draft_state').updateOne(
      { _id: draftState._id },
      { $set: nextState }
    );

    return NextResponse.json({
      success: true,
      message: 'Candidate drafted successfully',
      draftState: { ...draftState, ...nextState }
    });

  } catch (error) {
    console.error('Error in draft pick:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process pick' },
      { status: 500 }
    );
  }
}
