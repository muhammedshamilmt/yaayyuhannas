'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { FestivalInfo, SectionLimits } from "@/types";
import { DEFAULT_SECTION_LIMITS } from "@/lib/participationRules";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingFestival, setSavingFestival] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: 'Wattaqa Arts Festival 2K25',
    year: '2025',
    startDate: '2025-03-10',
    endDate: '2025-03-16',
    venue: 'Wattaqa School Campus',
    description: 'Annual arts and sports festival celebrating creativity, talent, and teamwork among students.',
    minCandidateParticipation: 1,
    maxCandidateParticipation: 3,
    minCandidateArtsParticipation: 1,
    maxCandidateArtsParticipation: 3,
    minCandidateSportsParticipation: 1,
    maxCandidateSportsParticipation: 4,
  });

  const [sectionLimits, setSectionLimits] = useState<SectionLimits>(DEFAULT_SECTION_LIMITS);

  useEffect(() => {
    async function loadFestivalInfo() {
      try {
        const res = await fetch('/api/festival-info');
        if (res.ok) {
          const data: FestivalInfo = await res.json();
          setFormData({
            name: data.name || 'Wattaqa Arts Festival 2K25',
            year: data.year || '2025',
            startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '2025-03-10',
            endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '2025-03-16',
            venue: data.venue || 'Wattaqa School Campus',
            description: data.description || '',
            minCandidateParticipation: data.minCandidateParticipation ?? 2,
            maxCandidateParticipation: data.maxCandidateParticipation ?? 7,
            minCandidateArtsParticipation: data.minCandidateArtsParticipation ?? 2,
            maxCandidateArtsParticipation: data.maxCandidateArtsParticipation ?? 7,
            minCandidateSportsParticipation: data.minCandidateSportsParticipation ?? 1,
            maxCandidateSportsParticipation: data.maxCandidateSportsParticipation ?? 4,
          });

          if (data.sectionLimits) {
            setSectionLimits({
              senior: {
                artsStage: {
                  min: data.sectionLimits.senior?.artsStage?.min ?? DEFAULT_SECTION_LIMITS.senior.artsStage.min,
                  max: data.sectionLimits.senior?.artsStage?.max ?? DEFAULT_SECTION_LIMITS.senior.artsStage.max
                },
                artsNonStage: {
                  min: data.sectionLimits.senior?.artsNonStage?.min ?? DEFAULT_SECTION_LIMITS.senior.artsNonStage.min,
                  max: data.sectionLimits.senior?.artsNonStage?.max ?? DEFAULT_SECTION_LIMITS.senior.artsNonStage.max
                },
                sports: {
                  min: data.sectionLimits.senior?.sports?.min ?? DEFAULT_SECTION_LIMITS.senior.sports.min,
                  max: data.sectionLimits.senior?.sports?.max ?? DEFAULT_SECTION_LIMITS.senior.sports.max
                }
              },
              junior: {
                artsStage: {
                  min: data.sectionLimits.junior?.artsStage?.min ?? DEFAULT_SECTION_LIMITS.junior.artsStage.min,
                  max: data.sectionLimits.junior?.artsStage?.max ?? DEFAULT_SECTION_LIMITS.junior.artsStage.max
                },
                artsNonStage: {
                  min: data.sectionLimits.junior?.artsNonStage?.min ?? DEFAULT_SECTION_LIMITS.junior.artsNonStage.min,
                  max: data.sectionLimits.junior?.artsNonStage?.max ?? DEFAULT_SECTION_LIMITS.junior.artsNonStage.max
                },
                sports: {
                  min: data.sectionLimits.junior?.sports?.min ?? DEFAULT_SECTION_LIMITS.junior.sports.min,
                  max: data.sectionLimits.junior?.sports?.max ?? DEFAULT_SECTION_LIMITS.junior.sports.max
                },
                maxSongs: data.sectionLimits.junior?.maxSongs ?? DEFAULT_SECTION_LIMITS.junior.maxSongs ?? 4
              },
              'sub-junior': {
                artsStage: {
                  min: data.sectionLimits['sub-junior']?.artsStage?.min ?? DEFAULT_SECTION_LIMITS['sub-junior'].artsStage.min,
                  max: data.sectionLimits['sub-junior']?.artsStage?.max ?? DEFAULT_SECTION_LIMITS['sub-junior'].artsStage.max
                },
                artsNonStage: {
                  min: data.sectionLimits['sub-junior']?.artsNonStage?.min ?? DEFAULT_SECTION_LIMITS['sub-junior'].artsNonStage.min,
                  max: data.sectionLimits['sub-junior']?.artsNonStage?.max ?? DEFAULT_SECTION_LIMITS['sub-junior'].artsNonStage.max
                },
                sports: {
                  min: data.sectionLimits['sub-junior']?.sports?.min ?? DEFAULT_SECTION_LIMITS['sub-junior'].sports.min,
                  max: data.sectionLimits['sub-junior']?.sports?.max ?? DEFAULT_SECTION_LIMITS['sub-junior'].sports.max
                }
              }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching festival info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFestivalInfo();
  }, []);

  const handleFestivalSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate section limits
    const sections: ('senior' | 'junior' | 'sub-junior')[] = ['senior', 'junior', 'sub-junior'];
    for (const sec of sections) {
      const cfg = sectionLimits[sec];
      if (cfg.artsStage.max < cfg.artsStage.min) {
        alert(`${sec.toUpperCase()}: Maximum Arts Stage cannot be less than minimum.`);
        return;
      }
      if (cfg.artsNonStage.max < cfg.artsNonStage.min) {
        alert(`${sec.toUpperCase()}: Maximum Arts Non-Stage cannot be less than minimum.`);
        return;
      }
      if (cfg.sports.max < cfg.sports.min) {
        alert(`${sec.toUpperCase()}: Maximum Sports cannot be less than minimum.`);
        return;
      }
    }

    setSavingFestival(true);
    setSaveSuccess(null);
    try {
      const payload = {
        ...formData,
        sectionLimits,
        minCandidateArtsParticipation: sectionLimits.senior.artsStage.min,
        maxCandidateArtsParticipation: sectionLimits.senior.artsStage.max,
        minCandidateSportsParticipation: sectionLimits.senior.sports.min,
        maxCandidateSportsParticipation: sectionLimits.senior.sports.max,
        minCandidateParticipation: sectionLimits.senior.artsStage.min,
        maxCandidateParticipation: sectionLimits.senior.artsStage.max,
      };

      const res = await fetch('/api/festival-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess('Festival settings & section-specific participation rules saved successfully!');
        setTimeout(() => setSaveSuccess(null), 4000);
      } else {
        alert('Failed to save festival settings.');
      }
    } catch (err) {
      console.error('Error updating festival info:', err);
      alert('Error updating festival info.');
    } finally {
      setSavingFestival(false);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Settings" />

      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✅</span>
            <span className="font-semibold text-sm">{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="text-green-600 hover:text-green-800 text-sm font-bold">✕</button>
        </div>
      )}

      <div className="space-y-6">
        {/* Candidate Participation Rules by Section */}
        <ShowcaseSection title="Candidate Participation Rules (Senior, Junior & Sub-Junior)">
          <form onSubmit={handleFestivalSave} className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                <span>🎯</span> Dynamic Section-Wise Participation Limits & Junior Song Rule
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Configure minimum and maximum individual programme limits for each student section (<strong>Senior</strong>, <strong>Junior</strong>, and <strong>Sub-Junior</strong>).
                Includes the special <strong>Junior Song Participation Rule</strong> (max 4 of 7 specified song events, excluding Poem Recitation & Malappattu).
                Limits are enforced in real-time across candidate registration modals, team submissions, and validation APIs.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Senior Category Card */}
              <div className="p-5 bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">
                        🎓
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-indigo-950">Senior Category</h3>
                        <p className="text-xs text-indigo-600">Senior student event limits</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-4">
                    {/* Stage Programmes */}
                    <div className="bg-white p-3 rounded-xl border border-indigo-100">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Stage Programmes
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sectionLimits.senior.artsStage.min}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              senior: {
                                ...prev.senior,
                                artsStage: { ...prev.senior.artsStage, min: parseInt(e.target.value, 10) || 0 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Max:</span>
                          <input
                            type="number"
                            min={sectionLimits.senior.artsStage.min}
                            max="50"
                            value={sectionLimits.senior.artsStage.max}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              senior: {
                                ...prev.senior,
                                artsStage: { ...prev.senior.artsStage, max: parseInt(e.target.value, 10) || 1 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Non-Stage Programmes */}
                    <div className="bg-white p-3 rounded-xl border border-indigo-100">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Non-Stage Programmes
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sectionLimits.senior.artsNonStage.min}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              senior: {
                                ...prev.senior,
                                artsNonStage: { ...prev.senior.artsNonStage, min: parseInt(e.target.value, 10) || 0 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Max:</span>
                          <input
                            type="number"
                            min={sectionLimits.senior.artsNonStage.min}
                            max="50"
                            value={sectionLimits.senior.artsNonStage.max}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              senior: {
                                ...prev.senior,
                                artsNonStage: { ...prev.senior.artsNonStage, max: parseInt(e.target.value, 10) || 1 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sports */}
                    <div className="bg-white p-3 rounded-xl border border-indigo-100">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Sports Events
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sectionLimits.senior.sports.min}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              senior: {
                                ...prev.senior,
                                sports: { ...prev.senior.sports, min: parseInt(e.target.value, 10) || 0 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Max:</span>
                          <input
                            type="number"
                            min={sectionLimits.senior.sports.min}
                            max="50"
                            value={sectionLimits.senior.sports.max}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              senior: {
                                ...prev.senior,
                                sports: { ...prev.senior.sports, max: parseInt(e.target.value, 10) || 1 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-indigo-700 bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-100 font-medium">
                  Summary: Stage ({sectionLimits.senior.artsStage.min}–{sectionLimits.senior.artsStage.max}) • Non-Stage ({sectionLimits.senior.artsNonStage.min}–{sectionLimits.senior.artsNonStage.max}) • Sports ({sectionLimits.senior.sports.min}–{sectionLimits.senior.sports.max})
                </div>
              </div>

              {/* Junior Category Card */}
              <div className="p-5 bg-gradient-to-br from-amber-50/60 to-white border border-amber-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg">
                        🥈
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-amber-950">Junior Category</h3>
                        <p className="text-xs text-amber-700">Junior event limits & Song Rule</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-4">
                    {/* Stage Programmes */}
                    <div className="bg-white p-3 rounded-xl border border-amber-100">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Stage Programmes
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sectionLimits.junior.artsStage.min}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              junior: {
                                ...prev.junior,
                                artsStage: { ...prev.junior.artsStage, min: parseInt(e.target.value, 10) || 0 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Max:</span>
                          <input
                            type="number"
                            min={sectionLimits.junior.artsStage.min}
                            max="50"
                            value={sectionLimits.junior.artsStage.max}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              junior: {
                                ...prev.junior,
                                artsStage: { ...prev.junior.artsStage, max: parseInt(e.target.value, 10) || 1 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                      </div>

                      {/* Song Special Rule */}
                      <div className="mt-3 pt-2.5 border-t border-amber-100">
                        <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <span>🎤</span> Song Rule: Max Songs (out of 7)
                        </label>
                        <p className="text-[10px] text-amber-700 mb-1.5 leading-snug">
                          A participant may take part in up to 4 out of the 7 specified Song Programmes. (Poem Recitation & Malappatt are excluded).
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="7"
                            value={sectionLimits.junior.maxSongs ?? 4}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              junior: {
                                ...prev.junior,
                                maxSongs: parseInt(e.target.value, 10) || 4
                              }
                            }))}
                            className="w-24 px-3 py-1.5 text-sm font-bold border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-800"
                            required
                          />
                          <span className="text-xs text-amber-800 font-medium">max song events</span>
                        </div>
                      </div>
                    </div>

                    {/* Non-Stage Programmes */}
                    <div className="bg-white p-3 rounded-xl border border-amber-100">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Non-Stage Programmes
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sectionLimits.junior.artsNonStage.min}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              junior: {
                                ...prev.junior,
                                artsNonStage: { ...prev.junior.artsNonStage, min: parseInt(e.target.value, 10) || 0 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Max:</span>
                          <input
                            type="number"
                            min={sectionLimits.junior.artsNonStage.min}
                            max="50"
                            value={sectionLimits.junior.artsNonStage.max}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              junior: {
                                ...prev.junior,
                                artsNonStage: { ...prev.junior.artsNonStage, max: parseInt(e.target.value, 10) || 1 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sports */}
                    <div className="bg-white p-3 rounded-xl border border-amber-100">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Sports Events
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sectionLimits.junior.sports.min}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              junior: {
                                ...prev.junior,
                                sports: { ...prev.junior.sports, min: parseInt(e.target.value, 10) || 0 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Max:</span>
                          <input
                            type="number"
                            min={sectionLimits.junior.sports.min}
                            max="50"
                            value={sectionLimits.junior.sports.max}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              junior: {
                                ...prev.junior,
                                sports: { ...prev.junior.sports, max: parseInt(e.target.value, 10) || 1 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-lg border border-amber-100 font-medium">
                  Summary: Stage ({sectionLimits.junior.artsStage.min}–{sectionLimits.junior.artsStage.max}) [🎤 {sectionLimits.junior.maxSongs ?? 4} Songs] • Non-Stage ({sectionLimits.junior.artsNonStage.min}–{sectionLimits.junior.artsNonStage.max}) • Sports ({sectionLimits.junior.sports.min}–{sectionLimits.junior.sports.max})
                </div>
              </div>

              {/* Sub-Junior Category Card */}
              <div className="p-5 bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
                        🥉
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-emerald-950">Sub-Junior Category</h3>
                        <p className="text-xs text-emerald-700">Sub-Junior student event limits</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-4">
                    {/* Stage Programmes */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-100">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Stage Programmes
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sectionLimits['sub-junior'].artsStage.min}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              'sub-junior': {
                                ...prev['sub-junior'],
                                artsStage: { ...prev['sub-junior'].artsStage, min: parseInt(e.target.value, 10) || 0 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Max:</span>
                          <input
                            type="number"
                            min={sectionLimits['sub-junior'].artsStage.min}
                            max="50"
                            value={sectionLimits['sub-junior'].artsStage.max}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              'sub-junior': {
                                ...prev['sub-junior'],
                                artsStage: { ...prev['sub-junior'].artsStage, max: parseInt(e.target.value, 10) || 1 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Non-Stage Programmes */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-100">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Non-Stage Programmes
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sectionLimits['sub-junior'].artsNonStage.min}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              'sub-junior': {
                                ...prev['sub-junior'],
                                artsNonStage: { ...prev['sub-junior'].artsNonStage, min: parseInt(e.target.value, 10) || 0 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Max:</span>
                          <input
                            type="number"
                            min={sectionLimits['sub-junior'].artsNonStage.min}
                            max="50"
                            value={sectionLimits['sub-junior'].artsNonStage.max}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              'sub-junior': {
                                ...prev['sub-junior'],
                                artsNonStage: { ...prev['sub-junior'].artsNonStage, max: parseInt(e.target.value, 10) || 1 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sports */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-100">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Sports Events
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Min:</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sectionLimits['sub-junior'].sports.min}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              'sub-junior': {
                                ...prev['sub-junior'],
                                sports: { ...prev['sub-junior'].sports, min: parseInt(e.target.value, 10) || 0 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium">Max:</span>
                          <input
                            type="number"
                            min={sectionLimits['sub-junior'].sports.min}
                            max="50"
                            value={sectionLimits['sub-junior'].sports.max}
                            onChange={(e) => setSectionLimits(prev => ({
                              ...prev,
                              'sub-junior': {
                                ...prev['sub-junior'],
                                sports: { ...prev['sub-junior'].sports, max: parseInt(e.target.value, 10) || 1 }
                              }
                            }))}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-100 font-medium">
                  Summary: Stage ({sectionLimits['sub-junior'].artsStage.min}–{sectionLimits['sub-junior'].artsStage.max}) • Non-Stage ({sectionLimits['sub-junior'].artsNonStage.min}–{sectionLimits['sub-junior'].artsNonStage.max}) • Sports ({sectionLimits['sub-junior'].sports.min}–{sectionLimits['sub-junior'].sports.max})
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs text-gray-500">
                Changes will be saved and immediately applied to all registration validations, team dashboards, and eligibility checking.
              </div>
              <button
                type="submit"
                disabled={savingFestival}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 shadow-sm flex items-center gap-2"
              >
                {savingFestival ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Saving Rules...</span>
                  </>
                ) : (
                  <span>Save Participation Rules</span>
                )}
              </button>
            </div>
          </form>
        </ShowcaseSection>

        {/* Festival Settings */}
        <ShowcaseSection title="Festival Settings">
          <form onSubmit={handleFestivalSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Festival Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Festival Year
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Festival Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
              />
            </div>

            <button
              type="submit"
              disabled={savingFestival}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Save Festival Settings
            </button>
          </form>
        </ShowcaseSection>

        {/* Team Management Settings */}
        <ShowcaseSection title="Team Management Settings">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Team Portal Access</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-gray-700 font-bold text-sm">S</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Team Sumud Portal</p>
                      <p className="text-sm text-gray-600">Access to team dashboard and submissions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-gray-700 font-bold text-sm">A</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Team Aqsa Portal</p>
                      <p className="text-sm text-gray-600">Access to team dashboard and submissions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-gray-700 font-bold text-sm">I</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Team Inthifada Portal</p>
                      <p className="text-sm text-gray-600">Access to team dashboard and submissions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Portal Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Team Registration</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Event Submissions</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Results Viewing</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Team Rankings</span>
                  </label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Schedule Access</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Gallery Upload</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Team Chat</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </ShowcaseSection>
      </div>
    </>
  );
}