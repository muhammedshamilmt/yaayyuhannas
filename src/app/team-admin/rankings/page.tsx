'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Team, Candidate, Result } from '@/types';

export default function TeamRankingsPage() {
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('team') || 'SMD';
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [teamCode]);

  const fetchData = async () => {
    try {
      const [teamsRes, candidatesRes, resultsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch(`/api/candidates?team=${teamCode}`),
        fetch('/api/results')
      ]);

      const [teamsData, candidatesData, resultsData] = await Promise.all([
        teamsRes.json(),
        candidatesRes.json(),
        resultsRes.json()
      ]);

      setTeams(teamsData);
      setCandidates(candidatesData);
      setResults(resultsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate team rankings
  const teamRankings = teams.map(team => {
    const teamResults = results.filter(result => {
      const allWinners = [
        ...result.firstPlace.map(w => w.chestNumber),
        ...result.secondPlace.map(w => w.chestNumber),
        ...result.thirdPlace.map(w => w.chestNumber)
      ];
      return allWinners.some(chestNumber => chestNumber.startsWith(team.code));
    });

    const firstPlaces = teamResults.filter(result => 
      result.firstPlace.some(w => w.chestNumber.startsWith(team.code))
    ).length;
    
    const secondPlaces = teamResults.filter(result => 
      result.secondPlace.some(w => w.chestNumber.startsWith(team.code))
    ).length;
    
    const thirdPlaces = teamResults.filter(result => 
      result.thirdPlace.some(w => w.chestNumber.startsWith(team.code))
    ).length;

    return {
      ...team,
      firstPlaces,
      secondPlaces,
      thirdPlaces,
      totalWins: firstPlaces + secondPlaces + thirdPlaces
    };
  }).sort((a, b) => b.points - a.points);

  // Find current team ranking
  const currentTeamRanking = teamRankings.findIndex(team => team.code === teamCode) + 1;
  const currentTeam = teamRankings.find(team => team.code === teamCode);

  // Top performers from current team
  const topPerformers = candidates
    .map(candidate => {
      const candidateResults = results.filter(result => {
        const allWinners = [
          ...result.firstPlace.map(w => w.chestNumber),
          ...result.secondPlace.map(w => w.chestNumber),
          ...result.thirdPlace.map(w => w.chestNumber)
        ];
        return allWinners.includes(candidate.chestNumber);
      });

      const firstPlaces = candidateResults.filter(result => 
        result.firstPlace.some(w => w.chestNumber === candidate.chestNumber)
      ).length;
      
      const secondPlaces = candidateResults.filter(result => 
        result.secondPlace.some(w => w.chestNumber === candidate.chestNumber)
      ).length;
      
      const thirdPlaces = candidateResults.filter(result => 
        result.thirdPlace.some(w => w.chestNumber === candidate.chestNumber)
      ).length;

      return {
        ...candidate,
        firstPlaces,
        secondPlaces,
        thirdPlaces,
        totalWins: firstPlaces + secondPlaces + thirdPlaces
      };
    })
    .filter(candidate => candidate.totalWins > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Rankings</h1>
          <p className="text-gray-600">View team standings and top performers</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">#{currentTeamRanking}</div>
          <div className="text-sm text-gray-500">Current Rank</div>
        </div>
      </div>

      {/* Current Team Stats */}
      {currentTeam && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold border-2 border-white"
                style={{ backgroundColor: currentTeam.color }}
              >
                {currentTeam.code}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentTeam.name}</h2>
                <p className="text-blue-100">Rank #{currentTeamRanking} • {currentTeam.points} points</p>
              </div>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">🥇</div>
                  <div className="text-sm">{currentTeam.firstPlaces}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">🥈</div>
                  <div className="text-sm">{currentTeam.secondPlaces}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">🥉</div>
                  <div className="text-sm">{currentTeam.thirdPlaces}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Team Rankings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Overall Team Rankings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {teamRankings.map((team, index) => (
              <div 
                key={team._id?.toString()} 
                className={`p-4 ${team.code === teamCode ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-bold text-gray-500 w-8">
                      #{index + 1}
                    </div>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.code}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-600">{team.members} members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{team.points}</div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <span className="text-yellow-600">🥇 {team.firstPlaces}</span>
                  <span className="text-gray-600">🥈 {team.secondPlaces}</span>
                  <span className="text-orange-600">🥉 {team.thirdPlaces}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Team Performers */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Team Performers</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {topPerformers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🏆</div>
                <p className="text-gray-500">No winners yet from your team</p>
              </div>
            ) : (
              topPerformers.map((performer, index) => (
                <div key={performer._id?.toString()} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-bold text-gray-500 w-8">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{performer.name}</h3>
                        <p className="text-sm text-gray-600 font-mono">{performer.chestNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{performer.points}</div>
                      <div className="text-sm text-gray-600">points</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-yellow-600">🥇 {performer.firstPlaces}</span>
                    <span className="text-gray-600">🥈 {performer.secondPlaces}</span>
                    <span className="text-orange-600">🥉 {performer.thirdPlaces}</span>
                    <span className="text-blue-600 capitalize">{performer.section}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Performance Insights</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-semibold text-gray-900 mb-1">Team Progress</h3>
              <p className="text-sm text-gray-600">
                {currentTeam && currentTeam.totalWins > 0 
                  ? `${currentTeam.totalWins} total wins across all competitions`
                  : 'Keep participating to improve your ranking'
                }
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-1">Next Goal</h3>
              <p className="text-sm text-gray-600">
                {currentTeamRanking > 1 
                  ? `${teamRankings[currentTeamRanking - 2].points - (currentTeam?.points || 0)} points to reach rank #${currentTeamRanking - 1}`
                  : 'You\'re in the lead! Keep it up!'
                }
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-semibold text-gray-900 mb-1">Team Strength</h3>
              <p className="text-sm text-gray-600">
                {topPerformers.length > 0 
                  ? `${topPerformers.length} active performers contributing to team success`
                  : 'Encourage more team members to participate'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}