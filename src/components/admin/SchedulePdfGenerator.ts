import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface DayConfigItem {
  id: string;
  name: string; // e.g. "Day 1"
  date: string; // e.g. "27 September 2026"
}

export interface ScheduledProgrammeItem {
  id: string; // unique key in schedule
  programmeId: string;
  programmeCode: string;
  programmeName: string;
  category: string;
  subcategory?: string;
  section: string;
  positionType: string;
  stage: string;
  time: string;
  notes: string;
  day?: string; // e.g. 'Day 1', 'Day 2'
  dayDate?: string; // e.g. '27 September 2026'
  categoryDisplay?: string; // e.g. 'Sub Junior, Junior & Senior'
}

export interface CandidateWithTeam {
  chestNumber: string;
  name: string;
  teamCode: string;
  teamName: string;
  teamColor?: string;
  section?: string;
  status?: string;
}

export interface ProgrammeWithCandidates extends ScheduledProgrammeItem {
  teamsData: {
    teamCode: string;
    teamName: string;
    teamColor?: string;
    candidates: {
      chestNumber: string;
      name: string;
      section?: string;
    }[];
  }[];
  totalCandidates: number;
}

export interface FestExportMeta {
  festivalName: string;
  scheduleTitle?: string;
  scheduleSubtitle?: string;
  headerDate?: string;
  year?: string;
  venue?: string;
  generatedDate: string;
  includeScoringColumns?: boolean;
  daysConfig?: DayConfigItem[];
  exportMode?: 'lineup' | 'callsheet';
  exportDayFilter?: string; // 'all' or specific day, e.g. 'Day 1', 'Day 2'
}

function formatCategoryText(item: ScheduledProgrammeItem): string {
  if (item.categoryDisplay && item.categoryDisplay.trim()) {
    return item.categoryDisplay;
  }
  const sec = (item.section || '').toLowerCase();
  let label = item.section || '';
  if (sec === 'sub-junior' || sec === 'sub junior') label = 'Sub Junior';
  else if (sec === 'junior') label = 'Junior';
  else if (sec === 'senior') label = 'Senior';
  else if (sec === 'general') label = 'General';
  return label;
}

// Generate the Exact Clean Programme Schedule PDF matching the Screenshot UI
export function createProgrammeScheduleLineupPdf(
  programmes: ScheduledProgrammeItem[],
  meta: FestExportMeta
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  let currentY = 16;

  // Header Title (Programme Schedule)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(25, 39, 68); // Deep Navy (#192744)
  doc.text(meta.scheduleTitle || 'Programme Schedule', marginX, currentY);

  // Top-Right Date (Date: 27 September 2026 or filtered Day date)
  let dateText = meta.headerDate || meta.generatedDate || '27 September 2026';
  if (meta.exportDayFilter && meta.exportDayFilter !== 'all') {
    const matchedDay = meta.daysConfig?.find(
      (d) => d.name.toLowerCase() === meta.exportDayFilter!.toLowerCase()
    );
    if (matchedDay && matchedDay.date) {
      dateText = matchedDay.date;
    }
  }
  const headerDateStr = `Date: ${dateText}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(headerDateStr, pageWidth - marginX, currentY - 1, { align: 'right' });

  // Subtitle (Event line-up by category)
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  const subText = meta.scheduleSubtitle || 'Event line-up by category';
  doc.text(subText, marginX, currentY);

  // Golden Accent Line (#c89326 / rgb 200, 147, 38)
  currentY += 4;
  doc.setFillColor(200, 147, 38);
  doc.rect(marginX, currentY, contentWidth, 1.2, 'F');
  currentY += 8;

  // Filter programmes if a specific day is requested
  const filteredProgrammes = meta.exportDayFilter && meta.exportDayFilter !== 'all'
    ? programmes.filter(
        (p) => (p.day || 'Day 1').toLowerCase() === meta.exportDayFilter!.toLowerCase()
      )
    : programmes;

  // Group Programmes by Day
  const dayGroupsMap = new Map<string, { dayName: string; dayDate: string; items: ScheduledProgrammeItem[] }>();

  // Initialize with daysConfig if present
  if (meta.daysConfig && meta.daysConfig.length > 0) {
    meta.daysConfig.forEach((d) => {
      dayGroupsMap.set(d.name, {
        dayName: d.name,
        dayDate: d.date,
        items: [],
      });
    });
  }

  filteredProgrammes.forEach((item) => {
    const dayName = item.day || 'Day 1';
    if (!dayGroupsMap.has(dayName)) {
      dayGroupsMap.set(dayName, {
        dayName,
        dayDate: item.dayDate || meta.headerDate || meta.generatedDate || '27 September 2026',
        items: [],
      });
    }
    dayGroupsMap.get(dayName)!.items.push(item);
  });

  let dayGroups = Array.from(dayGroupsMap.values()).filter((g) => g.items.length > 0);
  if (meta.exportDayFilter && meta.exportDayFilter !== 'all') {
    dayGroups = dayGroups.filter(
      (g) => g.dayName.toLowerCase() === meta.exportDayFilter!.toLowerCase()
    );
  }

  dayGroups.forEach((group) => {
    // Check page overflow
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 16;
    }

    // Navy Day Header Bar (#192744)
    doc.setFillColor(25, 39, 68);
    doc.rect(marginX, currentY, contentWidth, 9, 'F');

    // Day Name (Left)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(group.dayName, marginX + 4, currentY + 6.2);

    // Day Date (Right)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(group.dayDate, pageWidth - marginX - 4, currentY + 6.2, { align: 'right' });

    currentY += 9;

    // Table Data for this Day
    const tableData = group.items.map((item) => [
      item.time || '—',
      item.programmeName || 'Untitled Event',
      formatCategoryText(item),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Time', 'Event', 'Category']],
      body: tableData,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 9.5,
        cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [200, 147, 38], // Gold (#c89326)
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9.5,
      },
      columnStyles: {
        0: {
          cellWidth: 32,
          fontStyle: 'bold',
          textColor: [30, 58, 138], // Navy Blue Time (#1e3a8a)
        },
        1: {
          cellWidth: 88,
          fontStyle: 'bold',
          textColor: [15, 23, 42], // Deep Black Event
        },
        2: {
          cellWidth: 'auto',
          fontStyle: 'italic',
          textColor: [71, 85, 105], // Italic Category
        },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Soft cool slate (#f8fafc)
      },
      margin: { left: marginX, right: marginX },
      didDrawPage: (data) => {
        currentY = data.cursor?.y ? data.cursor.y + 8 : currentY + 8;
      },
    });

    currentY += 8;
  });

  return doc;
}

export function createScheduleJsPdf(
  programmes: ProgrammeWithCandidates[],
  meta: FestExportMeta
): jsPDF {
  if (meta.exportMode !== 'callsheet') {
    return createProgrammeScheduleLineupPdf(programmes, meta);
  }

  // Filter programmes if exportDayFilter is active
  const activeProgrammes = meta.exportDayFilter && meta.exportDayFilter !== 'all'
    ? programmes.filter(
        (p) => (p.day || 'Day 1').toLowerCase() === meta.exportDayFilter!.toLowerCase()
      )
    : programmes;

  // Detailed Candidate Call Sheet mode
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper for Header
  const renderHeader = () => {
    // Top colored banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent line
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(0, 28, pageWidth, 2, 'F');

    // Festival Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text((meta.festivalName || 'ARTS & SPORTS FESTIVAL').toUpperCase(), 14, 11);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    const subtitleDay = meta.exportDayFilter && meta.exportDayFilter !== 'all'
      ? `OFFICIAL PROGRAMME SCHEDULE & CANDIDATE CALL SHEET (${meta.exportDayFilter.toUpperCase()})`
      : 'OFFICIAL PROGRAMME SCHEDULE & CANDIDATE CALL SHEET';
    doc.text(subtitleDay, 14, 17);

    // Venue & Date on Right
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    let dateStr = meta.generatedDate;
    if (meta.exportDayFilter && meta.exportDayFilter !== 'all') {
      const dMatch = meta.daysConfig?.find(
        (d) => d.name.toLowerCase() === meta.exportDayFilter!.toLowerCase()
      );
      if (dMatch?.date) dateStr = dMatch.date;
    }
    const rightText = [
      meta.venue ? `Venue: ${meta.venue}` : '',
      `Date: ${dateStr}`,
    ].filter(Boolean);
    doc.text(rightText, pageWidth - 14, 12, { align: 'right' });
  };

  renderHeader();

  let currentY = 36;

  activeProgrammes.forEach((prog, progIndex) => {
    // Check if we need a new page for next programme
    if (currentY > pageHeight - 50) {
      doc.addPage();
      renderHeader();
      currentY = 36;
    }

    // Programme Header Box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'S');

    // Programme Number & Code badge
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(16, currentY + 2.5, 22, 9, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`#${progIndex + 1} ${prog.programmeCode}`, 27, currentY + 7.5, { align: 'center' });

    // Programme Name
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(prog.programmeName, 42, currentY + 8.5);

    // Programme Meta (Right side: Stage, Time, Section)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const metaStr = [
      prog.stage ? `Stage: ${prog.stage}` : '',
      prog.time ? `Time: ${prog.time}` : '',
      prog.section ? `Sec: ${prog.section.toUpperCase()}` : '',
      prog.category ? `Cat: ${prog.category.toUpperCase()}` : '',
    ]
      .filter(Boolean)
      .join('  |  ');
    doc.text(metaStr, pageWidth - 18, currentY + 8.5, { align: 'right' });

    currentY += 17;

    // Prepare table data for this programme
    const tableRows: any[] = [];
    let rowNumber = 1;

    prog.teamsData.forEach((team) => {
      if (team.candidates.length === 0) {
        tableRows.push([
          rowNumber++,
          team.teamName || team.teamCode,
          '-',
          'No candidate registered',
          '-',
          '-',
          meta.includeScoringColumns ? '' : '-',
          meta.includeScoringColumns ? '' : '',
        ]);
      } else {
        team.candidates.forEach((cand) => {
          tableRows.push([
            rowNumber++,
            team.teamName || team.teamCode,
            cand.chestNumber,
            cand.name || 'Candidate',
            cand.section?.toUpperCase() || prog.section.toUpperCase(),
            'Registered',
            meta.includeScoringColumns ? '' : '',
            meta.includeScoringColumns ? '' : '',
          ]);
        });
      }
    });

    if (tableRows.length === 0) {
      tableRows.push([1, 'All Teams', '-', 'No registered candidates yet for this programme', '-', '-', '', '']);
    }

    const headers = meta.includeScoringColumns
      ? [['Sl', 'Team', 'Chest No', 'Candidate Name', 'Section', 'Status', 'Score / Marks', 'Judge Sign / Notes']]
      : [['Sl', 'Team', 'Chest No', 'Candidate Name', 'Section', 'Status', 'Call #', 'Reporting Notes']];

    autoTable(doc, {
      startY: currentY,
      head: headers,
      body: tableRows,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        minCellHeight: 6.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' }, // Sl
        1: { cellWidth: 32, fontStyle: 'bold' }, // Team
        2: { cellWidth: 20, fontStyle: 'bold', halign: 'center' }, // Chest
        3: { cellWidth: 46 }, // Name
        4: { cellWidth: 18, halign: 'center' }, // Section
        5: { cellWidth: 18, halign: 'center' }, // Status
        6: { cellWidth: 20, halign: 'center' }, // Score/Call
        7: { cellWidth: 24 }, // Notes/Sign
      },
      didDrawPage: () => {
        // Footer on every page
        const str = `Page ${doc.getNumberOfPages()}  |  ${meta.festivalName || 'Arts Fest 2K25'} Official Call Sheet`;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(str, pageWidth / 2, pageHeight - 6, { align: 'center' });
      },
    });

    // Update currentY for next programme
    const lastAutoTable = (doc as any).lastAutoTable;
    if (lastAutoTable) {
      currentY = lastAutoTable.finalY + 8;
    } else {
      currentY += 25;
    }
  });

  // End of document signature blocks
  if (currentY > pageHeight - 35) {
    doc.addPage();
    renderHeader();
    currentY = 40;
  }

  currentY += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 12;

  // 3 signature slots
  const colWidth = (pageWidth - 28) / 3;
  const sigTitles = ['Stage Coordinator', 'Chief Judge / Evaluator', 'Festival General Convenor'];

  sigTitles.forEach((title, index) => {
    const x = 14 + index * colWidth;
    doc.setDrawColor(148, 163, 184);
    doc.line(x + 5, currentY + 12, x + colWidth - 10, currentY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(title, x + colWidth / 2 - 2, currentY + 17, { align: 'center' });
  });

  return doc;
}

export function generateSchedulePdf(
  programmes: ProgrammeWithCandidates[],
  meta: FestExportMeta
) {
  const doc = createScheduleJsPdf(programmes, meta);
  const dayTag = meta.exportDayFilter && meta.exportDayFilter !== 'all'
    ? `_${meta.exportDayFilter.replace(/\s+/g, '_')}`
    : '_All_Days';
  const filename = `${(meta.scheduleTitle || meta.festivalName || 'Programme_Schedule').replace(/\s+/g, '_')}${dayTag}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export function openSchedulePdfInNewTab(
  programmes: ProgrammeWithCandidates[],
  meta: FestExportMeta
) {
  const doc = createScheduleJsPdf(programmes, meta);
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl, '_blank');
  if (win) {
    win.focus();
  }
}

export function exportScheduleToExcel(
  programmes: ProgrammeWithCandidates[],
  meta: FestExportMeta,
  format: 'xlsx' | 'xls' = 'xlsx'
) {
  const activeProgrammes = meta.exportDayFilter && meta.exportDayFilter !== 'all'
    ? programmes.filter(
        (p) => (p.day || 'Day 1').toLowerCase() === meta.exportDayFilter!.toLowerCase()
      )
    : programmes;

  // Sheet 1: Programme Schedule (matching Screenshot table)
  const lineupRows = activeProgrammes.map((prog, idx) => ({
    'Sl #': idx + 1,
    Day: prog.day || 'Day 1',
    Date: prog.dayDate || meta.headerDate || meta.generatedDate || '',
    Time: prog.time || '',
    Event: prog.programmeName,
    Category: formatCategoryText(prog),
    'Stage / Venue': prog.stage || '',
    Notes: prog.notes || '',
  }));

  // Sheet 2: Detailed Candidate Call Sheet
  const detailedRows: any[] = [];
  // Sheet 3: Programme Schedule Summary
  const summaryRows: any[] = [];

  activeProgrammes.forEach((prog, progIndex) => {
    // Add to Summary Sheet
    summaryRows.push({
      'Order #': progIndex + 1,
      Day: prog.day || 'Day 1',
      Date: prog.dayDate || meta.headerDate || '',
      'Programme Code': prog.programmeCode,
      'Programme Name': prog.programmeName,
      Category: formatCategoryText(prog),
      Subcategory: prog.subcategory || '',
      Section: (prog.section || '').toUpperCase(),
      'Position Type': prog.positionType || '',
      'Stage / Venue': prog.stage || '',
      'Scheduled Time': prog.time || '',
      'Total Candidates': prog.totalCandidates,
      'Registered Teams': prog.teamsData.filter((t) => t.candidates.length > 0).length,
      Notes: prog.notes || '',
    });

    // Add to Detailed Sheet
    prog.teamsData.forEach((team) => {
      if (team.candidates.length === 0) {
        detailedRows.push({
          'Order #': progIndex + 1,
          Day: prog.day || 'Day 1',
          'Programme Code': prog.programmeCode,
          'Programme Name': prog.programmeName,
          Category: formatCategoryText(prog),
          'Scheduled Time': prog.time || '',
          'Team Code': team.teamCode,
          'Team Name': team.teamName || team.teamCode,
          'Chest Number': '',
          'Candidate Name': 'No Candidate Registered',
          'Candidate Section': '',
          Status: 'Not Registered',
          Notes: prog.notes || '',
        });
      } else {
        team.candidates.forEach((cand) => {
          detailedRows.push({
            'Order #': progIndex + 1,
            Day: prog.day || 'Day 1',
            'Programme Code': prog.programmeCode,
            'Programme Name': prog.programmeName,
            Category: formatCategoryText(prog),
            'Scheduled Time': prog.time || '',
            'Team Code': team.teamCode,
            'Team Name': team.teamName || team.teamCode,
            'Chest Number': cand.chestNumber,
            'Candidate Name': cand.name,
            'Candidate Section': (cand.section || prog.section || '').toUpperCase(),
            Status: 'Registered',
            Notes: prog.notes || '',
          });
        });
      }
    });
  });

  const workbook = XLSX.utils.book_new();

  // Create Programme Schedule Worksheet (Primary)
  const lineupWs = XLSX.utils.json_to_sheet(lineupRows);
  lineupWs['!cols'] = [
    { wch: 6 },  // Sl #
    { wch: 10 }, // Day
    { wch: 20 }, // Date
    { wch: 12 }, // Time
    { wch: 30 }, // Event
    { wch: 24 }, // Category
    { wch: 20 }, // Stage
    { wch: 18 }, // Notes
  ];
  XLSX.utils.book_append_sheet(workbook, lineupWs, 'Programme Schedule');

  // Create Detailed Call Sheet Worksheet
  const detailedWs = XLSX.utils.json_to_sheet(detailedRows);
  detailedWs['!cols'] = [
    { wch: 8 },  // Order #
    { wch: 14 }, // Programme Code
    { wch: 28 }, // Programme Name
    { wch: 10 }, // Category
    { wch: 12 }, // Subcategory
    { wch: 12 }, // Section
    { wch: 14 }, // Position Type
    { wch: 20 }, // Stage
    { wch: 14 }, // Time
    { wch: 10 }, // Team Code
    { wch: 20 }, // Team Name
    { wch: 12 }, // Chest Number
    { wch: 26 }, // Candidate Name
    { wch: 14 }, // Candidate Section
    { wch: 14 }, // Status
    { wch: 18 }, // Notes
  ];
  XLSX.utils.book_append_sheet(workbook, detailedWs, 'Candidate Call Sheet');

  const ext = format === 'xls' ? 'xls' : 'xlsx';
  const bookType = format === 'xls' ? 'biff8' : 'xlsx';
  const dayTag = meta.exportDayFilter && meta.exportDayFilter !== 'all'
    ? `_${meta.exportDayFilter.replace(/\s+/g, '_')}`
    : '_All_Days';
  const filename = `${(meta.scheduleTitle || meta.festivalName || 'Programme_Schedule').replace(/\s+/g, '_')}${dayTag}_${new Date().toISOString().slice(0, 10)}.${ext}`;

  XLSX.writeFile(workbook, filename, { bookType });
}

export function exportScheduleToCsv(
  programmes: ProgrammeWithCandidates[],
  meta: FestExportMeta
) {
  const activeProgrammes = meta.exportDayFilter && meta.exportDayFilter !== 'all'
    ? programmes.filter(
        (p) => (p.day || 'Day 1').toLowerCase() === meta.exportDayFilter!.toLowerCase()
      )
    : programmes;

  const lineupRows = activeProgrammes.map((prog, idx) => ({
    'Sl #': idx + 1,
    Day: prog.day || 'Day 1',
    Date: prog.dayDate || meta.headerDate || meta.generatedDate || '',
    Time: prog.time || '',
    Event: prog.programmeName,
    Category: formatCategoryText(prog),
    'Stage / Venue': prog.stage || '',
    Notes: prog.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(lineupRows);
  const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dayTag = meta.exportDayFilter && meta.exportDayFilter !== 'all'
    ? `_${meta.exportDayFilter.replace(/\s+/g, '_')}`
    : '_All_Days';
  const filename = `${(meta.scheduleTitle || meta.festivalName || 'Programme_Schedule').replace(/\s+/g, '_')}${dayTag}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
