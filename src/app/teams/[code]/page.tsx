'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Team, Candidate, ProgrammeParticipant, Programme, Result } from '@/types';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter } from '@/components/Navigation/PublicFooter';

interface TeamStats {
  totalPoints: number;
  totalParticipations: number;
  totalWins: number;
  winsByPosition: {
    first: number;
    second: number;
    third: number;
  };
  programmeStats: {
    [key: string]: {
      name: string;
      participations: number;
      wins: number;
      points: number;
    };
  };
}

interface TopPerformer {
  candidate: Candidate;
  wins: number;
  points: number;
  achievements: Array<{
    programme: string;
    position: number;
    points: number;
  }>;
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamCode = params.code as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'results' | 'analytics'>('overview');

  useEffect(() => {
    if (teamCode) {
      fetchData();
    }
  }, [teamCode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, candidatesRes, participantsRes, programmesRes, resultsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/programme-participants'),
        fetch('/api/programmes'),
        fetch('/api/results')
      ]);

      const [teamsData, candidatesData, participantsData, programmesData, resultsData] = await Promise.all([
        teamsRes.json(),
        candidatesRes.json(),
        participantsRes.json(),
        programmesRes.json(),
        resultsRes.json()
      ]);

      const foundTeam = teamsData.find((t: Team) => t.code === teamCode);
      setTeam(foundTeam || null);
      setCandidates(candidatesData || []);
      setParticipants(participantsData || []);
      setProgrammes(programmesData || []);
      setResults(resultsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamCandidates = () => {
    return candidates.filter(candidate => candidate.team === teamCode);
  };

  const getTeamParticipations = () => {
    return participants.filter(participant => participant.teamCode === teamCode);
  };

  const getTeamResults = () => {
    const teamCandidates = getTeamCandidates();
    const chestNumbers = teamCandidates.map(c => c.chestNumber);
    
    return results.filter(result => {
      const hasIndividualResults = [
        ...(result.firstPlace || []),
        ...(result.secondPlace || []),
        ...(result.thirdPlace || [])
      ].some(p => chestNumbers.includes(p.chestNumber));

      const hasTeamResults = [
        ...(result.firstPlaceTeams || []),
        ...(result.secondPlaceTeams || []),
        ...(result.thirdPlaceTeams || [])
      ].some(t => t.teamCode === teamCode);

      return hasIndividualResults || hasTeamResults;
    });
  };

  const calculateTeamStats = (): TeamStats => {
    const teamCandidates = getTeamCandidates();
    const teamParticipations = getTeamParticipations();
    const teamResults = getTeamResults();
    const chestNumbers = teamCandidates.map(c => c.chestNumber);
    
    let totalPoints = 0;
    let firstPlace = 0, secondPlace = 0, thirdPlace = 0;
    const programmeStats: { [key: string]: any } = {};
    
    // Points system: 1st = 5 points, 2nd = 3 points, 3rd = 1 point
    teamResults.forEach(result => {
      const programme = programmes.find(p => p.id === result.programmeId);
      const programmeName = programme?.name || 'Unknown Programme';
      
      if (!programmeStats[result.programmeId]) {
        programmeStats[result.programmeId] = {
          name: programmeName,
          participations: 0,
          wins: 0,
          points: 0
        };
      }
      
      // Individual results
      const firstPlaceCount = (result.firstPlace || []).filter(p => chestNumbers.includes(p.chestNumber)).length;
      const secondPlaceCount = (result.secondPlace || []).filter(p => chestNumbers.includes(p.chestNumber)).length;
      const thirdPlaceCount = (result.thirdPlace || []).filter(p => chestNumbers.includes(p.chestNumber)).length;
      
      // Team results
      const teamFirstPlace = (result.firstPlaceTeams || []).filter(t => t.teamCode === teamCode).length;
      const teamSecondPlace = (result.secondPlaceTeams || []).filter(t => t.teamCode === teamCode).length;
      const teamThirdPlace = (result.thirdPlaceTeams || []).filter(t => t.teamCode === teamCode).length;
      
      const totalFirst = firstPlaceCount + teamFirstPlace;
      const totalSecond = secondPlaceCount + teamSecondPlace;
      const totalThird = thirdPlaceCount + teamThirdPlace;
      
      firstPlace += totalFirst;
      secondPlace += totalSecond;
      thirdPlace += totalThird;
      
      const programmePoints = (totalFirst * 5) + (totalSecond * 3) + (totalThird * 1);
      totalPoints += programmePoints;
      
      programmeStats[result.programmeId].wins += totalFirst + totalSecond + totalThird;
      programmeStats[result.programmeId].points += programmePoints;
    });
    
    // Count participations
    teamParticipations.forEach(participation => {
      if (programmeStats[participation.programmeId]) {
        programmeStats[participation.programmeId].participations++;
      }
    });

    return {
      totalPoints,
      totalParticipations: teamParticipations.length,
      totalWins: firstPlace + secondPlace + thirdPlace,
      winsByPosition: { first: firstPlace, second: secondPlace, third: thirdPlace },
      programmeStats
    };
  };

  const getTopPerformers = (): TopPerformer[] => {
    const teamCandidates = getTeamCandidates();
    const teamResults = getTeamResults();
    
    const performerStats: { [chestNumber: string]: TopPerformer } = {};
    
    teamCandidates.forEach(candidate => {
      performerStats[candidate.chestNumber] = {
        candidate,
        wins: 0,
        points: 0,
        achievements: []
      };
    });
    
    teamResults.forEach(result => {
      const programme = programmes.find(p => p.id === result.programmeId);
      const programmeName = programme?.name || 'Unknown Programme';
      
      // First place
      (result.firstPlace || []).forEach(p => {
        if (performerStats[p.chestNumber]) {
          performerStats[p.chestNumber].wins++;
          performerStats[p.chestNumber].points += 5;
          performerStats[p.chestNumber].achievements.push({
            programme: programmeName,
            position: 1,
            points: 5
          });
        }
      });
      
      // Second place
      (result.secondPlace || []).forEach(p => {
        if (performerStats[p.chestNumber]) {
          performerStats[p.chestNumber].wins++;
          performerStats[p.chestNumber].points += 3;
          performerStats[p.chestNumber].achievements.push({
            programme: programmeName,
            position: 2,
            points: 3
          });
        }
      });
      
      // Third place
      (result.thirdPlace || []).forEach(p => {
        if (performerStats[p.chestNumber]) {
          performerStats[p.chestNumber].wins++;
          performerStats[p.chestNumber].points += 1;
          performerStats[p.chestNumber].achievements.push({
            programme: programmeName,
            position: 3,
            points: 1
          });
        }
      });
    });
    
    return Object.values(performerStats)
      .sort((a, b) => b.points - a.points || b.wins - a.wins)
      .slice(0, 10);
  };

  const getPerformanceTrend = () => {
    const teamResults = getTeamResults();
    const teamCandidates = getTeamCandidates();
    const chestNumbers = teamCandidates.map(c => c.chestNumber);
    
    // Group results by programme and calculate cumulative points
    const trendData: { programme: string; points: number; cumulativePoints: number }[] = [];
    let cumulativePoints = 0;
    
    teamResults.forEach(result => {
      const programme = programmes.find(p => p.id === result.programmeId);
      const programmeName = programme?.name || 'Unknown Programme';
      
      // Calculate points for this programme
      const firstPlaceCount = (result.firstPlace || []).filter(p => chestNumbers.includes(p.chestNumber)).length;
      const secondPlaceCount = (result.secondPlace || []).filter(p => chestNumbers.includes(p.chestNumber)).length;
      const thirdPlaceCount = (result.thirdPlace || []).filter(p => chestNumbers.includes(p.chestNumber)).length;
      
      const teamFirstPlace = (result.firstPlaceTeams || []).filter(t => t.teamCode === teamCode).length;
      const teamSecondPlace = (result.secondPlaceTeams || []).filter(t => t.teamCode === teamCode).length;
      const teamThirdPlace = (result.thirdPlaceTeams || []).filter(t => t.teamCode === teamCode).length;
      
      const programmePoints = ((firstPlaceCount + teamFirstPlace) * 5) + 
                             ((secondPlaceCount + teamSecondPlace) * 3) + 
                             ((thirdPlaceCount + teamThirdPlace) * 1);
      
      cumulativePoints += programmePoints;
      
      if (programmePoints > 0) {
        trendData.push({
          programme: programmeName,
          points: programmePoints,
          cumulativePoints
        });
      }
    });
    
    return trendData;
  };

  // Simple Line Graph Component
  const LineGraph = ({ data }: { data: { programme: string; points: number; cumulativePoints: number }[] }) => {
    if (data.length === 0) return <div className="text-center text-gray-500 py-8">No performance data available</div>;
    
    const maxPoints = Math.max(...data.map(d => d.cumulativePoints));
    const graphHeight = 200;
    const graphWidth = 600;
    
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * (graphWidth - 40) + 20;
      const y = graphHeight - 20 - ((item.cumulativePoints / maxPoints) * (graphHeight - 40));
      return { x, y, ...item };
    });
    
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
    
    return (
      <div className="w-full overflow-x-auto">
        <svg width={graphWidth} height={graphHeight + 40} className="mx-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <line
              key={`grid-${ratio}`}
              x1={20}
              y1={20 + ratio * (graphHeight - 40)}
              x2={graphWidth - 20}
              y2={20 + ratio * (graphHeight - 40)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          ))}
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <text
              key={`y-label-${ratio}`}
              x={15}
              y={25 + ratio * (graphHeight - 40)}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
            >
              {Math.round(maxPoints * (1 - ratio))}
            </text>
          ))}
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Points */}
          {points.map((point, index) => (
            <g key={`point-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill="#8b5cf6"
                stroke="white"
                strokeWidth={2}
              />
              <title>{`${point.programme}: ${point.cumulativePoints} total points`}</title>
            </g>
          ))}
          
          {/* X-axis labels */}
          {points.map((point, index) => (
            <text
              key={`x-label-${index}`}
              x={point.x}
              y={graphHeight + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
              transform={`rotate(-45, ${point.x}, ${graphHeight + 15})`}
            >
              {point.programme.length > 15 ? point.programme.substring(0, 15) + '...' : point.programme}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <PublicNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <PublicNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
            <p className="text-gray-600 mb-6">The team you're looking for doesn't exist.</p>
            <Link
              href="/teams"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Teams
            </Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const stats = calculateTeamStats();
  const topPerformers = getTopPerformers();
  const teamCandidates = getTeamCandidates();
  const teamResults = getTeamResults();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <PublicNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-purple-600 font-semibold text-lg">{team.code}</p>
              <p className="text-gray-600 mt-2">{team.description}</p>
            </div>
            <Link
              href="/teams"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Teams
            </Link>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.totalPoints}</p>
              <p className="text-sm text-gray-600">Total Points</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.totalWins}</p>
              <p className="text-sm text-gray-600">Total Wins</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{teamCandidates.length}</p>
              <p className="text-sm text-gray-600">Members</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats.totalParticipations}</p>
              <p className="text-sm text-gray-600">Participations</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="flex border-b">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'members', label: 'Members' },
              { key: 'results', label: 'Results' },
              { key: 'analytics', label: 'Analytics' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-4 font-medium ${
                  activeTab === tab.key
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 Top Performers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topPerformers.slice(0, 6).map((performer, index) => (
                  <div key={performer.candidate.chestNumber} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{performer.candidate.name}</p>
                        <p className="text-sm text-gray-600">#{performer.candidate.chestNumber}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{performer.points} points</span>
                      <span>{performer.wins} wins</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Win Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏅 Win Distribution</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🥇</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.winsByPosition.first}</p>
                  <p className="text-gray-600">First Place</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🥈</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-600">{stats.winsByPosition.second}</p>
                  <p className="text-gray-600">Second Place</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🥉</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{stats.winsByPosition.third}</p>
                  <p className="text-gray-600">Third Place</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Members ({teamCandidates.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamCandidates.map(candidate => {
                const performer = topPerformers.find(p => p.candidate.chestNumber === candidate.chestNumber);
                return (
                  <div key={candidate.chestNumber} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{candidate.name}</p>
                        <p className="text-sm text-gray-600">#{candidate.chestNumber}</p>
                      </div>
                      {performer && performer.wins > 0 && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {performer.wins} wins
                        </span>
                      )}
                    </div>
                    {performer && performer.points > 0 && (
                      <p className="text-sm text-green-600 font-medium">{performer.points} points</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Competition Results</h2>
            <div className="space-y-4">
              {teamResults.map(result => {
                const programme = programmes.find(p => p.id === result.programmeId);
                const teamCandidates = getTeamCandidates();
                const chestNumbers = teamCandidates.map(c => c.chestNumber);
                
                const teamWinners = {
                  first: [
                    ...(result.firstPlace || []).filter(p => chestNumbers.includes(p.chestNumber)),
                    ...(result.firstPlaceTeams || []).filter(t => t.teamCode === teamCode)
                  ],
                  second: [
                    ...(result.secondPlace || []).filter(p => chestNumbers.includes(p.chestNumber)),
                    ...(result.secondPlaceTeams || []).filter(t => t.teamCode === teamCode)
                  ],
                  third: [
                    ...(result.thirdPlace || []).filter(p => chestNumbers.includes(p.chestNumber)),
                    ...(result.thirdPlaceTeams || []).filter(t => t.teamCode === teamCode)
                  ]
                };
                
                const hasWins = teamWinners.first.length > 0 || teamWinners.second.length > 0 || teamWinners.third.length > 0;
                
                if (!hasWins) return null;
                
                return (
                  <div key={result.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">{programme?.name || 'Unknown Programme'}</h3>
                    
                    {teamWinners.first.length > 0 && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                          🥇 First Place
                        </span>
                        <div className="ml-4 mt-1">
                          {teamWinners.first.map((winner, idx) => (
                            <p key={`first-${result.id}-${idx}-${'chestNumber' in winner ? winner.chestNumber : winner.teamCode}`} className="text-sm">
                              {'chestNumber' in winner ? 
                                `${teamCandidates.find(c => c.chestNumber === winner.chestNumber)?.name} (#${winner.chestNumber})` :
                                `Team ${winner.teamCode}`
                              }
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {teamWinners.second.length > 0 && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                          🥈 Second Place
                        </span>
                        <div className="ml-4 mt-1">
                          {teamWinners.second.map((winner, idx) => (
                            <p key={`second-${result.id}-${idx}-${'chestNumber' in winner ? winner.chestNumber : winner.teamCode}`} className="text-sm">
                              {'chestNumber' in winner ? 
                                `${teamCandidates.find(c => c.chestNumber === winner.chestNumber)?.name} (#${winner.chestNumber})` :
                                `Team ${winner.teamCode}`
                              }
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {teamWinners.third.length > 0 && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          🥉 Third Place
                        </span>
                        <div className="ml-4 mt-1">
                          {teamWinners.third.map((winner, idx) => (
                            <p key={`third-${result.id}-${idx}-${'chestNumber' in winner ? winner.chestNumber : winner.teamCode}`} className="text-sm">
                              {'chestNumber' in winner ? 
                                `${teamCandidates.find(c => c.chestNumber === winner.chestNumber)?.name} (#${winner.chestNumber})` :
                                `Team ${winner.teamCode}`
                              }
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Performance Trend Graph */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Performance Trend</h2>
              <p className="text-gray-600 mb-4">Cumulative points progression across programmes</p>
              <LineGraph data={getPerformanceTrend()} />
            </div>

            {/* Programme Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Programme Performance</h2>
              <div className="space-y-4">
                {Object.entries(stats.programmeStats)
                  .sort(([,a], [,b]) => b.points - a.points)
                  .map(([programmeId, stat]) => (
                    <div key={programmeId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{stat.name}</h3>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                          {stat.points} points
                        </span>
                      </div>
                      <div className="flex gap-6 text-sm text-gray-600">
                        <span>{stat.participations} participations</span>
                        <span>{stat.wins} wins</span>
                        <span>{stat.participations > 0 ? Math.round((stat.wins / stat.participations) * 100) : 0}% win rate</span>
                      </div>
                      {/* Visual progress bar for points */}
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((stat.points / stats.totalPoints) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Win Rate</span>
                    <span className="font-semibold">
                      {stats.totalParticipations > 0 ? Math.round((stats.totalWins / stats.totalParticipations) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Points per Win</span>
                    <span className="font-semibold">
                      {stats.totalWins > 0 ? (stats.totalPoints / stats.totalWins).toFixed(1) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Points per Member</span>
                    <span className="font-semibold">
                      {teamCandidates.length > 0 ? (stats.totalPoints / teamCandidates.length).toFixed(1) : 0}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Active Members</span>
                    <span className="font-semibold">
                      {topPerformers.filter(p => p.wins > 0).length} / {teamCandidates.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Top Performer Points</span>
                    <span className="font-semibold">
                      {topPerformers[0]?.points || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Programmes Participated</span>
                    <span className="font-semibold">
                      {Object.keys(stats.programmeStats).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers Detailed Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 Top Performers Analysis</h2>
              <div className="space-y-4">
                {topPerformers.slice(0, 5).map((performer, index) => (
                  <div key={performer.candidate.chestNumber} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{performer.candidate.name}</p>
                          <p className="text-sm text-gray-600">#{performer.candidate.chestNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{performer.points} pts</p>
                        <p className="text-sm text-gray-600">{performer.wins} wins</p>
                      </div>
                    </div>
                    
                    {/* Achievement breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center bg-yellow-50 p-2 rounded">
                        <p className="font-semibold text-yellow-700">
                          {performer.achievements.filter(a => a.position === 1).length}
                        </p>
                        <p className="text-yellow-600">🥇 First</p>
                      </div>
                      <div className="text-center bg-gray-50 p-2 rounded">
                        <p className="font-semibold text-gray-700">
                          {performer.achievements.filter(a => a.position === 2).length}
                        </p>
                        <p className="text-gray-600">🥈 Second</p>
                      </div>
                      <div className="text-center bg-orange-50 p-2 rounded">
                        <p className="font-semibold text-orange-700">
                          {performer.achievements.filter(a => a.position === 3).length}
                        </p>
                        <p className="text-orange-600">🥉 Third</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <PublicFooter />
    </div>
  );
}