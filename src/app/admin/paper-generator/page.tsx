"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Programme, ProgrammeParticipant, Candidate } from '@/types';
import {
  downloadCompetitionPaperPdf,
  openCompetitionPaperPdfInNewTab,
  CompetitionPaperConfig,
} from '@/components/admin/CompetitionPaperPdfGenerator';

export default function CompetitionPaperGeneratorPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration State
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('');
  const [customProgrammeName, setCustomProgrammeName] = useState<string>('');
  const [customProgrammeCode, setCustomProgrammeCode] = useState<string>('');
  const [section, setSection] = useState<'senior' | 'junior' | 'subjunior' | 'general' | 'all' | ''>('senior');
  const [tickSectionByDefault, setTickSectionByDefault] = useState<boolean>(false);
  const [rulingType, setRulingType] = useState<'blank' | 'ruled' | 'four-line' | 'grid'>('blank');
  const [chestMode, setChestMode] = useState<'blank' | 'specific' | 'bulk_all' | 'multiple_blank'>('blank');
  const [specificChestNo, setSpecificChestNo] = useState<string>('');
  const [multipleBlankCopies, setMultipleBlankCopies] = useState<number>(5);

  // Filter / Search for Programmes
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Preview Pagination
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programmesRes, participantsRes, candidatesRes] = await Promise.all([
        fetch('/api/programmes'),
        fetch('/api/programme-participants'),
        fetch('/api/candidates'),
      ]);

      const [programmesData, participantsData, candidatesData] = await Promise.all([
        programmesRes.json(),
        participantsRes.json(),
        candidatesRes.json(),
      ]);

      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
    } catch (error) {
      console.error('Error loading data for paper generator:', error);
    } finally {
      setLoading(false);
    }
  };

  // Selected Programme Object
  const selectedProgramme = useMemo(() => {
    if (!selectedProgrammeId || selectedProgrammeId === 'custom') return null;
    return programmes.find((p) => p._id?.toString() === selectedProgrammeId) || null;
  }, [selectedProgrammeId, programmes]);

  // Handle programme selection
  const handleSelectProgramme = (progId: string) => {
    setSelectedProgrammeId(progId);
    if (!progId || progId === 'custom') return;

    const prog = programmes.find((p) => p._id?.toString() === progId);
    if (prog) {
      const progSec = prog.section?.toLowerCase();
      if (progSec === 'senior' || progSec === 'junior' || progSec === 'subjunior') {
        setSection(progSec as any);
      } else {
        setSection('');
      }
      // Default to blank canvas as requested
      setRulingType('blank');
    }
  };

  // Registered candidates for the selected programme (strict match by ID and Code)
  const registeredCandidates = useMemo(() => {
    if (!selectedProgramme) return [];

    const progId = selectedProgramme._id?.toString();
    const progCode = selectedProgramme.code?.trim().toLowerCase();

    const programmeParticipants = participants.filter((p) => {
      if (p.status === 'withdrawn') return false;
      if (progId && (p.programmeId === progId || (p as any).id === progId)) return true;
      if (progCode && p.programmeCode && p.programmeCode.trim().toLowerCase() === progCode) return true;
      return false;
    });

    const result: Array<{
      chestNumber: string;
      name?: string;
      teamCode?: string;
      section?: string;
    }> = [];

    const addedChestNos = new Set<string>();

    programmeParticipants.forEach((pp) => {
      pp.participants.forEach((p) => {
        let chestNo = '';
        let candName = '';
        let team = '';
        let candSec = '';

        if (typeof p === 'string') {
          chestNo = p.trim();
          const foundCand = candidates.find((c) => c.chestNumber === chestNo);
          if (foundCand) {
            candName = foundCand.name;
            team = foundCand.teamId || '';
            candSec = foundCand.section || '';
          }
        } else if (p && p.candidateId) {
          const foundCand = candidates.find((c) => c._id?.toString() === p.candidateId);
          if (foundCand) {
            chestNo = foundCand.chestNumber;
            candName = foundCand.name;
            team = foundCand.teamId || '';
            candSec = foundCand.section || '';
          }
        }

        if (chestNo && !addedChestNos.has(chestNo)) {
          addedChestNos.add(chestNo);
          result.push({
            chestNumber: chestNo,
            name: candName,
            teamCode: team,
            section: candSec,
          });
        }
      });
    });

    return result.sort((a, b) => a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true }));
  }, [selectedProgramme, participants, candidates]);

  // Filtered programmes for dropdown
  const filteredProgrammes = useMemo(() => {
    return programmes.filter((prog) => {
      const matchesSearch =
        !searchQuery ||
        prog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prog.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSection =
        sectionFilter === 'all' ||
        prog.section?.toLowerCase() === sectionFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === 'all' ||
        prog.category?.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesSection && matchesCategory;
    });
  }, [programmes, searchQuery, sectionFilter, categoryFilter]);

  // Current Programme Display Name
  const activeProgrammeName = useMemo(() => {
    if (selectedProgramme) {
      return `${selectedProgramme.code} - ${selectedProgramme.name}`;
    }
    if (customProgrammeName) {
      return customProgrammeCode
        ? `${customProgrammeCode} - ${customProgrammeName}`
        : customProgrammeName;
    }
    return '';
  }, [selectedProgramme, customProgrammeName, customProgrammeCode]);

  // Build list of all sheets to render
  const renderedSheets = useMemo(() => {
    const sheets: Array<{
      programmeDisplay: string;
      chestNumberDisplay: string;
      sectionVal: string;
      candidateInfo?: { name?: string; teamCode?: string };
    }> = [];

    const secVal =
      section ||
      (selectedProgramme?.section
        ? selectedProgramme.section.toLowerCase()
        : '');

    if (chestMode === 'bulk_all') {
      if (registeredCandidates.length > 0) {
        registeredCandidates.forEach((cand) => {
          sheets.push({
            programmeDisplay: activeProgrammeName,
            chestNumberDisplay: cand.chestNumber,
            sectionVal: cand.section?.toLowerCase() || secVal,
            candidateInfo: cand,
          });
        });
      } else {
        sheets.push({
          programmeDisplay: activeProgrammeName,
          chestNumberDisplay: '',
          sectionVal: secVal,
        });
      }
    } else if (chestMode === 'multiple_blank') {
      const count = Math.max(1, Math.min(multipleBlankCopies || 1, 100));
      for (let i = 0; i < count; i++) {
        sheets.push({
          programmeDisplay: activeProgrammeName,
          chestNumberDisplay: '',
          sectionVal: secVal,
        });
      }
    } else if (chestMode === 'specific') {
      sheets.push({
        programmeDisplay: activeProgrammeName,
        chestNumberDisplay: specificChestNo.trim().toUpperCase(),
        sectionVal: secVal,
      });
    } else {
      sheets.push({
        programmeDisplay: activeProgrammeName,
        chestNumberDisplay: '',
        sectionVal: secVal,
      });
    }

    return sheets;
  }, [
    activeProgrammeName,
    chestMode,
    registeredCandidates,
    section,
    selectedProgramme,
    specificChestNo,
    multipleBlankCopies,
  ]);

  const safePreviewIndex = Math.min(
    Math.max(0, previewPageIndex),
    Math.max(0, renderedSheets.length - 1)
  );
  const currentPreviewSheet = renderedSheets[safePreviewIndex] || renderedSheets[0];

  // Helper to build jsPDF config
  const buildPdfConfig = (): CompetitionPaperConfig => {
    const secVal =
      section ||
      (selectedProgramme?.section
        ? (selectedProgramme.section.toLowerCase() as any)
        : '');

    return {
      programmeName: selectedProgramme ? selectedProgramme.name : customProgrammeName,
      programmeCode: selectedProgramme ? selectedProgramme.code : customProgrammeCode,
      section: secVal,
      tickSectionByDefault,
      rulingType,
      chestNumber: chestMode === 'specific' ? specificChestNo.trim().toUpperCase() : undefined,
      copiesCount: chestMode === 'multiple_blank' ? multipleBlankCopies : 1,
      bulkCandidates: chestMode === 'bulk_all' && registeredCandidates.length > 0 ? registeredCandidates : undefined,
    };
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Trigger PDF Download
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const config = buildPdfConfig();
      const filename = selectedProgramme
        ? `${selectedProgramme.code}_${selectedProgramme.name.replace(/[^a-zA-Z0-9]/g, '_')}_Paper.pdf`
        : `Ayyuhannas_Paper_${Date.now()}.pdf`;
      await downloadCompetitionPaperPdf(config, filename);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Open PDF in new tab
  const handleOpenPdfTab = async () => {
    try {
      setIsGeneratingPdf(true);
      const config = buildPdfConfig();
      await openCompetitionPaperPdfInNewTab(config);
    } catch (error) {
      console.error('Failed to open PDF:', error);
      alert('Error opening PDF tab.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading competition records & programmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* ============================================================ */}
      {/* PRINT CONTAINER (A4 PRINT OPTIMIZED - BLACK HEADER, BLANK)   */}
      {/* ============================================================ */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        {renderedSheets.map((sheet, idx) => (
          <div
            key={idx}
            className="print-page w-[210mm] min-h-[296mm] max-h-[297mm] p-[4mm] box-border bg-white text-black flex flex-col justify-start"
            style={{ pageBreakAfter: idx === renderedSheets.length - 1 ? 'auto' : 'always' }}
          >
            {/* WHITE 2-COLUMN HEADER BANNER WITH BLACK BORDER */}
            <div
              className="w-full rounded-[24px] p-3.5 flex items-center justify-between text-black border-2 border-black bg-white"
            >
              {/* Left Column: Large Festival Logo */}
              <div className="flex items-center">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                  <Image
                    src="/images/logo/logoayyuhannas.png"
                    alt="Logo"
                    width={300}
                    height={300}
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
              </div>

              {/* Right Column: Programme, chess NO, Section (BLACK TEXT + BLACK BORDER INPUTS) */}
              <div className="flex-1 ml-4 flex flex-col gap-1.5">
                {/* Row 1: Programme */}
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-black shrink-0 w-20">Programme</span>
                  <div className="flex-1 bg-white border-2 border-black rounded-full px-3.5 py-1 min-h-[24px] flex items-center shadow-xs">
                    <span className="text-xs font-bold text-black truncate">
                      {sheet.programmeDisplay || ''}
                    </span>
                  </div>
                </div>

                {/* Row 2: chess NO */}
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-black shrink-0 w-20">chess NO</span>
                  <div className="flex-1 bg-white border-2 border-black rounded-full px-3.5 py-1 min-h-[24px] flex items-center shadow-xs">
                    <span className="text-xs font-extrabold text-black tracking-wider">
                      {sheet.chestNumberDisplay || ''}
                    </span>
                  </div>
                </div>

                {/* Row 3: Section Checkboxes (Senior ⬜  Junior ⬜  Subjunior ⬜) */}
                <div className="flex items-center gap-4 pt-0.5">
                  {[
                    { key: 'senior', label: 'Senior' },
                    { key: 'junior', label: 'Junior' },
                    { key: 'subjunior', label: 'Subjunior' },
                  ].map((secItem) => {
                    const isTicked = tickSectionByDefault && sheet.sectionVal.toLowerCase() === secItem.key;
                    return (
                      <div key={secItem.key} className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-black">{secItem.label}</span>
                        <div className="w-4 h-4 bg-white border-2 border-black rounded-xs flex items-center justify-center text-[10px] font-black text-black shadow-xs">
                          {isTicked ? '✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Completely Blank Canvas Body (Clean borderless paper, no lines, no padding) */}
            <div className="mt-4 flex-1 bg-white min-h-[245mm]">
              {rulingType === 'ruled' && (
                <div className="w-full h-full flex flex-col justify-start">
                  {Array.from({ length: 29 }).map((_, rIdx) => (
                    <div
                      key={rIdx}
                      className="w-full border-b border-gray-300 h-[8mm]"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SCREEN UI (CONTROL PANEL + LIVE PREVIEW)                      */}
      {/* ============================================================ */}
      <div className="no-print space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/admin/dashboard" className="hover:underline">Admin</Link>
              <span>/</span>
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Competition Paper Generator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📄 Official Competition Paper Generator</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Black header banner, white text & input fields with blank canvas body.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>🖨️</span> Print Sheets ({renderedSheets.length})
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>📥</span> {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
            </button>

            <button
              type="button"
              onClick={handleOpenPdfTab}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-xl text-sm transition-all cursor-pointer"
              title="Open vector PDF preview in new tab"
            >
              <span>👁️</span> New Tab
            </button>
          </div>
        </div>

        {/* Main Grid: Control Panel (Left) & Live Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: CONTROL & SETTINGS (5 cols)                     */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Box 1: Programme Selection */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🎯</span> 1. Select Programme
                </h2>
                <span className="text-xs text-gray-500">{programmes.length} available</span>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code or programme name..."
                    className="w-full px-3.5 py-2 pl-9 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
                  >
                    <option value="all">All Sections</option>
                    <option value="senior">Senior</option>
                    <option value="junior">Junior</option>
                    <option value="subjunior">Subjunior</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
                  >
                    <option value="all">All Categories</option>
                    <option value="stage">Stage</option>
                    <option value="non-stage">Non-Stage</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Choose from Database:
                  </label>
                  <select
                    value={selectedProgrammeId}
                    onChange={(e) => handleSelectProgramme(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="">-- Choose Programme --</option>
                    <option value="custom">✍️ Custom Manual Programme</option>
                    {filteredProgrammes.map((prog) => (
                      <option key={prog._id} value={prog._id}>
                        {prog.code} - {prog.name} ({prog.section || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProgrammeId === 'custom' && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2 mt-2">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Enter Manual Programme Details:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] text-gray-500 block mb-0.5">Code</label>
                        <input
                          type="text"
                          placeholder="e.g. SN12"
                          value={customProgrammeCode}
                          onChange={(e) => setCustomProgrammeCode(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-0.5">Programme Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Essay Writing Malayalam"
                          value={customProgrammeName}
                          onChange={(e) => setCustomProgrammeName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedProgramme && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👥</span>
                      <span>
                        Registered Candidates: <strong>{registeredCandidates.length}</strong>
                      </span>
                    </div>
                    {registeredCandidates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setChestMode('bulk_all')}
                        className="text-xs font-bold underline hover:text-emerald-900 cursor-pointer"
                      >
                        Print for all
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Section & Style */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 space-y-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <span>📐</span> 2. Section & Paper Style
              </h2>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">
                  Section:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'senior', label: 'Senior' },
                    { id: 'junior', label: 'Junior' },
                    { id: 'subjunior', label: 'Subjunior' },
                    { id: '', label: 'Blank' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSection(item.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${section === item.id
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tickSectionByDefault"
                    checked={tickSectionByDefault}
                    onChange={(e) => setTickSectionByDefault(e.target.checked)}
                    className="rounded text-black focus:ring-black"
                  />
                  <label htmlFor="tickSectionByDefault" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                    Pre-tick the Section checkbox on paper (Default is unticked)
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">
                  Ruling Style (Inner Area):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'blank', name: 'Blank Paper Canvas', desc: 'Completely blank writing/drawing area' },
                    { id: 'ruled', name: 'Standard Ruled Lines', desc: 'Horizontal lines for languages/essays' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setRulingType(style.id as any)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${rulingType === style.id
                        ? 'border-black bg-gray-100 dark:bg-gray-800 ring-1 ring-black text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                        }`}
                    >
                      <p className="text-xs font-bold">{style.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 3: Candidate & Chest Number Options */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 space-y-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <span>🏷️</span> 3. Chest Number Mode
              </h2>

              <div className="space-y-2">
                {[
                  {
                    id: 'blank',
                    title: 'Blank (Manual candidate write-in)',
                    desc: 'Empty pill for candidate to write their chest number',
                  },
                  {
                    id: 'specific',
                    title: 'Specific Single Chest Number',
                    desc: 'Print with a prefilled chest number for a specific candidate',
                  },
                  {
                    id: 'bulk_all',
                    title: `Bulk - All Registered Candidates (${registeredCandidates.length})`,
                    desc: 'Generates 1 customized page for each registered candidate in this programme',
                    disabled: !selectedProgramme || registeredCandidates.length === 0,
                  },
                  {
                    id: 'multiple_blank',
                    title: 'Multiple Blank Copies',
                    desc: 'Print a batch of identical blank sheets for an entire hall',
                  },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${chestMode === mode.id
                      ? 'border-black bg-gray-100/60 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      } ${mode.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="chestMode"
                      value={mode.id}
                      checked={chestMode === mode.id}
                      onChange={() => setChestMode(mode.id as any)}
                      disabled={mode.disabled}
                      className="mt-1 text-black focus:ring-black"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-gray-900 dark:text-white">{mode.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-0.5">{mode.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {chestMode === 'specific' && (
                <div className="pt-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                    Enter Candidate Chest Number:
                  </label>
                  <input
                    type="text"
                    value={specificChestNo}
                    onChange={(e) => setSpecificChestNo(e.target.value)}
                    placeholder="e.g. S102, J105"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              )}

              {chestMode === 'multiple_blank' && (
                <div className="pt-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                    Number of Copies to Generate:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={multipleBlankCopies}
                      onChange={(e) => setMultipleBlankCopies(parseInt(e.target.value) || 1)}
                      className="w-28 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    <div className="flex gap-1.5">
                      {[5, 10, 20, 30].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setMultipleBlankCopies(num)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: LIVE INTERACTIVE A4 PREVIEW (7 cols)           */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-4">
            {/* Preview Toolbar */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Live A4 Paper Preview
                </span>
                <span className="text-xs text-gray-400">
                  ({renderedSheets.length} {renderedSheets.length === 1 ? 'Sheet' : 'Sheets'})
                </span>
              </div>

              {renderedSheets.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    disabled={safePreviewIndex === 0}
                    onClick={() => setPreviewPageIndex((prev) => Math.max(0, prev - 1))}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                  >
                    ◀ Prev
                  </button>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Sheet {safePreviewIndex + 1} of {renderedSheets.length}
                  </span>
                  <button
                    type="button"
                    disabled={safePreviewIndex >= renderedSheets.length - 1}
                    onClick={() => setPreviewPageIndex((prev) => Math.min(renderedSheets.length - 1, prev + 1))}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </div>

            {/* A4 Sheet Container */}
            <div className="bg-gray-200 dark:bg-gray-950 p-4 sm:p-6 rounded-3xl flex justify-center overflow-auto shadow-inner">
              <div
                className="w-full max-w-[620px] bg-white text-gray-900 shadow-2xl rounded-sm p-1 sm:p-1.5 flex flex-col justify-start transition-all"
                style={{
                  minHeight: '840px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* WHITE 2-COLUMN HEADER BANNER WITH BLACK BORDER */}
                <div
                  className="w-full rounded-[24px] sm:rounded-[28px] p-3.5 sm:p-4 overflow-hidden flex items-center justify-between shadow-xs bg-white border-2 border-black text-black"
                >
                  {/* Left Column: Festival Logo */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                      <Image
                        src="/images/logo/logoayyuhannas.png"
                        alt="Festival Logo"
                        width={300}
                        height={300}
                        className="object-contain w-full h-full"
                        priority
                      />
                    </div>
                  </div>

                  {/* Right Column: Programme, chess NO, Section (BLACK TEXT + BLACK BORDER INPUTS) */}
                  <div className="flex-1 ml-4 flex flex-col gap-1.5 sm:gap-2">
                    {/* Row 1: Programme */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] sm:text-xs font-bold text-black shrink-0 w-20 sm:w-22">
                        Programme
                      </span>
                      <div className="flex-1 bg-white border-2 border-black rounded-full px-3 py-1 min-h-[24px] sm:min-h-[26px] flex items-center shadow-inner overflow-hidden">
                        <span className="text-xs sm:text-sm font-bold text-black truncate">
                          {currentPreviewSheet?.programmeDisplay || (
                            <span className="text-gray-400 italic font-normal text-[11px]">
                              [ Programme Name & Code will ...
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: chess NO */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] sm:text-xs font-bold text-black shrink-0 w-20 sm:w-22">
                        chess NO
                      </span>
                      <div className="flex-1 bg-white border-2 border-black rounded-full px-3 py-1 min-h-[24px] sm:min-h-[26px] flex items-center shadow-inner overflow-hidden">
                        <span className="text-xs sm:text-sm font-black text-black tracking-wider">
                          {currentPreviewSheet?.chestNumberDisplay || (
                            <span className="text-gray-400 italic font-normal text-[11px] tracking-normal">
                              [ Blank for candidate ]
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Row 3: Section Checkboxes (Senior ⬜  Junior ⬜  Subjunior ⬜) */}
                    <div className="flex items-center gap-3 sm:gap-4 pt-0.5">
                      {[
                        { key: 'senior', label: 'Senior' },
                        { key: 'junior', label: 'Junior' },
                        { key: 'subjunior', label: 'Subjunior' },
                      ].map((secItem) => {
                        const isTicked =
                          tickSectionByDefault &&
                          currentPreviewSheet?.sectionVal?.toLowerCase() === secItem.key;
                        return (
                          <div key={secItem.key} className="flex items-center gap-1.5">
                            <span className="text-[11px] sm:text-xs font-bold text-black">
                              {secItem.label}
                            </span>
                            <div className="w-4 h-4 bg-white border-2 border-black rounded-xs flex items-center justify-center text-xs font-black text-black shadow-inner">
                              {isTicked ? '✓' : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Completely Blank Canvas Body (Borderless, padding-free clean paper) */}
                <div className="mt-5 flex-1 min-h-[580px] bg-white relative">
                  {rulingType === 'ruled' && (
                    <div className="w-full h-full flex flex-col justify-start">
                      {Array.from({ length: 22 }).map((_, rIdx) => (
                        <div
                          key={rIdx}
                          className="w-full border-b border-gray-300 h-7"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
