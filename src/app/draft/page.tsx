'use client';

import { useState, useEffect } from 'react';
import { Candidate, Team } from '@/types';
import { PublicNavbar as Navbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter as Footer } from '@/components/Navigation/PublicFooter';

export default function PublicDraftPage() {
  const [draftedCandidates, setDraftedCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [draftState, setDraftState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [stateRes, teamsRes] = await Promise.all([
        fetch('/api/draft/state'),
        fetch('/api/teams')
      ]);

      const stateData = await stateRes.json();
      const teamsData = await teamsRes.json();

      setDraftState(stateData.draftState);
      setDraftedCandidates(stateData.draftedCandidates || []);
      setTeams(teamsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load public draft data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const latestPick = draftedCandidates[0];
  const latestPickTeam = latestPick ? teams.find(t => t.code === latestPick.team) : null;
  const currentTeam = teams.find(t => t.code === draftState?.currentTurn);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col font-poppins selection:bg-blue-500/30">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        {/* <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Live Draft Board
          </h1>
          <p className="text-gray-500 text-lg md:text-2xl font-light">
            Watch as teams build their ultimate rosters live!
          </p>
        </div> */}

        {/* Latest Pick Hero Card */}
        {latestPick && latestPickTeam && (
          <div className="max-w-md mx-auto mb-20 relative group ">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-[40px] blur-xl opacity-70"></div>
            <div className="relative bg-white rounded-[40px] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col items-center border border-gray-100">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight text-center leading-tight">
                {latestPick.name}
              </h2>
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: latestPickTeam.color }}></span>
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: latestPickTeam.color }}></span>
                </div>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                  Drafted by {latestPickTeam.name}
                </span>
              </div>

              <div className="w-full aspect-square md:aspect-[4/4] rounded-[32px] overflow-hidden bg-gray-50 mb-6 relative shadow-inner">
                {latestPick.profileImage ? (
                  <img src={latestPick.profileImage} alt={latestPick.name} className="w-full h-full object-cover object-center" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <span className="text-9xl font-black">{latestPick.name.charAt(0)}</span>
                  </div>
                )}
              </div>

              <div className="w-full flex justify-between items-center bg-gray-50/50 p-2 rounded-full border border-gray-100">
                <div className="flex items-center space-x-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                    {latestPick.profileImage ? (
                      <img src={latestPick.profileImage} alt={latestPick.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                        {latestPick.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 leading-none">#{latestPick.chestNumber}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-wider">{latestPick.section}</div>
                  </div>
                </div>

                <div
                  className="px-6 py-3 rounded-full text-white font-bold shadow-md text-sm transition hover:scale-105"
                  style={{ backgroundColor: latestPickTeam.color }}
                >
                  Welcome!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Turn Banner */}
        {draftState?.status === 'in_progress' ? (
          <div className="max-w-3xl mx-auto mb-16">
            <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-xl p-8 text-center">
              <div className="relative z-10">
                <span className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-2 block">
                  Round {draftState.round} • Pick {draftState.pickNumber}
                </span>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">On The Clock:</h2>
                <div
                  className="text-5xl md:text-6xl font-black mb-4 py-2 drop-shadow-sm"
                  style={{ color: currentTeam?.color || '#333' }}
                >
                  {currentTeam?.name || draftState.currentTurn}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto mb-16 text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-700">
              The draft hasn't started yet or has concluded.
            </h2>
          </div>
        )}

        {/* Teams Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teams.map(team => {
            const teamCandidates = draftedCandidates.filter(c => c.team === team.code);
            const isTurn = draftState?.currentTurn === team.code;

            return (
              <div
                key={team.code}
                className={`relative rounded-3xl overflow-hidden bg-white transition-all duration-500 ${isTurn ? 'transform scale-[1.02] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]' : 'hover:-translate-y-1 shadow-lg'
                  }`}
                style={{
                  border: `2px solid ${isTurn ? team.color : '#e2e8f0'}`,
                }}
              >
                {/* Header */}
                <div
                  className="p-6 border-b border-gray-100 relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{ backgroundColor: team.color }}
                  ></div>
                  <div className="relative z-10 flex justify-between items-center">
                    <h3 className="text-2xl font-bold" style={{ color: team.color }}>
                      {team.name}
                    </h3>
                    <span className="bg-white px-3 py-1 rounded-full text-sm font-bold border border-gray-200 text-gray-700 shadow-sm">
                      {teamCandidates.length}
                    </span>
                  </div>
                </div>

                {/* Candidate List */}
                <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar bg-gray-50/50">
                  {teamCandidates.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 font-medium italic">
                      No picks yet
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {teamCandidates.map((c, i) => (
                        <li
                          key={c._id?.toString() || i}
                          className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-gray-200 transition"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                              {c.profileImage ? (
                                <img src={c.profileImage} alt={c.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                                  {c.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 group-hover:text-gray-900 transition line-clamp-1">
                                {c.name}
                              </div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">
                                #{c.chestNumber}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 rounded-md text-gray-600 border border-gray-200 ml-2">
                            {c.section}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
