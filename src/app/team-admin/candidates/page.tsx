'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Candidate, Programme, ProgrammeParticipant, Team, FestivalInfo } from '@/types';
import TeamBreadcrumb from '@/components/TeamAdmin/TeamBreadcrumb';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function TeamCandidatesPage() {
  const searchParams = useSearchParams();
  const getFallbackTeam = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedTeam');
      if (saved) return saved;
      try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.team?.code) return u.team.code;
        }
      } catch (e) { }
    }
    return 'SMD';
  };
  const teamCode = searchParams.get('team') || getFallbackTeam();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [festInfo, setFestInfo] = useState<FestivalInfo | null>(null);
  const [teamData, setTeamData] = useState<Team | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // View mode: 'grid' (default matching reference card) or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [selectedCandidateForDetails, setSelectedCandidateForDetails] = useState<Candidate | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  const [newCandidate, setNewCandidate] = useState({
    chestNumber: '',
    name: '',
    section: 'senior' as 'senior' | 'junior' | 'sub-junior',
    profileImage: null as string | null,
    profileImageMimeType: undefined as string | undefined,
    profileImageSize: undefined as number | undefined
  });

  const [editCandidateForm, setEditCandidateForm] = useState({
    chestNumber: '',
    name: '',
    section: 'senior' as 'senior' | 'junior' | 'sub-junior',
    profileImage: null as string | null,
    profileImageMimeType: undefined as string | undefined,
    profileImageSize: undefined as number | undefined
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('team_candidates_view_mode');
      if (savedMode === 'list' || savedMode === 'grid') {
        setViewMode(savedMode);
      }
    }
  }, []);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('team_candidates_view_mode', mode);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [teamCode]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [candRes, progRes, partRes, festRes, teamRes] = await Promise.all([
        fetch(`/api/candidates?team=${teamCode}`),
        fetch('/api/programmes'),
        fetch(`/api/programme-participants?team=${teamCode}`),
        fetch('/api/festival-info'),
        fetch('/api/teams')
      ]);

      const [candData, progData, partData, festData, teamsData] = await Promise.all([
        candRes.json(),
        progRes.json(),
        partRes.json(),
        festRes.json(),
        teamRes.json()
      ]);

      setCandidates(Array.isArray(candData) ? candData : []);
      setProgrammes(Array.isArray(progData) ? progData : []);
      setParticipants(Array.isArray(partData) ? partData : []);
      setFestInfo(festData);

      if (Array.isArray(teamsData)) {
        const current = teamsData.find((t: Team) => t.code === teamCode);
        setTeamData(current || null);
      }
    } catch (error) {
      console.error('Error fetching candidates data:', error);
    } finally {
      setLoading(false);
    }
  };

  const minArtsLimit = festInfo?.minCandidateArtsParticipation ?? festInfo?.minCandidateParticipation ?? 1;
  const maxArtsLimit = festInfo?.maxCandidateArtsParticipation ?? festInfo?.maxCandidateParticipation ?? 3;
  const minSportsLimit = festInfo?.minCandidateSportsParticipation ?? 0;
  const maxSportsLimit = festInfo?.maxCandidateSportsParticipation ?? festInfo?.maxCandidateParticipation ?? 3;

  // Set of individual programme IDs and codes separated by Arts and Sports
  const { individualArtsProgIdSet, individualSportsProgIdSet } = useMemo(() => {
    const artsSet = new Set<string>();
    const sportsSet = new Set<string>();
    programmes.forEach(p => {
      if (p.positionType === 'individual' || (p as any).type === 'individual') {
        const isSports = (p.category || '').toLowerCase() === 'sports';
        const targetSet = isSports ? sportsSet : artsSet;
        if (p._id) targetSet.add(p._id.toString());
        if (p.id) targetSet.add(p.id.toString());
        if (p.code) targetSet.add(p.code);
      }
    });
    return { individualArtsProgIdSet: artsSet, individualSportsProgIdSet: sportsSet };
  }, [programmes]);

  // Compute individual and total stats for any candidate
  const getCandidateStats = (chestNumber: string) => {
    const candidateParticipations = participants.filter(
      p => p.status !== 'withdrawn' && p.participants?.includes(chestNumber)
    );

    const artsIndividualParticipations = candidateParticipations.filter(
      p => individualArtsProgIdSet.has(p.programmeId) || individualArtsProgIdSet.has(p.programmeCode)
    );

    const sportsIndividualParticipations = candidateParticipations.filter(
      p => individualSportsProgIdSet.has(p.programmeId) || individualSportsProgIdSet.has(p.programmeCode)
    );

    const groupParticipations = candidateParticipations.filter(
      p => !individualArtsProgIdSet.has(p.programmeId) && !individualArtsProgIdSet.has(p.programmeCode) &&
           !individualSportsProgIdSet.has(p.programmeId) && !individualSportsProgIdSet.has(p.programmeCode)
    );

    const artsCount = artsIndividualParticipations.length;
    const sportsCount = sportsIndividualParticipations.length;
    const isArtsMinMet = artsCount >= minArtsLimit;
    const isSportsMinMet = minSportsLimit === 0 || sportsCount >= minSportsLimit;
    const isMinMet = isArtsMinMet && isSportsMinMet;
    const isArtsMaxReached = artsCount >= maxArtsLimit;
    const isSportsMaxReached = sportsCount >= maxSportsLimit;

    return {
      candidateParticipations,
      artsIndividualParticipations,
      sportsIndividualParticipations,
      groupParticipations,
      artsCount,
      sportsCount,
      registeredCount: artsCount + sportsCount,
      remainingCount: Math.max(0, maxArtsLimit - artsCount) + Math.max(0, maxSportsLimit - sportsCount),
      totalCount: candidateParticipations.length,
      isMinMet,
      isArtsMinMet,
      isSportsMinMet,
      isArtsMaxReached,
      isSportsMaxReached
    };
  };

  // Add Candidate
  const addCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCandidate,
          team: teamCode,
          points: 0
        })
      });

      if (response.ok) {
        setNewCandidate({
          chestNumber: '',
          name: '',
          section: 'senior',
          profileImage: null,
          profileImageMimeType: undefined,
          profileImageSize: undefined
        });
        setShowAddForm(false);
        fetchAllData();
        alert('Candidate added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to add candidate'}`);
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      alert('Error adding candidate');
    } finally {
      setSubmitting(false);
    }
  };

  // Start Edit
  const startEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setEditCandidateForm({
      chestNumber: candidate.chestNumber,
      name: candidate.name,
      section: candidate.section,
      profileImage: candidate.profileImage || null,
      profileImageMimeType: candidate.profileImageMimeType,
      profileImageSize: candidate.profileImageSize
    });
  };

  // Update Candidate
  const updateCandidate = async (candidateId: string) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/candidates?id=${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCandidateForm)
      });

      if (response.ok) {
        setEditingCandidate(null);
        fetchAllData();
        alert('Candidate updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update candidate'}`);
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      alert('Error updating candidate');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Candidate
  const deleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to delete "${candidateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/candidates?id=${candidateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAllData();
        alert('Candidate deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete candidate'}`);
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      alert('Error deleting candidate');
    }
  };

  // Group candidates by section
  const candidatesBySection = {
    all: candidates.length,
    senior: candidates.filter(c => c.section === 'senior').length,
    junior: candidates.filter(c => c.section === 'junior').length,
    'sub-junior': candidates.filter(c => c.section === 'sub-junior').length
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSection = selectedSection === 'all' || candidate.section === selectedSection;
    const matchesSearch = searchQuery === '' ||
      candidate.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.chestNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  }).sort((a, b) => {
    const numA = parseInt(a.chestNumber.replace(/\D/g, ''), 10) || 99999;
    const numB = parseInt(b.chestNumber.replace(/\D/g, ''), 10) || 99999;
    return numA - numB;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Chest Number', 'Name', 'Section', 'Points', 'Arts Registered', 'Arts Max', 'Sports Registered', 'Sports Max', 'Eligible'];

    const csvData = filteredCandidates.map(candidate => {
      const stats = getCandidateStats(candidate.chestNumber);
      return [
        candidate.chestNumber || '',
        `"${(candidate.name || '').replace(/"/g, '""')}"`,
        candidate.section || '',
        candidate.points || 0,
        stats.artsCount,
        maxArtsLimit,
        stats.sportsCount,
        maxSportsLimit,
        stats.isMinMet ? 'Eligible' : 'Not Eligible'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `team_${teamCode}_candidates_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Gradient styles for card headers matching the reference image's vibrant aesthetic
  const getCardGradient = (section: string, index: number) => {
    if (section === 'senior') {
      return 'bg-gradient-to-tr from-[#00A896] via-[#F46036] to-[#E71D36]';
    } else if (section === 'junior') {
      return 'bg-gradient-to-tr from-[#2563EB] via-[#7C3AED] to-[#DB2777]';
    } else if (section === 'sub-junior') {
      return 'bg-gradient-to-tr from-[#D97706] via-[#DC2626] to-[#9333EA]';
    }
    const gradients = [
      'bg-gradient-to-tr from-[#00A896] via-[#F46036] to-[#E71D36]',
      'bg-gradient-to-tr from-[#2563EB] via-[#7C3AED] to-[#DB2777]',
      'bg-gradient-to-tr from-[#059669] via-[#0284C7] to-[#6366F1]',
      'bg-gradient-to-tr from-[#D97706] via-[#DC2626] to-[#9333EA]'
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-sm">Loading team candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <TeamBreadcrumb pageName="Candidates Management" teamData={teamData || undefined} />

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Team Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage candidates, track scored points, and monitor programme registrations (Arts: {minArtsLimit} min / {maxArtsLimit} max • Sports: {minSportsLimit} min / {maxSportsLimit} max).
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5"
          >
            <span>{showAddForm ? '✕ Close Form' : '+ Add Candidate'}</span>
          </button>
          <div className="text-right px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
            <div className="text-xl font-black text-gray-900 font-mono leading-none">{candidates.length}</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Members</div>
          </div>
        </div>
      </div>

      {/* Collapsible Add New Candidate Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>👤</span> Add New Candidate
            </h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="p-6">
            <form onSubmit={addCandidate} className="space-y-6">
              {/* Profile Image Upload */}
              <div className="flex justify-center">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 text-center uppercase tracking-wider">
                    Profile Photo
                  </label>
                  <ImageUpload
                    currentImage={newCandidate.profileImage || undefined}
                    onImageChange={(imageData, mimeType, size) => {
                      setNewCandidate({
                        ...newCandidate,
                        profileImage: imageData,
                        profileImageMimeType: mimeType,
                        profileImageSize: size
                      });
                    }}
                    name={newCandidate.name || 'New Candidate'}
                    size="md"
                    shape="circle"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Chest Number *
                  </label>
                  <input
                    type="text"
                    value={newCandidate.chestNumber}
                    onChange={(e) => setNewCandidate({ ...newCandidate, chestNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g., SMD013"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                    placeholder="Enter candidate full name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Section *
                  </label>
                  <select
                    value={newCandidate.section}
                    onChange={(e) => setNewCandidate({ ...newCandidate, section: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="senior">Senior</option>
                    <option value="junior">Junior</option>
                    <option value="sub-junior">Sub Junior</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  {submitting ? 'Adding...' : 'Save Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Quick Filter Pills & Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Section:
            </span>
            {(['all', 'senior', 'junior', 'sub-junior'] as const).map((sec) => {
              const isSelected = selectedSection === sec;
              const count = candidatesBySection[sec] ?? 0;
              const label = sec === 'all' ? 'All' : sec.replace('-', ' ');

              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSection(sec)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all capitalize ${isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Search, View Mode Toggle & CSV Export */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search name or chest no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Switcher (Grid vs List) */}
            <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
                title="Grid Card View"
              >
                <span>⊞</span>
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
                title="List Table View"
              >
                <span>☰</span>
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* Export CSV */}
            <button
              type="button"
              onClick={exportToCSV}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Export</span> CSV
            </button>
          </div>
        </div>

        {/* Search / Section Filter summary text */}
        {(selectedSection !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Showing {filteredCandidates.length} of {candidates.length} candidates</span>
            <button
              type="button"
              onClick={() => {
                setSelectedSection('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline ml-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Display: Grid or List */}
      {viewMode === 'grid' ? (
        /* GRID CARD VIEW (Designed after the reference UI) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredCandidates.map((candidate, index) => {
            const stats = getCandidateStats(candidate.chestNumber);

            return (
              <div
                key={candidate._id?.toString()}
                className="group bg-white rounded-[28px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.08)] transition-all duration-300 p-3.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Artistic Mesh Gradient Header (matching reference image) */}
                  <div className={`h-28 sm:h-32 rounded-[22px] relative overflow-hidden ${getCardGradient(candidate.section, index)}`}>
                    {/* Soft ambient lighting overlay */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] mix-blend-overlay" />
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/25 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/20 rounded-full blur-xl pointer-events-none" />

                    {/* Quick Action Buttons on Banner */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(candidate);
                        }}
                        className="w-7 h-7 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center text-xs transition-colors shadow-sm"
                        title="Edit Candidate"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCandidate(candidate._id?.toString() || '', candidate.name);
                        }}
                        className="w-7 h-7 rounded-full bg-black/35 hover:bg-rose-600/80 text-white backdrop-blur-md flex items-center justify-center text-xs transition-colors shadow-sm"
                        title="Delete Candidate"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Avatar overlapping banner (matches image) */}
                  <div className="-mt-10 ml-3.5 relative z-10 inline-block">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-white flex items-center justify-center">
                      {candidate.profileImage ? (
                        <img
                          src={candidate.profileImage}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center font-mono">
                          {candidate.name ? candidate.name.charAt(0).toUpperCase() : candidate.chestNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Candidate Name, Chest Number, Section & Status Pill */}
                  <div className="mt-3 px-1 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 tracking-tight leading-snug truncate" title={candidate.name}>
                        {candidate.name}
                      </h3>
                      <p className="text-xs text-gray-500  mt-0.5 truncate">
                        {candidate.chestNumber} • <span className="capitalize font-sans text-gray-600 font-semibold">{candidate.section}</span>
                      </p>
                    </div>

                    {/* Status Pill (matches "● Online" from image) */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 shadow-2xs ${stats.isMinMet
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                      : stats.registeredCount === 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stats.isMinMet ? 'bg-emerald-500' : stats.registeredCount === 0 ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                      <span>
                        {stats.isMinMet
                          ? 'Eligible'
                          : stats.registeredCount === 0
                            ? '0 Reg'
                            : !stats.isArtsMinMet && !stats.isSportsMinMet
                              ? `Need Arts & Sports`
                              : !stats.isArtsMinMet
                                ? `Need ${minArtsLimit - stats.artsCount} Arts`
                                : `Need ${minSportsLimit - stats.sportsCount} Sports`}
                      </span>
                    </span>
                  </div>

                  {/* 3-Column Stats Box (Points / Arts / Sports) */}
                  <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-2.5 sm:p-3 my-3.5 grid grid-cols-3 divide-x divide-slate-200/60 text-center shadow-2xs">
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                        {candidate.points || 0}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">
                        Points
                      </div>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-purple-600 tracking-tight">
                        {stats.artsCount}/{maxArtsLimit}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">
                        Arts
                      </div>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-emerald-600 tracking-tight">
                        {stats.sportsCount}/{maxSportsLimit}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">
                        Sports
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button (matches "Get In Touch" in image) */}
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForDetails(candidate)}
                  className="w-full py-3 bg-gray-950 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-2xl transition-all duration-150 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                >
                  <span>View Registered Programmes</span>
                  <span className="text-gray-400 group-hover/btn:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST TABLE VIEW (Updated with Points, 2/5 Registered, Remaining & Actions) */
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Candidate</th>
                  <th className="px-4 py-4 text-left">Section</th>
                  <th className="px-4 py-4 text-center">Scored Points</th>
                  <th className="px-4 py-4 text-center">Arts Progs</th>
                  <th className="px-4 py-4 text-center">Sports Progs</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 bg-white">
                {filteredCandidates.map((candidate) => {
                  const stats = getCandidateStats(candidate.chestNumber);

                  return (
                    <tr key={candidate._id?.toString()} className="hover:bg-gray-50/80 transition-colors">
                      {/* Photo + Name + Chest Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200 shrink-0 flex items-center justify-center">
                            {candidate.profileImage ? (
                              <img
                                src={candidate.profileImage}
                                alt={candidate.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center font-mono">
                                {candidate.name ? candidate.name.charAt(0).toUpperCase() : candidate.chestNumber}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{candidate.name}</div>
                            <div className="font-mono text-xs text-gray-500">#{candidate.chestNumber}</div>
                          </div>
                        </div>
                      </td>

                      {/* Section */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                          {candidate.section.replace('-', ' ')}
                        </span>
                      </td>

                      {/* Scored Points */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="inline-block px-3 py-1 rounded-lg bg-gray-100 font-mono font-bold text-sm text-gray-900">
                          {candidate.points || 0} pts
                        </span>
                      </td>

                      {/* Arts Progs */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-purple-50 text-purple-700 border border-purple-100">
                          {stats.artsCount} / {maxArtsLimit}
                        </span>
                      </td>

                      {/* Sports Progs */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {stats.sportsCount} / {maxSportsLimit}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${stats.isMinMet
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : stats.registeredCount === 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stats.isMinMet ? 'bg-emerald-500' : stats.registeredCount === 0 ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                          <span>
                            {stats.isMinMet
                              ? 'Eligible'
                              : stats.registeredCount === 0
                                ? '0 Reg'
                                : !stats.isArtsMinMet && !stats.isSportsMinMet
                                  ? `Need Arts & Sports`
                                  : !stats.isArtsMinMet
                                    ? `Need ${minArtsLimit - stats.artsCount} Arts`
                                    : `Need ${minSportsLimit - stats.sportsCount} Sports`}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCandidateForDetails(candidate)}
                            className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Programmes
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(candidate)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Candidate"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCandidate(candidate._id?.toString() || '', candidate.name)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Candidate"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCandidates.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
          <div className="text-gray-300 text-6xl mb-3">👥</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Candidates Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {candidates.length === 0
              ? 'Start by adding your first team candidate using the "+ Add Candidate" button above.'
              : 'No candidates matched your search criteria or section filter.'}
          </p>
        </div>
      )}

      {/* Candidate Details & Registered Programmes Modal */}
      {selectedCandidateForDetails && (() => {
        const stats = getCandidateStats(selectedCandidateForDetails.chestNumber);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedCandidateForDetails(null)}
          >
            <div
              className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 my-8 overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedCandidateForDetails(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>

              {/* Candidate Info Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-4 ring-gray-100 shrink-0 flex items-center justify-center shadow-md">
                  {selectedCandidateForDetails.profileImage ? (
                    <img
                      src={selectedCandidateForDetails.profileImage}
                      alt={selectedCandidateForDetails.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center font-mono">
                      {selectedCandidateForDetails.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">
                    {selectedCandidateForDetails.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                      #{selectedCandidateForDetails.chestNumber}
                    </span>
                    <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md capitalize">
                      {selectedCandidateForDetails.section} Section
                    </span>
                  </div>
                </div>
              </div>

              {/* Participation Quota Cards */}
              <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-xl font-black text-gray-900 font-mono">
                    {selectedCandidateForDetails.points || 0}
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Scored Points</div>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100">
                  <div className="text-xl font-black text-purple-700 font-mono">
                    {stats.artsCount}/{maxArtsLimit}
                  </div>
                  <div className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mt-0.5">Arts Progs</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <div className="text-xl font-black text-emerald-700 font-mono">
                    {stats.sportsCount}/{maxSportsLimit}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Sports Progs</div>
                </div>
              </div>

              {/* Quota Status Banner */}
              <div className={`p-3 rounded-xl mb-6 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${stats.isMinMet
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                <span className="font-semibold">
                  {stats.isMinMet
                    ? `✓ Minimum requirements met (Arts: ≥${minArtsLimit}${minSportsLimit > 0 ? `, Sports: ≥${minSportsLimit}` : ''})`
                    : `⚠️ Candidate needs: ${!stats.isArtsMinMet ? `${minArtsLimit - stats.artsCount} more Arts ` : ''}${!stats.isArtsMinMet && !stats.isSportsMinMet ? 'and ' : ''}${!stats.isSportsMinMet ? `${minSportsLimit - stats.sportsCount} more Sports` : ''} to be eligible`}
                </span>
                <span className="font-bold font-mono text-[11px] shrink-0">
                  🎭 {stats.artsCount}/{minArtsLimit} Arts Min • ⚽ {stats.sportsCount}/{minSportsLimit} Sports Min
                </span>
              </div>

              {/* Registered Programmes List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Registered Programmes ({stats.totalCount})
                </h4>

                {stats.candidateParticipations.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">No programmes registered for this candidate yet.</p>
                    <Link
                      href={`/team-admin/programmes?team=${teamCode}`}
                      className="inline-block text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                    >
                      Go to Programme Registration →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {stats.candidateParticipations.map((part) => {
                      const prog = programmes.find(
                        p => p._id?.toString() === part.programmeId || p.code === part.programmeCode
                      );
                      const isIndividual = prog?.positionType === 'individual' || (prog as any)?.type === 'individual';

                      return (
                        <div
                          key={part._id?.toString() || part.programmeId}
                          className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-gray-900">
                              {part.programmeName || prog?.name || 'Programme'}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                              {part.programmeCode || prog?.code} • <span className="capitalize">{prog?.category || 'Arts'}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase shrink-0 ${isIndividual
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                            }`}>
                            {isIndividual ? 'Individual' : 'Group'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <Link
                  href={`/team-admin/programmes?team=${teamCode}`}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Register in More Programmes
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForDetails(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setEditingCandidate(null)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 my-8 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setEditingCandidate(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold transition-colors"
            >
              ✕
            </button>

            <h3 className="font-extrabold text-xl text-gray-900 mb-6 flex items-center gap-2">
              <span>✏️</span> Edit Candidate
            </h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              updateCandidate(editingCandidate._id?.toString() || '');
            }} className="space-y-5">
              {/* Photo Upload */}
              <div className="flex justify-center">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 text-center uppercase tracking-wider">
                    Update Photo
                  </label>
                  <ImageUpload
                    currentImage={editCandidateForm.profileImage || undefined}
                    onImageChange={(imageData, mimeType, size) => {
                      setEditCandidateForm({
                        ...editCandidateForm,
                        profileImage: imageData,
                        profileImageMimeType: mimeType,
                        profileImageSize: size
                      });
                    }}
                    name={editCandidateForm.name || editingCandidate.name}
                    size="md"
                    shape="circle"
                  />
                </div>
              </div>

              {/* Chest Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Chest Number *
                </label>
                <input
                  type="text"
                  value={editCandidateForm.chestNumber}
                  onChange={(e) => setEditCandidateForm({ ...editCandidateForm, chestNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  value={editCandidateForm.name}
                  onChange={(e) => setEditCandidateForm({ ...editCandidateForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
              </div>

              {/* Section */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Section *
                </label>
                <select
                  value={editCandidateForm.section}
                  onChange={(e) => setEditCandidateForm({ ...editCandidateForm, section: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="senior">Senior</option>
                  <option value="junior">Junior</option>
                  <option value="sub-junior">Sub Junior</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}