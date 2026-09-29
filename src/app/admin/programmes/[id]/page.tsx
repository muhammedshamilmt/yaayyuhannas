"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Programme, ProgrammeParticipant, Team, Candidate, FestivalInfo } from '@/types';
import Link from 'next/link';
import {
    UserPlus,
    Edit2,
    Trash2,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    X,
    Search,
    Users,
    Check,
    Loader2,
    ShieldAlert,
    RefreshCw,
    Layers,
    ArrowLeft
} from 'lucide-react';

interface ProgrammeDetailsProps { }

const ProgrammeDetails: React.FC<ProgrammeDetailsProps> = () => {
    const params = useParams();
    const router = useRouter();
    const programmeId = params.id as string;

    const [programme, setProgramme] = useState<Programme | null>(null);
    const [registrations, setRegistrations] = useState<ProgrammeParticipant[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [allProgrammes, setAllProgrammes] = useState<Programme[]>([]);
    const [allParticipants, setAllParticipants] = useState<ProgrammeParticipant[]>([]);
    const [festInfo, setFestInfo] = useState<FestivalInfo | null>(null);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'registrations'>('registrations');
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal state for Admin Adding / Editing Candidates
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingRegistration, setEditingRegistration] = useState<ProgrammeParticipant | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [registrationStatus, setRegistrationStatus] = useState<'confirmed' | 'registered'>('confirmed');
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Auto-dismiss action message
    useEffect(() => {
        if (actionMessage) {
            const timer = setTimeout(() => setActionMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionMessage]);

    useEffect(() => {
        if (programmeId) {
            fetchProgrammeData();
        }
    }, [programmeId]);

    const fetchProgrammeData = async () => {
        try {
            setLoading(true);

            // Fetch programme details, registrations, teams, candidates, all programmes, all registrations, and fest info
            const [
                programmeRes,
                registrationsRes,
                teamsRes,
                candidatesRes,
                allProgrammesRes,
                allParticipantsRes,
                festInfoRes
            ] = await Promise.all([
                fetch(`/api/programmes?id=${programmeId}`),
                fetch(`/api/programme-participants?programmeId=${programmeId}`),
                fetch('/api/teams'),
                fetch('/api/candidates'),
                fetch('/api/programmes'),
                fetch('/api/programme-participants'),
                fetch('/api/festival-info')
            ]);

            if (!programmeRes.ok) {
                throw new Error('Programme not found');
            }

            const [
                programmeData,
                registrationsData,
                teamsData,
                candidatesData,
                allProgrammesData,
                allParticipantsData,
                festInfoData
            ] = await Promise.all([
                programmeRes.json(),
                registrationsRes.ok ? registrationsRes.json() : [],
                teamsRes.ok ? teamsRes.json() : [],
                candidatesRes.ok ? candidatesRes.json() : [],
                allProgrammesRes.ok ? allProgrammesRes.json() : [],
                allParticipantsRes.ok ? allParticipantsRes.json() : [],
                festInfoRes.ok ? festInfoRes.json() : null
            ]);

            setProgramme(programmeData);
            setRegistrations(Array.isArray(registrationsData) ? registrationsData : []);
            setTeams(Array.isArray(teamsData) ? teamsData : []);
            setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
            setAllProgrammes(Array.isArray(allProgrammesData) ? allProgrammesData : []);
            setAllParticipants(Array.isArray(allParticipantsData) ? allParticipantsData : []);
            setFestInfo(festInfoData);

        } catch (error: any) {
            console.error('Error fetching programme data:', error);
            setError(error.message || 'Failed to load programme data');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOver = async () => {
        if (!programme) return;
        const isCurrentlyOver = programme.status === 'completed' || (programme as any).isOver === true;
        const newStatus = isCurrentlyOver ? 'active' : 'completed';
        const confirmMessage = isCurrentlyOver
            ? `Reopen programme "${programme.name}" (${programme.code})?\nRegistrations and candidate updates will be allowed again.`
            : `Mark programme "${programme.name}" (${programme.code}) as OVER?\nRegistrations will be locked.`;

        if (!confirm(confirmMessage)) return;

        try {
            const res = await fetch(`/api/programmes?id=${programme._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    isOver: !isCurrentlyOver
                })
            });

            if (res.ok) {
                setProgramme(prev => prev ? { ...prev, status: newStatus, isOver: !isCurrentlyOver } : null);
                setActionMessage({
                    type: 'success',
                    text: isCurrentlyOver
                        ? `Programme "${programme.name}" reopened successfully!`
                        : `Programme "${programme.name}" marked as OVER.`
                });
            } else {
                alert('Failed to update programme status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Error updating status');
        }
    };

    // Calculate individual programme IDs across the entire festival
    const individualProgIdSet = useMemo(() => {
        const set = new Set<string>();
        allProgrammes.forEach(p => {
            if (p.positionType === 'individual' || (p as any).type === 'individual') {
                if (p._id) set.add(p._id.toString());
                if (p.id) set.add(p.id.toString());
                if (p.code) set.add(p.code);
            }
        });
        return set;
    }, [allProgrammes]);

    // Check whether current programme is individual
    const isIndividualProgramme = useMemo(() => {
        if (!programme) return false;
        return programme.positionType === 'individual' || (programme as any).type === 'individual';
    }, [programme]);

    // Festival rules
    const maxCandidateLimit = festInfo?.maxCandidateParticipation ?? 3;
    const minRequiredParticipants = Number(programme?.requiredParticipants || 1);
    const maxAllowedParticipants = Number(programme?.maxParticipants || programme?.requiredParticipants || 1);

    // Calculate how many individual programmes a candidate is registered in
    const getCandidateIndividualCount = (chestNumber: string, isEditingCurrentTeam = false) => {
        return allParticipants.filter(p => {
            if (p.status === 'withdrawn') return false;
            // When editing an existing registration for this programme, don't count this programme itself
            if (isEditingCurrentTeam && (p.programmeId === programmeId || p.programmeCode === programme?.code)) {
                return false;
            }
            const isProgIndividual = individualProgIdSet.has(p.programmeId) || individualProgIdSet.has(p.programmeCode);
            return isProgIndividual && p.participants?.includes(chestNumber);
        }).length;
    };

    // Candidate eligibility rule evaluator
    const evaluateCandidateEligibility = (candidate: Candidate, isAlreadySelected: boolean) => {
        if (!programme) return { eligible: false, reason: 'Programme details missing' };

        // Rule 1: Section Rule
        if (programme.section !== 'general') {
            if (candidate.section !== programme.section) {
                return {
                    eligible: false,
                    reason: `Section mismatch (${candidate.section.toUpperCase()} ≠ required ${programme.section.toUpperCase()})`
                };
            }
        }

        // Rule 2: Individual limit rule
        if (isIndividualProgramme) {
            const count = getCandidateIndividualCount(
                candidate.chestNumber,
                modalMode === 'edit' && !!editingRegistration?.participants.includes(candidate.chestNumber)
            );
            if (count >= maxCandidateLimit && !isAlreadySelected) {
                return {
                    eligible: false,
                    reason: `Max individual limit reached (${count}/${maxCandidateLimit} events)`
                };
            }
        }

        // Rule 3: Max participants capacity reached in current selection
        if (!isAlreadySelected && selectedParticipants.length >= maxAllowedParticipants) {
            return {
                eligible: false,
                reason: `Maximum ${maxAllowedParticipants} participant(s) already selected`
            };
        }

        return { eligible: true, reason: '' };
    };

    // Open Modal for Adding New Team Registration
    const handleOpenAddModal = (preselectedTeamCode?: string) => {
        setModalMode('add');
        setEditingRegistration(null);
        setSelectedTeam(preselectedTeamCode || '');
        setSelectedParticipants([]);
        setRegistrationStatus('confirmed');
        setSearchTerm('');
        setModalError(null);
        setModalOpen(true);
    };

    // Open Modal for Editing Existing Registration
    const handleOpenEditModal = (reg: ProgrammeParticipant) => {
        setModalMode('edit');
        setEditingRegistration(reg);
        setSelectedTeam(reg.teamCode);
        setSelectedParticipants([...(reg.participants || [])]);
        setRegistrationStatus(reg.status === 'confirmed' ? 'confirmed' : 'registered');
        setSearchTerm('');
        setModalError(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRegistration(null);
        setSelectedTeam('');
        setSelectedParticipants([]);
        setSearchTerm('');
        setModalError(null);
    };

    // Candidates belonging to the selected team
    const teamCandidates = useMemo(() => {
        if (!selectedTeam) return [];
        return candidates.filter(c => c.team === selectedTeam || (c as any).teamCode === selectedTeam);
    }, [candidates, selectedTeam]);

    // Filter candidates: automatically strictly by programme section (unless general) and search query
    const filteredModalCandidates = useMemo(() => {
        return teamCandidates.filter(c => {
            // Auto-filter by programme section
            if (programme?.section && programme.section !== 'general') {
                if (c.section !== programme.section) {
                    return false;
                }
            }

            const matchesSearch = !searchTerm ||
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.chestNumber.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [teamCandidates, searchTerm, programme?.section]);

    // Handle toggling candidate selection
    const handleToggleCandidate = (chestNumber: string) => {
        const isSelected = selectedParticipants.includes(chestNumber);

        if (isSelected) {
            setSelectedParticipants(prev => prev.filter(cn => cn !== chestNumber));
            setModalError(null);
        } else {
            const candidate = candidates.find(c => c.chestNumber === chestNumber);
            if (!candidate) return;

            const check = evaluateCandidateEligibility(candidate, false);
            if (!check.eligible) {
                setModalError(check.reason);
                return;
            }

            if (selectedParticipants.length < maxAllowedParticipants) {
                setSelectedParticipants(prev => [...prev, chestNumber]);
                setModalError(null);
            } else {
                setModalError(`Maximum ${maxAllowedParticipants} participant(s) allowed. Please deselect someone first.`);
            }
        }
    };

    // Submit handler for Add / Edit Registration
    const handleSubmitRegistration = async () => {
        if (!programme) return;
        setModalError(null);

        // Validation 1: Team selected
        if (!selectedTeam) {
            setModalError('Please select a team.');
            return;
        }

        // Validation 2: Participant count rules
        if (selectedParticipants.length < minRequiredParticipants) {
            setModalError(`Please select at least ${minRequiredParticipants} participant(s). Currently selected: ${selectedParticipants.length}`);
            return;
        }

        if (selectedParticipants.length > maxAllowedParticipants) {
            setModalError(`Cannot exceed ${maxAllowedParticipants} participant(s). Currently selected: ${selectedParticipants.length}`);
            return;
        }

        // Validation 3: Section rule validation on all selected candidates
        if (programme.section !== 'general') {
            const invalidCandidates = selectedParticipants
                .map(cn => candidates.find(c => c.chestNumber === cn))
                .filter(c => c && c.section !== programme.section);

            if (invalidCandidates.length > 0) {
                setModalError(`Candidate(s) ${invalidCandidates.map(c => `${c?.name} (${c?.section.toUpperCase()})`).join(', ')} do not match required section ${programme.section.toUpperCase()}.`);
                return;
            }
        }

        // Validation 4: Individual limit validation
        if (isIndividualProgramme) {
            for (const chestNumber of selectedParticipants) {
                const isEditingCurrent = modalMode === 'edit' && !!editingRegistration?.participants.includes(chestNumber);
                const count = getCandidateIndividualCount(chestNumber, isEditingCurrent);
                if (count >= maxCandidateLimit) {
                    const cand = candidates.find(c => c.chestNumber === chestNumber);
                    setModalError(`Candidate ${cand?.name || chestNumber} has already reached the maximum limit of ${maxCandidateLimit} individual programmes.`);
                    return;
                }
            }
        }

        setSubmitting(true);
        try {
            if (modalMode === 'add') {
                const res = await fetch('/api/programme-participants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        programmeId: programme._id?.toString() || programmeId,
                        programmeCode: programme.code,
                        programmeName: programme.name,
                        teamCode: selectedTeam,
                        participants: selectedParticipants,
                        status: registrationStatus
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Failed to add registration');
                }

                setActionMessage({
                    type: 'success',
                    text: `Registered ${selectedParticipants.length} candidate(s) for team ${selectedTeam} successfully!`
                });
            } else {
                // Edit mode
                const res = await fetch('/api/programme-participants', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        _id: editingRegistration?._id,
                        programmeId: programme._id?.toString() || programmeId,
                        teamCode: selectedTeam,
                        participants: selectedParticipants,
                        status: registrationStatus
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Failed to update candidates');
                }

                setActionMessage({
                    type: 'success',
                    text: `Updated candidates for team ${selectedTeam} successfully!`
                });
            }

            closeModal();
            await fetchProgrammeData();
        } catch (err: any) {
            console.error('Registration save error:', err);
            setModalError(err.message || 'An error occurred while saving.');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete a registration
    const handleDeleteRegistration = async (registration: ProgrammeParticipant) => {
        const team = getTeamByCode(registration.teamCode);
        if (!confirm(`Are you sure you want to remove registration for team "${team?.name || registration.teamCode}"?\nThis will remove all assigned candidates for this programme.`)) {
            return;
        }

        setDeletingId(registration._id?.toString() || null);
        try {
            const res = await fetch(`/api/programme-participants?id=${registration._id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setActionMessage({
                    type: 'success',
                    text: `Removed registration for team ${registration.teamCode}.`
                });
                await fetchProgrammeData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete registration');
            }
        } catch (err) {
            console.error('Error deleting registration:', err);
            alert('Failed to delete registration');
        } finally {
            setDeletingId(null);
        }
    };

    // Update status directly from table
    const handleStatusChange = async (registration: ProgrammeParticipant, newStatus: 'registered' | 'confirmed' | 'withdrawn') => {
        try {
            const res = await fetch('/api/programme-participants', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: registration._id,
                    programmeId: registration.programmeId,
                    teamCode: registration.teamCode,
                    status: newStatus
                })
            });

            if (res.ok) {
                setActionMessage({
                    type: 'success',
                    text: `Status changed to ${newStatus.toUpperCase()} for team ${registration.teamCode}`
                });
                await fetchProgrammeData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'arts': return '🎨';
            case 'sports': return '⚽';
            case 'general': return '📋';
            default: return '📋';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'arts': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'sports': return 'bg-green-100 text-green-800 border-green-200';
            case 'general': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSectionColor = (section: string) => {
        switch (section) {
            case 'senior': return 'bg-red-100 text-red-800 border-red-200';
            case 'junior': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'sub-junior': return 'bg-pink-100 text-pink-800 border-pink-200';
            case 'general': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTeamByCode = (teamCode: string) => {
        return teams.find(team => team.code === teamCode);
    };

    const getCandidateByChestNumber = (chestNumber: string) => {
        return candidates.find(candidate => candidate.chestNumber === chestNumber);
    };

    // Registered team codes set for quick check
    const registeredTeamCodes = useMemo(() => {
        return new Set(registrations.map(r => r.teamCode));
    }, [registrations]);

    const isProgrammeOver = programme?.status === 'completed' || (programme as any)?.isOver === true;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading programme details...</p>
                </div>
            </div>
        );
    }

    if (error || !programme) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center bg-white p-8 rounded-2xl border shadow-sm max-w-md w-full">
                    <div className="text-rose-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Programme Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'The requested programme could not be found.'}</p>
                    <Link
                        href="/admin/programmes"
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Programmes</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Action Feedback Banner */}
            {actionMessage && (
                <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs transition-all ${
                    actionMessage.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                    <div className="flex items-center gap-2.5">
                        {actionMessage.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">{actionMessage.text}</span>
                    </div>
                    <button
                        onClick={() => setActionMessage(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border shadow-xs">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                        title="Go back"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{programme.name}</h1>
                            <span className="text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded-md font-mono font-bold tracking-wider">
                                {programme.code}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>Category: <strong className="capitalize text-gray-700">{programme.category}</strong></span>
                            <span>•</span>
                            <span>Section: <strong className="capitalize text-gray-700">{programme.section}</strong></span>
                            <span>•</span>
                            <span>Type: <strong className="capitalize text-gray-700">{programme.positionType}</strong></span>
                            <span>•</span>
                            <span>Required: <strong className="text-blue-600 font-bold">{programme.requiredParticipants}</strong> participant(s)</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                    {/* Status Pill */}
                    {isProgrammeOver ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-xs">
                            <span>🛑</span> OVER
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs">
                            <span>🟢</span> ACTIVE
                        </span>
                    )}

                    {/* Section Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSectionColor(programme.section)}`}>
                        {programme.section.toUpperCase()}
                    </span>

                    {/* Over Toggle */}
                    <button
                        onClick={handleToggleOver}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                            isProgrammeOver
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        }`}
                        title={isProgrammeOver ? "Reopen this programme" : "Mark programme as over"}
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isProgrammeOver ? 'Reopen Programme' : 'Mark as Over'}</span>
                    </button>

                    {/* Primary Button: Add Candidates */}
                    <button
                        onClick={() => handleOpenAddModal()}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>+ Add Candidates / Register Team</span>
                    </button>
                </div>
            </div>

            {/* Over Warning Notice if Programme is Over */}
            {isProgrammeOver && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl flex-shrink-0">🛑</span>
                        <div>
                            <div className="font-bold text-sm">Programme is marked as OVER / Completed</div>
                            <div className="text-xs text-amber-700">
                                Registration updates and adding candidates are currently locked. You can reopen the programme at any time to register or modify participants.
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleOver}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap self-start sm:self-auto shadow-xs active:scale-95"
                    >
                        Reopen Programme Now
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`py-3 px-1 border-b-2 font-bold text-sm transition-colors flex items-center gap-2 ${
                            activeTab === 'registrations'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Team Registrations ({registrations.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-3 px-1 border-b-2 font-bold text-sm transition-colors flex items-center gap-2 ${
                            activeTab === 'details'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>Programme Details</span>
                    </button>
                </nav>
            </div>

            {/* Content Tabs */}
            <div className="space-y-6">
                {activeTab === 'registrations' && (
                    <div className="space-y-6">
                        {/* Summary & Toolbar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border shadow-xs">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Registered Teams & Candidates</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {registrations.length} team(s) registered • Following {programme.section.toUpperCase()} section rule & individual limit
                                </p>
                            </div>

                            <button
                                onClick={() => handleOpenAddModal()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>+ Add Team Registration</span>
                            </button>
                        </div>

                        {/* Registrations List */}
                        <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
                            {registrations.length === 0 ? (
                                <div className="text-center py-16 px-4">
                                    <div className="text-gray-300 text-6xl mb-4">👥</div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Registrations Yet</h3>
                                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                                        No teams have registered candidates for this programme yet. As admin, you can directly register candidates for any team.
                                    </p>
                                    <button
                                        onClick={() => handleOpenAddModal()}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        <span>+ Add First Team Registration</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-left">
                                        <thead className="bg-gray-50/75">
                                            <tr>
                                                <th className="px-6 py-3.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Team
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Participants ({programme.requiredParticipants} required)
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Registered Date
                                                </th>
                                                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Admin Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {registrations.map((registration) => {
                                                const team = getTeamByCode(registration.teamCode);
                                                const isDeleting = deletingId === registration._id?.toString();

                                                return (
                                                    <tr key={registration._id?.toString()} className="hover:bg-gray-50/75 transition-colors">
                                                        {/* Team Column */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div
                                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold mr-3 shadow-xs"
                                                                    style={{ backgroundColor: team?.color || '#3B82F6' }}
                                                                >
                                                                    {registration.teamCode}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-gray-900">
                                                                        {team?.name || registration.teamCode}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 font-mono">
                                                                        Code: {registration.teamCode}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Participants Column */}
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1.5">
                                                                {(!registration.participants || registration.participants.length === 0) ? (
                                                                    <span className="text-xs text-rose-500 italic">No candidates assigned</span>
                                                                ) : (
                                                                    registration.participants.map((chestNumber, idx) => {
                                                                        const candidate = getCandidateByChestNumber(chestNumber);
                                                                        const indCount = isIndividualProgramme ? getCandidateIndividualCount(chestNumber) : 0;
                                                                        return (
                                                                            <div key={idx} className="flex items-center flex-wrap gap-2 text-xs">
                                                                                <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold">
                                                                                    #{chestNumber}
                                                                                </span>
                                                                                <span className="font-semibold text-gray-900">
                                                                                    {candidate?.name || 'Unknown Candidate'}
                                                                                </span>
                                                                                {candidate?.section && (
                                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${getSectionColor(candidate.section)}`}>
                                                                                        {candidate.section.toUpperCase()}
                                                                                    </span>
                                                                                )}
                                                                                {isIndividualProgramme && (
                                                                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                                        {indCount}/{maxCandidateLimit} ind. events
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Status Column with Quick Toggle */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <select
                                                                value={registration.status || 'registered'}
                                                                onChange={(e) => handleStatusChange(registration, e.target.value as any)}
                                                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                                                                    registration.status === 'confirmed'
                                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                                        : registration.status === 'registered'
                                                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                            : 'bg-rose-50 text-rose-800 border-rose-200'
                                                                }`}
                                                            >
                                                                <option value="confirmed">✅ Confirmed</option>
                                                                <option value="registered">⏳ Registered</option>
                                                                <option value="withdrawn">❌ Withdrawn</option>
                                                            </select>
                                                        </td>

                                                        {/* Registered Date */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                            {registration.createdAt ? new Date(registration.createdAt).toLocaleDateString() : 'N/A'}
                                                        </td>

                                                        {/* Admin Actions */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                                                            <button
                                                                onClick={() => handleOpenEditModal(registration)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition-colors shadow-2xs"
                                                                title="Edit candidates for this team"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                <span>Edit Candidates</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteRegistration(registration)}
                                                                disabled={isDeleting}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold transition-colors shadow-2xs disabled:opacity-50"
                                                                title="Delete this registration"
                                                            >
                                                                {isDeleting ? (
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                )}
                                                                <span>Remove</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Basic Information Card */}
                        <div className="bg-white rounded-2xl border p-6 shadow-xs">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Programme Code</label>
                                    <p className="text-base font-bold text-gray-900 font-mono">{programme.code}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Programme Name</label>
                                    <p className="text-base font-bold text-gray-900">{programme.name}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(programme.category)}`}>
                                        {getCategoryIcon(programme.category)} {programme.category.toUpperCase()}
                                    </span>
                                </div>
                                {programme.subcategory && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Subcategory</label>
                                        <p className="text-base text-gray-900 capitalize">{programme.subcategory}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Section</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getSectionColor(programme.section)}`}>
                                        {programme.section.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Position Type</label>
                                    <p className="text-base text-gray-900 capitalize">{programme.positionType}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Required Participants</label>
                                    <p className="text-base font-bold text-blue-600">{programme.requiredParticipants}</p>
                                </div>
                                {programme.maxParticipants && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Maximum Participants</label>
                                        <p className="text-base font-bold text-orange-600">{programme.maxParticipants}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                        isProgrammeOver ? 'bg-rose-100 text-rose-800' :
                                        programme.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {isProgrammeOver ? '🛑 OVER' : programme.status === 'active' ? '✅ ACTIVE' : programme.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Statistics Card */}
                        <div className="bg-white rounded-2xl border p-6 shadow-xs">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Registration Statistics</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-extrabold text-blue-600">{registrations.length}</div>
                                    <div className="text-xs font-semibold text-blue-800 mt-1">Total Teams</div>
                                </div>
                                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-extrabold text-emerald-600">
                                        {registrations.filter(r => r.status === 'confirmed').length}
                                    </div>
                                    <div className="text-xs font-semibold text-emerald-800 mt-1">Confirmed</div>
                                </div>
                                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-extrabold text-amber-600">
                                        {registrations.filter(r => r.status === 'registered').length}
                                    </div>
                                    <div className="text-xs font-semibold text-amber-800 mt-1">Pending</div>
                                </div>
                                <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-extrabold text-rose-600">
                                        {registrations.filter(r => r.status === 'withdrawn').length}
                                    </div>
                                    <div className="text-xs font-semibold text-rose-800 mt-1">Withdrawn</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Admin Add / Edit Candidates Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-blue-400" />
                                    <h3 className="font-bold text-lg">
                                        {modalMode === 'add' ? 'Register Candidates for Programme' : 'Edit Registered Candidates'}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    {programme.name} • <span className="font-mono">{programme.code}</span>
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            {/* Programme Over Warning */}
                            {isProgrammeOver && (
                                <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                        <span><strong>Programme is marked as OVER.</strong> Saving registrations will fail unless reopened.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleToggleOver}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs whitespace-nowrap"
                                    >
                                        Reopen Now
                                    </button>
                                </div>
                            )}

                            {/* Rules Summary Banner */}
                            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                                    <span>Rules & Eligibility Requirements</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                                        <span className="text-gray-500 block text-[11px]">Section Rule</span>
                                        <strong className="text-gray-900 font-semibold">
                                            {programme.section === 'general' ? 'All Sections Eligible' : `${programme.section.toUpperCase()} only`}
                                        </strong>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                                        <span className="text-gray-500 block text-[11px]">Participant Capacity</span>
                                        <strong className="text-blue-700 font-bold">
                                            {programme.requiredParticipants} required {programme.maxParticipants && programme.maxParticipants > programme.requiredParticipants ? `(Max ${programme.maxParticipants})` : ''}
                                        </strong>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                                        <span className="text-gray-500 block text-[11px]">Event Type Limit</span>
                                        <strong className="text-purple-700 font-semibold">
                                            {isIndividualProgramme ? `Individual (Max ${maxCandidateLimit}/candidate)` : 'Group Event'}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* Step 1: Team Selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    1. Select Team
                                </label>
                                {modalMode === 'edit' ? (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-xl">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs"
                                            style={{ backgroundColor: getTeamByCode(selectedTeam)?.color || '#3B82F6' }}
                                        >
                                            {selectedTeam}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">
                                                {getTeamByCode(selectedTeam)?.name || selectedTeam} ({selectedTeam})
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Editing existing registration for this team
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {teams.map(team => {
                                            const isSelected = selectedTeam === team.code;
                                            const isAlreadyReg = registeredTeamCodes.has(team.code);

                                            return (
                                                <button
                                                    key={team.code}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTeam(team.code);
                                                        setSelectedParticipants([]);
                                                        setModalError(null);
                                                    }}
                                                    className={`p-3 rounded-xl border text-left transition-all relative ${
                                                        isSelected
                                                            ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/30'
                                                            : isAlreadyReg
                                                                ? 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span
                                                            className="w-3.5 h-3.5 rounded-full inline-block flex-shrink-0"
                                                            style={{ backgroundColor: team.color || '#3B82F6' }}
                                                        />
                                                        <span className="font-bold text-xs text-gray-900 font-mono">
                                                            {team.code}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-700 font-medium truncate" title={team.name}>
                                                        {team.name}
                                                    </div>
                                                    {isAlreadyReg && (
                                                        <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded">
                                                            Registered
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {modalMode === 'add' && selectedTeam && registeredTeamCodes.has(selectedTeam) && (
                                    <div className="mt-2 text-xs bg-amber-50 text-amber-900 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between">
                                        <span>
                                            ⚠️ Team <strong>{selectedTeam}</strong> is already registered. Saving here will update or replace their existing registration.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Status Selection */}
                            <div className="flex items-center gap-4 text-xs">
                                <span className="font-bold text-gray-700 uppercase tracking-wider">Status:</span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="regStatus"
                                        value="confirmed"
                                        checked={registrationStatus === 'confirmed'}
                                        onChange={() => setRegistrationStatus('confirmed')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-semibold text-emerald-700">Confirmed (Official)</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="regStatus"
                                        value="registered"
                                        checked={registrationStatus === 'registered'}
                                        onChange={() => setRegistrationStatus('registered')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-semibold text-amber-700">Pending</span>
                                </label>
                            </div>

                            {/* Step 3: Candidate Selection (shown once team is selected) */}
                            {selectedTeam ? (
                                <div className="space-y-3 pt-2 border-t">
                                    {/* Selection Counter Bar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 text-white p-3 rounded-2xl">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                                Selected Participants:
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                selectedParticipants.length >= minRequiredParticipants && selectedParticipants.length <= maxAllowedParticipants
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-amber-400 text-slate-950'
                                            }`}>
                                                {selectedParticipants.length} / {programme.requiredParticipants} required
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-300">
                                            {selectedParticipants.length === minRequiredParticipants ? (
                                                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Requirement satisfied
                                                </span>
                                            ) : selectedParticipants.length < minRequiredParticipants ? (
                                                <span className="text-amber-300">
                                                    Select {minRequiredParticipants - selectedParticipants.length} more
                                                </span>
                                            ) : (
                                                <span className="text-rose-300">Exceeds requirement</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Selected Candidate Chips */}
                                    {selectedParticipants.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-2.5 bg-gray-50 border rounded-xl">
                                            {selectedParticipants.map(cn => {
                                                const cand = candidates.find(c => c.chestNumber === cn);
                                                return (
                                                    <span
                                                        key={cn}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 shadow-2xs"
                                                    >
                                                        <span className="font-mono text-blue-600 font-bold">#{cn}</span>
                                                        <span>{cand?.name || cn}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCandidate(cn)}
                                                            className="text-gray-400 hover:text-rose-600 p-0.5 rounded"
                                                            title="Remove candidate"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Candidate Search Bar (Auto-filtered by programme section) */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                        <div className="relative flex-1">
                                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder={`Search by chest number or name (${programme.section === 'general' ? 'all' : programme.section} section)...`}
                                                className="w-full pl-9 pr-8 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            />
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1.5 self-end sm:self-center px-1">
                                            <span>Showing:</span>
                                            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                                                {filteredModalCandidates.length}
                                            </span>
                                            <span className="capitalize font-semibold text-gray-700">
                                                {programme.section === 'general' ? 'candidates' : `${programme.section} candidates`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Candidate Selection List */}
                                    <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-100">
                                        {filteredModalCandidates.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-gray-500">
                                                No candidates found for team {selectedTeam} matching your search/filter.
                                            </div>
                                        ) : (
                                            filteredModalCandidates.map(candidate => {
                                                const isSelected = selectedParticipants.includes(candidate.chestNumber);
                                                const eligibility = evaluateCandidateEligibility(candidate, isSelected);
                                                const indCount = isIndividualProgramme
                                                    ? getCandidateIndividualCount(candidate.chestNumber, modalMode === 'edit' && !!editingRegistration?.participants.includes(candidate.chestNumber))
                                                    : 0;

                                                return (
                                                    <div
                                                        key={candidate.chestNumber}
                                                        onClick={() => {
                                                            if (isSelected || eligibility.eligible) {
                                                                handleToggleCandidate(candidate.chestNumber);
                                                            }
                                                        }}
                                                        className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-blue-50/90 hover:bg-blue-100/90'
                                                                : !eligibility.eligible
                                                                    ? 'bg-gray-50/70 opacity-60 cursor-not-allowed'
                                                                    : 'bg-white hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                                                isSelected
                                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                                    : 'border-gray-300 bg-white'
                                                            }`}>
                                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                            </div>

                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                                                                        #{candidate.chestNumber}
                                                                    </span>
                                                                    <span className="font-bold text-gray-900">
                                                                        {candidate.name}
                                                                    </span>
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${getSectionColor(candidate.section)}`}>
                                                                        {candidate.section.toUpperCase()}
                                                                    </span>
                                                                </div>

                                                                {isIndividualProgramme && (
                                                                    <div className="text-[11px] text-gray-500 mt-0.5">
                                                                        Individual programmes: <strong>{indCount}/{maxCandidateLimit}</strong>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Status / Eligibility Badges */}
                                                        <div>
                                                            {isSelected ? (
                                                                <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                                                                    <Check className="w-3 h-3" /> Selected
                                                                </span>
                                                            ) : !eligibility.eligible ? (
                                                                <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                                                                    {eligibility.reason}
                                                                </span>
                                                            ) : (
                                                                <span className="text-blue-600 font-semibold text-[11px] hover:underline">
                                                                    + Select
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border text-xs text-gray-500">
                                    Please select a team above to view and assign candidates.
                                </div>
                            )}

                            {/* Modal Error Alert */}
                            {modalError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs text-gray-500">
                                {selectedTeam && (
                                    <span>
                                        Team: <strong className="text-gray-900">{selectedTeam}</strong> • Selected: <strong className="text-blue-600">{selectedParticipants.length}</strong> / {minRequiredParticipants}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitRegistration}
                                    disabled={submitting || !selectedTeam || selectedParticipants.length < minRequiredParticipants}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                                >
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{modalMode === 'add' ? 'Confirm & Register Candidates' : 'Update Candidates'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgrammeDetails;