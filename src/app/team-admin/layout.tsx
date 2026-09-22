'use client';

import { useState, useEffect } from 'react';
import { Team } from '@/types';
import TeamSidebar from '@/components/TeamAdmin/TeamSidebar';
import TeamHeader from '@/components/TeamAdmin/TeamHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TeamAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
    // Check if user is team captain and get their team
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.userType === 'team-captain' && user.team) {
          setSelectedTeam(user.team.code);
        } else if (user.userType === 'admin') {
          const urlParams = new URLSearchParams(window.location.search);
          const teamFromUrl = urlParams.get('team');
          const savedTeam = localStorage.getItem('selectedTeam');
          
          if (teamFromUrl) {
            setSelectedTeam(teamFromUrl);
            localStorage.setItem('selectedTeam', teamFromUrl);
          } else if (savedTeam) {
            setSelectedTeam(savedTeam);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (teamCode: string) => {
    setSelectedTeam(teamCode);
    localStorage.setItem('selectedTeam', teamCode);
    // Redirect to dashboard with team parameter
    window.location.href = `/team-admin?team=${teamCode}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (!selectedTeam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Admin Portal</h1>
            <p className="text-gray-600">Select your team to access the admin dashboard</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-center">Choose Your Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <button
                  key={team._id?.toString()}
                  onClick={() => handleTeamSelect(team.code)}
                  className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  style={{ borderColor: team.color + '40' }}
                >
                  <div className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-lg"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.code}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{team.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                    <div className="flex justify-center items-center space-x-4 text-xs text-gray-500">
                      <span>👥 {team.members} members</span>
                      <span>🏆 {team.points} points</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedTeamData = teams.find(t => t.code === selectedTeam);

  return (
    <ProtectedRoute requireTeamCaptain={true}>
      <div className="flex min-h-screen bg-gray-50 font-poppins"
           style={{
             backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }}>
        <TeamSidebar 
          selectedTeam={selectedTeam} 
          teamData={selectedTeamData}
          onSwitchTeam={() => {
            setSelectedTeam('');
            localStorage.removeItem('selectedTeam');
          }}
        />
        <div className="w-full bg-transparent">
          <TeamHeader teamData={selectedTeamData} />
          <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[calc(100vh-200px)]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}