'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Schedule, Programme, ProgrammeParticipant, Team, Candidate, Result } from '@/types';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter } from '@/components/Navigation/PublicFooter';

interface ScheduleWithProgrammes extends Schedule {
  programmes: Programme[];
  totalParticipants: number;
  completedProgrammes: number;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleWithProgrammes[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
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

      // Process schedules with programme data
      const processedSchedules = (schedulesData || []).map((schedule: Schedule, index: number) => {
        // Distribute programmes across days for demo purposes
        const dayProgrammes = (programmesData || []).filter((_: Programme, progIndex: number) => 
          progIndex % (schedulesData?.length || 1) === index
        );

        // Calculate participants for this day
        const dayParticipants = (participantsData || []).filter((p: ProgrammeParticipant) => 
          dayProgrammes.some((prog: Programme) => prog._id?.toString() === p.programmeId)
        );

        // Calculate completed programmes
        const completedProgrammes = dayProgrammes.filter((prog: Programme) =>
          (resultsData || []).some((result: Result) => result.programme.includes(prog.name))
        ).length;

        return {
          ...schedule,
          programmes: dayProgrammes,
          totalParticipants: dayParticipants.reduce((sum: number, p: ProgrammeParticipant) => sum + p.participants.length, 0),
          completedProgrammes
        };
      });

      setSchedules(processedSchedules);
      setProgrammes(programmesData || []);
      setParticipants(participantsData || []);
      setTeams(teamsData || []);
      setCandidates(candidatesData || []);
      setResults(resultsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading festival schedule...</p>
            </div>
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
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🎪 Festival Schedule</h1>
            <p className="text-lg text-gray-600">Wattaqa Arts Festival 2K25 - Complete Program</p>
            <div className="mt-4 flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="text-gray-600">Upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* View Mode Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📊 Grid View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📅 Timeline View
            </button>
          </div>
          
          {/* Day Filter */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedDay(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedDay === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Days
            </button>
            {schedules.map((schedule) => (
              <button
                key={schedule._id?.toString()}
                onClick={() => setSelectedDay(schedule.day)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedDay === schedule.day
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Day {schedule.day}
              </button>
            ))}
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Schedule Available</h2>
            <p className="text-gray-600">The festival schedule will be published soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Schedule Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{schedules.length}</div>
                <div className="text-sm text-gray-600">Festival Days</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {schedules.reduce((sum, s) => sum + s.programmes.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Programmes</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {schedules.reduce((sum, s) => sum + s.totalParticipants, 0)}
                </div>
                <div className="text-sm text-gray-600">Participants</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {schedules.reduce((sum, s) => sum + s.completedProgrammes, 0)}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>

            {/* Schedule Content */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {schedules
                  .filter(schedule => selectedDay === null || schedule.day === selectedDay)
                  .map((schedule) => (
                    <Link
                      key={schedule._id?.toString()}
                      href={`/schedule/${schedule._id}`}
                      className="block group"
                    >
                      <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden group-hover:scale-105">
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-bold mb-1">Day {schedule.day}</h3>
                              <p className="text-blue-100 text-sm">{formatDate(schedule.date)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(schedule.status)}`}>
                              {getStatusIcon(schedule.status)} {schedule.status.toUpperCase()}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold mt-3">{schedule.title}</h4>
                        </div>

                        {/* Card Content */}
                        <div className="p-6">
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{schedule.details}</p>
                          
                          {/* Statistics */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{schedule.programmes.length}</div>
                              <div className="text-xs text-gray-500">Programmes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{schedule.totalParticipants}</div>
                              <div className="text-xs text-gray-500">Participants</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">{schedule.completedProgrammes}</div>
                              <div className="text-xs text-gray-500">Completed</div>
                            </div>
                          </div>

                          {/* Programme Preview */}
                          {schedule.programmes.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-gray-700">Featured Programmes:</h5>
                              <div className="space-y-1">
                                {schedule.programmes.slice(0, 3).map((programme) => (
                                  <div key={programme._id?.toString()} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">{getCategoryIcon(programme.category)}</span>
                                      <span className="text-gray-700 truncate">{programme.name}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getSectionColor(programme.section)}`}>
                                      {programme.section}
                                    </span>
                                  </div>
                                ))}
                                {schedule.programmes.length > 3 && (
                                  <div className="text-xs text-gray-500 text-center">
                                    +{schedule.programmes.length - 3} more programmes
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="bg-gray-50 px-6 py-3 border-t">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Click to view details</span>
                            <span className="text-blue-600 group-hover:text-blue-800">→</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              /* Timeline View */
              <div className="space-y-8">
                {schedules
                  .filter(schedule => selectedDay === null || schedule.day === selectedDay)
                  .map((schedule, index) => (
                    <div key={schedule._id?.toString()} className="relative">
                      {/* Timeline Line */}
                      {index < schedules.length - 1 && (
                        <div className="absolute left-8 top-16 w-0.5 h-full bg-gray-300 z-0"></div>
                      )}
                      
                      {/* Timeline Node */}
                      <div className="relative flex items-start space-x-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg z-10 ${
                          schedule.status === 'completed' ? 'bg-green-500' :
                          schedule.status === 'in-progress' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}>
                          {schedule.day}
                        </div>
                        
                        {/* Timeline Content */}
                        <Link href={`/schedule/${schedule._id}`} className="flex-1 group">
                          <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 p-6 group-hover:scale-105">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{schedule.title}</h3>
                                <p className="text-gray-600">{formatDate(schedule.date)}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(schedule.status)}`}>
                                {getStatusIcon(schedule.status)} {schedule.status.toUpperCase()}
                              </span>
                            </div>
                            
                            <p className="text-gray-700 mb-4">{schedule.details}</p>
                            
                            {/* Programme Grid */}
                            {schedule.programmes.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {schedule.programmes.map((programme) => (
                                  <div key={programme._id?.toString()} className="bg-gray-50 rounded-lg p-3 border">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="text-lg">{getCategoryIcon(programme.category)}</span>
                                      <span className="font-medium text-gray-900 text-sm truncate">{programme.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(programme.category)}`}>
                                        {programme.category}
                                      </span>
                                      <span className={`px-2 py-1 rounded-full text-xs ${getSectionColor(programme.section)}`}>
                                        {programme.section}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Statistics Bar */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center text-sm">
                                <div className="flex space-x-4">
                                  <span className="text-gray-600">
                                    <span className="font-medium text-blue-600">{schedule.programmes.length}</span> programmes
                                  </span>
                                  <span className="text-gray-600">
                                    <span className="font-medium text-green-600">{schedule.totalParticipants}</span> participants
                                  </span>
                                  <span className="text-gray-600">
                                    <span className="font-medium text-purple-600">{schedule.completedProgrammes}</span> completed
                                  </span>
                                </div>
                                <span className="text-blue-600 group-hover:text-blue-800">View Details →</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}