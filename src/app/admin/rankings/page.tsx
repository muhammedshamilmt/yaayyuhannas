'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Team, Result, Candidate, Programme } from '@/types';

interface TeamRanking {
  name: string;
  code: string;
  points: number;
  color: string;
  percentage: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
}

interface TopPerformer {
  name: string;
  chestNumber: string;
  teamCode: string;
  teamName: string;
  points: number;
  achievements: string[];
  winsByPosition: {
    first: number;
    second: number;
    third: number;
  };
}

interface RankingStats {
  totalPoints: number;
  totalWins: number;
  totalParticipations: number;
  averagePointsPerTeam: number;
  topTeamPoints: number;
  competitionProgress: number;
}

export default function RankingsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [rankingStats, setRankingStats] = useState<RankingStats>({
    totalPoints: 0,
    totalWins: 0,
    totalParticipations: 0,
    averagePointsPerTeam: 0,
    topTeamPoints: 0,
    competitionProgress: 0
  });
  const [activeView, setActiveView] = useState<'overview' | 'teams' | 'individuals' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
    } catch (error) {
      console.error('Error fetching data:', error);
      setTeams([]);
      setResults([]);
      setCandidates([]);
      setProgrammes([]);
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

  // Calculate team rankings based on results
  useEffect(() => {
    if (teams.length > 0 && results.length > 0 && candidates.length > 0) {
      calculateRankings();
    }
  }, [teams, results, candidates, programmes]);

  const calculateRankings = () => {
    // Initialize team stats
    const teamStats: {
      [key: string]: {
        points: number;
        goldMedals: number;
        silverMedals: number;
        bronzeMedals: number;
        participations: number;
      }
    } = {};

    teams.forEach(team => {
      teamStats[team.code] = {
        points: 0,
        goldMedals: 0,
        silverMedals: 0,
        bronzeMedals: 0,
        participations: 0
      };
    });

    let totalPoints = 0;
    let totalWins = 0;
    let totalParticipations = 0;

    // Calculate points from results
    results.forEach(result => {
      totalParticipations++;

      // Process individual results
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamStats[candidate.team]) {
            teamStats[candidate.team].points += result.firstPoints;
            teamStats[candidate.team].goldMedals += 1;
            teamStats[candidate.team].participations += 1;
            totalPoints += result.firstPoints;
            totalWins += 1;
          }
        });
      }

      if (result.secondPlace) {
        result.secondPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamStats[candidate.team]) {
            teamStats[candidate.team].points += result.secondPoints;
            teamStats[candidate.team].silverMedals += 1;
            teamStats[candidate.team].participations += 1;
            totalPoints += result.secondPoints;
            totalWins += 1;
          }
        });
      }

      if (result.thirdPlace) {
        result.thirdPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamStats[candidate.team]) {
            teamStats[candidate.team].points += result.thirdPoints;
            teamStats[candidate.team].bronzeMedals += 1;
            teamStats[candidate.team].participations += 1;
            totalPoints += result.thirdPoints;
            totalWins += 1;
          }
        });
      }

      // Process team results
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(winner => {
          if (teamStats[winner.teamCode]) {
            teamStats[winner.teamCode].points += result.firstPoints;
            teamStats[winner.teamCode].goldMedals += 1;
          }
        });
      }

      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(winner => {
          if (teamStats[winner.teamCode]) {
            teamStats[winner.teamCode].points += result.secondPoints;
            teamStats[winner.teamCode].silverMedals += 1;
          }
        });
      }

      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(winner => {
          if (teamStats[winner.teamCode]) {
            teamStats[winner.teamCode].points += result.thirdPoints;
            teamStats[winner.teamCode].bronzeMedals += 1;
          }
        });
      }
    });

    // Create overall team rankings
    const overallRankings = teams.map(team => {
      const stats = teamStats[team.code];
      return {
        name: team.name,
        code: team.code,
        points: stats.points,
        color: team.color,
        percentage: 0, // Will be calculated after sorting
        goldMedals: stats.goldMedals,
        silverMedals: stats.silverMedals,
        bronzeMedals: stats.bronzeMedals
      };
    }).sort((a, b) => b.points - a.points);

    // Calculate percentages based on highest score
    const maxPoints = overallRankings[0]?.points || 1;
    overallRankings.forEach(team => {
      team.percentage = Math.round((team.points / maxPoints) * 100);
    });

    setTeamRankings(overallRankings);

    // Calculate statistics
    const averagePointsPerTeam = teams.length > 0 ? totalPoints / teams.length : 0;
    const topTeamPoints = overallRankings[0]?.points || 0;
    const competitionProgress = programmes.length > 0 ? (results.length / programmes.length) * 100 : 0;

    setRankingStats({
      totalPoints,
      totalWins,
      totalParticipations,
      averagePointsPerTeam,
      topTeamPoints,
      competitionProgress: Math.min(competitionProgress, 100)
    });

    // Calculate top individual performers
    const candidatePoints: { [key: string]: { 
      points: number; 
      achievements: string[];
      winsByPosition: { first: number; second: number; third: number };
    } } = {};

    candidates.forEach(candidate => {
      candidatePoints[candidate.chestNumber] = { 
        points: 0, 
        achievements: [],
        winsByPosition: { first: 0, second: 0, third: 0 }
      };
    });

    results.forEach(result => {
      const programmeId = result.programmeId || result.programme;
      const programme = programmes.find(p => p._id === programmeId || p.id === programmeId);
      const programmeName = programme?.name || 'Unknown Programme';

      // First place
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          if (candidatePoints[winner.chestNumber]) {
            candidatePoints[winner.chestNumber].points += result.firstPoints;
            candidatePoints[winner.chestNumber].winsByPosition.first += 1;
            candidatePoints[winner.chestNumber].achievements.push(`🥇 ${programmeName}`);
          }
        });
      }

      // Second place
      if (result.secondPlace) {
        result.secondPlace.forEach(winner => {
          if (candidatePoints[winner.chestNumber]) {
            candidatePoints[winner.chestNumber].points += result.secondPoints;
            candidatePoints[winner.chestNumber].winsByPosition.second += 1;
            candidatePoints[winner.chestNumber].achievements.push(`🥈 ${programmeName}`);
          }
        });
      }

      // Third place
      if (result.thirdPlace) {
        result.thirdPlace.forEach(winner => {
          if (candidatePoints[winner.chestNumber]) {
            candidatePoints[winner.chestNumber].points += result.thirdPoints;
            candidatePoints[winner.chestNumber].winsByPosition.third += 1;
            candidatePoints[winner.chestNumber].achievements.push(`🥉 ${programmeName}`);
          }
        });
      }
    });

    const topPerformersList = candidates
      .map(candidate => {
        const team = teams.find(t => t.code === candidate.team);
        const stats = candidatePoints[candidate.chestNumber];
        return {
          name: candidate.name,
          chestNumber: candidate.chestNumber,
          teamCode: candidate.team,
          teamName: team?.name || candidate.team,
          points: stats.points,
          achievements: stats.achievements,
          winsByPosition: stats.winsByPosition
        };
      })
      .filter(performer => performer.points > 0)
      .sort((a, b) => b.points - a.points || b.winsByPosition.first - a.winsByPosition.first)
      .slice(0, 10);

    setTopPerformers(topPerformersList);
  };

  // Filter functions
  const getFilteredTeams = () => {
    return teamRankings.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getFilteredPerformers = () => {
    return topPerformers.filter(performer => {
      const matchesSearch = performer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           performer.teamName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Rankings & Analytics Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading comprehensive rankings data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Rankings & Analytics Dashboard" />

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Points</p>
              <p className="text-3xl font-bold">{rankingStats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="text-4xl opacity-80">🏆</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Wins</p>
              <p className="text-3xl font-bold">{rankingStats.totalWins}</p>
            </div>
            <div className="text-4xl opacity-80">🥇</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Avg Points/Team</p>
              <p className="text-3xl font-bold">{Math.round(rankingStats.averagePointsPerTeam)}</p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Competition Progress</p>
              <p className="text-3xl font-bold">{Math.round(rankingStats.competitionProgress)}%</p>
            </div>
            <div className="text-4xl opacity-80">⚡</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <input
              type="text"
              placeholder="Search teams or performers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-700">Auto-refresh</label>
            </div>
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
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
        
        <div className="mt-4 text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()} • 
          Teams: {teams.length} • 
          Results: {results.length} • 
          Candidates: {candidates.length}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="flex flex-wrap border-b">
          {[
            { key: 'overview', label: '📊 Overview', icon: '📊' },
            { key: 'teams', label: '🏆 Team Rankings', icon: '🏆' },
            { key: 'individuals', label: '👤 Top Performers', icon: '👤' },
            { key: 'analytics', label: '📈 Analytics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`px-4 py-4 font-medium text-sm md:text-base ${
                activeView === tab.key
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

      <div className="space-y-6">
        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Top 3 Teams Podium */}
            <ShowcaseSection title="🏆 Championship Podium">
              {teamRankings.length >= 3 ? (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-8">
                  <div className="flex items-end justify-center gap-8 mb-8">
                    {/* Second Place */}
                    <div className="text-center">
                      <div className="bg-gray-300 rounded-lg p-6 h-32 flex items-end justify-center mb-4">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🥈</div>
                          <div className="text-white font-bold">{teamRankings[1]?.points}</div>
                        </div>
                      </div>
                      <h3 className="font-bold text-lg">{teamRankings[1]?.name}</h3>
                      <p className="text-gray-600">{teamRankings[1]?.code}</p>
                    </div>
                    
                    {/* First Place */}
                    <div className="text-center">
                      <div className="bg-yellow-400 rounded-lg p-6 h-40 flex items-end justify-center mb-4 animate-pulse">
                        <div className="text-center">
                          <div className="text-5xl mb-2">🥇</div>
                          <div className="text-white font-bold text-xl">{teamRankings[0]?.points}</div>
                        </div>
                      </div>
                      <h3 className="font-bold text-xl text-yellow-600">{teamRankings[0]?.name}</h3>
                      <p className="text-gray-600">{teamRankings[0]?.code}</p>
                      <div className="mt-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                        🏆 Festival Champion
                      </div>
                    </div>
                    
                    {/* Third Place */}
                    <div className="text-center">
                      <div className="bg-orange-400 rounded-lg p-6 h-24 flex items-end justify-center mb-4">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🥉</div>
                          <div className="text-white font-bold">{teamRankings[2]?.points}</div>
                        </div>
                      </div>
                      <h3 className="font-bold text-lg">{teamRankings[2]?.name}</h3>
                      <p className="text-gray-600">{teamRankings[2]?.code}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-gray-500">Waiting for competition results to display podium...</p>
                </div>
              )}
            </ShowcaseSection>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Highest Team Score:</span>
                    <span className="font-bold">{rankingStats.topTeamPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Score:</span>
                    <span className="font-bold">{Math.round(rankingStats.averagePointsPerTeam)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Competitions:</span>
                    <span className="font-bold">{programmes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-bold">{results.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏅 Medal Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">🥇 Gold Medals:</span>
                    <span className="font-bold text-yellow-600">
                      {teamRankings.reduce((sum: number, team: TeamRanking) => sum + team.goldMedals, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">🥈 Silver Medals:</span>
                    <span className="font-bold text-gray-600">
                      {teamRankings.reduce((sum: number, team: TeamRanking) => sum + team.silverMedals, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">🥉 Bronze Medals:</span>
                    <span className="font-bold text-orange-600">
                      {teamRankings.reduce((sum: number, team: TeamRanking) => sum + team.bronzeMedals, 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Competition Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-bold">{Math.round(rankingStats.competitionProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${rankingStats.competitionProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {results.length} of {programmes.length} competitions completed
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers Preview */}
            <ShowcaseSection title="⭐ Star Performers">
              {topPerformers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topPerformers.slice(0, 3).map((performer, index) => {
                    const backgrounds = ['bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200', 
                                       'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200', 
                                       'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'];
                    const medals = ['🥇', '🥈', '🥉'];
                    
                    return (
                      <div key={performer.chestNumber} className={`${backgrounds[index]} border-2 rounded-lg p-6`}>
                        <div className="text-center">
                          <div className="text-4xl mb-3">{medals[index]}</div>
                          <h3 className="text-xl font-bold text-gray-900">{performer.name}</h3>
                          <p className="text-gray-600 mb-2">#{performer.chestNumber}</p>
                          <p className="text-sm text-gray-500 mb-4">{performer.teamName}</p>
                          <div className="text-2xl font-bold text-purple-600 mb-2">{performer.points} pts</div>
                          <div className="flex justify-center gap-2 text-sm">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              🥇 {performer.winsByPosition.first}
                            </span>
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              🥈 {performer.winsByPosition.second}
                            </span>
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              🥉 {performer.winsByPosition.third}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⭐</div>
                  <p className="text-gray-500">Top individual performers will appear here...</p>
                </div>
              )}
            </ShowcaseSection>
          </div>
        )}

        {/* Teams Tab */}
        {activeView === 'teams' && (
          <ShowcaseSection title="🏆 Complete Team Rankings">
            {getFilteredTeams().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-gray-500">
                  {searchTerm ? 'No teams match your search criteria.' : 'No team rankings available yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredTeams().map((team, index) => {
                  const isTopThree = index < 3;
                  const gradients = [
                    'from-yellow-50 to-yellow-100 border-yellow-300',
                    'from-gray-50 to-gray-100 border-gray-300',
                    'from-orange-50 to-orange-100 border-orange-300'
                  ];
                  const medals = ['🥇', '🥈', '🥉'];

                  return (
                    <div
                      key={team.code}
                      className={`${isTopThree ? `bg-gradient-to-r ${gradients[index]} border-2` : 'bg-white border'} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">
                            {isTopThree ? medals[index] : `#${index + 1}`}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                            <p className="text-gray-600">{team.code}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{team.points}</div>
                            <p className="text-sm text-gray-600">Points</p>
                          </div>
                          
                          <div className="flex gap-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-yellow-600">{team.goldMedals}</div>
                              <p className="text-xs text-gray-500">Gold</p>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-600">{team.silverMedals}</div>
                              <p className="text-xs text-gray-500">Silver</p>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-orange-600">{team.bronzeMedals}</div>
                              <p className="text-xs text-gray-500">Bronze</p>
                            </div>
                          </div>
                          
                          <div className="w-24">
                            <div className="text-sm text-gray-600 mb-1">{team.percentage}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-1000"
                                style={{
                                  width: `${team.percentage}%`,
                                  backgroundColor: team.color
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ShowcaseSection>
        )}

        {/* Individuals Tab */}
        {activeView === 'individuals' && (
          <ShowcaseSection title="👤 Individual Performance Rankings">
            {getFilteredPerformers().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-gray-500">
                  {searchTerm ? 'No performers match your search criteria.' : 'No individual performance data available yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredPerformers().map((performer, index) => (
                  <div key={performer.chestNumber} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{performer.name}</h3>
                        <p className="text-sm text-gray-600">#{performer.chestNumber}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">{performer.teamName}</p>
                      <div className="text-2xl font-bold text-purple-600">{performer.points} points</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center bg-yellow-50 rounded p-2">
                        <div className="text-lg font-bold text-yellow-600">{performer.winsByPosition.first}</div>
                        <div className="text-xs text-gray-500">🥇 Gold</div>
                      </div>
                      <div className="text-center bg-gray-50 rounded p-2">
                        <div className="text-lg font-bold text-gray-600">{performer.winsByPosition.second}</div>
                        <div className="text-xs text-gray-500">🥈 Silver</div>
                      </div>
                      <div className="text-center bg-orange-50 rounded p-2">
                        <div className="text-lg font-bold text-orange-600">{performer.winsByPosition.third}</div>
                        <div className="text-xs text-gray-500">🥉 Bronze</div>
                      </div>
                    </div>
                    
                    {performer.achievements.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-gray-500 mb-2">Recent Achievements:</p>
                        <div className="text-xs text-gray-600 max-h-16 overflow-hidden">
                          {performer.achievements.slice(0, 3).join(', ')}
                          {performer.achievements.length > 3 && '...'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ShowcaseSection>
        )}

        {/* Analytics Tab */}
        {activeView === 'analytics' && (
          <div className="space-y-8">
            {/* Performance Insights */}
            <ShowcaseSection title="📈 Performance Insights">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">🏆 Most Dominant Team</h4>
                  {teamRankings.length > 0 ? (
                    <div className="text-center">
                      <div className="text-3xl mb-2">👑</div>
                      <h3 className="font-bold text-lg">{teamRankings[0].name}</h3>
                      <p className="text-purple-600 font-semibold">{teamRankings[0].points} points</p>
                      <p className="text-sm text-gray-500">
                        {teamRankings[0].goldMedals + teamRankings[0].silverMedals + teamRankings[0].bronzeMedals} total medals
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">No data yet</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">⭐ Top Individual</h4>
                  {topPerformers.length > 0 ? (
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌟</div>
                      <h3 className="font-bold text-lg">{topPerformers[0].name}</h3>
                      <p className="text-purple-600 font-semibold">{topPerformers[0].points} points</p>
                      <p className="text-sm text-gray-500">{topPerformers[0].teamName}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">No data yet</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">🎯 Competition Status</h4>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {Math.round(rankingStats.competitionProgress)}%
                    </div>
                    <p className="text-sm text-gray-500">Complete</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${rankingStats.competitionProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </ShowcaseSection>

            {/* Detailed Statistics */}
            <ShowcaseSection title="📊 Detailed Statistics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Team Performance Distribution</h4>
                  <div className="space-y-4">
                    {teamRankings.slice(0, 5).map((team, index) => (
                      <div key={team.code} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className="font-medium">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-600">{team.points}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${team.percentage}%`,
                                backgroundColor: team.color
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Competition Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Programmes:</span>
                      <span className="font-bold">{programmes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Results:</span>
                      <span className="font-bold">{results.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Participants:</span>
                      <span className="font-bold">{candidates.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Teams:</span>
                      <span className="font-bold">{teams.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Team Score:</span>
                      <span className="font-bold">{Math.round(rankingStats.averagePointsPerTeam)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ShowcaseSection>
          </div>
        )}
      </div>
    </>
  );
}