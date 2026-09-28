'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Programme, ProgrammeParticipant, Team, Candidate, FestivalInfo } from '@/types';
import {
  generateSchedulePdf,
  openSchedulePdfInNewTab,
  exportScheduleToExcel,
  exportScheduleToCsv,
  ScheduledProgrammeItem,
  ProgrammeWithCandidates,
  FestExportMeta,
  DayConfigItem,
} from '@/components/admin/SchedulePdfGenerator';
import { SchedulePreviewDocument } from '@/components/admin/SchedulePreviewDocument';
import {
  ArrowLeft,
  Calendar,
  Printer,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function ScheduleLivePreviewPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [festInfo, setFestInfo] = useState<FestivalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Scheduled sequence state
  const [scheduledItems, setScheduledItems] = useState<ScheduledProgrammeItem[]>([]);
  const [includeScoringColumns, setIncludeScoringColumns] = useState(true);
  const [pageBreakBetweenProgrammes, setPageBreakBetweenProgrammes] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Meta customization matching screenshot
  const [scheduleTitle, setScheduleTitle] = useState('Programme Schedule');
  const [scheduleSubtitle, setScheduleSubtitle] = useState('Event line-up by category');
  const [headerDate, setHeaderDate] = useState('27 September 2026');
  const [daysConfig, setDaysConfig] = useState<DayConfigItem[]>([
    { id: 'day-1', name: 'Day 1', date: '27 September 2026' },
    { id: 'day-2', name: 'Day 2', date: '28 September 2026' },
  ]);
  const [selectedExportDay, setSelectedExportDay] = useState<string>('all');
  const [activeViewMode, setActiveViewMode] = useState<'lineup' | 'callsheet'>('lineup');

  // Load schedule from localStorage
  const loadScheduleFromStorage = () => {
    try {
      const savedMeta = localStorage.getItem('wattaqa_fest_schedule_meta');
      if (savedMeta) {
        const parsedMeta = JSON.parse(savedMeta);
        if (parsedMeta.scheduleTitle) setScheduleTitle(parsedMeta.scheduleTitle);
        if (parsedMeta.scheduleSubtitle) setScheduleSubtitle(parsedMeta.scheduleSubtitle);
        if (parsedMeta.headerDate) setHeaderDate(parsedMeta.headerDate);
        if (Array.isArray(parsedMeta.daysConfig) && parsedMeta.daysConfig.length > 0) {
          setDaysConfig(parsedMeta.daysConfig);
        }
      }

      const saved = localStorage.getItem('wattaqa_fest_schedule_builder');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setScheduledItems(parsed);
          setLastSyncTime(new Date());
        }
      }
    } catch (e) {
      console.error('Error loading schedule from storage', e);
    }
  };

  // Fetch API data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [progRes, partRes, teamRes, candRes, festRes] = await Promise.all([
        fetch('/api/programmes'),
        fetch('/api/programme-participants'),
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/festival-info'),
      ]);

      const [progData, partData, teamData, candData, festData] = await Promise.all([
        progRes.json().catch(() => []),
        partRes.json().catch(() => []),
        teamRes.json().catch(() => []),
        candRes.json().catch(() => []),
        festRes.json().catch(() => null),
      ]);

      setProgrammes(Array.isArray(progData) ? progData : []);
      setParticipants(Array.isArray(partData) ? partData : []);
      setTeams(Array.isArray(teamData) ? teamData : []);
      setCandidates(Array.isArray(candData) ? candData : []);
      setFestInfo(festData);

      loadScheduleFromStorage();
    } catch (err) {
      console.error('Error fetching preview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to storage event (cross-tab real-time sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wattaqa_fest_schedule_builder' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setScheduledItems(parsed);
            setLastSyncTime(new Date());
          }
        } catch (err) {
          console.error('Failed to parse updated storage schedule', err);
        }
      }
      if (e.key === 'wattaqa_fest_schedule_meta' && e.newValue) {
        try {
          const parsedMeta = JSON.parse(e.newValue);
          if (parsedMeta.scheduleTitle) setScheduleTitle(parsedMeta.scheduleTitle);
          if (parsedMeta.scheduleSubtitle) setScheduleSubtitle(parsedMeta.scheduleSubtitle);
          if (parsedMeta.headerDate) setHeaderDate(parsedMeta.headerDate);
          if (Array.isArray(parsedMeta.daysConfig) && parsedMeta.daysConfig.length > 0) {
            setDaysConfig(parsedMeta.daysConfig);
          }
          setLastSyncTime(new Date());
        } catch (err) {
          console.error('Failed to parse updated storage meta', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen to BroadcastChannel for instant real-time sync
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('wattaqa_schedule_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SCHEDULE_UPDATED') {
          if (Array.isArray(event.data.items)) {
            setScheduledItems(event.data.items);
          }
          if (event.data.scheduleTitle) setScheduleTitle(event.data.scheduleTitle);
          if (event.data.scheduleSubtitle) setScheduleSubtitle(event.data.scheduleSubtitle);
          if (event.data.headerDate) setHeaderDate(event.data.headerDate);
          if (Array.isArray(event.data.daysConfig)) setDaysConfig(event.data.daysConfig);
          if (event.data.selectedExportDay) setSelectedExportDay(event.data.selectedExportDay);
          if (typeof event.data.includeScoringColumns === 'boolean') {
            setIncludeScoringColumns(event.data.includeScoringColumns);
          }
          setLastSyncTime(new Date());
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  // Compile real-time enriched data with registered candidates from each team
  const enrichedScheduleData: ProgrammeWithCandidates[] = useMemo(() => {
    return scheduledItems.map((item) => {
      const matchedParts = participants.filter(
        (p) => p.programmeId === item.programmeId || p.programmeCode === item.programmeCode
      );

      const teamsData = teams.map((team) => {
        const teamPart = matchedParts.find((p) => p.teamCode === team.code);
        const chestList = teamPart && Array.isArray(teamPart.participants) ? teamPart.participants : [];

        const teamCandidates = chestList.map((chestNo) => {
          const cand = candidates.find((c) => c.chestNumber === chestNo);
          return {
            chestNumber: chestNo,
            name: cand?.name || 'Registered Candidate',
            section: cand?.section || item.section,
          };
        });

        return {
          teamCode: team.code,
          teamName: team.name,
          teamColor: team.color,
          candidates: teamCandidates,
        };
      });

      const totalCandidates = teamsData.reduce((acc, t) => acc + t.candidates.length, 0);

      return {
        ...item,
        teamsData,
        totalCandidates,
      };
    });
  }, [scheduledItems, participants, teams, candidates]);

  const exportMeta: FestExportMeta = useMemo(() => {
    return {
      festivalName: festInfo?.name || 'Wattaqa Arts Festival 2K25',
      year: festInfo?.year || '2025',
      venue: festInfo?.venue || 'Campus Auditorium',
      generatedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      includeScoringColumns,
      scheduleTitle,
      scheduleSubtitle,
      headerDate,
      daysConfig,
      exportMode: activeViewMode === 'callsheet' ? 'callsheet' : 'lineup',
      exportDayFilter: selectedExportDay,
    };
  }, [festInfo, includeScoringColumns, scheduleTitle, scheduleSubtitle, headerDate, daysConfig, activeViewMode, selectedExportDay]);

  const handleDownloadPdf = () => {
    if (enrichedScheduleData.length === 0) return alert('No programmes to export.');
    generateSchedulePdf(enrichedScheduleData, exportMeta);
  };

  const handleOpenPdfTab = () => {
    if (enrichedScheduleData.length === 0) return alert('No programmes to export.');
    openSchedulePdfInNewTab(enrichedScheduleData, exportMeta);
  };

  const handleDownloadExcel = (format: 'xlsx' | 'xls' = 'xlsx') => {
    if (enrichedScheduleData.length === 0) return alert('No programmes to export.');
    exportScheduleToExcel(enrichedScheduleData, exportMeta, format);
  };

  const handleDownloadCsv = () => {
    if (enrichedScheduleData.length === 0) return alert('No programmes to export.');
    exportScheduleToCsv(enrichedScheduleData, exportMeta);
  };

  const handlePrint = () => {
    if (enrichedScheduleData.length === 0) return alert('No programmes to print.');
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Loading full schedule preview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-poppins">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-xl print:hidden px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left Title and Status */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/schedule"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              title="Return to Schedule Editor"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase">
                  Full Real-Time Preview
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Synced
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {scheduledItems.length} programmes &bull; Last updated {lastSyncTime.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Day Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 px-2.5 rounded-lg border border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#c89326]" />
              <span className="text-[11px] font-bold text-slate-300 hidden sm:inline">Day:</span>
              <select
                value={selectedExportDay}
                onChange={(e) => setSelectedExportDay(e.target.value)}
                className="bg-slate-900 text-amber-300 font-bold text-xs py-1 px-1.5 rounded-md border border-slate-700 focus:outline-hidden cursor-pointer"
                title="Filter by day to view and export"
              >
                <option value="all">🌐 All Days</option>
                {daysConfig.map((d) => (
                  <option key={d.id} value={d.name}>
                    📅 {d.name} ({d.date.split(' ')[0]} {d.date.split(' ')[1] || ''})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveViewMode('lineup')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  activeViewMode === 'lineup'
                    ? 'bg-[#c89326] text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Exact Line-up Table matching screenshot design"
              >
                📋 Line-up Table
              </button>
              <button
                onClick={() => setActiveViewMode('callsheet')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  activeViewMode === 'callsheet'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Detailed Call Sheet with candidate rosters"
              >
                👥 Call Sheet
              </button>
            </div>

            {/* Toggle Scoring Columns (Only relevant in callsheet mode) */}
            {activeViewMode === 'callsheet' && (
              <button
                onClick={() => setIncludeScoringColumns(!includeScoringColumns)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  includeScoringColumns
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
                title="Toggle Judge Marks & Remarks Columns"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {includeScoringColumns ? 'Judge Score Columns: ON' : 'Score Columns: OFF'}
              </button>
            )}

            {/* Open Raw PDF in New Tab */}
            <button
              onClick={handleOpenPdfTab}
              disabled={scheduledItems.length === 0}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
              title="Open Generated PDF Document in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open PDF in New Tab
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              disabled={scheduledItems.length === 0}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
              title={`Print ${selectedExportDay === 'all' ? 'All Days' : selectedExportDay}`}
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={scheduledItems.length === 0}
              className="px-3 py-1.5 rounded-lg bg-[#c89326] hover:bg-[#b0811e] text-white font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
              title={`Download PDF for ${selectedExportDay === 'all' ? 'All Days' : selectedExportDay}`}
            >
              <Download className="w-3.5 h-3.5" />
              PDF File {selectedExportDay !== 'all' ? `(${selectedExportDay})` : ''}
            </button>

            {/* Excel XLSX */}
            <button
              onClick={() => handleDownloadExcel('xlsx')}
              disabled={scheduledItems.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
              title="Export as Excel Workbook (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              XLSX
            </button>

            {/* Excel XLS */}
            <button
              onClick={() => handleDownloadExcel('xls')}
              disabled={scheduledItems.length === 0}
              className="px-2 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all disabled:opacity-40 cursor-pointer"
              title="Export as legacy Excel (.xls)"
            >
              .XLS
            </button>

            {/* CSV */}
            <button
              onClick={handleDownloadCsv}
              disabled={scheduledItems.length === 0}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
              title="Export as CSV (.csv)"
            >
              <FileText className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>
      </header>

      {/* Main Document Viewer Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 print:p-0 print:max-w-none">
        <div className="mb-4 print:hidden flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing full printable document view. Changes made in the Schedule Editor tab update here live.
          </span>
          <button
            onClick={loadScheduleFromStorage}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Force Refresh
          </button>
        </div>

        <SchedulePreviewDocument
          programmes={enrichedScheduleData}
          meta={exportMeta}
          includeScoringColumns={includeScoringColumns}
          pageBreakBetweenProgrammes={pageBreakBetweenProgrammes}
          activeViewMode={activeViewMode}
        />
      </main>
    </div>
  );
}
