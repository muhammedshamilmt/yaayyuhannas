'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Team, Candidate, Programme, Result, FestivalInfo, Schedule } from '@/types';

interface DashboardStats {
  totalTeams: number;
  totalCandidates: number;
  totalProgrammes: number;
  totalResults: number;
  completedProgrammes: number;
  totalPoints: number;
  averagePointsPerTeam: number;
  competitionProgress: number;
  topTeam: string;
  recentWins: number;
}

interface ActivityItem {
  id: string;
  type: 'result' | 'programme' | 'team' | 'candidate';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

interface TeamPerformance {
  team: Team;
  points: number;
  wins: number;
  participations: number;
  winRate: number;
  trend: 'up' | 'down' | 'stable';
}

export default function DashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [festivalInfo, setFestivalInfo] = useState<FestivalInfo | null>(null);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalTeams: 0,
    totalCandidates: 0,
    totalProgrammes: 0,
    totalResults: 0,
    completedProgrammes: 0,
    totalPoints: 0,
    averagePointsPerTeam: 0,
    competitionProgress: 0,
    topTeam: '',
    recentWins: 0
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [teamPerformances, setTeamPerformances] = useState<TeamPerformance[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'activity' | 'teams'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, candidatesRes, programmesRes, resultsRes, festivalRes, scheduleRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/programmes'),
        fetch('/api/results'),
        fetch('/api/festival-info'),
        fetch('/api/schedule')
      ]);

      const [teamsData, candidatesData, programmesData, resultsData, festivalData, scheduleData] = await Promise.all([
        teamsRes.json(),
        candidatesRes.json(),
        programmesRes.json(),
        resultsRes.json(),
        festivalRes.json(),
        scheduleRes.json()
      ]);

      setTeams(teamsData || []);
      setCandidates(candidatesData || []);
      setProgrammes(programmesData || []);
      setResults(resultsData || []);
      setFestivalInfo(festivalData?.[0] || null);
      setSchedule(scheduleData || []);
      setLastUpdated(new Date());

      // Calculate dashboard statistics
      calculateDashboardStats(teamsData, candidatesData, programmesData, resultsData);
      generateRecentActivity(resultsData, programmesData, teamsData, candidatesData);
      calculateTeamPerformances(teamsData, candidatesData, resultsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchData();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const calculateDashboardStats = (teamsData: Team[], candidatesData: Candidate[], programmesData: Programme[], resultsData: Result[]) => {
    const totalTeams = teamsData.length;
    const totalCandidates = candidatesData.length;
    const totalProgrammes = programmesData.length;
    const totalResults = resultsData.length;
    const completedProgrammes = new Set(resultsData.map(r => r.programmeId || r.programme)).size;
    
    // Calculate total points and team stats
    const teamStats: { [key: string]: { points: number; wins: number } } = {};
    let totalPoints = 0;
    let recentWins = 0;
    
    teamsData.forEach(team => {
      teamStats[team.code] = { points: 0, wins: 0 };
    });

    resultsData.forEach(result => {
      // Count recent wins (last 24 hours)
      const resultDate = new Date(result.createdAt || Date.now());
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (resultDate > dayAgo) {
        recentWins += (result.firstPlace?.length || 0) + (result.secondPlace?.length || 0) + (result.thirdPlace?.length || 0);
        recentWins += (result.firstPlaceTeams?.length || 0) + (result.secondPlaceTeams?.length || 0) + (result.thirdPlaceTeams?.length || 0);
      }

      // Calculate points for individual results
      [
        { place: result.firstPlace, points: result.firstPoints },
        { place: result.secondPlace, points: result.secondPoints },
        { place: result.thirdPlace, points: result.thirdPoints }
      ].forEach(({ place, points }) => {
        (place || []).forEach(winner => {
          const candidate = candidatesData.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamStats[candidate.team]) {
            teamStats[candidate.team].points += points;
            teamStats[candidate.team].wins += 1;
            totalPoints += points;
          }
        });
      });

      // Calculate points for team results
      [
        { teams: result.firstPlaceTeams, points: result.firstPoints },
        { teams: result.secondPlaceTeams, points: result.secondPoints },
        { teams: result.thirdPlaceTeams, points: result.thirdPoints }
      ].forEach(({ teams, points }) => {
        (teams || []).forEach(teamResult => {
          if (teamStats[teamResult.teamCode]) {
            teamStats[teamResult.teamCode].points += points;
            teamStats[teamResult.teamCode].wins += 1;
            totalPoints += points;
          }
        });
      });
    });

    const averagePointsPerTeam = totalTeams > 0 ? totalPoints / totalTeams : 0;
    const competitionProgress = totalProgrammes > 0 ? (completedProgrammes / totalProgrammes) * 100 : 0;
    
    // Find top team
    const topTeamCode = Object.entries(teamStats).reduce((a, b) => 
      teamStats[a[0]].points > teamStats[b[0]].points ? a : b
    )?.[0];
    const topTeam = teamsData.find(t => t.code === topTeamCode)?.name || 'No data';

    setDashboardStats({
      totalTeams,
      totalCandidates,
      totalProgrammes,
      totalResults,
      completedProgrammes,
      totalPoints,
      averagePointsPerTeam,
      competitionProgress,
      topTeam,
      recentWins
    });
  };

  const generateRecentActivity = (resultsData: Result[], programmesData: Programme[], teamsData: Team[], candidatesData: Candidate[]) => {
    const activities: ActivityItem[] = [];
    
    // Recent results
    resultsData.slice(-10).forEach((result, index) => {
      const programme = programmesData.find(p => p._id === result.programmeId || p.id === result.programmeId);
      const programmeName = programme?.name || 'Unknown Programme';
      
      if (result.firstPlace && result.firstPlace.length > 0) {
        const candidate = candidatesData.find(c => c.chestNumber === result.firstPlace![0].chestNumber);
        const team = teamsData.find(t => t.code === candidate?.team);
        
        activities.push({
          id: `result-${index}`,
          type: 'result',
          title: `🥇 ${candidate?.name || 'Unknown'} won ${programmeName}`,
          description: `Team ${team?.name || 'Unknown'} secured first place`,
          timestamp: new Date(result.createdAt || Date.now() - index * 60000),
          icon: '🏆',
          color: 'bg-yellow-500'
        });
      }
      
      if (result.firstPlaceTeams && result.firstPlaceTeams.length > 0) {
        const team = teamsData.find(t => t.code === result.firstPlaceTeams![0].teamCode);
        activities.push({
          id: `team-result-${index}`,
          type: 'result',
          title: `🏆 Team ${team?.name || 'Unknown'} won ${programmeName}`,
          description: 'Team event victory',
          timestamp: new Date(result.createdAt || Date.now() - index * 60000),
          icon: '👥',
          color: 'bg-green-500'
        });
      }
    });

    // Recent programmes
    programmesData.slice(-5).forEach((programme, index) => {
      activities.push({
        id: `programme-${index}`,
        type: 'programme',
        title: `📅 ${programme.name} scheduled`,
        description: `${programme.category} event in ${programme.section} section`,
        timestamp: new Date(programme.createdAt || Date.now() - (index + 10) * 60000),
        icon: programme.category === 'arts' ? '🎨' : '⚽',
        color: programme.category === 'arts' ? 'bg-purple-500' : 'bg-blue-500'
      });
    });

    // Sort by timestamp and take latest 15
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 15);

    setRecentActivity(sortedActivities);
  };

  const calculateTeamPerformances = (teamsData: Team[], candidatesData: Candidate[], resultsData: Result[]) => {
    const teamPerfs: TeamPerformance[] = teamsData.map(team => {
      const teamCandidates = candidatesData.filter(c => c.team === team.code);
      let points = 0;
      let wins = 0;
      let participations = 0;

      resultsData.forEach(result => {
        // Individual results
        [result.firstPlace, result.secondPlace, result.thirdPlace].forEach((place, placeIndex) => {
          (place || []).forEach(winner => {
            const candidate = teamCandidates.find(c => c.chestNumber === winner.chestNumber);
            if (candidate) {
              participations += 1;
              wins += 1;
              points += [result.firstPoints, result.secondPoints, result.thirdPoints][placeIndex];
            }
          });
        });

        // Team results
        [result.firstPlaceTeams, result.secondPlaceTeams, result.thirdPlaceTeams].forEach((teams, placeIndex) => {
          (teams || []).forEach(teamResult => {
            if (teamResult.teamCode === team.code) {
              participations += 1;
              wins += 1;
              points += [result.firstPoints, result.secondPoints, result.thirdPoints][placeIndex];
            }
          });
        });
      });

      const winRate = participations > 0 ? (wins / participations) * 100 : 0;
      
      return {
        team,
        points,
        wins,
        participations,
        winRate,
        trend: winRate > 50 ? 'up' : winRate > 25 ? 'stable' : 'down'
      };
    }).sort((a, b) => b.points - a.points);

    setTeamPerformances(teamPerfs);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-xl font-bold">🎭</span>
              </div>
              <span className="text-purple-100 text-sm font-medium">Festival Management System</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">
              {festivalInfo?.name || 'Wattaqa Arts Festival 2K25'}
            </h1>
            <p className="text-purple-100 text-lg">
              {festivalInfo?.description || 'Comprehensive Arts & Sports Festival Dashboard'}
            </p>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(dashboardStats.competitionProgress)}%</div>
              <div className="text-purple-100 text-sm">Complete</div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-purple-100 text-sm">
                {autoRefresh ? 'Live' : 'Manual'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-purple-100">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-purple-100">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  🔄 Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">👥</span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalCandidates}</p>
              <p className="text-green-600 font-medium text-sm">+{dashboardStats.recentWins} recent</p>
            </div>
          </div>
          <p className="text-gray-900 font-semibold">Total Participants</p>
          <p className="text-gray-600 text-sm mt-1">Across {dashboardStats.totalTeams} teams</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🎨</span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalProgrammes}</p>
              <p className="text-blue-600 font-medium text-sm">{dashboardStats.completedProgrammes} completed</p>
            </div>
          </div>
          <p className="text-gray-900 font-semibold">Total Programmes</p>
          <p className="text-gray-600 text-sm mt-1">Arts & Sports events</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🏆</span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalPoints.toLocaleString()}</p>
              <p className="text-purple-600 font-medium text-sm">Avg: {Math.round(dashboardStats.averagePointsPerTeam)}</p>
            </div>
          </div>
          <p className="text-gray-900 font-semibold">Total Points</p>
          <p className="text-gray-600 text-sm mt-1">Competition scores</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${getStatusColor(festivalInfo?.status || 'ongoing')} rounded-lg flex items-center justify-center`}>
              <span className="text-white text-xl">🎪</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{Math.round(dashboardStats.competitionProgress)}%</p>
              <p className="text-gray-600 font-medium text-sm">Progress</p>
            </div>
          </div>
          <p className="text-gray-900 font-semibold">Festival Status</p>
          <p className="text-gray-600 text-sm mt-1 capitalize">{festivalInfo?.status || 'Active'}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap border-b">
          {[
            { key: 'overview', label: '📊 Overview', icon: '📊' },
            { key: 'analytics', label: '📈 Analytics', icon: '📈' },
            { key: 'activity', label: '🔔 Activity', icon: '🔔' },
            { key: 'teams', label: '👥 Teams', icon: '👥' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-4 font-medium text-sm md:text-base ${
                activeTab === tab.key
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-lg">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            </div>
            
            <div className="space-y-3">
              <Link href="/admin/programmes" className="block w-full text-left p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">➕</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Manage Programmes</p>
                    <p className="text-gray-600 text-sm">Add or edit arts & sports events</p>
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/rankings" className="block w-full text-left p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">View Rankings</p>
                    <p className="text-gray-600 text-sm">Check team scores and leaderboards</p>
                  </div>
                </div>
              </Link>
              
              <Link href="/results" className="block w-full text-left p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">🏆</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Competition Results</p>
                    <p className="text-gray-600 text-sm">View detailed results and winners</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Top Team Performance */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-lg">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Leading Team</h3>
            </div>
            
            {teamPerformances.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                  <div className="text-4xl mb-3">👑</div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">{teamPerformances[0].team.name}</h4>
                  <p className="text-gray-600 mb-4">{teamPerformances[0].team.description}</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{teamPerformances[0].points}</div>
                      <div className="text-sm text-gray-600">Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{teamPerformances[0].wins}</div>
                      <div className="text-sm text-gray-600">Wins</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{Math.round(teamPerformances[0].winRate)}%</div>
                      <div className="text-sm text-gray-600">Win Rate</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {teamPerformances.slice(1, 4).map((perf, index) => (
                    <div key={perf.team.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-500">#{index + 2}</span>
                        <span className="font-medium">{perf.team.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">{perf.points}</div>
                        <div className="text-sm text-gray-500">{perf.wins} wins</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-500">No performance data available yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Competition Progress */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">📈 Competition Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl mb-3">📊</div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {Math.round(dashboardStats.competitionProgress)}%
                </div>
                <p className="text-gray-600">Competition Progress</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${dashboardStats.competitionProgress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl mb-3">🎯</div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {Math.round(dashboardStats.averagePointsPerTeam)}
                </div>
                <p className="text-gray-600">Avg Points/Team</p>
                <p className="text-sm text-gray-500 mt-2">
                  Total: {dashboardStats.totalPoints.toLocaleString()}
                </p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl mb-3">🏆</div>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {dashboardStats.recentWins}
                </div>
                <p className="text-gray-600">Recent Wins (24h)</p>
                <p className="text-sm text-gray-500 mt-2">
                  Total Results: {dashboardStats.totalResults}
                </p>
              </div>
            </div>
          </div>

          {/* Team Performance Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">🏆 Team Performance Overview</h3>
            <div className="space-y-4">
              {teamPerformances.map((perf, index) => (
                <div key={perf.team.code} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{perf.team.name}</h4>
                      <p className="text-sm text-gray-600">{perf.participations} participations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{perf.points}</div>
                      <div className="text-xs text-gray-500">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{perf.wins}</div>
                      <div className="text-xs text-gray-500">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{Math.round(perf.winRate)}%</div>
                      <div className="text-xs text-gray-500">Win Rate</div>
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(perf.winRate, 100)}%`,
                          backgroundColor: perf.team.color
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">🔔 Recent Activity Feed</h3>
            <div className="text-sm text-gray-500">
              {recentActivity.length} recent activities
            </div>
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center text-white`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📡</div>
              <p className="text-gray-500">No recent activity to display</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const performance = teamPerformances.find(p => p.team.code === team.code);
            const teamCandidates = candidates.filter(c => c.team === team.code);
            
            return (
              <div key={team.code} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                       style={{ backgroundColor: team.color }}>
                    {team.name.charAt(0)}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    performance?.trend === 'up' ? 'bg-green-100 text-green-800' :
                    performance?.trend === 'down' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {performance?.trend === 'up' ? '📈 Rising' :
                     performance?.trend === 'down' ? '📉 Declining' : '➡️ Stable'}
                  </div>
                </div>
                
                <h4 className="text-lg font-bold text-gray-900 mb-2">{team.name}</h4>
                <p className="text-gray-600 text-sm mb-4">{team.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Members:</span>
                    <span className="font-bold text-gray-900">{teamCandidates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Points:</span>
                    <span className="font-bold text-purple-600">{performance?.points || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Wins:</span>
                    <span className="font-bold text-green-600">{performance?.wins || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-bold text-blue-600">{Math.round(performance?.winRate || 0)}%</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link 
                    href={`/teams/${team.code}`}
                    className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg transition-colors duration-200"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}