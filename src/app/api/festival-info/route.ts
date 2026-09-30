import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { FestivalInfo, SectionLimits } from '@/types';
import { DEFAULT_SECTION_LIMITS } from '@/lib/participationRules';
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
        minCandidateParticipation: 2,
        maxCandidateParticipation: 7,
        minCandidateArtsParticipation: 2,
        maxCandidateArtsParticipation: 7,
        minCandidateSportsParticipation: 1,
        maxCandidateSportsParticipation: 4,
        sectionLimits: DEFAULT_SECTION_LIMITS,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(defaultInfo);
      festivalInfo = { ...defaultInfo, _id: result.insertedId.toString() };
    } else {
      // Ensure defaults if missing in existing document
      if (festivalInfo.minCandidateParticipation === undefined) {
        festivalInfo.minCandidateParticipation = 2;
      }
      if (festivalInfo.maxCandidateParticipation === undefined) {
        festivalInfo.maxCandidateParticipation = 7;
      }
      if (festivalInfo.minCandidateArtsParticipation === undefined) {
        festivalInfo.minCandidateArtsParticipation = 2;
      }
      if (festivalInfo.maxCandidateArtsParticipation === undefined) {
        festivalInfo.maxCandidateArtsParticipation = 7;
      }
      if (festivalInfo.minCandidateSportsParticipation === undefined) {
        festivalInfo.minCandidateSportsParticipation = 1;
      }
      if (festivalInfo.maxCandidateSportsParticipation === undefined) {
        festivalInfo.maxCandidateSportsParticipation = 4;
      }

      // Merge dynamic sectionLimits with defaults
      festivalInfo.sectionLimits = {
        senior: {
          artsStage: {
            min: festivalInfo.sectionLimits?.senior?.artsStage?.min ?? DEFAULT_SECTION_LIMITS.senior.artsStage.min,
            max: festivalInfo.sectionLimits?.senior?.artsStage?.max ?? DEFAULT_SECTION_LIMITS.senior.artsStage.max
          },
          artsNonStage: {
            min: festivalInfo.sectionLimits?.senior?.artsNonStage?.min ?? DEFAULT_SECTION_LIMITS.senior.artsNonStage.min,
            max: festivalInfo.sectionLimits?.senior?.artsNonStage?.max ?? DEFAULT_SECTION_LIMITS.senior.artsNonStage.max
          },
          sports: {
            min: festivalInfo.sectionLimits?.senior?.sports?.min ?? DEFAULT_SECTION_LIMITS.senior.sports.min,
            max: festivalInfo.sectionLimits?.senior?.sports?.max ?? DEFAULT_SECTION_LIMITS.senior.sports.max
          }
        },
        junior: {
          artsStage: {
            min: festivalInfo.sectionLimits?.junior?.artsStage?.min ?? DEFAULT_SECTION_LIMITS.junior.artsStage.min,
            max: festivalInfo.sectionLimits?.junior?.artsStage?.max ?? DEFAULT_SECTION_LIMITS.junior.artsStage.max
          },
          artsNonStage: {
            min: festivalInfo.sectionLimits?.junior?.artsNonStage?.min ?? DEFAULT_SECTION_LIMITS.junior.artsNonStage.min,
            max: festivalInfo.sectionLimits?.junior?.artsNonStage?.max ?? DEFAULT_SECTION_LIMITS.junior.artsNonStage.max
          },
          sports: {
            min: festivalInfo.sectionLimits?.junior?.sports?.min ?? DEFAULT_SECTION_LIMITS.junior.sports.min,
            max: festivalInfo.sectionLimits?.junior?.sports?.max ?? DEFAULT_SECTION_LIMITS.junior.sports.max
          },
          maxSongs: festivalInfo.sectionLimits?.junior?.maxSongs ?? DEFAULT_SECTION_LIMITS.junior.maxSongs ?? 4
        },
        'sub-junior': {
          artsStage: {
            min: festivalInfo.sectionLimits?.['sub-junior']?.artsStage?.min ?? DEFAULT_SECTION_LIMITS['sub-junior'].artsStage.min,
            max: festivalInfo.sectionLimits?.['sub-junior']?.artsStage?.max ?? DEFAULT_SECTION_LIMITS['sub-junior'].artsStage.max
          },
          artsNonStage: {
            min: festivalInfo.sectionLimits?.['sub-junior']?.artsNonStage?.min ?? DEFAULT_SECTION_LIMITS['sub-junior'].artsNonStage.min,
            max: festivalInfo.sectionLimits?.['sub-junior']?.artsNonStage?.max ?? DEFAULT_SECTION_LIMITS['sub-junior'].artsNonStage.max
          },
          sports: {
            min: festivalInfo.sectionLimits?.['sub-junior']?.sports?.min ?? DEFAULT_SECTION_LIMITS['sub-junior'].sports.min,
            max: festivalInfo.sectionLimits?.['sub-junior']?.sports?.max ?? DEFAULT_SECTION_LIMITS['sub-junior'].sports.max
          }
        },
        general: {
          artsStage: {
            min: festivalInfo.sectionLimits?.general?.artsStage?.min ?? DEFAULT_SECTION_LIMITS.general!.artsStage.min,
            max: festivalInfo.sectionLimits?.general?.artsStage?.max ?? DEFAULT_SECTION_LIMITS.general!.artsStage.max
          },
          artsNonStage: {
            min: festivalInfo.sectionLimits?.general?.artsNonStage?.min ?? DEFAULT_SECTION_LIMITS.general!.artsNonStage.min,
            max: festivalInfo.sectionLimits?.general?.artsNonStage?.max ?? DEFAULT_SECTION_LIMITS.general!.artsNonStage.max
          },
          sports: {
            min: festivalInfo.sectionLimits?.general?.sports?.min ?? DEFAULT_SECTION_LIMITS.general!.sports.min,
            max: festivalInfo.sectionLimits?.general?.sports?.max ?? DEFAULT_SECTION_LIMITS.general!.sports.max
          }
        }
      };
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
    delete (updateData as any)._id;
    
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