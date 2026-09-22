import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Candidate } from '@/types';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { profileImage, profileImageMimeType, profileImageSize } = body;

    // Validate image data
    if (!profileImage) {
      return NextResponse.json({ error: 'Profile image data is required' }, { status: 400 });
    }

    // Validate image size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (profileImageSize && profileImageSize > maxSize) {
      return NextResponse.json({ error: 'Image size must be less than 2MB' }, { status: 400 });
    }

    // Update candidate profile image in MongoDB
    const db = await getDatabase();
    const collection = db.collection<Candidate>('candidates');
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          profileImage,
          profileImageMimeType,
          profileImageSize,
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile image updated successfully' 
    });
  } catch (error) {
    console.error('Error updating candidate profile image:', error);
    return NextResponse.json({ error: 'Failed to update profile image' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    // Remove candidate profile image from MongoDB
    const db = await getDatabase();
    const collection = db.collection<Candidate>('candidates');
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $unset: { 
          profileImage: "",
          profileImageMimeType: "",
          profileImageSize: ""
        },
        $set: {
          updatedAt: new Date() 
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile image removed successfully' 
    });
  } catch (error) {
    console.error('Error removing candidate profile image:', error);
    return NextResponse.json({ error: 'Failed to remove profile image' }, { status: 500 });
  }
}