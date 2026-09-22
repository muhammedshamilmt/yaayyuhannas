"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Programme, ProgrammeParticipant, Team, Candidate } from '@/types';
import Link from 'next/link';

interface ProgrammeDetailsProps { }

const ProgrammeDetails: React.FC<ProgrammeDetailsProps> = () => {
    const params = useParams();
    const router = useRouter();
    const programmeId = params.id as string;

    const [programme, setProgramme] = useState<Programme | null>(null);
    const [registrations, setRegistrations] = useState<ProgrammeParticipant[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'registrations'>('details');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (programmeId) {
            fetchProgrammeData();
        }
    }, [programmeId]);

    const fetchProgrammeData = async () => {
        try {
            setLoading(true);

            // Fetch programme details
            const programmeResponse = await fetch(`/api/programmes?id=${programmeId}`);
            if (!programmeResponse.ok) {
                throw new Error('Programme not found');
            }
            const programmeData = await programmeResponse.json();
            setProgramme(programmeData);

            // Fetch registrations for this programme
            const registrationsResponse = await fetch(`/api/programme-participants?programmeId=${programmeId}`);
            if (registrationsResponse.ok) {
                const registrationsData = await registrationsResponse.json();
                setRegistrations(registrationsData);
            }

            // Fetch teams
            const teamsResponse = await fetch('/api/teams');
            if (teamsResponse.ok) {
                const teamsData = await teamsResponse.json();
                setTeams(teamsData);
            }

            // Fetch candidates
            const candidatesResponse = await fetch('/api/candidates');
            if (candidatesResponse.ok) {
                const candidatesData = await candidatesResponse.json();
                setCandidates(candidatesData);
            }

        } catch (error: any) {
            console.error('Error fetching programme data:', error);
            setError(error.message || 'Failed to load programme data');
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading programme details...</p>
                </div>
            </div>
        );
    }

    if (error || !programme) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Programme Not Found</h1>
                    <p className="text-gray-600 mb-4">{error || 'The requested programme could not be found.'}</p>
                    <Link
                        href="/admin/programmes"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Back to Programmes
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{programme.name}</h1>
                        <p className="text-sm text-gray-500">Programme Code: {programme.code}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(programme.category)}`}>
                        {getCategoryIcon(programme.category)} {programme.category.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSectionColor(programme.section)}`}>
                        {programme.section.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        📋 Programme Details
                    </button>
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'registrations'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        👥 Registrations ({registrations.length})
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Basic Information Card */}
                        <div className="bg-gray-50 rounded-lg border p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Programme Code</label>
                                    <p className="text-lg font-semibold text-gray-900">{programme.code}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Programme Name</label>
                                    <p className="text-lg font-semibold text-gray-900">{programme.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(programme.category)}`}>
                                        {getCategoryIcon(programme.category)} {programme.category.toUpperCase()}
                                    </span>
                                </div>
                                {programme.subcategory && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Subcategory</label>
                                        <p className="text-lg text-gray-900 capitalize">{programme.subcategory}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Section</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSectionColor(programme.section)}`}>
                                        {programme.section.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Position Type</label>
                                    <p className="text-lg text-gray-900 capitalize">{programme.positionType}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Required Participants</label>
                                    <p className="text-lg font-semibold text-blue-600">{programme.requiredParticipants}</p>
                                </div>
                                {programme.maxParticipants && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Maximum Participants</label>
                                        <p className="text-lg font-semibold text-orange-600">{programme.maxParticipants}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${programme.status === 'active' ? 'bg-green-100 text-green-800' :
                                        programme.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {programme.status === 'active' ? '✅' : programme.status === 'completed' ? '🏁' : '⏸️'} {programme.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Statistics Card */}
                        <div className="bg-gray-50 rounded-lg border p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Statistics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">{registrations.length}</div>
                                    <div className="text-sm text-gray-500">Total Registrations</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {registrations.filter(r => r.status === 'confirmed').length}
                                    </div>
                                    <div className="text-sm text-gray-500">Confirmed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-600">
                                        {registrations.filter(r => r.status === 'registered').length}
                                    </div>
                                    <div className="text-sm text-gray-500">Pending</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-600">
                                        {registrations.filter(r => r.status === 'withdrawn').length}
                                    </div>
                                    <div className="text-sm text-gray-500">Withdrawn</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'registrations' && (
                    <div className="space-y-6">
                        {/* Registrations List */}
                        <div className="bg-gray-50 rounded-lg border">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Programme Registrations</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {registrations.length} team{registrations.length !== 1 ? 's' : ''} registered for this programme
                                </p>
                            </div>

                            {registrations.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">📝</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Registrations Yet</h3>
                                    <p className="text-gray-500">No teams have registered for this programme yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Team
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Participants
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Registered Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {registrations.map((registration) => {
                                                const team = getTeamByCode(registration.teamCode);
                                                return (
                                                    <tr key={registration._id?.toString()} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div
                                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                                                                    style={{ backgroundColor: team?.color || '#6B7280' }}
                                                                >
                                                                    {registration.teamCode}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {team?.name || registration.teamCode}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {team?.description || 'Team'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                {registration.participants.map((chestNumber, index) => {
                                                                    const candidate = getCandidateByChestNumber(chestNumber);
                                                                    return (
                                                                        <div key={index} className="flex items-center text-sm">
                                                                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono mr-2">
                                                                                {chestNumber}
                                                                            </span>
                                                                            <span className="text-gray-900">
                                                                                {candidate?.name || 'Unknown Candidate'}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                                registration.status === 'registered' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                {registration.status === 'confirmed' ? '✅' :
                                                                    registration.status === 'registered' ? '⏳' : '❌'} {registration.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {registration.createdAt ? new Date(registration.createdAt).toLocaleDateString() : 'N/A'}
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
            </div>
        </div>
    );
};

export default ProgrammeDetails;