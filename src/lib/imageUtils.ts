/**
 * Utility functions for handling image uploads and processing
 */

export interface ImageUploadResult {
  success: boolean;
  data?: string; // Base64 encoded image
  mimeType?: string;
  size?: number;
  error?: string;
}

/**
 * Convert file to base64 string
 */
export const fileToBase64 = (file: File): Promise<ImageUploadResult> => {
  return new Promise((resolve) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      resolve({
        success: false,
        error: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
      });
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      resolve({
        success: false,
        error: 'Image size must be less than 2MB'
      });
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        success: true,
        data: result,
        mimeType: file.type,
        size: file.size
      });
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read image file'
      });
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Resize image to specified dimensions while maintaining aspect ratio
 */
export const resizeImage = (
  base64: string, 
  maxWidth: number = 150, 
  maxHeight: number = 150,
  quality: number = 0.7
): Promise<ImageUploadResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({
          success: false,
          error: 'Failed to create canvas context'
        });
        return;
      }

      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Calculate approximate size
        const sizeInBytes = Math.round((resizedBase64.length * 3) / 4);
        
        resolve({
          success: true,
          data: resizedBase64,
          mimeType: 'image/jpeg',
          size: sizeInBytes
        });
      } catch (error) {
        resolve({
          success: false,
          error: 'Failed to compress image'
        });
      }
    };
    
    img.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to load image'
      });
    };
    
    img.src = base64;
  });
};

/**
 * Validate image dimensions and file size
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
    };
  }

  // Check file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 2MB'
    };
  }

  return { valid: true };
};

/**
 * Generate a placeholder avatar with initials
 */
export const generateAvatarPlaceholder = (
  name: string,
  size: number = 80,
  backgroundColor: string = '#8b5cf6'
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  canvas.width = size;
  canvas.height = size;

  // Draw background circle
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();

  // Draw initials
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);

  ctx.fillStyle = 'white';
  ctx.font = `bold ${size / 3}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);

  return canvas.toDataURL('image/png');
};