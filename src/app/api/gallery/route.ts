import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { GalleryImage } from '@/types';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    console.log('Gallery API: Attempting to connect to database...');
    const db = await getDatabase();
    console.log('Gallery API: Database connection successful');
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    if (id) {
      // Get single image
      const image = await db.collection('gallery').findOne({ _id: new ObjectId(id) });
      if (!image) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
      }
      return NextResponse.json(image);
    }

    // Build query
    const query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }

    // Get images with pagination
    console.log('Gallery API: Fetching images with query:', query);
    const images = await db.collection('gallery')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await db.collection('gallery').countDocuments(query);
    console.log(`Gallery API: Found ${images.length} images, total: ${total}`);

    // Get category counts
    const categoryCounts = await db.collection('gallery').aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const categoryStats = {
      all: total,
      events: 0,
      teams: 0,
      performances: 0,
      awards: 0,
      'behind-scenes': 0
    };

    categoryCounts.forEach(cat => {
      if (cat._id && categoryStats.hasOwnProperty(cat._id)) {
        categoryStats[cat._id as keyof typeof categoryStats] = cat.count;
      }
    });

    return NextResponse.json({
      images,
      total,
      categoryStats,
      pagination: {
        skip,
        limit,
        hasMore: skip + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Gallery API POST: Attempting to connect to database...');
    const db = await getDatabase();
    console.log('Gallery API POST: Database connection successful');
    const body = await request.json();

    const { title, description, category, eventOrTeam, imageData, mimeType, fileSize, uploadedBy, tags } = body;
    console.log('Gallery API POST: Received upload request for:', title, 'Category:', category);

    // Validate required fields
    if (!title || !category || !imageData || !mimeType || !uploadedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate image data (should be base64)
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data format' }, { status: 400 });
    }

    const newImage: GalleryImage = {
      title,
      description,
      category,
      eventOrTeam,
      imageData,
      mimeType,
      fileSize,
      uploadedBy,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('gallery').insertOne(newImage);
    
    return NextResponse.json({ 
      message: 'Image uploaded successfully', 
      imageId: result.insertedId 
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, category, eventOrTeam, tags } = body;

    const updateData: Partial<GalleryImage> = {
      updatedAt: new Date()
    };

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (eventOrTeam !== undefined) updateData.eventOrTeam = eventOrTeam;
    if (tags) updateData.tags = tags;

    const result = await db.collection('gallery').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Image updated successfully' });

  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const result = await db.collection('gallery').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}