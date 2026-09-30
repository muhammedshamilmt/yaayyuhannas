import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { syncProgrammeRegistrationToSheets } from '@/lib/googleSheets';
import { checkCandidateProgrammeEligibility } from '@/lib/participationRules';

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

    if (isIndividual && participants && participants.length > 0) {
      const candidatesCollection = db.collection('candidates');
      const candidateDocs = await candidatesCollection.find({ chestNumber: { $in: participants } }).toArray();
      const candMap = new Map<string, any>(candidateDocs.map(c => [c.chestNumber, c]));

      // Fetch all non-withdrawn registrations for these candidates
      const existingRegs = await collection.find({
        participants: { $in: participants },
        status: { $ne: 'withdrawn' }
      }).toArray();

      // Collect all programme IDs from registrations to populate programme data
      const regProgIds: any[] = [];
      existingRegs.forEach(r => {
        if (r.programmeId) {
          regProgIds.push(r.programmeId);
          if (ObjectId.isValid(r.programmeId)) {
            regProgIds.push(new ObjectId(r.programmeId));
          }
        }
      });

      const relatedProgs = regProgIds.length > 0
        ? await programmesCollection.find({
            $or: [
              { _id: { $in: regProgIds } },
              { id: { $in: regProgIds.map(String) } }
            ]
          }).toArray()
        : [];

      const allProgList: any[] = [...relatedProgs];
      if (programmeDoc && !allProgList.some(p => p._id?.toString() === programmeDoc._id?.toString())) {
        allProgList.push(programmeDoc);
      }

      for (const chestNumber of participants) {
        const candidate = candMap.get(chestNumber) || { chestNumber, section: programmeDoc?.section };
        const validation = checkCandidateProgrammeEligibility({
          candidate,
          programme: programmeDoc as any,
          registrations: existingRegs as any,
          allProgrammes: allProgList as any,
          festInfo,
          isEditingCurrentRegistration: false
        });

        if (!validation.eligible) {
          const candidateName = candidate.name ? `${candidate.name} (#${chestNumber})` : `#${chestNumber}`;
          return NextResponse.json({
            error: `Candidate ${candidateName} cannot register: ${validation.reason}`
          }, { status: 400 });
        }
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

      if (isIndividual && participants && participants.length > 0) {
        const candidatesCollection = db.collection('candidates');
        const candidateDocs = await candidatesCollection.find({ chestNumber: { $in: participants } }).toArray();
        const candMap = new Map<string, any>(candidateDocs.map(c => [c.chestNumber, c]));

        // Fetch all non-withdrawn registrations for these candidates (excluding current registration)
        const existingRegs = await collection.find({
          _id: { $ne: currentRegistration._id },
          participants: { $in: participants },
          status: { $ne: 'withdrawn' }
        }).toArray();

        // Collect all programme IDs from registrations
        const regProgIds: any[] = [];
        existingRegs.forEach(r => {
          if (r.programmeId) {
            regProgIds.push(r.programmeId);
            if (ObjectId.isValid(r.programmeId)) {
              regProgIds.push(new ObjectId(r.programmeId));
            }
          }
        });

        const relatedProgs = regProgIds.length > 0
          ? await programmesCollection.find({
              $or: [
                { _id: { $in: regProgIds } },
                { id: { $in: regProgIds.map(String) } }
              ]
            }).toArray()
          : [];

        const allProgList: any[] = [...relatedProgs];
        if (programmeDoc && !allProgList.some(p => p._id?.toString() === programmeDoc._id?.toString())) {
          allProgList.push(programmeDoc);
        }

        for (const chestNumber of participants) {
          const candidate = candMap.get(chestNumber) || { chestNumber, section: programmeDoc?.section };
          const validation = checkCandidateProgrammeEligibility({
            candidate,
            programme: programmeDoc as any,
            registrations: existingRegs as any,
            allProgrammes: allProgList as any,
            festInfo,
            isEditingCurrentRegistration: true
          });

          if (!validation.eligible) {
            const candidateName = candidate.name ? `${candidate.name} (#${chestNumber})` : `#${chestNumber}`;
            return NextResponse.json({
              error: `Candidate ${candidateName} cannot register: ${validation.reason}`
            }, { status: 400 });
          }
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