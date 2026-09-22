'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Team, Candidate, ProgrammeParticipant, Programme, Result } from '@/types';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter } from '@/components/Navigation/PublicFooter';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'members'>('points');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchData();
  }, []);

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

      setTeams(teamsData || []);
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

  const getTeamCandidates = (teamCode: string) => {
    return candidates.filter(candidate => candidate.team === teamCode);
  };

  const getTeamParticipations = (teamCode: string) => {
    return participants.filter(participant => participant.teamCode === teamCode);
  };

  const getTeamResults = (teamCode: string) => {
    const teamCandidates = getTeamCandidates(teamCode);
    const chestNumbers = teamCandidates.map(c => c.chestNumber);
    
    return results.filter(result => {
      // Check individual results
      const hasIndividualResults = [
        ...(result.firstPlace || []),
        ...(result.secondPlace || []),
        ...(result.thirdPlace || [])
      ].some(p => chestNumbers.includes(p.chestNumber));

      // Check team results
      const hasTeamResults = [
        ...(result.firstPlaceTeams || []),
        ...(result.secondPlaceTeams || []),
        ...(result.thirdPlaceTeams || [])
      ].some(t => t.teamCode === teamCode);

      return hasIndividualResults || hasTeamResults;
    });
  };

  const getTeamStats = (team: Team) => {
    const teamCandidates = getTeamCandidates(team.code);
    const teamParticipations = getTeamParticipations(team.code);
    const teamResults = getTeamResults(team.code);
    
    // Count wins by position
    let firstPlace = 0, secondPlace = 0, thirdPlace = 0;
    
    teamResults.forEach(result => {
      const teamChestNumbers = teamCandidates.map(c => c.chestNumber);
      
      // Individual wins
      firstPlace += (result.firstPlace || []).filter(p => teamChestNumbers.includes(p.chestNumber)).length;
      secondPlace += (result.secondPlace || []).filter(p => teamChestNumbers.includes(p.chestNumber)).length;
      thirdPlace += (result.thirdPlace || []).filter(p => teamChestNumbers.includes(p.chestNumber)).length;
      
      // Team wins
      firstPlace += (result.firstPlaceTeams || []).filter(t => t.teamCode === team.code).length;
      secondPlace += (result.secondPlaceTeams || []).filter(t => t.teamCode === team.code).length;
      thirdPlace += (result.thirdPlaceTeams || []).filter(t => t.teamCode === team.code).length;
    });

    return {
      members: teamCandidates.length,
      participations: teamParticipations.length,
      results: teamResults.length,
      wins: { first: firstPlace, second: secondPlace, third: thirdPlace },
      totalWins: firstPlace + secondPlace + thirdPlace
    };
  };

  const filteredAndSortedTeams = teams
    .filter(team => 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'points':
          return getTeamStats(b).totalWins - getTeamStats(a).totalWins;
        case 'members':
          return getTeamStats(b).members - getTeamStats(a).members;
        default:
          return 0;
      }
    });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <PublicNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Teams</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore all participating teams and their achievements in the arts festival
          </p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-4 items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'points' | 'members')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="points">Sort by Points</option>
                <option value="name">Sort by Name</option>
                <option value="members">Sort by Members</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Teams Display */}
        {filteredAndSortedTeams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No teams found matching your search.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredAndSortedTeams.map((team) => {
              const stats = getTeamStats(team);
              
              return (
                <div
                  key={team.code}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${
                    viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{team.name}</h3>
                        <p className="text-purple-600 font-semibold">{team.code}</p>
                        <p className="text-gray-600 text-sm mt-2">{team.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{stats.members}</p>
                          <p className="text-sm text-gray-500">Members</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{stats.totalWins}</p>
                          <p className="text-sm text-gray-500">Total Wins</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-center gap-4 text-sm mb-4">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          🥇 {stats.wins.first}
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          🥈 {stats.wins.second}
                        </span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          🥉 {stats.wins.third}
                        </span>
                      </div>
                      
                      <Link
                        href={`/teams/${team.code}`}
                        className="block w-full text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                          <span className="text-purple-600 font-semibold">{team.code}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{team.description}</p>
                        <div className="flex gap-6 text-sm">
                          <span>{stats.members} members</span>
                          <span>{stats.totalWins} total wins</span>
                          <span>🥇 {stats.wins.first} 🥈 {stats.wins.second} 🥉 {stats.wins.third}</span>
                        </div>
                      </div>
                      <Link
                        href={`/teams/${team.code}`}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <PublicFooter />
    </div>
  );
}
     