'use client';

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Search, Award, Loader2 } from 'lucide-react';
import { AchievementPoster } from '@/components/downloads/AchievementPoster';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';

interface ResultItem {
  _id: string;
  programmeName: string;
  programmeCode: string;
  category: string;
  position: string;
  grade: string;
}

interface CandidateInfo {
  name: string;
  chestNumber: string;
  team: string;
  section: string;
  teamColor: string;
  teamName: string;
  profileImage?: string;
}

export default function DownloadsPage() {
  const [chestNumber, setChestNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState<CandidateInfo | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ResultItem | null>(null);

  // We need refs for each poster to capture them. We can use a map.
  const posterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chestNumber.trim()) return;

    setLoading(true);
    setError('');
    setCandidate(null);
    setResults([]);

    try {
      const res = await fetch(`/api/downloads?chestNumber=${encodeURIComponent(chestNumber.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      setCandidate(data.candidate);
      setResults(data.results);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching your results.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPoster = async (result: ResultItem) => {
    try {
      setDownloadingId(result._id);
      
      const element = posterRefs.current[result._id];
      if (!element) {
        throw new Error("Poster element not found");
      }

      // Temporarily make it visible to capture
      element.style.display = 'flex';
      
      // Give it a moment to render
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(element, { 
        quality: 1.0,
        pixelRatio: 2, // High resolution
        skipFonts: true // Fixes SecurityError: Failed to read the 'cssRules' property
      });

      // Hide it again
      element.style.display = 'none';

      const link = document.createElement('a');
      link.download = `${candidate?.name.replace(/\s+/g, '_')}_${result.programmeName.replace(/\s+/g, '_')}_Certificate.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating poster:', err);
      alert('Failed to generate poster. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumb pageName="Downloads" />

      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
            <Award size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Download Your Certificates</h1>
          <p className="text-gray-600">Enter your chest number below to view your results and download your achievement posters.</p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              value={chestNumber}
              onChange={(e) => setChestNumber(e.target.value)}
              placeholder="Enter Chest Number (e.g., 101)"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all"
              required
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
          </div>
          <button
            type="submit"
            disabled={loading || !chestNumber.trim()}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Searching...
              </>
            ) : (
              'Find My Results'
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 text-center">
          {error}
        </div>
      )}

      {/* Results Section */}
      {candidate && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Candidate Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner"
              style={{ backgroundColor: candidate.teamColor || '#3b82f6' }}
            >
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">{candidate.name}</h2>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">Chest No:</span> {candidate.chestNumber}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">Team:</span> {candidate.teamName}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900">Section:</span> <span className="capitalize">{candidate.section}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Your Achievements</h3>
            
            {results.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                <p className="text-gray-500">No results have been published for you yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result) => {
                  
                  // Color scheme based on position
                  let positionColor = 'bg-blue-100 text-blue-800 border-blue-200';
                  let badgeIcon = '🏅';
                  
                  if (result.position === '1st') {
                    positionColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    badgeIcon = '🥇';
                  } else if (result.position === '2nd') {
                    positionColor = 'bg-gray-100 text-gray-800 border-gray-200';
                    badgeIcon = '🥈';
                  } else if (result.position === '3rd') {
                    positionColor = 'bg-amber-100 text-amber-800 border-amber-200';
                    badgeIcon = '🥉';
                  } else if (result.position === 'Participation') {
                    positionColor = 'bg-green-100 text-green-800 border-green-200';
                    badgeIcon = '✨';
                  }

                  return (
                    <div key={result._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
                      <div className={`p-4 border-b flex justify-between items-center ${positionColor.split(' ')[0]}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{badgeIcon}</span>
                          <span className={`font-bold uppercase tracking-wider text-sm ${positionColor.split(' ')[1]}`}>
                            {result.position} {result.position !== 'Participation' ? 'Place' : ''}
                          </span>
                        </div>
                        {result.grade && (
                          <div className="bg-white px-3 py-1 rounded-lg font-bold shadow-sm text-sm">
                            Grade {result.grade}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{result.category}</span>
                        <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{result.programmeName}</h4>
                        <p className="text-sm text-gray-500 mb-6 font-mono">{result.programmeCode}</p>
                        
                        <div className="mt-auto flex gap-2">
                          <button
                            onClick={() => setPreviewResult(result)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => downloadPoster(result)}
                            disabled={downloadingId === result._id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors disabled:opacity-70"
                          >
                            {downloadingId === result._id ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Download size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Hidden render for image generation */}
                      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                        <div 
                          style={{ display: 'none' }} 
                          ref={(el) => {
                            posterRefs.current[result._id] = el;
                          }}
                        >
                          <AchievementPoster 
                            candidateName={candidate.name}
                            chestNumber={candidate.chestNumber}
                            teamName={candidate.teamName}
                            teamColor={candidate.teamColor}
                            programmeName={result.programmeName}
                            category={result.category}
                            position={result.position}
                            grade={result.grade}
                            profileImage={candidate.profileImage}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewResult && candidate && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setPreviewResult(null)}
        >
          {/* Close button in top right */}
          <button 
            onClick={() => setPreviewResult(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 flex items-center justify-center transition-colors z-50 text-xl"
          >
            ✕
          </button>

          {/* Floating download button */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent modal close
              downloadPoster(previewResult);
              setPreviewResult(null);
            }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-2xl transition-transform hover:scale-105 flex items-center gap-3 z-50"
          >
            <Download size={24} />
            Download Poster
          </button>

          {/* Just the poster scaled to fit screen */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{
              transform: 'scale(0.75)',
              transformOrigin: 'center center',
            }}
            className="shadow-2xl rounded-xl overflow-hidden"
          >
            <AchievementPoster 
              candidateName={candidate.name}
              chestNumber={candidate.chestNumber}
              teamName={candidate.teamName}
              teamColor={candidate.teamColor}
              programmeName={previewResult.programmeName}
              category={previewResult.category}
              position={previewResult.position}
              grade={previewResult.grade}
              profileImage={candidate.profileImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
