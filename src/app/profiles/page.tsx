"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Candidate, Team, Result, Programme, ProgrammeParticipant } from '@/types';
import { getTeamTheme, getSectionTheme, getCandidateStats, CandidateStats } from '@/lib/profileHelper';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter } from '@/components/Navigation/PublicFooter';

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Public Navbar */}
      <PublicNavbar />

      {/* Hero Header */}
      <header className="relative bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 border-b border-slate-200/80 pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-indigo-700 text-xs sm:text-sm font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ayyuhannas • Wattaqa Arts Fest 2K25
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Participant <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600">Profiles</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Live individual scores, podium achievements, and event registrations across ADĀLAH, SHAJĀʿAH, and QIYĀDAH.
          </p>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{candidates.length}</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Participants</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{teams.length}</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Teams</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">{sections.length}</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Sections</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{results.length}</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Results Out</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 -mt-6 sm:-mt-8 relative z-20">

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/90 p-4 sm:p-5 mb-8 transition-all">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all cursor-pointer font-medium"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all cursor-pointer capitalize font-medium"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all cursor-pointer font-medium"
              >
                <option value="points">Sort by: Total Points</option>
                <option value="name">Sort by: Name (A-Z)</option>
                <option value="chestNumber">Sort by: Chest Number</option>
                <option value="medals">Sort by: Medals / Podiums</option>
                <option value="events">Sort by: Registered Events</option>
              </select>
            </div>

          </div>

          {/* Active filter count / quick reset */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="text-slate-900 font-bold">{sortedCandidates.length}</span> of {candidates.length} participants
            </div>
            {(searchTerm || selectedTeam !== 'all' || selectedSection !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTeam('all');
                  setSelectedSection('all');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Profiles Grid: WIDE CARD LAYOUT (2 columns with more width and less height) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {sortedCandidates.map((candidate) => {
            const stats = candidateStatsMap.get(String(candidate._id || candidate.chestNumber));
            const teamTheme = getTeamTheme(candidate.team, teams);
            const sectionTheme = getSectionTheme(candidate.section);

            const totalPoints = stats?.totalPoints ?? 0;
            const totalWins = stats?.medals.total ?? 0;
            const registeredCount = stats?.registeredProgrammes.length ?? 0;

            // Color palette for exp bars
            const expColors = [
              'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500',
              'bg-teal-500', 'bg-emerald-500', 'bg-amber-400', 'bg-orange-500', 'bg-rose-500'
            ];
            const activeTicks = Math.min(24, Math.max(2, Math.round((totalPoints / 25) * 24)));

            return (
              <Link
                key={String(candidate._id || candidate.chestNumber)}
                href={`/profiles/${candidate.chestNumber || candidate._id}`}
                className="group flex flex-col bg-white rounded-[26px] border border-slate-200/90 hover:border-indigo-300 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5"
              >
                {/* 1. Atmospheric Cover Header (Soft Sky / Clouds Aesthetic as in reference image) */}
                <div className="relative h-28 sm:h-32 bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 overflow-hidden">
                  {/* Subtle cloud and sun glow illustration */}
                  <div className="absolute -top-10 left-10 w-48 h-32 bg-white/70 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute top-2 right-16 w-32 h-24 bg-sky-200/40 rounded-full blur-lg pointer-events-none" />

                  {/* Top-Right "Follow +" Style Pill Button */}
                  <div className="absolute top-3.5 right-4 z-10">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/95 text-slate-800 text-xs font-bold shadow-sm border border-slate-200/60 backdrop-blur-md flex items-center gap-1.5 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <span>View</span>
                      <span className="text-slate-400 group-hover:text-slate-300">#{candidate.chestNumber}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Avatar & Experience Segmented Bar (Overlapping Cover Header) */}
                <div className="px-5 sm:px-6 flex items-end justify-between -mt-11 sm:-mt-12 relative z-10">
                  {/* Circular Avatar with thick white border */}
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0">
                    {candidate.profileImage ? (
                      <img
                        src={candidate.profileImage}
                        alt={candidate.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl font-black text-indigo-600">
                        {candidate.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Experience / Status Segmented Bar (Exact UI from the photo: exp. ||||||||||||) */}
                  <div className="pb-2 flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-mono tracking-tight text-slate-400 font-semibold lowercase">
                      pts.
                    </span>
                    <div className="flex items-center gap-[2.5px]">
                      {Array.from({ length: 22 }).map((_, i) => {
                        const isActive = i < activeTicks;
                        const tickColor = expColors[i % expColors.length];
                        return (
                          <span
                            key={i}
                            className={`w-[2.5px] h-3.5 rounded-full transition-all ${isActive ? tickColor : 'bg-slate-200'
                              }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Candidate Name & Bio/Subtitle */}
                <div className="px-5 sm:px-6 pt-2 pb-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                    {candidate.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 line-clamp-1">
                    {teamTheme.name} • {sectionTheme.label} Section • Competitor
                  </p>
                </div>

                {/* 4. 3-Column Stats Grid (Exact UI with dividing lines from the photo) */}
                <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100 py-3 text-center bg-white">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {totalPoints}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      Points
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {totalWins}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      Podiums
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {registeredCount}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      Events
                    </div>
                  </div>
                </div>

                {/* 5. Bottom Badges / Action Row */}
                <div className="border-t border-slate-100 px-5 sm:px-6 py-2.5 bg-slate-50/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase"
                      style={{
                        backgroundColor: `${teamTheme.color}15`,
                        color: teamTheme.color,
                        border: `1px solid ${teamTheme.color}35`
                      }}
                    >
                      {teamTheme.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/80 text-slate-700 capitalize">
                      {sectionTheme.label}
                    </span>
                  </div>

                  <span className="inline-flex items-center text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Profile
                    <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedCandidates.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Participants Found</h2>
            <p className="text-slate-500 text-sm mb-6">
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}