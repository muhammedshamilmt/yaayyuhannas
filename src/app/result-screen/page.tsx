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
  Tv,
  Star,
  Medal,
  User,
  Eye,
  EyeOff
} from 'lucide-react';

interface PodiumColorTheme {
  name: string;
  topBg: string;
  frontBg: string;
  borderTop: string;
  borderFront: string;
  glow: string;
  textColor: string;
  accentBg: string;
  squircleBg: string;
  badgeClass: string;
}

function getPodiumColorTheme(team?: Team): PodiumColorTheme {
  if (!team) {
    return {
      name: 'Team',
      topBg: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300',
      frontBg: 'bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600',
      borderTop: 'border-white/70',
      borderFront: 'border-slate-400/50',
      glow: 'shadow-slate-500/20',
      textColor: 'text-slate-700',
      accentBg: 'bg-slate-100 text-slate-800 border-slate-200',
      squircleBg: 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300',
      badgeClass: 'bg-slate-700 text-white',
    };
  }

  const code = (team.code || '').toUpperCase();
  const name = (team.name || '').toLowerCase();
  const hex = (team.color || '').toLowerCase();

  // ADĀLAH / Blue (#3b82f6)
  if (code === 'ADL' || name.includes('adāl') || name.includes('adal') || hex.includes('3b82f6') || hex.includes('blue')) {
    return {
      name: team.name || 'ADĀLAH',
      topBg: 'bg-gradient-to-r from-blue-200 via-sky-200 to-blue-300',
      frontBg: 'bg-gradient-to-b from-[#60A5FA] via-[#3B82F6] to-[#1D4ED8]',
      borderTop: 'border-white/70',
      borderFront: 'border-blue-400/50',
      glow: 'shadow-blue-500/30',
      textColor: 'text-blue-600',
      accentBg: 'bg-blue-50 text-blue-700 border-blue-200',
      squircleBg: 'bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-200',
      badgeClass: 'bg-blue-600 text-white',
    };
  }

  // SHAJĀʿAH / Red (#ef4444)
  if (code === 'SHJ' || name.includes('shaj') || hex.includes('ef4444') || hex.includes('red')) {
    return {
      name: team.name || 'SHAJĀʿAH',
      topBg: 'bg-gradient-to-r from-rose-200 via-red-200 to-rose-300',
      frontBg: 'bg-gradient-to-b from-[#F87171] via-[#EF4444] to-[#B91C1C]',
      borderTop: 'border-white/70',
      borderFront: 'border-red-400/50',
      glow: 'shadow-red-500/30',
      textColor: 'text-red-600',
      accentBg: 'bg-red-50 text-red-700 border-red-200',
      squircleBg: 'bg-gradient-to-br from-rose-50 to-red-100 border-2 border-red-200',
      badgeClass: 'bg-red-600 text-white',
    };
  }

  // QIYĀDAH / Green (#22c55e)
  if (code === 'QIY' || code === 'QYD' || name.includes('qiya') || hex.includes('22c55e') || hex.includes('green')) {
    return {
      name: team.name || 'QIYĀDAH',
      topBg: 'bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-300',
      frontBg: 'bg-gradient-to-b from-[#4ADE80] via-[#22C55E] to-[#15803D]',
      borderTop: 'border-white/70',
      borderFront: 'border-emerald-400/50',
      glow: 'shadow-emerald-500/30',
      textColor: 'text-emerald-600',
      accentBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      squircleBg: 'bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200',
      badgeClass: 'bg-emerald-600 text-white',
    };
  }

  // Yellow / Amber / Gold
  if (hex.includes('eab308') || hex.includes('f59e0b') || hex.includes('yellow') || hex.includes('amber')) {
    return {
      name: team.name || 'TEAM',
      topBg: 'bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300',
      frontBg: 'bg-gradient-to-b from-[#F59E0B] via-[#EAB308] to-[#B45309]',
      borderTop: 'border-white/80',
      borderFront: 'border-amber-400/50',
      glow: 'shadow-amber-500/30',
      textColor: 'text-amber-600',
      accentBg: 'bg-amber-50 text-amber-700 border-amber-200',
      squircleBg: 'bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-200',
      badgeClass: 'bg-amber-600 text-white',
    };
  }

  // Generic custom hex color fallback
  return {
    name: team.name || 'TEAM',
    topBg: 'bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-300',
    frontBg: 'bg-gradient-to-b from-[#818CF8] via-[#6366F1] to-[#4338CA]',
    borderTop: 'border-white/70',
    borderFront: 'border-indigo-400/50',
    glow: 'shadow-indigo-500/30',
    textColor: 'text-indigo-600',
    accentBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    squircleBg: 'bg-gradient-to-br from-indigo-50 to-purple-100 border-2 border-indigo-200',
    badgeClass: 'bg-indigo-600 text-white',
  };
}

export default function ResultScreenPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Screen mode: 'tv' for 100vh full cover broadcast, 'scroll' for extended list
  const [screenMode, setScreenMode] = useState<'tv' | 'scroll'>('tv');
  // Right card tab in TV mode: 'stars' or 'results'
  const [rightCardTab, setRightCardTab] = useState<'stars' | 'results'>('stars');
  // Broadcast header bar visibility toggle (TV Full Screen View)
  const [showHeader, setShowHeader] = useState<boolean>(true);

  // Filter states
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Star Performers Section Filter state ('all' | 'senior' | 'junior' | 'sub-junior')
  const [starPerformerSection, setStarPerformerSection] = useState<string>('all');

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

  // Scroll ref for the right card (Star Performers & Live Results Feed rows)
  const rightCardScrollRef = useRef<HTMLDivElement>(null);

  const scrollRightCard = (direction: 'up' | 'down') => {
    if (rightCardScrollRef.current) {
      const scrollAmount = 260; // smoothly scrolls ~2-3 cards
      rightCardScrollRef.current.scrollBy({
        top: direction === 'down' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

  const theme1 = getPodiumColorTheme(rank1?.team);
  const theme2 = getPodiumColorTheme(rank2?.team);
  const theme3 = getPodiumColorTheme(rank3?.team);

  // Compute individual star performers dynamically across all published results
  const individualStats = useMemo(() => {
    const candMap: Record<string, {
      candidate: Candidate;
      team: Team | { code: string; name: string; color: string };
      totalPoints: number;
      totalWins: number;
      medals: { gold: number; silver: number; bronze: number };
      rank: number;
      firstWins: number;
      secondWins: number;
      thirdWins: number;
      gradesCount: number;
      section: string;
    }> = {};

    candidates.forEach(c => {
      const chest = String(c.chestNumber || '').trim();
      if (!chest) return;
      const teamCode = (c.team || '').toUpperCase().trim();
      const teamObj = teams.find(t => (t.code || '').toUpperCase().trim() === teamCode);
      const teamTheme = getTeamTheme(teamCode, teams);

      candMap[chest] = {
        candidate: c,
        team: teamObj || { code: teamCode, name: teamTheme.name, color: teamTheme.color },
        totalPoints: 0,
        totalWins: 0,
        medals: { gold: 0, silver: 0, bronze: 0 },
        rank: 0,
        firstWins: 0,
        secondWins: 0,
        thirdWins: 0,
        gradesCount: 0,
        section: (c.section || '').toLowerCase().trim()
      };
    });

    const progMap = new Map<string, Programme>();
    programmes.forEach(p => {
      if (p._id) progMap.set(p._id.toString(), p);
      if (p.id) progMap.set(String(p.id), p);
      if (p.code) progMap.set(p.code.toUpperCase().trim(), p);
    });

    publishedResults.forEach(res => {
      // Only individual-type programmes count towards star performers
      if (res.positionType !== 'individual') return;

      let prog = res.programmeId ? progMap.get(res.programmeId) : undefined;
      if (!prog && res.programme) {
        const codeMatch = res.programme.match(/^([A-Za-z0-9_-]+)/);
        if (codeMatch) prog = progMap.get(codeMatch[1].toUpperCase().trim());
      }

      if (selectedCategory !== 'all') {
        const cat = (prog?.category || '').toLowerCase().trim();
        if (cat !== selectedCategory.toLowerCase().trim()) return;
      }

      const firstPoints = res.firstPoints ?? 10;
      const secondPoints = res.secondPoints ?? 8;
      const thirdPoints = res.thirdPoints ?? 5;

      (res.firstPlace || []).forEach(p => {
        const chest = String(p.chestNumber || '').trim();
        if (candMap[chest]) {
          candMap[chest].totalPoints += firstPoints;
          candMap[chest].medals.gold += 1;
          candMap[chest].firstWins += 1;
          candMap[chest].totalWins += 1;
        }
      });

      (res.secondPlace || []).forEach(p => {
        const chest = String(p.chestNumber || '').trim();
        if (candMap[chest]) {
          candMap[chest].totalPoints += secondPoints;
          candMap[chest].medals.silver += 1;
          candMap[chest].secondWins += 1;
          candMap[chest].totalWins += 1;
        }
      });

      (res.thirdPlace || []).forEach(p => {
        const chest = String(p.chestNumber || '').trim();
        if (candMap[chest]) {
          candMap[chest].totalPoints += thirdPoints;
          candMap[chest].medals.bronze += 1;
          candMap[chest].thirdWins += 1;
          candMap[chest].totalWins += 1;
        }
      });

      (res.participationGrades || []).forEach(pg => {
        const chest = String(pg.chestNumber || '').trim();
        if (candMap[chest]) {
          const pts = pg.points !== undefined && pg.points !== null
            ? pg.points
            : (getDefaultGradePoints(pg.grade) || res.participationPoints || 0);
          candMap[chest].totalPoints += pts;
          candMap[chest].gradesCount += 1;
        }
      });
    });

    return Object.values(candMap)
      .filter(item => item.totalPoints > 0)
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
        if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
        if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
        return b.medals.bronze - a.medals.bronze;
      });
  }, [publishedResults, candidates, teams, programmes, selectedCategory]);

  // Filter individual performers by selected section (and re-rank accordingly)
  const filteredStarPerformers = useMemo(() => {
    let list = individualStats;
    const sec = starPerformerSection.toLowerCase().trim();
    if (sec !== 'all') {
      list = list.filter(item => {
        const itemSec = (item.section || item.candidate.section || '').toLowerCase().trim();
        return itemSec === sec;
      });
    }
    return list.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [individualStats, starPerformerSection]);

  // Sync starPerformerSection when global selectedSection changes
  useEffect(() => {
    if (selectedSection && selectedSection !== 'all') {
      setStarPerformerSection(selectedSection);
    }
  }, [selectedSection]);

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
    <div className={`${screenMode === 'tv' ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'} bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100`}>

      {/* Floating Button to Restore Top Broadcast Header when Hidden */}
      {!showHeader && (
        <button
          onClick={() => setShowHeader(true)}
          title="Show Top Broadcast Header"
          className="fixed top-3 right-3 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-md shadow-2xl border border-white/20 transition-all cursor-pointer active:scale-95 hover:scale-105"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Show Header</span>
        </button>
      )}

      {/* ========================================================================= */}
      {/* TV SCREEN TOP BROADCAST HEADER & DISPLAY CONTROLS                          */}
      {/* ========================================================================= */}
      {showHeader && (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0">

          {/* Left: Branding & Live Ticker */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md text-lg shrink-0">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight text-slate-900 uppercase">
                  AYYUHANNAAS
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-emerald-500 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  TV SCREEN • LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden xl:block">
                Ayyuhannas Arts Fest 2026 • Live Championship Results & Standings Broadcast
              </p>
            </div>
          </div>

          {/* Center: Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Section Filter Pills */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
              {['all', 'senior', 'junior', 'sub-junior', 'general'].map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer text-xs ${selectedSection === sec
                    ? 'bg-white text-slate-900 font-black shadow-xs'
                    : 'hover:text-slate-900'
                    }`}
                >
                  {sec === 'all' ? 'All Sections' : sec}
                </button>
              ))}
            </div>

            {/* Category Filter Pills */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
              {['all', 'arts', 'sports'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer text-xs ${selectedCategory === cat
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
          <div className="flex items-center gap-1.5">
            {/* Screen Mode Toggle (100vh TV Cover vs Full Scroll) */}
            <button
              onClick={() => setScreenMode(prev => prev === 'tv' ? 'scroll' : 'tv')}
              title={screenMode === 'tv' ? 'Switch to Full Results Scroll View' : 'Switch to 100vh TV Full Screen Cover'}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${screenMode === 'tv'
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
            >
              <Tv className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">{screenMode === 'tv' ? '100vh TV Cover' : 'Scroll View'}</span>
            </button>

            {/* Clock */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTime}</span>
            </div>

            {/* Auto Refresh Toggle Button */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              title="Toggle Live Auto-Refresh"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-500/10'
                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                }`}
            >
              {autoRefresh ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Auto ({countdown}s)</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-400" />
                  <span>Paused</span>
                </>
              )}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchData(true)}
              title="Refresh now"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Hide Header Button */}
            <button
              onClick={() => setShowHeader(false)}
              title="Hide Header Bar (Fullscreen View)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Hide Bar</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-xs"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>
      )}

      {/* ========================================================================= */}
      {/* MAIN SCREEN CONTENT                                                       */}
      {/* ========================================================================= */}
      <main className={`flex-1 ${screenMode === 'tv' ? 'min-h-0 overflow-hidden' : ''} max-w-[1850px] w-full mx-auto p-2 sm:p-3 md:p-4 flex flex-col ${screenMode === 'tv' ? '' : 'space-y-8'}`}>

        {/* ======================================================================= */}
        {/* TOP SECTION: LEADERBOARD PODIUM (LEFT) + STAR PERFORMERS (RIGHT)        */}
        {/* ======================================================================= */}
        <div className={`grid ${screenMode === 'tv' ? 'grid-cols-12' : 'grid-cols-1 xl:grid-cols-12'} gap-3 sm:gap-4 md:gap-5 ${screenMode === 'tv' ? 'flex-1 min-h-0' : ''} items-stretch`}>

          {/* ===================================================================== */}
          {/* LEFT: 3D ISOMETRIC PODIUM LEADERBOARD (col-span-7 on TV)              */}
          {/* ===================================================================== */}
          <section className={`${screenMode === 'tv' ? 'col-span-7' : 'col-span-12 xl:col-span-7'} flex flex-col justify-between relative bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden h-full`}>
            {/* Subtle Warm Sunburst Spotlight Radial Gradient Background */}
            <div
              className="absolute inset-x-0 top-0 h-96 pointer-events-none opacity-80"
              style={{
                background: 'radial-gradient(ellipse 70% 60% at 50% 10%, rgba(254, 240, 138, 0.45) 0%, rgba(254, 215, 170, 0.25) 45%, rgba(255, 255, 255, 0) 80%)'
              }}
            />

            {/* Leaderboard Card Header */}
            <div className="relative pt-2 sm:pt-2.5 pb-1.5 px-3 sm:px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="text-lg sm:text-xl md:text-2xl">🏆</span>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight">
                      Team Leaderboard
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Standings
                    </span>
                  </div>
                  {screenMode !== 'tv' && (
                    <p className="text-xs text-slate-500 mt-0.5 hidden xs:block">
                      Real-time championship standings calculated dynamically across published results
                    </p>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                <Tv className="w-3.5 h-3.5 text-slate-400" />
                <span>Screening</span>
              </div>
            </div>

            {/* 3D Isometric / Perspective Podium (Using Team Colors!) */}
            <div className="relative flex-1 min-h-0 flex flex-col justify-between pt-1 pb-1.5 px-2 sm:px-4 md:px-5">
              <div className="flex justify-center items-end gap-2 sm:gap-3 md:gap-4 pb-1 w-full flex-1 min-h-0">

                {/* ============================================================ */}
                {/* RANK 2: LEFT PODIUM (Team Color!)                            */}
                {/* ============================================================ */}
                <div className="flex-1 max-w-[160px] sm:max-w-[180px] flex flex-col items-center">
                  {rank2 ? (
                    <div className="flex flex-col items-center mb-0.5 text-center transition-transform hover:-translate-y-1">
                      <div className="relative">
                        {/* Squircle Card Icon */}
                        <div className={`${screenMode === 'tv' ? 'w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-lg' : 'w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl'} rounded-2xl ${theme2.squircleBg} shadow-sm flex items-center justify-center`}>
                          🥈
                        </div>
                        <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm mt-0.5 truncate max-w-[120px]">
                        {rank2.team.name}
                      </h3>
                      <div className={`flex items-center gap-0.5 ${theme2.textColor} font-black text-xs sm:text-sm mt-0.5`}>
                        <span className="text-[11px]">💎</span>
                        <span>{rank2.totalPoints.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-slate-600 font-medium bg-slate-100/90 px-1.5 py-0.2 rounded-full">
                        <span>🥇{rank2.medals.gold}</span>
                        <span>🥈{rank2.medals.silver}</span>
                        <span>🥉{rank2.medals.bronze}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-xs text-slate-400">No Team</div>
                  )}

                  {/* 3D Isometric Podium Block: Rank 2 (Team Color!) */}
                  <div className="w-full flex flex-col items-center">
                    <div
                      className={`w-full ${screenMode === 'tv' ? 'h-3 sm:h-3.5' : 'h-5 sm:h-6'} ${theme2.topBg} border-t border-x ${theme2.borderTop} shadow-xs`}
                      style={{ clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)' }}
                    />
                    <div className={`w-full ${screenMode === 'tv' ? 'h-15 sm:h-18 md:h-20' : 'h-36 sm:h-44 md:h-48'} ${theme2.frontBg} rounded-b-2xl shadow-xl border-b border-x ${theme2.borderFront} flex flex-col items-center justify-center p-1.5 relative overflow-hidden`}>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                      <ScreenLaurelWreath rank={2} />
                      <span className="text-[9px] sm:text-[10px] font-bold text-white/95 mt-0.5 tracking-wider uppercase drop-shadow-xs">
                        Runner Up
                      </span>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* RANK 1: CENTER PODIUM (Team Color!) - TALL & LEADING         */}
                {/* ============================================================ */}
                <div className="flex-1 max-w-[170px] sm:max-w-[200px] flex flex-col items-center z-10">
                  {rank1 ? (
                    <div className="flex flex-col items-center mb-0.5 text-center transition-transform hover:-translate-y-1">
                      <div className="relative">
                        {/* Crown on top */}
                        <div className="absolute -top-3 inset-x-0 flex justify-center text-xs sm:text-sm animate-bounce">
                          👑
                        </div>
                        {/* Squircle Card Icon */}
                        <div className={`${screenMode === 'tv' ? 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl' : 'w-16 h-16 sm:w-20 sm:h-20 text-3xl sm:text-4xl'} rounded-2xl ${theme1.squircleBg} shadow-md flex items-center justify-center ring-2 ring-amber-400/30`}>
                          🥇
                        </div>
                        <span className="absolute -top-1 -right-1 text-xs sm:text-sm">✨</span>
                      </div>
                      <h3 className="font-black text-slate-900 text-xs sm:text-sm md:text-base mt-0.5 tracking-tight truncate max-w-[135px]">
                        {rank1.team.name}
                      </h3>
                      <div className={`flex items-center gap-0.5 ${theme1.textColor} font-black text-xs sm:text-sm mt-0.5`}>
                        <span className="text-xs">💎</span>
                        <span>{rank1.totalPoints.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5 text-[9px] sm:text-[10px] text-slate-800 font-bold bg-white/95 border border-slate-200/80 px-2 py-0.2 rounded-full shadow-xs">
                        <span>🥇 {rank1.medals.gold}</span>
                        <span>🥈 {rank1.medals.silver}</span>
                        <span>🥉 {rank1.medals.bronze}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center text-xs text-slate-400">No Team</div>
                  )}

                  {/* 3D Isometric Podium Block: Rank 1 (Team Color!) */}
                  <div className="w-full flex flex-col items-center">
                    <div
                      className={`w-full ${screenMode === 'tv' ? 'h-4 sm:h-4.5' : 'h-6 sm:h-7'} ${theme1.topBg} border-t border-x ${theme1.borderTop} shadow-xs`}
                      style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }}
                    />
                    <div className={`w-full ${screenMode === 'tv' ? 'h-22 sm:h-26 md:h-30' : 'h-48 sm:h-56 md:h-60'} ${theme1.frontBg} rounded-b-2xl shadow-2xl border-b-2 border-x ${theme1.borderFront} flex flex-col items-center justify-center p-1.5 relative overflow-hidden`}>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                      <ScreenLaurelWreath rank={1} />
                      <span className="text-[10px] sm:text-[11px] font-black text-slate-900 bg-white/95 px-2 py-0.2 rounded-full mt-1 tracking-wider uppercase shadow-md border border-white/60">
                        Champion
                      </span>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* RANK 3: RIGHT PODIUM (Team Color!)                           */}
                {/* ============================================================ */}
                <div className="flex-1 max-w-[160px] sm:max-w-[180px] flex flex-col items-center">
                  {rank3 ? (
                    <div className="flex flex-col items-center mb-0.5 text-center transition-transform hover:-translate-y-1">
                      <div className="relative">
                        {/* Squircle Card Icon */}
                        <div className={`${screenMode === 'tv' ? 'w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-lg' : 'w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl'} rounded-2xl ${theme3.squircleBg} shadow-sm flex items-center justify-center`}>
                          🥉
                        </div>
                        <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm mt-0.5 truncate max-w-[120px]">
                        {rank3.team.name}
                      </h3>
                      <div className={`flex items-center gap-0.5 ${theme3.textColor} font-black text-xs sm:text-sm mt-0.5`}>
                        <span className="text-[11px]">💎</span>
                        <span>{rank3.totalPoints.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-slate-600 font-medium bg-slate-100/90 px-1.5 py-0.2 rounded-full">
                        <span>🥇{rank3.medals.gold}</span>
                        <span>🥈{rank3.medals.silver}</span>
                        <span>🥉{rank3.medals.bronze}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-xs text-slate-400">No Team</div>
                  )}

                  {/* 3D Isometric Podium Block: Rank 3 (Team Color!) */}
                  <div className="w-full flex flex-col items-center">
                    <div
                      className={`w-full ${screenMode === 'tv' ? 'h-3 sm:h-3.5' : 'h-4 sm:h-5'} ${theme3.topBg} border-t border-x ${theme3.borderTop} shadow-xs`}
                      style={{ clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)' }}
                    />
                    <div className={`w-full ${screenMode === 'tv' ? 'h-12 sm:h-14 md:h-16' : 'h-28 sm:h-36 md:h-40'} ${theme3.frontBg} rounded-b-2xl shadow-lg border-b border-x ${theme3.borderFront} flex flex-col items-center justify-center p-1.5 relative overflow-hidden`}>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                      <ScreenLaurelWreath rank={3} />
                      <span className="text-[9px] sm:text-[10px] font-bold text-white/95 mt-0.5 tracking-wider uppercase drop-shadow-xs">
                        3rd Place
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Subtitle status bar & dots */}
              <div className="mt-0.5 pt-1 border-t border-slate-100 flex flex-col items-center justify-center gap-0.5 shrink-0">
                <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] text-slate-500">
                  <RotateCw className="w-3 h-3 text-slate-400" />
                  <span>Leaderboard updated {getRelativeTime(lastRefreshedAt)}</span>
                  <span>•</span>
                  <span>{publishedResults.length} published results counted</span>
                </div>

                {/* Carousel dots */}
                <div className="flex justify-center items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* RIGHT: STAR PERFORMERS & LIVE BROADCAST FEED (col-span-5 on TV)        */}
          {/* ===================================================================== */}
          <section className={`${screenMode === 'tv' ? 'col-span-5' : 'col-span-12 xl:col-span-5'} flex flex-col justify-between relative bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden h-full`}>
            {/* Subtle Star Purple-Amber Radial Gradient Background */}
            <div
              className="absolute inset-x-0 top-0 h-64 pointer-events-none opacity-60"
              style={{
                background: 'radial-gradient(ellipse 70% 60% at 50% 10%, rgba(245, 158, 11, 0.20) 0%, rgba(168, 85, 247, 0.12) 50%, rgba(255, 255, 255, 0) 80%)'
              }}
            />

            {/* Right Card Header with Tab Switcher */}
            <div className="relative pt-3 sm:pt-4 pb-2.5 px-3 sm:px-5 border-b border-slate-100 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                {/* Switcher: Star Performers vs Live Results Feed */}
                <div className="inline-flex p-0.5 sm:p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-200/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRightCardTab('stars')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs shrink-0 ${rightCardTab === 'stars'
                      ? 'bg-white text-slate-900 font-black shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    <span>⭐</span>
                    <span className="whitespace-nowrap">Star Performers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightCardTab('results')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs shrink-0 ${rightCardTab === 'results'
                      ? 'bg-white text-slate-900 font-black shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    <span>📢</span>
                    <span className="whitespace-nowrap">Live Results Feed</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-400 shrink-0 whitespace-nowrap">
                    {rightCardTab === 'stars' ? `${filteredStarPerformers.length} Ranked` : `${filteredResultsList.length} Results`}
                  </span>

                  {/* Header Chevron Controls to scroll rows */}
                  <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 shrink-0 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => scrollRightCard('up')}
                      title="Scroll Up rows"
                      className="p-1 rounded-md bg-white hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRightCard('down')}
                      title="Scroll Down rows"
                      className="p-1 rounded-md bg-white hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Tabs: All, Senior, Junior, Sub-Junior (Shown for Star Performers) */}
              {rightCardTab === 'stars' && (
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Filter Section:
                  </span>
                  <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-bold text-slate-600 border border-slate-200/60">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'senior', label: 'Senior' },
                      { key: 'junior', label: 'Junior' },
                      { key: 'sub-junior', label: 'Sub-Jr' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStarPerformerSection(tab.key)}
                        className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer text-xs ${starPerformerSection === tab.key
                          ? 'bg-white text-slate-900 font-black shadow-xs'
                          : 'hover:text-slate-900 text-slate-500'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Body: Either Star Performers OR Live Results Feed */}
            <div className="relative flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Container for Rows */}
              <div
                ref={rightCardScrollRef}
                className="h-full p-3 sm:p-4 overflow-y-auto space-y-2.5 scroll-smooth"
              >
                {rightCardTab === 'stars' ? (
                  // TAB 1: STAR PERFORMERS LIST
                  filteredStarPerformers.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <span className="text-4xl mb-2">⭐</span>
                      <p className="font-bold text-sm text-slate-600">No Star Performers Found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        No points recorded yet for {starPerformerSection === 'all' ? 'any candidate' : `${starPerformerSection} section`}
                      </p>
                    </div>
                  ) : (
                    filteredStarPerformers.slice(0, 50).map((performer) => {
                    const isFirst = performer.rank === 1;
                    const isSecond = performer.rank === 2;
                    const isThird = performer.rank === 3;

                    return (
                      <div
                        key={performer.candidate.chestNumber}
                        className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${isFirst
                          ? 'bg-gradient-to-r from-amber-50/90 via-yellow-50/60 to-white border-amber-300 shadow-sm ring-1 ring-amber-400/20'
                          : isSecond
                            ? 'bg-gradient-to-r from-slate-50 via-blue-50/40 to-white border-slate-300 shadow-xs'
                            : isThird
                              ? 'bg-gradient-to-r from-orange-50/60 to-white border-orange-200 shadow-xs'
                              : 'bg-white hover:bg-slate-50/80 border-slate-200/80 shadow-xs'
                          }`}
                      >
                        {/* Left: Rank Badge + Avatar + Candidate Info */}
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          {/* Rank Badge */}
                          <div className="shrink-0 flex items-center justify-center">
                            {isFirst ? (
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs">
                                🥇
                              </div>
                            ) : isSecond ? (
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 font-black text-sm flex items-center justify-center shadow-xs">
                                🥈
                              </div>
                            ) : isThird ? (
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-200 to-amber-200 text-orange-900 font-black text-sm flex items-center justify-center shadow-xs">
                                🥉
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center border border-slate-200">
                                #{performer.rank}
                              </div>
                            )}
                          </div>

                          {/* Candidate Avatar or Chest Initial */}
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {performer.candidate.profileImage ? (
                              <img
                                src={performer.candidate.profileImage}
                                alt={performer.candidate.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center font-bold text-white text-xs"
                                style={{ backgroundColor: performer.team.color || '#6366F1' }}
                              >
                                {performer.candidate.chestNumber}
                              </div>
                            )}
                          </div>

                          {/* Name & Metadata */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-slate-900 text-sm truncate">
                                {performer.candidate.name}
                              </h4>
                              {isFirst && <span className="text-xs">👑</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium">
                              <span className="font-mono font-bold text-slate-700">#{performer.candidate.chestNumber}</span>
                              <span>•</span>
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white"
                                style={{ backgroundColor: performer.team.color || '#64748B' }}
                              >
                                {performer.team.name || performer.team.code}
                              </span>
                              {performer.section && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                    {performer.section}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Points & Medals */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-1 font-black text-sm sm:text-base text-slate-900">
                            <span className="text-xs text-amber-500">💎</span>
                            <span>{performer.totalPoints}</span>
                            <span className="text-xs font-semibold text-slate-500">pts</span>
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5 text-[11px] font-semibold text-slate-600">
                            {performer.medals.gold > 0 && (
                              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md">🥇{performer.medals.gold}</span>
                            )}
                            {performer.medals.silver > 0 && (
                              <span className="bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded-md">🥈{performer.medals.silver}</span>
                            )}
                            {performer.medals.bronze > 0 && (
                              <span className="bg-orange-100 text-orange-900 px-1.5 py-0.2 rounded-md">🥉{performer.medals.bronze}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                // TAB 2: LIVE RESULTS FEED
                filteredResultsList.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <span className="text-4xl mb-2">📢</span>
                    <p className="font-bold text-sm text-slate-600">No Results Found</p>
                    <p className="text-xs text-slate-400 mt-1">Try switching sections or check back later</p>
                  </div>
                ) : (
                  filteredResultsList.slice(0, 50).map((res) => {
                    const progDoc = programmes.find(p => p._id?.toString() === res.programmeId || (res.programme && p.name && res.programme.includes(p.name)));
                    const sectionBadge = getSectionTheme(res.section || progDoc?.section);

                    return (
                      <div
                        key={res._id?.toString()}
                        className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {progDoc?.code && (
                              <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                                {progDoc.code}
                              </span>
                            )}
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {res.programme || progDoc?.name || 'Programme'}
                            </h4>
                          </div>
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border shrink-0 ${sectionBadge.badgeBg}`}>
                            {sectionBadge.label}
                          </span>
                        </div>

                        {/* Top 3 summary row */}
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          {/* 1st */}
                          <div className="bg-white p-1.5 rounded-xl border border-amber-200 shadow-2xs">
                            <span className="text-[10px] font-extrabold text-amber-700 flex items-center gap-0.5">
                              🥇 1st
                            </span>
                            <div className="text-slate-800 font-bold truncate mt-0.5">
                              {res.firstPlace && res.firstPlace.length > 0 ? (
                                <>#{res.firstPlace[0].chestNumber}</>
                              ) : res.firstPlaceTeams && res.firstPlaceTeams.length > 0 ? (
                                <>{res.firstPlaceTeams[0].teamCode}</>
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>

                          {/* 2nd */}
                          <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[10px] font-extrabold text-slate-600 flex items-center gap-0.5">
                              🥈 2nd
                            </span>
                            <div className="text-slate-800 font-bold truncate mt-0.5">
                              {res.secondPlace && res.secondPlace.length > 0 ? (
                                <>#{res.secondPlace[0].chestNumber}</>
                              ) : res.secondPlaceTeams && res.secondPlaceTeams.length > 0 ? (
                                <>{res.secondPlaceTeams[0].teamCode}</>
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>

                          {/* 3rd */}
                          <div className="bg-white p-1.5 rounded-xl border border-orange-200 shadow-2xs">
                            <span className="text-[10px] font-extrabold text-orange-700 flex items-center gap-0.5">
                              🥉 3rd
                            </span>
                            <div className="text-slate-800 font-bold truncate mt-0.5">
                              {res.thirdPlace && res.thirdPlace.length > 0 ? (
                                <>#{res.thirdPlace[0].chestNumber}</>
                              ) : res.thirdPlaceTeams && res.thirdPlaceTeams.length > 0 ? (
                                <>{res.thirdPlaceTeams[0].teamCode}</>
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
              </div>

              {/* Floating Quick Scroll Chevron Buttons (Top & Bottom) for Rows */}
              <div className="absolute right-3.5 bottom-3.5 z-10 flex flex-col gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => scrollRightCard('up')}
                  title="Scroll Up rows"
                  className="w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/20 hover:scale-105 active:scale-95"
                >
                  <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRightCard('down')}
                  title="Scroll Down rows"
                  className="w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/20 hover:scale-105 active:scale-95"
                >
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Bottom mini footer for right card */}
            <div className="p-2 sm:p-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium px-3 sm:px-4 shrink-0">
              <span>{rightCardTab === 'stars' ? <>Section: <strong className="capitalize">{starPerformerSection === 'all' ? 'All Sections' : starPerformerSection}</strong></> : <>Showing <strong>latest published results</strong></>}</span>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Scroll Rows:</span>
                <div className="inline-flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => scrollRightCard('up')}
                    title="Scroll Up rows"
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer active:scale-95 flex items-center gap-0.5 text-[11px] font-bold px-1.5"
                  >
                    <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="hidden md:inline">Up</span>
                  </button>
                  <div className="w-px h-3.5 bg-slate-200"></div>
                  <button
                    type="button"
                    onClick={() => scrollRightCard('down')}
                    title="Scroll Down rows"
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer active:scale-95 flex items-center gap-0.5 text-[11px] font-bold px-1.5"
                  >
                    <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="hidden md:inline">Down</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* ======================================================================= */}
        {/* BOTTOM SECTION: FULL RESULTS LIST (SHOWN IN SCROLL VIEW MODE)           */}
        {/* ======================================================================= */}
        {screenMode === 'scroll' && (
        <section className="space-y-4 pt-4">
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
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${isSports ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
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
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isExpanded
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
        )}
      </main>

      {/* Footer - only in scroll mode */}
      {screenMode === 'scroll' && (
        <footer className="mt-12 py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Ayyuhannas Arts Fest 2026 • Official Result Screening System</p>
          <p className="mt-1 text-slate-400">Live Auto-Updating Display for Auditorium & TV Screens</p>
        </footer>
      )}
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
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <span className="text-[10px] sm:text-xs text-white/90">★</span>
        <span className="text-xs sm:text-sm font-bold text-white">★</span>
        <span className="text-[10px] sm:text-xs text-white/90">★</span>
      </div>

      {/* Number with Laurel Wreath SVG */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 120 90"
          className="w-12 h-10 sm:w-15 sm:h-12 md:w-18 md:h-14 text-white fill-current drop-shadow-md"
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
        <span className="absolute font-black text-xl sm:text-2xl md:text-3xl tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
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
