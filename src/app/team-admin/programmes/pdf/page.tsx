'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Candidate, Programme, ProgrammeParticipant, Team } from '@/types';
import {
  TeamProgrammeCardItem,
  TeamExportMeta,
  generateTeamProgrammesPdf,
  openTeamProgrammesPdfInNewTab,
} from '@/components/TeamAdmin/TeamProgrammePdfGenerator';
import { TeamProgrammePreviewDocument } from '@/components/TeamAdmin/TeamProgrammePreviewDocument';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Square,
  Users,
  X,
} from 'lucide-react';

function TeamProgrammePdfContent() {
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

  const isPreviewMode = searchParams.get('mode') === 'preview';

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [festInfo, setFestInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Selection states
  const initialCategory = searchParams.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>(initialCategory);
  const [registrationFilter, setRegistrationFilter] = useState<'all' | 'registered' | 'unregistered'>('all');
  const [selectedProgIds, setSelectedProgIds] = useState<Set<string>>(new Set());

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [candRes, progRes, partRes, teamsRes, festRes] = await Promise.all([
        fetch(`/api/candidates?team=${teamCode}`),
        fetch('/api/programmes'),
        fetch(`/api/programme-participants?team=${teamCode}`),
        fetch('/api/teams'),
        fetch('/api/festival-info'),
      ]);

      const [candData, progData, partData, teamsData, festData] = await Promise.all([
        candRes.ok ? candRes.json() : [],
        progRes.ok ? progRes.json() : [],
        partRes.ok ? partRes.json() : [],
        teamsRes.ok ? teamsRes.json() : [],
        festRes.ok ? festRes.json() : null,
      ]);

      const validProgs = Array.isArray(progData)
        ? progData.filter((p: Programme) => p && p.name && p.code)
        : [];

      setCandidates(Array.isArray(candData) ? candData : []);
      setProgrammes(validProgs);
      setParticipants(Array.isArray(partData) ? partData : []);
      setTeamData(
        Array.isArray(teamsData) ? teamsData.find((t: Team) => t.code === teamCode) || null : null
      );
      setFestInfo(festData);

      // Check if localStorage has saved selection for this team
      let initialSelected = new Set<string>();
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem(`team_pdf_selected_${teamCode}`);
          if (saved) {
            const ids = saved.split(',').filter(Boolean);
            if (ids.length > 0) {
              initialSelected = new Set(ids);
            }
          }
        } catch (e) {}
      }

      if (initialSelected.size === 0) {
        // Default: pre-select all programmes that have candidates registered, or all programmes if none
        const registeredIds = new Set<string>();
        (partData || []).forEach((p: ProgrammeParticipant) => {
          if (p.teamCode === teamCode && Array.isArray(p.participants) && p.participants.length > 0) {
            registeredIds.add(p.programmeId);
            registeredIds.add(p.programmeCode);
          }
        });

        validProgs.forEach((p: Programme) => {
          const pId = p._id?.toString() || p.id || p.code;
          if (registeredIds.has(pId) || registeredIds.has(p.code)) {
            initialSelected.add(pId);
          }
        });

        // If no registered programmes yet, select all by default
        if (initialSelected.size === 0) {
          validProgs.forEach((p: Programme) => {
            initialSelected.add(p._id?.toString() || p.id || p.code);
          });
        }
      }

      setSelectedProgIds(initialSelected);
    } catch (err) {
      console.error('Error fetching team programme PDF data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teamCode]);

  // Build card item for each programme
  const allCardItems: TeamProgrammeCardItem[] = useMemo(() => {
    return programmes.map((prog) => {
      const pId = prog._id?.toString() || prog.id || prog.code;
      const part = participants.find(
        (p) => (p.programmeId === pId || p.programmeCode === prog.code) && p.teamCode === teamCode
      );

      const chestNumbers = part && Array.isArray(part.participants) ? part.participants : [];
      const matchedCandidates = chestNumbers.map((chest) => {
        const found = candidates.find((c) => c.chestNumber === chest);
        return {
          chestNumber: chest,
          name: found?.name || `Candidate ${chest}`,
          section: found?.section || prog.section,
        };
      });

      return {
        programmeId: pId,
        programmeCode: prog.code,
        programmeName: prog.name,
        category: (prog.category || 'arts').toLowerCase(),
        subcategory: prog.subcategory,
        section: prog.section || 'general',
        positionType: prog.positionType || (prog as any).type || 'individual',
        requiredParticipants: prog.requiredParticipants || 1,
        isRegistered: matchedCandidates.length > 0,
        candidates: matchedCandidates,
      };
    });
  }, [programmes, participants, candidates, teamCode]);

  // Category counts for catalog checklist
  const catalogCounts = useMemo(() => {
    let arts = 0;
    let sports = 0;
    let artsStage = 0;
    let artsNonStage = 0;
    allCardItems.forEach((item) => {
      const isSports = (item.category || '').toLowerCase() === 'sports';
      if (isSports) {
        sports++;
      } else {
        arts++;
        if (item.subcategory === 'non-stage') {
          artsNonStage++;
        } else {
          artsStage++;
        }
      }
    });
    return {
      total: allCardItems.length,
      arts,
      sports,
      artsStage,
      artsNonStage,
    };
  }, [allCardItems]);

  // Filter programmes for the selector drawer
  const filteredCatalogItems = useMemo(() => {
    return allCardItems.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (item.programmeCode || '').toLowerCase().includes(q);
        const matchName = (item.programmeName || '').toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }

      // Section
      if (selectedSection !== 'all' && item.section !== selectedSection) {
        return false;
      }

      // Category filter (all, arts, sports, arts_stage, arts_non_stage)
      if (selectedCategory !== 'all') {
        const itemCat = (item.category || 'arts').toLowerCase();
        if (selectedCategory === 'arts') {
          if (itemCat === 'sports') return false;
        } else if (selectedCategory === 'sports') {
          if (itemCat !== 'sports') return false;
        } else if (selectedCategory === 'arts_stage') {
          if (itemCat === 'sports') return false;
          if (item.subcategory && item.subcategory !== 'stage') return false;
        } else if (selectedCategory === 'arts_non_stage') {
          if (itemCat === 'sports') return false;
          if (item.subcategory !== 'non-stage') return false;
        } else if (itemCat !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Registration status
      if (registrationFilter === 'registered' && !item.isRegistered) {
        return false;
      }
      if (registrationFilter === 'unregistered' && item.isRegistered) {
        return false;
      }

      return true;
    });
  }, [allCardItems, searchQuery, selectedSection, selectedCategory, registrationFilter]);

  // Active items selected by checkbox in total
  const selectedDocItems = useMemo(() => {
    return allCardItems.filter((item) => selectedProgIds.has(item.programmeId));
  }, [allCardItems, selectedProgIds]);

  // Active items filtered for PDF & Document Preview by docCategoryFilter
  const renderedDocItems = useMemo(() => {
    const selected = allCardItems.filter((item) => selectedProgIds.has(item.programmeId));
    if (docCategoryFilter === 'arts') {
      return selected.filter((item) => (item.category || 'arts').toLowerCase() !== 'sports');
    }
    if (docCategoryFilter === 'sports') {
      return selected.filter((item) => (item.category || '').toLowerCase() === 'sports');
    }
    return selected;
  }, [allCardItems, selectedProgIds, docCategoryFilter]);

  // Selected counts by category
  const selectedCategoryCounts = useMemo(() => {
    let total = 0;
    let arts = 0;
    let sports = 0;
    allCardItems.forEach((item) => {
      if (selectedProgIds.has(item.programmeId)) {
        total++;
        if ((item.category || '').toLowerCase() === 'sports') {
          sports++;
        } else {
          arts++;
        }
      }
    });
    return { total, arts, sports };
  }, [allCardItems, selectedProgIds]);

  // Save selection changes to localStorage for new tab preview
  const updateSelectedProgIds = (newSet: Set<string>) => {
    setSelectedProgIds(newSet);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`team_pdf_selected_${teamCode}`, Array.from(newSet).join(','));
      } catch (e) {}
    }
  };

  // Toggle single programme
  const handleToggleProgramme = (progId: string) => {
    const next = new Set(selectedProgIds);
    if (next.has(progId)) {
      next.delete(progId);
    } else {
      next.add(progId);
    }
    updateSelectedProgIds(next);
  };

  // Select all visible filtered
  const handleSelectAllFiltered = () => {
    const next = new Set(selectedProgIds);
    filteredCatalogItems.forEach((item) => next.add(item.programmeId));
    updateSelectedProgIds(next);
  };

  // Select only registered
  const handleSelectOnlyRegistered = () => {
    const next = new Set<string>();
    allCardItems.forEach((item) => {
      if (item.isRegistered && item.candidates.length > 0) {
        next.add(item.programmeId);
      }
    });
    updateSelectedProgIds(next);
  };

  // Quick Select: All Arts programmes
  const handleSelectAllArts = (onlyRegistered = false) => {
    const next = new Set(selectedProgIds);
    allCardItems.forEach((item) => {
      const isArts = (item.category || '').toLowerCase() !== 'sports';
      if (isArts && (!onlyRegistered || item.isRegistered)) {
        next.add(item.programmeId);
      }
    });
    updateSelectedProgIds(next);
  };

  // Quick Select: All Sports programmes
  const handleSelectAllSports = (onlyRegistered = false) => {
    const next = new Set(selectedProgIds);
    allCardItems.forEach((item) => {
      const isSports = (item.category || '').toLowerCase() === 'sports';
      if (isSports && (!onlyRegistered || item.isRegistered)) {
        next.add(item.programmeId);
      }
    });
    updateSelectedProgIds(next);
  };

  // Deselect all
  const handleDeselectAll = () => {
    updateSelectedProgIds(new Set());
  };

  const exportMeta: TeamExportMeta = useMemo(() => {
    let filterTitle: string | undefined;
    if (docCategoryFilter === 'arts') {
      filterTitle = 'Arts Programmes';
    } else if (docCategoryFilter === 'sports') {
      filterTitle = 'Sports Programmes';
    } else if (selectedCategory === 'arts') {
      filterTitle = 'Arts Programmes';
    } else if (selectedCategory === 'sports') {
      filterTitle = 'Sports Programmes';
    }

    return {
      teamName: teamData?.name || teamCode,
      teamCode: teamCode,
      teamColor: teamData?.color || '#3B82F6',
      festivalName: festInfo?.name || 'Wattaqa Arts Festival 2K25',
      year: festInfo?.year || '2026',
      venue: festInfo?.venue || 'Campus Auditorium',
      generatedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      filterTitle,
    };
  }, [teamData, teamCode, festInfo, docCategoryFilter, selectedCategory]);

  // Action handlers (operating on renderedDocItems)
  const handleDownloadPdf = () => {
    if (renderedDocItems.length === 0) return alert('Please select at least one programme.');
    generateTeamProgrammesPdf(renderedDocItems, exportMeta);
  };

  const handleOpenPdfTab = () => {
    if (renderedDocItems.length === 0) return alert('Please select at least one programme.');
    openTeamProgrammesPdfInNewTab(renderedDocItems, exportMeta);
  };

  const handleOpenPreviewTab = () => {
    if (renderedDocItems.length === 0) return alert('Please select at least one programme.');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`team_pdf_selected_${teamCode}`, Array.from(selectedProgIds).join(','));
      } catch (e) {}
    }
    const catQuery = docCategoryFilter !== 'all' ? `&category=${docCategoryFilter}` : '';
    window.open(`/team-admin/programmes/pdf?team=${teamCode}&mode=preview${catQuery}`, '_blank');
  };

  const handlePrint = () => {
    if (renderedDocItems.length === 0) return alert('Please select at least one programme.');
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-[#192744] border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Loading team programme roster...</p>
      </div>
    );
  }

  // Dedicated Full-Width Preview Mode (Opened in New Tab)
  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
        {/* Sticky Header for New Tab Preview */}
        <header className="sticky top-0 z-50 bg-[#192744] text-white border-b border-slate-800 shadow-xl print:hidden px-4 py-3 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href={`/team-admin/programmes/pdf?team=${teamCode}`}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Return to selection controls"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Selections</span>
              </Link>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase flex items-center gap-2">
                  <span>{teamData?.name || teamCode}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                    Document Preview (3-Col Grid)
                  </span>
                </h1>
                <p className="text-[11px] text-slate-300">
                  {renderedDocItems.length} programmes &bull;{' '}
                  {renderedDocItems.reduce((acc, i) => acc + i.candidates.length, 0)} registered candidates
                  {docCategoryFilter !== 'all' && (
                    <span className="capitalize font-semibold text-amber-300"> ({docCategoryFilter} view)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Middle Category Filter in Preview Mode */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setDocCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  docCategoryFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                All ({selectedCategoryCounts.total})
              </button>
              <button
                type="button"
                onClick={() => setDocCategoryFilter('arts')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  docCategoryFilter === 'arts'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <span>🎨 Arts ({selectedCategoryCounts.arts})</span>
              </button>
              <button
                type="button"
                onClick={() => setDocCategoryFilter('sports')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  docCategoryFilter === 'sports'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <span>⚽ Sports ({selectedCategoryCounts.sports})</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={handlePrint}
                disabled={renderedDocItems.length === 0}
                className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Preview
              </button>

              <button
                onClick={handleOpenPdfTab}
                disabled={renderedDocItems.length === 0}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                title="Open Raw PDF in New Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open PDF Tab
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={renderedDocItems.length === 0}
                className="px-3.5 py-1.5 rounded-lg bg-[#c89326] hover:bg-[#b0811e] text-white font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF ({renderedDocItems.length})
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 print:p-0 print:max-w-none">
          <TeamProgrammePreviewDocument items={renderedDocItems} meta={exportMeta} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      {/* Sticky Top Control Header */}
      <header className="sticky top-0 z-50 bg-[#192744] text-white border-b border-slate-800 shadow-xl print:hidden px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left Title & Team Info */}
          <div className="flex items-center gap-3">
            <Link
              href={`/team-admin/programmes?team=${teamCode}`}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              title="Return to Programmes Registration"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center font-extrabold text-[10px] text-white shadow-2xs"
                  style={{ backgroundColor: teamData?.color || '#3B82F6' }}
                >
                  {teamCode}
                </div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase">
                  {teamData?.name || teamCode} • Programme PDF Generator
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Grid 3-Cols
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {renderedDocItems.length} of {allCardItems.length} programmes selected &bull;{' '}
                {renderedDocItems.reduce((acc, i) => acc + i.candidates.length, 0)} registered candidates
                {docCategoryFilter !== 'all' && (
                  <span className="capitalize font-semibold text-amber-300"> ({docCategoryFilter} view)</span>
                )}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={handleOpenPreviewTab}
              disabled={renderedDocItems.length === 0}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
              title="Open the 3-column document preview in a separate new tab"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview in New Tab
            </button>

            <button
              onClick={handleOpenPdfTab}
              disabled={renderedDocItems.length === 0}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
              title="Open Generated PDF Document in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open PDF Tab
            </button>

            <button
              onClick={handlePrint}
              disabled={renderedDocItems.length === 0}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={renderedDocItems.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-[#c89326] hover:bg-[#b0811e] text-white font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF ({renderedDocItems.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Dual Layout: Left Selection Drawer / Catalog & Right 3-Column Preview */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 print:p-0 print:max-w-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Selection Controls (Col-span 4) */}
          <div className="lg:col-span-4 space-y-4 print:hidden">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">
                    Select Programmes
                  </h2>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {selectedProgIds.size} / {allCardItems.length}
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Select all programmes visible in current checklist filter"
                >
                  Select Filtered ({filteredCatalogItems.length})
                </button>
                <button
                  type="button"
                  onClick={handleSelectOnlyRegistered}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  Registered Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllArts(false)}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg border border-purple-200 transition-colors cursor-pointer"
                  title="Select all Arts programmes"
                >
                  + All Arts
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllSports(false)}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded-lg border border-teal-200 transition-colors cursor-pointer"
                  title="Select all Sports programmes"
                >
                  + All Sports
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Category Filter Selector (Arts / Sports) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Category Filter
                  </label>
                  {selectedCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Reset Category
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({catalogCounts.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('arts')}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedCategory === 'arts' || selectedCategory.startsWith('arts')
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-purple-700'
                    }`}
                  >
                    <span>🎨</span>
                    <span>Arts ({catalogCounts.arts})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('sports')}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedCategory === 'sports'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    <span>⚽</span>
                    <span>Sports ({catalogCounts.sports})</span>
                  </button>
                </div>

                {/* Arts Subcategory pills if Arts is selected */}
                {(selectedCategory === 'arts' || selectedCategory.startsWith('arts_')) && (
                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('arts')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        selectedCategory === 'arts'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Arts
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('arts_stage')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        selectedCategory === 'arts_stage'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Stage ({catalogCounts.artsStage})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('arts_non_stage')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        selectedCategory === 'arts_non_stage'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Non-Stage ({catalogCounts.artsNonStage})
                    </button>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search programme name or code..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Section & Registration Filters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">All Sections</option>
                    <option value="senior">Senior</option>
                    <option value="junior">Junior</option>
                    <option value="sub-junior">Sub Junior</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={registrationFilter}
                    onChange={(e) => setRegistrationFilter(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="registered">Registered</option>
                    <option value="unregistered">Empty</option>
                  </select>
                </div>
              </div>

              {/* Programmes Checklist */}
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredCatalogItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No programmes match current search.
                  </div>
                ) : (
                  filteredCatalogItems.map((item) => {
                    const isChecked = selectedProgIds.has(item.programmeId);
                    return (
                      <div
                        key={item.programmeId}
                        onClick={() => handleToggleProgramme(item.programmeId)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by parent div
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.programmeCode}
                              </span>
                              <span className="font-bold text-slate-900 truncate">
                                {item.programmeName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-500 capitalize">
                                {item.section}
                              </span>
                              <span className="text-slate-300">&bull;</span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                                  (item.category || '').toLowerCase() === 'sports'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                }`}
                              >
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        {item.isRegistered ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                            {item.candidates.length} cand.
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            Empty
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Preview Viewport (Col-span 8) with Exact Grid 3 Columns */}
          <div className="lg:col-span-8 space-y-3">
            {/* Viewport Category Filter Tabs & Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Show:</span>
                <button
                  type="button"
                  onClick={() => setDocCategoryFilter('all')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    docCategoryFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({selectedCategoryCounts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setDocCategoryFilter('arts')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    docCategoryFilter === 'arts'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-purple-700'
                  }`}
                >
                  <span>🎨</span>
                  <span>Arts ({selectedCategoryCounts.arts})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocCategoryFilter('sports')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    docCategoryFilter === 'sports'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <span>⚽</span>
                  <span>Sports ({selectedCategoryCounts.sports})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenPreviewTab}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Open live preview document in new tab"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>New Tab</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <TeamProgrammePreviewDocument items={renderedDocItems} meta={exportMeta} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TeamProgrammePdfPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
          <div className="w-10 h-10 border-4 border-[#192744] border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      }
    >
      <TeamProgrammePdfContent />
    </Suspense>
  );
}
