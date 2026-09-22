'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Programme, ProgrammeParticipant, Team, Candidate, Result } from '@/types';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter } from '@/components/Navigation/PublicFooter';

export default function ProgrammeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;

  const [programme, setProgramme] = useState<Programme | null>(null);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'results'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (programmeId) {
      fetchProgrammeData();
    }
  }, [programmeId]);

  const fetchProgrammeData = async () => {
    try {
      setLoading(true);

      // Fetch programme details
      const programmeResponse = await fetch(`/api/programmes?id=${programmeId}`);
      if (!programmeResponse.ok) {
        throw new Error('Programme not found');
      }
      const programmeData = await programmeResponse.json();
      setProgramme(programmeData);

      // Fetch all related data
      const [participantsRes, teamsRes, candidatesRes, resultsRes] = await Promise.all([
        fetch(`/api/programme-participants?programmeId=${programmeId}`),
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/results')
      ]);

      const [participantsData, teamsData, candidatesData, resultsData] = await Promise.all([
        participantsRes.json(),
        teamsRes.json(),
        candidatesRes.json(),
        resultsRes.json()
      ]);

      setParticipants(participantsData || []);
      setTeams(teamsData || []);
      setCandidates(candidatesData || []);
      setResults(resultsData || []);
    } catch (error: any) {
      console.error('Error fetching programme data:', error);
      setError(error.message || 'Failed to load programme data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'arts': return '🎭';
      case 'sports': return '⚽';
      default: return '🏆';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'arts': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sports': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'senior': return 'bg-red-100 text-red-800';
      case 'junior': return 'bg-yellow-100 text-yellow-800';
      case 'sub-junior': return 'bg-pink-100 text-pink-800';
      case 'general': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionTypeIcon = (positionType: string) => {
    switch (positionType) {
      case 'individual': return '👤';
      case 'group': return '👥';
      case 'general': return '🌟';
      default: return '📋';
    }
  };

  const getTeamByCode = (teamCode: string) => {
    return teams.find(team => team.code === teamCode);
  };

  const getCandidateByChestNumber = (chestNumber: string) => {
    return candidates.find(candidate => candidate.chestNumber === chestNumber);
  };

  const getProgrammeResults = () => {
    if (!programme) return [];
    return results.filter(r => r.programme.includes(programme.name));
  };

  const getProgrammeStatus = () => {
    const programmeResults = getProgrammeResults();
    if (programmeResults.length > 0) return 'completed';
    if (programme?.status === 'active') return 'active';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'active': return '🔄';
      case 'upcoming': return '⏰';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading programme details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !programme) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Programme Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The requested programme could not be found.'}</p>
            <Link
              href="/programmes"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Programmes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = getProgrammeStatus();
  const programmeResults = getProgrammeResults();
  const totalParticipants = participants.reduce((sum, p) => sum + p.participants.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <PublicNavbar />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getCategoryIcon(programme.category)}</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{programme.name}</h1>
                  <p className="text-gray-600 font-mono">{programme.code}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getCategoryColor(programme.category)}`}>
                {programme.category.toUpperCase()}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getSectionColor(programme.section)}`}>
                {programme.section.toUpperCase()}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
                {getStatusIcon(status)} {status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{participants.length}</div>
            <div className="text-sm text-gray-600">Registered Teams</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{totalParticipants}</div>
            <div className="text-sm text-gray-600">Total Participants</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{programme.requiredParticipants}</div>
            <div className="text-sm text-gray-600">Required per Team</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{programmeResults.length}</div>
            <div className="text-sm text-gray-600">Results Available</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex space-x-1 p-1">
            {[
              { id: 'overview', label: '📋 Overview', count: null },
              { id: 'participants', label: '👥 Participants', count: participants.length },
              { id: 'results', label: '🏅 Results', count: programmeResults.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label} {tab.count !== null && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Programme Details */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Programme Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Programme Code</label>
                    <p className="text-lg font-semibold text-gray-900 font-mono">{programme.code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Programme Name</label>
                    <p className="text-lg font-semibold text-gray-900">{programme.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(programme.category)}`}>
                      {getCategoryIcon(programme.category)} {programme.category.toUpperCase()}
                    </span>
                  </div>
                  {programme.subcategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Subcategory</label>
                      <p className="text-lg text-gray-900 capitalize">{programme.subcategory}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Section</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSectionColor(programme.section)}`}>
                      {programme.section.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Position Type</label>
                    <span className="inline-flex items-center text-lg text-gray-900">
                      {getPositionTypeIcon(programme.positionType)} 
                      <span className="ml-2 capitalize">{programme.positionType}</span>
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Required Participants</label>
                    <p className="text-lg font-semibold text-blue-600">{programme.requiredParticipants}</p>
                  </div>
                  {programme.maxParticipants && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Maximum Participants</label>
                      <p className="text-lg font-semibold text-orange-600">{programme.maxParticipants}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Current Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
                      {getStatusIcon(status)} {status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration Statistics */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Registration Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{participants.length}</div>
                    <div className="text-sm text-blue-700">Total Teams</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {participants.filter(p => p.status === 'confirmed').length}
                    </div>
                    <div className="text-sm text-green-700">Confirmed</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {participants.filter(p => p.status === 'registered').length}
                    </div>
                    <div className="text-sm text-yellow-700">Pending</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{totalParticipants}</div>
                    <div className="text-sm text-purple-700">Total Participants</div>
                  </div>
                </div>
              </div>

              {/* Team Participation Overview */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Team Participation</h2>
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="text-gray-600">No teams have registered for this programme yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {participants.slice(0, 6).map((participation) => {
                      const team = getTeamByCode(participation.teamCode);
                      return (
                        <div key={participation._id?.toString()} className="border rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: team?.color || '#6B7280' }}
                            >
                              {participation.teamCode}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{team?.name || participation.teamCode}</h4>
                              <p className="text-xs text-gray-500">{participation.participants.length} participants</p>
                            </div>
                          </div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            participation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {participation.status}
                          </span>
                        </div>
                      );
                    })}
                    {participants.length > 6 && (
                      <div className="border rounded-lg p-4 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-600 text-sm">+{participants.length - 6} more teams</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-6">
              {participants.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Participants Yet</h3>
                  <p className="text-gray-600">No teams have registered for this programme yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {participants.map((participation) => {
                    const team = getTeamByCode(participation.teamCode);
                    return (
                      <div key={participation._id?.toString()} className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: team?.color || '#6B7280' }}
                              >
                                {participation.teamCode}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{team?.name || participation.teamCode}</h3>
                                <p className="text-sm text-gray-600">{team?.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                participation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {participation.status === 'confirmed' ? '✅' : '⏳'} {participation.status.toUpperCase()}
                              </span>
                              <div className="text-sm text-gray-500 mt-1">
                                {participation.participants.length} participant{participation.participants.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <h4 className="font-medium text-gray-700 mb-3">Participants:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {participation.participants.map((chestNumber, index) => {
                              const candidate = getCandidateByChestNumber(chestNumber);
                              return (
                                <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                                  <div className="flex items-center space-x-3">
                                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-mono font-bold">
                                      {chestNumber}
                                    </span>
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {candidate?.name || 'Unknown Candidate'}
                                      </div>
                                      <div className="text-xs text-gray-500 capitalize">
                                        {candidate?.section || 'Unknown Section'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              {programmeResults.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <div className="text-6xl mb-4">🏅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Results Yet</h3>
                  <p className="text-gray-600">
                    {status === 'upcoming' 
                      ? 'This programme has not started yet.' 
                      : status === 'active' 
                      ? 'This programme is currently in progress. Results will be published soon.'
                      : 'Results will be published once available.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {programmeResults.map((result) => (
                    <div key={result._id?.toString()} className="bg-white rounded-xl shadow-sm border">
                      <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">🏆 Results</h3>
                            <p className="text-sm text-gray-600">Programme: {programme.name}</p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            ✅ Completed
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-6">
                        {/* Position Results */}
                        {[
                          { 
                            position: 'First Place', 
                            participants: result.firstPlace, 
                            teams: result.firstPlaceTeams,
                            color: 'bg-yellow-50 border-yellow-200',
                            textColor: 'text-yellow-800',
                            icon: '🥇'
                          },
                          { 
                            position: 'Second Place', 
                            participants: result.secondPlace, 
                            teams: result.secondPlaceTeams,
                            color: 'bg-gray-50 border-gray-200',
                            textColor: 'text-gray-800',
                            icon: '🥈'
                          },
                          { 
                            position: 'Third Place', 
                            participants: result.thirdPlace, 
                            teams: result.thirdPlaceTeams,
                            color: 'bg-orange-50 border-orange-200',
                            textColor: 'text-orange-800',
                            icon: '🥉'
                          }
                        ].map(({ position, participants, teams, color, textColor, icon }) => {
                          const hasParticipants = participants && participants.length > 0;
                          const hasTeams = teams && teams.length > 0;
                          
                          if (!hasParticipants && !hasTeams) return null;
                          
                          return (
                            <div key={position} className={`p-4 rounded-lg border ${color}`}>
                              <h4 className={`font-bold mb-3 ${textColor} flex items-center space-x-2`}>
                                <span className="text-2xl">{icon}</span>
                                <span>{position}</span>
                              </h4>
                              
                              {hasParticipants && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {participants.map((participant, index) => {
                                    const candidate = getCandidateByChestNumber(participant.chestNumber);
                                    return (
                                      <div key={index} className="bg-white p-3 rounded-lg border">
                                        <div className="flex items-center space-x-3">
                                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-mono font-bold">
                                            {participant.chestNumber}
                                          </span>
                                          <div>
                                            <div className="font-medium text-gray-900">
                                              {candidate?.name || 'Unknown Candidate'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              Team: {candidate?.team || 'Unknown'}
                                            </div>
                                            {participant.grade && (
                                              <div className="text-xs font-medium text-blue-600">
                                                Grade: {participant.grade}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {hasTeams && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {teams.map((teamResult, index) => {
                                    const team = getTeamByCode(teamResult.teamCode);
                                    return (
                                      <div key={index} className="bg-white p-3 rounded-lg border">
                                        <div className="flex items-center space-x-3">
                                          <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                            style={{ backgroundColor: team?.color || '#6B7280' }}
                                          >
                                            {teamResult.teamCode}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">
                                              {team?.name || teamResult.teamCode}
                                            </div>
                                            {teamResult.grade && (
                                              <div className="text-xs font-medium text-blue-600">
                                                Grade: {teamResult.grade}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Participation Grades */}
                        {result.participationGrades && result.participationGrades.length > 0 && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-bold text-blue-800 mb-3">🎖️ Participation Grades</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {result.participationGrades.map((grade, index) => {
                                const candidate = getCandidateByChestNumber(grade.chestNumber);
                                return (
                                  <div key={index} className="bg-white p-3 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-mono">
                                          {grade.chestNumber}
                                        </span>
                                        <span className="text-sm font-medium">
                                          {candidate?.name || 'Unknown'}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-bold text-blue-600">Grade: {grade.grade}</div>
                                        <div className="text-xs text-gray-500">{grade.points} pts</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {result.notes && (
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-bold text-gray-800 mb-2">📝 Notes</h4>
                            <p className="text-gray-700 text-sm">{result.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}