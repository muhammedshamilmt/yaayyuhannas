'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  Search,
  Plus,
  Trash2,
  Printer,
  Download,
  ExternalLink,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  Layers,
  Clock,
  MapPin,
  Users,
  Eye,
  CheckCircle2,
  Sparkles,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Award,
  AlertCircle,
  FileText,
  X,
  Edit2,
} from 'lucide-react';

const TIME_PRESETS = [
  '4:45',
  '5:00',
  '5:15',
  '5:35',
  '5:45',
  '5:50',
  '9:15',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
];

const CATEGORY_PRESETS = [
  'Sub Junior',
  'Junior',
  'Senior',
  'Sub Junior, Junior & Senior',
  'General',
];

// Default sample data matching the exact screenshot
const SAMPLE_SCHEDULE_ITEMS: ScheduledProgrammeItem[] = [
  // Day 1
  {
    id: 'sample-1',
    programmeId: 'p-juggling-1',
    programmeCode: 'EV-01',
    programmeName: 'Juggling',
    category: 'arts',
    section: 'sub-junior',
    positionType: 'individual',
    stage: 'Main Stage',
    time: '4:45',
    notes: '',
    day: 'Day 1',
    dayDate: '27 September 2026',
    categoryDisplay: 'Sub Junior',
  },
  {
    id: 'sample-2',
    programmeId: 'p-juggling-2',
    programmeCode: 'EV-02',
    programmeName: 'Juggling',
    category: 'arts',
    section: 'junior',
    positionType: 'individual',
    stage: 'Main Stage',
    time: '5:00',
    notes: '',
    day: 'Day 1',
    dayDate: '27 September 2026',
    categoryDisplay: 'Junior',
  },
  {
    id: 'sample-3',
    programmeId: 'p-pinpoint',
    programmeCode: 'EV-03',
    programmeName: 'Pinpoint Kick',
    category: 'sports',
    section: 'sub-junior',
    positionType: 'individual',
    stage: 'Ground',
    time: '5:15',
    notes: '',
    day: 'Day 1',
    dayDate: '27 September 2026',
    categoryDisplay: 'Sub Junior',
  },
  {
    id: 'sample-4',
    programmeId: 'p-musical-1',
    programmeCode: 'EV-04',
    programmeName: 'Musical Chairs',
    category: 'sports',
    section: 'sub-junior',
    positionType: 'individual',
    stage: 'Ground',
    time: '5:35',
    notes: '',
    day: 'Day 1',
    dayDate: '27 September 2026',
    categoryDisplay: 'Sub Junior',
  },
  {
    id: 'sample-5',
    programmeId: 'p-musical-2',
    programmeCode: 'EV-05',
    programmeName: 'Musical Chairs',
    category: 'sports',
    section: 'junior',
    positionType: 'individual',
    stage: 'Ground',
    time: '5:50',
    notes: '',
    day: 'Day 1',
    dayDate: '27 September 2026',
    categoryDisplay: 'Junior',
  },
  {
    id: 'sample-6',
    programmeId: 'p-blind-draw',
    programmeCode: 'EV-06',
    programmeName: 'Blind Drawing',
    category: 'arts',
    section: 'sub-junior',
    positionType: 'individual',
    stage: 'Room 101',
    time: '9:15',
    notes: '',
    day: 'Day 1',
    dayDate: '27 September 2026',
    categoryDisplay: 'Sub Junior',
  },
  {
    id: 'sample-7',
    programmeId: 'p-elephant',
    programmeCode: 'EV-07',
    programmeName: 'Elephant Tail',
    category: 'arts',
    section: 'sub-junior',
    positionType: 'individual',
    stage: 'Room 102',
    time: '9:15',
    notes: '',
    day: 'Day 1',
    dayDate: '27 September 2026',
    categoryDisplay: 'Sub Junior',
  },
  // Day 2
  {
    id: 'sample-8',
    programmeId: 'p-water-flip',
    programmeCode: 'EV-08',
    programmeName: 'Water Flip',
    category: 'sports',
    section: 'general',
    positionType: 'individual',
    stage: 'Main Stage',
    time: '5:45',
    notes: '',
    day: 'Day 2',
    dayDate: '28 September 2026',
    categoryDisplay: 'Sub Junior, Junior & Senior',
  },
  {
    id: 'sample-9',
    programmeId: 'p-clapping',
    programmeCode: 'EV-09',
    programmeName: 'Clapping',
    category: 'arts',
    section: 'sub-junior',
    positionType: 'individual',
    stage: 'Main Stage',
    time: '9:15',
    notes: '',
    day: 'Day 2',
    dayDate: '28 September 2026',
    categoryDisplay: 'Sub Junior',
  },
  {
    id: 'sample-10',
    programmeId: 'p-plate-spinner',
    programmeCode: 'EV-10',
    programmeName: 'Plate Spinner',
    category: 'arts',
    section: 'senior',
    positionType: 'individual',
    stage: 'Main Stage',
    time: '9:15',
    notes: '',
    day: 'Day 2',
    dayDate: '28 September 2026',
    categoryDisplay: 'Senior',
  },
];

export default function ScheduleGeneratorPage() {
  // Raw Data from APIs
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [festInfo, setFestInfo] = useState<FestivalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Programme Schedule Heading & Dates
  const [scheduleTitle, setScheduleTitle] = useState('Programme Schedule');
  const [scheduleSubtitle, setScheduleSubtitle] = useState('Event line-up by category');
  const [headerDate, setHeaderDate] = useState('27 September 2026');

  // Days Configuration
  const [daysConfig, setDaysConfig] = useState<DayConfigItem[]>([
    { id: 'day-1', name: 'Day 1', date: '27 September 2026' },
    { id: 'day-2', name: 'Day 2', date: '28 September 2026' },
  ]);
  const [activeDay, setActiveDay] = useState<string>('Day 1');
  const [selectedExportDay, setSelectedExportDay] = useState<string>('all');
  const [sequenceFilterDay, setSequenceFilterDay] = useState<string>('all');

  // Scheduled Items List
  const [scheduledItems, setScheduledItems] = useState<ScheduledProgrammeItem[]>([]);

  // Filtering for Programme Selector
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Preview View Mode: 'lineup' (Exact Screenshot design) or 'callsheet'
  const [previewViewMode, setPreviewViewMode] = useState<'lineup' | 'callsheet'>('lineup');

  // UI state
  const [mobileTab, setMobileTab] = useState<'builder' | 'preview'>('builder');
  const [activeBuilderTab, setActiveBuilderTab] = useState<'select' | 'sequence'>('select');
  const [customEventModalOpen, setCustomEventModalOpen] = useState(false);
  const [customEventForm, setCustomEventForm] = useState({
    name: '',
    categoryDisplay: 'Sub Junior',
    time: '4:45',
    day: 'Day 1',
  });

  // Settings Card Expandable
  const [showSettingsCard, setShowSettingsCard] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch API data and initialize
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

      // Load saved schedule or fall back to Screenshot sample
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
          if (Array.isArray(parsed) && parsed.length > 0) {
            setScheduledItems(parsed);
          } else {
            setScheduledItems(SAMPLE_SCHEDULE_ITEMS);
          }
        } else {
          setScheduledItems(SAMPLE_SCHEDULE_ITEMS);
        }
      } catch (e) {
        setScheduledItems(SAMPLE_SCHEDULE_ITEMS);
      }
    } catch (err) {
      console.error('Error loading schedule generator data:', err);
      showToast('Error loading records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save to localStorage and BroadcastChannel
  useEffect(() => {
    try {
      localStorage.setItem('wattaqa_fest_schedule_builder', JSON.stringify(scheduledItems));
      localStorage.setItem(
        'wattaqa_fest_schedule_meta',
        JSON.stringify({ scheduleTitle, scheduleSubtitle, headerDate, daysConfig })
      );
      const channel = new BroadcastChannel('wattaqa_schedule_sync');
      channel.postMessage({
        type: 'SCHEDULE_UPDATED',
        items: scheduledItems,
        scheduleTitle,
        scheduleSubtitle,
        headerDate,
        daysConfig,
      });
      channel.close();
    } catch (e) {
      // ignore
    }
  }, [scheduledItems, scheduleTitle, scheduleSubtitle, headerDate, daysConfig]);

  // Filter programmes for the catalog
  const filteredProgrammes = useMemo(() => {
    return programmes.filter((prog) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (prog.code || '').toLowerCase().includes(q);
        const matchName = (prog.name || '').toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      if (selectedCategory !== 'all' && prog.category !== selectedCategory) {
        return false;
      }
      if (selectedSection !== 'all' && prog.section !== selectedSection) {
        return false;
      }
      return true;
    });
  }, [programmes, searchQuery, selectedCategory, selectedSection]);

  // Helper for category label
  const getCategoryLabel = (section?: string) => {
    if (!section) return 'General';
    const s = section.toLowerCase();
    if (s === 'sub-junior' || s === 'sub junior') return 'Sub Junior';
    if (s === 'junior') return 'Junior';
    if (s === 'senior') return 'Senior';
    return section.charAt(0).toUpperCase() + section.slice(1);
  };

  // Add individual programme from catalog
  const handleAddProgramme = (prog: Programme, targetDay: string = activeDay) => {
    const progId = prog._id?.toString() || prog.id || '';
    const dayObj = daysConfig.find((d) => d.name === targetDay);
    const dayDate = dayObj ? dayObj.date : headerDate;

    const newItem: ScheduledProgrammeItem = {
      id: `${progId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      programmeId: progId,
      programmeCode: prog.code,
      programmeName: prog.name,
      category: prog.category,
      subcategory: prog.subcategory,
      section: prog.section,
      positionType: prog.positionType || prog.type || 'individual',
      stage: 'Main Stage',
      time: '4:45',
      notes: '',
      day: targetDay,
      dayDate,
      categoryDisplay: getCategoryLabel(prog.section),
    };

    setScheduledItems((prev) => [...prev, newItem]);
    showToast(`Added "${prog.name}" to ${targetDay}`);
  };

  // Add custom event (e.g. Juggling, Water Flip, Musical Chairs)
  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEventForm.name.trim()) return;

    const dayObj = daysConfig.find((d) => d.name === customEventForm.day);
    const dayDate = dayObj ? dayObj.date : headerDate;

    const newItem: ScheduledProgrammeItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      programmeId: `cust-${Date.now()}`,
      programmeCode: `EV-${scheduledItems.length + 1}`,
      programmeName: customEventForm.name.trim(),
      category: 'arts',
      section: 'general',
      positionType: 'individual',
      stage: 'Main Stage',
      time: customEventForm.time.trim() || '4:45',
      notes: '',
      day: customEventForm.day,
      dayDate,
      categoryDisplay: customEventForm.categoryDisplay.trim() || 'Sub Junior',
    };

    setScheduledItems((prev) => [...prev, newItem]);
    setCustomEventForm((prev) => ({ ...prev, name: '' }));
    setCustomEventModalOpen(false);
    showToast(`Added event "${newItem.programmeName}" to ${newItem.day}`);
  };

  // Add all filtered programmes
  const handleAddAllFiltered = () => {
    if (filteredProgrammes.length === 0) return;
    const dayObj = daysConfig.find((d) => d.name === activeDay);
    const dayDate = dayObj ? dayObj.date : headerDate;

    const newItems: ScheduledProgrammeItem[] = filteredProgrammes.map((prog, idx) => ({
      id: `${prog._id?.toString() || prog.id}-${Date.now()}-${idx}`,
      programmeId: prog._id?.toString() || prog.id || '',
      programmeCode: prog.code,
      programmeName: prog.name,
      category: prog.category,
      subcategory: prog.subcategory,
      section: prog.section,
      positionType: prog.positionType || prog.type || 'individual',
      stage: 'Main Stage',
      time: TIME_PRESETS[idx % TIME_PRESETS.length],
      notes: '',
      day: activeDay,
      dayDate,
      categoryDisplay: getCategoryLabel(prog.section),
    }));

    setScheduledItems((prev) => [...prev, ...newItems]);
    showToast(`Added ${newItems.length} programmes to ${activeDay}`);
  };

  // Item modifications
  const handleRemoveItem = (id: string) => {
    setScheduledItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setScheduledItems((prev) => {
      const clone = [...prev];
      const temp = clone[index - 1];
      clone[index - 1] = clone[index];
      clone[index] = temp;
      return clone;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === scheduledItems.length - 1) return;
    setScheduledItems((prev) => {
      const clone = [...prev];
      const temp = clone[index + 1];
      clone[index + 1] = clone[index];
      clone[index] = temp;
      return clone;
    });
  };

  const handleUpdateItem = (id: string, field: keyof ScheduledProgrammeItem, value: string) => {
    setScheduledItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'day') {
          const dObj = daysConfig.find((d) => d.name === value);
          if (dObj) updated.dayDate = dObj.date;
        }
        return updated;
      })
    );
  };

  // Add Day (custom or auto-incremented)
  const handleAddDay = (customName?: string, customDate?: string) => {
    const nextNum = daysConfig.length + 1;
    const newDayName = customName?.trim() || `Day ${nextNum}`;
    const newDayDate = customDate?.trim() || `${26 + nextNum} September 2026`;
    const newDay: DayConfigItem = {
      id: `day-${Date.now()}`,
      name: newDayName,
      date: newDayDate,
    };
    setDaysConfig((prev) => [...prev, newDay]);
    setActiveDay(newDayName);
    showToast(`Added ${newDayName}`);
    return newDay;
  };

  // Update Day Name
  const handleUpdateDayName = (dayId: string, newName: string) => {
    const oldDay = daysConfig.find((d) => d.id === dayId);
    if (!oldDay) return;
    const oldName = oldDay.name;

    setDaysConfig((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, name: newName } : d))
    );

    if (activeDay === oldName) {
      setActiveDay(newName);
    }
    if (selectedExportDay === oldName) {
      setSelectedExportDay(newName);
    }

    setScheduledItems((prev) =>
      prev.map((item) =>
        item.day === oldName ? { ...item, day: newName } : item
      )
    );
  };

  // Update Day date
  const handleUpdateDayDate = (dayId: string, newDate: string) => {
    setDaysConfig((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, date: newDate } : d))
    );
    // Also update existing items in that day
    const targetDay = daysConfig.find((d) => d.id === dayId);
    if (targetDay) {
      setScheduledItems((prev) =>
        prev.map((item) =>
          item.day === targetDay.name ? { ...item, dayDate: newDate } : item
        )
      );
    }
  };

  // Delete Day
  const handleDeleteDay = (dayId: string) => {
    if (daysConfig.length <= 1) {
      showToast('At least one day is required');
      return;
    }
    const dayToDelete = daysConfig.find((d) => d.id === dayId);
    if (!dayToDelete) return;
    if (confirm(`Delete ${dayToDelete.name}? Any items in this day will remain in your schedule list.`)) {
      setDaysConfig((prev) => prev.filter((d) => d.id !== dayId));
      if (activeDay === dayToDelete.name) {
        const remaining = daysConfig.filter((d) => d.id !== dayId);
        setActiveDay(remaining[0]?.name || 'Day 1');
      }
      if (selectedExportDay === dayToDelete.name) {
        setSelectedExportDay('all');
      }
      showToast(`Deleted ${dayToDelete.name}`);
    }
  };

  // Manual editing of Target Day Name in "Add to Target Day"
  const handleManualTargetDayNameChange = (newName: string) => {
    const existing = daysConfig.find((d) => d.name === activeDay);
    if (existing) {
      handleUpdateDayName(existing.id, newName);
    } else {
      setActiveDay(newName);
    }
  };

  // Manual editing of Target Day Date in "Add to Target Day"
  const handleManualTargetDayDateChange = (newDate: string) => {
    const existing = daysConfig.find((d) => d.name === activeDay);
    if (existing) {
      handleUpdateDayDate(existing.id, newDate);
    } else {
      const newDay: DayConfigItem = {
        id: `day-${Date.now()}`,
        name: activeDay,
        date: newDate,
      };
      setDaysConfig((prev) => [...prev, newDay]);
    }
  };

  // Reset to Screenshot Demo
  const handleResetToScreenshotDemo = () => {
    if (confirm('Load the exact 10 events from the screenshot example?')) {
      setScheduledItems(SAMPLE_SCHEDULE_ITEMS);
      setScheduleTitle('Programme Schedule');
      setScheduleSubtitle('Event line-up by category');
      setHeaderDate('27 September 2026');
      setDaysConfig([
        { id: 'day-1', name: 'Day 1', date: '27 September 2026' },
        { id: 'day-2', name: 'Day 2', date: '28 September 2026' },
      ]);
      showToast('Loaded screenshot example schedule!');
    }
  };

  // Clear all
  const handleClearSchedule = () => {
    if (confirm('Are you sure you want to clear all items from the schedule?')) {
      setScheduledItems([]);
      showToast('Schedule cleared');
    }
  };

  // Compile real-time enriched data
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

      return {
        ...item,
        teamsData,
        totalCandidates: teamsData.reduce((acc, t) => acc + t.candidates.length, 0),
      };
    });
  }, [scheduledItems, participants, teams, candidates]);

  // Export Meta
  const exportMeta: FestExportMeta = useMemo(() => {
    return {
      festivalName: festInfo?.name || 'Wattaqa Arts Festival 2K25',
      scheduleTitle,
      scheduleSubtitle,
      headerDate,
      year: festInfo?.year || '2026',
      venue: festInfo?.venue || 'Auditorium',
      generatedDate: headerDate,
      daysConfig,
      exportMode: previewViewMode,
      exportDayFilter: selectedExportDay,
    };
  }, [festInfo, scheduleTitle, scheduleSubtitle, headerDate, daysConfig, previewViewMode, selectedExportDay]);

  // Export actions
  const handleDownloadPdf = () => {
    if (enrichedScheduleData.length === 0) return alert('No events in schedule.');
    generateSchedulePdf(enrichedScheduleData, exportMeta);
    showToast(
      selectedExportDay === 'all'
        ? 'Downloaded All Days PDF!'
        : `Downloaded ${selectedExportDay} PDF!`
    );
  };

  const handleOpenPdfTab = () => {
    if (enrichedScheduleData.length === 0) return alert('No events in schedule.');
    openSchedulePdfInNewTab(enrichedScheduleData, exportMeta);
  };

  const handleDownloadExcel = (fmt: 'xlsx' | 'xls' = 'xlsx') => {
    if (enrichedScheduleData.length === 0) return alert('No events in schedule.');
    exportScheduleToExcel(enrichedScheduleData, exportMeta, fmt);
    showToast(`Downloaded Excel (.${fmt.toUpperCase()})!`);
  };

  const handleDownloadCsv = () => {
    if (enrichedScheduleData.length === 0) return alert('No events in schedule.');
    exportScheduleToCsv(enrichedScheduleData, exportMeta);
    showToast('Downloaded CSV!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered items in arrange sequence
  const displayedSequenceItems = useMemo(() => {
    if (sequenceFilterDay === 'all') return scheduledItems;
    return scheduledItems.filter((i) => i.day === sequenceFilterDay);
  }, [scheduledItems, sequenceFilterDay]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Loading schedule generator...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Action Controls */}
      <div className="bg-[#192744] text-white p-6 sm:p-7 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Programme Schedule Generator
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {scheduleTitle}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              {scheduleSubtitle} &bull; <span className="text-amber-300 font-medium">Date: {headerDate}</span>
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Day Selector for PDF / Print / Excel */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#c89326]" />
              <span className="text-xs font-bold text-slate-300 hidden sm:inline">Export Day:</span>
              <select
                value={selectedExportDay}
                onChange={(e) => setSelectedExportDay(e.target.value)}
                className="bg-slate-900 text-amber-300 font-bold text-xs py-1 px-2 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
                title="Select which day to generate PDF, Print, or Export"
              >
                <option value="all">🌐 All Days</option>
                {daysConfig.map((d) => (
                  <option key={d.id} value={d.name}>
                    📅 {d.name} ({d.date.split(' ')[0]} {d.date.split(' ')[1] || ''})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowSettingsCard(!showSettingsCard)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/15 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              {showSettingsCard ? 'Hide Settings' : 'Edit Header & Days'}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={scheduledItems.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c89326] hover:bg-[#b5831f] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title={`Download PDF for ${selectedExportDay === 'all' ? 'All Days' : selectedExportDay}`}
            >
              <Download className="w-4 h-4" />
              Download PDF {selectedExportDay !== 'all' ? `(${selectedExportDay})` : ''}
            </button>

            <button
              onClick={handlePrint}
              disabled={scheduledItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
              title={`Print ${selectedExportDay === 'all' ? 'All Days' : selectedExportDay}`}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            <button
              onClick={() => handleDownloadExcel('xlsx')}
              disabled={scheduledItems.length === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel (.xlsx)
            </button>

            <button
              onClick={handleDownloadCsv}
              disabled={scheduledItems.length === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              CSV
            </button>

            <button
              onClick={() => window.open('/admin/schedule/preview', '_blank')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Preview Tab
            </button>
          </div>
        </div>

        {/* Collapsible Header & Days Configuration */}
        {showSettingsCard && (
          <div className="mt-5 pt-5 border-t border-slate-700/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Header Title</label>
              <input
                type="text"
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Header Subtitle</label>
              <input
                type="text"
                value={scheduleSubtitle}
                onChange={(e) => setScheduleSubtitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Top-Right Date</label>
              <input
                type="text"
                value={headerDate}
                onChange={(e) => setHeaderDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Days Management */}
            <div className="md:col-span-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-bold">Configure Festival Days</span>
                <button
                  type="button"
                  onClick={() => handleAddDay()}
                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-[#c89326] text-white hover:bg-[#b5831f] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Next Day
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {daysConfig.map((d) => (
                  <div key={d.id} className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 w-full">
                        <span className="text-[11px] font-bold text-slate-400">Day:</span>
                        <input
                          type="text"
                          value={d.name}
                          onChange={(e) => handleUpdateDayName(d.id, e.target.value)}
                          placeholder="e.g. Day 1"
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-bold text-amber-300 focus:outline-hidden focus:border-[#c89326]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDay(d.id)}
                        disabled={daysConfig.length <= 1}
                        className="text-slate-400 hover:text-rose-400 disabled:opacity-20 p-1 transition-colors"
                        title="Delete Day"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-[11px] font-bold text-slate-400">Date:</span>
                      <input
                        type="text"
                        value={d.date}
                        onChange={(e) => handleUpdateDayDate(d.id, e.target.value)}
                        placeholder="e.g. 27 September 2026"
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white focus:outline-hidden focus:border-[#c89326]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden rounded-xl bg-slate-100 p-1 border border-slate-200">
        <button
          onClick={() => setMobileTab('builder')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'builder' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
          }`}
        >
          Builder ({scheduledItems.length})
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'preview' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
          }`}
        >
          Live Preview
        </button>
      </div>

      {/* Main Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Schedule Builder */}
        <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5">
              <button
                onClick={() => setActiveBuilderTab('select')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeBuilderTab === 'select'
                    ? 'bg-white text-[#192744] shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Events
              </button>
              <button
                onClick={() => setActiveBuilderTab('sequence')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeBuilderTab === 'sequence'
                    ? 'bg-white text-[#192744] shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Line-up Sequence ({scheduledItems.length})
              </button>
            </div>

            {/* TAB 1: ADD EVENTS */}
            {activeBuilderTab === 'select' && (
              <div className="p-4 sm:p-5 space-y-4">
                {/* Target Day Selector & Manual Editor */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#c89326]" />
                      <span className="text-xs font-bold text-slate-800">Add to Target Day:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddDay()}
                        className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Add next festival day (Day 3, Day 4...)"
                      >
                        <Plus className="w-3 h-3 text-[#c89326]" />
                        + Add Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomEventModalOpen(true)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#192744] hover:bg-slate-800 text-white transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        + Custom Event
                      </button>
                    </div>
                  </div>

                  {/* Day Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {daysConfig.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setActiveDay(d.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeDay === d.name
                            ? 'bg-[#c89326] text-white shadow-xs ring-2 ring-[#c89326]/30'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>

                  {/* Manually Editable Target Day Box */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Target Day Configuration (Manually Editable)</span>
                      <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Active: {activeDay}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Target Day Name
                        </label>
                        <input
                          type="text"
                          value={activeDay}
                          onChange={(e) => handleManualTargetDayNameChange(e.target.value)}
                          placeholder="e.g. Day 1, Day 3, Finale..."
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#c89326] focus:border-[#c89326] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Target Day Date
                        </label>
                        <input
                          type="text"
                          value={daysConfig.find((d) => d.name === activeDay)?.date || ''}
                          onChange={(e) => handleManualTargetDayDateChange(e.target.value)}
                          placeholder="e.g. 29 September 2026"
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#c89326] focus:border-[#c89326] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      Tip: You can edit the day name/date above, or click "+ Add Day" to add next festival days.
                    </p>
                  </div>
                </div>

                {/* Quick Add Custom Event Bar */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-semibold text-slate-700">From Programmes Catalog</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetToScreenshotDemo}
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                      title="Load default 10 events from screenshot"
                    >
                      Load Screenshot Example
                    </button>
                    <span>&bull;</span>
                    <button
                      onClick={handleAddAllFiltered}
                      disabled={filteredProgrammes.length === 0}
                      className="text-xs text-[#c89326] hover:underline font-bold disabled:opacity-50"
                    >
                      Add All Filtered ({filteredProgrammes.length})
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by programme name or code..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Programme List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredProgrammes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No programmes match search criteria.
                    </div>
                  ) : (
                    filteredProgrammes.map((prog) => {
                      const isAlreadyAdded = scheduledItems.some(
                        (i) => i.programmeId === (prog._id?.toString() || prog.id)
                      );
                      return (
                        <div
                          key={prog._id?.toString() || prog.code}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                                {prog.code}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {prog.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span className="capitalize">{prog.category}</span>
                              <span>&bull;</span>
                              <span className="capitalize font-medium text-slate-700">
                                {getCategoryLabel(prog.section)}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddProgramme(prog, activeDay)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 transition-colors shrink-0 cursor-pointer"
                          >
                            + Add to {activeDay}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ARRANGE SEQUENCE */}
            {activeBuilderTab === 'sequence' && (
              <div className="p-4 sm:p-5 space-y-4">
                {/* Day Filter & Clear */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setSequenceFilterDay('all')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        sequenceFilterDay === 'all'
                          ? 'bg-[#192744] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({scheduledItems.length})
                    </button>
                    {daysConfig.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSequenceFilterDay(d.name)}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                          sequenceFilterDay === d.name
                            ? 'bg-[#c89326] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleClearSchedule}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Items List */}
                {displayedSequenceItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No events scheduled for {sequenceFilterDay === 'all' ? 'any day' : sequenceFilterDay}.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {displayedSequenceItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all space-y-2 text-xs"
                      >
                        {/* Title and Controls */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-[#192744] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <input
                              type="text"
                              value={item.programmeName}
                              onChange={(e) => handleUpdateItem(item.id, 'programmeName', e.target.value)}
                              className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden flex-1 truncate"
                              title="Click to edit event name"
                            />
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index === displayedSequenceItems.length - 1}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 rounded hover:bg-rose-100 text-rose-600"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline fields: Time, Category, Day */}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Time</label>
                            <input
                              type="text"
                              value={item.time}
                              onChange={(e) => handleUpdateItem(item.id, 'time', e.target.value)}
                              placeholder="e.g. 4:45"
                              className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-bold text-[#1e3a8a]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Category</label>
                            <input
                              type="text"
                              value={item.categoryDisplay || item.section}
                              onChange={(e) => handleUpdateItem(item.id, 'categoryDisplay', e.target.value)}
                              placeholder="e.g. Sub Junior"
                              className="w-full px-2 py-1 rounded border border-slate-200 bg-white italic text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Assigned Day</label>
                            <select
                              value={item.day || 'Day 1'}
                              onChange={(e) => handleUpdateItem(item.id, 'day', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-semibold text-slate-800"
                            >
                              {daysConfig.map((d) => (
                                <option key={d.id} value={d.name}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Live Document Preview (Matching Screenshot) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'builder' ? 'hidden lg:block' : 'block'}`}>
          {/* Preview View Switcher & Counter */}
          <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">Live Preview</span>
              <span className="text-xs text-slate-400">({scheduledItems.length} items)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Day filter selector */}
              <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-bold text-[11px]">Day:</span>
                <select
                  value={selectedExportDay}
                  onChange={(e) => setSelectedExportDay(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Days</option>
                  {daysConfig.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('lineup')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    previewViewMode === 'lineup'
                      ? 'bg-[#192744] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 Line-up Table (Official)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('callsheet')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    previewViewMode === 'callsheet'
                      ? 'bg-[#192744] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👥 Call Sheet
                </button>
              </div>
            </div>
          </div>

          {/* Render Preview Document */}
          <SchedulePreviewDocument
            programmes={enrichedScheduleData}
            meta={exportMeta}
            activeViewMode={previewViewMode}
          />
        </div>
      </div>

      {/* Modal: Add Custom Event */}
      {customEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-[#192744] text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Add Event to Schedule
              </h3>
              <button
                type="button"
                onClick={() => setCustomEventModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomEvent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Name *</label>
                <input
                  type="text"
                  required
                  value={customEventForm.name}
                  onChange={(e) => setCustomEventForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Juggling, Water Flip, Musical Chairs"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category / Section</label>
                <input
                  type="text"
                  value={customEventForm.categoryDisplay}
                  onChange={(e) =>
                    setCustomEventForm((prev) => ({ ...prev, categoryDisplay: e.target.value }))
                  }
                  placeholder="e.g. Sub Junior, Junior & Senior"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_PRESETS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCustomEventForm((prev) => ({ ...prev, categoryDisplay: cat }))}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Time</label>
                  <input
                    type="text"
                    value={customEventForm.time}
                    onChange={(e) =>
                      setCustomEventForm((prev) => ({ ...prev, time: e.target.value }))
                    }
                    placeholder="e.g. 4:45"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-[#1e3a8a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assign to Day</label>
                  <select
                    value={customEventForm.day}
                    onChange={(e) =>
                      setCustomEventForm((prev) => ({ ...prev, day: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                  >
                    {daysConfig.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomEventModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#c89326] hover:bg-[#b5831f] text-white font-bold shadow-xs"
                >
                  + Add to Line-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
