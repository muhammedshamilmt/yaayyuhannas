'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Candidate, Programme, ProgrammeParticipant, Result } from '@/types';

export default function TeamDashboard() {
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('team') || 'SMD'; // Default to SMD for demo
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [teamCode]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, programmesRes, participantsRes, resultsRes] = await Promise.all([
        fetch(`/api/candidates?team=${teamCode}`),
        fetch('/api/programmes'),
        fetch(`/api/programme-participants?team=${teamCode}`),
        fetch('/api/results')
      ]);

      const [candidatesData, programmesData, participantsData, resultsData] = await Promise.all([
        candidatesRes.json(),
        programmesRes.json(),
        participantsRes.json(),
        resultsRes.json()
      ]);

      setCandidates(candidatesData);
      setProgrammes(programmesData);
      setParticipants(participantsData);
      setResults(resultsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalCandidates = candidates.length;
  const totalParticipations = participants.length;
  const totalPoints = candidates.reduce((sum, candidate) => sum + candidate.points, 0);
  const avgPoints = totalCandidates > 0 ? (totalPoints / totalCandidates).toFixed(1) : '0';

  // Group candidates by section
  const candidatesBySection = {
    senior: candidates.filter(c => c.section === 'senior').length,
    junior: candidates.filter(c => c.section === 'junior').length,
    'sub-junior': candidates.filter(c => c.section === 'sub-junior').length,
    general: candidates.filter(c => c.section === 'general').length
  };

  // Recent activities (mock data for now)
  const recentActivities = [
    { type: 'registration', message: 'Registered for Football (SP001)', time: '2 hours ago' },
    { type: 'candidate', message: 'Added new candidate SMD013', time: '1 day ago' },
    { type: 'result', message: 'Won 2nd place in Basketball', time: '2 days ago' },
    { type: 'registration', message: 'Registered for Classical Dance', time: '3 days ago' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to Team Dashboard</h1>
        <p className="text-blue-100">Manage your team, track performance, and stay updated with the latest activities.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{totalCandidates}</h3>
              <p className="text-sm text-gray-600">Total Candidates</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{totalParticipations}</h3>
              <p className="text-sm text-gray-600">Programme Registrations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{totalPoints}</h3>
              <p className="text-sm text-gray-600">Total Points</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{avgPoints}</h3>
              <p className="text-sm text-gray-600">Average Points</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidates by Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Candidates by Section</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(candidatesBySection).map(([section, count]) => (
                <div key={section} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {section.replace('-', ' ')}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{count} candidates</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'registration' ? 'bg-green-500' :
                    activity.type === 'candidate' ? 'bg-blue-500' :
                    activity.type === 'result' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/team-admin/candidates"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">👥</span>
              <div>
                <h3 className="font-medium text-gray-900">Manage Candidates</h3>
                <p className="text-sm text-gray-600">Add or edit team members</p>
              </div>
            </a>
            
            <a
              href="/team-admin/programmes"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">🎯</span>
              <div>
                <h3 className="font-medium text-gray-900">Register Programmes</h3>
                <p className="text-sm text-gray-600">Join competitions</p>
              </div>
            </a>
            
            <a
              href="/team-admin/results"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">🏅</span>
              <div>
                <h3 className="font-medium text-gray-900">View Results</h3>
                <p className="text-sm text-gray-600">Check performance</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}