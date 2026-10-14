'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Programme } from '@/types';

export interface DrawerCandidate {
  chestNumber: string;
  name: string;
  teamCode: string;
  teamName: string;
  teamColor: string;
  section: string;
  profileImage?: string;
  position?: number | string;
  grade?: string;
}

interface ProgrammeCandidatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  programme: Programme | null;
  candidates: DrawerCandidate[];
  totalTeams?: number;
  status?: string;
}

export function ProgrammeCandidatesDrawer({
  isOpen,
  onClose,
  programme,
  candidates,
  totalTeams = 0,
  status = 'active',
}: ProgrammeCandidatesDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [isClosing, setIsClosing] = useState(false);

  // Touch drag states for swipe-down to dismiss
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Smooth request close with exit animation
  const handleRequestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      setSearchQuery('');
      setSelectedTeamFilter('all');
      setDragOffset(0);
    }, 190);
  }, [isClosing, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientY;
    const diff = currentTouch - touchStart;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 75) {
      handleRequestClose();
    }
    setTouchStart(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleRequestClose]);

  // Unique teams participating in this programme
  const uniqueTeams = useMemo(() => {
    const map = new Map<string, { code: string; name: string; color: string }>();
    candidates.forEach((c) => {
      if (!map.has(c.teamCode)) {
        map.set(c.teamCode, {
          code: c.teamCode,
          name: c.teamName || c.teamCode,
          color: c.teamColor || '#6366f1',
        });
      }
    });
    return Array.from(map.values());
  }, [candidates]);

  // Filter candidates by search and team
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.chestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teamCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teamName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTeam =
        selectedTeamFilter === 'all' || c.teamCode === selectedTeamFilter;

      return matchesSearch && matchesTeam;
    });
  }, [candidates, searchQuery, selectedTeamFilter]);

  if (!isOpen && !isClosing) return null;

  const getPositionBadge = (pos?: number | string) => {
    if (pos === 1 || pos === '1') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
          🥇 1st Place
        </span>
      );
    }
    if (pos === 2 || pos === '2') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
          🥈 2nd Place
        </span>
      );
    }
    if (pos === 3 || pos === '3') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 shadow-xs">
          🥉 3rd Place
        </span>
      );
    }
    if (pos && typeof pos === 'string' && pos.toLowerCase().includes('participat')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          🎖️ Participation
        </span>
      );
    }
    return null;
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'arts':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'sports':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSectionBadge = (sec?: string) => {
    switch (sec?.toLowerCase()) {
      case 'senior':
        return 'bg-violet-100 text-violet-800';
      case 'junior':
        return 'bg-amber-100 text-amber-800';
      case 'sub-junior':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:pb-6 sm:px-4 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes publicDrawerSlideUp {
          0% {
            transform: translate3d(0, 100%, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes publicDrawerSlideDown {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(0, 100%, 0);
          }
        }
        @keyframes publicBackdropFadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes publicBackdropFadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>

      {/* Dimmed Backdrop */}
      <div
        onClick={handleRequestClose}
        style={{
          animation: isClosing
            ? 'publicBackdropFadeOut 190ms cubic-bezier(0.4, 0, 1, 1) forwards'
            : 'publicBackdropFadeIn 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto cursor-pointer"
        aria-hidden="true"
      />

      {/* Sheet Content (Immediate buttery smooth slide from bottom) */}
      <div
        style={{
          transform: dragOffset > 0 ? `translate3d(0, ${dragOffset}px, 0)` : undefined,
          animation: isDragging
            ? 'none'
            : isClosing
            ? 'publicDrawerSlideDown 190ms cubic-bezier(0.4, 0, 1, 1) forwards'
            : 'publicDrawerSlideUp 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col z-10 pointer-events-auto will-change-transform"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Pull / Drag Indicator Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleRequestClose}
          className="pt-3 pb-1 flex justify-center cursor-pointer group shrink-0 select-none"
          title="Drag down or click to dismiss"
        >
          <div className="w-12 h-1.5 bg-gray-300 group-hover:bg-gray-400 rounded-full transition-colors" />
        </div>

        {/* Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="px-6 pt-2 pb-4 border-b border-gray-100 shrink-0 select-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                  {programme?.code || 'PROG'}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getCategoryColor(
                    programme?.category
                  )}`}
                >
                  {programme?.category === 'arts' ? '🎭 Arts' : programme?.category === 'sports' ? '⚽ Sports' : programme?.category || 'General'}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getSectionBadge(
                    programme?.section
                  )}`}
                >
                  {programme?.section}
                </span>
                {status === 'not_registered' || candidates.length === 0 ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                    ⚪ Not Registered
                  </span>
                ) : status === 'over' ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    Concluded
                  </span>
                ) : status === 'completed' ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Results Out
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Registered
                  </span>
                )}
              </div>

              <h2
                id="drawer-title"
                className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-snug line-clamp-2"
              >
                {programme?.name || 'Programme Details'}
              </h2>

              <div className="text-xs text-gray-500 mt-1 flex items-center flex-wrap gap-2">
                <span className="font-semibold text-gray-800">
                  {candidates.length} {candidates.length === 1 ? 'Candidate' : 'Candidates'}
                </span>
                <span>•</span>
                <span className="font-semibold text-gray-800">
                  {totalTeams || uniqueTeams.length} {totalTeams === 1 ? 'Team' : 'Teams'}
                </span>
                {programme?.positionType && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{programme.positionType} Event</span>
                  </>
                )}
                {programme?.requiredParticipants && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-bold">
                      Req: {programme.requiredParticipants} / team
                    </span>
                  </>
                )}
                {programme?.maxParticipants && Number(programme.maxParticipants) > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-purple-600 font-bold">
                      Max: {programme.maxParticipants}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              onClick={handleRequestClose}
              aria-label="Close drawer"
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-all shrink-0 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search bar inside drawer if 3 or more candidates */}
          {candidates.length >= 3 && (
            <div className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search candidate, chest #, or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Team filter pills if multiple teams */}
          {uniqueTeams.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5 pb-0.5">
              <button
                onClick={() => setSelectedTeamFilter('all')}
                className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 transition-colors cursor-pointer ${
                  selectedTeamFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Teams ({candidates.length})
              </button>
              {uniqueTeams.map((team) => {
                const count = candidates.filter((c) => c.teamCode === team.code).length;
                const isSelected = selectedTeamFilter === team.code;
                return (
                  <button
                    key={team.code}
                    onClick={() => setSelectedTeamFilter(team.code)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: team.color || '#6b7280' }}
                    />
                    <span>{team.code}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Candidate List Body */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-5 py-3 space-y-2.5 divide-y divide-gray-100">
          {candidates.length === 0 ? (
            <div className="py-14 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3.5 text-3xl shadow-xs">
                📋
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                No Candidate Registrations
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                No teams have registered any candidates for <strong>{programme?.name}</strong> ({programme?.code}) yet.
              </p>
              <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 font-medium">
                <span>💡 Teams can register candidates via their Team Admin portal.</span>
              </div>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-2xl">
                🔍
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                No candidates match filter
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Try clearing your search query or team filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTeamFilter('all');
                }}
                className="mt-3 text-xs font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Clear search filters
              </button>
            </div>
          ) : (
            filteredCandidates.map((candidate, idx) => {
              const teamColor = candidate.teamColor || '#6366f1';
              const positionBadge = getPositionBadge(candidate.position);

              return (
                <div
                  key={`${candidate.chestNumber}-${idx}`}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group"
                >
                  {/* Left: Avatar with Team Color */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs overflow-hidden"
                      style={{
                        backgroundColor: teamColor,
                      }}
                    >
                      {candidate.profileImage ? (
                        <img
                          src={candidate.profileImage}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="tracking-tight text-white drop-shadow-xs">
                          {candidate.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}

                      {/* Small team dot in corner if avatar is image */}
                      {candidate.profileImage && (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: teamColor }}
                        />
                      )}
                    </div>

                    {/* Middle: Candidate info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base tracking-tight truncate">
                          {candidate.name}
                        </h4>
                        {/* Chest Number Badge */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-gray-900 text-white shrink-0">
                          #{candidate.chestNumber}
                        </span>
                      </div>

                      {/* Team indicator with team color pill */}
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-2xs"
                          style={{ backgroundColor: teamColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          {candidate.teamName || candidate.teamCode}
                        </span>

                        {candidate.section && (
                          <span className="text-[11px] text-gray-400 capitalize">
                            • {candidate.section}
                          </span>
                        )}

                        {candidate.grade && (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            Grade {candidate.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Awards or Placement */}
                  {positionBadge && (
                    <div className="shrink-0 pl-1">
                      {positionBadge}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Big Touch-friendly Close Button (like Continue in screenshot) */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 rounded-b-3xl shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0c2f24] hover:bg-[#071f18] active:scale-[0.99] text-white font-semibold text-sm sm:text-base tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
