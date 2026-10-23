"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Candidate, Team, Result, Programme, ProgrammeParticipant } from '@/types';
import { getTeamTheme, getSectionTheme, getCandidateStats, CandidateStats } from '@/lib/profileHelper';

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
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
      
      if (!foundCandidate) {
        setCandidate(null);
        return;
      }

      setCandidate(foundCandidate);
      setTeams(teamList);

      const candidateTeam = teamList.find((t: Team) => 
        t.code?.toUpperCase() === foundCandidate.team?.toUpperCase() ||
        t._id?.toString() === foundCandidate.team
      );
      setTeam(candidateTeam || null);

      setResults(Array.isArray(resultsData) ? resultsData : []);
      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
      setProgrammeParticipants(Array.isArray(participantsData) ? participantsData : []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Loading Participant Profile...</h2>
          <p className="text-slate-400 text-sm">Retrieving event registrations and achievements</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <span className="text-3xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            The requested participant (#{candidateId}) could not be located in Wattaqa Arts Fest 2k25.
          </p>
          <Link
            href="/profiles"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            ← Back to Profiles
          </Link>
        </div>
      </div>
    );
  }

  const teamTheme = getTeamTheme(candidate.team, teams);
  const sectionTheme = getSectionTheme(candidate.section);
  const stats: CandidateStats = getCandidateStats(candidate, results, programmeParticipants, programmes);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic Team Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${teamTheme.gradient} border-b border-white/10 shadow-2xl`}>
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          
          {/* Top navigation row */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/profiles"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white/90 hover:text-white text-xs sm:text-sm font-medium backdrop-blur-md border border-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              All Participants
            </Link>

            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
              Ayyuhannas 2K25
            </span>
          </div>

          {/* Participant Profile Banner */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-white/10 border-4 border-white/40 shadow-2xl flex items-center justify-center backdrop-blur-md">
                {candidate.profileImage ? (
                  <img
                    src={candidate.profileImage}
                    alt={candidate.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-black text-white">
                    {candidate.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-slate-950 text-white border border-white/20 text-xs font-black shadow-lg">
                #{candidate.chestNumber}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/90 text-slate-900 shadow-md">
                  {teamTheme.name}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-black/40 text-white border border-white/20 capitalize">
                  {sectionTheme.label} Section
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-black/40 text-white border border-white/20">
                  Chest #{candidate.chestNumber}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
                {candidate.name}
              </h1>

              {/* Header Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl">
                <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center">
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {stats.totalPoints}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-0.5">
                    Total Points
                  </div>
                </div>

                <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center">
                  <div className="text-xl sm:text-2xl font-black text-amber-300 flex items-center justify-center gap-1">
                    <span>🥇</span> {stats.medals.gold}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-0.5">
                    Gold Medals
                  </div>
                </div>

                <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center">
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {stats.medals.total}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-0.5">
                    Podium Wins
                  </div>
                </div>

                <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center">
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {stats.registeredProgrammes.length}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-0.5">
                    Events
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2.5 no-scrollbar">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'participations', label: `Participations (${stats.registeredProgrammes.length})`, icon: '🎭' },
              { key: 'results', label: `Results & Scores (${stats.resultDetails.length})`, icon: '🏆' },
              { key: 'achievements', label: 'Achievements', icon: '🌟' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Top 3 KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Performance Rating */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Performance Standing
                  </h3>
                  <span className="text-xl">📈</span>
                </div>
                <div className={`inline-block px-3.5 py-1.5 rounded-xl text-sm font-black border ${stats.ratingColor} mb-2`}>
                  {stats.performanceRating}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Based on registered programmes, podium placements, and grade points accumulated.
                </p>
              </div>

              {/* Medals Breakdown */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Podiums & Medals
                  </h3>
                  <span className="text-xl">🏅</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">🥇 1st Place (Gold)</span>
                    <span className="font-black text-white">{stats.medals.gold}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">🥈 2nd Place (Silver)</span>
                    <span className="font-black text-white">{stats.medals.silver}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-amber-600 font-semibold flex items-center gap-1.5">🥉 3rd Place (Bronze)</span>
                    <span className="font-black text-white">{stats.medals.bronze}</span>
                  </div>
                </div>
              </div>

              {/* Team Association */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Team Affiliation
                    </h3>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamTheme.color }} />
                  </div>
                  <div className="text-xl font-black text-white mb-1">
                    {teamTheme.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Code: <span className="font-bold text-slate-200">{teamTheme.code}</span>
                    {team?.captain && <span> • Captain: {team.captain}</span>}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Candidate Points Contributed</span>
                  <span className="font-black text-emerald-400">{stats.totalPoints} pts</span>
                </div>
              </div>

            </div>

            {/* Recent Activity Table */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Recent Event Results</h3>
                  <p className="text-xs text-slate-400">Official result announcements credited to this participant</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                  {stats.resultDetails.length} recorded
                </span>
              </div>

              <div className="p-6">
                {stats.resultDetails.length > 0 ? (
                  <div className="divide-y divide-slate-800/80">
                    {stats.resultDetails.map((item, idx) => (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg shrink-0">
                            {item.position === 1 ? '🥇' : item.position === 2 ? '🥈' : item.position === 3 ? '🥉' : '🎖️'}
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-sm sm:text-base">
                              {item.programmeName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                              <span className="capitalize">{item.category}</span>
                              {item.position > 0 && (
                                <span className="text-indigo-400 font-semibold">
                                  Position #{item.position}
                                </span>
                              )}
                              {item.grade && (
                                <span className="text-emerald-400 font-semibold">
                                  Grade {item.grade}
                                </span>
                              )}
                              {item.date && <span>• {item.date}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span className="inline-block px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-black">
                            +{item.totalPoints} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="text-3xl block mb-2">⏳</span>
                    <h4 className="text-base font-bold text-white mb-1">No Results Announced Yet</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      Results for this participant will be updated automatically as soon as the judges publish the scores.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* PARTICIPATIONS TAB */}
        {activeTab === 'participations' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Registered Programmes</h3>
                  <p className="text-xs text-slate-400">
                    Live schedule & registrations for this candidate across arts and sports
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold">
                  {stats.registeredProgrammes.length} total events
                </span>
              </div>

              <div className="p-6">
                {stats.registeredProgrammes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.registeredProgrammes.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 rounded-2xl border border-slate-800 p-4.5 hover:border-slate-700 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Header badges */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] font-bold">
                              {item.programmeCode || 'EVENT'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              item.category === 'sports' 
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {item.category}
                            </span>
                          </div>

                          <h4 className="font-bold text-white text-sm mb-1.5 line-clamp-2">
                            {item.programmeName}
                          </h4>

                          <div className="text-xs text-slate-400 flex items-center gap-2 mb-3">
                            <span className="capitalize">{item.section}</span>
                            <span>•</span>
                            <span>{item.isStage ? 'Stage' : 'Non-Stage'}</span>
                          </div>
                        </div>

                        {/* Result or Pending status */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          {item.hasResult && item.resultDetail ? (
                            <>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                {item.resultDetail.position === 1 ? '🥇 1st' : item.resultDetail.position === 2 ? '🥈 2nd' : item.resultDetail.position === 3 ? '🥉 3rd' : '✓ Completed'}
                                {item.resultDetail.grade && ` (Grade ${item.resultDetail.grade})`}
                              </span>
                              <span className="font-black text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                +{item.resultDetail.totalPoints} pts
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
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
                    <h4 className="text-base font-bold text-white mb-1">No Registrations Recorded</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      This participant is not currently registered in any active festival programmes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Full Competition Results</h3>
                  <p className="text-xs text-slate-400">Detailed breakdown of podium positions and grades</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-emerald-400">
                    {stats.totalPoints} Points
                  </div>
                </div>
              </div>

              <div className="p-6">
                {stats.resultDetails.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.resultDetails.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              {item.category}
                            </span>
                            <h4 className="font-bold text-white text-base">
                              {item.programmeName}
                            </h4>
                          </div>

                          {item.position > 0 ? (
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                              item.position === 1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : item.position === 2
                                ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                                : 'bg-amber-700/20 text-amber-400 border border-amber-700/30'
                            }`}>
                              {item.position === 1 ? '🥇 1st Place' : item.position === 2 ? '🥈 2nd Place' : '🥉 3rd Place'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Grade {item.grade || 'A'}
                            </span>
                          )}
                        </div>

                        {/* Metric stats */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                          <div className="bg-slate-900 rounded-lg p-2 text-center">
                            <span className="text-slate-400 block text-[10px] uppercase">Position Points</span>
                            <span className="text-white font-bold text-sm">+{item.positionPoints}</span>
                          </div>
                          <div className="bg-slate-900 rounded-lg p-2 text-center">
                            <span className="text-slate-400 block text-[10px] uppercase">Grade Points</span>
                            <span className="text-white font-bold text-sm">+{item.gradePoints}</span>
                          </div>
                        </div>

                        {item.date && (
                          <div className="mt-3 text-[11px] text-slate-500 text-right">
                            Announced on {item.date}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="text-3xl block mb-2">🏆</span>
                    <h4 className="text-base font-bold text-white mb-1">No Results Published Yet</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      Competition results and official standings for this participant will appear here when published.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Medals & Honors */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <span>🏅</span> Official Medals & Honors
                </h3>

                <div className="space-y-3">
                  {stats.medals.gold > 0 && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥇</span>
                        <div>
                          <div className="font-bold text-white text-sm">Gold Medals</div>
                          <div className="text-xs text-amber-400/80">First place champion</div>
                        </div>
                      </div>
                      <span className="text-xl font-black text-amber-400">{stats.medals.gold}</span>
                    </div>
                  )}

                  {stats.medals.silver > 0 && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-300/10 border border-slate-300/20">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥈</span>
                        <div>
                          <div className="font-bold text-white text-sm">Silver Medals</div>
                          <div className="text-xs text-slate-300/80">Second place runner-up</div>
                        </div>
                      </div>
                      <span className="text-xl font-black text-slate-200">{stats.medals.silver}</span>
                    </div>
                  )}

                  {stats.medals.bronze > 0 && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-700/10 border border-amber-700/20">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥉</span>
                        <div>
                          <div className="font-bold text-white text-sm">Bronze Medals</div>
                          <div className="text-xs text-amber-500/80">Third place podium</div>
                        </div>
                      </div>
                      <span className="text-xl font-black text-amber-500">{stats.medals.bronze}</span>
                    </div>
                  )}

                  {stats.medals.total === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No medals earned yet. Check back as results are published!
                    </div>
                  )}
                </div>
              </div>

              {/* Milestones & Badges */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <span>🌟</span> Festival Milestones
                </h3>

                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl border ${
                    stats.registeredProgrammes.length >= 1
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
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
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
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
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
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
                      ? 'bg-sky-500/10 border-sky-500/20 text-sky-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
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

      </div>
    </div>
  );
}