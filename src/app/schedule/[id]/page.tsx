'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Schedule, Programme, ProgrammeParticipant, Team, Candidate, Result } from '@/types';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter } from '@/components/Navigation/PublicFooter';

interface ScheduleDetailProps {}

export default function ScheduleDetailPage({}: ScheduleDetailProps) {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.id as string;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'programmes' | 'participants' | 'results'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'arts' | 'sports'>('all');
  const [selectedSection, setSelectedSection] = useState<'all' | 'senior' | 'junior' | 'sub-junior' | 'general'>('all');

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleData();
    }
  }, [scheduleId]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data
      const [schedulesRes, programmesRes, participantsRes, teamsRes, candidatesRes, resultsRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/programmes'),
        fetch('/api/programme-participants'),
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/results')
      ]);

      const [schedulesData, programmesData, participantsData, teamsData, candidatesData, resultsData] = await Promise.all([
        schedulesRes.json(),
        programmesRes.json(),
        participantsRes.json(),
        teamsRes.json(),
        candidatesRes.json(),
        resultsRes.json()
      ]);

      // Find the specific schedule
      const currentSchedule = schedulesData.find((s: Schedule) => s._id?.toString() === scheduleId);
      if (!currentSchedule) {
        throw new Error('Schedule not found');
      }

      setSchedule(currentSchedule);
      
      // Get programmes for this day (demo: distribute programmes across days)
      const scheduleIndex = schedulesData.findIndex((s: Schedule) => s._id?.toString() === scheduleId);
      const dayProgrammes = programmesData.filter((_: Programme, index: number) => 
        index % schedulesData.length === scheduleIndex
      );

      setProgrammes(dayProgrammes);
      setParticipants(participantsData);
      setTeams(teamsData);
      setCandidates(candidatesData);
      setResults(resultsData);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'upcoming': return '⏰';
      default: return '📅';
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

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTeamByCode = (teamCode: string) => {
    return teams.find(team => team.code === teamCode);
  };

  const getCandidateByChestNumber = (chestNumber: string) => {
    return candidates.find(candidate => candidate.chestNumber === chestNumber);
  };

  const getProgrammeParticipants = (programmeId: string) => {
    return participants.filter(p => p.programmeId === programmeId);
  };

  const getProgrammeResults = (programmeName: string) => {
    return results.filter(r => r.programme.includes(programmeName));
  };

  const filteredProgrammes = programmes.filter(programme => {
    const categoryMatch = selectedCategory === 'all' || programme.category === selectedCategory;
    const sectionMatch = selectedSection === 'all' || programme.section === selectedSection;
    return categoryMatch && sectionMatch;
  });

  const dayParticipants = participants.filter(p => 
    programmes.some(prog => prog._id?.toString() === p.programmeId)
  );

  const completedProgrammes = programmes.filter(prog =>
    results.some(result => result.programme.includes(prog.name))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schedule details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Not Found</h2>
            <p className="text-gray-600 mb-4">The requested schedule could not be found.</p>
            <Link
              href="/schedule"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Schedule
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Day {schedule.day}: {schedule.title}</h1>
                <p className="text-gray-600">{formatDate(schedule.date)}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(schedule.status)}`}>
              {getStatusIcon(schedule.status)} {schedule.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{programmes.length}</div>
            <div className="text-sm text-gray-600">Total Programmes</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {dayParticipants.reduce((sum, p) => sum + p.participants.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Participants</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{completedProgrammes.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {new Set(dayParticipants.map(p => p.teamCode)).size}
            </div>
            <div className="text-sm text-gray-600">Teams Participating</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex space-x-1 p-1">
            {[
              { id: 'overview', label: '📋 Overview', count: null },
              { id: 'programmes', label: '🏆 Programmes', count: programmes.length },
              { id: 'participants', label: '👥 Participants', count: dayParticipants.reduce((sum, p) => sum + p.participants.length, 0) },
              { id: 'results', label: '🏅 Results', count: completedProgrammes.length }
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
              {/* Schedule Details */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Schedule Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Event Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Title:</span> {schedule.title}</p>
                      <p><span className="font-medium">Date:</span> {formatDate(schedule.date)}</p>
                      <p><span className="font-medium">Day:</span> {schedule.day}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Event Details</h3>
                    <p className="text-sm text-gray-600">{schedule.details}</p>
                    {schedule.events && (
                      <div className="mt-3">
                        <h4 className="font-medium text-gray-700 text-sm">Events:</h4>
                        <p className="text-sm text-gray-600">{schedule.events}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Programme Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['arts', 'sports'].map((category) => {
                    const categoryProgrammes = programmes.filter(p => p.category === category);
                    const categoryParticipants = dayParticipants.filter(p => 
                      categoryProgrammes.some(prog => prog._id?.toString() === p.programmeId)
                    );
                    
                    return (
                      <div key={category} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-2xl">{getCategoryIcon(category)}</span>
                          <h3 className="text-lg font-semibold capitalize">{category}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{categoryProgrammes.length}</div>
                            <div className="text-gray-600">Programmes</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {categoryParticipants.reduce((sum, p) => sum + p.participants.length, 0)}
                            </div>
                            <div className="text-gray-600">Participants</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'programmes' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="arts">Arts</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Sections</option>
                      <option value="senior">Senior</option>
                      <option value="junior">Junior</option>
                      <option value="sub-junior">Sub Junior</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Programmes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProgrammes.map((programme) => {
                  const programmeParticipants = getProgrammeParticipants(programme._id?.toString() || '');
                  const programmeResults = getProgrammeResults(programme.name);
                  const hasResults = programmeResults.length > 0;
                  
                  return (
                    <Link
                      key={programme._id?.toString()}
                      href={`/programmes/${programme._id}`}
                      className="block group"
                    >
                      <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden group-hover:scale-105">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getCategoryIcon(programme.category)}</span>
                              <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {programme.name}
                                </h3>
                                <p className="text-sm text-gray-500 font-mono">{programme.code}</p>
                              </div>
                            </div>
                            {hasResults && (
                              <span className="text-green-500 text-lg">🏅</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(programme.category)}`}>
                              {programme.category}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSectionColor(programme.section)}`}>
                              {programme.section}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {programme.positionType}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-bold text-blue-600">{programmeParticipants.length}</div>
                              <div className="text-gray-600">Teams</div>
                            </div>
                            <div>
                              <div className="font-bold text-green-600">
                                {programmeParticipants.reduce((sum, p) => sum + p.participants.length, 0)}
                              </div>
                              <div className="text-gray-600">Participants</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 px-6 py-3 border-t">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              {hasResults ? 'Results Available' : 'View Details'}
                            </span>
                            <span className="text-blue-600 group-hover:text-blue-800">→</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-6">
              {/* Participants by Team */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Participating Teams</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {Array.from(new Set(dayParticipants.map(p => p.teamCode))).map((teamCode) => {
                    const team = getTeamByCode(teamCode);
                    const teamParticipations = dayParticipants.filter(p => p.teamCode === teamCode);
                    const totalParticipants = teamParticipations.reduce((sum, p) => sum + p.participants.length, 0);
                    
                    return (
                      <div key={teamCode} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: team?.color || '#6B7280' }}
                            >
                              {teamCode}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{team?.name || teamCode}</h3>
                              <p className="text-sm text-gray-600">{team?.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{teamParticipations.length}</div>
                            <div className="text-sm text-gray-600">Programmes</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {teamParticipations.map((participation) => {
                            const programme = programmes.find(p => p._id?.toString() === participation.programmeId);
                            return (
                              <div key={participation._id?.toString()} className="bg-gray-50 rounded-lg p-3 border">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-lg">{getCategoryIcon(programme?.category || '')}</span>
                                  <span className="font-medium text-gray-900 text-sm">{programme?.name}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {participation.participants.map((chestNumber, index) => (
                                    <span key={index} className="bg-white px-2 py-1 rounded text-xs font-mono">
                                      {chestNumber}
                                    </span>
                                  ))}
                                </div>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${participation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {participation.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              {completedProgrammes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <div className="text-6xl mb-4">🏅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Results Yet</h3>
                  <p className="text-gray-600">Results will be published as programmes are completed.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {completedProgrammes.map((programme) => {
                    const programmeResults = getProgrammeResults(programme.name);
                    
                    return (
                      <div key={programme._id?.toString()} className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getCategoryIcon(programme.category)}</span>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{programme.name}</h3>
                                <p className="text-sm text-gray-600">{programme.code} • {programme.section} • {programme.category}</p>
                              </div>
                            </div>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              ✅ Completed
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          {programmeResults.map((result) => (
                            <div key={result._id?.toString()} className="space-y-4">
                              {/* Position Results */}
                              {[
                                { position: 'First Place', participants: result.firstPlace, color: 'text-yellow-600 bg-yellow-50' },
                                { position: 'Second Place', participants: result.secondPlace, color: 'text-gray-600 bg-gray-50' },
                                { position: 'Third Place', participants: result.thirdPlace, color: 'text-orange-600 bg-orange-50' }
                              ].map(({ position, participants, color }) => (
                                participants && participants.length > 0 && (
                                  <div key={position} className={`p-4 rounded-lg ${color}`}>
                                    <h4 className="font-bold mb-2">{position}</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {participants.map((participant, index) => {
                                        const candidate = getCandidateByChestNumber(participant.chestNumber);
                                        return (
                                          <div key={index} className="bg-white px-3 py-2 rounded-lg border">
                                            <div className="font-mono text-sm">{participant.chestNumber}</div>
                                            <div className="text-sm">{candidate?.name || 'Unknown'}</div>
                                            {participant.grade && (
                                              <div className="text-xs font-medium">{participant.grade}</div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )
                              ))}
                              
                              {result.notes && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h4 className="font-bold text-blue-900 mb-2">Notes</h4>
                                  <p className="text-blue-800 text-sm">{result.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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