'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { FestivalInfo } from "@/types";

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
    minCandidateSportsParticipation: 0,
    maxCandidateSportsParticipation: 3,
  });

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
            minCandidateParticipation: data.minCandidateParticipation ?? 1,
            maxCandidateParticipation: data.maxCandidateParticipation ?? 3,
            minCandidateArtsParticipation: data.minCandidateArtsParticipation ?? data.minCandidateParticipation ?? 1,
            maxCandidateArtsParticipation: data.maxCandidateArtsParticipation ?? data.maxCandidateParticipation ?? 3,
            minCandidateSportsParticipation: data.minCandidateSportsParticipation ?? 0,
            maxCandidateSportsParticipation: data.maxCandidateSportsParticipation ?? data.maxCandidateParticipation ?? 3,
          });
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
    if (formData.minCandidateArtsParticipation < 0) {
      alert('Minimum Arts participation cannot be negative.');
      return;
    }
    if (formData.maxCandidateArtsParticipation < formData.minCandidateArtsParticipation) {
      alert('Maximum Arts participation cannot be less than minimum Arts participation.');
      return;
    }
    if (formData.minCandidateSportsParticipation < 0) {
      alert('Minimum Sports participation cannot be negative.');
      return;
    }
    if (formData.maxCandidateSportsParticipation < formData.minCandidateSportsParticipation) {
      alert('Maximum Sports participation cannot be less than minimum Sports participation.');
      return;
    }

    setSavingFestival(true);
    setSaveSuccess(null);
    try {
      const payload = {
        ...formData,
        // Keep overall min/max synced for backward compatibility
        minCandidateParticipation: formData.minCandidateArtsParticipation,
        maxCandidateParticipation: formData.maxCandidateArtsParticipation,
      };

      const res = await fetch('/api/festival-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess('Festival settings & participation rules saved successfully!');
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
        {/* Candidate Participation Rules */}
        <ShowcaseSection title="Candidate Participation Rules (Arts & Sports)">
          <form onSubmit={handleFestivalSave} className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                <span>🎯</span> Category-Specific Programme Limits & Team Eligibility Engine
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Configure minimum and maximum <strong>individual</strong> programme limits independently for <strong>Arts</strong> and <strong>Sports</strong>.
                Teams with any student falling below the minimum requirements will automatically be flagged as <strong>Not Eligible</strong> in the Admin Panel. Candidates are strictly blocked from registering in more individual programmes than their category maximum. (Note: Group items do not count towards individual limits).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Arts Participation Rules Card */}
              <div className="p-5 bg-gradient-to-br from-purple-50/50 to-white border border-purple-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">
                      🎭
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-purple-950">Arts Programmes</h3>
                      <p className="text-xs text-purple-700">Individual rules for arts & cultural events</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
                    {formData.minCandidateArtsParticipation} Min / {formData.maxCandidateArtsParticipation} Max
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Minimum Arts Programmes *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Minimum individual arts programmes each candidate must take for team eligibility.
                    </p>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.minCandidateArtsParticipation}
                        onChange={(e) => setFormData(prev => ({ ...prev, minCandidateArtsParticipation: parseInt(e.target.value, 10) || 0 }))}
                        className="w-32 px-3.5 py-2 text-base font-bold border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-800"
                        required
                      />
                      <span className="text-xs font-medium text-gray-600">Arts prog minimum</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Maximum Arts Programmes *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Maximum individual arts programmes allowed per candidate.
                    </p>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min={formData.minCandidateArtsParticipation}
                        max="100"
                        value={formData.maxCandidateArtsParticipation}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxCandidateArtsParticipation: parseInt(e.target.value, 10) || 1 }))}
                        className="w-32 px-3.5 py-2 text-base font-bold border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-800"
                        required
                      />
                      <span className="text-xs font-medium text-gray-600">Arts prog max limit</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-purple-700 bg-purple-50/80 p-2.5 rounded-lg border border-purple-100">
                  Current: <strong>{formData.minCandidateArtsParticipation}</strong> to <strong>{formData.maxCandidateArtsParticipation}</strong> Arts individual programme(s) per student.
                </div>
              </div>

              {/* Sports Participation Rules Card */}
              <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
                      ⚽
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-emerald-950">Sports Programmes</h3>
                      <p className="text-xs text-emerald-700">Individual rules for sports & athletics</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    {formData.minCandidateSportsParticipation} Min / {formData.maxCandidateSportsParticipation} Max
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Minimum Sports Programmes *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Minimum individual sports events required per student (set 0 if sports participation is optional).
                    </p>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.minCandidateSportsParticipation}
                        onChange={(e) => setFormData(prev => ({ ...prev, minCandidateSportsParticipation: parseInt(e.target.value, 10) || 0 }))}
                        className="w-32 px-3.5 py-2 text-base font-bold border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-800"
                        required
                      />
                      <span className="text-xs font-medium text-gray-600">Sports prog minimum</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Maximum Sports Programmes *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Maximum individual sports events allowed per candidate.
                    </p>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min={formData.minCandidateSportsParticipation}
                        max="100"
                        value={formData.maxCandidateSportsParticipation}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxCandidateSportsParticipation: parseInt(e.target.value, 10) || 1 }))}
                        className="w-32 px-3.5 py-2 text-base font-bold border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-800"
                        required
                      />
                      <span className="text-xs font-medium text-gray-600">Sports prog max limit</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-emerald-700 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-100">
                  Current: <strong>{formData.minCandidateSportsParticipation}</strong> to <strong>{formData.maxCandidateSportsParticipation}</strong> Sports individual event(s) per student.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs text-gray-500">
                Rules Summary: 🎭 Arts: <strong>{formData.minCandidateArtsParticipation}–{formData.maxCandidateArtsParticipation}</strong> | ⚽ Sports: <strong>{formData.minCandidateSportsParticipation}–{formData.maxCandidateSportsParticipation}</strong>
              </div>
              <button
                type="submit"
                disabled={savingFestival}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 shadow-sm flex items-center gap-2"
              >
                {savingFestival ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
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