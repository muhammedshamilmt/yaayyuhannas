import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    
    // Get all teams
    const teams = await db.collection('teams').find({}).toArray();
    
    if (teams.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No teams found to start draft' },
        { status: 400 }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch(e) {}
    const { customOrder } = body as any;

    // Sort teams by code or name and deduplicate
    const uniqueTeamCodes = Array.from(new Set(teams.map(t => t.code)));
    let sortedTeams = uniqueTeamCodes.sort();

    // Use custom order if provided
    if (customOrder && Array.isArray(customOrder) && customOrder.length === sortedTeams.length) {
       sortedTeams = customOrder;
    }

    const initialState = {
      status: 'in_progress',
      round: 1,
      pickNumber: 1,
      turnOrder: sortedTeams,
      currentTurn: sortedTeams[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update or insert
    await db.collection('draft_state').updateOne(
      {},
      { $set: initialState },
      { upsert: true }
    );

    // Reset all candidates team assignment (optional, maybe we don't want to reset if they just pause/resume, but init usually resets)
    // await db.collection('candidates').updateMany({}, { $set: { team: "" } });

    return NextResponse.json({
      success: true,
      draftState: initialState,
      message: 'Draft initialized successfully'
    });

  } catch (error) {
    console.error('Error initializing draft:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initialize draft' },
      { status: 500 }
    );
  }
}
