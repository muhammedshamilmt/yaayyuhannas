"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Candidate, Team, Result, Programme, ProgrammeParticipant } from '@/types';
import { getTeamTheme, getSectionTheme, getCandidateStats, CandidateStats } from '@/lib/profileHelper';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter } from '@/components/Navigation/PublicFooter';

export default function ProfileDetailPage() {
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [programmeParticipants, setProgrammeParticipants] = useState<ProgrammeParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'participations' | 'results' | 'achievements'>('overview');

  useEffect(() => {
    if (candidateId) {
      fetchData();
    }
  }, [candidateId]);

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

      const [candidatesData, teamsData, resultsData, programmesData, participantsData] = await Promise.all([
        candidatesRes.ok ? candidatesRes.json() : [],
        teamsRes.ok ? teamsRes.json() : [],
        resultsRes.ok ? resultsRes.json() : [],
        programmesRes.ok ? programmesRes.json() : [],
        participantsRes.ok ? participantsRes.json() : []
      ]);

      const candidateList: Candidate[] = Array.isArray(candidatesData) ? candidatesData : [];
      const teamList: Team[] = Array.isArray(teamsData) ? teamsData : [];

      const cleanCandidateId = decodeURIComponent(candidateId).trim();
      const foundCandidate = candidateList.find((c: Candidate) => 
        String(c._id) === cleanCandidateId || 
        String(c.chestNumber) === cleanCandidateId
      );
      
      setCandidates(candidateList);
      setTeams(teamList);
      setResults(Array.isArray(resultsData) ? resultsData : []);
      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
      setProgrammeParticipants(Array.isArray(participantsData) ? participantsData : []);

      if (!foundCandidate) {
        setCandidate(null);
        return;
      }

      setCandidate(foundCandidate);

      const candidateTeam = teamList.find((t: Team) => 
        t.code?.toUpperCase() === foundCandidate.team?.toUpperCase() ||
        t._id?.toString() === foundCandidate.team
      );
      setTeam(candidateTeam || null);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for current candidate
  const stats: CandidateStats | null = useMemo(() => {
    if (!candidate) return null;
    return getCandidateStats(candidate, results, programmeParticipants, programmes);
  }, [candidate, results, programmeParticipants, programmes]);

  // Calculate overall festival rank dynamically among all candidates
  const candidateRank = useMemo(() => {
    if (!candidate || !stats || candidates.length === 0) return null;

    const rankList = candidates.map(c => {
      const cStats = getCandidateStats(c, results, programmeParticipants, programmes);
      return {
        chest: String(c.chestNumber),
        points: cStats.totalPoints,
        gold: cStats.medals.gold
      };
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.gold - a.gold;
    });

    const index = rankList.findIndex(r => r.chest === String(candidate.chestNumber));
    return index !== -1 ? index + 1 : null;
  }, [candidate, stats, candidates, results, programmeParticipants, programmes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Loading Participant Profile...</h2>
          <p className="text-slate-500 text-sm">Retrieving event registrations and achievements</p>
        </div>
      </div>
    );
  }

  if (!candidate || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-slate-900 selection:text-white">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-md">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <span className="text-3xl">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
            <p className="text-slate-500 text-sm mb-6">
              The requested participant (#{candidateId}) could not be located in Wattaqa Arts Fest 2k25.
            </p>
            <Link
              href="/profiles"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              ← Back to Profiles
            </Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const teamTheme = getTeamTheme(candidate.team, teams);
  const sectionTheme = getSectionTheme(candidate.section);

  const expColors = [
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 
    'bg-teal-500', 'bg-emerald-500', 'bg-amber-400', 'bg-orange-500', 'bg-rose-500'
  ];
  const activeTicks = Math.min(24, Math.max(2, Math.round((stats.totalPoints / 25) * 24)));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Public Navbar */}
      <PublicNavbar />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Top Breadcrumb row */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/profiles"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold border border-slate-200/90 shadow-2xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Participants
          </Link>

          <div className="flex items-center gap-2">
            {candidateRank && candidateRank <= 10 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                🏆 Rank #{candidateRank}
              </span>
            )}
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200">
              Ayyuhannas 2K25
            </span>
          </div>
        </div>

        {/* HERO CARD: Styled after the user's reference image (wide aspect, atmospheric sky cover, overlapping avatar, exp bar) */}
        <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-lg overflow-hidden mb-8">
          
          {/* Atmospheric Cover Header */}
          <div className="relative h-36 sm:h-44 bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 overflow-hidden">
            <div className="absolute -top-12 left-16 w-64 h-36 bg-white/70 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-4 right-20 w-44 h-28 bg-sky-200/40 rounded-full blur-xl pointer-events-none" />

            {/* Top-Right "Follow +" Style Pill Button */}
            <div className="absolute top-4 right-5 z-10 flex items-center gap-2">
              <span className="px-4 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold shadow-sm border border-slate-200/80 backdrop-blur-md flex items-center gap-1.5">
                <span>#{candidate.chestNumber}</span>
                <span className="text-slate-300">•</span>
                <span style={{ color: teamTheme.color }}>{teamTheme.code}</span>
              </span>
            </div>
          </div>

          {/* Avatar & Experience Meter Row */}
          <div className="px-6 sm:px-8 flex items-end justify-between -mt-14 sm:-mt-16 relative z-10">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0">
              {candidate.profileImage ? (
                <img
                  src={candidate.profileImage}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-indigo-600">
                  {candidate.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Experience / Status Segmented Bar (exp. ||||||||||||) */}
            <div className="pb-3 flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-mono tracking-tight text-slate-400 font-semibold lowercase">
                pts.
              </span>
              <div className="flex items-center gap-[2.5px]">
                {Array.from({ length: 24 }).map((_, i) => {
                  const isActive = i < activeTicks;
                  const tickColor = expColors[i % expColors.length];
                  return (
                    <span
                      key={i}
                      className={`w-[2.5px] h-4 rounded-full transition-all ${
                        isActive ? tickColor : 'bg-slate-200'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Name & Subtitle / Bio */}
          <div className="px-6 sm:px-8 pt-2.5 pb-5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {candidate.name}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {teamTheme.name} Team • {sectionTheme.label} Section • Chest #{candidate.chestNumber}
            </p>
          </div>

          {/* 3-Column Stats Grid (with vertical dividers) */}
          <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100 py-4 text-center bg-white">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.totalPoints}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Total Points
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-1">
                {stats.medals.gold > 0 && <span className="text-lg">🥇</span>}
                {stats.medals.total}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Podium Wins
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.registeredProgrammes.length}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Registered Events
              </div>
            </div>
          </div>

        </div>

        {/* Sticky Tabs Navigation */}
        <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md pb-4 pt-1 border-b border-slate-200/80 mb-6">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'participations', label: `Registered Programmes (${stats.registeredProgrammes.length})`, icon: '🎭' },
              { key: 'results', label: `Results & Scores (${stats.resultDetails.length})`, icon: '🏆' },
              { key: 'achievements', label: 'Achievements', icon: '🌟' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white bg-slate-100/70 border border-slate-200/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Performance Rating */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Performance Standing
                  </h3>
                  <span className="text-xl">📈</span>
                </div>
                <div className={`inline-block px-3.5 py-1.5 rounded-xl text-sm font-black border ${stats.ratingColor} mb-2 shadow-2xs`}>
                  {stats.performanceRating}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Based on registered events, podiums earned, and participation grade honors.
                </p>
                {candidateRank && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Festival Overall Rank</span>
                    <span className="font-extrabold text-indigo-600">#{candidateRank} of {candidates.length}</span>
                  </div>
                )}
              </div>

              {/* Medals Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Podiums & Medals
                  </h3>
                  <span className="text-xl">🏅</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-amber-50/60 px-3 py-1.5 rounded-lg border border-amber-100">
                    <span className="text-amber-800 font-semibold flex items-center gap-1.5">🥇 1st Place (Gold)</span>
                    <span className="font-black text-amber-900">{stats.medals.gold}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-700 font-semibold flex items-center gap-1.5">🥈 2nd Place (Silver)</span>
                    <span className="font-black text-slate-900">{stats.medals.silver}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-orange-50/60 px-3 py-1.5 rounded-lg border border-orange-100">
                    <span className="text-orange-800 font-semibold flex items-center gap-1.5">🥉 3rd Place (Bronze)</span>
                    <span className="font-black text-orange-900">{stats.medals.bronze}</span>
                  </div>
                </div>
              </div>

              {/* Team Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Team Affiliation
                    </h3>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamTheme.color }} />
                  </div>
                  <div className="text-xl font-black text-slate-900 mb-1">
                    {teamTheme.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Code: <span className="font-bold text-slate-800">{teamTheme.code}</span>
                    {team?.captain && <span> • Captain: {team.captain}</span>}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Candidate Points Contributed</span>
                  <span className="font-black text-emerald-600">{stats.totalPoints} pts</span>
                </div>
              </div>

            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Event Results</h3>
                  <p className="text-xs text-slate-500">Official result announcements credited to this participant</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                  {stats.resultDetails.length} recorded
                </span>
              </div>

              <div className="p-6">
                {stats.resultDetails.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {stats.resultDetails.map((item, idx) => (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0">
                            {item.position === 1 ? '🥇' : item.position === 2 ? '🥈' : item.position === 3 ? '🥉' : '🎖️'}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                              {item.programmeName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                              {item.programmeCode && (
                                <span className="font-mono font-semibold text-slate-600">
                                  {item.programmeCode}
                                </span>
                              )}
                              <span className="capitalize">{item.category}</span>
                              {item.position > 0 && (
                                <span className="text-indigo-600 font-semibold">
                                  Position #{item.position}
                                </span>
                              )}
                              {item.grade && (
                                <span className="text-emerald-600 font-semibold">
                                  Grade {item.grade}
                                </span>
                              )}
                              {item.date && <span>• {item.date}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span className="inline-block px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-black shadow-2xs">
                            +{item.totalPoints} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="text-3xl block mb-2">⏳</span>
                    <h4 className="text-base font-bold text-slate-900 mb-1">No Results Announced Yet</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                      Results for this participant will be updated automatically as soon as published by the judges.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: REGISTERED PROGRAMMES (REAL NAMES, NO UNKNOWNS) */}
        {activeTab === 'participations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registered Programmes</h3>
                  <p className="text-xs text-slate-500">
                    Live schedule & registrations for this candidate with official programme names
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
                  {stats.registeredProgrammes.length} total events
                </span>
              </div>

              <div className="p-6">
                {stats.registeredProgrammes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.registeredProgrammes.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-200 p-4.5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Code and Category tags */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                              {item.programmeCode || 'EVENT'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              item.category === 'sports' 
                                ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {item.category === 'sports' ? '⚽ Sports' : '🎭 Arts'}
                            </span>
                          </div>

                          {/* Real Programme Name */}
                          <h4 className="font-bold text-slate-900 text-base mb-1.5">
                            {item.programmeName}
                          </h4>

                          <div className="text-xs text-slate-500 flex items-center gap-2 mb-3">
                            <span className="capitalize">{item.section}</span>
                            <span>•</span>
                            <span>{item.isStage ? 'Stage' : 'Non-Stage'}</span>
                          </div>
                        </div>

                        {/* Status Footer */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          {item.hasResult && item.resultDetail ? (
                            <>
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                {item.resultDetail.position === 1 ? '🥇 1st Place' : item.resultDetail.position === 2 ? '🥈 2nd Place' : item.resultDetail.position === 3 ? '🥉 3rd Place' : '✓ Completed'}
                                {item.resultDetail.grade && ` • Grade ${item.resultDetail.grade}`}
                              </span>
                              <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                +{item.resultDetail.totalPoints} pts
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              Scheduled / In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="text-3xl block mb-2">📋</span>
                    <h4 className="text-base font-bold text-slate-900 mb-1">No Registrations Recorded</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                      This participant is not currently registered in any active festival programmes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESULTS & SCORES */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Full Competition Results</h3>
                  <p className="text-xs text-slate-500">Detailed breakdown of podium positions and grades</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-emerald-600">
                    {stats.totalPoints} Total Points
                  </div>
                </div>
              </div>

              <div className="p-6">
                {stats.resultDetails.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.resultDetails.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              {item.programmeCode ? `${item.programmeCode} • ` : ''}{item.category}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base">
                              {item.programmeName}
                            </h4>
                          </div>

                          {item.position > 0 ? (
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                              item.position === 1
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : item.position === 2
                                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}>
                              {item.position === 1 ? '🥇 1st Place' : item.position === 2 ? '🥈 2nd Place' : '🥉 3rd Place'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Grade {item.grade || 'A'}
                            </span>
                          )}
                        </div>

                        {/* Metric stats */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                            <span className="text-slate-500 block text-[10px] uppercase font-medium">Position Points</span>
                            <span className="text-slate-900 font-extrabold text-sm">+{item.positionPoints}</span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                            <span className="text-slate-500 block text-[10px] uppercase font-medium">Grade Points</span>
                            <span className="text-slate-900 font-extrabold text-sm">+{item.gradePoints}</span>
                          </div>
                        </div>

                        {item.date && (
                          <div className="mt-3 text-[11px] text-slate-400 text-right">
                            Announced on {item.date}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="text-3xl block mb-2">🏆</span>
                    <h4 className="text-base font-bold text-slate-900 mb-1">No Results Published Yet</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                      Competition results and official standings for this participant will appear here when published.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Medals & Honors */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>🏅</span> Official Medals & Honors
                </h3>

                <div className="space-y-3">
                  {stats.medals.gold > 0 && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥇</span>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Gold Medals</div>
                          <div className="text-xs text-amber-700 font-medium">First place champion</div>
                        </div>
                      </div>
                      <span className="text-xl font-black text-amber-800">{stats.medals.gold}</span>
                    </div>
                  )}

                  {stats.medals.silver > 0 && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥈</span>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Silver Medals</div>
                          <div className="text-xs text-slate-600 font-medium">Second place runner-up</div>
                        </div>
                      </div>
                      <span className="text-xl font-black text-slate-800">{stats.medals.silver}</span>
                    </div>
                  )}

                  {stats.medals.bronze > 0 && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-orange-50/70 border border-orange-200">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥉</span>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Bronze Medals</div>
                          <div className="text-xs text-orange-700 font-medium">Third place podium</div>
                        </div>
                      </div>
                      <span className="text-xl font-black text-orange-800">{stats.medals.bronze}</span>
                    </div>
                  )}

                  {stats.medals.total === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No medals earned yet. Check back as results are published!
                    </div>
                  )}
                </div>
              </div>

              {/* Milestones & Badges */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>🌟</span> Festival Milestones
                </h3>

                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl border ${
                    stats.registeredProgrammes.length >= 1
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>Official Festival Competitor</span>
                      <span>{stats.registeredProgrammes.length >= 1 ? '✅' : '🔒'}</span>
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      Registered in active festival events ({stats.registeredProgrammes.length} events)
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    stats.medals.gold >= 1
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>Gold Champion</span>
                      <span>{stats.medals.gold >= 1 ? '✅' : '🔒'}</span>
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      Secure 1st place in any competition ({stats.medals.gold}/1)
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    stats.totalPoints >= 20
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>Top Scorer Badge</span>
                      <span>{stats.totalPoints >= 20 ? '✅' : '🔒'}</span>
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      Accumulate 20+ total points ({stats.totalPoints}/20)
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    stats.medals.total >= 3
                      ? 'bg-sky-50/70 border-sky-200 text-sky-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>Multi-Podium Finisher</span>
                      <span>{stats.medals.total >= 3 ? '✅' : '🔒'}</span>
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      Achieve 3 or more podium finishes ({stats.medals.total}/3)
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}