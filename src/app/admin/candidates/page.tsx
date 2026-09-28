'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Candidate, Team, FestivalInfo } from '@/types';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
  generateCandidatesPdf,
  generateCandidatesExcel,
  generateCandidatesCsv,
  CandidateExportOptions
} from '@/components/admin/CandidateExportHelper';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [festInfo, setFestInfo] = useState<FestivalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Export Modal & Options States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTeam, setExportTeam] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xls' | 'xlsx' | 'csv'>('xls');
  const [exportSortBy, setExportSortBy] = useState<'chestNumber' | 'name' | 'section'>('chestNumber');
  const [exportStrictPdf, setExportStrictPdf] = useState(true); // Strictly Chest Number and Name only
  const [exportIncludeSection, setExportIncludeSection] = useState(false);
  const [exportIncludePoints, setExportIncludePoints] = useState(false);
  const [exportIncludeTeam, setExportIncludeTeam] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCandidate, setEditCandidate] = useState({
    chestNumber: '',
    name: '',
    section: 'senior' as 'senior' | 'junior' | 'sub-junior',
    profileImage: null as string | null,
    profileImageMimeType: undefined as string | undefined,
    profileImageSize: undefined as number | undefined,
    team: ''
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    chestNumber: '',
    name: '',
    section: 'senior' as 'senior' | 'junior' | 'sub-junior',
    team: '',
    profileImage: null as string | null,
    profileImageMimeType: undefined as string | undefined,
    profileImageSize: undefined as number | undefined
  });

  // Filter out blank/empty candidates
  const filterValidCandidates = (candidates: Candidate[]) => {
    return candidates.filter(candidate =>
      candidate.name &&
      candidate.name.trim() !== '' &&
      candidate.section &&
      candidate.section.trim() !== ''
    );
  };

  // Fetch candidates, teams, and festival-info from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, teamsRes, festRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/teams'),
        fetch('/api/festival-info')
      ]);

      const [candidatesData, teamsData, festData] = await Promise.all([
        candidatesRes.json(),
        teamsRes.json(),
        festRes.json()
      ]);

      // Filter out blank/empty candidates
      const validCandidates = filterValidCandidates(candidatesData);

      setCandidates(validCandidates);
      setTeams(teamsData);
      setFestInfo(festData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateCandidate = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/candidates?id=${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCandidate)
      });

      if (response.ok) {
        setEditingId(null);
        fetchData();
        alert('Candidate updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update candidate'}`);
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      alert('Error updating candidate');
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.section) {
      alert("Please fill all required fields (Name, Section).");
      return;
    }
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCandidate)
      });
      if (response.ok) {
        setIsAdding(false);
        setNewCandidate({
          chestNumber: '',
          name: '',
          section: 'senior',
          team: '',
          profileImage: null,
          profileImageMimeType: undefined,
          profileImageSize: undefined
        });
        fetchData();
        alert('Candidate added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to add candidate'}`);
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      alert('Error adding candidate');
    }
  };

  const deleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to delete "${candidateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/candidates?id=${candidateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
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

  const startEdit = (candidate: Candidate) => {
    setEditingId(candidate._id?.toString() || '');
    setEditCandidate({
      chestNumber: candidate.chestNumber,
      name: candidate.name,
      section: candidate.section,
      profileImage: candidate.profileImage || null,
      profileImageMimeType: candidate.profileImageMimeType,
      profileImageSize: candidate.profileImageSize,
      team: candidate.team
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCandidate({ 
      chestNumber: '', 
      name: '', 
      section: 'senior',
      profileImage: null,
      profileImageMimeType: undefined,
      profileImageSize: undefined,
      team: ''
    });
  };

  // Quick Export PDF for current team filter (Chest Number & Name only)
  const handleQuickExportPdf = (teamCode: string = selectedTeam) => {
    try {
      setIsExporting(true);
      generateCandidatesPdf(candidates, teams, {
        teamCode,
        format: 'pdf',
        includeFields: {
          chestNumber: true,
          name: true,
          section: false,
          points: false,
          team: false,
        },
        sortBy: 'chestNumber',
        festivalName: festInfo?.name || 'Wattaqa Arts Festival 2K25',
        venue: festInfo?.venue || 'Campus Venue',
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Quick Export XLS for current team filter (Chest Number & Name)
  const handleQuickExportXls = (teamCode: string = selectedTeam) => {
    try {
      setIsExporting(true);
      generateCandidatesExcel(candidates, teams, {
        teamCode,
        format: 'xls',
        includeFields: {
          chestNumber: true,
          name: true,
          section: false,
          points: false,
          team: teamCode === 'all',
        },
        sortBy: 'chestNumber',
        festivalName: festInfo?.name || 'Wattaqa Arts Festival 2K25',
        venue: festInfo?.venue || 'Campus Venue',
      });
    } catch (err) {
      console.error('Error generating XLS:', err);
      alert('Failed to generate XLS. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Custom Export from Modal
  const handleCustomExport = () => {
    try {
      setIsExporting(true);
      const isPdf = exportFormat === 'pdf';
      const options: CandidateExportOptions = {
        teamCode: exportTeam,
        format: exportFormat,
        includeFields: {
          chestNumber: true,
          name: true,
          section: isPdf && exportStrictPdf ? false : exportIncludeSection,
          points: isPdf && exportStrictPdf ? false : exportIncludePoints,
          team: isPdf && exportStrictPdf ? false : exportIncludeTeam,
        },
        sortBy: exportSortBy,
        festivalName: festInfo?.name || 'Wattaqa Arts Festival 2K25',
        venue: festInfo?.venue || 'Campus Venue',
      };

      if (exportFormat === 'pdf') {
        generateCandidatesPdf(candidates, teams, options);
      } else if (exportFormat === 'xlsx' || exportFormat === 'xls') {
        generateCandidatesExcel(candidates, teams, options);
      } else if (exportFormat === 'csv') {
        generateCandidatesCsv(candidates, teams, options);
      }
      setShowExportModal(false);
    } catch (err) {
      console.error('Error exporting candidates data:', err);
      alert('Failed to export candidates data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Batch Export All Teams as separate individual PDFs
  const handleBatchExportAllTeamsPdf = async () => {
    try {
      setIsExporting(true);
      const teamsWithCandidates = teams.filter(t => candidates.some(c => c.team === t.code));
      for (const team of teamsWithCandidates) {
        generateCandidatesPdf(candidates, teams, {
          teamCode: team.code,
          format: 'pdf',
          includeFields: { chestNumber: true, name: true },
          sortBy: exportSortBy,
          festivalName: festInfo?.name || 'Wattaqa Arts Festival 2K25',
          venue: festInfo?.venue || 'Campus Venue',
        });
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      setShowExportModal(false);
    } catch (err) {
      console.error('Error in batch export:', err);
      alert('Failed to batch export all team PDFs.');
    } finally {
      setIsExporting(false);
    }
  };

  // Batch Export All Teams as separate individual XLS files
  const handleBatchExportAllTeamsXls = async () => {
    try {
      setIsExporting(true);
      const teamsWithCandidates = teams.filter(t => candidates.some(c => c.team === t.code));
      for (const team of teamsWithCandidates) {
        generateCandidatesExcel(candidates, teams, {
          teamCode: team.code,
          format: 'xls',
          includeFields: { chestNumber: true, name: true, section: false, points: false, team: false },
          sortBy: exportSortBy,
          festivalName: festInfo?.name || 'Wattaqa Arts Festival 2K25',
          venue: festInfo?.venue || 'Campus Venue',
        });
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      setShowExportModal(false);
    } catch (err) {
      console.error('Error in batch export:', err);
      alert('Failed to batch export all team XLS files.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter candidates by selected team and search query
  const allFilteredCandidates = candidates.filter(candidate => {
    const matchesTeam = selectedTeam === 'all' || candidate.team === selectedTeam;
    const matchesSearch = searchQuery === '' || 
      candidate.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      candidate.chestNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(allFilteredCandidates.length / itemsPerPage));
  const filteredCandidates = allFilteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when team filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeam, searchQuery]);

  // Group candidates by team for statistics
  const candidatesByTeam = teams.map(team => ({
    ...team,
    candidateCount: candidates.filter(c => c.team === team.code).length,
    totalPoints: candidates.filter(c => c.team === team.code).reduce((sum, c) => sum + c.points, 0),
    avgPoints: candidates.filter(c => c.team === team.code).length > 0 
      ? (candidates.filter(c => c.team === team.code).reduce((sum, c) => sum + c.points, 0) / candidates.filter(c => c.team === team.code).length).toFixed(1)
      : '0'
  }));

  return (
    <>
      <Breadcrumb pageName="Candidates Management" />

      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900">Admin Management View</h3>
              <p className="text-blue-700 text-sm">
                Candidates are generally added by team admins. Here, you can monitor, edit, and add profile photos for candidates across all teams.
              </p>
            </div>
          </div>
        </div>

        {/* Team Statistics */}
        <ShowcaseSection title="Team Statistics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {candidatesByTeam.map((team) => (
              <div key={team._id?.toString()} className="bg-white border-2 rounded-lg p-6 hover:shadow-md transition-shadow"
                   style={{ borderColor: team.color + '40' }}>
                <div className="flex items-center mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold mr-4"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-600">{team.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{team.candidateCount}</div>
                    <div className="text-xs text-gray-500">Candidates</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: team.color }}>{team.totalPoints}</div>
                    <div className="text-xs text-gray-500">Total Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{team.avgPoints}</div>
                    <div className="text-xs text-gray-500">Avg Points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ShowcaseSection>

        {/* Candidates Overview */}
        <ShowcaseSection title="Candidates Overview">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading candidates...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Filter Controls */}
              <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Team:</label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="all">All Teams ({candidates.length})</option>
                      {teams.map((team) => (
                        <option key={team.code} value={team.code}>
                          {team.name} ({candidates.filter(c => c.team === team.code).length})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search name or chest no..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
                  <div className="text-sm text-gray-600">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, allFilteredCandidates.length)}-{Math.min(currentPage * itemsPerPage, allFilteredCandidates.length)} of {allFilteredCandidates.length} candidates
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Quick PDF Export button for the currently active team filter */}
                    <button
                      onClick={() => handleQuickExportPdf(selectedTeam)}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-2xs whitespace-nowrap cursor-pointer"
                      title="Download PDF containing only Chest Number and Name for the filtered team"
                    >
                      <span>📄</span>
                      <span>PDF {selectedTeam === 'all' ? '(All Teams)' : `(${selectedTeam})`}</span>
                    </button>

                    {/* Quick XLS Export button for the currently active team filter */}
                    <button
                      onClick={() => handleQuickExportXls(selectedTeam)}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-2xs whitespace-nowrap cursor-pointer"
                      title="Download Excel XLS containing Chest Number and Name for the filtered team"
                    >
                      <span>📊</span>
                      <span>XLS {selectedTeam === 'all' ? '(All Teams)' : `(${selectedTeam})`}</span>
                    </button>

                    {/* Advanced Export Options Modal Trigger */}
                    <button
                      onClick={() => {
                        setExportTeam(selectedTeam);
                        setShowExportModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-2xs whitespace-nowrap cursor-pointer"
                      title="Export options: filter by any team, pick format (.xls, .pdf, .xlsx, .csv), and customize fields"
                    >
                      <span>📥</span>
                      <span>Export Options</span>
                    </button>

                    <button
                      onClick={() => setIsAdding(true)}
                      className="bg-blue-600 text-white px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm hover:bg-blue-700 transition whitespace-nowrap shadow-2xs cursor-pointer"
                    >
                      + Add Candidate
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidates Table */}
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Candidates Found</h3>
                  <p className="text-gray-500">
                    {selectedTeam === 'all' 
                      ? 'No candidates have been registered yet. Team admins can add candidates through their portals.'
                      : `No candidates found for ${teams.find(t => t.code === selectedTeam)?.name}. Team admin can add candidates through their portal.`
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Photo</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Chest Number</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Name</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Team</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Section</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Points</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isAdding && (
                        <tr className="border-b border-gray-100 bg-blue-50">
                          <td className="py-3 px-4">
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
                              name="New"
                              size="sm"
                              shape="circle"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Chest No"
                              value={newCandidate.chestNumber}
                              onChange={(e) => setNewCandidate({...newCandidate, chestNumber: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Name"
                              value={newCandidate.name}
                              onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={newCandidate.team}
                              onChange={(e) => setNewCandidate({...newCandidate, team: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">No Team</option>
                              {teams.map(t => (
                                <option key={t.code} value={t.code}>{t.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={newCandidate.section}
                              onChange={(e) => setNewCandidate({...newCandidate, section: e.target.value as any})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="senior">Senior</option>
                              <option value="junior">Junior</option>
                              <option value="sub-junior">Sub Junior</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900">0</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={handleAddCandidate}
                                className="text-white bg-green-600 hover:bg-green-700 text-xs font-medium px-2 py-1 rounded border border-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setIsAdding(false)}
                                className="text-gray-600 hover:text-gray-900 text-xs font-medium bg-gray-100 px-2 py-1 rounded border border-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {filteredCandidates.map((candidate) => {
                        const team = teams.find(t => t.code === candidate.team);
                        const isEditing = editingId === candidate._id?.toString();
                        
                        return (
                          <tr key={candidate._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <ImageUpload
                                  currentImage={editCandidate.profileImage || undefined}
                                  onImageChange={(imageData, mimeType, size) => {
                                    setEditCandidate({
                                      ...editCandidate,
                                      profileImage: imageData,
                                      profileImageMimeType: mimeType,
                                      profileImageSize: size
                                    });
                                  }}
                                  name={editCandidate.name || candidate.name}
                                  size="sm"
                                  shape="circle"
                                />
                              ) : (
                                <ImageUpload
                                  currentImage={candidate.profileImage || undefined}
                                  onImageChange={() => {}}
                                  name={candidate.name}
                                  size="sm"
                                  shape="circle"
                                  disabled={true}
                                />
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-gray-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editCandidate.chestNumber}
                                  onChange={(e) => setEditCandidate({...editCandidate, chestNumber: e.target.value})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                candidate.chestNumber
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editCandidate.name}
                                  onChange={(e) => setEditCandidate({...editCandidate, name: e.target.value})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                candidate.name
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <select
                                  value={editCandidate.team}
                                  onChange={(e) => setEditCandidate({...editCandidate, team: e.target.value})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  {teams.map(t => (
                                    <option key={t.code} value={t.code}>{t.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: team?.color }}
                                  >
                                    {candidate.team}
                                  </div>
                                  <span className="font-medium">{team?.name}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <select
                                  value={editCandidate.section}
                                  onChange={(e) => setEditCandidate({...editCandidate, section: e.target.value as any})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="senior">Senior</option>
                                  <option value="junior">Junior</option>
                                  <option value="sub-junior">Sub Junior</option>
                                </select>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 capitalize">
                                  {candidate.section.replace('-', ' ')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-gray-900">{candidate.points}</span>
                            </td>
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <div className="flex flex-col space-y-1">
                                  <button
                                    onClick={() => updateCandidate(candidate._id?.toString() || '')}
                                    className="text-green-600 hover:text-green-900 text-xs font-medium bg-green-50 px-2 py-1 rounded border border-green-200"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-gray-600 hover:text-gray-900 text-xs font-medium bg-gray-100 px-2 py-1 rounded border border-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  <button
                                    onClick={() => startEdit(candidate)}
                                    className="text-blue-600 hover:text-blue-900 text-xs font-medium bg-blue-50 px-2 py-1 rounded border border-blue-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteCandidate(candidate._id?.toString() || '', candidate.name)}
                                    className="text-red-600 hover:text-red-900 text-xs font-medium bg-red-50 px-2 py-1 rounded border border-red-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {allFilteredCandidates.length > 0 && totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 p-4 bg-white border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </ShowcaseSection>

        {/* Instructions */}
        <ShowcaseSection title="How to Manage Candidates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-semibold text-blue-900 mb-2">Team Admins Add Candidates</h3>
              <p className="text-sm text-blue-700">
                Each team admin can add their own team members through the Team Admin Portal.
              </p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold text-green-900 mb-2">Admin Monitors Progress</h3>
              <p className="text-sm text-green-700">
                View statistics, track registrations, and monitor team performance from this dashboard.
              </p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-semibold text-purple-900 mb-2">Results & Rankings</h3>
              <p className="text-sm text-purple-700">
                Manage competition results and update candidate points through the Results page.
              </p>
            </div>
          </div>
        </ShowcaseSection>
      </div>

      {/* Export Candidates Modal */}
      {showExportModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowExportModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 my-8 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 mb-1.5">
                  <span>📥 Export Center</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  Export Candidate Call Sheets
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Filter by team, choose file format, and download official records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-sm">
              {/* Step 1: Team Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  1. Filter by Team
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportTeam('all')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex flex-col justify-between cursor-pointer ${
                      exportTeam === 'all'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <span>All Teams</span>
                    <span className="text-[11px] font-normal text-gray-500 mt-1">
                      {candidates.length} candidates
                    </span>
                  </button>

                  {teams.map((t) => {
                    const count = candidates.filter((c) => c.team === t.code).length;
                    const isSelected = exportTeam === t.code;
                    return (
                      <button
                        key={t.code}
                        type="button"
                        onClick={() => setExportTeam(t.code)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color || '#3B82F6' }}
                          />
                          <span className="truncate">{t.name}</span>
                        </div>
                        <span className="text-[11px] font-normal text-gray-500 mt-1">
                          {count} candidates
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: File Format Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  2. File Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* XLS (Excel) */}
                  <button
                    type="button"
                    onClick={() => setExportFormat('xls')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                      exportFormat === 'xls'
                        ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">📊</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-600 text-white">
                        XLS
                      </span>
                    </div>
                    <div className="font-bold text-xs text-gray-900">Excel XLS</div>
                    <div className="text-[11px] text-gray-500 leading-tight">
                      Classic Excel format (.xls)
                    </div>
                  </button>

                  {/* PDF */}
                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                      exportFormat === 'pdf'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">📄</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-600 text-white">
                        PDF
                      </span>
                    </div>
                    <div className="font-bold text-xs text-gray-900">PDF Call Sheet</div>
                    <div className="text-[11px] text-gray-500 leading-tight">
                      Printable (Chest No & Name)
                    </div>
                  </button>

                  {/* XLSX */}
                  <button
                    type="button"
                    onClick={() => setExportFormat('xlsx')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                      exportFormat === 'xlsx'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">📈</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-600 text-white">
                        XLSX
                      </span>
                    </div>
                    <div className="font-bold text-xs text-gray-900">Modern Excel</div>
                    <div className="text-[11px] text-gray-500 leading-tight">
                      Office Open XML (.xlsx)
                    </div>
                  </button>

                  {/* CSV */}
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                      exportFormat === 'csv'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">📋</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600 text-white">
                        CSV
                      </span>
                    </div>
                    <div className="font-bold text-xs text-gray-900">CSV File</div>
                    <div className="text-[11px] text-gray-500 leading-tight">
                      Plain UTF-8 text (.csv)
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 3: Fields & Options */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    3. Column / Field Options
                  </span>
                  {exportFormat === 'pdf' && (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Chest No & Name Only (Official)
                    </span>
                  )}
                </div>

                {exportFormat === 'pdf' ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportStrictPdf}
                        onChange={(e) => setExportStrictPdf(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-gray-800">
                        Strict Mode: Only Chest Number & Name in PDF
                      </span>
                    </label>
                    <p className="text-[11px] text-gray-500 pl-6">
                      Produces clean, uncluttered call sheets showing Sl No, Chest Number, and Full Name.
                    </p>

                    {!exportStrictPdf && (
                      <div className="pt-2 pl-6 grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={exportIncludeSection}
                            onChange={(e) => setExportIncludeSection(e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                          <span>Include Section</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={exportIncludePoints}
                            onChange={(e) => setExportIncludePoints(e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                          <span>Include Points</span>
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">
                      Chest Number and Name are included by default. Toggle optional columns:
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={exportIncludeTeam}
                          onChange={(e) => setExportIncludeTeam(e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span>Team Info</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={exportIncludeSection}
                          onChange={(e) => setExportIncludeSection(e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span>Section</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={exportIncludePoints}
                          onChange={(e) => setExportIncludePoints(e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span>Points</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Sort Order */}
                <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Sort Candidates By:</span>
                  <select
                    value={exportSortBy}
                    onChange={(e) => setExportSortBy(e.target.value as any)}
                    className="px-2.5 py-1 border border-gray-300 rounded-lg bg-white text-xs font-medium"
                  >
                    <option value="chestNumber">Chest Number (Ascending)</option>
                    <option value="name">Candidate Name (A-Z)</option>
                    <option value="section">Section</option>
                  </select>
                </div>
              </div>

              {/* Batch Action Option */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-blue-900">
                    Need separate files for each team?
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Download individual files for each of the {teams.length} teams in one click.
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleBatchExportAllTeamsXls}
                    disabled={isExporting}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                    title="Download separate XLS files for all teams"
                  >
                    All Teams XLS
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchExportAllTeamsPdf}
                    disabled={isExporting}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                    title="Download separate PDF files for all teams"
                  >
                    All Teams PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomExport}
                disabled={isExporting}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>📥 Download {exportFormat.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}