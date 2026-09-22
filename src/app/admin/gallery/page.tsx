"use client";

import { useState, useEffect, useRef } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { GalleryImage } from '@/types';

interface GalleryStats {
  all: number;
  events: number;
  teams: number;
  performances: number;
  awards: number;
  'behind-scenes': number;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEventTeam, setSelectedEventTeam] = useState<string>('');
  const [stats, setStats] = useState<GalleryStats>({
    all: 0,
    events: 0,
    teams: 0,
    performances: 0,
    awards: 0,
    'behind-scenes': 0
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedImageToView, setSelectedImageToView] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, [selectedCategory]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/gallery?${params}`);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images);
        setStats(data.categoryStats);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSelectedImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) return;

    try {
      setUploading(true);
      
      const uploadPromises = selectedImages.map(async (file, index) => {
        const base64Data = await convertToBase64(file);
        
        return {
          title: `Festival Image ${Date.now()}-${index}`,
          description: `Uploaded on ${new Date().toLocaleDateString()}`,
          category: selectedCategory === 'all' ? 'events' : selectedCategory,
          eventOrTeam: selectedEventTeam || undefined,
          imageData: base64Data,
          mimeType: file.type,
          fileSize: file.size,
          tags: []
        };
      });

      const imageData = await Promise.all(uploadPromises);

      const response = await fetch('/api/gallery/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageData,
          uploadedBy: 'admin' // You can get this from user context
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully uploaded ${result.uploadedCount} images!`);
        
        // Clear selections
        setSelectedImages([]);
        setPreviewImages([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Refresh images
        fetchImages();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/gallery?id=${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Image deleted successfully!');
        fetchImages();
      } else {
        alert('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'events': return '🎪';
      case 'teams': return '👥';
      case 'performances': return '🎭';
      case 'awards': return '🏆';
      case 'behind-scenes': return '🎬';
      default: return '📷';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'events': return 'from-blue-50 to-cyan-50 border-blue-200 hover:shadow-blue-500/25';
      case 'teams': return 'from-green-50 to-emerald-50 border-green-200 hover:shadow-green-500/25';
      case 'performances': return 'from-purple-50 to-pink-50 border-purple-200 hover:shadow-purple-500/25';
      case 'awards': return 'from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-yellow-500/25';
      case 'behind-scenes': return 'from-red-50 to-rose-50 border-red-200 hover:shadow-red-500/25';
      default: return 'from-gray-50 to-gray-100 border-gray-200 hover:shadow-gray-500/25';
    }
  };
  return (
    <>
      <Breadcrumb pageName="Gallery" />

      <div className="space-y-6">
        {/* Upload New Images */}
        <ShowcaseSection title="Upload New Images">
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Festival Images</h3>
              <p className="text-gray-600 mb-4">Click to select images (supports multiple files)</p>
              <button 
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Select Images'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Preview Selected Images */}
            {previewImages.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Selected Images ({selectedImages.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {Math.round(selectedImages[index].size / 1024)}KB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select 
                  value={selectedCategory === 'all' ? 'events' : selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                >
                  <option value="events">Events</option>
                  <option value="teams">Teams</option>
                  <option value="performances">Performances</option>
                  <option value="awards">Awards</option>
                  <option value="behind-scenes">Behind the Scenes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event/Team (Optional)
                </label>
                <input
                  type="text"
                  value={selectedEventTeam}
                  onChange={(e) => setSelectedEventTeam(e.target.value)}
                  placeholder="e.g., Singing Competition, Team Sumud"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
            </div>

            {selectedImages.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        </ShowcaseSection>

        {/* Gallery Categories */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`p-4 bg-gradient-to-br border-2 rounded-xl hover:shadow-lg transition-all duration-300 text-center transform hover:scale-105 ${
              selectedCategory === 'all' 
                ? 'from-purple-100 to-pink-100 border-purple-300 shadow-lg shadow-purple-500/25' 
                : 'from-purple-50 to-pink-50 border-purple-200 hover:shadow-purple-500/25'
            }`}
          >
            <div className="text-3xl mb-2">🎭</div>
            <h3 className="font-bold text-gray-900 text-sm">All Images</h3>
            <p className="text-xs text-purple-600 font-medium">{stats.all} photos</p>
          </button>
          
          {(['events', 'teams', 'performances', 'awards', 'behind-scenes'] as const).map((category) => (
            <button 
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`p-4 bg-gradient-to-br border-2 rounded-xl hover:shadow-lg transition-all duration-300 text-center transform hover:scale-105 ${
                selectedCategory === category 
                  ? getCategoryColor(category).replace('50', '100').replace('200', '300') + ' shadow-lg'
                  : getCategoryColor(category)
              }`}
            >
              <div className="text-3xl mb-2">{getCategoryIcon(category)}</div>
              <h3 className="font-bold text-gray-900 text-sm capitalize">
                {category === 'behind-scenes' ? 'Behind Scenes' : category}
              </h3>
              <p className="text-xs font-medium">{stats[category]} photos</p>
            </button>
          ))}
        </div>

        {/* Gallery Images */}
        <ShowcaseSection title={`${selectedCategory === 'all' ? 'All' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Images`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📷</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Found</h3>
              <p className="text-gray-500">Upload some images to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => (
                <div key={image._id?.toString()} className="group relative">
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image.imageData}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedImageToView(image.imageData)}
                        className="bg-white text-gray-900 p-2 rounded-lg text-sm hover:bg-gray-100"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDeleteImage(image._id?.toString() || '')}
                        className="bg-red-500 text-white p-2 rounded-lg text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 truncate" title={image.title}>
                      {image.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {image.createdAt ? new Date(image.createdAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                    {image.eventOrTeam && (
                      <p className="text-xs text-blue-600 truncate" title={image.eventOrTeam}>
                        {image.eventOrTeam}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ShowcaseSection>

        {/* Gallery Management */}
        <ShowcaseSection title="Gallery Management">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Total Images</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.all}</p>
              <p className="text-sm text-gray-600">Across all categories</p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">💾</div>
              <h3 className="font-semibold text-gray-900 mb-2">Storage Used</h3>
              <p className="text-2xl font-bold text-gray-900">
                {images.reduce((total, img) => total + (img.fileSize || 0), 0) > 0 
                  ? `${(images.reduce((total, img) => total + (img.fileSize || 0), 0) / (1024 * 1024)).toFixed(1)} MB`
                  : '0 MB'
                }
              </p>
              <p className="text-sm text-gray-600">Base64 encoded images</p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-sm text-gray-600">Events, Teams, Performances, Awards, Behind Scenes</p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Quick Upload
            </button>
            <button 
              onClick={fetchImages}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
            >
              Refresh Gallery
            </button>
            <button 
              onClick={() => setSelectedCategory('all')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
            >
              Show All Images
            </button>
          </div>
        </ShowcaseSection>
      </div>

      {/* Image Modal */}
      {selectedImageToView && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setSelectedImageToView(null)}
        >
          <div className="relative max-w-5xl max-h-full w-full flex items-center justify-center">
            <button 
              onClick={() => setSelectedImageToView(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 text-3xl font-bold bg-black bg-opacity-50 w-10 h-10 rounded-full flex items-center justify-center"
            >
              &times;
            </button>
            <img 
              src={selectedImageToView} 
              alt="Fullscreen view" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}