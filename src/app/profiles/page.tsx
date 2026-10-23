"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Candidate, Team, Result, Programme, ProgrammeParticipant } from '@/types';
import { getTeamTheme, getSectionTheme, getCandidateStats, CandidateStats } from '@/lib/profileHelper';

export default function ProfilesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [programmeParticipants, setProgrammeParticipants] = useState<ProgrammeParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'points' | 'name' | 'chestNumber' | 'medals' | 'events'>('points');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, teamsRes, resultsRes, programmesRes, participantsRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/teams'),
        fetch('/api/results'),
        fetch('/api/programmes'),
        fetch('/api/programme-participants')
      ]);

      if (!candidatesRes.ok || !teamsRes.ok || !resultsRes.ok) {
        throw new Error('Failed to load profiles data');
      }

      const [candidatesData, teamsData, resultsData, programmesData, participantsData] = await Promise.all([
        candidatesRes.json(),
        teamsRes.json(),
        resultsRes.json(),
        programmesRes.ok ? programmesRes.json() : [],
        participantsRes.ok ? participantsRes.json() : []
      ]);

      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setResults(Array.isArray(resultsData) ? resultsData : []);
      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
      setProgrammeParticipants(Array.isArray(participantsData) ? participantsData : []);
    } catch (error) {
      console.error('Error fetching profiles data:', error);
      setCandidates([]);
      setTeams([]);
      setResults([]);
      setProgrammes([]);
      setProgrammeParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  // Pre-calculate candidate stats for fast filtering and sorting
  const candidateStatsMap = useMemo(() => {
    const map = new Map<string, CandidateStats>();
    candidates.forEach(candidate => {
      const stats = getCandidateStats(candidate, results, programmeParticipants, programmes);
      const key = String(candidate._id || candidate.chestNumber);
      map.set(key, stats);
    });
    return map;
  }, [candidates, results, programmeParticipants, programmes]);

  // Unique sections from actual candidate list
  const sections = useMemo(() => {
    return [...new Set(candidates.map(c => c.section))].filter(Boolean);
  }, [candidates]);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const teamTheme = getTeamTheme(candidate.team, teams);
      const search = searchTerm.toLowerCase().trim();
      
      const matchesSearch = !search ||
        candidate.name.toLowerCase().includes(search) ||
        String(candidate.chestNumber || '').toLowerCase().includes(search) ||
        teamTheme.name.toLowerCase().includes(search) ||
        teamTheme.code.toLowerCase().includes(search);

      const matchesTeam = selectedTeam === 'all' || 
        candidate.team === selectedTeam || 
        teamTheme.code === selectedTeam;

      const matchesSection = selectedSection === 'all' || 
        candidate.section?.toLowerCase() === selectedSection.toLowerCase();

      return matchesSearch && matchesTeam && matchesSection;
    });
  }, [candidates, searchTerm, selectedTeam, selectedSection, teams]);

  // Sort candidates
  const sortedCandidates = useMemo(() => {
    return [...filteredCandidates].sort((a, b) => {
      const statsA = candidateStatsMap.get(String(a._id || a.chestNumber));
      const statsB = candidateStatsMap.get(String(b._id || b.chestNumber));

      const pointsA = statsA?.totalPoints ?? 0;
      const pointsB = statsB?.totalPoints ?? 0;

      const medalsA = statsA?.medals.total ?? 0;
      const medalsB = statsB?.medals.total ?? 0;

      const eventsA = statsA?.registeredProgrammes.length ?? 0;
      const eventsB = statsB?.registeredProgrammes.length ?? 0;

      switch (sortBy) {
        case 'points':
          if (pointsB !== pointsA) return pointsB - pointsA;
          return (statsB?.medals.gold ?? 0) - (statsA?.medals.gold ?? 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'chestNumber': {
          const numA = parseInt(String(a.chestNumber), 10);
          const numB = parseInt(String(b.chestNumber), 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return String(a.chestNumber).localeCompare(String(b.chestNumber));
        }
        case 'medals':
          if (medalsB !== medalsA) return medalsB - medalsA;
          return pointsB - pointsA;
        case 'events':
          if (eventsB !== eventsA) return eventsB - eventsA;
          return pointsB - pointsA;
        default:
          return 0;
      }
    });
  }, [filteredCandidates, sortBy, candidateStatsMap]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Loading Profiles...</h2>
          <p className="text-slate-400 text-sm">Gathering live participant statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-medium mb-4 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ayyuhannas • Wattaqa Arts Fest 2K25
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              Participant <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Profiles</span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
              Live standings, points, registrations, and official achievements across all active teams.
            </p>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 text-center shadow-lg shadow-black/20">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{candidates.length}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Participants</div>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 text-center shadow-lg shadow-black/20">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{teams.length}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Teams</div>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 text-center shadow-lg shadow-black/20">
                <div className="text-2xl sm:text-3xl font-extrabold text-sky-400">{sections.length}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Sections</div>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 text-center shadow-lg shadow-black/20">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{results.length}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Results Out</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search & Filter Toolbar */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/90 p-4 sm:p-5 mb-8 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search participant name, chest #, or team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Team Filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all cursor-pointer"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.code} value={team.code}>
                    {team.name} ({team.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all cursor-pointer capitalize"
              >
                <option value="all">All Sections</option>
                {sections.map((section, idx) => (
                  <option key={idx} value={section} className="capitalize">
                    {section}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="lg:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all cursor-pointer"
              >
                <option value="points">Sort by: Total Points</option>
                <option value="name">Sort by: Name (A-Z)</option>
                <option value="chestNumber">Sort by: Chest Number</option>
                <option value="medals">Sort by: Medals / Wins</option>
                <option value="events">Sort by: Registered Events</option>
              </select>
            </div>

          </div>

          {/* Active filter count / quick reset */}
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="text-white font-semibold">{sortedCandidates.length}</span> of {candidates.length} participants
            </div>
            {(searchTerm || selectedTeam !== 'all' || selectedSection !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTeam('all');
                  setSelectedSection('all');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedCandidates.map((candidate) => {
            const stats = candidateStatsMap.get(String(candidate._id || candidate.chestNumber));
            const teamTheme = getTeamTheme(candidate.team, teams);
            const sectionTheme = getSectionTheme(candidate.section);

            const totalPoints = stats?.totalPoints ?? 0;
            const totalWins = stats?.medals.total ?? 0;
            const goldMedals = stats?.medals.gold ?? 0;
            const registeredCount = stats?.registeredProgrammes.length ?? 0;
            const resultsCount = stats?.resultDetails.length ?? 0;

            return (
              <Link
                key={String(candidate._id || candidate.chestNumber)}
                href={`/profiles/${candidate.chestNumber || candidate._id}`}
                className="group flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Team Top Accent Strip */}
                <div 
                  className="h-1.5 w-full transition-all duration-300 group-hover:h-2"
                  style={{ backgroundColor: teamTheme.color }}
                />

                {/* Card Header */}
                <div className="p-4 sm:p-5 flex items-start gap-3.5 border-b border-slate-800/60">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700/60 group-hover:border-indigo-500/60 transition-colors shadow-inner flex items-center justify-center">
                      {candidate.profileImage ? (
                        <img
                          src={candidate.profileImage}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-black text-indigo-400">
                          {candidate.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Chest number badge */}
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-700 text-[10px] font-bold tracking-tight">
                      #{candidate.chestNumber}
                    </span>
                  </div>

                  {/* Name and Badges */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-base leading-snug truncate group-hover:text-indigo-400 transition-colors">
                      {candidate.name}
                    </h3>
                    
                    {/* Team & Section Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span 
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-sm"
                        style={{
                          backgroundColor: `${teamTheme.color}20`,
                          color: teamTheme.color,
                          border: `1px solid ${teamTheme.color}40`
                        }}
                      >
                        {teamTheme.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                        {sectionTheme.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Metrics Grid */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-3 gap-2 py-1 text-center">
                    
                    {/* Points Metric */}
                    <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                      <div className="text-xl sm:text-2xl font-black text-emerald-400">
                        {totalPoints}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        Points
                      </div>
                    </div>

                    {/* Medals / Wins Metric */}
                    <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                      <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center justify-center gap-0.5">
                        {goldMedals > 0 && <span className="text-sm">🥇</span>}
                        {totalWins}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        {totalWins === 1 ? 'Podium' : 'Podiums'}
                      </div>
                    </div>

                    {/* Events / Participations */}
                    <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                      <div className="text-xl sm:text-2xl font-black text-sky-400">
                        {registeredCount}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        Events
                      </div>
                    </div>

                  </div>

                  {/* Footer status row */}
                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {resultsCount > 0 ? (
                        <span className="text-indigo-400 font-medium">
                          {resultsCount} {resultsCount === 1 ? 'Result Announced' : 'Results Announced'}
                        </span>
                      ) : (
                        <span className="text-slate-500">Awaiting Results</span>
                      )}
                    </span>
                    <span className="inline-flex items-center text-slate-400 group-hover:text-white font-medium transition-colors">
                      View Profile
                      <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedCandidates.length === 0 && (
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-12 text-center max-w-lg mx-auto shadow-xl">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Participants Found</h2>
            <p className="text-slate-400 text-sm mb-6">
              {searchTerm || selectedTeam !== 'all' || selectedSection !== 'all'
                ? "No participant matches your active filters. Try searching for another name or clearing filters."
                : "Participant profiles will appear here once registered for Wattaqa Arts Fest."}
            </p>
            {(searchTerm || selectedTeam !== 'all' || selectedSection !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTeam('all');
                  setSelectedSection('all');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}