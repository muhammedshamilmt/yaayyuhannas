'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Result, Programme, Candidate, Team } from '@/types';
import { getTeamTheme, getSectionTheme } from '@/lib/profileHelper';
import { getDefaultGradePoints } from '@/lib/resultsHelper';
import { 
  Trophy, 
  RotateCw, 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  Search, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Radio, 
  Award,
  Filter,
  Flame,
  CheckCircle2,
  Tv
} from 'lucide-react';

export default function ResultScreenPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Expandable results map for showing grade-only holders
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

  // Auto-refresh state (Default ON for TV screening)
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(20);
  const [countdown, setCountdown] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all necessary data
  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      const [resRes, progRes, candRes, teamRes] = await Promise.all([
        fetch('/api/results'),
        fetch('/api/programmes'),
        fetch('/api/candidates'),
        fetch('/api/teams')
      ]);

      const [resData, progData, candData, teamData] = await Promise.all([
        resRes.json(),
        progRes.json(),
        candRes.json(),
        teamRes.json()
      ]);

      setResults(resData || []);
      setProgrammes(progData || []);
      setCandidates(candData || []);
      setTeams(teamData || []);
      setLastRefreshedAt(new Date());
      setCountdown(refreshIntervalSec);
    } catch (err) {
      console.error('Error fetching data for Result Screen:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh countdown timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData();
          return refreshIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalSec]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.error(err));
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Toggle grade-only visibility for a specific result
  const toggleResultExpand = (id: string) => {
    setExpandedResults(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Published results only
  const publishedResults = useMemo(() => {
    return results.filter(r => r.status === 'published' || !r.status);
  }, [results]);

  // Compute standings dynamically for the 3D podium
  const teamStandings = useMemo(() => {
    const map: Record<string, {
      team: Team;
      rank: number;
      totalPoints: number;
      medals: { gold: number; silver: number; bronze: number };
      totalWins: number;
      totalParticipations: number;
      winRate: number;
    }> = {};

    teams.forEach(t => {
      const code = (t.code || '').toUpperCase().trim();
      if (!code) return;
      map[code] = {
        team: t,
        rank: 0,
        totalPoints: 0,
        medals: { gold: 0, silver: 0, bronze: 0 },
        totalWins: 0,
        totalParticipations: 0,
        winRate: 0
      };
    });

    ['ADL', 'SHJ', 'QIY'].forEach(code => {
      if (!map[code]) {
        const theme = getTeamTheme(code, teams);
        map[code] = {
          team: { code, name: theme.name, color: theme.color } as any,
          rank: 0,
          totalPoints: 0,
          medals: { gold: 0, silver: 0, bronze: 0 },
          totalWins: 0,
          totalParticipations: 0,
          winRate: 0
        };
      }
    });

    const candMap = new Map<string, Candidate>();
    candidates.forEach(c => {
      if (c.chestNumber) candMap.set(String(c.chestNumber).trim(), c);
    });

    const progMap = new Map<string, Programme>();
    programmes.forEach(p => {
      if (p._id) progMap.set(p._id.toString(), p);
      if (p.id) progMap.set(String(p.id), p);
      if (p.code) progMap.set(p.code.toUpperCase().trim(), p);
    });

    publishedResults.forEach(res => {
      let prog = res.programmeId ? progMap.get(res.programmeId) : undefined;
      if (!prog && res.programme) {
        const codeMatch = res.programme.match(/^([A-Za-z0-9_-]+)/);
        if (codeMatch) prog = progMap.get(codeMatch[1].toUpperCase().trim());
      }

      if (selectedSection !== 'all') {
        const resSec = (res.section || prog?.section || '').toLowerCase().trim();
        if (resSec !== selectedSection.toLowerCase().trim()) return;
      }

      if (selectedCategory !== 'all') {
        const cat = (prog?.category || '').toLowerCase().trim();
        if (cat !== selectedCategory.toLowerCase().trim()) return;
      }

      const isIndividual = res.positionType === 'individual';
      const isTeamBased = res.positionType === 'group' || res.positionType === 'general';

      if (isIndividual) {
        [
          { place: res.firstPlace, points: res.firstPoints ?? 10, medal: 'gold' as const },
          { place: res.secondPlace, points: res.secondPoints ?? 8, medal: 'silver' as const },
          { place: res.thirdPlace, points: res.thirdPoints ?? 5, medal: 'bronze' as const }
        ].forEach(({ place, points, medal }) => {
          (place || []).forEach(item => {
            const chest = String(item.chestNumber || '').trim();
            const cand = candMap.get(chest);
            const teamCode = (cand?.team || '').toUpperCase().trim();
            if (teamCode && map[teamCode]) {
              map[teamCode].totalPoints += points;
              map[teamCode].medals[medal] += 1;
              map[teamCode].totalWins += 1;
              map[teamCode].totalParticipations += 1;
            }
          });
        });

        (res.participationGrades || []).forEach(pg => {
          const chest = String(pg.chestNumber || '').trim();
          const cand = candMap.get(chest);
          const teamCode = (cand?.team || '').toUpperCase().trim();
          const pts = pg.points !== undefined && pg.points !== null ? pg.points : (getDefaultGradePoints(pg.grade) || res.participationPoints || 0);
          if (teamCode && map[teamCode]) {
            map[teamCode].totalPoints += pts;
            map[teamCode].totalParticipations += 1;
          }
        });
      }

      if (isTeamBased) {
        [
          { teams: res.firstPlaceTeams, points: res.firstPoints ?? 10, medal: 'gold' as const },
          { teams: res.secondPlaceTeams, points: res.secondPoints ?? 8, medal: 'silver' as const },
          { teams: res.thirdPlaceTeams, points: res.thirdPoints ?? 5, medal: 'bronze' as const }
        ].forEach(({ teams: tList, points, medal }) => {
          (tList || []).forEach(item => {
            const code = (item.teamCode || '').toUpperCase().trim();
            if (code && map[code]) {
              map[code].totalPoints += points;
              map[code].medals[medal] += 1;
              map[code].totalWins += 1;
              map[code].totalParticipations += 1;
            }
          });
        });

        (res.participationTeamGrades || []).forEach(tg => {
          const code = (tg.teamCode || '').toUpperCase().trim();
          const pts = tg.points !== undefined && tg.points !== null ? tg.points : (getDefaultGradePoints(tg.grade) || res.participationPoints || 0);
          if (code && map[code]) {
            map[code].totalPoints += pts;
            map[code].totalParticipations += 1;
          }
        });
      }
    });

    const list = Object.values(map);
    list.forEach(item => {
      item.winRate = item.totalParticipations > 0 ? (item.totalWins / item.totalParticipations) * 100 : 0;
    });

    list.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
      if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
      return b.medals.bronze - a.medals.bronze;
    });

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [publishedResults, teams, candidates, programmes, selectedSection, selectedCategory]);

  const rank1 = teamStandings[0];
  const rank2 = teamStandings[1];
  const rank3 = teamStandings[2];

  // Processed list of latest results for screening
  const filteredResultsList = useMemo(() => {
    let list = [...publishedResults].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    if (selectedSection !== 'all') {
      list = list.filter(r => (r.section || '').toLowerCase() === selectedSection.toLowerCase());
    }

    if (selectedCategory !== 'all') {
      list = list.filter(r => {
        const prog = programmes.find(p => p._id?.toString() === r.programmeId || (r.programme && p.name && r.programme.includes(p.name)));
        return (prog?.category || '').toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(r => (r.programme || '').toLowerCase().includes(q));
    }

    return list;
  }, [publishedResults, selectedSection, selectedCategory, searchTerm, programmes]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100">
      
      {/* ========================================================================= */}
      {/* TV SCREEN TOP BROADCAST HEADER & DISPLAY CONTROLS                          */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Branding & Live Ticker */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md text-xl">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg sm:text-xl tracking-tight text-slate-900 uppercase">
                Wattaqa Festival 2k25
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                TV SCREEN
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Live Official Championship Results & Standings Broadcast
            </p>
          </div>
        </div>

        {/* Center: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Section Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            {['all', 'senior', 'junior', 'sub-junior', 'general'].map(sec => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  selectedSection === sec
                    ? 'bg-white text-slate-900 font-black shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {sec === 'all' ? 'All Sections' : sec}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            {['all', 'arts', 'sports'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 font-black shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Auto-Refresh Button & TV Controls */}
        <div className="flex items-center gap-2.5">
          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentTime}</span>
          </div>

          {/* Auto Refresh Toggle Button */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="Toggle Live Auto-Refresh"
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              autoRefresh 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-500/10'
                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            {autoRefresh ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Auto-Refresh: ON ({countdown}s)</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-400" />
                <span>Auto-Refresh: OFF</span>
              </>
            )}
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchData(true)}
            title="Refresh now"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-xs"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN SCREEN CONTENT                                                       */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* ======================================================================= */}
        {/* TOP SECTION: 3D ISOMETRIC PODIUM LEADERBOARD (MATCHING IMAGE 2 EXACTLY) */}
        {/* ======================================================================= */}
        <section className="relative bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
          {/* Subtle Warm Sunburst Spotlight Radial Gradient Background */}
          <div 
            className="absolute inset-x-0 top-0 h-96 pointer-events-none opacity-80"
            style={{
              background: 'radial-gradient(ellipse 70% 60% at 50% 10%, rgba(254, 240, 138, 0.45) 0%, rgba(254, 215, 170, 0.25) 45%, rgba(255, 255, 255, 0) 80%)'
            }}
          />

          {/* Leaderboard Card Header */}
          <div className="relative pt-7 pb-4 px-6 sm:px-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">🏆</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Leaderboard
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Standings
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Real-time festival championship standings calculated dynamically across all published results
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Tv className="w-4 h-4 text-slate-500" />
              <span>Screening Mode</span>
            </div>
          </div>

          {/* 3D Isometric / Perspective Podium */}
          <div className="relative pt-8 pb-6 px-4 sm:px-8 max-w-4xl mx-auto">
            <div className="flex justify-center items-end gap-3 sm:gap-6 pt-12 pb-2">
              
              {/* ============================================================ */}
              {/* RANK 2: LEFT PODIUM (Silver / Ice-Blue)                      */}
              {/* ============================================================ */}
              <div className="flex-1 max-w-[220px] flex flex-col items-center">
                {rank2 ? (
                  <div className="flex flex-col items-center mb-3 text-center transition-transform hover:-translate-y-1">
                    <div className="relative">
                      {/* Squircle Card Icon */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-blue-50 border-2 border-blue-200 shadow-md flex items-center justify-center text-3xl">
                        🥈
                      </div>
                      <span className="absolute -top-1.5 -right-1 text-sm">⭐</span>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mt-2 truncate max-w-[140px]">
                      {rank2.team.name}
                    </h3>
                    <div className="flex items-center gap-1 text-blue-600 font-bold text-xs sm:text-sm mt-0.5">
                      <span className="text-xs">💎</span>
                      <span>{rank2.totalPoints.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500 font-medium bg-slate-100/90 px-2 py-0.5 rounded-full">
                      <span>🥇{rank2.medals.gold}</span>
                      <span>🥈{rank2.medals.silver}</span>
                      <span>🥉{rank2.medals.bronze}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center text-xs text-slate-400">No Team</div>
                )}

                {/* 3D Isometric Podium Block: Rank 2 */}
                <div className="w-full flex flex-col items-center">
                  <div 
                    className="w-full h-6 bg-gradient-to-r from-blue-200 via-sky-200 to-blue-300 border-t border-x border-white/60 shadow-xs"
                    style={{ clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)' }}
                  />
                  <div className="w-full h-44 sm:h-52 bg-gradient-to-b from-[#93C5FD] via-[#60A5FA] to-[#3B82F6] rounded-b-2xl shadow-lg border-b border-x border-blue-400/40 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                    <ScreenLaurelWreath rank={2} />
                    <span className="text-[11px] font-semibold text-white/90 mt-2 tracking-wider uppercase">
                      Runner Up
                    </span>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* RANK 1: CENTER PODIUM (Gold / Warm Amber) - TALL & LEADING   */}
              {/* ============================================================ */}
              <div className="flex-1 max-w-[240px] flex flex-col items-center -mt-8 z-10">
                {rank1 ? (
                  <div className="flex flex-col items-center mb-3 text-center transition-transform hover:-translate-y-1">
                    <div className="relative">
                      {/* Crown on top */}
                      <div className="absolute -top-4 inset-x-0 flex justify-center text-lg animate-bounce">
                        👑
                      </div>
                      {/* Squircle Card Icon */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 border-2 border-amber-300 shadow-xl flex items-center justify-center text-4xl ring-4 ring-amber-400/20">
                        🥇
                      </div>
                      <span className="absolute -top-1 -right-1 text-base">✨</span>
                    </div>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg mt-2 tracking-tight truncate max-w-[160px]">
                      {rank1.team.name}
                    </h3>
                    <div className="flex items-center gap-1 text-amber-600 font-extrabold text-sm sm:text-base mt-0.5">
                      <span className="text-sm">💎</span>
                      <span>{rank1.totalPoints.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-900 font-bold bg-amber-100/90 border border-amber-200/80 px-2.5 py-0.5 rounded-full shadow-xs">
                      <span>🥇 {rank1.medals.gold}</span>
                      <span>🥈 {rank1.medals.silver}</span>
                      <span>🥉 {rank1.medals.bronze}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-400">No Team</div>
                )}

                {/* 3D Isometric Podium Block: Rank 1 */}
                <div className="w-full flex flex-col items-center">
                  <div 
                    className="w-full h-8 bg-gradient-to-r from-[#FEF08A] via-[#FDE047] to-[#FACC15] border-t border-x border-white/80 shadow-xs"
                    style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }}
                  />
                  <div className="w-full h-56 sm:h-64 bg-gradient-to-b from-[#F59E0B] via-[#EAB308] to-[#CA8A04] rounded-b-2xl shadow-2xl border-b-2 border-x border-amber-500/50 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                    <ScreenLaurelWreath rank={1} />
                    <span className="text-xs font-bold text-amber-950/80 bg-white/70 px-2.5 py-0.5 rounded-full mt-2 tracking-wider uppercase shadow-xs">
                      Champion
                    </span>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* RANK 3: RIGHT PODIUM (Bronze / Coral-Peach)                  */}
              {/* ============================================================ */}
              <div className="flex-1 max-w-[220px] flex flex-col items-center">
                {rank3 ? (
                  <div className="flex flex-col items-center mb-3 text-center transition-transform hover:-translate-y-1">
                    <div className="relative">
                      {/* Squircle Card Icon */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-orange-100 to-rose-50 border-2 border-orange-200 shadow-md flex items-center justify-center text-3xl">
                        🥉
                      </div>
                      <span className="absolute -top-1.5 -right-1 text-sm">⭐</span>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mt-2 truncate max-w-[140px]">
                      {rank3.team.name}
                    </h3>
                    <div className="flex items-center gap-1 text-orange-600 font-bold text-xs sm:text-sm mt-0.5">
                      <span className="text-xs">💎</span>
                      <span>{rank3.totalPoints.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500 font-medium bg-slate-100/90 px-2 py-0.5 rounded-full">
                      <span>🥇{rank3.medals.gold}</span>
                      <span>🥈{rank3.medals.silver}</span>
                      <span>🥉{rank3.medals.bronze}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center text-xs text-slate-400">No Team</div>
                )}

                {/* 3D Isometric Podium Block: Rank 3 */}
                <div className="w-full flex flex-col items-center">
                  <div 
                    className="w-full h-6 bg-gradient-to-r from-orange-200 via-amber-200 to-orange-300 border-t border-x border-white/60 shadow-xs"
                    style={{ clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)' }}
                  />
                  <div className="w-full h-36 sm:h-44 bg-gradient-to-b from-[#FB923C] via-[#F97316] to-[#EA580C] rounded-b-2xl shadow-lg border-b border-x border-orange-400/40 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                    <ScreenLaurelWreath rank={3} />
                    <span className="text-[11px] font-semibold text-white/90 mt-2 tracking-wider uppercase">
                      3rd Place
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Subtitle status bar */}
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Leaderboard updated {getRelativeTime(lastRefreshedAt)}</span>
              <span>•</span>
              <span>{publishedResults.length} published results counted</span>
            </div>

            {/* Carousel dots */}
            <div className="flex justify-center items-center gap-1.5 mt-3">
              <span className="w-2 h-2 rounded-full bg-slate-700"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* BOTTOM SECTION: RESULTS LIST (DEFAULT PRIZES, CLICK TO SEE OTHER/GRADES)*/}
        {/* ======================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <h3 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                  Competition Results
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {filteredResultsList.length} Announcements
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Official podium winners are shown by default. Click any result to view grade holders.
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search programmes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {filteredResultsList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700 text-base">No results found matching your filters</h4>
                <p className="text-xs text-slate-400 mt-1">Try selecting "All Sections" or clearing search</p>
              </div>
            ) : (
              filteredResultsList.map((res, index) => {
                const isExpanded = !!expandedResults[res._id?.toString() || String(index)];
                const progDoc = programmes.find(p => p._id?.toString() === res.programmeId || (res.programme && p.name && res.programme.includes(p.name)));
                const category = (progDoc?.category || '').toLowerCase();
                const isSports = category === 'sports';
                const sectionBadge = getSectionTheme(res.section || progDoc?.section);

                // Collect sets to isolate gradedOnly candidates
                const firstChestSet = new Set((res.firstPlace || []).map(p => String(p.chestNumber || '').trim()));
                const secondChestSet = new Set((res.secondPlace || []).map(p => String(p.chestNumber || '').trim()));
                const thirdChestSet = new Set((res.thirdPlace || []).map(p => String(p.chestNumber || '').trim()));
                const firstTeamSet = new Set((res.firstPlaceTeams || []).map(t => String(t.teamCode || '').trim().toUpperCase()));
                const secondTeamSet = new Set((res.secondPlaceTeams || []).map(t => String(t.teamCode || '').trim().toUpperCase()));
                const thirdTeamSet = new Set((res.thirdPlaceTeams || []).map(t => String(t.teamCode || '').trim().toUpperCase()));

                // Graded candidates who didn't win 1st, 2nd, or 3rd
                const gradedOnlyCandidates = [
                  ...(res.participationGrades || []).filter(pg => {
                    const chest = String(pg.chestNumber || '').trim();
                    return !firstChestSet.has(chest) && !secondChestSet.has(chest) && !thirdChestSet.has(chest);
                  }).map(pg => {
                    const cand = candidates.find(c => c.chestNumber === pg.chestNumber);
                    const theme = getTeamTheme(cand?.team, teams);
                    return {
                      type: 'individual' as const,
                      name: cand?.name || `Candidate #${pg.chestNumber}`,
                      chestNumber: pg.chestNumber,
                      teamName: theme.name,
                      teamCode: cand?.team,
                      grade: pg.grade,
                      points: pg.points !== undefined && pg.points !== null ? pg.points : getDefaultGradePoints(pg.grade)
                    };
                  }),
                  ...(res.participationTeamGrades || []).filter(tg => {
                    const code = String(tg.teamCode || '').trim().toUpperCase();
                    return !firstTeamSet.has(code) && !secondTeamSet.has(code) && !thirdTeamSet.has(code);
                  }).map(tg => {
                    const theme = getTeamTheme(tg.teamCode, teams);
                    return {
                      type: 'team' as const,
                      name: theme.name,
                      chestNumber: '',
                      teamName: theme.name,
                      teamCode: tg.teamCode,
                      grade: tg.grade,
                      points: tg.points !== undefined && tg.points !== null ? tg.points : getDefaultGradePoints(tg.grade)
                    };
                  })
                ];

                return (
                  <div
                    key={res._id?.toString() || index}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Programme Header Bar */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                          isSports ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {isSports ? '⚽' : '🎨'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {progDoc?.code && (
                              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                                {progDoc.code}
                              </span>
                            )}
                            <h4 className="font-black text-slate-900 text-base sm:text-lg">
                              {res.programme || progDoc?.name || 'Programme'}
                            </h4>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${sectionBadge.badgeBg}`}>
                              {sectionBadge.label}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-200/70 text-slate-700 capitalize">
                              {res.positionType || progDoc?.positionType || 'individual'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Published: {res.createdAt ? new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Grade Holders Toggle Button */}
                      {gradedOnlyCandidates.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleResultExpand(res._id?.toString() || String(index))}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          <span>🎖️ {gradedOnlyCandidates.length} Grade Holders</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* DEFAULT VIEW: PODIUM PRIZES (1st, 2nd, 3rd) with Candidate, Team, Points, and Grade */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* 1st Place Card */}
                      <div className="bg-gradient-to-b from-yellow-50/80 to-amber-50/40 rounded-2xl border-2 border-yellow-200/80 p-4 shadow-xs">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-yellow-200/60">
                          <div className="flex items-center gap-2 font-black text-amber-800 text-sm">
                            <span className="text-xl">🥇</span>
                            <span>FIRST PLACE</span>
                          </div>
                          <span className="text-xs font-black text-amber-900 bg-yellow-200/80 px-2 py-0.5 rounded-md">
                            +{res.firstPoints ?? 10} pts
                          </span>
                        </div>
                        {renderScreenWinners(res.firstPlace, res.firstPlaceTeams, candidates, teams, res.participationGrades, res.participationTeamGrades)}
                      </div>

                      {/* 2nd Place Card */}
                      <div className="bg-gradient-to-b from-slate-50 to-blue-50/40 rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                          <div className="flex items-center gap-2 font-black text-slate-700 text-sm">
                            <span className="text-xl">🥈</span>
                            <span>SECOND PLACE</span>
                          </div>
                          <span className="text-xs font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded-md">
                            +{res.secondPoints ?? 8} pts
                          </span>
                        </div>
                        {renderScreenWinners(res.secondPlace, res.secondPlaceTeams, candidates, teams, res.participationGrades, res.participationTeamGrades)}
                      </div>

                      {/* 3rd Place Card */}
                      <div className="bg-gradient-to-b from-orange-50/80 to-amber-50/40 rounded-2xl border-2 border-orange-200/80 p-4 shadow-xs">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-orange-200/60">
                          <div className="flex items-center gap-2 font-black text-orange-800 text-sm">
                            <span className="text-xl">🥉</span>
                            <span>THIRD PLACE</span>
                          </div>
                          <span className="text-xs font-black text-orange-900 bg-orange-200/80 px-2 py-0.5 rounded-md">
                            +{res.thirdPoints ?? 5} pts
                          </span>
                        </div>
                        {renderScreenWinners(res.thirdPlace, res.thirdPlaceTeams, candidates, teams, res.participationGrades, res.participationTeamGrades)}
                      </div>

                    </div>

                    {/* EXPANDED VIEW: GRADED CANDIDATES (ONLY SHOWN IF CLICKED) */}
                    {isExpanded && gradedOnlyCandidates.length > 0 && (
                      <div className="px-5 py-4 bg-purple-50/60 border-t border-purple-200/80 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🎖️</span>
                          <h5 className="font-extrabold text-purple-900 text-sm">
                            Grade Holders Without Podium Prize ({gradedOnlyCandidates.length})
                          </h5>
                          <span className="text-xs text-purple-600 font-medium">
                            • Candidates who secured official grades in this event
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {gradedOnlyCandidates.map((winner, gIdx) => (
                            <div
                              key={gIdx}
                              className="bg-white rounded-xl p-3 border border-purple-200/80 shadow-2xs flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-sm text-slate-900 truncate">{winner.name}</p>
                                <p className="text-xs text-slate-500">
                                  {winner.type === 'individual' ? `#${winner.chestNumber} • ${winner.teamName}` : winner.teamName}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-purple-600 text-white shadow-2xs">
                                  Grade {winner.grade}
                                </span>
                                {winner.points ? (
                                  <span className="text-xs font-bold text-purple-800">
                                    +{winner.points}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Wattaqa Arts Fest 2K25 • Official Result Screening System</p>
        <p className="mt-1 text-slate-400">Live Auto-Updating Display for Auditorium & TV Screens</p>
      </footer>
    </div>
  );
}

// --------------------------------------------------------------------------------
// HELPER: RENDER SCREEN WINNERS (Shows Candidate, Team, and Grade if present)
// --------------------------------------------------------------------------------
function renderScreenWinners(
  candidatesList?: { chestNumber: string; grade?: string }[],
  teamsList?: { teamCode: string; grade?: string }[],
  candidates: Candidate[] = [],
  teams: Team[] = [],
  participationGrades: { chestNumber: string; grade: string; points?: number }[] = [],
  participationTeamGrades: { teamCode: string; grade: string; points?: number }[] = []
) {
  if (teamsList && teamsList.length > 0) {
    return (
      <div className="space-y-2">
        {teamsList.map(t => {
          const theme = getTeamTheme(t.teamCode, teams);
          const tg = participationTeamGrades.find(g => g.teamCode === t.teamCode);
          const grade = t.grade || tg?.grade;
          return (
            <div key={t.teamCode} className="flex items-center justify-between gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: theme.color }}></span>
                <span className="font-bold text-slate-900 text-sm">{theme.name}</span>
                <span className="text-xs text-slate-500">({t.teamCode})</span>
              </div>
              {grade && (
                <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs shrink-0">
                  Grade {grade}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (candidatesList && candidatesList.length > 0) {
    return (
      <div className="space-y-2">
        {candidatesList.map(item => {
          const cand = candidates.find(c => c.chestNumber === item.chestNumber);
          const theme = getTeamTheme(cand?.team, teams);
          const pg = participationGrades.find(g => g.chestNumber === item.chestNumber);
          const grade = item.grade || pg?.grade;

          return (
            <div key={item.chestNumber} className="flex items-center justify-between gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    #{item.chestNumber}
                  </span>
                  <span className="font-bold text-slate-900 text-sm truncate">
                    {cand?.name || `Candidate #${item.chestNumber}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }}></span>
                  <span>{theme.name}</span>
                </div>
              </div>
              {grade && (
                <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs shrink-0">
                  Grade {grade}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return <div className="text-slate-400 italic text-xs py-2 text-center">None announced</div>;
}

// --------------------------------------------------------------------------------
// HELPER: SCREEN LAUREL WREATH SVG FOR PODIUM
// --------------------------------------------------------------------------------
function ScreenLaurelWreath({ rank }: { rank: 1 | 2 | 3 }) {
  return (
    <div className="flex flex-col items-center justify-center text-white select-none">
      {/* 3 Stars on top */}
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="text-xs text-white/90">★</span>
        <span className="text-sm font-bold text-white">★</span>
        <span className="text-xs text-white/90">★</span>
      </div>

      {/* Number with Laurel Wreath SVG */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 120 90"
          className="w-24 h-20 text-white fill-current drop-shadow-md"
        >
          {/* Left branch */}
          <g>
            <path d="M 52 74 C 36 72 24 58 24 42 C 24 28 32 16 44 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 50 73 C 44 73 40 68 42 64 C 45 64 49 67 50 73 Z" />
            <path d="M 38 65 C 32 65 28 60 30 56 C 33 56 37 59 38 65 Z" />
            <path d="M 28 54 C 22 53 19 48 22 44 C 25 44 28 48 28 54 Z" />
            <path d="M 23 41 C 18 39 16 33 19 30 C 22 31 24 35 23 41 Z" />
            <path d="M 24 28 C 20 25 20 19 24 17 C 26 19 27 23 24 28 Z" />
            <path d="M 31 17 C 28 13 30 8 34 7 C 36 9 35 14 31 17 Z" />
            <path d="M 42 9 C 40 5 44 1 48 1 C 49 4 47 8 42 9 Z" />
            <path d="M 44 58 C 42 54 43 49 47 48 C 48 51 46 56 44 58 Z" />
            <path d="M 35 46 C 34 42 36 37 40 37 C 41 40 38 44 35 46 Z" />
            <path d="M 32 33 C 32 29 35 25 39 26 C 39 29 36 32 32 33 Z" />
          </g>
          {/* Right branch (mirrored) */}
          <g transform="translate(120, 0) scale(-1, 1)">
            <path d="M 52 74 C 36 72 24 58 24 42 C 24 28 32 16 44 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 50 73 C 44 73 40 68 42 64 C 45 64 49 67 50 73 Z" />
            <path d="M 38 65 C 32 65 28 60 30 56 C 33 56 37 59 38 65 Z" />
            <path d="M 28 54 C 22 53 19 48 22 44 C 25 44 28 48 28 54 Z" />
            <path d="M 23 41 C 18 39 16 33 19 30 C 22 31 24 35 23 41 Z" />
            <path d="M 24 28 C 20 25 20 19 24 17 C 26 19 27 23 24 28 Z" />
            <path d="M 31 17 C 28 13 30 8 34 7 C 36 9 35 14 31 17 Z" />
            <path d="M 42 9 C 40 5 44 1 48 1 C 49 4 47 8 42 9 Z" />
            <path d="M 44 58 C 42 54 43 49 47 48 C 48 51 46 56 44 58 Z" />
            <path d="M 35 46 C 34 42 36 37 40 37 C 41 40 38 44 35 46 Z" />
            <path d="M 32 33 C 32 29 35 25 39 26 C 39 29 36 32 32 33 Z" />
          </g>
          {/* Bottom Ribbon */}
          <path d="M 55 75 C 58 77 62 77 65 75 C 67 78 63 81 60 81 C 57 81 53 78 55 75 Z" />
        </svg>
        <span className="absolute font-black text-3xl sm:text-4xl tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          {rank}
        </span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------
// HELPER: RELATIVE TIME
// --------------------------------------------------------------------------------
function getRelativeTime(date: Date): string {
  const diffSec = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
