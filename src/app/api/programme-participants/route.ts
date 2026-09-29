import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { syncProgrammeRegistrationToSheets } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('programme_participants');

    const { searchParams } = new URL(request.url);
    const team = searchParams.get('team');
    const programme = searchParams.get('programme');
    const programmeId = searchParams.get('programmeId');

    let query: any = {};
    if (team) query.teamCode = team;
    if (programme) query.programmeId = programme;
    if (programmeId) query.programmeId = programmeId;

    const participants = await collection.find(query).toArray();
    
    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error fetching programme participants:', error);
    return NextResponse.json({ error: 'Failed to fetch programme participants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('programme_participants');

    const body = await request.json();
    const { programmeId, programmeCode, programmeName, teamCode, participants, status = 'registered' } = body;

    // Validate required fields
    if (!programmeId || !teamCode || !participants || participants.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if team already registered, fetch festInfo, and check if programme is over in parallel
    const festInfoCollection = db.collection('festival-info');
    const programmesCollection = db.collection('programmes');
    const programmeQuery = ObjectId.isValid(programmeId) 
      ? { $or: [{ _id: new ObjectId(programmeId) }, { id: programmeId }, { code: programmeCode }] }
      : { $or: [{ id: programmeId }, { code: programmeCode }] };

    const [existing, festInfo, programmeDoc] = await Promise.all([
      collection.findOne({ programmeId, teamCode }),
      festInfoCollection.findOne({}),
      programmesCollection.findOne(programmeQuery)
    ]);

    if (programmeDoc && (programmeDoc.status === 'completed' || programmeDoc.isOver === true)) {
      return NextResponse.json({ 
        error: `Programme "${programmeDoc.name || programmeName}" is over. Registrations and changes are closed.` 
      }, { status: 400 });
    }

    if (existing) {
      return NextResponse.json({ error: 'Team already registered for this programme' }, { status: 400 });
    }

    const isIndividual = programmeDoc?.positionType === 'individual' || (programmeDoc as any)?.type === 'individual';

    if (isIndividual) {
      const isSports = (programmeDoc?.category || '').toLowerCase() === 'sports';
      const maxLimit = isSports
        ? (festInfo?.maxCandidateSportsParticipation ?? festInfo?.maxCandidateParticipation ?? 3)
        : (festInfo?.maxCandidateArtsParticipation ?? festInfo?.maxCandidateParticipation ?? 3);
      const categoryLabel = isSports ? 'Sports' : 'Arts';

      // Find all individual programme IDs and codes for this category
      const individualProgs = await programmesCollection.find({
        $and: [
          {
            $or: [
              { positionType: 'individual' },
              { type: 'individual' }
            ]
          },
          isSports
            ? { category: { $regex: /^sports$/i } }
            : { category: { $not: { $regex: /^sports$/i } } }
        ]
      }, { projection: { _id: 1, id: 1, code: 1 } }).toArray();

      const individualProgIds: any[] = [];

      individualProgs.forEach((p: any) => {
        if (p._id) {
          individualProgIds.push(p._id.toString());
          if (ObjectId.isValid(p._id)) individualProgIds.push(new ObjectId(p._id));
        }
        if (p.id) individualProgIds.push(p.id.toString());
      });

      const individualProgFilter = {
        programmeId: { $in: individualProgIds }
      };

      // Check maximum individual participation limit for each candidate in parallel
      const candidatesCollection = db.collection('candidates');
      const checks = await Promise.all(
        participants.map(async (chestNumber: string) => {
          const count = await collection.countDocuments({
            ...individualProgFilter,
            participants: chestNumber,
            status: { $ne: 'withdrawn' }
          });
          return { chestNumber, count };
        })
      );

      const exceeded = checks.find(c => c.count >= maxLimit);
      if (exceeded) {
        const candidateDoc = await candidatesCollection.findOne({ chestNumber: exceeded.chestNumber });
        const candidateName = candidateDoc?.name || exceeded.chestNumber;
        return NextResponse.json({
          error: `Candidate ${candidateName} (#${exceeded.chestNumber}) has reached the maximum allowed limit of ${maxLimit} individual ${categoryLabel} programme(s). Cannot register for more.`
        }, { status: 400 });
      }
    }

    const newParticipant = {
      programmeId,
      programmeCode,
      programmeName,
      teamCode,
      participants,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newParticipant);
    
    const createdParticipant = {
      _id: result.insertedId,
      ...newParticipant
    };
    
    // Sync to Google Sheets asynchronously in background so response returns instantly
    syncProgrammeRegistrationToSheets(createdParticipant)
      .then(() => console.log(`✅ Programme registration synced to Google Sheets for team ${teamCode}`))
      .catch((error) => console.error('⚠️ Failed to sync to Google Sheets in background:', error));
    
    return NextResponse.json(createdParticipant, { status: 201 });
  } catch (error) {
    console.error('Error creating programme participant:', error);
    return NextResponse.json({ error: 'Failed to create programme participant' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('programme_participants');

    const body = await request.json();
    const { _id, programmeId, teamCode, participants, status } = body;

    // Support both _id and programmeId+teamCode for updates
    let query: any = {};
    if (_id) {
      query._id = new ObjectId(_id);
    } else if (programmeId && teamCode) {
      query = { programmeId, teamCode };
    } else {
      return NextResponse.json({ error: 'Either _id or both programmeId and teamCode are required' }, { status: 400 });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (participants) updateData.participants = participants;
    if (status) updateData.status = status;

    if (participants && Array.isArray(participants)) {
      const festInfoCollection = db.collection('festival-info');
      const [currentRegistration, festInfo] = await Promise.all([
        collection.findOne(query),
        festInfoCollection.findOne({})
      ]);

      if (!currentRegistration) {
        return NextResponse.json({ error: 'Programme participant not found' }, { status: 404 });
      }

      // Check if programme is over
      const programmesCollection = db.collection('programmes');
      const progId = currentRegistration.programmeId;
      const progQuery = ObjectId.isValid(progId)
        ? { $or: [{ _id: new ObjectId(progId) }, { id: progId }, { code: currentRegistration.programmeCode }] }
        : { $or: [{ id: progId }, { code: currentRegistration.programmeCode }] };
      
      const programmeDoc = await programmesCollection.findOne(progQuery);
      if (programmeDoc && (programmeDoc.status === 'completed' || programmeDoc.isOver === true)) {
        return NextResponse.json({ 
          error: `Programme "${programmeDoc.name || currentRegistration.programmeName}" is over. Editing participants is closed.` 
        }, { status: 400 });
      }

      const isIndividual = programmeDoc?.positionType === 'individual' || (programmeDoc as any)?.type === 'individual';

      if (isIndividual) {
        const isSports = (programmeDoc?.category || '').toLowerCase() === 'sports';
        const maxLimit = isSports
          ? (festInfo?.maxCandidateSportsParticipation ?? festInfo?.maxCandidateParticipation ?? 3)
          : (festInfo?.maxCandidateArtsParticipation ?? festInfo?.maxCandidateParticipation ?? 3);
        const categoryLabel = isSports ? 'Sports' : 'Arts';
        const candidatesCollection = db.collection('candidates');

        // Find all individual programme IDs and codes for this category
        const individualProgs = await programmesCollection.find({
          $and: [
            {
              $or: [
                { positionType: 'individual' },
                { type: 'individual' }
              ]
            },
            isSports
              ? { category: { $regex: /^sports$/i } }
              : { category: { $not: { $regex: /^sports$/i } } }
          ]
        }, { projection: { _id: 1, id: 1, code: 1 } }).toArray();

        const individualProgIds: any[] = [];

        individualProgs.forEach((p: any) => {
          if (p._id) {
            individualProgIds.push(p._id.toString());
            if (ObjectId.isValid(p._id)) individualProgIds.push(new ObjectId(p._id));
          }
          if (p.id) individualProgIds.push(p.id.toString());
        });

        const individualProgFilter = {
          programmeId: { $in: individualProgIds }
        };

        const checks = await Promise.all(
          participants.map(async (chestNumber: string) => {
            const otherCount = await collection.countDocuments({
              _id: { $ne: currentRegistration._id },
              ...individualProgFilter,
              participants: chestNumber,
              status: { $ne: 'withdrawn' }
            });
            return { chestNumber, otherCount };
          })
        );

        const exceeded = checks.find(c => c.otherCount >= maxLimit);
        if (exceeded) {
          const candidateDoc = await candidatesCollection.findOne({ chestNumber: exceeded.chestNumber });
          const candidateName = candidateDoc?.name || exceeded.chestNumber;
          return NextResponse.json({
            error: `Candidate ${candidateName} (#${exceeded.chestNumber}) has already reached the maximum allowed limit of ${maxLimit} individual ${categoryLabel} programme(s). Cannot register for more.`
          }, { status: 400 });
        }
      }
    }

    const result = await collection.updateOne(query, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Programme participant not found' }, { status: 404 });
    }

    // Sync to Google Sheets in background
    collection.findOne(query).then(updatedDoc => {
      if (updatedDoc) {
        syncProgrammeRegistrationToSheets(updatedDoc)
          .then(() => console.log(`✅ Programme registration update synced to Google Sheets for team ${updatedDoc.teamCode}`))
          .catch(err => console.error('⚠️ Failed to sync update to Google Sheets in background:', err));
      }
    }).catch(err => console.error('⚠️ Error fetching updated doc for sync:', err));

    return NextResponse.json({ message: 'Programme participant updated successfully' });
  } catch (error) {
    console.error('Error updating programme participant:', error);
    return NextResponse.json({ error: 'Failed to update programme participant' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('programme_participants');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Programme participant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Programme participant deleted successfully' });
  } catch (error) {
    console.error('Error deleting programme participant:', error);
    return NextResponse.json({ error: 'Failed to delete programme participant' }, { status: 500 });
  }
}