import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { GalleryImage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('Gallery Bulk API: Attempting to connect to database...');
    const db = await getDatabase();
    console.log('Gallery Bulk API: Database connection successful');
    const body = await request.json();

    const { images, uploadedBy } = body;
    console.log(`Gallery Bulk API: Received ${images?.length || 0} images for upload`);

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (!uploadedBy) {
      return NextResponse.json({ error: 'Uploaded by field is required' }, { status: 400 });
    }

    // Validate and prepare images
    const validImages: GalleryImage[] = [];
    const errors: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      
      if (!img.title || !img.category || !img.imageData || !img.mimeType) {
        errors.push(`Image ${i + 1}: Missing required fields`);
        continue;
      }

      if (!img.imageData.startsWith('data:image/')) {
        errors.push(`Image ${i + 1}: Invalid image data format`);
        continue;
      }

      validImages.push({
        title: img.title,
        description: img.description || '',
        category: img.category,
        eventOrTeam: img.eventOrTeam,
        imageData: img.imageData,
        mimeType: img.mimeType,
        fileSize: img.fileSize || 0,
        uploadedBy,
        tags: img.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (validImages.length === 0) {
      return NextResponse.json({ 
        error: 'No valid images to upload', 
        errors 
      }, { status: 400 });
    }

    // Insert all valid images
    const result = await db.collection('gallery').insertMany(validImages);
    
    return NextResponse.json({ 
      message: `Successfully uploaded ${result.insertedCount} images`,
      uploadedCount: result.insertedCount,
      totalProvided: images.length,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 201 });

  } catch (error) {
    console.error('Error bulk uploading images:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}