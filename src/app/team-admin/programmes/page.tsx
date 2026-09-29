'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Candidate, FestivalInfo, Programme, ProgrammeParticipant, Team } from '@/types';
import TeamBreadcrumb from '@/components/TeamAdmin/TeamBreadcrumb';
import { Eye, Printer } from 'lucide-react';

export default function TeamProgrammesPage() {
  const searchParams = useSearchParams();
  const getFallbackTeam = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedTeam');
      if (saved) return saved;
      try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.team?.code) return u.team.code;
        }
      } catch (e) { }
    }
    return 'SMD';
  };
  const teamCode = searchParams.get('team') || getFallbackTeam();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'unregistered'>('all');
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [festInfo, setFestInfo] = useState<FestivalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [teamCode]);

  // Filter out blank/empty programmes
  const filterValidProgrammes = (programmes: Programme[]) => {
    if (!Array.isArray(programmes)) return [];
    return programmes.filter(programme =>
      programme &&
      programme.name && String(programme.name).trim() !== '' &&
      programme.code && String(programme.code).trim() !== ''
    );
  };

  const fetchData = async () => {
    try {
      const [candidatesRes, programmesRes, participantsRes, teamsRes, festRes] = await Promise.all([
        fetch(`/api/candidates?team=${teamCode}`),
        fetch('/api/programmes'),
        fetch(`/api/programme-participants?team=${teamCode}`),
        fetch('/api/teams'),
        fetch('/api/festival-info')
      ]);

      const [candidatesData, programmesData, participantsData, teamsData, festData] = await Promise.all([
        candidatesRes.ok ? candidatesRes.json() : [],
        programmesRes.ok ? programmesRes.json() : [],
        participantsRes.ok ? participantsRes.json() : [],
        teamsRes.ok ? teamsRes.json() : [],
        festRes.ok ? festRes.json() : null
      ]);

      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setProgrammes(filterValidProgrammes(programmesData));
      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      setTeamData(Array.isArray(teamsData) ? teamsData.find((t: Team) => t.code === teamCode) || null : null);
      setFestInfo(festData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/programme-participants?team=${teamCode}`);
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  // Section options
  const sectionOptions = [
    { value: 'all', label: 'All Sections' },
    { value: 'senior', label: 'Senior' },
    { value: 'junior', label: 'Junior' },
    { value: 'sub-junior', label: 'Sub Junior' },
    { value: 'general', label: 'General' },
  ];

  const availableProgrammes = programmes;

  // Calculate unique registered programme IDs for this team
  const registeredProgrammeIds = [...new Set(participants.map(p => p.programmeId))];
  const registeredProgIdSet = new Set(registeredProgrammeIds);

  // Set of individual programme IDs and codes separated by Arts and Sports
  const { individualArtsProgIdSet, individualSportsProgIdSet } = useMemo(() => {
    const artsSet = new Set<string>();
    const sportsSet = new Set<string>();
    programmes.forEach(p => {
      if (p.positionType === 'individual' || (p as any).type === 'individual') {
        const isSports = (p.category || '').toLowerCase() === 'sports';
        const targetSet = isSports ? sportsSet : artsSet;
        if (p._id) targetSet.add(p._id.toString());
        if (p.id) targetSet.add(p.id.toString());
        if (p.code) targetSet.add(p.code);
      }
    });
    return { individualArtsProgIdSet: artsSet, individualSportsProgIdSet: sportsSet };
  }, [programmes]);

  // Section counts
  const sectionCounts = {
    all: availableProgrammes.length,
    senior: availableProgrammes.filter(p => p.section === 'senior').length,
    junior: availableProgrammes.filter(p => p.section === 'junior').length,
    'sub-junior': availableProgrammes.filter(p => p.section === 'sub-junior').length,
    general: availableProgrammes.filter(p => p.section === 'general').length,
  };

  const filteredProgrammes = availableProgrammes.filter(p => {
    // 1. Search filter
    const matchesSearch =
      searchQuery === '' ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Section filter
    const matchesSection =
      selectedSection === 'all' ||
      p.section === selectedSection;

    // 3. Status filter
    const isProgRegistered = registeredProgIdSet.has(p._id?.toString() || '');
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'registered' && isProgRegistered) ||
      (statusFilter === 'unregistered' && !isProgRegistered);

    return matchesSearch && matchesSection && matchesStatus;
  });

  // Calculate correct statistics
  const availableProgrammesCount = availableProgrammes.length;
  const registeredCount = registeredProgrammeIds.length;
  const unregisteredCount = Math.max(0, availableProgrammesCount - registeredCount);

  const groupedProgrammes = {
    sports: filteredProgrammes.filter(p => p.category === 'sports' && p.section !== 'general'),
    sportsGeneral: filteredProgrammes.filter(p => p.category === 'sports' && p.section === 'general'),
    artsStage: filteredProgrammes.filter(p => p.category === 'arts' && (p.subcategory === 'stage' || !p.subcategory) && p.section !== 'general'),
    artsStageGeneral: filteredProgrammes.filter(p => p.category === 'arts' && (p.subcategory === 'stage' || !p.subcategory) && p.section === 'general'),
    artsNonStage: filteredProgrammes.filter(p => p.category === 'arts' && p.subcategory === 'non-stage' && p.section !== 'general'),
    artsNonStageGeneral: filteredProgrammes.filter(p => p.category === 'arts' && p.subcategory === 'non-stage' && p.section === 'general'),
    general: filteredProgrammes.filter(p => (p.category as any) === 'general')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading programmes...</p>
        </div>
      </div>
    );
  }

  const minArtsLimit = festInfo?.minCandidateArtsParticipation ?? festInfo?.minCandidateParticipation ?? 1;
  const maxArtsLimit = festInfo?.maxCandidateArtsParticipation ?? festInfo?.maxCandidateParticipation ?? 3;
  const minSportsLimit = festInfo?.minCandidateSportsParticipation ?? 0;
  const maxSportsLimit = festInfo?.maxCandidateSportsParticipation ?? festInfo?.maxCandidateParticipation ?? 3;

  // Calculate candidate individual participation counts by category
  const candidateArtsCounts = candidates.reduce((acc, c) => {
    acc[c.chestNumber] = participants.filter(
      p => p.status !== 'withdrawn' &&
        (individualArtsProgIdSet.has(p.programmeId) || individualArtsProgIdSet.has(p.programmeCode)) &&
        p.participants?.includes(c.chestNumber)
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const candidateSportsCounts = candidates.reduce((acc, c) => {
    acc[c.chestNumber] = participants.filter(
      p => p.status !== 'withdrawn' &&
        (individualSportsProgIdSet.has(p.programmeId) || individualSportsProgIdSet.has(p.programmeCode)) &&
        p.participants?.includes(c.chestNumber)
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const underMinCandidates = candidates.filter(c => {
    const artsCount = candidateArtsCounts[c.chestNumber] || 0;
    const sportsCount = candidateSportsCounts[c.chestNumber] || 0;
    return artsCount < minArtsLimit || (minSportsLimit > 0 && sportsCount < minSportsLimit);
  });
  const isTeamEligible = candidates.length > 0 && underMinCandidates.length === 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <TeamBreadcrumb pageName="Programme Registration" teamData={teamData || undefined} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programme Registration</h1>
          <p className="text-gray-600">Register your team for competitions and events</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <Link
            href={`/team-admin/programmes/pdf?team=${teamCode}&mode=preview`}
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all active:scale-95 border border-slate-300 hover:border-slate-400"
            title="Open Document Preview in New Tab"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Preview in New Tab</span>
          </Link>
          <Link
            href={`/team-admin/programmes/pdf?team=${teamCode}`}
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 border border-slate-700 hover:border-slate-500"
            title="Open 3-Column Grid PDF Generator & Selection in New Tab"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>PDF Generator (3-Col)</span>
          </Link>
          <div className="text-right px-4 py-2 rounded-lg border shadow-sm text-white"
            style={{ backgroundColor: teamData?.color || '#3B82F6' }}>
            <div className="text-2xl font-bold">{registeredCount}</div>
            <div className="text-xs uppercase tracking-wider opacity-90">Registered</div>
          </div>
        </div>
      </div>

      {/* Section and Status Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Section:
            </span>
            {sectionOptions.map((opt) => {
              const isSelected = selectedSection === opt.value;
              const count = sectionCounts[opt.value as keyof typeof sectionCounts] ?? 0;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedSection(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                >
                  <span>{opt.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Status Filter & Search Box */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-medium px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="registered">Registered Only</option>
              <option value="unregistered">Not Registered Only</option>
            </select>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-60">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Reset button if filter is active */}
            {(selectedSection !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSection('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-2 rounded-lg hover:bg-rose-50 transition-colors whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Indicator / Summary */}
        {(selectedSection !== 'all' || statusFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex-wrap">
            <span>Filtering by:</span>
            {selectedSection !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
                Section: <strong className="capitalize">{selectedSection}</strong>
                <button type="button" onClick={() => setSelectedSection('all')} className="hover:text-blue-900 ml-0.5">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-100">
                Status: <strong className="capitalize">{statusFilter}</strong>
                <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-purple-900 ml-0.5">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-100">
                Query: <strong>"{searchQuery}"</strong>
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-amber-900 ml-0.5">×</button>
              </span>
            )}
            <span className="ml-auto text-gray-400 font-medium">
              Showing {filteredProgrammes.length} of {availableProgrammes.length} programmes
            </span>
          </div>
        )}
      </div>

      {/* Team Participation & Eligibility Banner */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${isTeamEligible
        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-900'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900'
        }`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">{isTeamEligible ? '🟢' : '⚠️'}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base">
                Team Eligibility: {isTeamEligible ? 'Eligible' : 'Not Eligible (Under Minimum)'}
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${isTeamEligible ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                }`}>
                {isTeamEligible ? 'All Requirements Met' : `${underMinCandidates.length} Under Minimum`}
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-700">
              Rules: 🎭 Arts: <strong>{minArtsLimit}–{maxArtsLimit}</strong> {minSportsLimit > 0 || maxSportsLimit > 0 ? <>• ⚽ Sports: <strong>{minSportsLimit}–{maxSportsLimit}</strong></> : null} individual programmes per student.
              {!isTeamEligible && underMinCandidates.length > 0 && (
                <span className="text-rose-700 font-semibold block mt-1">
                  Need more individual programmes: {underMinCandidates.slice(0, 5).map(c => {
                    const a = candidateArtsCounts[c.chestNumber] || 0;
                    const s = candidateSportsCounts[c.chestNumber] || 0;
                    return `${c.name} (${a}/${minArtsLimit} Arts${minSportsLimit > 0 ? `, ${s}/${minSportsLimit} Sports` : ''})`;
                  }).join(', ')}{underMinCandidates.length > 5 ? ` +${underMinCandidates.length - 5} more` : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-xs text-right text-gray-600 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200">
          <div>Limits: <strong>🎭 Arts: {minArtsLimit}m/{maxArtsLimit}M • ⚽ Sports: {minSportsLimit}m/{maxSportsLimit}M</strong></div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{availableProgrammesCount}</div>
            <div className="text-sm text-gray-600">Available Programmes</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{registeredCount}</div>
            <div className="text-sm text-gray-600">Registered</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{unregisteredCount}</div>
            <div className="text-sm text-gray-600">Not Registered</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{candidates.length}</div>
            <div className="text-sm text-gray-600">Team Members</div>
          </div>
        </div>
      </div>

      {/* Programme Categories */}
      <div className="space-y-6">
        {/* Sports Programmes */}
        {groupedProgrammes.sports.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-green-50">
              <h2 className="text-lg font-semibold text-green-800">Sports Programmes</h2>
              <p className="text-sm text-green-600">Regular sports competitions by section</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.sports.map((programme) => (
                  <ProgrammeCard
                    key={programme._id?.toString()}
                    programme={programme}
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                    minArtsLimit={minArtsLimit}
                    maxArtsLimit={maxArtsLimit}
                    minSportsLimit={minSportsLimit}
                    maxSportsLimit={maxSportsLimit}
                    individualArtsProgIdSet={individualArtsProgIdSet}
                    individualSportsProgIdSet={individualSportsProgIdSet}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sports General Programmes */}
        {groupedProgrammes.sportsGeneral.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-green-100">
              <h2 className="text-lg font-semibold text-green-900">Sports General Programmes</h2>
              <p className="text-sm text-green-700">General sports events open to all sections</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.sportsGeneral.map((programme) => (
                  <ProgrammeCard
                    key={programme._id?.toString()}
                    programme={programme}
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                    minArtsLimit={minArtsLimit}
                    maxArtsLimit={maxArtsLimit}
                    minSportsLimit={minSportsLimit}
                    maxSportsLimit={maxSportsLimit}
                    individualArtsProgIdSet={individualArtsProgIdSet}
                    individualSportsProgIdSet={individualSportsProgIdSet}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arts Stage Programmes */}
        {groupedProgrammes.artsStage.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-purple-50">
              <h2 className="text-lg font-semibold text-purple-800">Arts Stage Programmes</h2>
              <p className="text-sm text-purple-600">Stage performances by section</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.artsStage.map((programme) => (
                  <ProgrammeCard
                    key={programme._id?.toString()}
                    programme={programme}
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                    minArtsLimit={minArtsLimit}
                    maxArtsLimit={maxArtsLimit}
                    minSportsLimit={minSportsLimit}
                    maxSportsLimit={maxSportsLimit}
                    individualArtsProgIdSet={individualArtsProgIdSet}
                    individualSportsProgIdSet={individualSportsProgIdSet}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arts Stage General Programmes */}
        {groupedProgrammes.artsStageGeneral.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-purple-100">
              <h2 className="text-lg font-semibold text-purple-900">Arts Stage General Programmes</h2>
              <p className="text-sm text-purple-700">General stage events open to all sections</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.artsStageGeneral.map((programme) => (
                  <ProgrammeCard
                    key={programme._id?.toString()}
                    programme={programme}
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                    minArtsLimit={minArtsLimit}
                    maxArtsLimit={maxArtsLimit}
                    minSportsLimit={minSportsLimit}
                    maxSportsLimit={maxSportsLimit}
                    individualArtsProgIdSet={individualArtsProgIdSet}
                    individualSportsProgIdSet={individualSportsProgIdSet}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arts Non-Stage Programmes */}
        {groupedProgrammes.artsNonStage.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-blue-50">
              <h2 className="text-lg font-semibold text-blue-800">Arts Non-Stage Programmes</h2>
              <p className="text-sm text-blue-600">Non-stage arts competitions by section</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.artsNonStage.map((programme) => (
                  <ProgrammeCard
                    key={programme._id?.toString()}
                    programme={programme}
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                    minArtsLimit={minArtsLimit}
                    maxArtsLimit={maxArtsLimit}
                    minSportsLimit={minSportsLimit}
                    maxSportsLimit={maxSportsLimit}
                    individualArtsProgIdSet={individualArtsProgIdSet}
                    individualSportsProgIdSet={individualSportsProgIdSet}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arts Non-Stage General Programmes */}
        {groupedProgrammes.artsNonStageGeneral.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-blue-100">
              <h2 className="text-lg font-semibold text-blue-900">Arts Non-Stage General Programmes</h2>
              <p className="text-sm text-blue-700">General non-stage events open to all sections</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.artsNonStageGeneral.map((programme) => (
                  <ProgrammeCard
                    key={programme._id?.toString()}
                    programme={programme}
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                    minArtsLimit={minArtsLimit}
                    maxArtsLimit={maxArtsLimit}
                    minSportsLimit={minSportsLimit}
                    maxSportsLimit={maxSportsLimit}
                    individualArtsProgIdSet={individualArtsProgIdSet}
                    individualSportsProgIdSet={individualSportsProgIdSet}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* General Programmes */}
        {groupedProgrammes.general.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">General Programmes</h2>
              <p className="text-sm text-gray-600">Special events and general competitions</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedProgrammes.general.map((programme) => (
                  <ProgrammeCard
                    key={programme._id?.toString()}
                    programme={programme}
                    teamCode={teamCode}
                    candidates={candidates}
                    participants={participants}
                    onUpdate={fetchParticipants}
                    minArtsLimit={minArtsLimit}
                    maxArtsLimit={maxArtsLimit}
                    minSportsLimit={minSportsLimit}
                    maxSportsLimit={maxSportsLimit}
                    individualArtsProgIdSet={individualArtsProgIdSet}
                    individualSportsProgIdSet={individualSportsProgIdSet}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Programmes Message */}
        {Object.values(groupedProgrammes).every(group => group.length === 0) && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Programmes Found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {searchQuery || selectedSection !== 'all' || statusFilter !== 'all'
                ? `No programmes match your current filters (Section: ${selectedSection === 'all' ? 'All' : selectedSection}${statusFilter !== 'all' ? `, Status: ${statusFilter}` : ''}${searchQuery ? `, Query: "${searchQuery}"` : ''}).`
                : 'Programmes will appear here once they are added by the administrator.'
              }
            </p>
            {(selectedSection !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSection('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Programme Card Component
function ProgrammeCard({
  programme,
  teamCode,
  candidates,
  participants,
  onUpdate,
  minLimit = 1,
  maxLimit = 3,
  minArtsLimit = 1,
  maxArtsLimit = 3,
  minSportsLimit = 0,
  maxSportsLimit = 3,
  individualArtsProgIdSet,
  individualSportsProgIdSet,
}: {
  programme: Programme;
  teamCode: string;
  candidates: Candidate[];
  participants: ProgrammeParticipant[];
  onUpdate: () => void;
  minLimit?: number;
  maxLimit?: number;
  minArtsLimit?: number;
  maxArtsLimit?: number;
  minSportsLimit?: number;
  maxSportsLimit?: number;
  individualArtsProgIdSet?: Set<string>;
  individualSportsProgIdSet?: Set<string>;
}) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isIndividualProgramme = programme.positionType === 'individual' || (programme as any).type === 'individual';
  const isSports = (programme.category || '').toLowerCase() === 'sports';
  const categoryLabel = isSports ? 'Sports' : 'Arts';
  const currentMinLimit = isSports ? (minSportsLimit ?? 0) : (minArtsLimit ?? minLimit);
  const currentMaxLimit = isSports ? (maxSportsLimit ?? maxLimit) : (maxArtsLimit ?? maxLimit);
  const relevantIdSet = isSports ? individualSportsProgIdSet : individualArtsProgIdSet;

  // Helper to count other individual programme participations of this category for a candidate
  const getCandidateIndividualProgCount = (chestNumber: string) => {
    return participants.filter(
      p => p.status !== 'withdrawn' &&
        p.programmeId !== programme._id?.toString() &&
        p.programmeCode !== programme.code &&
        p.participants?.includes(chestNumber) &&
        (relevantIdSet ? (relevantIdSet.has(p.programmeId) || relevantIdSet.has(p.programmeCode)) : true)
    ).length;
  };

  const existingParticipant = participants.find(p => p.programmeId === programme._id?.toString());
  const isRegistered = !!existingParticipant;
  const isOver = programme.status === 'completed' || (programme as any).isOver === true;

  // Filter candidates based on programme section
  const sectionCandidates = candidates.filter(candidate => {
    // For general programmes, all team candidates are eligible
    if (programme.section === 'general') return true;
    // For section-specific programmes, only candidates from that section
    return candidate.section === programme.section;
  });

  const openModal = () => {
    if (isOver) {
      alert(`🛑 Programme "${programme.name}" is OVER. Registrations are closed.`);
      return;
    }
    setSelectedParticipants([]);
    setSearchTerm('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedParticipants([]);
    setSearchTerm('');
  };

  const openEditModal = () => {
    if (isOver) {
      alert(`🛑 Programme "${programme.name}" is OVER. Registrations and edits are closed.`);
      return;
    }
    // Pre-populate with existing participants
    if (existingParticipant) {
      setSelectedParticipants(existingParticipant.participants.map((p: any) => p?.candidateId || p));
    }
    setSearchTerm('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedParticipants([]);
    setSearchTerm('');
  };

  // Filter candidates based on search term
  const filteredCandidates = sectionCandidates.filter(candidate =>
    candidate.chestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleParticipantToggle = (chestNumber: string) => {
    if (isOver) {
      alert(`🛑 Programme "${programme.name}" is OVER. Changes are not allowed.`);
      return;
    }
    setSelectedParticipants(prev => {
      const isCurrentlySelected = prev.includes(chestNumber);

      if (isCurrentlySelected) {
        return prev.filter(p => p !== chestNumber);
      } else {
        // Enforce maximum participation limit ONLY for individual programmes
        if (isIndividualProgramme) {
          const individualCount = getCandidateIndividualProgCount(chestNumber);
          if (individualCount >= currentMaxLimit) {
            const cand = candidates.find(c => c.chestNumber === chestNumber);
            alert(`🚫 Cannot select ${cand?.name || chestNumber}: Candidate has already reached the maximum allowed limit of ${currentMaxLimit} individual ${categoryLabel} programme(s).`);
            return prev;
          }
        }

        // Check if we can add more
        if (prev.length < Number(programme.requiredParticipants)) {
          return [...prev, chestNumber];
        } else {
          alert(`Maximum ${programme.requiredParticipants} participants allowed. Please deselect someone first.`);
          return prev;
        }
      }
    });
  };

  const handleRegister = async () => {
    if (isOver) {
      alert(`🛑 Programme "${programme.name}" is OVER. Registrations are closed.`);
      return;
    }
    if (selectedParticipants.length !== Number(programme.requiredParticipants)) {
      alert(`Please select exactly ${programme.requiredParticipants} participant(s)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/programme-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: programme._id,
          programmeCode: programme.code,
          programmeName: programme.name,
          teamCode,
          participants: selectedParticipants,
          status: 'registered'
        })
      });

      if (response.ok) {
        closeModal();
        onUpdate();
        alert('Successfully registered for programme!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to register'}`);
      }
    } catch (error) {
      console.error('Error registering participants:', error);
      alert('Error registering for programme');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (isOver) {
      alert(`🛑 Programme "${programme.name}" is OVER. Edits are closed.`);
      return;
    }
    if (selectedParticipants.length !== Number(programme.requiredParticipants)) {
      alert(`Please select exactly ${programme.requiredParticipants} participant(s)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/programme-participants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: programme._id,
          teamCode,
          participants: selectedParticipants
        })
      });

      if (response.ok) {
        closeEditModal();
        onUpdate();
        alert('Successfully updated participants!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update'}`);
      }
    } catch (error) {
      console.error('Error updating participants:', error);
      alert('Error updating participants');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`border-2 rounded-xl p-5 transition-all duration-200 relative ${isOver
        ? 'border-rose-300 bg-rose-50/40 shadow-xs'
        : isRegistered
          ? 'border-green-300 bg-green-50 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white'
        }`}>
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1">
            <Link
              href={`/programmes/${programme._id}`}
              className="font-bold text-base text-gray-900 hover:text-blue-600 hover:underline leading-tight transition-colors block"
            >
              {programme.name}
            </Link>
            {isOver && (
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                <span>🛑</span> PROGRAMME IS OVER
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isOver && (
              <span className="text-xs bg-rose-600 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-xs flex items-center gap-1 animate-pulse">
                <span>🛑</span> OVER
              </span>
            )}
            <span className="text-xs bg-gray-800 text-white px-3 py-1 rounded-full font-mono font-bold">
              {programme.code}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            <span className="capitalize font-medium">{programme.section} Section</span>
            {programme.section !== 'general' && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {sectionCandidates.length} eligible
              </span>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            <span className="capitalize font-medium">{programme.positionType} Competition</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            <span className="font-medium">{programme.requiredParticipants} Participant{programme.requiredParticipants > 1 ? 's' : ''} Required</span>
          </div>
        </div>

        {isOver ? (
          isRegistered ? (
            <div className="space-y-3">
              <div className="flex items-center text-green-700 font-semibold text-sm">
                <span className="text-lg mr-2">✅</span>
                Registered (Locked)
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-rose-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Team Participants:</div>
                <div className="flex flex-wrap gap-1">
                  {existingParticipant.participants.map((participant, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-mono">
                      {participant}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert(`🛑 Programme "${programme.name}" is OVER. Registrations and edits are closed.`)}
                className="w-full bg-gray-200 text-gray-500 text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-gray-300"
              >
                <span>🔒</span> Programme is Over (Edits Closed)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => alert(`🛑 Programme "${programme.name}" is OVER. Registrations are closed.`)}
              className="w-full bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-sm font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>🛑</span> Programme is Over (Closed)
            </button>
          )
        ) : isRegistered ? (
          <div className="space-y-3">
            <div className="flex items-center text-green-700 font-semibold text-sm">
              <span className="text-lg mr-2">✅</span>
              Registered Successfully
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="text-xs font-semibold text-gray-700 mb-2">Team Participants:</div>
              <div className="flex flex-wrap gap-1">
                {existingParticipant.participants.map((participant, index) => (
                  <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-mono">
                    {participant}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={openEditModal}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Edit Participants
            </button>
          </div>
        ) : (
          <button
            onClick={openModal}
            disabled={sectionCandidates.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {sectionCandidates.length === 0 ? '❌ No Eligible Candidates' : '➕ Register for Programme'}
          </button>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[100vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1">{programme.name}</h3>
                  <div className="flex items-center space-x-4 text-blue-100 text-sm">
                    <span>📋 {programme.code}</span>
                    <span>👥 {programme.section}</span>
                    <span>🎯 {programme.positionType}</span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  <div>
                    <h4 className="font-semibold text-blue-900">Registration Requirements</h4>
                    <p className="text-blue-700 text-sm">
                      Select exactly <strong>{programme.requiredParticipants}</strong> participant{programme.requiredParticipants > 1 ? 's' : ''} from your team
                    </p>
                  </div>
                </div>
              </div>

              {sectionCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😔</div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">No Eligible Candidates</h4>
                  <p className="text-gray-500">
                    {programme.section === 'general'
                      ? 'No team candidates available for this programme.'
                      : `No ${programme.section} section candidates available. This programme requires ${programme.section} section participants.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">👥</span>
                      Select Team Participants
                    </h4>

                    {/* Search Box */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Search by chest number or name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-lg">🔍</span>
                        </div>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <span className="text-lg">✕</span>
                          </button>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">
                          Showing {filteredCandidates.length} of {sectionCandidates.length} eligible candidates
                        </p>
                        <button
                          onClick={() => setSelectedParticipants([])}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Clear All Selections
                        </button>
                      </div>
                    </div>

                    {/* Quick Add by Chest Number */}
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="font-semibold text-yellow-800 mb-2 flex items-center">
                        <span className="mr-2">⚡</span>
                        Quick Add by Chest Number
                      </h5>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Type chest number (e.g., SMD001)"
                          className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const chestNumber = e.currentTarget.value.toUpperCase();
                              const candidate = candidates.find(c => c.chestNumber === chestNumber);
                              if (candidate && !selectedParticipants.includes(chestNumber) && selectedParticipants.length < Number(programme.requiredParticipants)) {
                                if (isIndividualProgramme) {
                                  const individualCount = getCandidateIndividualProgCount(chestNumber);
                                  if (individualCount >= currentMaxLimit) {
                                    alert(`🚫 Cannot add ${candidate.name}: Candidate has reached the maximum allowed limit of ${currentMaxLimit} individual ${categoryLabel} programme(s).`);
                                    return;
                                  }
                                }
                                handleParticipantToggle(chestNumber);
                                e.currentTarget.value = '';
                              } else if (!candidate) {
                                alert('Chest number not found in your team');
                              } else if (selectedParticipants.includes(chestNumber)) {
                                alert('Candidate already selected');
                              } else {
                                alert('Maximum participants reached');
                              }
                            }
                          }}
                        />
                        <div className="text-xs text-yellow-700 flex items-center">
                          Press Enter to add
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                      {filteredCandidates.length === 0 ? (
                        <div className="col-span-2 text-center py-8">
                          <div className="text-4xl mb-2">🔍</div>
                          <p className="text-gray-500">No candidates found matching "{searchTerm}"</p>
                        </div>
                      ) : (
                        filteredCandidates.map((candidate) => {
                          const isSelected = selectedParticipants.includes(candidate.chestNumber);
                          const individualCount = getCandidateIndividualProgCount(candidate.chestNumber);
                          const hasReachedMax = isIndividualProgramme && !isSelected && individualCount >= currentMaxLimit;
                          const isRequiredLimitReached = !isSelected && selectedParticipants.length >= Number(programme.requiredParticipants);
                          const isDisabled = hasReachedMax || isRequiredLimitReached;

                          return (
                            <div
                              key={candidate._id?.toString()}
                              className={`border-2 rounded-lg p-4 transition-all ${isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-md cursor-pointer'
                                : hasReachedMax
                                  ? 'border-red-200 bg-red-50/50 opacity-60 cursor-not-allowed'
                                  : isRequiredLimitReached
                                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                                }`}
                              onClick={() => {
                                if (isSelected) {
                                  handleParticipantToggle(candidate.chestNumber);
                                } else if (hasReachedMax) {
                                  alert(`🚫 Candidate ${candidate.name} (#${candidate.chestNumber}) has already reached the maximum participation limit of ${currentMaxLimit} individual ${categoryLabel} programme(s).`);
                                } else if (!isRequiredLimitReached) {
                                  handleParticipantToggle(candidate.chestNumber);
                                } else {
                                  alert(`Maximum ${programme.requiredParticipants} participants allowed for this programme.`);
                                }
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                  }`}>
                                  {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900 font-mono text-base">
                                      {candidate.chestNumber}
                                    </span>
                                    {isIndividualProgramme ? (
                                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${individualCount >= currentMinLimit
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                        }`}>
                                        {individualCount} / {currentMaxLimit} {categoryLabel.toLowerCase()} prog
                                      </span>
                                    ) : (
                                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                        Group Event
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-gray-700 font-medium">{candidate.name}</div>
                                  <div className="text-xs text-gray-500 capitalize">
                                    {candidate.section} Section • {candidate.points} points
                                  </div>
                                  {hasReachedMax && (
                                    <div className="text-[11px] font-bold text-red-600 mt-1">
                                      ⛔ Max Limit Reached ({currentMaxLimit} {categoryLabel} Progs)
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="text-blue-500 font-bold text-sm">
                                    SELECTED
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Debug Info */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-yellow-800 mb-2">Debug Info:</h5>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p><strong>Selected:</strong> {JSON.stringify(selectedParticipants)}</p>
                      <p><strong>Required:</strong> {programme.requiredParticipants}</p>
                      <p><strong>Selection Valid:</strong> {selectedParticipants.length === Number(programme.requiredParticipants) ? '✅ YES' : '❌ NO'}</p>
                      <p><strong>Button Enabled:</strong> {selectedParticipants.length === Number(programme.requiredParticipants) && !isSubmitting ? '✅ YES' : '❌ NO'}</p>
                      <p><strong>Debug:</strong> Selected={selectedParticipants.length}, Required={programme.requiredParticipants} (type: {typeof programme.requiredParticipants}), Equal={selectedParticipants.length === Number(programme.requiredParticipants)}</p>
                      <p><strong>Candidates:</strong> {sectionCandidates.length} eligible, {filteredCandidates.length} filtered</p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setSelectedParticipants([])}
                        className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => {
                          const firstCandidates = candidates.slice(0, programme.requiredParticipants);
                          setSelectedParticipants(firstCandidates.map(c => c.chestNumber));
                        }}
                        className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
                      >
                        Auto-Select {programme.requiredParticipants}
                      </button>
                    </div>
                  </div>

                  {/* Test Buttons */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-red-800 mb-2">Test Selection:</h5>
                    <div className="flex gap-2">
                      {candidates.slice(0, 3).map((candidate) => (
                        <button
                          key={candidate.chestNumber}
                          onClick={() => handleParticipantToggle(candidate.chestNumber)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                        >
                          Toggle {candidate.chestNumber}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selection Summary */}
                  <div className={`border-2 rounded-lg p-4 mb-4 ${selectedParticipants.length === Number(programme.requiredParticipants)
                    ? 'bg-green-50 border-green-300'
                    : selectedParticipants.length > 0
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-gray-50 border-gray-300'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className={`font-semibold flex items-center ${selectedParticipants.length === Number(programme.requiredParticipants)
                        ? 'text-green-800'
                        : selectedParticipants.length > 0
                          ? 'text-yellow-800'
                          : 'text-gray-800'
                        }`}>
                        <span className="text-lg mr-2">
                          {selectedParticipants.length === Number(programme.requiredParticipants) ? '✅' :
                            selectedParticipants.length > 0 ? '⏳' : '⭕'}
                        </span>
                        Selected Participants
                      </h5>
                      <div className={`px-3 py-1 rounded-full font-bold text-lg ${selectedParticipants.length === Number(programme.requiredParticipants)
                        ? 'bg-green-200 text-green-800'
                        : selectedParticipants.length > 0
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-gray-200 text-gray-800'
                        }`}>
                        {selectedParticipants.length} / {programme.requiredParticipants}
                      </div>
                    </div>

                    {selectedParticipants.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {selectedParticipants.map((chestNumber) => {
                            const candidate = candidates.find(c => c.chestNumber === chestNumber);
                            return (
                              <span
                                key={chestNumber}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                              >
                                <span className="mr-1">👤</span>
                                {chestNumber} - {candidate?.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleParticipantToggle(chestNumber);
                                  }}
                                  className="ml-2 text-red-600 hover:text-red-800 font-bold"
                                  title="Remove this participant"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        {selectedParticipants.length < Number(programme.requiredParticipants) && (
                          <p className="text-yellow-700 text-sm font-medium">
                            ⚠️ Need {Number(programme.requiredParticipants) - selectedParticipants.length} more participant{Number(programme.requiredParticipants) - selectedParticipants.length > 1 ? 's' : ''} to register
                          </p>
                        )}
                        {selectedParticipants.length === Number(programme.requiredParticipants) && (
                          <p className="text-green-700 text-sm font-medium">
                            🎉 Perfect! You can now register your team.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm">
                        👆 Click on candidate cards above to select {programme.requiredParticipants} participant{programme.requiredParticipants > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Always Visible Register Button */}
            <div className="bg-white border-t-2 border-gray-200 px-6 py-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold text-gray-900">
                  Selected: <span className="text-blue-600">{selectedParticipants.length}</span> / <span className="text-blue-600">{programme.requiredParticipants}</span> Participants
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold ${selectedParticipants.length === Number(programme.requiredParticipants)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-orange-100 text-orange-800'
                  }`}>
                  {selectedParticipants.length === Number(programme.requiredParticipants) ? '✅ Ready to Register' : '⏳ Selection Incomplete'}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  ❌ Cancel
                </button>

                {/* Always Visible Register Button */}
                <button
                  onClick={() => {
                    console.log('🚀 Register button clicked!');
                    console.log('📋 Selected participants:', selectedParticipants);
                    console.log('🎯 Required:', programme.requiredParticipants);
                    console.log('⏳ Is submitting:', isSubmitting);
                    console.log('✅ Button should be enabled:', selectedParticipants.length === programme.requiredParticipants && !isSubmitting);

                    // Force validation check
                    if (selectedParticipants.length !== Number(programme.requiredParticipants)) {
                      alert(`❌ Please select exactly ${programme.requiredParticipants} participant(s). Currently selected: ${selectedParticipants.length}`);
                      return;
                    }

                    if (isSubmitting) {
                      console.log('⏳ Already submitting, ignoring click');
                      return;
                    }

                    handleRegister();
                  }}
                  disabled={!(selectedParticipants.length === Number(programme.requiredParticipants) && !isSubmitting)}
                  className={`flex-1 px-6 py-3 font-bold text-lg rounded-lg transition-all duration-200 border-2 ${selectedParticipants.length === Number(programme.requiredParticipants) && !isSubmitting
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 border-green-600 hover:border-green-700'
                    : 'bg-gray-400 text-white cursor-not-allowed opacity-75 border-gray-400'
                    }`}
                  title={selectedParticipants.length !== Number(programme.requiredParticipants)
                    ? `Select exactly ${programme.requiredParticipants} participants to enable registration`
                    : 'Click to register your team for this programme'
                  }
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Registering...
                    </span>
                  ) : selectedParticipants.length === Number(programme.requiredParticipants) ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">🎉</span>
                      REGISTER TEAM
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">⚠️</span>
                      {selectedParticipants.length === 0
                        ? `SELECT ${programme.requiredParticipants} PARTICIPANTS`
                        : `NEED ${Number(programme.requiredParticipants) - selectedParticipants.length} MORE`
                      }
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1">Edit Participants - {programme.name}</h3>
                  <div className="flex items-center space-x-4 text-orange-100 text-sm">
                    <span>📋 {programme.code}</span>
                    <span>👥 {programme.section}</span>
                    <span>🎯 {programme.positionType}</span>
                  </div>
                </div>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✏️</span>
                  <div>
                    <h4 className="font-semibold text-orange-900">Edit Registration</h4>
                    <p className="text-orange-700 text-sm">
                      Update your team's participants for this programme. Select exactly <strong>{programme.requiredParticipants}</strong> participant{programme.requiredParticipants > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Participants */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Current Participants:</h4>
                <div className="flex flex-wrap gap-2">
                  {existingParticipant?.participants.map((participant, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {participant}
                    </span>
                  ))}
                </div>
              </div>

              {sectionCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😔</div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">No Eligible Candidates</h4>
                  <p className="text-gray-500">
                    {programme.section === 'general'
                      ? 'No team candidates available for this programme.'
                      : `No ${programme.section} section candidates available. This programme requires ${programme.section} section participants.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">👥</span>
                      Select New Team Participants
                    </h4>

                    {/* Search Box */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Search by chest number or name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-lg">🔍</span>
                        </div>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <span className="text-lg">✕</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                      {filteredCandidates.length === 0 ? (
                        <div className="col-span-2 text-center py-8">
                          <div className="text-4xl mb-2">🔍</div>
                          <p className="text-gray-500">No candidates found matching "{searchTerm}"</p>
                        </div>
                      ) : (
                        filteredCandidates.map((candidate) => {
                          const isSelected = selectedParticipants.includes(candidate.chestNumber);
                          const individualCount = getCandidateIndividualProgCount(candidate.chestNumber);
                          const hasReachedMax = isIndividualProgramme && !isSelected && individualCount >= currentMaxLimit;
                          const isRequiredLimitReached = !isSelected && selectedParticipants.length >= Number(programme.requiredParticipants);
                          const isDisabled = hasReachedMax || isRequiredLimitReached;

                          return (
                            <div
                              key={candidate._id?.toString()}
                              className={`border-2 rounded-lg p-4 transition-all ${isSelected
                                ? 'border-orange-500 bg-orange-50 shadow-md cursor-pointer'
                                : hasReachedMax
                                  ? 'border-red-200 bg-red-50/50 opacity-60 cursor-not-allowed'
                                  : isRequiredLimitReached
                                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer'
                                }`}
                              onClick={() => {
                                if (isSelected) {
                                  handleParticipantToggle(candidate.chestNumber);
                                } else if (hasReachedMax) {
                                  alert(`🚫 Candidate ${candidate.name} (#${candidate.chestNumber}) has already reached the maximum participation limit of ${currentMaxLimit} individual ${categoryLabel} programme(s).`);
                                } else if (!isRequiredLimitReached) {
                                  handleParticipantToggle(candidate.chestNumber);
                                } else {
                                  alert(`Maximum ${programme.requiredParticipants} participants allowed for this programme.`);
                                }
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                                  }`}>
                                  {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900 font-mono text-base">
                                      {candidate.chestNumber}
                                    </span>
                                    {isIndividualProgramme ? (
                                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${individualCount >= currentMinLimit
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                        }`}>
                                        {individualCount} / {currentMaxLimit} {categoryLabel.toLowerCase()} prog
                                      </span>
                                    ) : (
                                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                        Group Event
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-gray-700 font-medium">{candidate.name}</div>
                                  <div className="text-xs text-gray-500 capitalize">
                                    {candidate.section} Section • {candidate.points} points
                                  </div>
                                  {hasReachedMax && (
                                    <div className="text-[11px] font-bold text-red-600 mt-1">
                                      ⛔ Max Limit Reached ({currentMaxLimit} {categoryLabel} Progs)
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="text-orange-500 font-bold text-sm">
                                    SELECTED
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Selection Summary */}
                  <div className={`border-2 rounded-lg p-4 mb-4 ${selectedParticipants.length === Number(programme.requiredParticipants)
                    ? 'bg-green-50 border-green-300'
                    : selectedParticipants.length > 0
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-gray-50 border-gray-300'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className={`font-semibold flex items-center ${selectedParticipants.length === Number(programme.requiredParticipants)
                        ? 'text-green-800'
                        : selectedParticipants.length > 0
                          ? 'text-yellow-800'
                          : 'text-gray-800'
                        }`}>
                        <span className="text-lg mr-2">
                          {selectedParticipants.length === Number(programme.requiredParticipants) ? '✅' :
                            selectedParticipants.length > 0 ? '⏳' : '⭕'}
                        </span>
                        New Selection
                      </h5>
                      <div className={`px-3 py-1 rounded-full font-bold text-lg ${selectedParticipants.length === Number(programme.requiredParticipants)
                        ? 'bg-green-200 text-green-800'
                        : selectedParticipants.length > 0
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-gray-200 text-gray-800'
                        }`}>
                        {selectedParticipants.length} / {programme.requiredParticipants}
                      </div>
                    </div>

                    {selectedParticipants.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {selectedParticipants.map((chestNumber) => {
                            const candidate = candidates.find(c => c.chestNumber === chestNumber);
                            return (
                              <span
                                key={chestNumber}
                                className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                              >
                                <span className="mr-1">👤</span>
                                {chestNumber} - {candidate?.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleParticipantToggle(chestNumber);
                                  }}
                                  className="ml-2 text-red-600 hover:text-red-800 font-bold"
                                  title="Remove this participant"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        {selectedParticipants.length < Number(programme.requiredParticipants) && (
                          <p className="text-yellow-700 text-sm font-medium">
                            ⚠️ Need {Number(programme.requiredParticipants) - selectedParticipants.length} more participant{Number(programme.requiredParticipants) - selectedParticipants.length > 1 ? 's' : ''} to update
                          </p>
                        )}
                        {selectedParticipants.length === Number(programme.requiredParticipants) && (
                          <p className="text-green-700 text-sm font-medium">
                            🎉 Perfect! You can now update your team registration.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm">
                        👆 Click on candidate cards above to select {programme.requiredParticipants} participant{programme.requiredParticipants > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t-2 border-gray-200 px-6 py-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold text-gray-900">
                  Selected: <span className="text-orange-600">{selectedParticipants.length}</span> / <span className="text-orange-600">{programme.requiredParticipants}</span> Participants
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold ${selectedParticipants.length === Number(programme.requiredParticipants)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-orange-100 text-orange-800'
                  }`}>
                  {selectedParticipants.length === Number(programme.requiredParticipants) ? '✅ Ready to Update' : '⏳ Selection Incomplete'}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  ❌ Cancel
                </button>

                <button
                  onClick={handleUpdate}
                  disabled={!(selectedParticipants.length === Number(programme.requiredParticipants) && !isSubmitting)}
                  className={`flex-1 px-6 py-3 font-bold text-lg rounded-lg transition-all duration-200 border-2 ${selectedParticipants.length === Number(programme.requiredParticipants) && !isSubmitting
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 border-orange-600 hover:border-orange-700'
                    : 'bg-gray-400 text-white cursor-not-allowed opacity-75 border-gray-400'
                    }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Updating...
                    </span>
                  ) : selectedParticipants.length === Number(programme.requiredParticipants) ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">✏️</span>
                      UPDATE PARTICIPANTS
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">⚠️</span>
                      {selectedParticipants.length === 0
                        ? `SELECT ${programme.requiredParticipants} PARTICIPANTS`
                        : `NEED ${Number(programme.requiredParticipants) - selectedParticipants.length} MORE`
                      }
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}