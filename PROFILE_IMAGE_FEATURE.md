# Profile Image Upload Feature

## Overview
Added comprehensive profile image upload functionality for candidates in the Wattaqa 2K25 festival management system.

## Features Added

### 🖼️ **Image Upload Component**
- **Location**: `src/components/ui/ImageUpload.tsx`
- **Features**:
  - Drag & drop or click to upload
  - Image validation (type, size)
  - Automatic resizing and compression
  - Preview functionality
  - Placeholder avatar generation
  - Multiple size options (sm, md, lg)
  - Circle or square shapes
  - Error handling and user feedback

### 🛠️ **Image Utilities**
- **Location**: `src/lib/imageUtils.ts`
- **Functions**:
  - `fileToBase64()` - Convert files to base64
  - `resizeImage()` - Resize and compress images
  - `validateImage()` - Validate file type and size
  - `generateAvatarPlaceholder()` - Create initials-based avatars

### 📊 **Database Schema Updates**
- **Updated**: `src/types/index.ts`
- **New Candidate Fields**:
  - `profileImage?: string` - Base64 encoded image
  - `profileImageMimeType?: string` - Image MIME type
  - `profileImageSize?: number` - File size in bytes

### 🎯 **API Enhancements**
- **Enhanced**: `src/app/api/candidates/route.ts`
  - Supports profile image in POST/PUT operations
- **New**: `src/app/api/candidates/[id]/image/route.ts`
  - Dedicated image upload/delete endpoint
  - Image validation and size limits

### 🖥️ **UI Updates**

#### Team Admin Candidates Page
- **Location**: `src/app/team-admin/candidates/page.tsx`
- **Updates**:
  - Profile image upload in add candidate form
  - Image display and editing in candidate table
  - Improved form layout with image preview

#### Profiles Pages
- **Location**: `src/app/profiles/page.tsx` & `src/app/profiles/[id]/page.tsx`
- **Updates**:
  - Profile images in candidate cards
  - Large profile images in individual profile pages
  - Fallback to initials when no image available

#### Leaderboard Components
- **Location**: `src/components/Leaderboard/IndividualProfile.tsx`
- **Updates**:
  - Profile images in individual performance profiles
  - Enhanced visual presentation

## Technical Specifications

### Image Requirements
- **Supported Formats**: JPEG, PNG, GIF, WebP
- **Maximum Size**: 2MB
- **Automatic Resize**: 120x120px maximum
- **Compression**: JPEG quality 60%
- **Storage**: Base64 encoded in MongoDB

### Validation Rules
- File type validation on client and server
- Size limits enforced (2MB max)
- Automatic image optimization
- Error handling for invalid files

### Performance Considerations
- Images are automatically resized to 120x120px
- Higher JPEG compression reduces file sizes significantly
- Base64 encoding for simple storage
- Smaller UI components for better performance

## Usage Instructions

### For Team Administrators

#### Adding New Candidates with Photos
1. Navigate to Team Admin → Candidates
2. In the "Add New Candidate" form:
   - Click the profile photo area or "Upload Photo" button
   - Select an image file (JPEG, PNG, GIF, WebP)
   - Image will be automatically resized and compressed
   - Fill in other candidate details
   - Click "Add Candidate"

#### Editing Existing Candidate Photos
1. In the candidates table, click "Edit" for any candidate
2. The profile photo becomes editable
3. Click on the current photo to change it
4. Select a new image or click the "×" to remove
5. Click "Save" to update

### For Users Viewing Profiles
- Profile images appear automatically in:
  - Profiles listing page (`/profiles`)
  - Individual profile pages (`/profiles/[id]`)
  - Leaderboard individual profiles
  - Team admin candidate tables

## File Structure
```
src/
├── components/ui/ImageUpload.tsx          # Main image upload component
├── lib/imageUtils.ts                      # Image processing utilities
├── app/api/candidates/
│   ├── route.ts                          # Enhanced candidates API
│   └── [id]/image/route.ts               # Dedicated image API
├── app/team-admin/candidates/page.tsx    # Enhanced admin interface
├── app/profiles/
│   ├── page.tsx                          # Updated profiles listing
│   └── [id]/page.tsx                     # Updated individual profiles
└── types/index.ts                        # Updated type definitions
```

## Security & Validation
- Client-side file type validation
- Server-side size and type validation
- Automatic image compression
- Base64 encoding prevents direct file access
- Error handling for malformed images

## Future Enhancements
- Image cropping functionality
- Multiple image sizes (thumbnails)
- Cloud storage integration (AWS S3, Cloudinary)
- Bulk image upload
- Image optimization service integration

## Browser Compatibility
- Modern browsers with Canvas API support
- File API support required
- Base64 image display (all modern browsers)

## Testing
- Test with various image formats
- Test file size limits
- Test image compression quality
- Test error handling scenarios
- Test responsive design on mobile devices