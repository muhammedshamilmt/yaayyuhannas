'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Team } from '@/types';

export default function TeamDetailsPage() {
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('team') || 'SMD';
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    motto: '',
    captain: '',
    leaders: [] as string[]
  });

  useEffect(() => {
    fetchTeamDetails();
  }, [teamCode]);

  const fetchTeamDetails = async () => {
    try {
      const response = await fetch('/api/teams');
      const teams = await response.json();
      const teamData = teams.find((t: Team) => t.code === teamCode);
      
      if (teamData) {
        setTeam(teamData);
        setFormData({
          name: teamData.name || '',
          description: teamData.description || '',
          motto: teamData.motto || '',
          captain: teamData.captain || '',
          leaders: teamData.leaders || []
        });
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!team) return;
    
    try {
      const response = await fetch(`/api/teams?id=${team._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setEditing(false);
        fetchTeamDetails();
        alert('Team details updated successfully!');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Error updating team details');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Team Not Found</h2>
        <p className="text-gray-600">The requested team could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Team Details</h1>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className={`px-4 py-2 rounded-lg font-medium ${
            editing 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {editing ? 'Save Changes' : 'Edit Details'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{team.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Code</label>
                <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">{team.code}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{team.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Motto</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.motto}
                    onChange={(e) => setFormData({...formData, motto: e.target.value})}
                    placeholder="Enter team motto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 italic">{team.motto || 'No motto set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Leadership */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Leadership</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Captain</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.captain}
                    onChange={(e) => setFormData({...formData, captain: e.target.value})}
                    placeholder="Enter captain name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{team.captain || 'Not assigned'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Leaders</label>
                {editing ? (
                  <div className="space-y-2">
                    {formData.leaders.map((leader, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={leader}
                          onChange={(e) => {
                            const newLeaders = [...formData.leaders];
                            newLeaders[index] = e.target.value;
                            setFormData({...formData, leaders: newLeaders});
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => {
                            const newLeaders = formData.leaders.filter((_, i) => i !== index);
                            setFormData({...formData, leaders: newLeaders});
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setFormData({...formData, leaders: [...formData.leaders, '']})}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                    >
                      + Add Leader
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {team.leaders && team.leaders.length > 0 ? (
                      team.leaders.map((leader, index) => (
                        <p key={index} className="text-gray-900">{leader}</p>
                      ))
                    ) : (
                      <p className="text-gray-500">No leaders assigned</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Team Statistics</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Members</span>
                <span className="font-semibold text-gray-900">{team.members}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Points</span>
                <span className="font-semibold text-gray-900">{team.points}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Team Color</span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: team.color }}
                  ></div>
                  <span className="text-sm font-mono text-gray-900">{team.color}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Team Identity</h2>
            </div>
            <div className="p-6 text-center">
              <div 
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{ backgroundColor: team.color }}
              >
                {team.code}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
              <p className="text-sm text-gray-600">{team.description}</p>
              {team.motto && (
                <p className="text-sm text-gray-500 italic mt-2">"{team.motto}"</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setEditing(false);
              setFormData({
                name: team.name || '',
                description: team.description || '',
                motto: team.motto || '',
                captain: team.captain || '',
                leaders: team.leaders || []
              });
            }}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}