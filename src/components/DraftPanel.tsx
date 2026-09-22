'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Candidate, Team } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export function DraftPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTeam = searchParams.get('team');
  const activeTeamCode = urlTeam || user?.team?.code;

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [draftState, setDraftState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Define section order
  const sectionPriority: Record<string, number> = {
    'senior': 1,
    'junior': 2,
    'sub-junior': 3
  };

  const [customOrder, setCustomOrder] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, teamsRes, stateRes] = await Promise.all([
        fetch('/api/draft/candidates'),
        fetch('/api/teams'),
        fetch('/api/draft/state')
      ]);

      const [candidatesData, teamsData, stateData] = await Promise.all([
        candidatesRes.json(),
        teamsRes.json(),
        stateRes.json()
      ]);

      // Filter unassigned candidates and sort by section (Senior > Junior > Sub Junior)
      const unassigned = candidatesData || [];
      unassigned.sort((a: Candidate, b: Candidate) => {
        const orderA = sectionPriority[a.section] || 99;
        const orderB = sectionPriority[b.section] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });

      setCandidates(unassigned);
      setTeams(teamsData);
      setDraftState(stateData.draftState);

      if (customOrder.length === 0 && teamsData.length > 0) {
        const uniqueTeams = Array.from(new Set(teamsData.map((t: Team) => t.code))) as string[];
        setCustomOrder(uniqueTeams.sort());
      }
    } catch (err) {
      console.error('Error fetching draft data:', err);
      setError('Failed to load draft state');
    } finally {
      setLoading(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...customOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setCustomOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === customOrder.length - 1) return;
    const newOrder = [...customOrder];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setCustomOrder(newOrder);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handlePickCandidate = async (candidateId: string) => {
    if (!activeTeamCode) {
      alert("You are not assigned to a team.");
      return;
    }

    try {
      const response = await fetch('/api/draft/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          teamCode: activeTeamCode
        })
      });

      const data = await response.json();
      if (data.success) {
        // Optimistically update
        setCandidates(candidates.filter(c => c._id !== candidateId));
        setDraftState(data.draftState);
      } else {
        alert(data.message || 'Failed to pick candidate');
      }
    } catch (err) {
      console.error('Pick error:', err);
      alert('An error occurred while making your pick.');
    }
  };

  const startDraft = async () => {
    try {
      const response = await fetch('/api/draft/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customOrder })
      });
      const data = await response.json();
      if (data.success) {
        setDraftState(data.draftState);
      } else {
        alert(data.message || 'Failed to initialize draft');
      }
    } catch (err) {
      console.error('Init error:', err);
      alert('Error initializing draft');
    }
  };

  if (loading && !draftState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const canPick = !!activeTeamCode;
  const currentTeam = teams.find(t => t.code === draftState?.currentTurn);

  const filteredCandidates = candidates.filter(candidate => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      candidate.name?.toLowerCase().includes(query) ||
      candidate.chestNumber?.toLowerCase().includes(query) ||
      candidate.section?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Breadcrumb pageName="Team Member Draft" />

      <div className="space-y-6">

        <div className={`border rounded-lg p-6 ${canPick ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Team Draft (Manual Selection)
              </h2>
              <p className="text-lg text-gray-700">
                You can freely select candidates for your team below.
              </p>
            </div>



            {user?.userType === 'admin' && draftState?.status !== 'in_progress' && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 w-full">
                <h3 className="font-bold text-gray-800 mb-3">Set Draft Turn Order</h3>
                <div className="space-y-2 mb-4">
                  {customOrder.map((teamCode, idx) => (
                    <div key={teamCode} className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-md shadow-sm">
                      <span className="font-semibold text-gray-700">
                        <span className="inline-block w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-center text-sm mr-2">{idx + 1}</span>
                        {teams.find(t => t.code === teamCode)?.name || teamCode}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded text-gray-600 text-xs font-bold"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveDown(idx)}
                          disabled={idx === customOrder.length - 1}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded text-gray-600 text-xs font-bold"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={startDraft}
                  className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  Start Draft
                </button>
              </div>
            )}

            {canPick && (
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold">
                You can select candidates.
              </div>
            )}
          </div>
        </div>

        {/* Candidates List */}
        <ShowcaseSection title="Available Candidates">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, chest number, or section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-1/2 md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Section</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Chest No</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Name</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(candidate => (
                  <tr key={candidate._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 capitalize font-semibold text-purple-700">
                      {candidate.section}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {candidate.chestNumber}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {candidate.name}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handlePickCandidate(candidate._id as string)}
                        disabled={!canPick}
                        className={`px-4 py-1.5 rounded-lg font-medium text-sm transition ${canPick
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {canPick ? 'Select' : 'Wait Turn'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCandidates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      {candidates.length === 0 ? "No available candidates." : "No candidates match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ShowcaseSection>
      </div>
    </>
  );
}
