'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Result, Programme, Candidate, ProgrammeParticipant } from '@/types';
import { AdminResultsLeaderboard } from "@/components/admin/AdminResultsLeaderboard";
import { getDefaultGradePoints } from '@/lib/resultsHelper';

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'manage'>('leaderboard');
  const [results, setResults] = useState<Result[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkPublishing, setBulkPublishing] = useState(false);

  // Status Filter: 'all' | 'published' | 'draft'
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  // Section Filter for Results List: 'all' | 'senior' | 'junior' | 'sub-junior' | 'general'
  const [resultSectionFilter, setResultSectionFilter] = useState<string>('all');

  // Edit Modal State
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  const [editFormData, setEditFormData] = useState({
    section: 'senior' as 'senior' | 'junior' | 'sub-junior' | 'general',
    firstPlace: [] as string[],
    secondPlace: [] as string[],
    thirdPlace: [] as string[],
    firstPlaceTeams: [] as string[],
    secondPlaceTeams: [] as string[],
    thirdPlaceTeams: [] as string[],
    firstPoints: 10,
    secondPoints: 8,
    thirdPoints: 5,
    participationPoints: 3,
    notes: '',
    status: 'published' as 'draft' | 'published',
    participationGrades: [] as { chestNumber: string; grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; points: number }[],
    participationTeamGrades: [] as { teamCode: string; grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; points: number }[]
  });

  // Modal new grade holder inputs
  const [modalNewChest, setModalNewChest] = useState('');
  const [modalNewGrade, setModalNewGrade] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A');
  const [modalNewPoints, setModalNewPoints] = useState(3);
  const [modalNewTeam, setModalNewTeam] = useState('');

  // Enhanced form state
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [filteredParticipants, setFilteredParticipants] = useState<any[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<any[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Programme Searchable Selector State
  const [programmeSearch, setProgrammeSearch] = useState('');
  const [isProgrammeDropdownOpen, setIsProgrammeDropdownOpen] = useState(false);
  const programmeDropdownRef = useRef<HTMLDivElement>(null);

  // Close programme dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (programmeDropdownRef.current && !programmeDropdownRef.current.contains(event.target as Node)) {
        setIsProgrammeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter programmes for the Add Result combobox
  const filteredProgrammesForSelect = programmes.filter(prog => {
    if (!programmeSearch.trim()) return true;
    const term = programmeSearch.toLowerCase().trim();
    const nameMatch = prog.name?.toLowerCase().includes(term);
    const codeMatch = prog.code?.toLowerCase().includes(term);
    const catMatch = prog.category?.toLowerCase().includes(term);
    const subcatMatch = prog.subcategory?.toLowerCase().includes(term);
    const secMatch = prog.section?.toLowerCase().includes(term);
    return Boolean(nameMatch || codeMatch || catMatch || subcatMatch || secMatch);
  });

  const [formData, setFormData] = useState({
    programme: '',
    section: '' as 'senior' | 'junior' | 'sub-junior' | 'general' | '',
    positionType: '' as 'individual' | 'group' | 'general' | '',
    // For individual/group programmes
    firstPlace: [] as string[],
    secondPlace: [] as string[],
    thirdPlace: [] as string[],
    participationGrades: [] as { chestNumber: string; grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; points: number }[],
    // For general programmes (team-based)
    firstPlaceTeams: [] as string[],
    secondPlaceTeams: [] as string[],
    thirdPlaceTeams: [] as string[],
    participationTeamGrades: [] as { teamCode: string; grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; points: number }[],
    firstPoints: 10,
    secondPoints: 8,
    thirdPoints: 5,
    participationPoints: 3,
    notes: ''
  });

  // Fetch data from APIs (including draft results for admin)
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resultsRes, programmesRes, candidatesRes, participantsRes, teamsRes] = await Promise.all([
        fetch('/api/results?includeDrafts=true'),
        fetch('/api/programmes'),
        fetch('/api/candidates'),
        fetch('/api/programme-participants'),
        fetch('/api/teams')
      ]);

      // Check if all responses are OK before parsing JSON
      const responses = [resultsRes, programmesRes, candidatesRes, participantsRes, teamsRes];
      const responseNames = ['results', 'programmes', 'candidates', 'programme-participants', 'teams'];

      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          throw new Error(`Failed to fetch ${responseNames[i]}: ${responses[i].status} ${responses[i].statusText}`);
        }
      }

      const [resultsData, programmesData, candidatesData, participantsData, teamsData] = await Promise.all([
        resultsRes.json(),
        programmesRes.json(),
        candidatesRes.json(),
        participantsRes.json(),
        teamsRes.json()
      ]);

      setResults(resultsData || []);
      setProgrammes(programmesData || []);
      setCandidates(candidatesData || []);
      setParticipants(participantsData || []);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays as fallback
      setResults([]);
      setProgrammes([]);
      setCandidates([]);
      setParticipants([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle programme selection
  const handleProgrammeSelection = (programmeId: string) => {
    const programme = programmes.find(p => p._id?.toString() === programmeId);
    setSelectedProgramme(programme || null);
    setSelectedSection('');
    setFilteredParticipants([]);
    setShowParticipants(false);
    setIsProgrammeDropdownOpen(false);

    if (programme) {
      setFormData(prev => ({
        ...prev,
        programme: `${programme.code} - ${programme.name}`,
        positionType: programme.positionType || 'individual',
        firstPoints: programme.firstPoints ?? 10,
        secondPoints: programme.secondPoints ?? 8,
        thirdPoints: programme.thirdPoints ?? 5,
        participationPoints: programme.participationPoints ?? 3
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        programme: '',
        positionType: '' as any
      }));
    }
  };

  // Handle section selection
  const handleSectionSelection = (section: string) => {
    setSelectedSection(section);
    setFormData(prev => ({ ...prev, section: section as any }));

    if (selectedProgramme && section) {
      if (selectedProgramme.positionType === 'general' || selectedProgramme.positionType === 'group') {
        // For general AND group programmes, assign position/mark at team level
        const programmeParticipants = participants.filter(p =>
          p.programmeId === selectedProgramme._id?.toString()
        );

        const registeredTeams = programmeParticipants.map(pp => {
          const team = teams.find(t => t.code === pp.teamCode);
          return {
            teamCode: pp.teamCode,
            team,
            programmeName: pp.programmeName,
            programmeCode: pp.programmeCode,
            participantCount: pp.participants.length
          };
        });

        setFilteredTeams(registeredTeams);
        setFilteredParticipants([]);
      } else {
        // For individual programmes only, show per-participant cards
        const programmeParticipants = participants.filter(p =>
          p.programmeId === selectedProgramme._id?.toString()
        );

        const detailedParticipants = programmeParticipants.flatMap(pp =>
          pp.participants.map(chestNumber => {
            const trimmedChestNumber = (chestNumber || '').trim();
            const candidate = candidates.find(c => (c.chestNumber || '').trim() === trimmedChestNumber);
            return {
              chestNumber: trimmedChestNumber,
              candidate,
              teamCode: pp.teamCode,
              programmeName: pp.programmeName,
              programmeCode: pp.programmeCode
            };
          })
        ).filter(p => p.candidate && (section === 'general' || p.candidate.section === section));

        setFilteredParticipants(detailedParticipants);
        setFilteredTeams([]);
      }

      setShowParticipants(true);
    }
  };

  // Check if participant is assigned
  const isParticipantAssigned = (chestNumber: string) => {
    return [
      ...formData.firstPlace,
      ...formData.secondPlace,
      ...formData.thirdPlace,
      ...formData.participationGrades.map(pg => pg.chestNumber)
    ].includes(chestNumber);
  };

  // Check if team is assigned
  const isTeamAssigned = (teamCode: string) => {
    return [
      ...formData.firstPlaceTeams,
      ...formData.secondPlaceTeams,
      ...formData.thirdPlaceTeams,
      ...formData.participationTeamGrades.map(pg => pg.teamCode)
    ].includes(teamCode);
  };

  // Add/remove from position
  const togglePosition = (position: 'firstPlace' | 'secondPlace' | 'thirdPlace', chestNumber: string) => {
    setFormData(prev => ({
      ...prev,
      [position]: prev[position].includes(chestNumber)
        ? prev[position].filter(cn => cn !== chestNumber)
        : [...prev[position], chestNumber]
    }));
  };

  // Add/remove team from position
  const toggleTeamPosition = (position: 'firstPlaceTeams' | 'secondPlaceTeams' | 'thirdPlaceTeams', teamCode: string) => {
    setFormData(prev => ({
      ...prev,
      [position]: prev[position].includes(teamCode)
        ? prev[position].filter(tc => tc !== teamCode)
        : [...prev[position], teamCode]
    }));
  };

  // Add participation grade with default marks: A=3, B=2, C=1 (editable)
  const addParticipationGrade = (chestNumber: string, grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F', points?: number) => {
    const finalPoints = points !== undefined ? points : getDefaultGradePoints(grade);
    setFormData(prev => ({
      ...prev,
      participationGrades: [
        ...prev.participationGrades.filter(pg => pg.chestNumber !== chestNumber),
        { chestNumber, grade, points: finalPoints }
      ]
    }));
  };

  // Remove participation grade
  const removeParticipationGrade = (chestNumber: string) => {
    setFormData(prev => ({
      ...prev,
      participationGrades: prev.participationGrades.filter(pg => pg.chestNumber !== chestNumber)
    }));
  };

  // Add team participation grade with default marks: A=3, B=2, C=1 (editable)
  const addTeamParticipationGrade = (teamCode: string, grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F', points?: number) => {
    const finalPoints = points !== undefined ? points : getDefaultGradePoints(grade);
    setFormData(prev => ({
      ...prev,
      participationTeamGrades: [
        ...prev.participationTeamGrades.filter(pg => pg.teamCode !== teamCode),
        { teamCode, grade, points: finalPoints }
      ]
    }));
  };

  // Remove team participation grade
  const removeTeamParticipationGrade = (teamCode: string) => {
    setFormData(prev => ({
      ...prev,
      participationTeamGrades: prev.participationTeamGrades.filter(pg => pg.teamCode !== teamCode)
    }));
  };

  // Handle form submission (Draft or Published)
  const handleSubmitWithStatus = async (e: React.FormEvent, status: 'draft' | 'published' = 'published') => {
    e.preventDefault();

    if (!formData.programme || !formData.section || !formData.positionType) {
      alert('Please fill in all required fields');
      return;
    }

    const submitData = {
      ...formData,
      status,
      // Always store the real programmeId (ObjectId as string) so the public page can match correctly
      programmeId: selectedProgramme?._id?.toString() || '',
      // Individual/group results
      firstPlace: formData.firstPlace.map(cn => ({ chestNumber: cn })),
      secondPlace: formData.secondPlace.map(cn => ({ chestNumber: cn })),
      thirdPlace: formData.thirdPlace.map(cn => ({ chestNumber: cn })),
      participationGrades: formData.participationGrades,
      // Team results
      firstPlaceTeams: formData.firstPlaceTeams.map(tc => ({ teamCode: tc })),
      secondPlaceTeams: formData.secondPlaceTeams.map(tc => ({ teamCode: tc })),
      thirdPlaceTeams: formData.thirdPlaceTeams.map(tc => ({ teamCode: tc })),
      participationTeamGrades: formData.participationTeamGrades
    };

    try {
      setSubmitting(true);
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          programme: '',
          section: '' as any,
          positionType: '' as any,
          firstPlace: [],
          secondPlace: [],
          thirdPlace: [],
          participationGrades: [],
          firstPlaceTeams: [],
          secondPlaceTeams: [],
          thirdPlaceTeams: [],
          participationTeamGrades: [],
          firstPoints: 10,
          secondPoints: 8,
          thirdPoints: 5,
          participationPoints: 3,
          notes: ''
        });
        setSelectedProgramme(null);
        setSelectedSection('');
        setProgrammeSearch('');
        setIsProgrammeDropdownOpen(false);
        setFilteredParticipants([]);
        setFilteredTeams([]);
        setShowParticipants(false);

        await fetchData();
        alert(status === 'draft' ? 'Result saved as Draft (hidden from public)!' : 'Result published successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding result');
      }
    } catch (error) {
      console.error('Error adding result:', error);
      alert('Error adding result');
    } finally {
      setSubmitting(false);
    }
  };

  // Publish single draft result
  const handlePublishSingle = async (resultId: string, progName: string = 'this result') => {
    try {
      const response = await fetch(`/api/results?id=${resultId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      if (response.ok) {
        await fetchData();
        alert(`Result for "${progName}" published successfully!`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to publish'}`);
      }
    } catch (error) {
      console.error('Error publishing result:', error);
      alert('Error publishing result');
    }
  };

  // Move published result back to draft
  const handleUnpublishSingle = async (resultId: string, progName: string = 'this result') => {
    if (!confirm(`Are you sure you want to move the result for "${progName}" back to Draft? It will be hidden from public view.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/results?id=${resultId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });

      if (response.ok) {
        await fetchData();
        alert(`Result moved back to Draft.`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to unpublish'}`);
      }
    } catch (error) {
      console.error('Error unpublishing result:', error);
      alert('Error unpublishing result');
    }
  };

  // Bulk publish selected draft results
  const handleBulkPublish = async (idsToPublish?: string[]) => {
    const ids = idsToPublish || selectedResults.filter(id => {
      const res = results.find(r => r._id?.toString() === id);
      return res?.status === 'draft';
    });

    if (ids.length === 0) {
      alert('Please select at least one draft result to publish.');
      return;
    }

    if (!confirm(`Are you sure you want to publish ${ids.length} draft result(s)? They will become publicly visible.`)) {
      return;
    }

    try {
      setBulkPublishing(true);
      const res = await fetch('/api/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'published' })
      });

      if (res.ok) {
        await fetchData();
        setSelectedResults(prev => prev.filter(id => !ids.includes(id)));
        alert(`Successfully published ${ids.length} result(s)!`);
      } else {
        const error = await res.json();
        alert(`Failed to publish: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error publishing results:', error);
      alert('Error publishing results');
    } finally {
      setBulkPublishing(false);
    }
  };

  // Publish ALL draft results in one click
  const handlePublishAllDrafts = async () => {
    const draftIds = results
      .filter(r => r.status === 'draft')
      .map(r => r._id?.toString())
      .filter(Boolean) as string[];

    if (draftIds.length === 0) {
      alert('No draft results to publish.');
      return;
    }

    if (!confirm(`Are you sure you want to publish ALL ${draftIds.length} draft result(s)? They will immediately become visible to the public.`)) {
      return;
    }

    try {
      setBulkPublishing(true);
      const res = await fetch('/api/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: draftIds, status: 'published' })
      });

      if (res.ok) {
        await fetchData();
        setSelectedResults([]);
        alert(`Successfully published all ${draftIds.length} draft result(s)!`);
      } else {
        const error = await res.json();
        alert(`Failed to publish drafts: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error publishing all drafts:', error);
      alert('Error publishing drafts');
    } finally {
      setBulkPublishing(false);
    }
  };

  // Edit result modal triggers
  const startEdit = (result: Result) => {
    setEditingResult(result);
    setEditFormData({
      section: (result.section || 'senior') as 'senior' | 'junior' | 'sub-junior' | 'general',
      firstPlace: (result.firstPlace || []).map(p => p.chestNumber),
      secondPlace: (result.secondPlace || []).map(p => p.chestNumber),
      thirdPlace: (result.thirdPlace || []).map(p => p.chestNumber),
      firstPlaceTeams: (result.firstPlaceTeams || []).map(t => t.teamCode),
      secondPlaceTeams: (result.secondPlaceTeams || []).map(t => t.teamCode),
      thirdPlaceTeams: (result.thirdPlaceTeams || []).map(t => t.teamCode),
      firstPoints: result.firstPoints ?? 10,
      secondPoints: result.secondPoints ?? 8,
      thirdPoints: result.thirdPoints ?? 5,
      participationPoints: result.participationPoints ?? 3,
      notes: result.notes || '',
      status: result.status || 'published',
      participationGrades: (result.participationGrades || []).map(pg => ({
        chestNumber: pg.chestNumber,
        grade: pg.grade,
        points: pg.points !== undefined && pg.points !== null ? pg.points : getDefaultGradePoints(pg.grade)
      })),
      participationTeamGrades: (result.participationTeamGrades || []).map(tg => ({
        teamCode: tg.teamCode,
        grade: tg.grade,
        points: tg.points !== undefined && tg.points !== null ? tg.points : getDefaultGradePoints(tg.grade)
      }))
    });
  };

  const handleUpdateResult = async (targetStatus?: 'draft' | 'published') => {
    if (!editingResult) return;
    const finalStatus = targetStatus || editFormData.status;

    const payload = {
      ...editingResult,
      section: editFormData.section,
      firstPlace: editFormData.firstPlace.map(cn => ({ chestNumber: cn })),
      secondPlace: editFormData.secondPlace.map(cn => ({ chestNumber: cn })),
      thirdPlace: editFormData.thirdPlace.map(cn => ({ chestNumber: cn })),
      firstPlaceTeams: editFormData.firstPlaceTeams.map(tc => ({ teamCode: tc })),
      secondPlaceTeams: editFormData.secondPlaceTeams.map(tc => ({ teamCode: tc })),
      thirdPlaceTeams: editFormData.thirdPlaceTeams.map(tc => ({ teamCode: tc })),
      firstPoints: editFormData.firstPoints,
      secondPoints: editFormData.secondPoints,
      thirdPoints: editFormData.thirdPoints,
      participationPoints: editFormData.participationPoints,
      notes: editFormData.notes,
      status: finalStatus,
      participationGrades: editFormData.participationGrades,
      participationTeamGrades: editFormData.participationTeamGrades
    };

    const { _id, ...safePayload } = payload;

    try {
      const response = await fetch(`/api/results?id=${editingResult._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safePayload),
      });

      if (response.ok) {
        setEditingResult(null);
        await fetchData();
        alert(finalStatus === 'draft' ? 'Result updated as Draft!' : 'Result updated & published!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update result'}`);
      }
    } catch (err) {
      console.error('Error updating result:', err);
      alert('Error updating result');
    }
  };

  // Handle delete
  const handleDelete = async (resultId: string, programmeName: string) => {
    if (!confirm(`Are you sure you want to delete the result for "${programmeName}"?`)) {
      return;
    }

    try {
      setDeleting(resultId);
      const response = await fetch(`/api/results?id=${resultId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
        alert('Result deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      alert('Error deleting result');
    } finally {
      setDeleting(null);
    }
  };

  // Counts and filtered items
  const draftResults = results.filter(r => r.status === 'draft');
  const publishedResults = results.filter(r => r.status !== 'draft');
  const draftCount = draftResults.length;
  const publishedCount = publishedResults.length;

  // Results matching current status tab (used for section counts)
  const statusFilteredResults = results.filter(r => {
    if (statusFilter === 'draft' && r.status !== 'draft') return false;
    if (statusFilter === 'published' && r.status === 'draft') return false;
    return true;
  });

  // Available unique sections
  const availableSections = useMemo(() => {
    const defaultSections = ['senior', 'junior', 'sub-junior', 'general'];
    const extraSections = Array.from(
      new Set(results.map(r => r.section?.toLowerCase()).filter(Boolean))
    ).filter(s => !defaultSections.includes(s));
    return [...defaultSections, ...extraSections];
  }, [results]);

  const filteredResults = results.filter(r => {
    // Status filter
    if (statusFilter === 'draft' && r.status !== 'draft') return false;
    if (statusFilter === 'published' && r.status === 'draft') return false;

    // Section filter
    if (resultSectionFilter !== 'all' && (r.section || '').toLowerCase() !== resultSectionFilter.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const progMatch = r.programme?.toLowerCase().includes(q);
      const secMatch = r.section?.toLowerCase().includes(q);
      const chestMatch = [
        ...(r.firstPlace || []).map(p => p.chestNumber),
        ...(r.secondPlace || []).map(p => p.chestNumber),
        ...(r.thirdPlace || []).map(p => p.chestNumber),
      ].some(cn => cn?.toLowerCase().includes(q));
      const teamMatch = [
        ...(r.firstPlaceTeams || []).map(t => t.teamCode),
        ...(r.secondPlaceTeams || []).map(t => t.teamCode),
        ...(r.thirdPlaceTeams || []).map(t => t.teamCode),
      ].some(tc => tc?.toLowerCase().includes(q));
      return progMatch || secMatch || chestMatch || teamMatch;
    }
    return true;
  });

  const selectedDraftCount = selectedResults.filter(id => {
    const res = results.find(r => r._id?.toString() === id);
    return res?.status === 'draft';
  }).length;

  const selectedPublishedCount = selectedResults.filter(id => {
    const res = results.find(r => r._id?.toString() === id);
    return res?.status !== 'draft';
  }).length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allFilteredIds = filteredResults
        .map(r => r._id?.toString())
        .filter(Boolean) as string[];
      setSelectedResults(allFilteredIds);
    } else {
      setSelectedResults([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedResults(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedResults.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedResults.length} selected results?`)) return;

    try {
      setBulkDeleting(true);
      await Promise.all(
        selectedResults.map(id => fetch(`/api/results?id=${id}`, { method: 'DELETE' }))
      );
      
      await fetchData();
      setSelectedResults([]);
      alert(`Successfully deleted ${selectedResults.length} results!`);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('Error deleting some results');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkUnpublish = async () => {
    const ids = selectedResults.filter(id => {
      const res = results.find(r => r._id?.toString() === id);
      return res?.status !== 'draft';
    });

    if (ids.length === 0) {
      alert('Please select at least one published result to unpublish.');
      return;
    }

    if (!confirm(`Are you sure you want to move ${ids.length} result(s) back to Draft? They will be hidden from public view.`)) {
      return;
    }

    try {
      setBulkPublishing(true);
      const res = await fetch('/api/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'draft' })
      });

      if (res.ok) {
        await fetchData();
        setSelectedResults(prev => prev.filter(id => !ids.includes(id)));
        alert(`Successfully moved ${ids.length} result(s) back to Draft.`);
      } else {
        const error = await res.json();
        alert(`Failed to unpublish: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error unpublishing results:', error);
      alert('Error unpublishing results');
    } finally {
      setBulkPublishing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Results" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Results" />

      {/* Admin Tab Navigation */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🏆</span>
            <span>Live Leaderboard</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'manage'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📝</span>
            <span>Manage Results</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              {results.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/result-screen"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all shadow-xs"
            title="Open TV Result Screen (for Projector/Screening)"
          >
            <span>📺</span>
            <span>TV Screen Mode ↗</span>
          </Link>

          {activeTab === 'leaderboard' ? (
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs"
            >
              <span>➕ Add New Result</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all shadow-xs"
            >
              <span>🏆 View Standings</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'leaderboard' && (
        <AdminResultsLeaderboard
          results={results}
          programmes={programmes}
          candidates={candidates}
          teams={teams}
          participants={participants}
          onRefresh={fetchData}
          onEditResult={(res) => {
            startEdit(res);
          }}
          onSwitchToManageTab={() => setActiveTab('manage')}
        />
      )}

      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Add New Result */}
          <ShowcaseSection title="Add New Result">
          <form onSubmit={(e) => handleSubmitWithStatus(e, 'published')} className="space-y-6">
            {/* Programme and Section Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative" ref={programmeDropdownRef}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Programme *
                  </label>
                  {selectedProgramme && (
                    <button
                      type="button"
                      onClick={() => {
                        handleProgrammeSelection('');
                        setProgrammeSearch('');
                        setIsProgrammeDropdownOpen(true);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Hidden input to enforce form HTML required validation */}
                <input
                  type="text"
                  tabIndex={-1}
                  className="sr-only"
                  required
                  value={selectedProgramme?._id?.toString() || ''}
                  onChange={() => {}}
                />

                {selectedProgramme && !isProgrammeDropdownOpen ? (
                  // Selected Programme Card View
                  <div className="p-3.5 bg-blue-50/80 border-2 border-blue-400/50 rounded-xl transition-all shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs font-mono shrink-0">
                          {selectedProgramme.code}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">
                            {selectedProgramme.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span className="capitalize font-semibold text-blue-700">{selectedProgramme.category}</span>
                            <span>•</span>
                            <span className="capitalize font-medium text-purple-700">{selectedProgramme.positionType}</span>
                            {selectedProgramme.section && (
                              <>
                                <span>•</span>
                                <span className="capitalize">Section: {selectedProgramme.section}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProgrammeDropdownOpen(true);
                          setProgrammeSearch('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs shrink-0"
                      >
                        🔍 Change
                      </button>
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 flex flex-wrap items-center gap-4 text-xs text-blue-800">
                      <span><strong>Req. Participants:</strong> {selectedProgramme.requiredParticipants}</span>
                      <span><strong>Default Points:</strong> {selectedProgramme.firstPoints ?? 10} / {selectedProgramme.secondPoints ?? 8} / {selectedProgramme.thirdPoints ?? 5}</span>
                    </div>
                  </div>
                ) : (
                  // Search Input with Dropdown
                  <div className="relative">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={programmeSearch}
                        onChange={(e) => {
                          setProgrammeSearch(e.target.value);
                          setIsProgrammeDropdownOpen(true);
                        }}
                        onFocus={() => setIsProgrammeDropdownOpen(true)}
                        placeholder="Search programme by code, name, category..."
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all placeholder:text-gray-400 shadow-xs"
                      />
                      {programmeSearch && (
                        <button
                          type="button"
                          onClick={() => setProgrammeSearch('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {isProgrammeDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl z-40 max-h-72 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="p-2.5 bg-gray-50/90 text-xs font-semibold text-gray-500 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100 backdrop-blur-xs">
                          <span>{filteredProgrammesForSelect.length} programmes found</span>
                          {selectedProgramme && (
                            <button
                              type="button"
                              onClick={() => setIsProgrammeDropdownOpen(false)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Keep current
                            </button>
                          )}
                        </div>

                        {filteredProgrammesForSelect.length === 0 ? (
                          <div className="p-6 text-center text-sm text-gray-500">
                            <p className="font-semibold text-gray-700">No programmes found</p>
                            <p className="text-xs text-gray-400 mt-1">No match for &quot;{programmeSearch}&quot;</p>
                          </div>
                        ) : (
                          filteredProgrammesForSelect.map((programme) => {
                            const isSelected = selectedProgramme?._id?.toString() === programme._id?.toString();
                            return (
                              <button
                                key={programme._id?.toString()}
                                type="button"
                                onClick={() => {
                                  handleProgrammeSelection(programme._id!.toString());
                                  setProgrammeSearch('');
                                  setIsProgrammeDropdownOpen(false);
                                }}
                                className={`w-full text-left p-3 hover:bg-blue-50/80 transition-colors flex items-center justify-between group cursor-pointer ${
                                  isSelected ? 'bg-blue-50/90 font-medium' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-blue-100 text-blue-800 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {programme.code}
                                  </span>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900">
                                      {programme.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                      <span className="capitalize">{programme.category}</span>
                                      <span>•</span>
                                      <span className="capitalize">{programme.positionType}</span>
                                      {programme.section && (
                                        <>
                                          <span>•</span>
                                          <span className="capitalize">{programme.section}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="text-blue-600 font-bold text-xs flex items-center gap-1">
                                    ✓ Selected
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section *
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => handleSectionSelection(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                  required
                  disabled={!selectedProgramme}
                >
                  <option value="">Select section</option>
                  <option value="senior">Senior</option>
                  <option value="junior">Junior</option>
                  <option value="sub-junior">Sub Junior</option>
                  <option value="general">General</option>
                </select>
                {selectedSection && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-800">
                      <p><strong>Selected Section:</strong> {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1).replace('-', ' ')}</p>
                      {showParticipants && (
                        <p><strong>Registered Participants:</strong> {filteredParticipants.length}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registered Teams Display (for group AND general programmes) */}
            {showParticipants && (selectedProgramme?.positionType === 'general' || selectedProgramme?.positionType === 'group') && filteredTeams.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🏆</span>
                  {selectedProgramme?.positionType === 'group' ? 'Registered Teams — Group Programme' : 'Registered Teams'} ({filteredTeams.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTeams.map((teamEntry, index) => {
                    const isAssigned = isTeamAssigned(teamEntry.teamCode);
                    const isFirst = formData.firstPlaceTeams.includes(teamEntry.teamCode);
                    const isSecond = formData.secondPlaceTeams.includes(teamEntry.teamCode);
                    const isThird = formData.thirdPlaceTeams.includes(teamEntry.teamCode);
                    const participationGrade = formData.participationTeamGrades.find(pg => pg.teamCode === teamEntry.teamCode);

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${isAssigned
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 mb-1"
                              style={{ backgroundColor: teamEntry.team?.color || '#6B7280' }}
                            >
                              {teamEntry.teamCode}
                            </div>
                            <div className="font-bold text-gray-900">
                              {teamEntry.team?.name || teamEntry.teamCode}
                            </div>
                            <div className="text-sm text-gray-700">
                              {teamEntry.participantCount} participants
                            </div>
                          </div>
                          {isAssigned && (
                            <div className="text-green-600 font-bold text-sm">
                              ✅
                            </div>
                          )}
                        </div>

                        {/* Position Buttons */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          <button
                            type="button"
                            onClick={() => toggleTeamPosition('firstPlaceTeams', teamEntry.teamCode)}
                            className={`px-2 py-1 text-xs rounded ${isFirst ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                          >
                            🥇 1st
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTeamPosition('secondPlaceTeams', teamEntry.teamCode)}
                            className={`px-2 py-1 text-xs rounded ${isSecond ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                          >
                            🥈 2nd
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTeamPosition('thirdPlaceTeams', teamEntry.teamCode)}
                            className={`px-2 py-1 text-xs rounded ${isThird ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                              }`}
                          >
                            🥉 3rd
                          </button>
                        </div>

                        {/* Participation Grade (Default: A=3, B=2, C=1, editable) */}
                        <div className="flex items-center space-x-1.5">
                          <select
                            value={participationGrade?.grade || ''}
                            onChange={(e) => {
                              const selGrade = e.target.value as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '';
                              if (selGrade) {
                                addTeamParticipationGrade(
                                  teamEntry.teamCode,
                                  selGrade,
                                  getDefaultGradePoints(selGrade)
                                );
                              } else {
                                removeTeamParticipationGrade(teamEntry.teamCode);
                              }
                            }}
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                          >
                            <option value="">Grade</option>
                            <option value="A">Grade A (3 pts)</option>
                            <option value="B">Grade B (2 pts)</option>
                            <option value="C">Grade C (1 pt)</option>
                            <option value="D">Grade D (0 pts)</option>
                            <option value="E">Grade E (0 pts)</option>
                            <option value="F">Grade F (0 pts)</option>
                          </select>
                          {participationGrade && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={participationGrade.points}
                                onChange={(e) => addTeamParticipationGrade(
                                  teamEntry.teamCode,
                                  participationGrade.grade,
                                  parseInt(e.target.value) || 0
                                )}
                                className="text-xs px-1.5 py-1 border border-gray-300 rounded bg-white w-12 font-bold text-center"
                                title="Marks for this grade (editable)"
                              />
                              <span className="text-[10px] text-gray-400 font-medium">pts</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Registered Participants Display (for individual programmes ONLY) */}
            {showParticipants && selectedProgramme?.positionType === 'individual' && filteredParticipants.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">👥</span>
                  Registered Participants ({filteredParticipants.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredParticipants.map((participant, index) => {
                    const isAssigned = isParticipantAssigned(participant.chestNumber);
                    const isFirst = formData.firstPlace.includes(participant.chestNumber);
                    const isSecond = formData.secondPlace.includes(participant.chestNumber);
                    const isThird = formData.thirdPlace.includes(participant.chestNumber);
                    const participationGrade = formData.participationGrades.find(pg => pg.chestNumber === participant.chestNumber);

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${isAssigned
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-bold text-gray-900 font-mono">
                              {participant.chestNumber}
                            </div>
                            <div className="text-sm text-gray-700">
                              {participant.candidate?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {participant.teamCode} • {participant.candidate?.section} section
                            </div>
                          </div>
                          {isAssigned && (
                            <div className="text-green-600 font-bold text-sm">
                              ✅
                            </div>
                          )}
                        </div>

                        {/* Position Buttons */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          <button
                            type="button"
                            onClick={() => togglePosition('firstPlace', participant.chestNumber)}
                            className={`px-2 py-1 text-xs rounded ${isFirst ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                          >
                            🥇 1st
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePosition('secondPlace', participant.chestNumber)}
                            className={`px-2 py-1 text-xs rounded ${isSecond ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                          >
                            🥈 2nd
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePosition('thirdPlace', participant.chestNumber)}
                            className={`px-2 py-1 text-xs rounded ${isThird ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                              }`}
                          >
                            🥉 3rd
                          </button>
                        </div>

                        {/* Participation Grade (Default: A=3, B=2, C=1, editable) */}
                        <div className="flex items-center space-x-1.5">
                          <select
                            value={participationGrade?.grade || ''}
                            onChange={(e) => {
                              const selGrade = e.target.value as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '';
                              if (selGrade) {
                                addParticipationGrade(
                                  participant.chestNumber,
                                  selGrade,
                                  getDefaultGradePoints(selGrade)
                                );
                              } else {
                                removeParticipationGrade(participant.chestNumber);
                              }
                            }}
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                          >
                            <option value="">Grade</option>
                            <option value="A">Grade A (3 pts)</option>
                            <option value="B">Grade B (2 pts)</option>
                            <option value="C">Grade C (1 pt)</option>
                            <option value="D">Grade D (0 pts)</option>
                            <option value="E">Grade E (0 pts)</option>
                            <option value="F">Grade F (0 pts)</option>
                          </select>
                          {participationGrade && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={participationGrade.points}
                                onChange={(e) => addParticipationGrade(
                                  participant.chestNumber,
                                  participationGrade.grade,
                                  parseInt(e.target.value) || 0
                                )}
                                className="text-xs px-1.5 py-1 border border-gray-300 rounded bg-white w-12 font-bold text-center"
                                title="Marks for this grade (editable)"
                              />
                              <span className="text-[10px] text-gray-400 font-medium">pts</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showParticipants && (selectedProgramme?.positionType === 'general' || selectedProgramme?.positionType === 'group') && filteredTeams.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-yellow-600 text-4xl mb-2">⚠️</div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Teams Found</h3>
                <p className="text-yellow-700">
                  No teams have registered for this programme in the selected section.
                </p>
              </div>
            )}

            {showParticipants && selectedProgramme?.positionType === 'individual' && filteredParticipants.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-yellow-600 text-4xl mb-2">⚠️</div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Participants Found</h3>
                <p className="text-yellow-700">
                  No teams have registered for this programme in the selected section.
                </p>
              </div>
            )}

            {/* Total Marks Summary */}
            {showParticipants && (
              (() => {
                // Compute totals for team-based (group/general)
                const isTeamBased = selectedProgramme?.positionType === 'general' || selectedProgramme?.positionType === 'group';
                if (isTeamBased) {
                  const allAssigned = [
                    ...formData.firstPlaceTeams.map(tc => ({ teamCode: tc, label: '🥇 1st', pts: formData.firstPoints })),
                    ...formData.secondPlaceTeams.map(tc => ({ teamCode: tc, label: '🥈 2nd', pts: formData.secondPoints })),
                    ...formData.thirdPlaceTeams.map(tc => ({ teamCode: tc, label: '🥉 3rd', pts: formData.thirdPoints })),
                    ...formData.participationTeamGrades.map(pg => ({ teamCode: pg.teamCode, label: `Grade ${pg.grade}`, pts: pg.points })),
                  ];
                  if (allAssigned.length === 0) return null;
                  const grandTotal = allAssigned.reduce((sum, e) => sum + e.pts, 0);
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <span>📊</span> Marks Summary
                      </h4>
                      <div className="space-y-1.5">
                        {allAssigned.map((entry, i) => {
                          const team = teams.find(t => t.code === entry.teamCode);
                          return (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full inline-block shrink-0"
                                  style={{ backgroundColor: team?.color || '#6B7280' }}
                                />
                                <span className="font-semibold text-gray-800">{team?.name || entry.teamCode}</span>
                                <span className="text-gray-500">({entry.label})</span>
                              </div>
                              <span className="font-bold text-blue-800">+{entry.pts} pts</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-900">Total Marks Awarded</span>
                        <span className="text-sm font-extrabold text-blue-900">{grandTotal} pts</span>
                      </div>
                    </div>
                  );
                } else {
                  // Individual
                  const allAssigned = [
                    ...formData.firstPlace.map(cn => ({ chestNumber: cn, label: '🥇 1st', pts: formData.firstPoints })),
                    ...formData.secondPlace.map(cn => ({ chestNumber: cn, label: '🥈 2nd', pts: formData.secondPoints })),
                    ...formData.thirdPlace.map(cn => ({ chestNumber: cn, label: '🥉 3rd', pts: formData.thirdPoints })),
                    ...formData.participationGrades.map(pg => ({ chestNumber: pg.chestNumber, label: `Grade ${pg.grade}`, pts: pg.points })),
                  ];
                  if (allAssigned.length === 0) return null;
                  const grandTotal = allAssigned.reduce((sum, e) => sum + e.pts, 0);
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <span>📊</span> Marks Summary
                      </h4>
                      <div className="space-y-1.5">
                        {allAssigned.map((entry, i) => {
                          const candidate = candidates.find(c => c.chestNumber === entry.chestNumber);
                          return (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-gray-700">{entry.chestNumber}</span>
                                {candidate && <span className="text-gray-600">{candidate.name}</span>}
                                <span className="text-gray-500">({entry.label})</span>
                              </div>
                              <span className="font-bold text-blue-800">+{entry.pts} pts</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-900">Total Marks Awarded</span>
                        <span className="text-sm font-extrabold text-blue-900">{grandTotal} pts</span>
                      </div>
                    </div>
                  );
                }
              })()
            )}

            {/* Points Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points (1st Place)
                </label>
                <input
                  type="number"
                  value={formData.firstPoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstPoints: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points (2nd Place)
                </label>
                <input
                  type="number"
                  value={formData.secondPoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondPoints: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points (3rd Place)
                </label>
                <input
                  type="number"
                  value={formData.thirdPoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, thirdPoints: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points (Participation)
                </label>
                <input
                  type="number"
                  value={formData.participationPoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, participationPoints: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-700"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Enter any additional notes"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleSubmitWithStatus(e, 'published')}
                disabled={submitting || !showParticipants}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <span>🚀</span>
                <span>{submitting ? 'Publishing...' : 'Publish Result'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmitWithStatus(e, 'draft')}
                disabled={submitting || !showParticipants}
                className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <span>📝</span>
                <span>{submitting ? 'Saving...' : 'Save as Draft'}</span>
              </button>

              <span className="text-xs text-gray-500 italic">
                * Draft results are not visible on public pages or leaderboards until published.
              </span>
            </div>
          </form>
        </ShowcaseSection>

        {/* Results List */}
        <ShowcaseSection title="Results List">
          {/* Status Filter Tabs & Summary Counts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            {/* Filter Tabs: All, Published, Draft */}
            <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200/80">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>All Results</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-200/60 text-gray-600'
                }`}>
                  {results.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('published')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'published'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-emerald-700'
                }`}
              >
                <span>● Published</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200/60 text-gray-600'
                }`}>
                  {publishedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'draft'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-gray-600 hover:text-amber-700'
                }`}
              >
                <span>📝 Drafts</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200/60 text-gray-600'
                }`}>
                  {draftCount}
                </span>
              </button>
            </div>

            {/* Quick Action: Publish All Drafts */}
            {draftCount > 0 && (
              <button
                type="button"
                onClick={handlePublishAllDrafts}
                disabled={bulkPublishing}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
                title="Publish all pending draft results at once"
              >
                <span>🚀</span>
                <span>Publish All Drafts ({draftCount})</span>
              </button>
            )}
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2 bg-gray-50/90 rounded-2xl border border-gray-200/70">
            <span className="text-xs font-bold text-gray-500 px-2 flex items-center gap-1">
              <span>🏛️</span>
              <span>Filter by Section:</span>
            </span>
            <button
              type="button"
              onClick={() => setResultSectionFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                resultSectionFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <span>All Sections</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                resultSectionFilter === 'all' ? 'bg-purple-700 text-purple-100' : 'bg-gray-200 text-gray-600'
              }`}>
                {statusFilteredResults.length}
              </span>
            </button>
            {availableSections.map((sec) => {
              const count = statusFilteredResults.filter(
                (r) => (r.section || '').toLowerCase() === sec.toLowerCase()
              ).length;
              const formatted = sec.charAt(0).toUpperCase() + sec.slice(1).replace('-', ' ');
              const isSelected = resultSectionFilter.toLowerCase() === sec.toLowerCase();
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setResultSectionFilter(sec)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <span>{formatted}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-purple-700 text-purple-100' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar & Bulk actions */}
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by programme, section, chest number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs sm:text-sm text-gray-700"
              />

              {resultSectionFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setResultSectionFilter('all')}
                  className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 font-semibold px-2.5 py-2 rounded-xl transition-colors cursor-pointer"
                  title="Clear section filter"
                >
                  <span>✕ Section:</span>
                  <span className="capitalize">{resultSectionFilter.replace('-', ' ')}</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Select All / Deselect All quick links */}
              <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = filteredResults.map(r => r._id?.toString()).filter(Boolean) as string[];
                    setSelectedResults(allIds);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Select All ({filteredResults.length})
                </button>
                {selectedResults.length > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedResults([])}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              {/* Publish Selected Drafts Button */}
              {selectedDraftCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleBulkPublish()}
                  disabled={bulkPublishing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Publish all selected draft results"
                >
                  <span>🚀</span>
                  <span>{bulkPublishing ? 'Publishing...' : `Publish Selected (${selectedDraftCount})`}</span>
                </button>
              )}

              {/* Unpublish Selected Published Results Button */}
              {selectedPublishedCount > 0 && (
                <button
                  type="button"
                  onClick={handleBulkUnpublish}
                  disabled={bulkPublishing}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Move selected published results back to draft"
                >
                  <span>📝</span>
                  <span>{bulkPublishing ? 'Moving...' : `Unpublish Selected (${selectedPublishedCount})`}</span>
                </button>
              )}

              {/* Bulk Delete Button */}
              {selectedResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>🗑️</span>
                  <span>{bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedResults.length})`}</span>
                </button>
              )}
            </div>
          </div>
          
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-150">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-gray-700 font-bold text-sm">
                {statusFilter === 'draft' 
                  ? 'No draft results found'
                  : statusFilter === 'published' 
                    ? 'No published results found' 
                    : 'No results found matching your criteria'}
                {resultSectionFilter !== 'all' && (
                  <span className="text-purple-700 block mt-1">
                    for section: {resultSectionFilter.charAt(0).toUpperCase() + resultSectionFilter.slice(1).replace('-', ' ')}
                  </span>
                )}
                .
              </p>
              {(resultSectionFilter !== 'all' || searchQuery || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setResultSectionFilter('all');
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="mt-3 px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>↺ Clear all filters</span>
                </button>
              )}
              <p className="text-gray-400 text-xs mt-2">
                {statusFilter === 'draft' ? 'You can save results as draft using the form above.' : 'Add results using the form above.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b-2 border-gray-200">
                    <th className="w-12 py-4 px-4">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={filteredResults.length > 0 && selectedResults.length === filteredResults.length}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-4 px-3 font-bold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Programme</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Section</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">🥇 First</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">🥈 Second</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">🥉 Third</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">🎖️ Participation</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">📊 Total</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedResults.includes(result._id!.toString())}
                          onChange={() => handleSelect(result._id!.toString())}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        {result.status === 'draft' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Published
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{result.programme}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                          {result.section.charAt(0).toUpperCase() + result.section.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {/* Individual Results */}
                          {result.positionType === 'individual' && result.firstPlace && result.firstPlace.length > 0 && (
                            <div className="mb-2">
                              {result.firstPlace.map((winner, index) => {
                                const cand = candidates.find(c => c.chestNumber === winner.chestNumber);
                                const grade = (winner as any).grade || result.participationGrades?.find(pg => pg.chestNumber === winner.chestNumber)?.grade;
                                return (
                                  <div key={index} className="mb-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-900 font-mono">{winner.chestNumber}</span>
                                    {cand && <span className="text-xs text-gray-500 truncate max-w-[100px]">({cand.name})</span>}
                                    {grade && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        Grade {grade}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <p className="text-gray-500 text-xs">+{result.firstPoints} pts each</p>
                            </div>
                          )}
                          {/* Team Results (group + general) */}
                          {(result.positionType === 'group' || result.positionType === 'general') && result.firstPlaceTeams && result.firstPlaceTeams.length > 0 && (
                            <div>
                              {result.firstPlaceTeams.map((winner, index) => {
                                const teamGrade = (winner as any).grade || result.participationTeamGrades?.find(tg => tg.teamCode === winner.teamCode)?.grade;
                                return (
                                  <div key={index} className="mb-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-block w-3.5 h-3.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: teams.find(t => t.code === winner.teamCode)?.color || '#6B7280' }}></span>
                                    <span className="font-bold text-gray-900">{winner.teamCode}</span>
                                    {teamGrade && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        Grade {teamGrade}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <p className="text-gray-500 text-xs">+{result.firstPoints} pts each</p>
                            </div>
                          )}
                          {/* Fallback for legacy data */}
                          {result.positionType !== 'individual' && (!result.firstPlaceTeams || result.firstPlaceTeams.length === 0) && result.firstPlace && result.firstPlace.length > 0 && (
                            <div className="mb-2">
                              {result.firstPlace.map((winner, index) => {
                                const cand = candidates.find(c => c.chestNumber === winner.chestNumber);
                                const grade = (winner as any).grade || result.participationGrades?.find(pg => pg.chestNumber === winner.chestNumber)?.grade;
                                return (
                                  <div key={index} className="mb-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-900 font-mono">{winner.chestNumber}</span>
                                    {cand && <span className="text-xs text-gray-500 truncate max-w-[100px]">({cand.name})</span>}
                                    {grade && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        Grade {grade}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <p className="text-gray-500 text-xs">+{result.firstPoints} pts each</p>
                            </div>
                          )}
                          {(!result.firstPlace || result.firstPlace.length === 0) && (!result.firstPlaceTeams || result.firstPlaceTeams.length === 0) && (
                            <p className="text-gray-400">-</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {/* Individual Results */}
                          {result.positionType === 'individual' && result.secondPlace && result.secondPlace.length > 0 && (
                            <div className="mb-2">
                              {result.secondPlace.map((winner, index) => {
                                const cand = candidates.find(c => c.chestNumber === winner.chestNumber);
                                const grade = (winner as any).grade || result.participationGrades?.find(pg => pg.chestNumber === winner.chestNumber)?.grade;
                                return (
                                  <div key={index} className="mb-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-900 font-mono">{winner.chestNumber}</span>
                                    {cand && <span className="text-xs text-gray-500 truncate max-w-[100px]">({cand.name})</span>}
                                    {grade && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        Grade {grade}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <p className="text-gray-500 text-xs">+{result.secondPoints} pts each</p>
                            </div>
                          )}
                          {/* Team Results (group + general) */}
                          {(result.positionType === 'group' || result.positionType === 'general') && result.secondPlaceTeams && result.secondPlaceTeams.length > 0 && (
                            <div>
                              {result.secondPlaceTeams.map((winner, index) => {
                                const teamGrade = (winner as any).grade || result.participationTeamGrades?.find(tg => tg.teamCode === winner.teamCode)?.grade;
                                return (
                                  <div key={index} className="mb-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-block w-3.5 h-3.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: teams.find(t => t.code === winner.teamCode)?.color || '#6B7280' }}></span>
                                    <span className="font-bold text-gray-900">{winner.teamCode}</span>
                                    {teamGrade && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        Grade {teamGrade}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <p className="text-gray-500 text-xs">+{result.secondPoints} pts each</p>
                            </div>
                          )}
                          {/* Fallback for legacy data */}
                          {result.positionType !== 'individual' && (!result.secondPlaceTeams || result.secondPlaceTeams.length === 0) && result.secondPlace && result.secondPlace.length > 0 && (
                            <div className="mb-2">
                              {result.secondPlace.map((winner, index) => {
                                const cand = candidates.find(c => c.chestNumber === winner.chestNumber);
                                const grade = (winner as any).grade || result.participationGrades?.find(pg => pg.chestNumber === winner.chestNumber)?.grade;
                                return (
                                  <div key={index} className="mb-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-900 font-mono">{winner.chestNumber}</span>
                                    {cand && <span className="text-xs text-gray-500 truncate max-w-[100px]">({cand.name})</span>}
                                    {grade && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        Grade {grade}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <p className="text-gray-500 text-xs">+{result.secondPoints} pts each</p>
                            </div>
                          )}
                          {(!result.secondPlace || result.secondPlace.length === 0) && (!result.secondPlaceTeams || result.secondPlaceTeams.length === 0) && (
                            <p className="text-gray-400">-</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {/* Individual Results */}
                          {result.positionType === 'individual' && result.thirdPlace && result.thirdPlace.length > 0 && (
                            <div className="mb-2">
                              {result.thirdPlace.map((winner, index) => {
                                const cand = candidates.find(c => c.chestNumber === winner.chestNumber);
                                const grade = (winner as any).grade || result.participationGrades?.find(pg => pg.chestNumber === winner.chestNumber)?.grade;
                                return (
                                  <div key={index} className="mb-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-900 font-mono">{winner.chestNumber}</span>
                                    {cand && <span className="text-xs text-gray-500 truncate max-w-[100px]">({cand.name})</span>}
                                    {grade && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        Grade {grade}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <p className="text-gray-500 text-xs">+{result.thirdPoints} pts each</p>
                            </div>
                          )}
                          {/* Team Results (group + general) */}
                          {(result.positionType === 'group' || result.positionType === 'general') && result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0 && (
                            <div>
                              {result.thirdPlaceTeams.map((winner, index) => {
                                const teamGrade = (winner as any).grade || result.participationTeamGrades?.find(tg => tg.teamCode === winner.teamCode)?.grade;
                                return (
                                  <div key={index} className="mb-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-block w-3.5 h-3.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: teams.find(t => t.code === winner.teamCode)?.color || '#6B7280' }}></span>
                                    <span className="font-bold text-gray-900">{winner.teamCode}</span>
                                    {teamGrade && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        Grade {teamGrade}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <p className="text-gray-500 text-xs">+{result.thirdPoints} pts each</p>
                            </div>
                          )}
                          {/* Fallback for legacy data */}
                          {result.positionType !== 'individual' && (!result.thirdPlaceTeams || result.thirdPlaceTeams.length === 0) && result.thirdPlace && result.thirdPlace.length > 0 && (
                            <div className="mb-2">
                              {result.thirdPlace.map((winner, index) => {
                                const cand = candidates.find(c => c.chestNumber === winner.chestNumber);
                                const grade = (winner as any).grade || result.participationGrades?.find(pg => pg.chestNumber === winner.chestNumber)?.grade;
                                return (
                                  <div key={index} className="mb-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-900 font-mono">{winner.chestNumber}</span>
                                    {cand && <span className="text-xs text-gray-500 truncate max-w-[100px]">({cand.name})</span>}
                                    {grade && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        Grade {grade}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              <p className="text-gray-500 text-xs">+{result.thirdPoints} pts each</p>
                            </div>
                          )}
                          {(!result.thirdPlace || result.thirdPlace.length === 0) && (!result.thirdPlaceTeams || result.thirdPlaceTeams.length === 0) && (
                            <p className="text-gray-400">-</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {/* Individual/Group Participation */}
                          {result.participationGrades && result.participationGrades.length > 0 && (                            <div className="mb-2">
                              {result.participationGrades.map((pg, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900">{pg.chestNumber}</span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                    {pg.grade}
                                  </span>
                                  <span className="text-xs text-gray-500">({pg.points} pts)</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Team Participation */}
                          {result.participationTeamGrades && result.participationTeamGrades.length > 0 && (
                            <div>
                              {result.participationTeamGrades.map((pg, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-1">
                                  <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: teams.find(t => t.code === pg.teamCode)?.color || '#6B7280' }}></span>
                                  <span className="font-medium text-gray-900">{pg.teamCode}</span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                    {pg.grade}
                                  </span>
                                  <span className="text-xs text-gray-500">({pg.points} pts)</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {(!result.participationGrades || result.participationGrades.length === 0) && (!result.participationTeamGrades || result.participationTeamGrades.length === 0) && (
                            <p className="text-gray-400">-</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const firstCount = (result.positionType === 'individual'
                            ? result.firstPlace?.length
                            : result.firstPlaceTeams?.length) ?? 0;
                          const secondCount = (result.positionType === 'individual'
                            ? result.secondPlace?.length
                            : result.secondPlaceTeams?.length) ?? 0;
                          const thirdCount = (result.positionType === 'individual'
                            ? result.thirdPlace?.length
                            : result.thirdPlaceTeams?.length) ?? 0;
                          const participationTotal = result.positionType === 'individual'
                            ? (result.participationGrades || []).reduce((s, p) => s + p.points, 0)
                            : (result.participationTeamGrades || []).reduce((s, p) => s + p.points, 0);
                          const total =
                            firstCount * (result.firstPoints ?? 0) +
                            secondCount * (result.secondPoints ?? 0) +
                            thirdCount * (result.thirdPoints ?? 0) +
                            participationTotal;
                          return (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                              {total} pts
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {result.status === 'draft' ? (
                            <button
                              onClick={() => handlePublishSingle(result._id!.toString())}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Publish this result immediately"
                            >
                              🚀 Publish
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpublishSingle(result._id!.toString())}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Revert back to draft"
                            >
                              📝 Unpublish
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(result)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(result._id!.toString(), result.programme || 'Unknown Programme')}
                            disabled={deleting === result._id?.toString()}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {deleting === result._id?.toString() ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ShowcaseSection>
      </div>
      )}

      {/* Edit Result Modal */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>Edit Result</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    editFormData.status === 'draft' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {editFormData.status === 'draft' ? '📝 Draft' : '🚀 Published'}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingResult.programme} • <span className="capitalize font-semibold text-purple-700">{editFormData.section || editingResult.section}</span>
                </p>
              </div>
              <button
                onClick={() => setEditingResult(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Status Switcher */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Result Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditFormData(prev => ({ ...prev, status: 'draft' }))}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      editFormData.status === 'draft'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs ring-2 ring-amber-300'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    📝 Draft (Hidden from public)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData(prev => ({ ...prev, status: 'published' }))}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      editFormData.status === 'published'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs ring-2 ring-emerald-300'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🚀 Published (Live on site)
                  </button>
                </div>
              </div>

              {/* Section Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Section *
                </label>
                <select
                  value={editFormData.section}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, section: e.target.value as any }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden capitalize bg-white text-gray-800 shadow-xs cursor-pointer"
                >
                  <option value="senior">Senior</option>
                  <option value="junior">Junior</option>
                  <option value="sub-junior">Sub Junior</option>
                  <option value="general">General</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Change the section category (Senior, Junior, Sub Junior, or General) for this result.
                </p>
              </div>

              {/* Team Programme Winners vs Individual Winners */}
              {((editingResult.firstPlaceTeams && editingResult.firstPlaceTeams.length > 0) || editingResult.positionType === 'general') ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">🥇 1st Place Team(s)</label>
                    <input
                      type="text"
                      value={editFormData.firstPlaceTeams.join(', ')}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        firstPlaceTeams: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                      }))}
                      placeholder="e.g. ALPHA, BETA"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">🥈 2nd Place Team(s)</label>
                    <input
                      type="text"
                      value={editFormData.secondPlaceTeams.join(', ')}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        secondPlaceTeams: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                      }))}
                      placeholder="e.g. GAMMA"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">🥉 3rd Place Team(s)</label>
                    <input
                      type="text"
                      value={editFormData.thirdPlaceTeams.join(', ')}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        thirdPlaceTeams: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                      }))}
                      placeholder="e.g. DELTA"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">🥇 1st Place Chest Number(s)</label>
                    <input
                      type="text"
                      value={editFormData.firstPlace.join(', ')}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        firstPlace: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                      }))}
                      placeholder="e.g. 101, 102"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Separate multiple chest numbers with commas</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">🥈 2nd Place Chest Number(s)</label>
                    <input
                      type="text"
                      value={editFormData.secondPlace.join(', ')}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        secondPlace: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                      }))}
                      placeholder="e.g. 105"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">🥉 3rd Place Chest Number(s)</label>
                    <input
                      type="text"
                      value={editFormData.thirdPlace.join(', ')}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        thirdPlace: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                      }))}
                      placeholder="e.g. 112"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Points */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">1st Place Points</label>
                  <input
                    type="number"
                    value={editFormData.firstPoints}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, firstPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">2nd Place Points</label>
                  <input
                    type="number"
                    value={editFormData.secondPoints}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, secondPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">3rd Place Points</label>
                  <input
                    type="number"
                    value={editFormData.thirdPoints}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, thirdPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Grade Holders & Marks (Default: A=3, B=2, C=1, editable) */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-800">
                      🎖️ Grade Holders & Marks
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Default marks: Grade A = 3, B = 2, C = 1 (editable)
                    </p>
                  </div>
                </div>

                {Boolean((editingResult.firstPlaceTeams && editingResult.firstPlaceTeams.length > 0) || editingResult.positionType === 'general' || editingResult.positionType === 'group') ? (
                  /* Team Grade Holders */
                  <div className="space-y-2">
                    {editFormData.participationTeamGrades.map((tg, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-xs font-bold text-gray-800 w-16">{tg.teamCode}</span>
                        <select
                          value={tg.grade}
                          onChange={(e) => {
                            const newGrade = e.target.value as 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
                            const newPts = getDefaultGradePoints(newGrade);
                            setEditFormData(prev => ({
                              ...prev,
                              participationTeamGrades: prev.participationTeamGrades.map((item, i) =>
                                i === idx ? { ...item, grade: newGrade, points: newPts } : item
                              )
                            }));
                          }}
                          className="text-xs px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                        >
                          <option value="A">Grade A (3 pts)</option>
                          <option value="B">Grade B (2 pts)</option>
                          <option value="C">Grade C (1 pt)</option>
                          <option value="D">Grade D (0 pts)</option>
                          <option value="E">Grade E (0 pts)</option>
                          <option value="F">Grade F (0 pts)</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={tg.points}
                            onChange={(e) => {
                              const newPts = parseInt(e.target.value) || 0;
                              setEditFormData(prev => ({
                                ...prev,
                                participationTeamGrades: prev.participationTeamGrades.map((item, i) =>
                                  i === idx ? { ...item, points: newPts } : item
                                )
                              }));
                            }}
                            className="text-xs px-1.5 py-1 border border-gray-300 rounded bg-white w-14 font-bold text-center"
                            title="Edit marks"
                          />
                          <span className="text-[10px] text-gray-400 font-medium">pts</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditFormData(prev => ({
                            ...prev,
                            participationTeamGrades: prev.participationTeamGrades.filter((_, i) => i !== idx)
                          }))}
                          className="text-red-500 hover:text-red-700 text-xs px-1.5 py-1 ml-auto"
                          title="Remove grade"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {editFormData.participationTeamGrades.length === 0 && (
                      <p className="text-xs text-gray-400 italic py-1">No additional team grade holders recorded.</p>
                    )}

                    {/* Add Team Grade Row */}
                    <div className="flex items-center gap-1.5 p-2 bg-blue-50/60 rounded-lg border border-dashed border-blue-200 mt-2">
                      <input
                        type="text"
                        value={modalNewTeam}
                        onChange={(e) => setModalNewTeam(e.target.value.toUpperCase())}
                        placeholder="Team Code"
                        className="text-xs px-2 py-1 border border-gray-300 rounded bg-white w-24 font-bold"
                      />
                      <select
                        value={modalNewGrade}
                        onChange={(e) => {
                          const g = e.target.value as any;
                          setModalNewGrade(g);
                          setModalNewPoints(getDefaultGradePoints(g));
                        }}
                        className="text-xs px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                      >
                        <option value="A">Grade A (3 pts)</option>
                        <option value="B">Grade B (2 pts)</option>
                        <option value="C">Grade C (1 pt)</option>
                        <option value="D">Grade D (0 pts)</option>
                        <option value="E">Grade E (0 pts)</option>
                        <option value="F">Grade F (0 pts)</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={modalNewPoints}
                          onChange={(e) => setModalNewPoints(parseInt(e.target.value) || 0)}
                          className="text-xs px-1.5 py-1 border border-gray-300 rounded bg-white w-14 font-bold text-center"
                          title="Marks for this grade (editable)"
                        />
                        <span className="text-[10px] text-gray-400 font-medium">pts</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const tc = modalNewTeam.trim().toUpperCase();
                          if (!tc) return;
                          setEditFormData(prev => ({
                            ...prev,
                            participationTeamGrades: [
                              ...prev.participationTeamGrades.filter(tg => tg.teamCode !== tc),
                              { teamCode: tc, grade: modalNewGrade, points: modalNewPoints }
                            ]
                          }));
                          setModalNewTeam('');
                        }}
                        className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 ml-auto cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Individual Candidate Grade Holders */
                  <div className="space-y-2">
                    {editFormData.participationGrades.map((pg, idx) => {
                      const cand = candidates.find(c => c.chestNumber === pg.chestNumber);
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="min-w-[80px]">
                            <span className="text-xs font-mono font-bold text-gray-900">#{pg.chestNumber}</span>
                            {cand && <span className="text-[10px] text-gray-500 block truncate max-w-[120px]">{cand.name}</span>}
                          </div>
                          <select
                            value={pg.grade}
                            onChange={(e) => {
                              const newGrade = e.target.value as 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
                              const newPts = getDefaultGradePoints(newGrade);
                              setEditFormData(prev => ({
                                ...prev,
                                participationGrades: prev.participationGrades.map((item, i) =>
                                  i === idx ? { ...item, grade: newGrade, points: newPts } : item
                                )
                              }));
                            }}
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                          >
                            <option value="A">Grade A (3 pts)</option>
                            <option value="B">Grade B (2 pts)</option>
                            <option value="C">Grade C (1 pt)</option>
                            <option value="D">Grade D (0 pts)</option>
                            <option value="E">Grade E (0 pts)</option>
                            <option value="F">Grade F (0 pts)</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={pg.points}
                              onChange={(e) => {
                                const newPts = parseInt(e.target.value) || 0;
                                setEditFormData(prev => ({
                                  ...prev,
                                  participationGrades: prev.participationGrades.map((item, i) =>
                                    i === idx ? { ...item, points: newPts } : item
                                  )
                                }));
                              }}
                              className="text-xs px-1.5 py-1 border border-gray-300 rounded bg-white w-14 font-bold text-center"
                              title="Edit marks"
                            />
                            <span className="text-[10px] text-gray-400 font-medium">pts</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditFormData(prev => ({
                              ...prev,
                              participationGrades: prev.participationGrades.filter((_, i) => i !== idx)
                            }))}
                            className="text-red-500 hover:text-red-700 text-xs px-1.5 py-1 ml-auto cursor-pointer"
                            title="Remove grade"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                    {editFormData.participationGrades.length === 0 && (
                      <p className="text-xs text-gray-400 italic py-1">No additional grade holders recorded.</p>
                    )}

                    {/* Add Individual Grade Row */}
                    <div className="flex items-center gap-1.5 p-2 bg-blue-50/60 rounded-lg border border-dashed border-blue-200 mt-2">
                      <input
                        type="text"
                        value={modalNewChest}
                        onChange={(e) => setModalNewChest(e.target.value.trim())}
                        placeholder="Chest #"
                        className="text-xs px-2 py-1 border border-gray-300 rounded bg-white w-20 font-mono font-bold"
                      />
                      <select
                        value={modalNewGrade}
                        onChange={(e) => {
                          const g = e.target.value as any;
                          setModalNewGrade(g);
                          setModalNewPoints(getDefaultGradePoints(g));
                        }}
                        className="text-xs px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                      >
                        <option value="A">Grade A (3 pts)</option>
                        <option value="B">Grade B (2 pts)</option>
                        <option value="C">Grade C (1 pt)</option>
                        <option value="D">Grade D (0 pts)</option>
                        <option value="E">Grade E (0 pts)</option>
                        <option value="F">Grade F (0 pts)</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={modalNewPoints}
                          onChange={(e) => setModalNewPoints(parseInt(e.target.value) || 0)}
                          className="text-xs px-1.5 py-1 border border-gray-300 rounded bg-white w-14 font-bold text-center"
                          title="Marks for this grade (editable)"
                        />
                        <span className="text-[10px] text-gray-400 font-medium">pts</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const chest = modalNewChest.trim();
                          if (!chest) return;
                          setEditFormData(prev => ({
                            ...prev,
                            participationGrades: [
                              ...prev.participationGrades.filter(pg => pg.chestNumber !== chest),
                              { chestNumber: chest, grade: modalNewGrade, points: modalNewPoints }
                            ]
                          }));
                          setModalNewChest('');
                        }}
                        className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 ml-auto cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes or remarks"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingResult(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateResult('draft')}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>📝 Save as Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateResult('published')}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>🚀 Publish Result</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}