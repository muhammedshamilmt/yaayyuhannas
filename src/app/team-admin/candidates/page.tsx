'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Candidate } from '@/types';
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
      } catch (e) {}
    }
    return 'SMD';
  };
  const teamCode = searchParams.get('team') || getFallbackTeam();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newCandidate, setNewCandidate] = useState({
    chestNumber: '',
    name: '',
    section: 'senior' as 'senior' | 'junior' | 'sub-junior',
    profileImage: null as string | null,
    profileImageMimeType: undefined as string | undefined,
    profileImageSize: undefined as number | undefined
  });

  const [editCandidate, setEditCandidate] = useState({
    chestNumber: '',
    name: '',
    section: 'senior' as 'senior' | 'junior' | 'sub-junior',
    profileImage: null as string | null,
    profileImageMimeType: undefined as string | undefined,
    profileImageSize: undefined as number | undefined
  });

  useEffect(() => {
    fetchCandidates();
  }, [teamCode]);

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`/api/candidates?team=${teamCode}`);
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

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
        fetchCandidates();
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

  const updateCandidate = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/candidates?id=${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCandidate)
      });

      if (response.ok) {
        setEditingId(null);
        fetchCandidates();
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

  const deleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to delete "${candidateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/candidates?id=${candidateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCandidates();
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
      profileImageSize: candidate.profileImageSize
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
      profileImageSize: undefined
    });
  };

  // Group candidates by section
  const candidatesBySection = {
    senior: candidates.filter(c => c.section === 'senior'),
    junior: candidates.filter(c => c.section === 'junior'),
    'sub-junior': candidates.filter(c => c.section === 'sub-junior')
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSection = selectedSection === 'all' || candidate.section === selectedSection;
    const matchesSearch = searchQuery === '' || 
      candidate.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      candidate.chestNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  }).sort((a, b) => {
    // Parse chest numbers to integers for numeric sorting
    const numA = parseInt(a.chestNumber) || 99999;
    const numB = parseInt(b.chestNumber) || 99999;
    return numA - numB;
  });

  const exportToCSV = () => {
    const headers = ['Chest Number', 'Name', 'Section', 'Points'];
    
    const csvData = filteredCandidates.map(candidate => [
      candidate.chestNumber || '',
      `"${(candidate.name || '').replace(/"/g, '""')}"`,
      candidate.section || '',
      candidate.points || 0
    ]);
    
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Candidates</h1>
          <p className="text-gray-600">Manage your team members and their information</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{candidates.length}</div>
          <div className="text-sm text-gray-500">Total Candidates</div>
        </div>
      </div>

      {/* Add New Candidate */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Candidate</h2>
        </div>
        <div className="p-6">
          <form onSubmit={addCandidate} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex justify-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Profile Photo</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Chest Number</label>
                <input
                  type="text"
                  value={newCandidate.chestNumber}
                  onChange={(e) => setNewCandidate({...newCandidate, chestNumber: e.target.value})}
                  placeholder="e.g., SMD013"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name</label>
                <input
                  type="text"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                <select
                  value={newCandidate.section}
                  onChange={(e) => setNewCandidate({...newCandidate, section: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="senior">Senior</option>
                  <option value="junior">Junior</option>
                  <option value="sub-junior">Sub Junior</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg transition-colors font-medium"
              >
                {submitting ? 'Adding...' : 'Add Candidate'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(candidatesBySection).map(([section, sectionCandidates]) => (
          <div key={section} className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{sectionCandidates.length}</div>
              <div className="text-sm text-gray-600 capitalize">{section.replace('-', ' ')}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-lg font-semibold text-gray-900">All Candidates</h2>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="all">All Sections</option>
              <option value="senior">Senior</option>
              <option value="junior">Junior</option>
              <option value="sub-junior">Sub Junior</option>
            </select>
            <input
              type="text"
              placeholder="Search name or chest no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            />
            <button
              onClick={exportToCSV}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center whitespace-nowrap"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chest Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate._id?.toString()} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === candidate._id?.toString() ? (
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
                        onImageChange={() => {}} // Read-only in view mode
                        name={candidate.name}
                        size="sm"
                        shape="circle"
                        disabled={true}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === candidate._id?.toString() ? (
                      <input
                        type="text"
                        value={editCandidate.chestNumber}
                        onChange={(e) => setEditCandidate({...editCandidate, chestNumber: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="font-mono font-medium text-gray-900">{candidate.chestNumber}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === candidate._id?.toString() ? (
                      <input
                        type="text"
                        value={editCandidate.name}
                        onChange={(e) => setEditCandidate({...editCandidate, name: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-gray-900">{candidate.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === candidate._id?.toString() ? (
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {candidate.section.replace('-', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {candidate.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === candidate._id?.toString() ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateCandidate(candidate._id?.toString() || '')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(candidate)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCandidate(candidate._id?.toString() || '', candidate.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Candidates Found</h3>
              <p className="text-gray-500">
                {candidates.length === 0 
                  ? "Add your first team member using the form above." 
                  : "No candidates match your filters."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}