'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { 
  Download, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  Sparkles, 
  SlidersHorizontal,
  ChevronDown,
  Copy,
  Check,
  Plus,
  Trash2
} from 'lucide-react';
import { Programme, Result, Candidate, Team } from '@/types';
import { 
  ProgrammePoster, 
  PosterPrizeItem, 
  PosterTemplateType, 
  POSTER_TEMPLATES, 
  getDefaultPosterTemplate 
} from './ProgrammePoster';
import { findProgramme } from '@/lib/resultsHelper';

interface ProgrammePosterStudioProps {
  programmes: Programme[];
  results: Result[];
  candidates: Candidate[];
  teams: Team[];
  initialProgrammeId?: string;
}

export function ProgrammePosterStudio({
  programmes,
  results,
  candidates,
  teams,
  initialProgrammeId,
}: ProgrammePosterStudioProps) {
  // Selected programme ID
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(initialProgrammeId || '');

  // Autocomplete Search & Dropdown State
  const [programmeSearch, setProgrammeSearch] = useState('');
  const [isProgrammeDropdownOpen, setIsProgrammeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // UI States
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.42);

  // Poster Template Theme State (defaults to auto based on currentProgramme)
  const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplateType>('arts-stage');

  // Custom Editable Fields
  const [customSection, setCustomSection] = useState('');
  const [customProgrammeName, setCustomProgrammeName] = useState('');
  const [customPrizes, setCustomPrizes] = useState<PosterPrizeItem[]>([]);
  const [isCustomized, setIsCustomized] = useState(false);

  // Refs for rendering and capture
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const downloadPosterRef = useRef<HTMLDivElement>(null);

  // Helper to accurately match a programme to its published Result
  const getResultForProgramme = (prog: Programme | null): Result | null => {
    if (!prog || !results || results.length === 0) return null;

    const progIdStr = prog._id?.toString() || prog.id;

    // 1. Strict direct programmeId match on published results
    if (progIdStr) {
      const directMatch = results.find(
        (r) =>
          r.status === 'published' &&
          r.programmeId &&
          String(r.programmeId).trim() === String(progIdStr).trim()
      );
      if (directMatch) return directMatch;
    }

    // 2. Exact CODE - Name and section match on published results (never fuzzy prefix)
    if (prog.code && prog.name) {
      const expected = `${prog.code} - ${prog.name}`.trim().toLowerCase();
      const exactMatch = results.find((r) => {
        if (r.status !== 'published') return false;
        if (!r.programme) return false;
        const rProg = r.programme.trim().toLowerCase();
        if (rProg === expected) {
          if (!r.section || !prog.section || r.section.trim().toLowerCase() === prog.section.trim().toLowerCase()) {
            return true;
          }
        }
        return false;
      });
      if (exactMatch) return exactMatch;
    }

    return null;
  };

  // Auto-select initialProgrammeId or the first programme that has declared results!
  useEffect(() => {
    if (initialProgrammeId) {
      setSelectedProgrammeId(initialProgrammeId);
      return;
    }

    if (programmes.length > 0 && results.length > 0) {
      // Find the first programme that actually has results!
      const firstWithResults = programmes.find((p) => getResultForProgramme(p) !== null);
      if (firstWithResults) {
        setSelectedProgrammeId(firstWithResults._id?.toString() || firstWithResults.id || '');
      } else if (!selectedProgrammeId) {
        setSelectedProgrammeId(programmes[0]._id?.toString() || programmes[0].id || '');
      }
    } else if (programmes.length > 0 && !selectedProgrammeId) {
      setSelectedProgrammeId(programmes[0]._id?.toString() || programmes[0].id || '');
    }
  }, [programmes, results, initialProgrammeId]);

  // Find the selected programme object
  const currentProgramme = useMemo(() => {
    if (!programmes || programmes.length === 0) return null;
    return (
      programmes.find(
        (p) => p._id?.toString() === selectedProgrammeId || p.id === selectedProgrammeId
      ) ||
      programmes.find((p) => getResultForProgramme(p) !== null) ||
      programmes[0]
    );
  }, [programmes, selectedProgrammeId, results]);

  // Compute actual dynamic prizes for the currently selected programme
  const programmeWinnersData = useMemo(() => {
    if (!currentProgramme) {
      return {
        hasResults: false,
        prizes: [] as PosterPrizeItem[],
      };
    }

    const result = getResultForProgramme(currentProgramme);

    if (!result) {
      return {
        hasResults: false,
        prizes: [] as PosterPrizeItem[],
      };
    }

    const extractedPrizes: PosterPrizeItem[] = [];

    // Helper to resolve candidates or teams for any position
    const extractForPosition = (
      position: number,
      participants?: { chestNumber: string; grade?: string }[],
      teamResults?: { teamCode: string; grade?: string }[]
    ) => {
      // 1. Participant-based: Add an entry for EACH candidate (supports multiple/tied winners)
      if (participants && participants.length > 0) {
        participants.forEach((p, idx) => {
          if (!p.chestNumber) return;
          const cleanChest = String(p.chestNumber).trim();
          const cand = candidates.find(
            (c) => String(c.chestNumber).trim() === cleanChest
          );
          const teamObj = cand
            ? teams.find(
                (t) =>
                  t.code?.trim().toLowerCase() === cand.team?.trim().toLowerCase() ||
                  t.name?.trim().toLowerCase() === cand.team?.trim().toLowerCase()
              )
            : null;

          extractedPrizes.push({
            id: `p-${position}-${cleanChest}-${idx}`,
            position,
            name: cand?.name || `CHEST ${cleanChest}`,
            team: teamObj?.name || cand?.team || '',
            chestNumber: cleanChest,
          });
        });
      }

      // 2. Team-based: Add an entry for EACH team in team events
      if (teamResults && teamResults.length > 0) {
        teamResults.forEach((tEntry, idx) => {
          if (!tEntry.teamCode) return;
          const cleanTeamCode = String(tEntry.teamCode).trim();
          const teamObj = teams.find(
            (t) =>
              t.code?.trim().toLowerCase() === cleanTeamCode.toLowerCase() ||
              t.name?.trim().toLowerCase() === cleanTeamCode.toLowerCase()
          );

          extractedPrizes.push({
            id: `t-${position}-${cleanTeamCode}-${idx}`,
            position,
            name: teamObj?.name || cleanTeamCode,
            team: 'TEAM EVENT',
          });
        });
      }
    };

    extractForPosition(1, result.firstPlace, result.firstPlaceTeams);
    extractForPosition(2, result.secondPlace, result.secondPlaceTeams);
    extractForPosition(3, result.thirdPlace, result.thirdPlaceTeams);

    return {
      hasResults: extractedPrizes.length > 0,
      prizes: extractedPrizes,
    };
  }, [currentProgramme, results, candidates, teams]);

  // When selected programme changes, synchronize custom fields with DB and set default template
  useEffect(() => {
    if (currentProgramme) {
      setCustomSection(currentProgramme.section?.toUpperCase() || 'GENERAL');
      setCustomProgrammeName(currentProgramme.name || '');
      setCustomPrizes(programmeWinnersData.prizes);
      setSelectedTemplate(getDefaultPosterTemplate(currentProgramme));
      setIsCustomized(false);
    }
  }, [currentProgramme, programmeWinnersData]);

  // Current active poster template config
  const currentTemplate = useMemo(() => {
    return POSTER_TEMPLATES.find((t) => t.id === selectedTemplate) || POSTER_TEMPLATES[0];
  }, [selectedTemplate]);

  // Reset to original database values
  const handleReset = () => {
    if (currentProgramme) {
      setCustomSection(currentProgramme.section?.toUpperCase() || 'GENERAL');
      setCustomProgrammeName(currentProgramme.name || '');
      setCustomPrizes(programmeWinnersData.prizes);
      setSelectedTemplate(getDefaultPosterTemplate(currentProgramme));
      setIsCustomized(false);
    }
  };

  // Add a new prize item manually in fine-tune mode
  const handleAddPrize = (defaultPos = 1) => {
    const nextPosition =
      customPrizes.length > 0
        ? Math.min(customPrizes[customPrizes.length - 1].position + 1, 3)
        : defaultPos;

    setCustomPrizes([
      ...customPrizes,
      {
        id: `manual-${Date.now()}`,
        position: nextPosition,
        name: '',
        team: '',
      },
    ]);
    setIsCustomized(true);
  };

  // Remove a specific prize item
  const handleRemovePrize = (index: number) => {
    const updated = customPrizes.filter((_, i) => i !== index);
    setCustomPrizes(updated);
    setIsCustomized(true);
  };

  // Update a prize item field
  const handleUpdatePrize = (index: number, field: keyof PosterPrizeItem, value: any) => {
    const updated = [...customPrizes];
    updated[index] = { ...updated[index], [field]: value };
    setCustomPrizes(updated);
    setIsCustomized(true);
  };

  // Responsive scale observer for the preview container using ResizeObserver
  useEffect(() => {
    if (!previewContainerRef.current) return;

    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        if (containerWidth > 0) {
          // Poster master canvas is 1200px
          setPreviewScale(containerWidth / 1200);
        }
      }
    };

    updateScale();
    const observer = new ResizeObserver(() => updateScale());
    observer.observe(previewContainerRef.current);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProgrammeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only programmes with published results
  const publishedProgrammes = useMemo(() => {
    return programmes.filter((prog) => getResultForProgramme(prog) !== null);
  }, [programmes, results]);

  // Filtered published programmes for the autocomplete suggestion dropdown
  const filteredProgrammesForSelect = useMemo(() => {
    const term = programmeSearch.trim().toLowerCase();
    return publishedProgrammes.filter((prog) => {
      if (!term) return true;

      const codeMatch = prog.code?.toLowerCase().includes(term);
      const nameMatch = prog.name?.toLowerCase().includes(term);
      const catMatch = prog.category?.toLowerCase().includes(term);
      const subCatMatch = prog.subcategory?.toLowerCase().includes(term);
      const secMatch = prog.section?.toLowerCase().includes(term);

      return codeMatch || nameMatch || catMatch || subCatMatch || secMatch;
    });
  }, [publishedProgrammes, programmeSearch]);

  // Handle High-Res Download
  const handleDownload = async () => {
    if (!downloadPosterRef.current) return;
    try {
      setIsDownloading(true);
      await new Promise((resolve) => setTimeout(resolve, 80));

      const dataUrl = await toPng(downloadPosterRef.current, {
        quality: 1.0,
        pixelRatio: 2, // 2400 x 2400 ultra crisp export
        skipFonts: true,
        cacheBust: false,
      });

      const safeSection = (customSection || currentProgramme?.section || 'Result').replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );
      const safeName = (customProgrammeName || currentProgramme?.name || 'Poster').replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );

      const link = document.createElement('a');
      link.download = `Poster_${safeSection}_${safeName}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to download poster:', err);
      alert('Failed to generate poster image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Copy to Clipboard
  const handleCopyImage = async () => {
    if (!downloadPosterRef.current) return;
    try {
      const dataUrl = await toPng(downloadPosterRef.current, {
        quality: 0.95,
        pixelRatio: 1.5,
        skipFonts: true,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy not supported or permitted:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Studio Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-neutral-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-zinc-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-red-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Official Result Poster Generator
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Programme Result Posters
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl">
              Preview and download high-resolution official posters for any festival event.
              Winners and houses are dynamically loaded for each awarded prize, including ties.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 text-sm sm:text-base cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating 2400px PNG...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download High-Res Poster</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Programme Selector & Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Programme Selection Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-red-600" />
                Choose Event
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                {publishedProgrammes.length} published results
              </span>
            </div>

            {/* Autocomplete Programme Search & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Search Published Programme
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={programmeSearch}
                  onChange={(e) => {
                    setProgrammeSearch(e.target.value);
                    setIsProgrammeDropdownOpen(true);
                  }}
                  onFocus={() => setIsProgrammeDropdownOpen(true)}
                  placeholder="Search by code, name, category, or section..."
                  className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white text-gray-900 transition-all placeholder:text-gray-400 shadow-xs"
                />
                {programmeSearch && (
                  <button
                    type="button"
                    onClick={() => setProgrammeSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Floating Suggestions Dropdown */}
              {isProgrammeDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Clean Dropdown Header */}
                  <div className="px-3.5 py-2.5 bg-gray-50/95 sticky top-0 z-10 border-b border-gray-100 backdrop-blur-xs flex items-center justify-between">
                    <span className="text-gray-800 font-bold text-xs">
                      {filteredProgrammesForSelect.length} published event{filteredProgrammesForSelect.length !== 1 ? 's' : ''}
                    </span>
                    {currentProgramme && (
                      <button
                        type="button"
                        onClick={() => setIsProgrammeDropdownOpen(false)}
                        className="text-[11px] text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                  </div>

                  {/* Suggestion List Items */}
                  {filteredProgrammesForSelect.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      <p className="font-semibold text-gray-700">No published programmes found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {programmeSearch ? `No published events matching "${programmeSearch}"` : 'No published results available yet'}
                      </p>
                    </div>
                  ) : (
                    filteredProgrammesForSelect.map((prog) => {
                      const progId = prog._id?.toString() || prog.id || '';
                      const isSelected = selectedProgrammeId === progId;

                      return (
                        <div
                          key={progId}
                          onClick={() => {
                            setSelectedProgrammeId(progId);
                            setIsProgrammeDropdownOpen(false);
                            setProgrammeSearch('');
                          }}
                          className={`w-full text-left p-3 transition-colors flex items-center justify-between group cursor-pointer ${
                            isSelected
                              ? 'bg-red-50/90 font-medium border-l-4 border-red-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-red-600 text-white border-red-600'
                                  : 'bg-blue-100 text-blue-800 border-blue-200 group-hover:bg-blue-600 group-hover:text-white'
                              }`}
                            >
                              {prog.code}
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-red-700 truncate">
                                {prog.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500 truncate">
                                <span className="capitalize">{prog.category}</span>
                                {prog.subcategory && (
                                  <>
                                    <span>•</span>
                                    <span className="capitalize">{prog.subcategory}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span className="capitalize">{prog.positionType || prog.type || 'individual'}</span>
                                <span>•</span>
                                <span className="capitalize">{prog.section}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-right">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Result Ready
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Selected Programme Summary Card */}
            {currentProgramme && (
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-mono font-bold text-xs shrink-0 shadow-xs">
                      {currentProgramme.code}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm leading-snug truncate">
                        {currentProgramme.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                        <span className="capitalize font-medium">{currentProgramme.category}</span>
                        {currentProgramme.subcategory && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{currentProgramme.subcategory}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="capitalize">{currentProgramme.section}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsProgrammeDropdownOpen(true)}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold shrink-0 cursor-pointer hover:underline"
                  >
                    <span>Change</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Auto Template & Results Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-gray-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">Theme:</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 text-white font-bold text-[11px]">
                      {currentTemplate.badge} {currentTemplate.name}
                      <span className="text-zinc-400 font-normal text-[10px] ml-0.5">(Auto)</span>
                    </span>
                  </div>

                  <div>
                    {programmeWinnersData.hasResults ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {customPrizes.length} Winners Loaded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Awaiting Results
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customization / Fine-Tuning Box */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCustomizer(!showCustomizer)}
                className="flex items-center gap-2 font-bold text-gray-900 text-sm hover:text-red-600 transition"
              >
                <SlidersHorizontal className="w-4 h-4 text-red-600" />
                <span>Fine-Tune Text & Names</span>
                <span className="text-xs font-normal text-gray-400">
                  {showCustomizer ? '(Hide)' : '(Edit / Override)'}
                </span>
              </button>

              {isCustomized && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            {showCustomizer && (
              <div className="space-y-4 pt-2 border-t border-gray-100 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={customSection}
                      onChange={(e) => {
                        setCustomSection(e.target.value);
                        setIsCustomized(true);
                      }}
                      placeholder="e.g. SUB-JUNIOR"
                      className="w-full p-2 bg-gray-50 border rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Programme Name</label>
                    <input
                      type="text"
                      value={customProgrammeName}
                      onChange={(e) => {
                        setCustomProgrammeName(e.target.value);
                        setIsCustomized(true);
                      }}
                      placeholder="e.g. Arabic Handwriting"
                      className="w-full p-2 bg-gray-50 border rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Optional Template Override inside Fine-Tune */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-gray-700">Template Theme</label>
                    <span className="text-[10px] text-gray-400">
                      Auto: {POSTER_TEMPLATES.find(t => t.id === getDefaultPosterTemplate(currentProgramme))?.name || 'Arts - Stage'}
                    </span>
                  </div>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value as PosterTemplateType);
                      setIsCustomized(true);
                    }}
                    className="w-full p-2 bg-gray-50 border rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-red-500 cursor-pointer"
                  >
                    {POSTER_TEMPLATES.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Prizes List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700">Prize Recipients ({customPrizes.length})</span>
                    <button
                      type="button"
                      onClick={() => handleAddPrize(1)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Prize / Tie
                    </button>
                  </div>

                  {customPrizes.map((prize, index) => (
                    <div
                      key={prize.id || index}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <select
                            value={prize.position}
                            onChange={(e) =>
                              handleUpdatePrize(index, 'position', parseInt(e.target.value) || 1)
                            }
                            className="w-14 p-1 bg-red-600 text-white font-black text-xs rounded-lg text-center cursor-pointer focus:outline-none"
                          >
                            <option value={1} className="bg-white text-gray-900">1st</option>
                            <option value={2} className="bg-white text-gray-900">2nd</option>
                            <option value={3} className="bg-white text-gray-900">3rd</option>
                          </select>
                          <span className="font-bold text-gray-800 text-xs">
                            Place Winner {customPrizes.filter((p, i) => p.position === prize.position && i < index).length > 0 ? '(Tie)' : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePrize(index)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                          title="Remove prize"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={prize.name}
                          onChange={(e) => handleUpdatePrize(index, 'name', e.target.value)}
                          placeholder="Candidate Name"
                          className="p-1.5 bg-white border rounded text-gray-900 font-medium"
                        />
                        <input
                          type="text"
                          value={prize.team}
                          onChange={(e) => handleUpdatePrize(index, 'team', e.target.value)}
                          placeholder="Team / House"
                          className="p-1.5 bg-white border rounded text-gray-900 font-medium"
                        />
                      </div>
                    </div>
                  ))}

                  {customPrizes.length === 0 && (
                    <div className="p-4 bg-gray-50 border border-dashed rounded-xl text-center space-y-2">
                      <p className="text-gray-500">No prizes currently added.</p>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddPrize(1)}
                          className="px-2.5 py-1 bg-white border rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          + 1st
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddPrize(2)}
                          className="px-2.5 py-1 bg-white border rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          + 2nd
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddPrize(3)}
                          className="px-2.5 py-1 bg-white border rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          + 3rd
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex items-center justify-between gap-4">
            <button
              onClick={handleCopyImage}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Poster Preview (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Interactive Preview
            </div>
            <span className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full font-mono font-medium">
              1:1 Square • 2400 × 2400 High Res
            </span>
          </div>

          {/* Responsive Preview Frame */}
          <div
            ref={previewContainerRef}
            className="w-full max-w-[560px] aspect-square relative rounded-2xl shadow-2xl overflow-hidden border border-gray-300 bg-white"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Scaled Poster Wrapper */}
            <div
              style={{
                width: 1200,
                height: 1200,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <ProgrammePoster
                section={customSection}
                programmeName={customProgrammeName}
                prizes={customPrizes}
                backgroundImage={currentTemplate.imagePath}
              />
            </div>
          </div>

          {/* Quick Caption */}
          <div className="mt-4 text-center text-xs text-gray-500 max-w-md">
            Click <strong className="text-gray-700">Download High-Res Poster</strong> to export a
            crystal-clear 2400x2400px publication-ready image suitable for Instagram, WhatsApp, or print.
          </div>
        </div>
      </div>

      {/* Hidden Full-Size Poster for Pristine Unscaled 2400px Capture */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '1200px',
          height: '1200px',
          overflow: 'hidden',
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: -10,
        }}
        aria-hidden="true"
      >
        <ProgrammePoster
          ref={downloadPosterRef}
          section={customSection}
          programmeName={customProgrammeName}
          prizes={customPrizes}
          backgroundImage={currentTemplate.imagePath}
        />
      </div>
    </div>
  );
}
