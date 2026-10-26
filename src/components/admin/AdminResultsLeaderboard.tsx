'use client';

import { useState, useMemo } from 'react';
import { Result, Programme, Candidate, ProgrammeParticipant, Team } from '@/types';
import { getTeamTheme, getSectionTheme, classifyProgramme } from '@/lib/profileHelper';
import { getDefaultGradePoints } from '@/lib/resultsHelper';
import { 
  Trophy, 
  Medal, 
  Sparkles, 
  RotateCw, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Calendar, 
  TrendingUp, 
  Users, 
  Award,
  Filter,
  CheckCircle2,
  Clock,
  Search,
  Flame,
  ArrowRight
} from 'lucide-react';

interface AdminResultsLeaderboardProps {
  results: Result[];
  programmes: Programme[];
  candidates: Candidate[];
  teams: Team[];
  participants: ProgrammeParticipant[];
  onRefresh?: () => void;
  onEditResult?: (result: Result) => void;
  onSwitchToManageTab?: () => void;
}

export interface TeamStanding {
  team: Team;
  rank: number;
  totalPoints: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  totalWins: number;
  totalParticipations: number;
  winRate: number;
  recentResults: {
    programmeName: string;
    programmeCode: string;
    points: number;
    medal: 'gold' | 'silver' | 'bronze' | 'participation';
    date?: string;
  }[];
}

export function AdminResultsLeaderboard({
  results,
  programmes,
  candidates,
  teams,
  participants,
  onRefresh,
  onEditResult,
  onSwitchToManageTab
}: AdminResultsLeaderboardProps) {
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'arts' | 'sports'>('arts');
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [resultsSearch, setResultsSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Filter published results
  const publishedResults = useMemo(() => {
    return results.filter(r => r.status === 'published' || !r.status);
  }, [results]);

  // Helper map for programmes: id/code -> programme
  const progMap = useMemo(() => {
    const map = new Map<string, Programme>();
    programmes.forEach(p => {
      if (p._id) map.set(p._id.toString(), p);
      if (p.id) map.set(String(p.id), p);
      if (p.code) map.set(p.code.toUpperCase().trim(), p);
    });
    return map;
  }, [programmes]);

  // Published results filtered by category
  const publishedResultsForCategory = useMemo(() => {
    return publishedResults.filter(r => {
      let prog = r.programmeId ? progMap.get(r.programmeId) : undefined;
      if (!prog && r.programme) {
        prog = programmes.find(p => p._id?.toString() === r.programmeId || (p.code && r.programme?.startsWith(p.code)));
      }
      const rawCat = (prog?.category || (r as any).category || '').toLowerCase().trim();
      const resCat = rawCat === 'sports' ? 'sports' : rawCat === 'arts' ? 'arts' : classifyProgramme(prog, prog?.code, r.programme).category || 'arts';
      return resCat === selectedCategory;
    });
  }, [publishedResults, selectedCategory, progMap, programmes]);

  // Compute standings dynamically from published results
  const teamStandings: TeamStanding[] = useMemo(() => {
    // Map team codes
    const map: Record<string, TeamStanding> = {};

    // Initialize all known teams
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
        winRate: 0,
        recentResults: []
      };
    });

    // Also ensure standard 3 teams exist if not present
    ['ADL', 'SHJ', 'QIY'].forEach(code => {
      if (!map[code]) {
        const theme = getTeamTheme(code, teams);
        map[code] = {
          team: {
            code,
            name: theme.name,
            color: theme.color,
            description: '',
            createdAt: new Date(),
            updatedAt: new Date()
          } as any,
          rank: 0,
          totalPoints: 0,
          medals: { gold: 0, silver: 0, bronze: 0 },
          totalWins: 0,
          totalParticipations: 0,
          winRate: 0,
          recentResults: []
        };
      }
    });

    // Helper map for candidates: chestNumber -> candidate
    const candMap = new Map<string, Candidate>();
    candidates.forEach(c => {
      if (c.chestNumber) candMap.set(String(c.chestNumber).trim(), c);
    });

    // Process published results (filtered by section and category if specified)
    publishedResults.forEach(res => {
      // Find matching programme
      let prog = res.programmeId ? progMap.get(res.programmeId) : undefined;
      if (!prog && res.programme) {
        const codeMatch = res.programme.match(/^([A-Za-z0-9_-]+)/);
        if (codeMatch) prog = progMap.get(codeMatch[1].toUpperCase().trim());
      }

      // Check section filter
      if (selectedSection !== 'all') {
        const resSec = (res.section || prog?.section || '').toLowerCase().trim();
        if (resSec !== selectedSection.toLowerCase().trim()) return;
      }

      // Check category filter: strict separation between Arts and Sports (No 'All')
      const rawCat = (prog?.category || (res as any).category || '').toLowerCase().trim();
      const resCat = rawCat === 'sports' ? 'sports' : rawCat === 'arts' ? 'arts' : classifyProgramme(prog, prog?.code, res.programme).category || 'arts';
      if (resCat !== selectedCategory) return;

      const isIndividual = res.positionType === 'individual';
      const isTeamBased = res.positionType === 'group' || res.positionType === 'general';
      const progName = prog?.name || res.programme || 'Unknown Programme';
      const progCode = prog?.code || '';

      // Individual Placements
      if (isIndividual) {
        const tiers = [
          { place: res.firstPlace, points: res.firstPoints ?? 10, medal: 'gold' as const },
          { place: res.secondPlace, points: res.secondPoints ?? 8, medal: 'silver' as const },
          { place: res.thirdPlace, points: res.thirdPoints ?? 5, medal: 'bronze' as const }
        ];

        tiers.forEach(({ place, points, medal }) => {
          (place || []).forEach(item => {
            const chest = String(item.chestNumber || '').trim();
            const cand = candMap.get(chest);
            const teamCode = (cand?.team || '').toUpperCase().trim();
            if (teamCode && map[teamCode]) {
              map[teamCode].totalPoints += points;
              map[teamCode].medals[medal] += 1;
              map[teamCode].totalWins += 1;
              map[teamCode].totalParticipations += 1;
              map[teamCode].recentResults.push({
                programmeName: progName,
                programmeCode: progCode,
                points,
                medal,
                date: res.createdAt ? new Date(res.createdAt).toISOString() : undefined
              });
            }
          });
        });

        // Individual participation grades
        (res.participationGrades || []).forEach(pg => {
          const chest = String(pg.chestNumber || '').trim();
          const cand = candMap.get(chest);
          const teamCode = (cand?.team || '').toUpperCase().trim();
          const pts = pg.points !== undefined && pg.points !== null ? pg.points : (getDefaultGradePoints(pg.grade) || res.participationPoints || 0);
          if (teamCode && map[teamCode]) {
            map[teamCode].totalPoints += pts;
            map[teamCode].totalParticipations += 1;
            if (pts > 0) {
              map[teamCode].recentResults.push({
                programmeName: progName,
                programmeCode: progCode,
                points: pts,
                medal: 'participation'
              });
            }
          }
        });
      }

      // Team Based (Group / General)
      if (isTeamBased) {
        const teamTiers = [
          { teams: res.firstPlaceTeams, points: res.firstPoints ?? 10, medal: 'gold' as const },
          { teams: res.secondPlaceTeams, points: res.secondPoints ?? 8, medal: 'silver' as const },
          { teams: res.thirdPlaceTeams, points: res.thirdPoints ?? 5, medal: 'bronze' as const }
        ];

        teamTiers.forEach(({ teams: tList, points, medal }) => {
          (tList || []).forEach(item => {
            const code = (item.teamCode || '').toUpperCase().trim();
            if (code && map[code]) {
              map[code].totalPoints += points;
              map[code].medals[medal] += 1;
              map[code].totalWins += 1;
              map[code].totalParticipations += 1;
              map[code].recentResults.push({
                programmeName: progName,
                programmeCode: progCode,
                points,
                medal,
                date: res.createdAt ? new Date(res.createdAt).toISOString() : undefined
              });
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

    // Compute winRate & sort
    const list = Object.values(map);
    list.forEach(item => {
      item.winRate = item.totalParticipations > 0 ? (item.totalWins / item.totalParticipations) * 100 : 0;
    });

    // Sort by totalPoints desc, then gold desc, silver desc, bronze desc
    list.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
      if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
      return b.medals.bronze - a.medals.bronze;
    });

    // Assign rank
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [publishedResults, teams, candidates, programmes, selectedSection, selectedCategory]);

  // Top 3 Podium teams: [Rank 2 (Silver), Rank 1 (Gold), Rank 3 (Bronze)]
  const rank1 = teamStandings[0];
  const rank2 = teamStandings[1];
  const rank3 = teamStandings[2];
  const otherTeams = teamStandings.slice(3);

  // Latest published results in chronological order (filtered by category)
  const latestResults = useMemo(() => {
    const list = publishedResults.filter(r => {
      let prog = r.programmeId ? progMap.get(r.programmeId) : undefined;
      if (!prog && r.programme) {
        const codeMatch = r.programme.match(/^([A-Za-z0-9_-]+)/);
        if (codeMatch) prog = progMap.get(codeMatch[1].toUpperCase().trim());
      }
      const rawCat = (prog?.category || (r as any).category || '').toLowerCase().trim();
      const resCat = rawCat === 'sports' ? 'sports' : rawCat === 'arts' ? 'arts' : classifyProgramme(prog, prog?.code, r.programme).category || 'arts';
      return resCat === selectedCategory;
    }).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    if (!resultsSearch.trim()) return list.slice(0, 10);
    const q = resultsSearch.toLowerCase().trim();
    return list.filter(r => {
      const name = (r.programme || '').toLowerCase();
      const sec = (r.section || '').toLowerCase();
      return name.includes(q) || sec.includes(q);
    }).slice(0, 10);
  }, [publishedResults, resultsSearch, selectedCategory, progMap]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setLastRefreshedAt(new Date());
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Helper to get winner info for a result card
  const getResultWinnerSummary = (res: Result) => {
    if (res.firstPlaceTeams && res.firstPlaceTeams.length > 0) {
      const tCode = res.firstPlaceTeams[0].teamCode;
      const theme = getTeamTheme(tCode, teams);
      return {
        name: theme.name,
        code: tCode,
        color: theme.color,
        points: res.firstPoints ?? 10
      };
    }
    if (res.firstPlace && res.firstPlace.length > 0) {
      const chest = res.firstPlace[0].chestNumber;
      const cand = candidates.find(c => c.chestNumber === chest);
      const theme = getTeamTheme(cand?.team, teams);
      return {
        name: cand ? `${cand.name} (${theme.name})` : theme.name,
        code: cand?.team || theme.code,
        color: theme.color,
        points: res.firstPoints ?? 10
      };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Main Leaderboard Card (Clone of Image 2 UI) */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Subtle Warm Sunburst Spotlight Radial Gradient Background at the top */}
        <div 
          className="absolute inset-x-0 top-0 h-96 pointer-events-none opacity-80"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 10%, rgba(254, 240, 138, 0.45) 0%, rgba(254, 215, 170, 0.25) 45%, rgba(255, 255, 255, 0) 80%)'
          }}
        />

        {/* Header Section */}
        <div className="relative pt-7 pb-4 px-6 sm:px-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏆</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Leaderboard
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Standings
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time {selectedCategory === 'arts' ? 'Arts' : 'Sports'} championship standings calculated separately across published results
            </p>
          </div>

          {/* Controls: Section / Category filters & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Section Filter Pills */}
            <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-medium text-slate-600">
              {['all', 'senior', 'junior', 'sub-junior', 'general'].map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    selectedSection === sec
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {sec === 'all' ? 'All Sections' : sec}
                </button>
              ))}
            </div>

            {/* Category Filter: Separate Arts vs Sports (No All) */}
            <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
              {(['arts', 'sports'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 font-black shadow-xs'
                      : 'hover:text-slate-900 text-slate-500'
                  }`}
                >
                  <span>{cat === 'arts' ? '🎨' : '⚽'}</span>
                  <span>{cat === 'arts' ? 'Arts' : 'Sports'}</span>
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              title="Refresh standings"
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all active:scale-95 flex items-center justify-center"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3D Isometric / Perspective Podium Section */}
        <div className="relative pt-10 pb-6 px-4 sm:px-8 max-w-4xl mx-auto">
          {/* Top Sunburst Subtle Ray Accents */}
          <div className="flex justify-center items-end gap-3 sm:gap-6 pt-12 pb-2">
            
            {/* ============================================================ */}
            {/* RANK 2: LEFT PODIUM (Silver / Ice-Blue)                      */}
            {/* ============================================================ */}
            <div className="flex-1 max-w-[220px] flex flex-col items-center">
              {/* Floating Avatar & Details Card above podium */}
              {rank2 ? (
                <div className="flex flex-col items-center mb-3 text-center transition-transform hover:-translate-y-1">
                  <div className="relative">
                    {/* Squircle Card Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-blue-50 border-2 border-blue-200 shadow-md flex items-center justify-center text-3xl">
                      🥈
                    </div>
                    {/* Small star on top */}
                    <span className="absolute -top-1.5 -right-1 text-sm">⭐</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mt-2 truncate max-w-[130px]">
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
                <div className="h-28 flex items-center justify-center text-xs text-slate-400">
                  No Team
                </div>
              )}

              {/* 3D Isometric Podium Block: Rank 2 */}
              <div className="w-full flex flex-col items-center">
                {/* 3D Top Trapezoid Face */}
                <div 
                  className="w-full h-6 bg-gradient-to-r from-blue-200 via-sky-200 to-blue-300 border-t border-x border-white/60 shadow-xs"
                  style={{
                    clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)'
                  }}
                />
                {/* Front Face of Rank 2 Podium */}
                <div className="w-full h-44 sm:h-52 bg-gradient-to-b from-[#93C5FD] via-[#60A5FA] to-[#3B82F6] rounded-b-2xl shadow-lg border-b border-x border-blue-400/40 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  {/* Subtle inner highlight */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                  
                  {/* Laurel Wreath Emblem with 3 stars & Number 2 */}
                  <LaurelWreath rank={2} />

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
              {/* Floating Avatar & Details Card above podium */}
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
                    {/* Star accent */}
                    <span className="absolute -top-1 -right-1 text-base">✨</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg mt-2 tracking-tight truncate max-w-[150px]">
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
                <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                  No Team
                </div>
              )}

              {/* 3D Isometric Podium Block: Rank 1 */}
              <div className="w-full flex flex-col items-center">
                {/* 3D Top Trapezoid Face */}
                <div 
                  className="w-full h-8 bg-gradient-to-r from-[#FEF08A] via-[#FDE047] to-[#FACC15] border-t border-x border-white/80 shadow-xs"
                  style={{
                    clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)'
                  }}
                />
                {/* Front Face of Rank 1 Podium */}
                <div className="w-full h-56 sm:h-64 bg-gradient-to-b from-[#F59E0B] via-[#EAB308] to-[#CA8A04] rounded-b-2xl shadow-2xl border-b-2 border-x border-amber-500/50 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  {/* Subtle inner highlight */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                  
                  {/* Laurel Wreath Emblem with 3 stars & Number 1 */}
                  <LaurelWreath rank={1} />

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
              {/* Floating Avatar & Details Card above podium */}
              {rank3 ? (
                <div className="flex flex-col items-center mb-3 text-center transition-transform hover:-translate-y-1">
                  <div className="relative">
                    {/* Squircle Card Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-orange-100 to-rose-50 border-2 border-orange-200 shadow-md flex items-center justify-center text-3xl">
                      🥉
                    </div>
                    {/* Small star on top */}
                    <span className="absolute -top-1.5 -right-1 text-sm">⭐</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mt-2 truncate max-w-[130px]">
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
                <div className="h-28 flex items-center justify-center text-xs text-slate-400">
                  No Team
                </div>
              )}

              {/* 3D Isometric Podium Block: Rank 3 */}
              <div className="w-full flex flex-col items-center">
                {/* 3D Top Trapezoid Face */}
                <div 
                  className="w-full h-6 bg-gradient-to-r from-orange-200 via-amber-200 to-orange-300 border-t border-x border-white/60 shadow-xs"
                  style={{
                    clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)'
                  }}
                />
                {/* Front Face of Rank 3 Podium */}
                <div className="w-full h-36 sm:h-44 bg-gradient-to-b from-[#FB923C] via-[#F97316] to-[#EA580C] rounded-b-2xl shadow-lg border-b border-x border-orange-400/40 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  {/* Subtle inner highlight */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                  
                  {/* Laurel Wreath Emblem with 3 stars & Number 3 */}
                  <LaurelWreath rank={3} />

                  <span className="text-[11px] font-semibold text-white/90 mt-2 tracking-wider uppercase">
                    3rd Place
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Status Subtitle below podium: exactly like Image 2 */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500">
            <RotateCw className="w-3.5 h-3.5" />
            <span>Leaderboard updated {getRelativeTime(lastRefreshedAt)}</span>
            <span>•</span>
            <span>{publishedResultsForCategory.length} published {selectedCategory === 'arts' ? 'Arts' : 'Sports'} results counted</span>
          </div>

          {/* Carousel dots like image 2 */}
          <div className="flex justify-center items-center gap-1.5 mt-3">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RANK 4+ TEAMS (if any other teams exist in the fest)         */}
        {/* ============================================================ */}
        {otherTeams.length > 0 && (
          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Other Team Standings
            </h4>
            {otherTeams.map(t => {
              const theme = getTeamTheme(t.team.code, teams);
              return (
                <div
                  key={t.team.code}
                  className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3.5 border border-slate-200/60 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-200 font-bold text-xs text-slate-600 flex items-center justify-center">
                      #{t.rank}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center font-bold text-sm text-slate-800">
                      {t.team.code}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{t.team.name}</h5>
                      <span className="text-xs text-slate-500">@{t.team.code.toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <span>🥇{t.medals.gold}</span>
                      <span>🥈{t.medals.silver}</span>
                      <span>🥉{t.medals.bronze}</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                      <span className="text-xs">💎</span>
                      <span>{t.totalPoints.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* UNDER PODIUM: LATEST RESULTS FEED ("and under we need to     */}
        {/* show the some latest results too")                           */}
        {/* ============================================================ */}
        <div className="border-t border-slate-200/80 bg-slate-50/50 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                  Latest Results Announcements
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {publishedResultsForCategory.length} Published ({selectedCategory === 'arts' ? 'Arts' : 'Sports'})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Recently published competitions and podium winners
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search latest results..."
                value={resultsSearch}
                onChange={(e) => setResultsSearch(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Results List Cards */}
          <div className="space-y-3">
            {latestResults.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
                <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No published results found</p>
                <p className="text-xs text-slate-400 mt-1">Publish results from the Manage tab to see them here.</p>
              </div>
            ) : (
              latestResults.map((res, index) => {
                const winner = getResultWinnerSummary(res);
                const isExpanded = expandedResultId === res._id?.toString();
                const progDoc = programmes.find(p => p._id?.toString() === res.programmeId || (res.programme && p.name && res.programme.includes(p.name)));
                const category = (progDoc?.category || '').toLowerCase();
                const isSports = category === 'sports';
                const sectionBadge = getSectionTheme(res.section || progDoc?.section);

                return (
                  <div
                    key={res._id?.toString() || index}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Main Row */}
                    <div 
                      onClick={() => setExpandedResultId(isExpanded ? null : (res._id?.toString() || ''))}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      {/* Left: Icon & Programme Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Number / Medal Badge */}
                        <div className="w-8 h-8 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center shrink-0">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>

                        {/* Programme Icon */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                          isSports ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {isSports ? '⚽' : '🎨'}
                        </div>

                        {/* Titles & Tags */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {res.programme || progDoc?.name || 'Programme'}
                            </h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${sectionBadge.badgeBg}`}>
                              {sectionBadge.label}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                              {res.positionType || progDoc?.positionType || 'individual'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>
                              {res.createdAt ? new Date(res.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Recent'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Winner Summary & Diamond points */}
                      <div className="flex items-center gap-3 shrink-0">
                        {winner && (
                          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80">
                            <span className="text-xs">🏆</span>
                            <span className="font-bold text-xs text-slate-800">{winner.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 font-black text-blue-600 text-sm bg-blue-50/80 px-2.5 py-1 rounded-xl border border-blue-200/60">
                          <span className="text-xs">💎</span>
                          <span>+{res.firstPoints ?? 10}</span>
                        </div>
                        <div className="text-slate-400 hover:text-slate-600">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Podium Breakdown */}
                    {isExpanded && (() => {
                      const firstChestSet = new Set((res.firstPlace || []).map(p => String(p.chestNumber || '').trim()));
                      const secondChestSet = new Set((res.secondPlace || []).map(p => String(p.chestNumber || '').trim()));
                      const thirdChestSet = new Set((res.thirdPlace || []).map(p => String(p.chestNumber || '').trim()));
                      const firstTeamSet = new Set((res.firstPlaceTeams || []).map(t => String(t.teamCode || '').trim().toUpperCase()));
                      const secondTeamSet = new Set((res.secondPlaceTeams || []).map(t => String(t.teamCode || '').trim().toUpperCase()));
                      const thirdTeamSet = new Set((res.thirdPlaceTeams || []).map(t => String(t.teamCode || '').trim().toUpperCase()));

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
                        <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-700 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* 1st Place */}
                            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70">
                              <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                                <span>🥇 1st Place</span>
                                <span className="ml-auto text-amber-900 font-extrabold">+{res.firstPoints ?? 10} pts</span>
                              </div>
                              {renderWinnersList(res.firstPlace, res.firstPlaceTeams, candidates, teams, res.participationGrades, res.participationTeamGrades)}
                            </div>

                            {/* 2nd Place */}
                            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70">
                              <div className="flex items-center gap-1.5 font-bold text-blue-800 mb-1">
                                <span>🥈 2nd Place</span>
                                <span className="ml-auto text-blue-900 font-extrabold">+{res.secondPoints ?? 8} pts</span>
                              </div>
                              {renderWinnersList(res.secondPlace, res.secondPlaceTeams, candidates, teams, res.participationGrades, res.participationTeamGrades)}
                            </div>

                            {/* 3rd Place */}
                            <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200/70">
                              <div className="flex items-center gap-1.5 font-bold text-orange-800 mb-1">
                                <span>🥉 3rd Place</span>
                                <span className="ml-auto text-orange-900 font-extrabold">+{res.thirdPoints ?? 5} pts</span>
                              </div>
                              {renderWinnersList(res.thirdPlace, res.thirdPlaceTeams, candidates, teams, res.participationGrades, res.participationTeamGrades)}
                            </div>
                          </div>

                          {/* Graded Candidates without podium prize */}
                          {gradedOnlyCandidates.length > 0 && (
                            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80">
                              <div className="flex items-center gap-1.5 font-bold text-purple-900 mb-2">
                                <span>🎖️ Grade Holders ({gradedOnlyCandidates.length})</span>
                                <span className="text-[11px] text-purple-600 font-normal">• Graded participants</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {gradedOnlyCandidates.map((item, idx) => (
                                  <div key={idx} className="bg-white/90 border border-purple-100 rounded-lg p-2.5 flex items-center justify-between text-xs shadow-2xs">
                                    <div>
                                      <p className="font-bold text-slate-800">{item.name}</p>
                                      <p className="text-[10px] text-slate-500">
                                        {item.type === 'individual' ? `#${item.chestNumber} • ${item.teamName}` : item.teamName}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-purple-600 text-white shadow-2xs">
                                        Grade {item.grade}
                                      </span>
                                      {item.points ? (
                                        <span className="text-[10px] text-purple-700 font-bold">
                                          +{item.points} pts
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[11px] text-slate-400">
                              Status: <strong className="text-emerald-600 uppercase font-bold">{res.status || 'published'}</strong>
                            </span>
                            {onEditResult && (
                              <button
                                onClick={() => onEditResult(res)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                Edit Result in Manager &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Switch Tab CTA */}
          {onSwitchToManageTab && (
            <div className="mt-6 pt-5 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Want to publish more results or edit existing ones?
              </span>
              <button
                onClick={onSwitchToManageTab}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
              >
                Go to Results Manager <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for Laurel Wreath with 3 Stars and Big Number on Podium Front Face
function LaurelWreath({ rank }: { rank: 1 | 2 | 3 }) {
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
        {/* Laurel branches SVG */}
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

// Helper to render candidate or team winners in result drawer
function renderWinnersList(
  candidatesList?: { chestNumber: string; grade?: string }[],
  teamsList?: { teamCode: string; grade?: string }[],
  candidates: Candidate[] = [],
  teams: Team[] = [],
  participationGrades: { chestNumber: string; grade: string; points?: number }[] = [],
  participationTeamGrades: { teamCode: string; grade: string; points?: number }[] = []
) {
  if (teamsList && teamsList.length > 0) {
    return (
      <div className="space-y-1.5">
        {teamsList.map(t => {
          const theme = getTeamTheme(t.teamCode, teams);
          const tg = participationTeamGrades.find(g => g.teamCode === t.teamCode);
          const grade = t.grade || tg?.grade;
          return (
            <div key={t.teamCode} className="flex items-center justify-between gap-1 text-slate-800">
              <span className="font-semibold">
                🚩 {theme.name} ({t.teamCode})
              </span>
              {grade && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
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
      <div className="space-y-1.5">
        {candidatesList.map(item => {
          const cand = candidates.find(c => c.chestNumber === item.chestNumber);
          const theme = getTeamTheme(cand?.team, teams);
          const pg = participationGrades.find(g => g.chestNumber === item.chestNumber);
          const grade = item.grade || pg?.grade;
          return (
            <div key={item.chestNumber} className="flex items-center justify-between gap-1 text-slate-800">
              <div>
                <span className="font-bold">{cand?.name || `Candidate #${item.chestNumber}`}</span>
                <span className="text-[10px] text-slate-500 ml-1">
                  (#{item.chestNumber} • {theme.name})
                </span>
              </div>
              {grade && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                  Grade {grade}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return <div className="text-slate-400 italic">None announced</div>;
}

// Relative time formatter
function getRelativeTime(date: Date): string {
  const diffSec = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
