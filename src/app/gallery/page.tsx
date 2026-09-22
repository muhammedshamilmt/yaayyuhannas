"use client";

import { useState, useEffect } from 'react';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import Link from 'next/link';

interface GalleryImage {
  _id?: string;
  title: string;
  description?: string;
  category: string;
  eventOrTeam?: string;
  imageData: string; // Base64 string
  mimeType?: string;
  fileSize?: number;
  tags?: string[];
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PublicGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImageToView, setSelectedImageToView] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Photos', icon: '📸' },
    { id: 'events', label: 'Events', icon: '🎪' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'performances', label: 'Performances', icon: '🎭' },
    { id: 'awards', label: 'Awards', icon: '🏆' },
    { id: 'behind-scenes', label: 'Behind the Scenes', icon: '🎬' },
  ];

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
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = images.findIndex((img) => img.imageData === selectedImageToView);

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) {
      setSelectedImageToView(images[currentIndex + 1].imageData);
    }
  };

  const goToPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setSelectedImageToView(images[currentIndex - 1].imageData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-poppins  pb-12">
      <PublicNavbar />
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 lg:px-8 mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Festival <span className="text-blue-600">Gallery</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Relive the best moments from the Wattaqa Arts Fest 2K25. Browse through our collection of events, performances, and behind-the-scenes magic.
        </p>
      </div>

      {/* Filter Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center space-x-2 shadow-sm ${selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-blue-500/30 scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:scale-105'
                }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading moments...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Images Yet</h3>
            <p className="text-gray-500">Check back later for more amazing moments!</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((image, idx) => (
              <div
                key={image._id?.toString() || idx}
                className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedImageToView(image.imageData)}
              >
                <img
                  src={image.imageData}
                  alt={image.title}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                />

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <h3 className="text-white font-bold text-lg mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{image.title}</h3>
                  {image.eventOrTeam && (
                    <p className="text-blue-300 text-sm font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                      {image.eventOrTeam}
                    </p>
                  )}
                  <p className="text-gray-300 text-xs mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                    {image.createdAt ? new Date(image.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImageToView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-8 backdrop-blur-sm"
          onClick={() => setSelectedImageToView(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImageToView(null)}
              className="absolute top-0 right-0 sm:-top-4 sm:-right-4 text-white hover:text-gray-300 z-50 text-3xl font-bold bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
            >
              &times;
            </button>

            {/* Previous Button */}
            {currentIndex > 0 && (
              <button
                onClick={goToPrevImage}
                className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <img
              src={selectedImageToView}
              alt="Fullscreen view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next Button */}
            {currentIndex < images.length - 1 && (
              <button
                onClick={goToNextImage}
                className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
