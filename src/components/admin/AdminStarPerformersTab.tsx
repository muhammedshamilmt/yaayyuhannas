'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Result, Programme, Candidate, ProgrammeParticipant, Team } from '@/types';
import { getTeamTheme, getSectionTheme, classifyProgramme } from '@/lib/profileHelper';
import { findProgramme, getProgrammeName, getProgrammeCode, getDefaultGradePoints } from '@/lib/resultsHelper';
import {
  Star,
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Filter,
  Search,
  RotateCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sliders,
  Zap,
  Users,
  User,
  ArrowUpDown,
  Eye,
  Award,
  CheckSquare,
  Square,
  X,
  Printer,
  ChevronRight
} from 'lucide-react';

export interface AdminStarPerformersTabProps {
  results: Result[];
  programmes: Programme[];
  candidates: Candidate[];
  teams: Team[];
  participants: ProgrammeParticipant[];
  onRefresh?: () => void;
  onEditResult?: (result: Result) => void;
}

export interface CandidateProgrammeAchievement {
  resultId: string;
  result: Result;
  programmeId?: string;
  programmeName: string;
  programmeCode: string;
  section: string;
  category: 'arts' | 'sports';
  isDraft: boolean;
  position?: 1 | 2 | 3;
  positionPoints: number;
  grade?: string;
  gradePoints: number;
  totalPoints: number;
}

export interface StarPerformerData {
  candidate: Candidate;
  team: { code: string; name: string; color: string };
  section: string;
  basePublishedPoints: number;
  addedDraftPoints: number;
  totalPoints: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  draftMedals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  gradesCount: number;
  totalWins: number;
  participations: number;
  achievements: CandidateProgrammeAchievement[];
  rank: number;
}

export function AdminStarPerformersTab({
  results,
  programmes,
  candidates,
  teams,
  participants,
  onRefresh,
  onEditResult
}: AdminStarPerformersTabProps) {
  // ---------------------------------------------------------------------------
  // 1. STATE & PERSISTENCE
  // ---------------------------------------------------------------------------
  const [includePublished, setIncludePublished] = useState<boolean>(true);
  const [includeDrafts, setIncludeDrafts] = useState<boolean>(true);
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [isDraftsPanelOpen, setIsDraftsPanelOpen] = useState<boolean>(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState<string>('');

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'arts' | 'sports'>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'points' | 'golds' | 'wins'>('points');
  const [expandedCandidateChest, setExpandedCandidateChest] = useState<string | null>(null);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedSelected = localStorage.getItem('admin_star_sim_selected_drafts');
      if (savedSelected) {
        setSelectedDraftIds(JSON.parse(savedSelected));
      }
      const savedPub = localStorage.getItem('admin_star_sim_include_pub');
      if (savedPub !== null) setIncludePublished(JSON.parse(savedPub));
      const savedDrafts = localStorage.getItem('admin_star_sim_include_drafts');
      if (savedDrafts !== null) setIncludeDrafts(JSON.parse(savedDrafts));
      const savedCat = localStorage.getItem('admin_star_sim_category');
      if (savedCat === 'all' || savedCat === 'arts' || savedCat === 'sports') setSelectedCategory(savedCat);
      const savedSec = localStorage.getItem('admin_star_sim_section');
      if (savedSec) setSelectedSection(savedSec);
      const savedTeam = localStorage.getItem('admin_star_sim_team');
      if (savedTeam) setSelectedTeam(savedTeam);
    } catch (e) {
      console.warn('Failed to load star performers simulator settings', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save selected draft IDs whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('admin_star_sim_selected_drafts', JSON.stringify(selectedDraftIds));
      localStorage.setItem('admin_star_sim_include_pub', JSON.stringify(includePublished));
      localStorage.setItem('admin_star_sim_include_drafts', JSON.stringify(includeDrafts));
      localStorage.setItem('admin_star_sim_category', selectedCategory);
      localStorage.setItem('admin_star_sim_section', selectedSection);
      localStorage.setItem('admin_star_sim_team', selectedTeam);
    } catch (e) {
      console.warn('Failed to save star performers simulator settings', e);
    }
  }, [selectedDraftIds, includePublished, includeDrafts, selectedCategory, selectedSection, selectedTeam, isInitialized]);

  // ---------------------------------------------------------------------------
  // 2. DATA SPLIT: PUBLISHED VS DRAFTS
  // ---------------------------------------------------------------------------
  const publishedResults = useMemo(() => {
    return results.filter(r => r.status === 'published' || !r.status);
  }, [results]);

  const draftResults = useMemo(() => {
    return results.filter(r => r.status === 'draft');
  }, [results]);

  // If user opens the tab for the first time and has never configured drafts,
  // default to selecting ALL drafts so they immediately see the full simulation
  useEffect(() => {
    if (isInitialized && selectedDraftIds.length === 0 && draftResults.length > 0) {
      const savedSelected = localStorage.getItem('admin_star_sim_selected_drafts');
      if (!savedSelected) {
        setSelectedDraftIds(draftResults.map(r => r._id?.toString() || ''));
      }
    }
  }, [isInitialized, draftResults]);

  // Draft results matching the search query in the draft drawer
  const filteredDraftResults = useMemo(() => {
    if (!draftSearchQuery.trim()) return draftResults;
    const q = draftSearchQuery.toLowerCase().trim();
    return draftResults.filter(r => {
      const progDoc = findProgramme(r, programmes);
      const name = (getProgrammeName(r, progDoc) || '').toLowerCase();
      const code = (getProgrammeCode(r, progDoc) || '').toLowerCase();
      const sec = (r.section || progDoc?.section || '').toLowerCase();
      return name.includes(q) || code.includes(q) || sec.includes(q);
    });
  }, [draftResults, draftSearchQuery, programmes]);

  // Toggle individual draft selection
  const toggleDraftSelection = (id: string) => {
    setSelectedDraftIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllDrafts = () => {
    setSelectedDraftIds(draftResults.map(r => r._id?.toString() || ''));
  };

  const clearAllDrafts = () => {
    setSelectedDraftIds([]);
  };

  // ---------------------------------------------------------------------------
  // 3. EFFECTIVE RESULTS SET (PUBLISHED + SELECTED DRAFTS)
  // ---------------------------------------------------------------------------
  const effectiveActiveResults = useMemo(() => {
    const list: { result: Result; isDraft: boolean }[] = [];
    if (includePublished) {
      publishedResults.forEach(r => list.push({ result: r, isDraft: false }));
    }
    if (includeDrafts) {
      const selectedSet = new Set(selectedDraftIds);
      draftResults.forEach(r => {
        if (selectedSet.has(r._id?.toString() || '')) {
          list.push({ result: r, isDraft: true });
        }
      });
    }
    return list;
  }, [includePublished, includeDrafts, publishedResults, draftResults, selectedDraftIds]);

  // ---------------------------------------------------------------------------
  // 4. CANDIDATE POINT CALCULATION
  // ---------------------------------------------------------------------------
  const progMap = useMemo(() => {
    const map = new Map<string, Programme>();
    programmes.forEach(p => {
      if (p._id) map.set(p._id.toString(), p);
      if (p.id) map.set(String(p.id), p);
      if (p.code) map.set(p.code.toUpperCase().trim(), p);
    });
    return map;
  }, [programmes]);

  const allStarPerformers = useMemo(() => {
    const candMap: Record<string, StarPerformerData> = {};

    // 1. Initialize candidate dictionary
    candidates.forEach(c => {
      const chest = String(c.chestNumber || '').trim();
      if (!chest) return;
      const tCode = (c.team || '').toUpperCase().trim();
      const teamObj = teams.find(t => (t.code || '').toUpperCase().trim() === tCode);
      const teamTheme = getTeamTheme(tCode, teams);

      candMap[chest] = {
        candidate: c,
        team: teamObj ? { code: teamObj.code, name: teamObj.name, color: teamObj.color } : { code: tCode, name: teamTheme.name, color: teamTheme.color },
        section: (c.section || '').toLowerCase().trim(),
        basePublishedPoints: 0,
        addedDraftPoints: 0,
        totalPoints: 0,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        draftMedals: { gold: 0, silver: 0, bronze: 0 },
        gradesCount: 0,
        totalWins: 0,
        participations: 0,
        achievements: [],
        rank: 0
      };
    });

    // 2. Process all effective results (individual programmes only)
    effectiveActiveResults.forEach(({ result: res, isDraft }) => {
      // Only individual programmes count towards Star Performers
      if (res.positionType !== 'individual') return;

      const matchedProg = findProgramme(res, programmes);
      const progName = getProgrammeName(res, matchedProg);
      const progCode = getProgrammeCode(res, matchedProg);

      const rawCat = (matchedProg?.category || (res as any).category || '').toLowerCase().trim();
      const category: 'arts' | 'sports' = rawCat === 'sports' ? 'sports' : rawCat === 'arts' ? 'arts' : (classifyProgramme(matchedProg, matchedProg?.code, res.programme).category === 'sports' ? 'sports' : 'arts');

      const firstPoints = res.firstPoints !== undefined && res.firstPoints !== null ? Number(res.firstPoints) : (matchedProg?.firstPoints ?? 10);
      const secondPoints = res.secondPoints !== undefined && res.secondPoints !== null ? Number(res.secondPoints) : (matchedProg?.secondPoints ?? 8);
      const thirdPoints = res.thirdPoints !== undefined && res.thirdPoints !== null ? Number(res.thirdPoints) : (matchedProg?.thirdPoints ?? 5);

      // Track winners in this programme to record achievements cleanly
      const recordedChests = new Set<string>();

      // 1st Place
      (res.firstPlace || []).forEach(p => {
        const chest = String(p.chestNumber || '').trim();
        if (candMap[chest]) {
          recordedChests.add(chest);
          const pgItem = (res.participationGrades || []).find(pg => String(pg.chestNumber || '').trim() === chest);
          const grade = p.grade || pgItem?.grade;
          const gradePoints = pgItem?.points !== undefined && pgItem?.points !== null
            ? Number(pgItem.points)
            : (grade ? (getDefaultGradePoints(grade) || 0) : 0);
          const totalEarned = firstPoints + gradePoints;

          if (isDraft) {
            candMap[chest].addedDraftPoints += totalEarned;
            candMap[chest].draftMedals.gold += 1;
          } else {
            candMap[chest].basePublishedPoints += totalEarned;
            candMap[chest].medals.gold += 1;
            candMap[chest].medals.total += 1;
          }

          candMap[chest].totalPoints += totalEarned;
          candMap[chest].totalWins += 1;
          candMap[chest].participations += 1;
          if (grade) candMap[chest].gradesCount += 1;

          candMap[chest].achievements.push({
            resultId: res._id?.toString() || '',
            result: res,
            programmeId: res.programmeId,
            programmeName: progName,
            programmeCode: progCode,
            section: res.section || matchedProg?.section || '',
            category,
            isDraft,
            position: 1,
            positionPoints: firstPoints,
            grade,
            gradePoints,
            totalPoints: totalEarned
          });
        }
      });

      // 2nd Place
      (res.secondPlace || []).forEach(p => {
        const chest = String(p.chestNumber || '').trim();
        if (candMap[chest]) {
          recordedChests.add(chest);
          const pgItem = (res.participationGrades || []).find(pg => String(pg.chestNumber || '').trim() === chest);
          const grade = p.grade || pgItem?.grade;
          const gradePoints = pgItem?.points !== undefined && pgItem?.points !== null
            ? Number(pgItem.points)
            : (grade ? (getDefaultGradePoints(grade) || 0) : 0);
          const totalEarned = secondPoints + gradePoints;

          if (isDraft) {
            candMap[chest].addedDraftPoints += totalEarned;
            candMap[chest].draftMedals.silver += 1;
          } else {
            candMap[chest].basePublishedPoints += totalEarned;
            candMap[chest].medals.silver += 1;
            candMap[chest].medals.total += 1;
          }

          candMap[chest].totalPoints += totalEarned;
          candMap[chest].totalWins += 1;
          candMap[chest].participations += 1;
          if (grade) candMap[chest].gradesCount += 1;

          candMap[chest].achievements.push({
            resultId: res._id?.toString() || '',
            result: res,
            programmeId: res.programmeId,
            programmeName: progName,
            programmeCode: progCode,
            section: res.section || matchedProg?.section || '',
            category,
            isDraft,
            position: 2,
            positionPoints: secondPoints,
            grade,
            gradePoints,
            totalPoints: totalEarned
          });
        }
      });

      // 3rd Place
      (res.thirdPlace || []).forEach(p => {
        const chest = String(p.chestNumber || '').trim();
        if (candMap[chest]) {
          recordedChests.add(chest);
          const pgItem = (res.participationGrades || []).find(pg => String(pg.chestNumber || '').trim() === chest);
          const grade = p.grade || pgItem?.grade;
          const gradePoints = pgItem?.points !== undefined && pgItem?.points !== null
            ? Number(pgItem.points)
            : (grade ? (getDefaultGradePoints(grade) || 0) : 0);
          const totalEarned = thirdPoints + gradePoints;

          if (isDraft) {
            candMap[chest].addedDraftPoints += totalEarned;
            candMap[chest].draftMedals.bronze += 1;
          } else {
            candMap[chest].basePublishedPoints += totalEarned;
            candMap[chest].medals.bronze += 1;
            candMap[chest].medals.total += 1;
          }

          candMap[chest].totalPoints += totalEarned;
          candMap[chest].totalWins += 1;
          candMap[chest].participations += 1;
          if (grade) candMap[chest].gradesCount += 1;

          candMap[chest].achievements.push({
            resultId: res._id?.toString() || '',
            result: res,
            programmeId: res.programmeId,
            programmeName: progName,
            programmeCode: progCode,
            section: res.section || matchedProg?.section || '',
            category,
            isDraft,
            position: 3,
            positionPoints: thirdPoints,
            grade,
            gradePoints,
            totalPoints: totalEarned
          });
        }
      });

      // Participation Grades (for candidates not in top 3 or graded separately)
      (res.participationGrades || []).forEach(pg => {
        const chest = String(pg.chestNumber || '').trim();
        if (candMap[chest] && !recordedChests.has(chest)) {
          const gPts = pg.points !== undefined && pg.points !== null
            ? pg.points
            : (getDefaultGradePoints(pg.grade) || res.participationPoints || 0);

          if (gPts > 0) {
            if (isDraft) {
              candMap[chest].addedDraftPoints += gPts;
            } else {
              candMap[chest].basePublishedPoints += gPts;
            }

            candMap[chest].totalPoints += gPts;
            candMap[chest].gradesCount += 1;
            candMap[chest].participations += 1;

            candMap[chest].achievements.push({
              resultId: res._id?.toString() || '',
              result: res,
              programmeId: res.programmeId,
              programmeName: progName,
              programmeCode: progCode,
              section: res.section || matchedProg?.section || '',
              category,
              isDraft,
              positionPoints: 0,
              grade: pg.grade,
              gradePoints: gPts,
              totalPoints: gPts
            });
          }
        }
      });
    });

    return Object.values(candMap);
  }, [candidates, effectiveActiveResults, teams, programmes]);

  // ---------------------------------------------------------------------------
  // 5. FILTERING & SORTING
  // ---------------------------------------------------------------------------
  const filteredStarPerformers = useMemo(() => {
    let list = allStarPerformers.filter(p => p.totalPoints > 0);

    // Filter by Section
    if (selectedSection !== 'all') {
      const targetSec = selectedSection.toLowerCase().trim();
      list = list.filter(p => p.section === targetSec);
    }

    // Filter by Team
    if (selectedTeam !== 'all') {
      const targetTeam = selectedTeam.toUpperCase().trim();
      list = list.filter(p => p.team.code.toUpperCase().trim() === targetTeam);
    }

    // Filter by Category: recalculate points earned strictly in that category if not 'all'
    if (selectedCategory !== 'all') {
      list = list
        .map(p => {
          const catAchievements = p.achievements.filter(a => a.category === selectedCategory);
          if (catAchievements.length === 0) return null;

          const basePts = catAchievements.filter(a => !a.isDraft).reduce((sum, a) => sum + a.totalPoints, 0);
          const draftPts = catAchievements.filter(a => a.isDraft).reduce((sum, a) => sum + a.totalPoints, 0);
          const goldCount = catAchievements.filter(a => !a.isDraft && a.position === 1).length;
          const silverCount = catAchievements.filter(a => !a.isDraft && a.position === 2).length;
          const bronzeCount = catAchievements.filter(a => !a.isDraft && a.position === 3).length;
          const dGoldCount = catAchievements.filter(a => a.isDraft && a.position === 1).length;
          const dSilverCount = catAchievements.filter(a => a.isDraft && a.position === 2).length;
          const dBronzeCount = catAchievements.filter(a => a.isDraft && a.position === 3).length;

          return {
            ...p,
            basePublishedPoints: basePts,
            addedDraftPoints: draftPts,
            totalPoints: basePts + draftPts,
            medals: {
              gold: goldCount,
              silver: silverCount,
              bronze: bronzeCount,
              total: goldCount + silverCount + bronzeCount
            },
            draftMedals: {
              gold: dGoldCount,
              silver: dSilverCount,
              bronze: dBronzeCount
            },
            totalWins: goldCount + silverCount + bronzeCount + dGoldCount + dSilverCount + dBronzeCount,
            achievements: catAchievements
          };
        })
        .filter((p): p is StarPerformerData => p !== null && p.totalPoints > 0);
    }

    // Search query: by candidate name, chest number, or team code
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        return (
          p.candidate.name.toLowerCase().includes(q) ||
          p.candidate.chestNumber.toLowerCase().includes(q) ||
          p.team.code.toLowerCase().includes(q) ||
          p.team.name.toLowerCase().includes(q)
        );
      });
    }

    // Sort list
    list.sort((a, b) => {
      if (sortBy === 'points') {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        const totalGoldsB = b.medals.gold + b.draftMedals.gold;
        const totalGoldsA = a.medals.gold + a.draftMedals.gold;
        if (totalGoldsB !== totalGoldsA) return totalGoldsB - totalGoldsA;
        return b.totalWins - a.totalWins;
      }
      if (sortBy === 'golds') {
        const totalGoldsB = b.medals.gold + b.draftMedals.gold;
        const totalGoldsA = a.medals.gold + a.draftMedals.gold;
        if (totalGoldsB !== totalGoldsA) return totalGoldsB - totalGoldsA;
        return b.totalPoints - a.totalPoints;
      }
      if (sortBy === 'wins') {
        if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
        return b.totalPoints - a.totalPoints;
      }
      return 0;
    });

    // Assign final rank
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [allStarPerformers, selectedSection, selectedTeam, selectedCategory, searchQuery, sortBy]);

  // Top 3 Star Performers
  const top1 = filteredStarPerformers[0];
  const top2 = filteredStarPerformers[1];
  const top3 = filteredStarPerformers[2];

  // Quick stats
  const totalStarPerformersCount = filteredStarPerformers.length;
  const totalGoldMedalistsCount = filteredStarPerformers.filter(p => (p.medals.gold + p.draftMedals.gold) > 0).length;
  const activeDraftsCount = selectedDraftIds.length;
  const isSimulationActive = includeDrafts && activeDraftsCount > 0;

  return (
    <div className="space-y-6">
      {/* ======================================================================= */}
      {/* 1. TOP HEADER BANNER & SIMULATION STATUS INDICATOR                      */}
      {/* ======================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Star Performers & Individual Standings</span>
            </span>

            {isSimulationActive ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 animate-pulse">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Draft Simulation Active ({activeDraftsCount} drafts included)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official Published Only</span>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>⭐ Star Performers Leaderboard</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            Real-time individual candidate rankings calculated from individual competitions. You can simulate star performer rankings with unpublished draft results without affecting public views.
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
          {/* Draft Simulation Panel Trigger Button */}
          <button
            type="button"
            onClick={() => setIsDraftsPanelOpen(!isDraftsPanelOpen)}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isDraftsPanelOpen
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Select Drafts ({selectedDraftIds.length}/{draftResults.length})</span>
            {isDraftsPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors shadow-xs"
              title="Refresh results from server"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors shadow-xs"
            title="Print Star Performers"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. DRAFT RESULTS SELECTION DRAWER / PANEL (COLLAPSIBLE)                  */}
      {/* ======================================================================= */}
      {isDraftsPanelOpen && (
        <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-3xl p-5 sm:p-6 shadow-md animate-in fade-in slide-in-from-top-3 duration-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs">
                  <Zap className="w-4 h-4 fill-current" />
                </span>
                <h3 className="text-base font-black text-amber-950">
                  Select Draft Results to Include in Star Performer Standings
                </h3>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Check or uncheck individual draft results below to immediately simulate who becomes the Star Performer.
                No results need to be published for you to view this preview!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={selectAllDrafts}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all shadow-2xs"
              >
                Select All ({draftResults.length})
              </button>
              <button
                type="button"
                onClick={clearAllDrafts}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-all shadow-2xs"
              >
                Deselect All
              </button>
              <button
                type="button"
                onClick={() => setIsDraftsPanelOpen(false)}
                className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-200/50 rounded-xl"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Simulation Options Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-white border border-amber-200 shadow-2xs cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📢</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Include Published Results</div>
                  <div className="text-[11px] text-slate-500">Official approved results already on scoreboard</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includePublished}
                onChange={(e) => setIncludePublished(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-white border border-amber-200 shadow-2xs cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚡</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Include Draft Results Simulation</div>
                  <div className="text-[11px] text-slate-500">Allow selected draft results to credit points</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeDrafts}
                onChange={(e) => setIncludeDrafts(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
            </label>
          </div>

          {/* Search Drafts Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-amber-700 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search draft programmes by name, code or section..."
              value={draftSearchQuery}
              onChange={(e) => setDraftSearchQuery(e.target.value)}
              className="w-full text-xs bg-white border border-amber-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs text-slate-900 placeholder:text-amber-800/60"
            />
          </div>

          {/* Draft Results Cards Grid */}
          {filteredDraftResults.length === 0 ? (
            <div className="p-8 text-center bg-white/70 rounded-2xl border border-dashed border-amber-300 text-xs text-amber-800">
              {draftResults.length === 0
                ? 'No draft results found in the database. When you save a result as "draft", it will appear here for simulation.'
                : 'No draft results match your search query.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredDraftResults.map(r => {
                const progDoc = findProgramme(r, programmes);
                const pName = getProgrammeName(r, progDoc);
                const pCode = getProgrammeCode(r, progDoc);
                const isSelected = selectedDraftIds.includes(r._id?.toString() || '');
                const secBadge = getSectionTheme(r.section || progDoc?.section);

                return (
                  <div
                    key={r._id?.toString()}
                    onClick={() => toggleDraftSelection(r._id?.toString() || '')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                      isSelected
                        ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                        : 'bg-white hover:bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-amber-700">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-700" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {pCode && (
                          <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-200/70 text-amber-900">
                            {pCode}
                          </span>
                        )}
                        <h5 className="font-bold text-xs text-slate-900 truncate" title={pName}>
                          {pName}
                        </h5>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <span className={`px-1.5 py-0.2 rounded font-bold ${secBadge.badgeBg}`}>
                          {secBadge.label}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{r.positionType}</span>
                      </div>

                      {/* Preview of winners in this draft */}
                      {r.firstPlace && r.firstPlace.length > 0 && (
                        <div className="mt-1.5 text-[10px] text-slate-600 truncate bg-white/70 p-1 rounded-md border border-amber-100">
                          <strong className="text-amber-800">1st:</strong> #{r.firstPlace[0].chestNumber}
                          {r.secondPlace && r.secondPlace.length > 0 && (
                            <span className="ml-2"><strong className="text-slate-600">2nd:</strong> #{r.secondPlace[0].chestNumber}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* 3. CONTROLS BAR: CATEGORY, SECTION, TEAM, SEARCH & SORT                 */}
      {/* ======================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Category Tabs: All, Arts, Sports */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Competitions
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('arts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'arts'
                  ? 'bg-white text-blue-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🎭</span>
              <span>Arts Category</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('sports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'sports'
                  ? 'bg-white text-emerald-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏃</span>
              <span>Sports Category</span>
            </button>
          </div>

          {/* Section Selector Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'all', label: 'All Sections' },
              { id: 'senior', label: 'Senior' },
              { id: 'junior', label: 'Junior' },
              { id: 'sub-junior', label: 'Sub-Junior' },
              { id: 'general', label: 'General' }
            ].map(sec => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSection(sec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSection === sec.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters: Team, Search, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          {/* Team Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">🛡️ All Teams</option>
              {teams.map(t => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search performer by candidate name or chest number (#)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="points">💎 Sort by Points (High to Low)</option>
              <option value="golds">🥇 Sort by Gold Medals</option>
              <option value="wins">🏆 Sort by Total Wins</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 4. TOP 3 STAR PERFORMERS PODIUM CARDS                                   */}
      {/* ======================================================================= */}
      {filteredStarPerformers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1st Place Star Performer (Champion) */}
          {top1 && (
            <div className="md:order-2 bg-gradient-to-b from-amber-50 via-white to-amber-50/40 rounded-3xl p-5 border-2 border-amber-300 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-bl-full pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span>#1 Star Performer</span>
                  </span>

                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-2xs"
                    style={{ backgroundColor: top1.team.color || '#3B82F6' }}
                  >
                    {top1.team.code}
                  </span>
                </div>

                <div className="flex items-center gap-3.5 my-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-amber-300 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    {top1.candidate.profileImage ? (
                      <img
                        src={top1.candidate.profileImage}
                        alt={top1.candidate.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-black text-white text-base"
                        style={{ backgroundColor: top1.team.color || '#6366F1' }}
                      >
                        #{top1.candidate.chestNumber}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-lg leading-tight truncate" title={top1.candidate.name}>
                      {top1.candidate.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold mt-1">
                      <span className="font-mono text-blue-600">#{top1.candidate.chestNumber}</span>
                      <span>•</span>
                      <span className="capitalize">{top1.section || 'General'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Points & Medals breakdown */}
              <div className="pt-3 border-t border-amber-200/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Points</span>
                  <div className="flex items-baseline gap-1 font-black text-2xl text-amber-600">
                    <span>{top1.totalPoints}</span>
                    <span className="text-xs font-semibold text-slate-500">pts</span>
                    {top1.addedDraftPoints > 0 && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md ml-1">
                        (+{top1.addedDraftPoints} draft)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-200 font-bold text-amber-950">
                    <div className="text-[10px] text-amber-700 uppercase font-black">Gold</div>
                    <div className="text-sm font-black">{top1.medals.gold + top1.draftMedals.gold} 🥇</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-black">Silver</div>
                    <div className="text-sm font-black">{top1.medals.silver + top1.draftMedals.silver} 🥈</div>
                  </div>
                  <div className="p-2 rounded-xl bg-orange-100/70 border border-orange-200 font-bold text-orange-950">
                    <div className="text-[10px] text-orange-700 uppercase font-black">Bronze</div>
                    <div className="text-sm font-black">{top1.medals.bronze + top1.draftMedals.bronze} 🥉</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2nd Place Star Performer (Runner-up) */}
          {top2 && (
            <div className="md:order-1 bg-gradient-to-b from-slate-50 via-white to-slate-50/40 rounded-3xl p-5 border border-slate-300 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-800 shadow-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <Medal className="w-3.5 h-3.5 text-slate-600" />
                    <span>#2 Runner-Up</span>
                  </span>

                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-2xs"
                    style={{ backgroundColor: top2.team.color || '#3B82F6' }}
                  >
                    {top2.team.code}
                  </span>
                </div>

                <div className="flex items-center gap-3.5 my-3">
                  <div className="w-13 h-13 rounded-2xl bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                    {top2.candidate.profileImage ? (
                      <img
                        src={top2.candidate.profileImage}
                        alt={top2.candidate.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-black text-white text-sm"
                        style={{ backgroundColor: top2.team.color || '#6366F1' }}
                      >
                        #{top2.candidate.chestNumber}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-base leading-tight truncate" title={top2.candidate.name}>
                      {top2.candidate.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold mt-1">
                      <span className="font-mono text-blue-600">#{top2.candidate.chestNumber}</span>
                      <span>•</span>
                      <span className="capitalize">{top2.section || 'General'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Points & Medals breakdown */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Points</span>
                  <div className="flex items-baseline gap-1 font-black text-2xl text-slate-800">
                    <span>{top2.totalPoints}</span>
                    <span className="text-xs font-semibold text-slate-500">pts</span>
                    {top2.addedDraftPoints > 0 && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md ml-1">
                        (+{top2.addedDraftPoints} draft)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-1.5 rounded-xl bg-slate-100 font-bold text-slate-800">
                    <div className="text-[10px] text-slate-500">Gold</div>
                    <div className="text-xs font-black">{top2.medals.gold + top2.draftMedals.gold} 🥇</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-100 font-bold text-slate-800">
                    <div className="text-[10px] text-slate-500">Silver</div>
                    <div className="text-xs font-black">{top2.medals.silver + top2.draftMedals.silver} 🥈</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-100 font-bold text-slate-800">
                    <div className="text-[10px] text-slate-500">Bronze</div>
                    <div className="text-xs font-black">{top2.medals.bronze + top2.draftMedals.bronze} 🥉</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place Star Performer (2nd Runner-up) */}
          {top3 && (
            <div className="md:order-3 bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30 rounded-3xl p-5 border border-orange-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-900 shadow-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <Medal className="w-3.5 h-3.5 text-orange-700" />
                    <span>#3 2nd Runner-Up</span>
                  </span>

                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-2xs"
                    style={{ backgroundColor: top3.team.color || '#3B82F6' }}
                  >
                    {top3.team.code}
                  </span>
                </div>

                <div className="flex items-center gap-3.5 my-3">
                  <div className="w-13 h-13 rounded-2xl bg-slate-100 border border-orange-200 overflow-hidden flex items-center justify-center shrink-0">
                    {top3.candidate.profileImage ? (
                      <img
                        src={top3.candidate.profileImage}
                        alt={top3.candidate.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-black text-white text-sm"
                        style={{ backgroundColor: top3.team.color || '#6366F1' }}
                      >
                        #{top3.candidate.chestNumber}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-base leading-tight truncate" title={top3.candidate.name}>
                      {top3.candidate.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold mt-1">
                      <span className="font-mono text-blue-600">#{top3.candidate.chestNumber}</span>
                      <span>•</span>
                      <span className="capitalize">{top3.section || 'General'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Points & Medals breakdown */}
              <div className="pt-3 border-t border-orange-200 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Points</span>
                  <div className="flex items-baseline gap-1 font-black text-2xl text-orange-700">
                    <span>{top3.totalPoints}</span>
                    <span className="text-xs font-semibold text-slate-500">pts</span>
                    {top3.addedDraftPoints > 0 && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md ml-1">
                        (+{top3.addedDraftPoints} draft)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-1.5 rounded-xl bg-slate-100 font-bold text-slate-800">
                    <div className="text-[10px] text-slate-500">Gold</div>
                    <div className="text-xs font-black">{top3.medals.gold + top3.draftMedals.gold} 🥇</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-100 font-bold text-slate-800">
                    <div className="text-[10px] text-slate-500">Silver</div>
                    <div className="text-xs font-black">{top3.medals.silver + top3.draftMedals.silver} 🥈</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-100 font-bold text-slate-800">
                    <div className="text-[10px] text-slate-500">Bronze</div>
                    <div className="text-xs font-black">{top3.medals.bronze + top3.draftMedals.bronze} 🥉</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* 5. FULL STAR PERFORMERS RANKINGS LIST / TABLE                           */}
      {/* ======================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Candidate Standings List
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {filteredStarPerformers.length} Performers
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any candidate card to view the exact competitions and points they won.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Category: <strong className="capitalize text-slate-900">{selectedCategory === 'all' ? 'All Competitions' : selectedCategory}</strong> • Section: <strong className="capitalize text-slate-900">{selectedSection === 'all' ? 'All' : selectedSection}</strong>
          </div>
        </div>

        {/* Empty State */}
        {filteredStarPerformers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-base">No Star Performers Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No candidates have points in individual programmes matching your filters. Try clearing your search or enabling draft simulation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStarPerformers.map(performer => {
              const isExpanded = expandedCandidateChest === performer.candidate.chestNumber;
              const hasDraftPoints = performer.addedDraftPoints > 0;
              const totalGolds = performer.medals.gold + performer.draftMedals.gold;
              const totalSilvers = performer.medals.silver + performer.draftMedals.silver;
              const totalBronzes = performer.medals.bronze + performer.draftMedals.bronze;

              return (
                <div
                  key={performer.candidate.chestNumber}
                  className={`transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50/70'}`}
                >
                  {/* Performer Summary Row */}
                  <div
                    onClick={() => setExpandedCandidateChest(isExpanded ? null : performer.candidate.chestNumber)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    {/* Left: Rank + Avatar + Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Emblem */}
                      <div className="shrink-0 flex items-center justify-center">
                        {performer.rank === 1 ? (
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs">
                            🥇
                          </div>
                        ) : performer.rank === 2 ? (
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 font-black text-sm flex items-center justify-center shadow-xs">
                            🥈
                          </div>
                        ) : performer.rank === 3 ? (
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-200 to-amber-200 text-orange-950 font-black text-sm flex items-center justify-center shadow-xs">
                            🥉
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center border border-slate-200">
                            #{performer.rank}
                          </div>
                        )}
                      </div>

                      {/* Candidate Avatar */}
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
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

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                            {performer.candidate.name}
                          </h4>
                          {performer.rank === 1 && <span className="text-sm">👑</span>}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-medium">
                          <span className="font-mono font-bold text-blue-600">#{performer.candidate.chestNumber}</span>
                          <span>•</span>
                          <span
                            className="px-2 py-0.2 rounded-md text-[10px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: performer.team.color || '#64748B' }}
                          >
                            {performer.team.name || performer.team.code}
                          </span>
                          {performer.section && (
                            <>
                              <span>•</span>
                              <span className="capitalize text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.2 rounded">
                                {performer.section}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Medals & Points */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0">
                      {/* Medals row */}
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {totalGolds > 0 && (
                          <span className="bg-amber-100 text-amber-950 px-2 py-1 rounded-lg border border-amber-200">
                            🥇 {totalGolds}
                          </span>
                        )}
                        {totalSilvers > 0 && (
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg border border-slate-200">
                            🥈 {totalSilvers}
                          </span>
                        )}
                        {totalBronzes > 0 && (
                          <span className="bg-orange-100 text-orange-950 px-2 py-1 rounded-lg border border-orange-200">
                            🥉 {totalBronzes}
                          </span>
                        )}
                        {performer.gradesCount > 0 && (
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200 text-[11px]">
                            🎖️ {performer.gradesCount} {performer.gradesCount === 1 ? 'Grade' : 'Grades'}
                          </span>
                        )}
                      </div>

                      {/* Total Points */}
                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1 font-black text-xl text-slate-900">
                          <span>{performer.totalPoints}</span>
                          <span className="text-xs font-semibold text-slate-500">pts</span>
                        </div>
                        {hasDraftPoints && (
                          <div className="text-[11px] font-bold text-amber-700 flex items-center justify-end gap-1">
                            <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>+{performer.addedDraftPoints} draft pts</span>
                          </div>
                        )}
                      </div>

                      {/* Expand Chevron */}
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Achievements Drawer */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 animate-in fade-in duration-200">
                      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b pb-2">
                          <span>Detailed Achievements for #{performer.candidate.chestNumber} ({performer.achievements.length} competitions)</span>
                          <Link
                            href={`/profiles/${performer.candidate._id || performer.candidate.chestNumber}`}
                            target="_blank"
                            className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                          >
                            <span>Open Candidate Profile ↗</span>
                          </Link>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {performer.achievements.map((ach, idx) => (
                            <div
                              key={idx}
                              className="py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                  {ach.programmeCode}
                                </span>
                                <span className="font-bold text-slate-900 truncate">
                                  {ach.programmeName}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold capitalize">
                                  {ach.section}
                                </span>
                                {ach.isDraft ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5 fill-current" /> Draft Simulation
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                    Published
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                {/* Position badge */}
                                {ach.position === 1 && (
                                  <span className="font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                                    🥇 1st Place (+{ach.positionPoints} pts)
                                  </span>
                                )}
                                {ach.position === 2 && (
                                  <span className="font-extrabold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                    🥈 2nd Place (+{ach.positionPoints} pts)
                                  </span>
                                )}
                                {ach.position === 3 && (
                                  <span className="font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
                                    🥉 3rd Place (+{ach.positionPoints} pts)
                                  </span>
                                )}

                                {/* Grade badge */}
                                {ach.grade && (
                                  <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                                    Grade {ach.grade} (+{ach.gradePoints} pts)
                                  </span>
                                )}

                                <span className="font-black text-slate-900">
                                  +{ach.totalPoints} pts
                                </span>

                                {onEditResult && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditResult(ach.result);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition-colors"
                                    title="Edit this result"
                                  >
                                    Edit Result
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

