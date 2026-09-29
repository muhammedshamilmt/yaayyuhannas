'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Team, Candidate, ProgrammeParticipant, FestivalInfo, Programme } from '@/types';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [festInfo, setFestInfo] = useState<FestivalInfo | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Eligibility modal state
  const [selectedTeamForEligibility, setSelectedTeamForEligibility] = useState<Team | null>(null);
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'under-min' | 'ready'>('all');
  const [eligibilitySearch, setEligibilitySearch] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    color: '#3B82F6',
    description: '',
    motto: '',
    captain: '',
    captainEmail: '',
    adminEmails: [''],
    leaders: ['', '']
  });

  // Predefined color palette
  const colorPalette = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#C026D3', '#DB2777', '#E11D48', '#DC2626',
    '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6'
  ];

  const fetchAllData = async () => {
    try {
      const [teamsRes, candidatesRes, participantsRes, festRes, progsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/programme-participants'),
        fetch('/api/festival-info'),
        fetch('/api/programmes')
      ]);

      const [teamsData, candidatesData, participantsData, festData, progsData] = await Promise.all([
        teamsRes.json(),
        candidatesRes.json(),
        participantsRes.json(),
        festRes.json(),
        progsRes.json()
      ]);

      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      setFestInfo(festData);
      setProgrammes(Array.isArray(progsData) ? progsData : []);
    } catch (error) {
      console.error('Error fetching admin team data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredLeaders = formData.leaders.filter(leader => leader.trim() !== '');
    if (filteredLeaders.length < 2) {
      alert('Please add at least 2 team leaders');
      return;
    }

    // Clean and validate admin emails (lowercase, trimmed, non-empty, unique)
    const cleanedAdminEmails = Array.from(new Set(
      formData.adminEmails
        .map(e => e.trim().toLowerCase())
        .filter(e => e !== '')
    ));

    const primaryCaptainEmail = formData.captainEmail.trim().toLowerCase();
    if (primaryCaptainEmail && !cleanedAdminEmails.includes(primaryCaptainEmail)) {
      cleanedAdminEmails.unshift(primaryCaptainEmail);
    }

    const teamData = {
      ...formData,
      captainEmail: primaryCaptainEmail || cleanedAdminEmails[0] || '',
      adminEmails: cleanedAdminEmails,
      leaders: filteredLeaders,
      members: editingTeam ? editingTeam.members : 0,
      points: editingTeam ? editingTeam.points : 0
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
        await fetchAllData();
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

    let existingAdminEmails: string[] = [];
    if (team.adminEmails && Array.isArray(team.adminEmails)) {
      existingAdminEmails = [...team.adminEmails];
    }
    if (team.captainEmail && !existingAdminEmails.some(e => e.toLowerCase() === team.captainEmail?.toLowerCase())) {
      existingAdminEmails.unshift(team.captainEmail);
    }
    if (existingAdminEmails.length === 0) {
      existingAdminEmails = [''];
    }

    setFormData({
      code: team.code,
      name: team.name,
      color: team.color,
      description: team.description,
      motto: team.motto || '',
      captain: team.captain,
      captainEmail: team.captainEmail || existingAdminEmails[0] || '',
      adminEmails: existingAdminEmails,
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
        await fetchAllData();
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
      adminEmails: [''],
      leaders: ['', '']
    });
    setEditingTeam(null);
    setShowAddForm(false);
    setShowColorPicker(false);
  };

  const addAdminEmailField = () => {
    setFormData(prev => ({
      ...prev,
      adminEmails: [...prev.adminEmails, '']
    }));
  };

  const removeAdminEmailField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      adminEmails: prev.adminEmails.filter((_, i) => i !== index)
    }));
  };

  const updateAdminEmail = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      adminEmails: prev.adminEmails.map((email, i) => i === index ? value : email)
    }));
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

  const minArtsLimit = festInfo?.minCandidateArtsParticipation ?? festInfo?.minCandidateParticipation ?? 1;
  const maxArtsLimit = festInfo?.maxCandidateArtsParticipation ?? festInfo?.maxCandidateParticipation ?? 3;
  const minSportsLimit = festInfo?.minCandidateSportsParticipation ?? 0;
  const maxSportsLimit = festInfo?.maxCandidateSportsParticipation ?? festInfo?.maxCandidateParticipation ?? 3;

  // Compute stats helper for any team
  const getTeamCandidateStats = (teamCode: string) => {
    const individualArtsProgIdSet = new Set<string>();
    const individualSportsProgIdSet = new Set<string>();

    programmes.forEach((p: any) => {
      if (p.positionType === 'individual' || p.type === 'individual') {
        const isSports = (p.category || '').toLowerCase() === 'sports';
        const targetSet = isSports ? individualSportsProgIdSet : individualArtsProgIdSet;
        if (p._id) targetSet.add(p._id.toString());
        if (p.id) targetSet.add(p.id.toString());
      }
    });

    const teamCandidates = candidates.filter(c => c.team === teamCode);
    const candidateStats = teamCandidates.map(c => {
      const artsRegistrations = participants.filter(
        p => p.status !== 'withdrawn' &&
          individualArtsProgIdSet.has(p.programmeId) &&
          p.participants?.includes(c.chestNumber)
      );

      const sportsRegistrations = participants.filter(
        p => p.status !== 'withdrawn' &&
          individualSportsProgIdSet.has(p.programmeId) &&
          p.participants?.includes(c.chestNumber)
      );

      const allRegistrations = participants.filter(
        p => p.status !== 'withdrawn' &&
          (individualArtsProgIdSet.has(p.programmeId) || individualSportsProgIdSet.has(p.programmeId)) &&
          p.participants?.includes(c.chestNumber)
      );

      const isArtsUnderMin = artsRegistrations.length < minArtsLimit;
      const isSportsUnderMin = minSportsLimit > 0 && sportsRegistrations.length < minSportsLimit;
      const isUnderMin = isArtsUnderMin || isSportsUnderMin;
      const hasZero = allRegistrations.length === 0;

      return {
        candidate: c,
        registeredCount: allRegistrations.length,
        artsCount: artsRegistrations.length,
        sportsCount: sportsRegistrations.length,
        programmes: allRegistrations.map(r => r.programmeName || r.programmeCode || 'Programme'),
        isArtsUnderMin,
        isSportsUnderMin,
        isUnderMin,
        hasZero,
      };
    });

    const underMinCount = candidateStats.filter(s => s.isUnderMin).length;
    const zeroCount = candidateStats.filter(s => s.hasZero).length;
    const isEligible = teamCandidates.length > 0 && underMinCount === 0;

    return {
      teamCandidates,
      candidateStats,
      underMinCount,
      zeroCount,
      isEligible
    };
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

  // Active team for modal
  const activeModalStats = selectedTeamForEligibility ? getTeamCandidateStats(selectedTeamForEligibility.code) : null;
  const filteredModalCandidates = activeModalStats?.candidateStats.filter(item => {
    const matchesSearch = 
      item.candidate.name.toLowerCase().includes(eligibilitySearch.toLowerCase()) ||
      item.candidate.chestNumber.toLowerCase().includes(eligibilitySearch.toLowerCase());
    
    if (!matchesSearch) return false;
    if (eligibilityFilter === 'under-min') return item.isUnderMin;
    if (eligibilityFilter === 'ready') return !item.isUnderMin;
    return true;
  }) || [];

  return (
    <>
      <Breadcrumb pageName="Teams" />

      <div className="space-y-6">
        {/* Info & Rules Section */}
        <ShowcaseSection title="Team Management & Eligibility">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-1">🏆 Festival Teams</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Manage your festival teams here. You can create, edit, and delete teams. 
                Team member counts and points are calculated automatically from database records.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-purple-900 flex items-center gap-1.5">
                  <span>⚙️</span> Candidate Participation Rules
                </h4>
                <Link href="/admin/settings" className="text-xs text-purple-600 hover:text-purple-800 underline font-medium">
                  Configure Settings
                </Link>
              </div>
              <p className="text-xs text-purple-700 leading-relaxed">
                Rules: 🎭 Arts: <strong>{minArtsLimit} Min / {maxArtsLimit} Max</strong> • ⚽ Sports: <strong>{minSportsLimit} Min / {maxSportsLimit} Max</strong>.
                Teams with any candidate failing to meet category minimums are flagged as <strong>Not Eligible</strong>.
              </p>
            </div>
          </div>
        </ShowcaseSection>

        {/* Add Team Button & Summary Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Teams ({teams.length})</h2>
            <p className="text-xs text-gray-500">Live eligibility indicators update automatically as candidates register.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md font-medium text-sm"
          >
            + Add New Team
          </button>
        </div>

        {/* Add/Edit Team Form */}
        {showAddForm && (
          <ShowcaseSection title={editingTeam ? "Edit Team" : "Add New Team"}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="e.g., SMD, AQS, INT"
                    required
                    disabled={!!editingTeam}
                  />
                  {editingTeam && (
                    <p className="text-xs text-gray-500 mt-1">Team code cannot be changed after creation</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SUMUD, AQSA, INTHIFADA"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Color *</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="#3B82F6"
                      required
                    />
                    <div 
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer shadow-sm"
                      style={{ backgroundColor: formData.color }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      title="Click to pick a color"
                    />
                  </div>

                  {showColorPicker && (
                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <div className="grid grid-cols-8 gap-2">
                        {colorPalette.map((color, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded cursor-pointer hover:scale-110 transition-transform border border-gray-200"
                            style={{ backgroundColor: color }}
                            onClick={() => selectColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Captain *</label>
                  <input
                    type="text"
                    value={formData.captain}
                    onChange={(e) => setFormData(prev => ({ ...prev, captain: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Captain's full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Captain Email</label>
                  <input
                    type="email"
                    value={formData.captainEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, captainEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="captain@example.com"
                  />
                </div>
              </div>

              {/* Authorized Admin Emails for Portal Access */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-800">
                      Team Admin Emails (Multi-User Access)
                    </label>
                    <p className="text-xs text-gray-500">
                      Users logging in with any of these emails will get full access to the Team Portal (/team-admin).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addAdminEmailField}
                    className="self-start sm:self-auto inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                  >
                    + Add Another Admin Email
                  </button>
                </div>

                <div className="space-y-2 mt-3">
                  {formData.adminEmails.map((emailVal, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                          ✉️
                        </span>
                        <input
                          type="email"
                          value={emailVal}
                          onChange={(e) => updateAdminEmail(index, e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                          placeholder={index === 0 ? "admin1@gmail.com (e.g. Captain)" : `admin${index + 1}@gmail.com (e.g. Vice-Captain / Convener)`}
                        />
                      </div>
                      {formData.adminEmails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAdminEmailField(index)}
                          className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                          title="Remove email"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the team"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Motto</label>
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
        <ShowcaseSection title="All Teams & Participation Eligibility">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const textColor = getContrastColor(team.color);
              const stats = getTeamCandidateStats(team.code);
              
              return (
                <div 
                  key={team._id?.toString()} 
                  className={`bg-white border-2 rounded-xl p-6 relative shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    stats.isEligible 
                      ? 'border-emerald-200 hover:border-emerald-400' 
                      : 'border-rose-200 hover:border-rose-400'
                  }`}
                >
                  <div>
                    {/* Top Row: Team Code Badge + Eligibility Status Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md font-bold text-lg"
                          style={{ backgroundColor: team.color, color: textColor }}
                        >
                          {team.code}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg leading-tight">{team.name}</h4>
                          <p className="text-xs text-gray-500 font-medium">Code: {team.code}</p>
                        </div>
                      </div>

                      {/* Prominent Eligibility Badge */}
                      <div>
                        {stats.teamCandidates.length === 0 ? (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                            ⚪ No Candidates
                          </span>
                        ) : stats.isEligible ? (
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-sm">
                            <span>🟢</span> ELIGIBLE
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-sm animate-pulse">
                            <span>🔴</span> NOT ELIGIBLE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Eligibility Banner inside Card */}
                    <div className={`p-3 rounded-lg border mb-4 text-xs ${
                      stats.teamCandidates.length === 0 
                        ? 'bg-gray-50 border-gray-200 text-gray-600'
                        : stats.isEligible 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      {stats.teamCandidates.length === 0 ? (
                        <p>No candidates assigned to this team yet.</p>
                      ) : stats.isEligible ? (
                        <div className="flex items-center gap-2">
                          <span className="text-base">✓</span>
                          <span>
                            <strong>Eligible to compete:</strong> All {stats.teamCandidates.length} candidates meet individual minimums (Arts: ≥{minArtsLimit}{minSportsLimit > 0 ? `, Sports: ≥${minSportsLimit}` : ''}).
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            <span className="text-sm">⚠️</span>
                            <span>Not Eligible ({stats.underMinCount} candidate{stats.underMinCount > 1 ? 's' : ''} below min)</span>
                          </div>
                          <p className="text-[11px] text-rose-700 leading-normal">
                            {stats.zeroCount > 0 ? `${stats.zeroCount} candidate(s) have 0 programmes registered.` : ''} Candidates must participate in at least {minArtsLimit} Arts{minSportsLimit > 0 ? ` and ${minSportsLimit} Sports` : ''} individual programme(s).
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Description & Motto */}
                    {team.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{team.description}</p>
                    )}
                    {team.motto && (
                      <div className="mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Motto</p>
                        <p className="text-xs italic text-gray-700">"{team.motto}"</p>
                      </div>
                    )}

                    {/* Captain & Admin Emails */}
                    <div className="mb-2 text-xs">
                      <span className="text-gray-500 font-semibold uppercase text-[10px] block">Captain</span>
                      <span className="font-medium text-gray-800">{team.captain}</span>
                      {team.captainEmail && (
                        <span className="text-gray-500 text-[11px] ml-1">({team.captainEmail})</span>
                      )}
                    </div>

                    {/* Admin Access Emails */}
                    <div className="mb-3">
                      <span className="text-gray-500 font-semibold uppercase text-[10px] block mb-1">
                        Portal Admins ({((team.adminEmails && team.adminEmails.length > 0) ? team.adminEmails : (team.captainEmail ? [team.captainEmail] : [])).length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {((team.adminEmails && team.adminEmails.length > 0) 
                          ? team.adminEmails 
                          : (team.captainEmail ? [team.captainEmail] : [])
                        ).map((email, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100"
                            title={email}
                          >
                            <span>✉️</span>
                            <span className="truncate max-w-[140px]">{email}</span>
                          </span>
                        ))}
                        {(!team.adminEmails || team.adminEmails.length === 0) && !team.captainEmail && (
                          <span className="text-gray-400 italic text-[11px]">No login emails assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 text-center">
                      <div>
                        <p className="text-base font-bold text-gray-900">{stats.teamCandidates.length}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Candidates</p>
                      </div>
                      <div>
                        <p className="text-base font-bold text-emerald-600">
                          {stats.teamCandidates.length - stats.underMinCount}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">Ready (Eligible)</p>
                      </div>
                      <div>
                        <p className={`text-base font-bold ${stats.underMinCount > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                          {stats.underMinCount}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">Under Min</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* View Eligibility Details Button */}
                    <button
                      onClick={() => {
                        setSelectedTeamForEligibility(team);
                        setEligibilityFilter(stats.underMinCount > 0 ? 'under-min' : 'all');
                        setEligibilitySearch('');
                      }}
                      className="w-full mb-3 py-2 px-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 text-purple-900 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>🔍</span> View Candidate Eligibility ({stats.teamCandidates.length})
                    </button>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(team)}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                      >
                        Edit Team
                      </button>
                      <button
                        onClick={() => handleDelete(team)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
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

      {/* Candidate Eligibility Details Modal */}
      {selectedTeamForEligibility && activeModalStats && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-gray-50 to-purple-50">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                  style={{ backgroundColor: selectedTeamForEligibility.color }}
                >
                  {selectedTeamForEligibility.code}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedTeamForEligibility.name} • Candidate Participation
                  </h3>
                  <p className="text-xs text-gray-500">
                    Rule Requirements: 🎭 Arts: <strong>{minArtsLimit} Min / {maxArtsLimit} Max</strong> • ⚽ Sports: <strong>{minSportsLimit} Min / {maxSportsLimit} Max</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeamForEligibility(null)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Stats & Filter Bar */}
            <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEligibilityFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    eligibilityFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All ({activeModalStats.teamCandidates.length})
                </button>
                <button
                  onClick={() => setEligibilityFilter('under-min')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    eligibilityFilter === 'under-min'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white border text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <span>⚠️</span> Under Min ({activeModalStats.underMinCount})
                </button>
                <button
                  onClick={() => setEligibilityFilter('ready')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    eligibilityFilter === 'ready'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <span>✓</span> Eligible ({activeModalStats.teamCandidates.length - activeModalStats.underMinCount})
                </button>
              </div>

              <input
                type="text"
                placeholder="Search candidate name or chest #..."
                value={eligibilitySearch}
                onChange={(e) => setEligibilitySearch(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Candidate List Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {filteredModalCandidates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl block mb-2">🔍</span>
                  <p className="text-sm">No candidates match your current filter.</p>
                </div>
              ) : (
                filteredModalCandidates.map((item) => (
                  <div
                    key={item.candidate._id?.toString() || item.candidate.chestNumber}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                      item.isUnderMin 
                        ? 'bg-rose-50/60 border-rose-200' 
                        : 'bg-emerald-50/50 border-emerald-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {item.candidate.chestNumber}
                        </span>
                        <span className="font-semibold text-gray-900 text-sm">
                          {item.candidate.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 uppercase font-medium">
                          {item.candidate.section}
                        </span>
                      </div>

                      {/* Registered Programmes List */}
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-gray-500 font-medium">Programmes:</span>
                        {item.programmes.length === 0 ? (
                          <span className="text-[11px] text-rose-700 font-bold italic">None registered yet</span>
                        ) : (
                          item.programmes.map((progName, idx) => (
                            <span 
                              key={idx} 
                              className="text-[11px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md shadow-2xs"
                            >
                              {progName}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          🎭 {item.artsCount}/{maxArtsLimit} Arts • ⚽ {item.sportsCount}/{maxSportsLimit} Sports
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Min: {minArtsLimit} Arts{minSportsLimit > 0 ? `, ${minSportsLimit} Sports` : ''}
                        </div>
                      </div>

                      {item.hasZero ? (
                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-rose-200 text-rose-900 border border-rose-300">
                          0 Programmes
                        </span>
                      ) : item.isUnderMin ? (
                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-200 text-amber-900 border border-amber-300">
                          {item.isArtsUnderMin ? `Needs ${minArtsLimit - item.artsCount} Arts` : ''}
                          {item.isArtsUnderMin && item.isSportsUnderMin ? ', ' : ''}
                          {item.isSportsUnderMin ? `Needs ${minSportsLimit - item.sportsCount} Sports` : ''}
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-200 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <span>✓</span> Ready
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Team Eligibility Status: {activeModalStats.isEligible ? (
                  <strong className="text-emerald-700 font-bold">🟢 Eligible</strong>
                ) : (
                  <strong className="text-rose-700 font-bold">🔴 Not Eligible ({activeModalStats.underMinCount} candidates under minimum)</strong>
                )}
              </div>
              <button
                onClick={() => setSelectedTeamForEligibility(null)}
                className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}