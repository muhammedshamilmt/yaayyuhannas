import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Candidate, Result, Programme, Team } from '@/types';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chestNumber = searchParams.get('chestNumber');
    
    if (!chestNumber) {
      return NextResponse.json({ error: 'Chest number is required' }, { status: 400 });
    }

    const db = await getDatabase();
    
    // 1. Get the candidate
    const candidate = await db.collection<Candidate>('candidates').findOne({ chestNumber });
    
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    
    // 2. Get active fest ID to filter results (optional, but good for scoping)
    const cookieStore = await cookies();
    const activeFestId = cookieStore.get('activeFestId')?.value;
    
    let resultQuery: any = {
      $or: [
        { "firstPlace.chestNumber": chestNumber },
        { "secondPlace.chestNumber": chestNumber },
        { "thirdPlace.chestNumber": chestNumber },
        { "participationGrades.chestNumber": chestNumber }
      ]
    };
    
    if (activeFestId) {
      resultQuery.festId = activeFestId;
    }
    
    // 3. Get results where candidate won or participated
    const rawResults = await db.collection<Result>('results').find(resultQuery).toArray();
    
    if (rawResults.length === 0) {
      return NextResponse.json({ 
        candidate, 
        results: [],
        message: 'No results found for this candidate yet.' 
      });
    }
    
    // 4. Get the programme names for these results
    const programmeIds = rawResults.map(r => r.programmeId);
    
    // The programmeId might be stored as an ObjectId string in results. 
    // Wait, in POST /api/results we saved `programmeId` as a string. Let's just find by code or ID.
    // Let's get all programmes and match them manually since it's easier and usually a small collection
    let programmeQuery: any = {};
    if (activeFestId) {
      programmeQuery.festId = activeFestId;
    }
    const programmes = await db.collection<Programme>('programmes').find(programmeQuery).toArray();
    
    // Get team info for branding colors (optional)
    const team = await db.collection<Team>('teams').findOne({ code: candidate.team });
    
    // 5. Format the results for the frontend
    const formattedResults = rawResults.map(result => {
      // Find what position they got
      let position = '';
      let grade = '';
      
      const first = result.firstPlace?.find(p => p.chestNumber === chestNumber);
      if (first) {
        position = '1st';
        grade = first.grade || '';
      }
      
      const second = result.secondPlace?.find(p => p.chestNumber === chestNumber);
      if (second) {
        position = '2nd';
        grade = second.grade || '';
      }
      
      const third = result.thirdPlace?.find(p => p.chestNumber === chestNumber);
      if (third) {
        position = '3rd';
        grade = third.grade || '';
      }
      
      const part = result.participationGrades?.find(p => p.chestNumber === chestNumber);
      if (part && !position) { // Only show participation if they didn't win 1/2/3
        position = 'Participation';
        grade = part.grade || '';
      }
      
      // Match programme
      const programme = programmes.find(p => p._id?.toString() === result.programmeId || p.code === result.programmeId || p.code === result.programme);
      
      return {
        _id: result._id?.toString(),
        programmeName: programme ? programme.name : (result.programme || 'Unknown Programme'),
        programmeCode: programme ? programme.code : '',
        category: programme ? programme.category : '',
        position,
        grade
      };
    }).filter(r => r.position !== ''); // Just in case they matched query but didn't have a position parsed
    
    return NextResponse.json({ 
      candidate: {
        name: candidate.name,
        chestNumber: candidate.chestNumber,
        team: candidate.team,
        section: candidate.section,
        teamColor: team ? team.color : '#000000',
        teamName: team ? team.name : candidate.team,
        profileImage: candidate.profileImage
      }, 
      results: formattedResults 
    });
    
  } catch (error) {
    console.error('Error fetching downloads data:', error);
    return NextResponse.json({ error: 'Failed to fetch candidate results' }, { status: 500 });
  }
}
