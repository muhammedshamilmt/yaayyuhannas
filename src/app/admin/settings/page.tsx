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
    if (formData.minCandidateParticipation < 1) {
      alert('Minimum candidate participation must be at least 1.');
      return;
    }
    if (formData.maxCandidateParticipation < formData.minCandidateParticipation) {
      alert('Maximum participation cannot be less than minimum participation.');
      return;
    }

    setSavingFestival(true);
    setSaveSuccess(null);
    try {
      const res = await fetch('/api/festival-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
        <ShowcaseSection title="Candidate Individual Participation Rules">
          <form onSubmit={handleFestivalSave} className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                <span>🎯</span> Individual Programme Limits & Team Eligibility Engine
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Define the mandatory minimum and maximum <strong>individual</strong> programmes allowed per candidate. Teams with any student falling below the minimum individual programme requirement will automatically be marked as <strong>Not Eligible</strong> in the Admin Panel. Candidates will be blocked from registering in more individual programmes than the maximum. (Note: Group items do not count towards this limit).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Minimum Individual Programmes per Candidate *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Each candidate in a team must participate in at least this many individual programmes for the team to be eligible.
                </p>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.minCandidateParticipation}
                    onChange={(e) => setFormData(prev => ({ ...prev, minCandidateParticipation: parseInt(e.target.value, 10) || 1 }))}
                    className="w-32 px-4 py-2 text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    required
                  />
                  <span className="text-xs font-semibold text-gray-600">individual programme(s) minimum</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Maximum Individual Programmes per Candidate *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  A candidate cannot be registered for more than this number of individual programmes across the festival.
                </p>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min={formData.minCandidateParticipation}
                    max="100"
                    value={formData.maxCandidateParticipation}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxCandidateParticipation: parseInt(e.target.value, 10) || 1 }))}
                    className="w-32 px-4 py-2 text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    required
                  />
                  <span className="text-xs font-semibold text-gray-600">individual programme(s) maximum limit</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-500">
                Current rule: Each candidate must do <strong>{formData.minCandidateParticipation}–{formData.maxCandidateParticipation}</strong> individual programme(s).
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