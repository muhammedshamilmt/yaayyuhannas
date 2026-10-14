'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Programme, ProgrammeParticipant, Team, Candidate, Result } from '@/types';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter } from '@/components/Navigation/PublicFooter';
import { ProgrammeCandidatesDrawer, DrawerCandidate } from '@/components/Programmes/ProgrammeCandidatesDrawer';
import { findProgramme } from '@/lib/resultsHelper';

export default function PublicProgrammePage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'arts' | 'sports'>('all');
  const [selectedSection, setSelectedSection] = useState<'all' | 'senior' | 'junior' | 'sub-junior' | 'general'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'individual' | 'group'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'registered' | 'not_registered' | 'completed'>('all');

  // Bottom Sheet Drawer State
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programmesRes, participantsRes, teamsRes, candidatesRes, resultsRes] = await Promise.all([
        fetch('/api/programmes'),
        fetch('/api/programme-participants'),
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/results'),
      ]);

      const [programmesData, participantsData, teamsData, candidatesData, resultsData] = await Promise.all([
        programmesRes.json(),
        participantsRes.json(),
        teamsRes.json(),
        candidatesRes.json(),
        resultsRes.json(),
      ]);

      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setResults(Array.isArray(resultsData) ? resultsData : []);
    } catch (error) {
      console.error('Error loading public programmes data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Count participants for a programme (strictly matched by programmeId or unique programmeCode)
  const getProgrammeParticipants = useCallback(
    (programme: Programme) => {
      const progId = programme._id?.toString();
      const progCode = programme.code?.trim().toLowerCase();

      return participants.filter((p) => {
        if (p.status === 'withdrawn') return false;
        if (progId && (p.programmeId === progId || (p as any).id === progId)) return true;
        if (progCode && p.programmeCode && p.programmeCode.trim().toLowerCase() === progCode) return true;
        return false;
      });
    },
    [participants]
  );

  // Helper: Determine Programme Status (accurately handles real registration status)
  const getProgrammeStatus = useCallback(
    (programme: Programme) => {
      const parts = getProgrammeParticipants(programme);
      const totalCands = parts.reduce((sum, p) => sum + (p.participants?.length || 0), 0);

      // If no candidates registered yet
      if (totalCands === 0) {
        return 'not_registered';
      }

      if (programme.status === 'completed' || (programme as any).isOver) return 'over';

      const progId = programme._id?.toString();
      const progCode = programme.code?.trim().toLowerCase();

      const hasResult = results.some((r) => {
        if (progId && (r.programmeId === progId || (r as any).id === progId)) return true;
        if (r.programme && progCode) {
          const parts = r.programme.split(' - ');
          const rCode = parts[0]?.trim().toLowerCase();
          if (rCode === progCode) return true;
        }
        return false;
      });

      if (hasResult) return 'completed';
      if (programme.status === 'active') return 'active';
      return 'upcoming';
    },
    [results, getProgrammeParticipants]
  );

  // Helper: Resolve all Drawer Candidates strictly from REAL registrations
  const getCandidatesForProgramme = useCallback(
    (programme: Programme | null): { candidateList: DrawerCandidate[]; totalTeamsCount: number } => {
      if (!programme) return { candidateList: [], totalTeamsCount: 0 };

      const matchedParticipations = getProgrammeParticipants(programme);

      // Strictly match results by exact programmeId or exact code
      const progId = programme._id?.toString();
      const progCode = programme.code?.trim().toLowerCase();

      const matchingResult = results.find((r) => {
        if (progId && (r.programmeId === progId || (r as any).id === progId)) return true;
        if (r.programme && progCode) {
          const parts = r.programme.split(' - ');
          const rCode = parts[0]?.trim().toLowerCase();
          if (rCode === progCode) return true;
        }
        return false;
      });

      const candidateMap = new Map<string, DrawerCandidate>();
      const teamsSet = new Set<string>();

      // 1. Gather ONLY from real registered programme participants
      matchedParticipations.forEach((part) => {
        const teamCode = part.teamCode || '';
        if (teamCode) teamsSet.add(teamCode);
        const team = teams.find((t) => t.code === teamCode);

        (part.participants || []).forEach((chestNum) => {
          const trimmedChest = String(chestNum).trim();
          const cand = candidates.find((c) => c.chestNumber === trimmedChest);

          let position: number | string | undefined = undefined;
          let grade: string | undefined = undefined;

          if (matchingResult) {
            if (matchingResult.firstPlace?.some((p) => p.chestNumber === trimmedChest)) position = 1;
            else if (matchingResult.secondPlace?.some((p) => p.chestNumber === trimmedChest)) position = 2;
            else if (matchingResult.thirdPlace?.some((p) => p.chestNumber === trimmedChest)) position = 3;

            const partGrade = matchingResult.participationGrades?.find(
              (p) => p.chestNumber === trimmedChest
            );
            if (partGrade) {
              grade = partGrade.grade;
              if (!position) position = 'Participation';
            }
          }

          candidateMap.set(trimmedChest, {
            chestNumber: trimmedChest,
            name: cand?.name || `Candidate #${trimmedChest}`,
            teamCode: teamCode || cand?.team || 'IND',
            teamName: team?.name || teamCode || cand?.team || 'Unknown',
            teamColor: team?.color || '#6366f1',
            section: cand?.section || programme.section || '',
            profileImage: cand?.profileImage,
            position,
            grade,
          });
        });
      });

      // Convert to array and sort
      const candidateList = Array.from(candidateMap.values()).sort((a, b) => {
        // Winners first
        const posOrder = (pos: any) => {
          if (pos === 1) return 1;
          if (pos === 2) return 2;
          if (pos === 3) return 3;
          if (pos) return 4;
          return 5;
        };
        const orderA = posOrder(a.position);
        const orderB = posOrder(b.position);
        if (orderA !== orderB) return orderA - orderB;

        // Then by team code
        if (a.teamCode !== b.teamCode) return a.teamCode.localeCompare(b.teamCode);

        // Then by chest number numeric or string
        const numA = parseInt(a.chestNumber, 10);
        const numB = parseInt(b.chestNumber, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.chestNumber.localeCompare(b.chestNumber);
      });

      return {
        candidateList,
        totalTeamsCount: teamsSet.size,
      };
    },
    [getProgrammeParticipants, results, candidates, teams]
  );

  // Open drawer for a programme
  const handleOpenDrawer = (programme: Programme) => {
    setSelectedProgramme(programme);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Filtered Programmes
  const filteredProgrammes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return programmes.filter((programme) => {
      // Search matching
      const matchesSearch =
        q === '' ||
        programme.name?.toLowerCase().includes(q) ||
        programme.code?.toLowerCase().includes(q) ||
        programme.category?.toLowerCase().includes(q) ||
        programme.section?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== 'all' && programme.category?.toLowerCase() !== selectedCategory) {
        return false;
      }

      // Section filter
      if (selectedSection !== 'all' && programme.section?.toLowerCase() !== selectedSection) {
        return false;
      }

      // Position Type filter
      if (selectedType !== 'all') {
        const type = programme.positionType || programme.type || 'individual';
        if (type.toLowerCase() !== selectedType) return false;
      }

      // Registration & Status filter
      if (selectedStatus !== 'all') {
        const status = getProgrammeStatus(programme);
        if (selectedStatus === 'not_registered') {
          if (status !== 'not_registered') return false;
        } else if (selectedStatus === 'registered') {
          if (status === 'not_registered') return false;
        } else if (selectedStatus === 'completed') {
          if (status !== 'completed' && status !== 'over') return false;
        }
      }

      return true;
    });
  }, [programmes, searchTerm, selectedCategory, selectedSection, selectedType, selectedStatus, getProgrammeStatus]);

  // Total counts for registered vs unregistered programmes
  const { registeredCount, notRegisteredCount } = useMemo(() => {
    let reg = 0;
    let notReg = 0;
    programmes.forEach((p) => {
      const parts = getProgrammeParticipants(p);
      const totalCands = parts.reduce((sum, part) => sum + (part.participants?.length || 0), 0);
      if (totalCands > 0) reg++;
      else notReg++;
    });
    return { registeredCount: reg, notRegisteredCount: notReg };
  }, [programmes, getProgrammeParticipants]);

  // Resolved drawer data for selected programme
  const drawerData = useMemo(() => {
    return getCandidatesForProgramme(selectedProgramme);
  }, [selectedProgramme, getCandidatesForProgramme]);

  // Badges & styling helpers
  const getCategoryBadge = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'arts':
        return { label: '🎭 Arts', cls: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'sports':
        return { label: '⚽ Sports', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      default:
        return { label: '🏆 General', cls: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const getSectionBadgeCls = (sec?: string) => {
    switch (sec?.toLowerCase()) {
      case 'senior':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'junior':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sub-junior':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_registered':
        return { label: 'Not Registered', cls: 'bg-slate-100 text-slate-500 border-slate-300' };
      case 'over':
        return { label: 'Concluded', cls: 'bg-rose-100 text-rose-700 border-rose-200' };
      case 'completed':
        return { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'active':
        return { label: 'Registered', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'upcoming':
        return { label: 'Upcoming', cls: 'bg-gray-100 text-gray-600 border-gray-200' };
      default:
        return { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };

  const isFilterActive =
    searchTerm !== '' ||
    selectedCategory !== 'all' ||
    selectedSection !== 'all' ||
    selectedType !== 'all' ||
    selectedStatus !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSection('all');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-gray-900 selection:text-white">
      {/* Public Header Navbar */}
      <PublicNavbar />

      {/* Hero Header */}
      <header className="relative bg-gradient-to-b from-gray-950 via-gray-900 to-slate-900 text-white pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Subtle decorative background lights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs sm:text-sm font-medium text-emerald-300 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Wattaqa Arts & Sports Fest 2K25
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 sm:mb-4">
            Programmes & Candidates
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Browse all stage & sports events. Tap any programme to view registered candidates, team colors, and chest numbers.
          </p>

          {/* Stat Counter Pills */}
          <div className="flex items-center justify-center gap-2 sm:gap-3.5 mt-6 flex-wrap text-xs sm:text-sm font-medium">
            <span className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200">
              🎭 <strong className="text-white">{programmes.length}</strong> Events
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              ✅ <strong className="text-white">{registeredCount}</strong> Registered
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
              ⚪ <strong className="text-white">{notRegisteredCount}</strong> Not Registered
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200">
              👥 <strong className="text-white">{candidates.length}</strong> Candidates
            </span>
          </div>
        </div>
      </header>

      {/* Main Interactive Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 -mt-6 sm:-mt-8 relative z-20">
        {/* Search & Filter Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-4 sm:p-6 mb-6 sm:mb-8 transition-all">
          {/* Top Row: Search Input */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search programmes by name, code (e.g. ANS01, Football)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 sm:py-3.5 text-sm sm:text-base bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all shadow-inner"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills Controls */}
          <div className="space-y-3">
            {/* Registration Status Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
                Status:
              </span>
              {[
                { key: 'all', label: `All Events (${programmes.length})` },
                { key: 'registered', label: `✅ Registered (${registeredCount})` },
                { key: 'not_registered', label: `⚪ Not Registered (${notRegisteredCount})` },
                { key: 'completed', label: '🏆 Results Out' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key as any)}
                  className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-full font-medium shrink-0 transition-all cursor-pointer ${
                    selectedStatus === tab.key
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
                Category:
              </span>
              {[
                { key: 'all', label: 'All Categories' },
                { key: 'arts', label: '🎭 Arts' },
                { key: 'sports', label: '⚽ Sports' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedCategory(tab.key as any)}
                  className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-full font-medium shrink-0 transition-all cursor-pointer border ${
                    selectedCategory === tab.key
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Section & Type Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
                Section:
              </span>
              {[
                { key: 'all', label: 'All Sections' },
                { key: 'senior', label: 'Senior' },
                { key: 'junior', label: 'Junior' },
                { key: 'sub-junior', label: 'Sub-Junior' },
                { key: 'general', label: 'General' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedSection(tab.key as any)}
                  className={`text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium shrink-0 transition-all cursor-pointer border ${
                    selectedSection === tab.key
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-300 mx-1 shrink-0" />

              {/* Type Filter */}
              {[
                { key: 'all', label: 'All Types' },
                { key: 'individual', label: '👤 Individual' },
                { key: 'group', label: '👥 Group' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedType(tab.key as any)}
                  className={`text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium shrink-0 transition-all cursor-pointer border ${
                    selectedType === tab.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary & Reset */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-500">
            <span>
              Showing <strong className="text-gray-900">{filteredProgrammes.length}</strong> of {programmes.length} events
            </span>
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Reset all filters</span>
                <span className="text-xs">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-gray-900 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium text-sm">Loading festival programmes...</p>
          </div>
        ) : filteredProgrammes.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-3xl">
              🔍
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No programmes found</h3>
            <p className="text-sm text-slate-500 mb-5">
              No festival events matched your search query or selected filters.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Programmes Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {filteredProgrammes.map((programme) => {
              const programmeParticipants = getProgrammeParticipants(programme);
              const totalCandidatesCount = programmeParticipants.reduce(
                (sum, p) => sum + (p.participants?.length || 0),
                0
              );
              const isRegistered = totalCandidatesCount > 0;
              const status = getProgrammeStatus(programme);
              const statusBadge = getStatusBadge(status);
              const catBadge = getCategoryBadge(programme.category);
              const isGroup = programme.positionType === 'group' || programme.type === 'group';

              return (
                <div
                  key={programme._id?.toString() || programme.code}
                  onClick={() => handleOpenDrawer(programme)}
                  className={`group rounded-2xl sm:rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden active:scale-[0.98] ${
                    isRegistered
                      ? 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-lg'
                      : 'bg-white/70 border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Subtle hover accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                    isRegistered
                      ? 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-emerald-500'
                      : 'bg-transparent group-hover:bg-slate-300'
                  }`} />

                  <div>
                    {/* Top Badges Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {programme.code}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${catBadge.cls}`}>
                          {catBadge.label}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize border ${getSectionBadgeCls(programme.section)}`}>
                          {programme.section}
                        </span>
                      </div>

                      {/* Status badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase shrink-0 ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Programme Name */}
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                      {programme.name}
                    </h3>

                    {/* Programme Sub-meta */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <span>{isGroup ? '👥 Group Event' : '👤 Individual Event'}</span>
                      {programme.requiredParticipants && (
                        <>
                          <span>•</span>
                          <span>{programme.requiredParticipants} req / team</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer with Candidate Count & View Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isRegistered ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-800">
                          {totalCandidatesCount}
                        </span>
                        <span className="text-slate-500">
                          {totalCandidatesCount === 1 ? 'Candidate' : 'Candidates'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                          {programmeParticipants.length} {programmeParticipants.length === 1 ? 'Team' : 'Teams'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        <span className="font-medium text-slate-500">
                          Not Registered
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">0 Candidates</span>
                      </div>
                    )}

                    <div className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                      isRegistered
                        ? 'text-gray-900 group-hover:text-blue-600'
                        : 'text-slate-500 group-hover:text-slate-800'
                    }`}>
                      <span>{isRegistered ? 'View Candidates' : 'Details'}</span>
                      <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Sheet Drawer Overlay for Candidates */}
      <ProgrammeCandidatesDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        programme={selectedProgramme}
        candidates={drawerData.candidateList}
        totalTeams={drawerData.totalTeamsCount}
        status={selectedProgramme ? getProgrammeStatus(selectedProgramme) : 'active'}
      />

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
