'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Search,
  CheckCircle2,
  Clock,
  Filter,
  CheckSquare,
  Square,
  Zap,
  TrendingUp,
  Layers,
  HelpCircle,
  Eye,
  Sliders,
  Send,
  Loader2
} from 'lucide-react';

interface AdminDraftSimulatorProps {
  results: Result[];
  programmes: Programme[];
  candidates: Candidate[];
  teams: Team[];
  participants: ProgrammeParticipant[];
  onRefresh?: () => void;
  onEditResult?: (result: Result) => void;
}

export interface SimulatedTeamStanding {
  team: Team;
  rank: number;
  basePublishedPoints: number;
  addedDraftPoints: number;
  totalPoints: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  draftMedals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  totalWins: number;
}

export interface PodiumColorTheme {
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

export function getPodiumColorTheme(team?: Team): PodiumColorTheme {
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

  // Generic custom hex color fallback (Purple / Indigo)
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

export function AdminDraftSimulator({
  results,
  programmes,
  candidates,
  teams,
  participants,
  onRefresh,
  onEditResult
}: AdminDraftSimulatorProps) {
  // ---------------------------------------------------------------------------
  // 1. STATE & LOCALSTORAGE PERSISTENCE
  // ---------------------------------------------------------------------------
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [includePublished, setIncludePublished] = useState<boolean>(true);
  const [includeDrafts, setIncludeDrafts] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<'arts' | 'sports'>('arts');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [draftSearchQuery, setDraftSearchQuery] = useState<string>('');
  const [bottomSearchQuery, setBottomSearchQuery] = useState<string>('');
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [bottomViewMode, setBottomViewMode] = useState<'selected_drafts' | 'all_active'>('selected_drafts');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load selection & options from localStorage on initial mount
  useEffect(() => {
    try {
      const savedSelected = localStorage.getItem('admin_draft_sim_selected_ids');
      if (savedSelected) {
        setSelectedDraftIds(JSON.parse(savedSelected));
      }
      const savedPub = localStorage.getItem('admin_draft_sim_include_pub');
      if (savedPub !== null) {
        setIncludePublished(JSON.parse(savedPub));
      }
      const savedDrafts = localStorage.getItem('admin_draft_sim_include_drafts');
      if (savedDrafts !== null) {
        setIncludeDrafts(JSON.parse(savedDrafts));
      }
      const savedCategory = localStorage.getItem('admin_draft_sim_category');
      if (savedCategory === 'arts' || savedCategory === 'sports') {
        setSelectedCategory(savedCategory);
      }
      const savedTeamFilter = localStorage.getItem('admin_draft_sim_team_filter');
      if (savedTeamFilter) {
        setSelectedTeamFilter(savedTeamFilter);
      }
    } catch (e) {
      console.warn('Failed to load draft simulator states from localStorage', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save selected draft IDs to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('admin_draft_sim_selected_ids', JSON.stringify(selectedDraftIds));
    } catch (e) {
      console.warn('Failed to save selected draft IDs', e);
    }
  }, [selectedDraftIds, isInitialized]);

  // Save toggle modes & category to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('admin_draft_sim_include_pub', JSON.stringify(includePublished));
      localStorage.setItem('admin_draft_sim_include_drafts', JSON.stringify(includeDrafts));
      localStorage.setItem('admin_draft_sim_category', selectedCategory);
      localStorage.setItem('admin_draft_sim_team_filter', selectedTeamFilter);
    } catch (e) {
      console.warn('Failed to save simulator options', e);
    }
  }, [includePublished, includeDrafts, selectedCategory, selectedTeamFilter, isInitialized]);

  // ---------------------------------------------------------------------------
  // 2. DATA MAPS & CANDIDATE / PROGRAMME LOOKUPS
  // ---------------------------------------------------------------------------
  const candMap = useMemo(() => {
    const map = new Map<string, Candidate>();
    candidates.forEach(c => {
      if (c.chestNumber) map.set(String(c.chestNumber).trim(), c);
    });
    return map;
  }, [candidates]);

  const progMap = useMemo(() => {
    const map = new Map<string, Programme>();
    programmes.forEach(p => {
      if (p._id) map.set(p._id.toString(), p);
      if (p.id) map.set(String(p.id), p);
      if (p.code) map.set(p.code.toUpperCase().trim(), p);
    });
    return map;
  }, [programmes]);

  // Split results into published and drafts
  const publishedResults = useMemo(() => {
    return results.filter(r => r.status === 'published' || !r.status);
  }, [results]);

  const draftResults = useMemo(() => {
    return results.filter(r => r.status === 'draft');
  }, [results]);

  // Helper: determine whether result belongs to arts or sports
  const getResultCategory = (res: Result): 'arts' | 'sports' => {
    let prog = res.programmeId ? progMap.get(res.programmeId) : undefined;
    if (!prog && res.programme) {
      const codeMatch = res.programme.match(/^([A-Za-z0-9_-]+)/);
      if (codeMatch) prog = progMap.get(codeMatch[1].toUpperCase().trim());
    }
    const rawCat = (prog?.category || (res as any).category || '').toLowerCase().trim();
    if (rawCat === 'sports') return 'sports';
    if (rawCat === 'arts') return 'arts';
    return classifyProgramme(prog, prog?.code, res.programme).category || 'arts';
  };

  // Category-filtered collections (Arts vs Sports)
  const publishedResultsForCategory = useMemo(() => {
    return publishedResults.filter(r => getResultCategory(r) === selectedCategory);
  }, [publishedResults, selectedCategory, progMap]);

  const draftResultsForCategory = useMemo(() => {
    return draftResults.filter(r => getResultCategory(r) === selectedCategory);
  }, [draftResults, selectedCategory, progMap]);

  const selectedCategoryDraftIdsCount = useMemo(() => {
    const set = new Set(selectedDraftIds);
    return draftResultsForCategory.filter(r => set.has(r._id?.toString() || '')).length;
  }, [selectedDraftIds, draftResultsForCategory]);

  // ---------------------------------------------------------------------------
  // 3. HELPER: CALCULATE RESULT POINTS BREAKDOWN BY TEAM
  // ---------------------------------------------------------------------------
  const getResultTeamBreakdown = (res: Result) => {
    const breakdown: Record<string, { points: number; gold: number; silver: number; bronze: number; grades: number }> = {};

    const addPts = (teamCode: string, pts: number, medal?: 'gold' | 'silver' | 'bronze') => {
      const clean = (teamCode || '').toUpperCase().trim();
      if (!clean) return;
      if (!breakdown[clean]) {
        breakdown[clean] = { points: 0, gold: 0, silver: 0, bronze: 0, grades: 0 };
      }
      breakdown[clean].points += pts;
      if (medal === 'gold') breakdown[clean].gold += 1;
      if (medal === 'silver') breakdown[clean].silver += 1;
      if (medal === 'bronze') breakdown[clean].bronze += 1;
    };

    const isIndividual = res.positionType === 'individual';
    const isTeamBased = res.positionType === 'group' || res.positionType === 'general';

    if (isIndividual) {
      // 1st place
      (res.firstPlace || []).forEach(item => {
        const cand = candMap.get(String(item.chestNumber || '').trim());
        if (cand?.team) addPts(cand.team, res.firstPoints ?? 10, 'gold');
      });
      // 2nd place
      (res.secondPlace || []).forEach(item => {
        const cand = candMap.get(String(item.chestNumber || '').trim());
        if (cand?.team) addPts(cand.team, res.secondPoints ?? 8, 'silver');
      });
      // 3rd place
      (res.thirdPlace || []).forEach(item => {
        const cand = candMap.get(String(item.chestNumber || '').trim());
        if (cand?.team) addPts(cand.team, res.thirdPoints ?? 5, 'bronze');
      });
      // Grades
      (res.participationGrades || []).forEach(pg => {
        const cand = candMap.get(String(pg.chestNumber || '').trim());
        if (cand?.team) {
          const pts = pg.points !== undefined && pg.points !== null ? pg.points : (getDefaultGradePoints(pg.grade) || res.participationPoints || 0);
          addPts(cand.team, pts);
          if (breakdown[cand.team.toUpperCase().trim()]) {
            breakdown[cand.team.toUpperCase().trim()].grades += 1;
          }
        }
      });
    }

    if (isTeamBased) {
      // 1st place teams
      (res.firstPlaceTeams || []).forEach(item => {
        if (item.teamCode) addPts(item.teamCode, res.firstPoints ?? 10, 'gold');
      });
      // 2nd place teams
      (res.secondPlaceTeams || []).forEach(item => {
        if (item.teamCode) addPts(item.teamCode, res.secondPoints ?? 8, 'silver');
      });
      // 3rd place teams
      (res.thirdPlaceTeams || []).forEach(item => {
        if (item.teamCode) addPts(item.teamCode, res.thirdPoints ?? 5, 'bronze');
      });
      // Team grades
      (res.participationTeamGrades || []).forEach(ptg => {
        if (ptg.teamCode) {
          const pts = ptg.points !== undefined && ptg.points !== null ? ptg.points : (getDefaultGradePoints(ptg.grade) || 0);
          addPts(ptg.teamCode, pts);
          if (breakdown[ptg.teamCode.toUpperCase().trim()]) {
            breakdown[ptg.teamCode.toUpperCase().trim()].grades += 1;
          }
        }
      });
    }

    return breakdown;
  };

  // Check if a result has any prizes or grades for a given team
  const resultHasTeamParticipation = (res: Result, teamCode: string) => {
    if (teamCode === 'all') return true;
    const clean = teamCode.toUpperCase().trim();
    const breakdown = getResultTeamBreakdown(res);
    const teamData = breakdown[clean];
    if (!teamData) return false;
    return teamData.points > 0 || teamData.gold > 0 || teamData.silver > 0 || teamData.bronze > 0 || teamData.grades > 0;
  };

  // ---------------------------------------------------------------------------
  // 4. FILTERED DRAFT RESULTS FOR RIGHT COLUMN
  // ---------------------------------------------------------------------------
  const filteredDraftResults = useMemo(() => {
    return draftResultsForCategory.filter(res => {
      // 1. Team filter: must have 1+ prize or grade for selected team
      if (selectedTeamFilter !== 'all') {
        if (!resultHasTeamParticipation(res, selectedTeamFilter)) return false;
      }

      // 2. Search query filter
      if (draftSearchQuery.trim()) {
        const term = draftSearchQuery.toLowerCase().trim();
        const prog = res.programmeId ? progMap.get(res.programmeId) : undefined;
        const nameMatch = (res.programme || prog?.name || '').toLowerCase().includes(term);
        const codeMatch = (prog?.code || '').toLowerCase().includes(term);
        const secMatch = (res.section || prog?.section || '').toLowerCase().includes(term);
        if (!nameMatch && !codeMatch && !secMatch) return false;
      }

      return true;
    });
  }, [draftResultsForCategory, selectedTeamFilter, draftSearchQuery, progMap, candMap]);

  // Quick stats: How many draft results belong to each team within selectedCategory
  const teamDraftCounts = useMemo(() => {
    const counts: Record<string, number> = { all: draftResultsForCategory.length };
    ['ADL', 'SHJ', 'QIY'].forEach(code => {
      counts[code] = draftResultsForCategory.filter(r => resultHasTeamParticipation(r, code)).length;
    });
    teams.forEach(t => {
      const code = (t.code || '').toUpperCase().trim();
      if (code && counts[code] === undefined) {
        counts[code] = draftResultsForCategory.filter(r => resultHasTeamParticipation(r, code)).length;
      }
    });
    return counts;
  }, [draftResultsForCategory, teams, candMap]);

  // ---------------------------------------------------------------------------
  // 5. SELECTION TOGGLES
  // ---------------------------------------------------------------------------
  const toggleSelectDraft = (id: string) => {
    setSelectedDraftIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredDraftResults.map(r => r._id?.toString() || '').filter(Boolean);
    setSelectedDraftIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleDeselectFiltered = () => {
    const idsToRemove = new Set(filteredDraftResults.map(r => r._id?.toString() || '').filter(Boolean));
    setSelectedDraftIds(prev => prev.filter(id => !idsToRemove.has(id)));
  };

  const handleClearAllSelections = () => {
    setSelectedDraftIds([]);
  };

  const handlePublishSelectedDrafts = async () => {
    if (selectedDraftIds.length === 0) {
      alert('Please select at least one draft result to publish.');
      return;
    }

    const count = selectedDraftIds.length;
    const confirmMessage = `Are you sure you want to publish ALL ${count} selected draft result(s)?\n\nThey will immediately become live and publicly visible on the festival leaderboard and public result pages.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsPublishing(true);
      const res = await fetch('/api/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedDraftIds, status: 'published' })
      });

      if (res.ok) {
        setSelectedDraftIds([]);
        try {
          localStorage.removeItem('admin_draft_sim_selected_ids');
        } catch (e) {
          console.warn('Failed to clear selected drafts from storage', e);
        }
        if (onRefresh) {
          await onRefresh();
        }
        alert(`🎉 Successfully published ${count} draft result(s)! They are now live.`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to publish draft results: ${errorData.error || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error publishing selected drafts:', error);
      alert('Network or server error while publishing selected draft results.');
    } finally {
      setIsPublishing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. DYNAMIC STANDINGS CALCULATION (PUBLISHED + SELECTED DRAFTS)
  // ---------------------------------------------------------------------------
  const teamStandings: SimulatedTeamStanding[] = useMemo(() => {
    const map: Record<string, SimulatedTeamStanding> = {};

    // Initialize all known teams
    teams.forEach(t => {
      const code = (t.code || '').toUpperCase().trim();
      if (!code) return;
      map[code] = {
        team: t,
        rank: 0,
        basePublishedPoints: 0,
        addedDraftPoints: 0,
        totalPoints: 0,
        medals: { gold: 0, silver: 0, bronze: 0 },
        draftMedals: { gold: 0, silver: 0, bronze: 0 },
        totalWins: 0
      };
    });

    // Ensure standard 3 teams exist
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
          basePublishedPoints: 0,
          addedDraftPoints: 0,
          totalPoints: 0,
          medals: { gold: 0, silver: 0, bronze: 0 },
          draftMedals: { gold: 0, silver: 0, bronze: 0 },
          totalWins: 0
        };
      }
    });

    // A. Add published results for selectedCategory (if includePublished is true)
    if (includePublished) {
      publishedResultsForCategory.forEach(res => {
        const breakdown = getResultTeamBreakdown(res);
        Object.entries(breakdown).forEach(([tCode, data]) => {
          if (map[tCode]) {
            map[tCode].basePublishedPoints += data.points;
            map[tCode].medals.gold += data.gold;
            map[tCode].medals.silver += data.silver;
            map[tCode].medals.bronze += data.bronze;
            map[tCode].totalWins += (data.gold + data.silver + data.bronze);
          }
        });
      });
    }

    // B. Add selected draft results for selectedCategory (if includeDrafts is true)
    if (includeDrafts && selectedDraftIds.length > 0) {
      const selectedSet = new Set(selectedDraftIds);
      draftResultsForCategory.forEach(res => {
        const resId = res._id?.toString() || '';
        if (selectedSet.has(resId)) {
          const breakdown = getResultTeamBreakdown(res);
          Object.entries(breakdown).forEach(([tCode, data]) => {
            if (map[tCode]) {
              map[tCode].addedDraftPoints += data.points;
              map[tCode].draftMedals.gold += data.gold;
              map[tCode].draftMedals.silver += data.silver;
              map[tCode].draftMedals.bronze += data.bronze;
              map[tCode].medals.gold += data.gold;
              map[tCode].medals.silver += data.silver;
              map[tCode].medals.bronze += data.bronze;
              map[tCode].totalWins += (data.gold + data.silver + data.bronze);
            }
          });
        }
      });
    }

    // C. Calculate final total points and sort
    const list = Object.values(map).map(item => ({
      ...item,
      totalPoints: item.basePublishedPoints + item.addedDraftPoints
    }));

    list.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.medals.gold !== a.medals.gold) return b.medals.gold - a.medals.gold;
      if (b.medals.silver !== a.medals.silver) return b.medals.silver - a.medals.silver;
      return b.medals.bronze - a.medals.bronze;
    });

    // Assign rank
    list.forEach((item, index) => {
      item.rank = index + 1;
    });

    return list;
  }, [teams, publishedResultsForCategory, draftResultsForCategory, selectedDraftIds, includePublished, includeDrafts, candMap]);

  // Top 3 Podium Ranks & Dynamic Theme Colors (dynamically changes when team ranks change)
  const rank1 = teamStandings.find(s => s.rank === 1);
  const rank2 = teamStandings.find(s => s.rank === 2);
  const rank3 = teamStandings.find(s => s.rank === 3);
  const otherTeams = teamStandings.filter(s => s.rank > 3);

  const theme1 = getPodiumColorTheme(rank1?.team);
  const theme2 = getPodiumColorTheme(rank2?.team);
  const theme3 = getPodiumColorTheme(rank3?.team);

  // ---------------------------------------------------------------------------
  // 7. BOTTOM SECTION: SELECTED RESULTS LIST FOR DETAILED VIEW
  // ---------------------------------------------------------------------------
  const resultsForBottomList = useMemo(() => {
    let list: Result[] = [];
    const selectedSet = new Set(selectedDraftIds);

    if (bottomViewMode === 'selected_drafts') {
      list = draftResultsForCategory.filter(r => selectedSet.has(r._id?.toString() || ''));
    } else {
      // All active in simulation for selected category
      const activeDrafts = draftResultsForCategory.filter(r => selectedSet.has(r._id?.toString() || ''));
      list = includePublished ? [...publishedResultsForCategory, ...activeDrafts] : activeDrafts;
    }

    if (bottomSearchQuery.trim()) {
      const q = bottomSearchQuery.toLowerCase().trim();
      list = list.filter(r => {
        const prog = r.programmeId ? progMap.get(r.programmeId) : undefined;
        const nameMatch = (r.programme || prog?.name || '').toLowerCase().includes(q);
        const codeMatch = (prog?.code || '').toLowerCase().includes(q);
        const secMatch = (r.section || prog?.section || '').toLowerCase().includes(q);
        return nameMatch || codeMatch || secMatch;
      });
    }

    return list;
  }, [draftResultsForCategory, publishedResultsForCategory, selectedDraftIds, bottomViewMode, includePublished, bottomSearchQuery, progMap]);

  const toggleResultExpand = (id: string) => {
    setExpandedResultId(prev => (prev === id ? null : id));
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Control Banner & Inclusion Toggles */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Zap className="w-5 h-5 fill-amber-400 text-amber-300" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Real-Time Draft Simulation & Team Standings
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Select unpublished draft results on the right to simulate their live mark impact on team totals and podium positions in real-time.
          </p>
        </div>

        {/* Inclusion Buttons, Category Filter & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Toggle: Arts vs Sports */}
          <div className="inline-flex p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedCategory('arts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'arts'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 border border-purple-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎨</span>
              <span>Arts</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('sports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'sports'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 border border-orange-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚽</span>
              <span>Sports</span>
            </button>
          </div>

          {/* Toggle: Include Published Results */}
          <button
            type="button"
            onClick={() => setIncludePublished(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-xs ${
              includePublished
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-blue-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
          >
            {includePublished ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-4 h-4 rounded-full border border-slate-500" />}
            <span>Published Marks ({publishedResultsForCategory.length})</span>
          </button>

          {/* Toggle: Include Draft Results */}
          <button
            type="button"
            onClick={() => setIncludeDrafts(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-xs ${
              includeDrafts
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
          >
            {includeDrafts ? <CheckCircle2 className="w-4 h-4 text-slate-950 fill-amber-300" /> : <div className="w-4 h-4 rounded-full border border-slate-500" />}
            <span>Selected Draft Marks ({selectedCategoryDraftIdsCount})</span>
          </button>

          {/* Publish Selected Drafts Button */}
          {selectedDraftIds.length > 0 && (
            <button
              type="button"
              onClick={handlePublishSelectedDrafts}
              disabled={isPublishing}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/50 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Publish all selected draft results immediately to the public"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Publishing ({selectedDraftIds.length})...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-emerald-100" />
                  <span>Publish All Selected ({selectedDraftIds.length})</span>
                </>
              )}
            </button>
          )}

          {/* Reset Selection */}
          {selectedDraftIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllSelections}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 border border-rose-800/50 transition-all cursor-pointer"
              title="Clear all selected draft results"
            >
              ↺ Reset ({selectedDraftIds.length})
            </button>
          )}

          {/* Refresh Data */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Refresh results data from server"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================================= */}
      {/* TOP SECTION: TWO COLUMNS (LEFT: PODIUM / RIGHT: DRAFTS LIST)            */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* --------------------------------------------------------------------- */}
        {/* LEFT COLUMN: 3D PODIUM & SIMULATED TEAM STANDINGS (col-span-6)        */}
        {/* --------------------------------------------------------------------- */}
        <section className="lg:col-span-6 flex flex-col justify-between bg-white rounded-3xl border border-slate-200 shadow-lg p-5 sm:p-6 relative overflow-hidden">
          {/* Subtle Warm Amber Spotlight Radial Gradient */}
          <div
            className="absolute inset-x-0 top-0 h-96 pointer-events-none opacity-60"
            style={{
              background: 'radial-gradient(ellipse 70% 60% at 50% 10%, rgba(254, 240, 138, 0.45) 0%, rgba(254, 215, 170, 0.25) 45%, rgba(255, 255, 255, 0) 80%)'
            }}
          />

          <div className="relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Simulated Team Leaderboard</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {includePublished && includeDrafts ? (
                      <>Counting <strong>{publishedResultsForCategory.length} Published {selectedCategory === 'arts' ? 'Arts' : 'Sports'}</strong> + <strong>{selectedCategoryDraftIdsCount} Selected Drafts</strong></>
                    ) : includePublished ? (
                      <>Counting <strong>{publishedResultsForCategory.length} Published {selectedCategory === 'arts' ? 'Arts' : 'Sports'} only</strong></>
                    ) : includeDrafts ? (
                      <>Counting <strong>{selectedCategoryDraftIdsCount} Selected Drafts only</strong></>
                    ) : (
                      <span className="text-amber-600 font-bold">Both modes unchecked (0 pts counted)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Actions: Arts/Sports Pill & View TV Link */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('arts')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      selectedCategory === 'arts'
                        ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>🎨</span>
                    <span>Arts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('sports')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      selectedCategory === 'sports'
                        ? 'bg-white text-orange-700 shadow-xs border border-orange-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>⚽</span>
                    <span>Sports</span>
                  </button>
                </div>

                <Link
                  href="/result-screen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200"
                >
                  <span>📺 TV Screen ↗</span>
                </Link>
              </div>
            </div>

            {/* 3D Isometric / Perspective Podium (Matching Screenshot) */}
            <div className="py-2 sm:py-4">
              <div className="flex justify-center items-end gap-2 sm:gap-4 pb-2 w-full min-h-[300px]">

                {/* ============================================================ */}
                {/* RANK 2: RUNNER UP (Dynamic Team Color!)                      */}
                {/* ============================================================ */}
                <div className="flex-1 max-w-[170px] flex flex-col items-center">
                  {rank2 ? (
                    <div className="flex flex-col items-center mb-1 text-center transition-transform hover:-translate-y-1">
                      <div className="relative">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${theme2.squircleBg} shadow-sm flex items-center justify-center text-xl sm:text-2xl`}>
                          🥈
                        </div>
                        <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                      </div>
                      <h4 className={`font-extrabold text-xs sm:text-sm mt-1 truncate max-w-[130px] ${theme2.textColor}`}>
                        {rank2.team.name}
                      </h4>
                      <div className={`flex items-center gap-1 ${theme2.textColor} font-black text-sm sm:text-base mt-0.5`}>
                        <span className="text-xs">💎</span>
                        <span>{rank2.totalPoints.toLocaleString()}</span>
                      </div>
                      {/* Added Draft Pts Badge */}
                      {rank2.addedDraftPoints > 0 && (
                        <span className="mt-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                          +{rank2.addedDraftPoints} draft pts
                        </span>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                        <span>🥇{rank2.medals.gold}</span>
                        <span>🥈{rank2.medals.silver}</span>
                        <span>🥉{rank2.medals.bronze}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-xs text-slate-400">No Team</div>
                  )}

                  {/* 3D Podium Block: Rank 2 (Dynamic Team Theme) */}
                  <div className="w-full flex flex-col items-center">
                    <div
                      className={`w-full h-4 sm:h-5 ${theme2.topBg} border-t border-x ${theme2.borderTop} shadow-xs`}
                      style={{ clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)' }}
                    />
                    <div className={`w-full h-24 sm:h-32 ${theme2.frontBg} rounded-b-2xl shadow-xl border-b border-x ${theme2.borderFront} flex flex-col items-center justify-center p-2 relative overflow-hidden text-white`}>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                      <SimulatorLaurelWreath rank={2} />
                      <span className="text-[10px] font-bold text-white/95 mt-1 tracking-wider uppercase drop-shadow-xs">
                        Runner Up
                      </span>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* RANK 1: CHAMPION (Dynamic Team Color! - Tallest)             */}
                {/* ============================================================ */}
                <div className="flex-1 max-w-[190px] flex flex-col items-center z-10">
                  {rank1 ? (
                    <div className="flex flex-col items-center mb-1 text-center transition-transform hover:-translate-y-1">
                      <div className="relative">
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${theme1.squircleBg} shadow-md flex items-center justify-center text-2xl sm:text-3xl ring-2 ${theme1.glow}`}>
                          🥇
                        </div>
                        <span className="absolute -top-2 text-base">👑</span>
                        <span className="absolute -top-1 -right-1 text-xs">✨</span>
                      </div>
                      <h4 className={`font-extrabold text-sm sm:text-base mt-1 truncate max-w-[150px] ${theme1.textColor}`}>
                        {rank1.team.name}
                      </h4>
                      <div className={`flex items-center gap-1 ${theme1.textColor} font-black text-base sm:text-lg mt-0.5`}>
                        <span className="text-xs">💎</span>
                        <span>{rank1.totalPoints.toLocaleString()}</span>
                      </div>
                      {/* Added Draft Pts Badge */}
                      {rank1.addedDraftPoints > 0 && (
                        <span className="mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
                          +{rank1.addedDraftPoints} draft pts
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                        <span>🥇{rank1.medals.gold}</span>
                        <span>🥈{rank1.medals.silver}</span>
                        <span>🥉{rank1.medals.bronze}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-xs text-slate-400">No Team</div>
                  )}

                  {/* 3D Podium Block: Rank 1 (Dynamic Team Theme) */}
                  <div className="w-full flex flex-col items-center">
                    <div
                      className={`w-full h-4 sm:h-5 ${theme1.topBg} border-t border-x ${theme1.borderTop} shadow-xs`}
                      style={{ clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)' }}
                    />
                    <div className={`w-full h-32 sm:h-44 ${theme1.frontBg} rounded-b-2xl shadow-2xl border-b border-x ${theme1.borderFront} flex flex-col items-center justify-center p-2 relative overflow-hidden text-white`}>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                      <SimulatorLaurelWreath rank={1} />
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 text-white mt-1 tracking-wider uppercase backdrop-blur-xs border border-white/30">
                        Champion
                      </span>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* RANK 3: 3RD PLACE (Dynamic Team Color!)                      */}
                {/* ============================================================ */}
                <div className="flex-1 max-w-[170px] flex flex-col items-center">
                  {rank3 ? (
                    <div className="flex flex-col items-center mb-1 text-center transition-transform hover:-translate-y-1">
                      <div className="relative">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${theme3.squircleBg} shadow-sm flex items-center justify-center text-xl sm:text-2xl`}>
                          🥉
                        </div>
                        <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                      </div>
                      <h4 className={`font-extrabold text-xs sm:text-sm mt-1 truncate max-w-[130px] ${theme3.textColor}`}>
                        {rank3.team.name}
                      </h4>
                      <div className={`flex items-center gap-1 ${theme3.textColor} font-black text-sm sm:text-base mt-0.5`}>
                        <span className="text-xs">💎</span>
                        <span>{rank3.totalPoints.toLocaleString()}</span>
                      </div>
                      {/* Added Draft Pts Badge */}
                      {rank3.addedDraftPoints > 0 && (
                        <span className="mt-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                          +{rank3.addedDraftPoints} draft pts
                        </span>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                        <span>🥇{rank3.medals.gold}</span>
                        <span>🥈{rank3.medals.silver}</span>
                        <span>🥉{rank3.medals.bronze}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-xs text-slate-400">No Team</div>
                  )}

                  {/* 3D Podium Block: Rank 3 (Dynamic Team Theme) */}
                  <div className="w-full flex flex-col items-center">
                    <div
                      className={`w-full h-4 sm:h-5 ${theme3.topBg} border-t border-x ${theme3.borderTop} shadow-xs`}
                      style={{ clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)' }}
                    />
                    <div className={`w-full h-20 sm:h-28 ${theme3.frontBg} rounded-b-2xl shadow-xl border-b border-x ${theme3.borderFront} flex flex-col items-center justify-center p-2 relative overflow-hidden text-white`}>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                      <SimulatorLaurelWreath rank={3} />
                      <span className="text-[10px] font-bold text-white/95 mt-1 tracking-wider uppercase drop-shadow-xs">
                        3rd Place
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Other Teams (if any beyond rank 3) */}
            {otherTeams.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Other Teams:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {otherTeams.map(st => (
                    <div key={st.team.code} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-800">
                        #{st.rank} {st.team.name}
                      </div>
                      <div className="font-black text-slate-900 flex items-center gap-1">
                        <span>💎 {st.totalPoints}</span>
                        {st.addedDraftPoints > 0 && (
                          <span className="text-[9px] text-amber-700 font-extrabold bg-amber-100 px-1 rounded">
                            +{st.addedDraftPoints}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtitle Status Footer */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span>Standings auto-recalculated in real time</span>
            <span>•</span>
            <span>Changes persist on page refresh</span>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: DRAFTED RESULTS & TEAM FILTER BUTTONS (col-span-6)      */}
        {/* --------------------------------------------------------------------- */}
        <section className="lg:col-span-6 flex flex-col justify-between bg-white rounded-3xl border border-slate-200 shadow-lg p-5 sm:p-6">
          <div>
            {/* Header: Title + Category Pill + Selected Count + Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>📝 Drafted Results</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                      {selectedCategoryDraftIdsCount} of {draftResultsForCategory.length} Selected
                    </span>
                  </h3>
                  {/* Category Switcher Pill in Drafts Header */}
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('arts')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        selectedCategory === 'arts'
                          ? 'bg-white text-purple-700 shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span>🎨</span>
                      <span>Arts</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('sports')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        selectedCategory === 'sports'
                          ? 'bg-white text-orange-700 shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span>⚽</span>
                      <span>Sports</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {selectedCategory === 'arts' ? 'Arts' : 'Sports'} draft results. Click any card to toggle simulation.
                </p>
              </div>

              {/* Action Buttons: Publish Selected + Select / Deselect */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {selectedDraftIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePublishSelectedDrafts}
                    disabled={isPublishing}
                    className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Publish all selected draft results"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish Selected ({selectedDraftIds.length})</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                  title="Select all results matching current filter"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectFiltered}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  title="Deselect filtered results"
                >
                  Deselect
                </button>
              </div>
            </div>

            {/* Team Quick Filter Buttons (Using Team Colors!) */}
            <div className="pt-3 pb-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Filter by Team with Prizes/Grades:
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {filteredDraftResults.length} Programmes Shown
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* All Teams Button */}
                <button
                  type="button"
                  onClick={() => setSelectedTeamFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    selectedTeamFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-800 ring-2 ring-slate-400/40'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  <span>All Teams</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {teamDraftCounts.all || 0}
                  </span>
                </button>

                {/* ADL: Blue */}
                <button
                  type="button"
                  onClick={() => setSelectedTeamFilter('ADL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    selectedTeamFilter === 'ADL'
                      ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400/50'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span>ADL (Adālah)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedTeamFilter === 'ADL' ? 'bg-white/20 text-white' : 'bg-blue-200/80 text-blue-900'}`}>
                    {teamDraftCounts['ADL'] || 0}
                  </span>
                </button>

                {/* SHJ: Red */}
                <button
                  type="button"
                  onClick={() => setSelectedTeamFilter('SHJ')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    selectedTeamFilter === 'SHJ'
                      ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400/50'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span>SHJ (Shajāʿah)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedTeamFilter === 'SHJ' ? 'bg-white/20 text-white' : 'bg-red-200/80 text-red-900'}`}>
                    {teamDraftCounts['SHJ'] || 0}
                  </span>
                </button>

                {/* QIY: Green */}
                <button
                  type="button"
                  onClick={() => setSelectedTeamFilter('QIY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    selectedTeamFilter === 'QIY'
                      ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400/50'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>QIY (Qiyādah)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedTeamFilter === 'QIY' ? 'bg-white/20 text-white' : 'bg-emerald-200/80 text-emerald-900'}`}>
                    {teamDraftCounts['QIY'] || 0}
                  </span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative pt-1 pb-3">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search draft programme name or code..."
                value={draftSearchQuery}
                onChange={e => setDraftSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 transition-all"
              />
              {draftSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDraftSearchQuery('')}
                  className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Scrollable Draft Results Cards List */}
            <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2.5">
              {filteredDraftResults.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <span className="text-3xl">📭</span>
                  <p className="font-bold text-sm text-slate-600">No Draft Results Match Filter</p>
                  <p className="text-xs text-slate-400">
                    {selectedTeamFilter !== 'all' ? `No draft results have prizes or grades for ${selectedTeamFilter}` : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                filteredDraftResults.map(res => {
                  const resId = res._id?.toString() || '';
                  const isSelected = selectedDraftIds.includes(resId);
                  const prog = res.programmeId ? progMap.get(res.programmeId) : undefined;
                  const secBadge = getSectionTheme(res.section || prog?.section);
                  const breakdown = getResultTeamBreakdown(res);

                  return (
                    <div
                      key={resId}
                      onClick={() => toggleSelectDraft(resId)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-50/90 via-yellow-50/50 to-white border-amber-400 shadow-sm ring-2 ring-amber-400/30'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
                      }`}
                    >
                      {/* Top row: Checkbox, Code, Title, Section Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Checkbox */}
                          <div className="shrink-0 text-amber-600">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 fill-amber-500 text-white" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </div>

                          {/* Code */}
                          {prog?.code && (
                            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 shrink-0">
                              {prog.code}
                            </span>
                          )}

                          {/* Title */}
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {res.programme || prog?.name || 'Programme'}
                          </h4>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${secBadge.badgeBg}`}>
                            {secBadge.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase">
                            {res.positionType || prog?.positionType || 'ind'}
                          </span>
                        </div>
                      </div>

                      {/* Middle row: Winners summary & Team points preview */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-100 text-xs">
                        {/* Winners Mini Pills */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          {res.firstPlace && res.firstPlace.length > 0 && (
                            <span className="font-medium">🥇 #{res.firstPlace[0].chestNumber}</span>
                          )}
                          {res.firstPlaceTeams && res.firstPlaceTeams.length > 0 && (
                            <span className="font-medium">🥇 {res.firstPlaceTeams[0].teamCode}</span>
                          )}
                          {res.secondPlace && res.secondPlace.length > 0 && (
                            <span className="font-medium text-slate-500">🥈 #{res.secondPlace[0].chestNumber}</span>
                          )}
                          {res.thirdPlace && res.thirdPlace.length > 0 && (
                            <span className="font-medium text-slate-500">🥉 #{res.thirdPlace[0].chestNumber}</span>
                          )}
                        </div>

                        {/* Team Points Contribution Badges */}
                        <div className="flex items-center gap-1">
                          {Object.entries(breakdown).map(([code, data]) => {
                            const theme = getTeamTheme(code, teams);
                            return (
                              <span
                                key={code}
                                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 ${theme.badgeBg}`}
                              >
                                <span>{code}:</span>
                                <span>+{data.points} pts</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Selection Status Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Showing {filteredDraftResults.length} of {draftResults.length} draft results
            </span>
            <span className="text-amber-700 font-bold">
              {selectedDraftIds.length} Added to Simulation
            </span>
          </div>
        </section>

      </div>

      {/* ======================================================================= */}
      {/* BOTTOM SECTION: DETAILED COMPETITION RESULTS CARDS (MATCHING IMG)       */}
      {/* ======================================================================= */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-lg p-5 sm:p-7 space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📢</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Competition Results
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                {resultsForBottomList.length} Announcements
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Official podium winners are shown by default. Click any result to view grade holders.
            </p>
          </div>

          {/* Search, Publish & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Publish Selected in Bottom Bar */}
            {selectedDraftIds.length > 0 && (
              <button
                type="button"
                onClick={handlePublishSelectedDrafts}
                disabled={isPublishing}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                title="Publish all selected draft results immediately"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing ({selectedDraftIds.length})...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish All Selected ({selectedDraftIds.length})</span>
                  </>
                )}
              </button>
            )}

            {/* View Mode Toggle: Selected Drafts vs All Active */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
              <button
                type="button"
                onClick={() => setBottomViewMode('selected_drafts')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  bottomViewMode === 'selected_drafts'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Selected Drafts ({selectedDraftIds.length})
              </button>
              <button
                type="button"
                onClick={() => setBottomViewMode('all_active')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  bottomViewMode === 'all_active'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Simulated ({includePublished ? publishedResults.length + selectedDraftIds.length : selectedDraftIds.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search programmes..."
                value={bottomSearchQuery}
                onChange={e => setBottomSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Results Cards List (Exact match to second screenshot) */}
        {resultsForBottomList.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
            <span className="text-4xl">📋</span>
            <p className="font-bold text-base text-slate-700">No Results to Display in this View</p>
            <p className="text-xs text-slate-400 max-w-md">
              {bottomViewMode === 'selected_drafts'
                ? 'Select one or more draft results on the right side above to view their detailed winner cards here.'
                : 'Check your search query or inclusion toggles.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {resultsForBottomList.map((res, index) => {
              const resId = res._id?.toString() || String(index);
              const progDoc = res.programmeId ? progMap.get(res.programmeId) : undefined;
              const sectionBadge = getSectionTheme(res.section || progDoc?.section);
              const isExpanded = expandedResultId === resId;
              const isDraft = res.status === 'draft';

              // Graded only candidates
              const firstChests = new Set((res.firstPlace || []).map(p => String(p.chestNumber || '').trim()));
              const secondChests = new Set((res.secondPlace || []).map(p => String(p.chestNumber || '').trim()));
              const thirdChests = new Set((res.thirdPlace || []).map(p => String(p.chestNumber || '').trim()));
              const podiumChests = new Set([...firstChests, ...secondChests, ...thirdChests]);

              const gradedOnlyCandidates = (res.participationGrades || [])
                .filter(g => !podiumChests.has(String(g.chestNumber || '').trim()))
                .map(g => {
                  const chest = String(g.chestNumber || '').trim();
                  const cand = candMap.get(chest);
                  const theme = getTeamTheme(cand?.team, teams);
                  return {
                    name: cand?.name || `Candidate #${chest}`,
                    chestNumber: chest,
                    teamName: theme.name,
                    teamColor: theme.color,
                    grade: g.grade,
                    points: g.points ?? getDefaultGradePoints(g.grade)
                  };
                });

              return (
                <div
                  key={resId}
                  className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                    isDraft ? 'border-amber-300 ring-1 ring-amber-400/20' : 'border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100/60 border border-amber-200 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                        🎨
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
                          {isDraft && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-black bg-amber-400 text-amber-950 shadow-2xs">
                              DRAFT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {isDraft ? 'Draft Result' : 'Published'}: {res.createdAt ? new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grade Holders Toggle Button */}
                    {gradedOnlyCandidates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleResultExpand(resId)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
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

                  {/* DEFAULT VIEW: PODIUM PRIZES (1st, 2nd, 3rd) Cards */}
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
                      {renderSimulatorWinners(res.firstPlace, res.firstPlaceTeams, candidates, teams, res.participationGrades, res.participationTeamGrades)}
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
                      {renderSimulatorWinners(res.secondPlace, res.secondPlaceTeams, candidates, teams, res.participationGrades, res.participationTeamGrades)}
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
                      {renderSimulatorWinners(res.thirdPlace, res.thirdPlaceTeams, candidates, teams, res.participationGrades, res.participationTeamGrades)}
                    </div>

                  </div>

                  {/* EXPANDED VIEW: GRADED CANDIDATES */}
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
                                #{winner.chestNumber} • {winner.teamName}
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

                  {/* Card Action Footer */}
                  {onEditResult && (
                    <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Result ID: {res._id?.toString()}</span>
                      <button
                        type="button"
                        onClick={() => onEditResult(res)}
                        className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Edit Result Details ↗
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

// -----------------------------------------------------------------------------
// HELPER: RENDER WINNERS (MATCHING EXACT COMPONENT FROM RESULTS SCREEN)
// -----------------------------------------------------------------------------
function renderSimulatorWinners(
  place: any[] | undefined,
  placeTeams: any[] | undefined,
  candidates: Candidate[],
  teams: Team[],
  participationGrades?: any[],
  participationTeamGrades?: any[]
) {
  if (placeTeams && placeTeams.length > 0) {
    return (
      <div className="space-y-2">
        {placeTeams.map((item, idx) => {
          const theme = getTeamTheme(item.teamCode, teams);
          const grade = item.grade || participationTeamGrades?.find(g => g.teamCode === item.teamCode)?.grade;
          return (
            <div key={idx} className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.color }}></span>
                <span className="font-extrabold text-slate-900 text-sm truncate">{theme.name}</span>
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

  if (place && place.length > 0) {
    return (
      <div className="space-y-2">
        {place.map((item, idx) => {
          const cand = candidates.find(c => String(c.chestNumber || '').trim() === String(item.chestNumber || '').trim());
          const theme = getTeamTheme(cand?.team, teams);
          const grade = item.grade || participationGrades?.find(g => String(g.chestNumber || '').trim() === String(item.chestNumber || '').trim())?.grade;
          return (
            <div key={idx} className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
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

// -----------------------------------------------------------------------------
// HELPER: SCREEN LAUREL WREATH SVG FOR PODIUM
// -----------------------------------------------------------------------------
function SimulatorLaurelWreath({ rank }: { rank: 1 | 2 | 3 }) {
  return (
    <div className="flex flex-col items-center justify-center text-white select-none">
      {/* Stars on top */}
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <span className="text-[10px] text-white/90">★</span>
        <span className="text-xs font-bold text-white">★</span>
        <span className="text-[10px] text-white/90">★</span>
      </div>

      {/* Number with Laurel Wreath SVG */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 120 90"
          className="w-14 h-11 sm:w-16 sm:h-13 text-white fill-current drop-shadow-md"
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
          </g>
          {/* Bottom Ribbon */}
          <path d="M 55 75 C 58 77 62 77 65 75 C 67 78 63 81 60 81 C 57 81 53 78 55 75 Z" />
        </svg>
        <span className="absolute font-black text-xl sm:text-2xl tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          {rank}
        </span>
      </div>
    </div>
  );
}
