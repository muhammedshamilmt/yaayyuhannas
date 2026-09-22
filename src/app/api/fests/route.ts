import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const query = status ? { status } : {};
    
    const fests = await db.collection('fests').find(query).sort({ year: -1, createdAt: -1 }).toArray();
    
    return NextResponse.json(fests);
  } catch (error) {
    console.error('Error fetching fests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const data = await request.json();
    
    if (!data.name || !data.year) {
      return NextResponse.json(
        { error: 'Name and year are required' },
        { status: 400 }
      );
    }
    
    const newFest = {
      name: data.name,
      year: data.year,
      status: data.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('fests').insertOne(newFest);
    const newFestId = result.insertedId.toString();

    // Copy data from previous fest if requested
    if (data.sourceFestId && (data.copyProgrammes || data.copyTeams || data.copyCandidates || data.copyResults)) {
      const prevFestId = data.sourceFestId;

      if (data.copyProgrammes) {
          const oldProgrammes = await db.collection('programmes').find({ festId: prevFestId }).toArray();
          if (oldProgrammes.length > 0) {
            const newProgrammes = oldProgrammes.map(p => {
              const { _id, ...rest } = p;
              return { ...rest, festId: newFestId, createdAt: new Date(), updatedAt: new Date() };
            });
            await db.collection('programmes').insertMany(newProgrammes);
          }
        }

        if (data.copyTeams) {
          const oldTeams = await db.collection('teams').find({ festId: prevFestId }).toArray();
          if (oldTeams.length > 0) {
            const newTeams = oldTeams.map(t => {
              const { _id, ...rest } = t;
              return { ...rest, festId: newFestId, points: 0, members: 0, createdAt: new Date(), updatedAt: new Date() };
            });
            await db.collection('teams').insertMany(newTeams);
          }
        }

        if (data.copyCandidates) {
          const oldCandidates = await db.collection('candidates').find({ festId: prevFestId }).toArray();
          if (oldCandidates.length > 0) {
            const newCandidates = oldCandidates.map(c => {
              const { _id, ...rest } = c;
              return { ...rest, festId: newFestId, points: 0, createdAt: new Date(), updatedAt: new Date() };
            });
            await db.collection('candidates').insertMany(newCandidates);
          }
        }

        if (data.copyResults) {
          const oldResults = await db.collection('results').find({ festId: prevFestId }).toArray();
          if (oldResults.length > 0) {
            const newResults = oldResults.map(r => {
              const { _id, ...rest } = r;
              return { ...rest, festId: newFestId, createdAt: new Date(), updatedAt: new Date() };
            });
            await db.collection('results').insertMany(newResults);
          }
        }
      }
    
    return NextResponse.json({
      _id: result.insertedId,
      ...newFest
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating fest:', error);
    return NextResponse.json(
      { error: 'Failed to create fest' },
      { status: 500 }
    );
  }
}
