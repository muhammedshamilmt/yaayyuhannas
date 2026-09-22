'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { FestivalInfo, Team, Programme, Schedule } from '@/types';

export default function BasicPage() {
  const [festivalInfo, setFestivalInfo] = useState<FestivalInfo | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [festivalRes, teamsRes, programmesRes, scheduleRes] = await Promise.all([
          fetch('/api/festival-info'),
          fetch('/api/teams'),
          fetch('/api/programmes'),
          fetch('/api/schedule')
        ]);

        const [festivalData, teamsData, programmesData, scheduleData] = await Promise.all([
          festivalRes.json(),
          teamsRes.json(),
          programmesRes.json(),
          scheduleRes.json()
        ]);

        setFestivalInfo(festivalData);
        setTeams(teamsData);
        setProgrammes(programmesData);
        setSchedule(scheduleData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTeamColor = (teamName: string) => {
    switch (teamName.toLowerCase()) {
      case 'team sumud': return 'bg-green-500';
      case 'team aqsa': return 'bg-gray-800';
      case 'team inthifada': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const artsProgrammes = programmes.filter(p => p.category === 'arts');
  const sportsProgrammes = programmes.filter(p => p.category === 'sports');

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Basic" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading festival data...</p>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <Breadcrumb pageName="Basic" />

      <div className="space-y-6">
        {/* Festival 2K25 Structure */}
        <ShowcaseSection title="Festival 2K25 Structure">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">🎭</span>
                  Festival Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Festival Name:</span>
                    <span className="text-gray-900 font-medium">{festivalInfo?.name || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="text-gray-900 font-medium">{schedule.length} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="text-gray-900 font-medium">{festivalInfo?.startDate ? formatDate(festivalInfo.startDate) : 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="text-gray-900 font-medium">{festivalInfo?.endDate ? formatDate(festivalInfo.endDate) : 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venue:</span>
                    <span className="text-gray-900 font-medium">{festivalInfo?.venue || 'Loading...'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">📊</span>
                  Festival Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{teams.reduce((sum, team) => sum + team.members, 0)}</div>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{teams.length}</div>
                    <p className="text-sm text-gray-600">Teams</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{programmes.length}</div>
                    <p className="text-sm text-gray-600">Programmes</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">2</div>
                    <p className="text-sm text-gray-600">Categories</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">🏗️</span>
                  Programme Structure
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🎨</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Arts Category</p>
                        <p className="text-xs text-gray-600">Individual & Group</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{artsProgrammes.length} programmes</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">⚽</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Sports Category</p>
                        <p className="text-xs text-gray-600">Individual & Group</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{sportsProgrammes.length} programmes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">👥</span>
                  Team Structure
                </h3>
                <div className="space-y-3">
                  {teams.map((team, index) => (
                    <div key={team._id || index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${getTeamColor(team.name)} rounded-lg flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">{team.name.split(' ')[1]?.[0] || 'T'}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{team.name}</p>
                          <p className="text-xs text-gray-600">{team.description}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{team.members} members</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">🏆</span>
                  Section Categories
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">Senior</div>
                    <p className="text-xs text-gray-600">Ages 16-18</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">Junior</div>
                    <p className="text-xs text-gray-600">Ages 13-15</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">Sub Junior</div>
                    <p className="text-xs text-gray-600">Ages 10-12</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">General</div>
                    <p className="text-xs text-gray-600">All Ages</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ShowcaseSection>

        {/* Programme Categories */}
        <ShowcaseSection title="Programme Categories">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="font-bold text-gray-900 text-2xl mb-2">Arts</h3>
                <p className="text-gray-600 text-sm">Creative & Artistic Programmes</p>
              </div>
              <ul className="text-sm text-gray-700 space-y-3 font-medium">
                {artsProgrammes.map((programme, index) => (
                  <li key={programme._id || index} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{programme.name}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-center">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">{artsProgrammes.length} Programmes</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚽</div>
                <h3 className="font-bold text-gray-900 text-2xl mb-2">Sports</h3>
                <p className="text-gray-600 text-sm">Athletic & Physical Programmes</p>
              </div>
              <ul className="text-sm text-gray-700 space-y-3 font-medium">
                {sportsProgrammes.map((programme, index) => (
                  <li key={programme._id || index} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{programme.name}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-center">
                <span className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium">{sportsProgrammes.length} Programmes</span>
              </div>
            </div>
          </div>
        </ShowcaseSection>

        {/* Festival Schedule Overview */}
        <ShowcaseSection title="Festival Schedule Overview">
          <div className="space-y-4">
            {schedule.map((scheduleItem, index) => (
              <div key={scheduleItem._id || index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-white">{scheduleItem.day}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Day {scheduleItem.day} - {formatDate(scheduleItem.date)}</h3>
                      <p className="text-gray-600 font-medium">{scheduleItem.events}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    scheduleItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                    scheduleItem.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {scheduleItem.status.charAt(0).toUpperCase() + scheduleItem.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 ml-16">{scheduleItem.details}</p>
              </div>
            ))}
          </div>
        </ShowcaseSection>
      </div>
    </>
  );
}