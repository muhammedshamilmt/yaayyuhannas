'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { fileToBase64, resizeImage, validateImage, generateAvatarPlaceholder } from '@/lib/imageUtils';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageData: string | null, mimeType?: string, size?: number) => void;
  placeholder?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
  disabled?: boolean;
}

export function ImageUpload({
  currentImage,
  onImageChange,
  placeholder = 'Upload Image',
  name = 'User',
  className = '',
  size = 'md',
  shape = 'circle',
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Validate file
      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid image file');
        setIsUploading(false);
        return;
      }

      // Convert to base64
      const base64Result = await fileToBase64(file);
      if (!base64Result.success) {
        setError(base64Result.error || 'Failed to process image');
        setIsUploading(false);
        return;
      }

      // Resize image for better performance
      const resizedResult = await resizeImage(base64Result.data!, 500, 500, 0.85);
      if (!resizedResult.success) {
        setError(resizedResult.error || 'Failed to resize image');
        setIsUploading(false);
        return;
      }

      // Update preview and notify parent
      setPreview(resizedResult.data!);
      onImageChange(resizedResult.data!, resizedResult.mimeType, resizedResult.size);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setError(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Generate placeholder if no image
  const displayImage = preview || (typeof window !== 'undefined' ? generateAvatarPlaceholder(name) : null);

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Image Display */}
      <div className="relative group">
        <div
          className={`
            ${sizeClasses[size]} 
            ${shapeClasses[shape]} 
            border-2 border-gray-300 
            overflow-hidden 
            cursor-pointer 
            transition-all duration-200 
            hover:border-purple-400 
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
            ${isUploading ? 'animate-pulse' : ''}
          `}
          onClick={handleClick}
        >
          {displayImage ? (
            <Image
              src={displayImage}
              alt={`${name} profile`}
              width={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
              height={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs">{placeholder}</div>
              </div>
            </div>
          )}

          {/* Upload Overlay */}
          {!disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                <div className="text-lg mb-1">📷</div>
                <div className="text-xs">
                  {isUploading ? 'Uploading...' : preview ? 'Change' : 'Upload'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Remove Button */}
        {preview && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage();
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            title="Remove image"
          >
            ×
          </button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload Button */}
      {!preview && !disabled && (
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm text-center max-w-xs">
          {error}
        </div>
      )}

      {/* Help Text */}
      {!error && (
        <div className="text-gray-500 text-xs text-center max-w-xs">
          {isUploading ? 'Processing image...' : 'JPEG, PNG, GIF up to 2MB'}
        </div>
      )}
    </div>
  );
}