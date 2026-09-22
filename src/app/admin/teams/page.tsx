'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Team } from '@/types';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    color: '#3B82F6',
    description: '',
    motto: '',
    captain: '',
    captainEmail: '',
    leaders: ['', '']
  });

  // Predefined color palette
  const colorPalette = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#C026D3', '#DB2777', '#E11D48', '#DC2626',
    '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6'
  ];

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

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure at least 2 leaders are required
    const filteredLeaders = formData.leaders.filter(leader => leader.trim() !== '');
    if (filteredLeaders.length < 2) {
      alert('Please add at least 2 team leaders');
      return;
    }

    const teamData = {
      ...formData,
      leaders: filteredLeaders,
      members: editingTeam ? editingTeam.members : 0, // Preserve existing member count or start with 0
      points: editingTeam ? editingTeam.points : 0   // Preserve existing points or start with 0
    };

    try {
      const url = editingTeam 
        ? `/api/teams?id=${editingTeam._id}` 
        : '/api/teams';
      
      const method = editingTeam ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });

      if (response.ok) {
        await fetchTeams();
        resetForm();
        alert(editingTeam ? 'Team updated successfully!' : 'Team created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save team');
      }
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Failed to save team');
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      code: team.code,
      name: team.name,
      color: team.color,
      description: team.description,
      motto: team.motto || '',
      captain: team.captain,
      captainEmail: team.captainEmail || '',
      leaders: team.leaders && team.leaders.length >= 2 ? team.leaders : ['', '']
    });
    setShowAddForm(true);
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`Are you sure you want to delete team ${team.name}?`)) return;

    try {
      const response = await fetch(`/api/teams?id=${team._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTeams();
        alert('Team deleted successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      color: '#3B82F6',
      description: '',
      motto: '',
      captain: '',
      captainEmail: '',
      leaders: ['', '']
    });
    setEditingTeam(null);
    setShowAddForm(false);
    setShowColorPicker(false);
  };

  const addLeaderField = () => {
    setFormData(prev => ({
      ...prev,
      leaders: [...prev.leaders, '']
    }));
  };

  const removeLeaderField = (index: number) => {
    if (formData.leaders.length > 2) {
      setFormData(prev => ({
        ...prev,
        leaders: prev.leaders.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLeader = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      leaders: prev.leaders.map((leader, i) => i === index ? value : leader)
    }));
  };

  const selectColor = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
    setShowColorPicker(false);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getContrastColor = (hexColor: string) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#FFFFFF';
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Teams" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Teams" />

      <div className="space-y-6">
        {/* Info Section */}
        <ShowcaseSection title="Team Management">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">🏆 Festival Teams</h4>
            <p className="text-sm text-blue-700">
              Manage your festival teams here. You can create, edit, and delete teams. 
              The three main teams (SMD→SUMUD, INT→INTIFADA, AQS→AQSA) are recommended for the festival.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">📋 Sync Information</h4>
            <p className="text-sm text-green-700">
              Teams now sync with Google Sheets automatically! When you create, update, or delete teams, 
              the changes are synced to your Google Sheets including the captain's email address. 
              Team member counts and points are calculated from synced data.
            </p>
          </div>
        </ShowcaseSection>

        {/* Add Team Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">All Teams ({teams.length})</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            + Add New Team
          </button>
        </div>

        {/* Add/Edit Team Form */}
        {showAddForm && (
          <ShowcaseSection title={editingTeam ? "Edit Team" : "Add New Team"}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SMD, INT, AQS"
                    required
                    maxLength={5}
                  />
                </div>

                {/* Team Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SUMUD, INTIFADA, AQSA"
                    required
                  />
                </div>

                {/* Team Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Color *
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div 
                        className="w-12 h-10 rounded-lg border-2 border-gray-300 cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: formData.color }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                      >
                        <span style={{ color: getContrastColor(formData.color) }} className="text-xs font-bold">
                          {formData.code || 'CLR'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#3B82F6"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        required
                      />
                    </div>
                    
                    {/* Color Palette */}
                    {showColorPicker && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-lg">
                        <p className="text-sm font-medium text-gray-700 mb-3">Choose a color:</p>
                        <div className="grid grid-cols-8 gap-2">
                          {colorPalette.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                              style={{ backgroundColor: color }}
                              onClick={() => selectColor(color)}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Captain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Captain *
                  </label>
                  <input
                    type="text"
                    value={formData.captain}
                    onChange={(e) => setFormData(prev => ({ ...prev, captain: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Captain name"
                    required
                  />
                </div>

                {/* Team Captain Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Captain Email
                  </label>
                  <input
                    type="email"
                    value={formData.captainEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, captainEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="captain@example.com"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Team description"
                  required
                />
              </div>

              {/* Team Motto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Motto
                </label>
                <input
                  type="text"
                  value={formData.motto}
                  onChange={(e) => setFormData(prev => ({ ...prev, motto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Team motto or slogan"
                />
              </div>

              {/* Team Leaders */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Leaders (minimum 2 required) *
                </label>
                {formData.leaders.map((leader, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={leader}
                      onChange={(e) => updateLeader(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Leader ${index + 1} name`}
                      required={index < 2}
                    />
                    {formData.leaders.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeLeaderField(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLeaderField}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Another Leader
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </ShowcaseSection>
        )}

        {/* Teams List */}
        <ShowcaseSection title="All Teams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const textColor = getContrastColor(team.color);
              
              return (
                <div key={team._id?.toString()} className="bg-white border border-gray-200 rounded-lg p-6 relative shadow-sm hover:shadow-md transition-shadow">
                  {/* Main Team Info */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: team.color }}
                    >
                      <span style={{ color: textColor }} className="font-bold text-lg">
                        {team.code}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{team.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">Code: {team.code}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-xs text-gray-600">{team.color}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3">{team.description}</p>

                  {/* Motto */}
                  {team.motto && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">MOTTO</p>
                      <p className="text-sm italic text-gray-700">"{team.motto}"</p>
                    </div>
                  )}

                  {/* Captain */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">CAPTAIN</p>
                    <p className="text-sm font-medium text-gray-800">{team.captain}</p>
                    {team.captainEmail && (
                      <p className="text-xs text-gray-600 mt-1">📧 {team.captainEmail}</p>
                    )}
                  </div>

                  {/* Leaders */}
                  {team.leaders && team.leaders.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">LEADERS ({team.leaders.length})</p>
                      <div className="space-y-1">
                        {team.leaders.map((leader, index) => (
                          <p key={index} className="text-sm text-gray-700">• {leader}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{team.members}</p>
                      <p className="text-xs text-gray-500">Members</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{team.points}</p>
                      <p className="text-xs text-gray-500">Points</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(team)}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(team)}
                      className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No teams found</p>
              <p className="text-gray-400 text-sm">Click "Add New Team" to create your first team</p>
            </div>
          )}
        </ShowcaseSection>
      </div>
    </>
  );
}