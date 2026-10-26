"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Team, Result, Candidate, Programme } from '@/types';
import { findProgramme, getResultPublishedTime, getDefaultGradePoints } from '@/lib/resultsHelper';
import { classifyProgramme } from '@/lib/profileHelper';

export interface WinnerItem {
  type: 'individual' | 'team';
  name: string;
  team?: string;
  teamColor?: string;
  chestNumber?: string;
  grade?: string;
  points?: number;
}

interface ProgrammeResult {
  programme: Programme;
  result: Result;
  winners: {
    first: WinnerItem[];
    second: WinnerItem[];
    third: WinnerItem[];
    gradedOnly: WinnerItem[];
  };
}

interface CategoryResults {
  category: string;
  totalProgrammes: number;
  completedProgrammes: number;
  totalWinners: number;
  topTeam: string;
  topTeamColor: string;
}

interface SectionResults {
  section: string;
  programmes: ProgrammeResult[];
  totalWinners: number;
  teamPerformance: {
    [teamCode: string]: {
      name: string;
      color: string;
      wins: number;
      points: number;
    }
  };
}

export default function ResultsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [programmeResults, setProgrammeResults] = useState<ProgrammeResult[]>([]);
  const [categoryResults, setCategoryResults] = useState<CategoryResults[]>([]);
  const [sectionResults, setSectionResults] = useState<SectionResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'programmes' | 'categories' | 'sections'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'arts' | 'sports'>('arts');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedProgrammeSection, setSelectedProgrammeSection] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recently-added' | 'first-added' | 'name-asc'>('recently-added');

  // Fetch data from APIs
  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, resultsRes, candidatesRes, programmesRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/results'),
        fetch('/api/candidates'),
        fetch('/api/programmes')
      ]);

      const [teamsData, resultsData, candidatesData, programmesData] = await Promise.all([
        teamsRes.json(),
        resultsRes.json(),
        candidatesRes.json(),
        programmesRes.json()
      ]);

      setTeams(teamsData || []);
      setResults(resultsData || []);
      setCandidates(candidatesData || []);
      setProgrammes(programmesData || []);
      setLastUpdated(new Date());

      // Process results data
      processResultsData(teamsData, resultsData, candidatesData, programmesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processResultsData = (teamsData: Team[], resultsData: Result[], candidatesData: Candidate[], programmesData: Programme[]) => {
    // Process programme results
    const programmeResultsList: ProgrammeResult[] = resultsData.map(result => {
      const programme = findProgramme(result, programmesData);
      if (!programme) return null;

      // Grade lookups
      const pgMap = new Map<string, { grade: string; points: number }>();
      (result.participationGrades || []).forEach(pg => {
        if (pg.chestNumber) {
          const pts = pg.points !== undefined && pg.points !== null ? pg.points : getDefaultGradePoints(pg.grade);
          pgMap.set(String(pg.chestNumber).trim(), { grade: pg.grade, points: pts });
        }
      });

      const tgMap = new Map<string, { grade: string; points: number }>();
      (result.participationTeamGrades || []).forEach(tg => {
        if (tg.teamCode) {
          const pts = tg.points !== undefined && tg.points !== null ? tg.points : getDefaultGradePoints(tg.grade);
          tgMap.set(String(tg.teamCode).trim().toUpperCase(), { grade: tg.grade, points: pts });
        }
      });

      const firstChestSet = new Set<string>();
      const secondChestSet = new Set<string>();
      const thirdChestSet = new Set<string>();
      const firstTeamSet = new Set<string>();
      const secondTeamSet = new Set<string>();
      const thirdTeamSet = new Set<string>();

      const first: WinnerItem[] = [
        ...(result.firstPlace || []).map(p => {
          const chest = String(p.chestNumber || '').trim();
          firstChestSet.add(chest);
          const candidate = candidatesData.find(c => c.chestNumber === p.chestNumber);
          const team = teamsData.find(t => t.code === candidate?.team);
          const gradeInfo = pgMap.get(chest);
          return {
            type: 'individual' as const,
            name: candidate?.name || 'Unknown',
            team: team?.name,
            teamColor: team?.color,
            chestNumber: p.chestNumber,
            grade: (p as any).grade || gradeInfo?.grade,
            points: result.firstPoints
          };
        }),
        ...(result.firstPlaceTeams || []).map(t => {
          const code = String(t.teamCode || '').trim().toUpperCase();
          firstTeamSet.add(code);
          const team = teamsData.find(team => team.code === t.teamCode);
          const gradeInfo = tgMap.get(code);
          return {
            type: 'team' as const,
            name: team?.name || t.teamCode,
            team: team?.name,
            teamColor: team?.color,
            grade: (t as any).grade || gradeInfo?.grade,
            points: result.firstPoints
          };
        })
      ];

      const second: WinnerItem[] = [
        ...(result.secondPlace || []).map(p => {
          const chest = String(p.chestNumber || '').trim();
          secondChestSet.add(chest);
          const candidate = candidatesData.find(c => c.chestNumber === p.chestNumber);
          const team = teamsData.find(t => t.code === candidate?.team);
          const gradeInfo = pgMap.get(chest);
          return {
            type: 'individual' as const,
            name: candidate?.name || 'Unknown',
            team: team?.name,
            teamColor: team?.color,
            chestNumber: p.chestNumber,
            grade: (p as any).grade || gradeInfo?.grade,
            points: result.secondPoints
          };
        }),
        ...(result.secondPlaceTeams || []).map(t => {
          const code = String(t.teamCode || '').trim().toUpperCase();
          secondTeamSet.add(code);
          const team = teamsData.find(team => team.code === t.teamCode);
          const gradeInfo = tgMap.get(code);
          return {
            type: 'team' as const,
            name: team?.name || t.teamCode,
            team: team?.name,
            teamColor: team?.color,
            grade: (t as any).grade || gradeInfo?.grade,
            points: result.secondPoints
          };
        })
      ];

      const third: WinnerItem[] = [
        ...(result.thirdPlace || []).map(p => {
          const chest = String(p.chestNumber || '').trim();
          thirdChestSet.add(chest);
          const candidate = candidatesData.find(c => c.chestNumber === p.chestNumber);
          const team = teamsData.find(t => t.code === candidate?.team);
          const gradeInfo = pgMap.get(chest);
          return {
            type: 'individual' as const,
            name: candidate?.name || 'Unknown',
            team: team?.name,
            teamColor: team?.color,
            chestNumber: p.chestNumber,
            grade: (p as any).grade || gradeInfo?.grade,
            points: result.thirdPoints
          };
        }),
        ...(result.thirdPlaceTeams || []).map(t => {
          const code = String(t.teamCode || '').trim().toUpperCase();
          thirdTeamSet.add(code);
          const team = teamsData.find(team => team.code === t.teamCode);
          const gradeInfo = tgMap.get(code);
          return {
            type: 'team' as const,
            name: team?.name || t.teamCode,
            team: team?.name,
            teamColor: team?.color,
            grade: (t as any).grade || gradeInfo?.grade,
            points: result.thirdPoints
          };
        })
      ];

      // Graded candidates who did NOT get 1st, 2nd, or 3rd prize
      const gradedOnly: WinnerItem[] = [];

      (result.participationGrades || []).forEach(pg => {
        const chest = String(pg.chestNumber || '').trim();
        if (!firstChestSet.has(chest) && !secondChestSet.has(chest) && !thirdChestSet.has(chest)) {
          const candidate = candidatesData.find(c => c.chestNumber === pg.chestNumber);
          const team = teamsData.find(t => t.code === candidate?.team);
          gradedOnly.push({
            type: 'individual',
            name: candidate?.name || `Candidate #${pg.chestNumber}`,
            team: team?.name,
            teamColor: team?.color,
            chestNumber: pg.chestNumber,
            grade: pg.grade,
            points: pg.points !== undefined && pg.points !== null ? pg.points : getDefaultGradePoints(pg.grade)
          });
        }
      });

      (result.participationTeamGrades || []).forEach(tg => {
        const code = String(tg.teamCode || '').trim().toUpperCase();
        if (!firstTeamSet.has(code) && !secondTeamSet.has(code) && !thirdTeamSet.has(code)) {
          const team = teamsData.find(t => t.code === tg.teamCode);
          gradedOnly.push({
            type: 'team',
            name: team?.name || tg.teamCode,
            team: team?.name,
            teamColor: team?.color,
            grade: tg.grade,
            points: tg.points !== undefined && tg.points !== null ? tg.points : getDefaultGradePoints(tg.grade)
          });
        }
      });

      const winners = {
        first,
        second,
        third,
        gradedOnly
      };

      return { programme, result, winners };
    }).filter(Boolean) as ProgrammeResult[];

    // Sort by publication time: latest published first
    programmeResultsList.sort((a, b) => {
      const timeA = getResultPublishedTime(a.result);
      const timeB = getResultPublishedTime(b.result);
      if (timeA !== timeB) return timeB - timeA;
      const idA = String(a.result._id || '');
      const idB = String(b.result._id || '');
      if (idA && idB && idA !== idB) return idB.localeCompare(idA);
      return (a.programme.code || '').localeCompare(b.programme.code || '');
    });

    setProgrammeResults(programmeResultsList);

    // Process category results
    const categoryStats: { [category: string]: CategoryResults } = {};
    
    programmesData.forEach(programme => {
      if (!categoryStats[programme.category]) {
        categoryStats[programme.category] = {
          category: programme.category,
          totalProgrammes: 0,
          completedProgrammes: 0,
          totalWinners: 0,
          topTeam: '',
          topTeamColor: '#6B7280'
        };
      }
      categoryStats[programme.category].totalProgrammes += 1;
    });

    programmeResultsList.forEach(pr => {
      if (categoryStats[pr.programme.category]) {
        categoryStats[pr.programme.category].completedProgrammes += 1;
        categoryStats[pr.programme.category].totalWinners += 
          pr.winners.first.length + pr.winners.second.length + pr.winners.third.length;
      }
    });

    setCategoryResults(Object.values(categoryStats));

    // Process section results
    const sectionStats: { [section: string]: SectionResults } = {};
    
    candidatesData.forEach(candidate => {
      if (!sectionStats[candidate.section]) {
        sectionStats[candidate.section] = {
          section: candidate.section,
          programmes: [],
          totalWinners: 0,
          teamPerformance: {}
        };
      }
    });

    programmeResultsList.forEach(pr => {
      pr.winners.first.concat(pr.winners.second, pr.winners.third).forEach(winner => {
        if (winner.type === 'individual' && winner.chestNumber) {
          const candidate = candidatesData.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && sectionStats[candidate.section]) {
            if (!sectionStats[candidate.section].programmes.find(p => p.result._id === pr.result._id)) {
              sectionStats[candidate.section].programmes.push(pr);
            }
            sectionStats[candidate.section].totalWinners += 1;
            
            const team = teamsData.find(t => t.code === candidate.team);
            if (team) {
              if (!sectionStats[candidate.section].teamPerformance[team.code]) {
                sectionStats[candidate.section].teamPerformance[team.code] = {
                  name: team.name,
                  color: team.color,
                  wins: 0,
                  points: 0
                };
              }
              sectionStats[candidate.section].teamPerformance[team.code].wins += 1;
              sectionStats[candidate.section].teamPerformance[team.code].points += 
                pr.winners.first.some(w => w.chestNumber === winner.chestNumber) ? 5 :
                pr.winners.second.some(w => w.chestNumber === winner.chestNumber) ? 3 : 1;
            }
          }
        }
      });
    });

    setSectionResults(Object.values(sectionStats));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFilteredResults = () => {
    const filtered = programmeResults.filter(pr => {
      const progName = pr.programme.name || '';
      const progCode = pr.programme.code || '';
      const progSec = (pr.result.section || pr.programme.section || '').toLowerCase();

      const matchesSearch =
        progName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        progCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        progSec.includes(searchTerm.toLowerCase());
      const rawCat = (pr.programme.category || (pr.result as any).category || '').toLowerCase().trim();
      const prCat = rawCat === 'sports' ? 'sports' : rawCat === 'arts' ? 'arts' : classifyProgramme(pr.programme, pr.programme?.code, pr.result.programme).category || 'arts';
      const matchesCategory = prCat === selectedCategory;
      const matchesSection = selectedProgrammeSection === 'all' || progSec === selectedProgrammeSection.toLowerCase();

      return matchesSearch && matchesCategory && matchesSection;
    });

    return filtered.sort((a, b) => {
      if (sortOrder === 'recently-added') {
        const timeA = getResultPublishedTime(a.result);
        const timeB = getResultPublishedTime(b.result);
        if (timeA !== timeB) return timeB - timeA; // Latest published first
        const idA = String(a.result._id || '');
        const idB = String(b.result._id || '');
        if (idA && idB && idA !== idB) return idB.localeCompare(idA);
        return (a.programme.code || '').localeCompare(b.programme.code || '');
      } else if (sortOrder === 'first-added') {
        const timeA = getResultPublishedTime(a.result);
        const timeB = getResultPublishedTime(b.result);
        if (timeA !== timeB) return timeA - timeB; // Oldest published first
        const idA = String(a.result._id || '');
        const idB = String(b.result._id || '');
        if (idA && idB && idA !== idB) return idA.localeCompare(idB);
        return (a.programme.code || '').localeCompare(b.programme.code || '');
      } else if (sortOrder === 'name-asc') {
        return (a.programme.name || '').localeCompare(b.programme.name || '');
      }
      return 0;
    });
  };

  const formatResultTime = (timestamp: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    let relative = '';
    if (diffMins < 1) relative = 'Just now';
    else if (diffMins < 60) relative = `${diffMins}m ago`;
    else if (diffHours < 24) relative = `${diffHours}h ago`;
    else {
      const diffDays = Math.floor(diffHours / 24);
      relative = `${diffDays}d ago`;
    }

    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatted = isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;

    return { formatted, relative };
  };

  const getSectionBadgeStyle = (sec?: string) => {
    switch ((sec || '').toLowerCase()) {
      case 'senior':
        return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'junior':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'subjunior':
      case 'sub-junior':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getFilteredSectionResults = () => {
    if (selectedSection === 'all') return sectionResults;
    return sectionResults.filter(sr => sr.section === selectedSection);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Loading results...</p>
        </div>
      </div>
    );
  }

  const categories = [...new Set(programmes.map(p => p.category))].filter(Boolean);
  const sections = [...new Set(candidates.map(c => c.section))].filter(Boolean);
  const programmeSections = Array.from(
    new Set([
      'senior',
      'junior',
      'sub-junior',
      'general',
      ...programmeResults.map(pr => (pr.result.section || pr.programme.section || '').toLowerCase()).filter(Boolean)
    ])
  );
  const filteredResults = getFilteredResults();
  const filteredSectionResults = getFilteredSectionResults();

  return (
    <div className="min-h-screen bg-gray-50"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}>
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-6">
              <span className="text-white text-2xl">🏆</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Competition Results
            </h1>
            <p className="text-xl text-green-100 mb-6 max-w-3xl mx-auto">
              Complete results and winners from Ayyuhannas Arts & Sports Festival 2K26
            </p>
            <div className="flex items-center justify-center space-x-4 text-green-200">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Live Results
              </span>
              <span>•</span>
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between border-b px-2">
            <div className="flex flex-wrap">
              {[
                { key: 'overview', label: '📊 Overview', icon: '📊' },
                { key: 'programmes', label: '🎭 Programme Results', icon: '🎭' },
                { key: 'categories', label: '📂 Category Results', icon: '📂' },
                { key: 'sections', label: '🏛️ Section Results', icon: '🏛️' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-4 font-medium text-sm md:text-base transition-colors duration-200 ${
                    activeTab === tab.key
                      ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.icon}</span>
                </button>
              ))}
            </div>

            <div className="py-2 px-3">
              <Link
                href="/result-screen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all"
                title="Launch Live TV Screening Mode"
              >
                <span>📺</span>
                <span>TV Screening Mode ↗</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-xl">🎭</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{programmes.length}</div>
                    <div className="text-sm text-gray-500">Total Programmes</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-xl">✅</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                    <div className="text-sm text-gray-500">Completed Results</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-xl">🏆</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {programmeResults.reduce((sum, pr) => sum + pr.winners.first.length + pr.winners.second.length + pr.winners.third.length, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Winners</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round((results.length / programmes.length) * 100) || 0}%
                    </div>
                    <div className="text-sm text-gray-500">Completion Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Results */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white">🏆 Recent Results</h2>
                <p className="text-green-100">Latest competition outcomes</p>
              </div>
              
              <div className="p-6">
                {programmeResults.length > 0 ? (
                  <div className="space-y-6">
                    {[...programmeResults]
                      .sort((a, b) => getResultPublishedTime(b.result) - getResultPublishedTime(a.result))
                      .slice(0, 5)
                      .map((pr, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{pr.programme.name}</h3>
                            <p className="text-gray-600">{pr.programme.category} • <span className="capitalize font-medium">{(pr.result.section || pr.programme.section || '').replace('-', ' ')}</span></p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {pr.programme.category}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* First Place */}
                          {pr.winners.first.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">🥇</span>
                                <h4 className="font-bold text-yellow-700">First Place</h4>
                              </div>
                              {pr.winners.first.map((winner, idx) => (
                                <div key={idx} className="text-sm">
                                  <p className="font-semibold">{winner.name}</p>
                                  {winner.type === 'individual' && (
                                    <p className="text-gray-600">#{winner.chestNumber} • {winner.team}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Second Place */}
                          {pr.winners.second.length > 0 && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">🥈</span>
                                <h4 className="font-bold text-gray-700">Second Place</h4>
                              </div>
                              {pr.winners.second.map((winner, idx) => (
                                <div key={idx} className="text-sm">
                                  <p className="font-semibold">{winner.name}</p>
                                  {winner.type === 'individual' && (
                                    <p className="text-gray-600">#{winner.chestNumber} • {winner.team}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Third Place */}
                          {pr.winners.third.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">🥉</span>
                                <h4 className="font-bold text-orange-700">Third Place</h4>
                              </div>
                              {pr.winners.third.map((winner, idx) => (
                                <div key={idx} className="text-sm">
                                  <p className="font-semibold">{winner.name}</p>
                                  {winner.type === 'individual' && (
                                    <p className="text-gray-600">#{winner.chestNumber} • {winner.team}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🏆</div>
                    <p className="text-gray-500">No results available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Programme Results Tab */}
        {activeTab === 'programmes' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <input
                    type="text"
                    placeholder="Search programmes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <div className="inline-flex p-1 bg-gray-100 rounded-lg border border-gray-200 w-full justify-center">
                    {(['arts', 'sports'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedCategory === cat
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <span>{cat === 'arts' ? '🎨' : '⚽'}</span>
                        <span>{cat === 'arts' ? 'Arts' : 'Sports'}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <select
                    value={selectedProgrammeSection}
                    onChange={(e) => setSelectedProgrammeSection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent capitalize bg-white text-gray-700 font-medium"
                  >
                    <option value="all">All Sections</option>
                    {programmeSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec.charAt(0).toUpperCase() + sec.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-700 font-medium"
                  >
                    <option value="recently-added">⚡ Order: Latest Published on Top</option>
                    <option value="first-added">⏳ Order: Oldest Published First</option>
                    <option value="name-asc">🔤 Order: Programme Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Quick Section Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
                  <span>🏛️</span>
                  <span>Section:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedProgrammeSection('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedProgrammeSection === 'all'
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({programmeResults.filter(pr => {
                    const rawCat = (pr.programme.category || (pr.result as any).category || '').toLowerCase().trim();
                    const cat = rawCat === 'sports' ? 'sports' : rawCat === 'arts' ? 'arts' : classifyProgramme(pr.programme, pr.programme?.code, pr.result.programme).category || 'arts';
                    return cat === selectedCategory;
                  }).length})
                </button>
                {programmeSections.map((sec) => {
                  const count = programmeResults.filter(pr => {
                    const rawCat = (pr.programme.category || (pr.result as any).category || '').toLowerCase().trim();
                    const cat = rawCat === 'sports' ? 'sports' : rawCat === 'arts' ? 'arts' : classifyProgramme(pr.programme, pr.programme?.code, pr.result.programme).category || 'arts';
                    const secMatch = (pr.result.section || pr.programme.section || '').toLowerCase() === sec.toLowerCase();
                    return cat === selectedCategory && secMatch;
                  }).length;
                  const isSelected = selectedProgrammeSection.toLowerCase() === sec.toLowerCase();
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedProgrammeSection(sec)}
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-green-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {sec.replace('-', ' ')} ({count})
                    </button>
                  );
                })}

                <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    Showing <strong className="text-gray-900">{filteredResults.length}</strong> {selectedCategory} results
                  </span>
                  {(selectedProgrammeSection !== 'all' || searchTerm) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProgrammeSection('all');
                        setSelectedCategory('arts');
                        setSearchTerm('');
                      }}
                      className="ml-2 font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Clear Filters ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Programme Results */}
            <div className="space-y-6">
              {filteredResults.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                  <div className="text-6xl mb-4">🎭</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No {selectedCategory === 'arts' ? 'Arts' : 'Sports'} Results Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedProgrammeSection !== 'all'
                      ? 'Try adjusting your search or section filter.'
                      : `Results for ${selectedCategory} will appear here once competitions are completed.`}
                  </p>
                  {(searchTerm || selectedProgrammeSection !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('arts');
                        setSelectedProgrammeSection('all');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      ↺ Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredResults.map((pr, index) => {
                  const publishedTime = getResultPublishedTime(pr.result);
                  const timeInfo = formatResultTime(publishedTime);
                  const isLatest = sortOrder === 'recently-added' && index === 0;
                  const secName = pr.result.section || pr.programme.section;

                  return (
                    <div
                      key={pr.result._id?.toString() || index}
                      className={`bg-white rounded-lg shadow-md border p-6 transition-all ${
                        isLatest ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-lg' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {pr.programme.code && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono border border-gray-200">
                                {pr.programme.code}
                              </span>
                            )}
                            <h3 className="text-xl font-bold text-gray-900">{pr.programme.name}</h3>
                            {isLatest && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs animate-pulse">
                                ⚡ Latest Published
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span className="font-semibold text-gray-700">{pr.programme.category}</span>
                            {secName && (
                              <>
                                <span>•</span>
                                <span className={`capitalize px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSectionBadgeStyle(secName)}`}>
                                  {secName.replace('-', ' ')} Section
                                </span>
                              </>
                            )}
                            {timeInfo && (
                              <>
                                <span>•</span>
                                <span
                                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-md font-medium"
                                  title={`Published on ${new Date(publishedTime).toLocaleString()}`}
                                >
                                  <span>🕒</span>
                                  <span>Published: {timeInfo.formatted}</span>
                                  {timeInfo.relative && (
                                    <span className="text-emerald-700 font-bold">({timeInfo.relative})</span>
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="self-start bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border border-green-200 shrink-0">
                          {pr.programme.category}
                        </span>
                      </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* First Place */}
                      {pr.winners.first.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🥇</span>
                            <h4 className="font-bold text-yellow-600">First Place</h4>
                          </div>
                          <div className="space-y-2">
                            {pr.winners.first.map((winner, idx) => (
                              <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-gray-900">{winner.name}</p>
                                  {winner.grade && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-yellow-200 text-yellow-900 border border-yellow-300 shadow-2xs shrink-0">
                                      Grade {winner.grade}
                                    </span>
                                  )}
                                </div>
                                {winner.type === 'individual' && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    #{winner.chestNumber} • {winner.team}
                                  </p>
                                )}
                                {winner.type === 'team' && (
                                  <p className="text-sm text-gray-600 mt-1">Team Event</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Second Place */}
                      {pr.winners.second.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🥈</span>
                            <h4 className="font-bold text-gray-600">Second Place</h4>
                          </div>
                          <div className="space-y-2">
                            {pr.winners.second.map((winner, idx) => (
                              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-gray-900">{winner.name}</p>
                                  {winner.grade && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs shrink-0">
                                      Grade {winner.grade}
                                    </span>
                                  )}
                                </div>
                                {winner.type === 'individual' && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    #{winner.chestNumber} • {winner.team}
                                  </p>
                                )}
                                {winner.type === 'team' && (
                                  <p className="text-sm text-gray-600 mt-1">Team Event</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Third Place */}
                      {pr.winners.third.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🥉</span>
                            <h4 className="font-bold text-orange-600">Third Place</h4>
                          </div>
                          <div className="space-y-2">
                            {pr.winners.third.map((winner, idx) => (
                              <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-gray-900">{winner.name}</p>
                                  {winner.grade && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-orange-100 text-orange-900 border border-orange-200 shadow-2xs shrink-0">
                                      Grade {winner.grade}
                                    </span>
                                  )}
                                </div>
                                {winner.type === 'individual' && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    #{winner.chestNumber} • {winner.team}
                                  </p>
                                )}
                                {winner.type === 'team' && (
                                  <p className="text-sm text-gray-600 mt-1">Team Event</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Graded Candidates Section (Grade without podium prize) */}
                    {pr.winners.gradedOnly && pr.winners.gradedOnly.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">🎖️</span>
                          <h4 className="font-bold text-purple-800 text-sm">
                            Grade Holders ({pr.winners.gradedOnly.length})
                          </h4>
                          <span className="text-xs text-gray-500">
                            • Candidates who achieved grade
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {pr.winners.gradedOnly.map((winner, idx) => (
                            <div
                              key={idx}
                              className="bg-purple-50/70 border border-purple-200/80 rounded-lg p-3 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-semibold text-sm text-gray-900">{winner.name}</p>
                                <p className="text-xs text-gray-600">
                                  {winner.type === 'individual'
                                    ? `#${winner.chestNumber} • ${winner.team || 'Unknown Team'}`
                                    : winner.team || 'Team Event'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-purple-600 text-white shadow-xs">
                                  Grade {winner.grade}
                                </span>
                                {winner.points ? (
                                  <span className="text-xs font-bold text-purple-800">
                                    +{winner.points} pts
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
          </div>
        )}

        {/* Category Results Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white">📂 Category Results</h2>
                <p className="text-blue-100">Performance breakdown by competition categories</p>
              </div>
              
              <div className="p-6">
                {categoryResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryResults.map((category, index) => (
                      <div key={index} className="border rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{category.category}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Programmes:</span>
                            <span className="font-bold">{category.totalProgrammes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completed:</span>
                            <span className="font-bold text-green-600">{category.completedProgrammes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Winners:</span>
                            <span className="font-bold text-purple-600">{category.totalWinners}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${(category.completedProgrammes / category.totalProgrammes) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-500 text-center">
                            {Math.round((category.completedProgrammes / category.totalProgrammes) * 100)}% Complete
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📂</div>
                    <p className="text-gray-500">No category data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section Results Tab */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            {/* Section Filter */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Sections</option>
                  {sections.map((section, idx) => (
                    <option key={idx} value={section}>{section}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section Results */}
            {filteredSectionResults.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">🏛️ {section.section} Section</h2>
                  <p className="text-orange-100">
                    {section.programmes.length} programmes • {section.totalWinners} winners
                  </p>
                </div>
                
                <div className="p-6">
                  {/* Team Performance in Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Team Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(section.teamPerformance)
                        .sort(([,a], [,b]) => b.points - a.points)
                        .map(([teamCode, teamData], index) => (
                        <div key={teamCode} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-bold">{teamData.name}</h4>
                              <p className="text-sm text-gray-600">{teamCode}</p>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Points:</span>
                            <span className="font-bold" style={{ color: teamData.color }}>{teamData.points}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Wins:</span>
                            <span className="font-bold text-green-600">{teamData.wins}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Programme Results in Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Programme Results</h3>
                    <div className="space-y-4">
                      {section.programmes.slice(0, 5).map((pr, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-bold text-gray-900 mb-2">{pr.programme.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {pr.winners.first.length > 0 && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                <p className="font-bold text-yellow-700 text-sm">🥇 First</p>
                                {pr.winners.first.map((winner, idx) => (
                                  <p key={idx} className="text-sm">{winner.name}</p>
                                ))}
                              </div>
                            )}
                            {pr.winners.second.length > 0 && (
                              <div className="bg-gray-50 border border-gray-200 rounded p-2">
                                <p className="font-bold text-gray-700 text-sm">🥈 Second</p>
                                {pr.winners.second.map((winner, idx) => (
                                  <p key={idx} className="text-sm">{winner.name}</p>
                                ))}
                              </div>
                            )}
                            {pr.winners.third.length > 0 && (
                              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                                <p className="font-bold text-orange-700 text-sm">🥉 Third</p>
                                {pr.winners.third.map((winner, idx) => (
                                  <p key={idx} className="text-sm">{winner.name}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {programmeResults.length === 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Results Available</h2>
            <p className="text-gray-600">
              Competition results will appear here once events are completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}