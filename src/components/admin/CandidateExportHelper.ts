import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Candidate, Team } from '@/types';

export interface CandidateExportOptions {
  teamCode: string; // 'all' or team code like 'SMD'
  format: 'pdf' | 'xlsx' | 'xls' | 'csv';
  includeFields?: {
    chestNumber?: boolean;
    name?: boolean;
    team?: boolean;
    section?: boolean;
    points?: boolean;
  };
  sortBy?: 'chestNumber' | 'name' | 'section';
  festivalName?: string;
  venue?: string;
}

export function sortCandidates(
  candidates: Candidate[],
  sortBy: 'chestNumber' | 'name' | 'section' = 'chestNumber'
): Candidate[] {
  return [...candidates].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'section') {
      const secDiff = (a.section || '').localeCompare(b.section || '');
      if (secDiff !== 0) return secDiff;
    }
    // Default or secondary sort: natural numeric sort on chest number (e.g. SMD001, SMD002)
    return (a.chestNumber || '').localeCompare(b.chestNumber || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

/**
 * Generate and download a PDF containing candidates.
 * By default (or as requested), strictly renders Chest Number and Name in the table.
 */
export function generateCandidatesPdf(
  candidates: Candidate[],
  teams: Team[],
  options: CandidateExportOptions
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const festivalTitle = options.festivalName || 'ARTS FESTIVAL';
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Group candidates by team
  const targetTeams =
    options.teamCode === 'all'
      ? teams
      : teams.filter((t) => t.code === options.teamCode);

  // If options.teamCode is set to a team not found in teams array, create a mock team entry
  if (targetTeams.length === 0 && options.teamCode !== 'all') {
    targetTeams.push({
      code: options.teamCode,
      name: options.teamCode,
      color: '#2563EB',
      description: '',
      captain: '',
      members: 0,
      points: 0,
    });
  }

  // Header helper
  const renderHeader = (teamInfo?: Team) => {
    // Top banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 26, 'F');

    // Accent line
    const accentColor = teamInfo?.color || '#3B82F6';
    const r = parseInt(accentColor.slice(1, 3), 16) || 59;
    const g = parseInt(accentColor.slice(3, 5), 16) || 130;
    const b = parseInt(accentColor.slice(5, 7), 16) || 246;
    doc.setFillColor(r, g, b);
    doc.rect(0, 26, pageWidth, 2.5, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(festivalTitle.toUpperCase(), 14, 11);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // slate-300
    const subtitle = teamInfo
      ? `OFFICIAL CANDIDATE CALL SHEET — TEAM: ${teamInfo.name.toUpperCase()} (${teamInfo.code})`
      : 'OFFICIAL CANDIDATE CALL SHEET — ALL TEAMS';
    doc.text(subtitle, 14, 18);

    // Right side: Date & Venue
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    const rightText = [
      options.venue ? `Venue: ${options.venue}` : '',
      `Date: ${currentDate}`,
    ].filter(Boolean);
    doc.text(rightText, pageWidth - 14, 12, { align: 'right' });
  };

  let isFirstPage = true;

  targetTeams.forEach((team) => {
    const teamCandidates = sortCandidates(
      candidates.filter((c) => c.team === team.code),
      options.sortBy || 'chestNumber'
    );

    // Skip teams with 0 candidates when exporting all teams, unless it's a specific team export
    if (teamCandidates.length === 0 && options.teamCode === 'all') {
      return;
    }

    if (!isFirstPage) {
      doc.addPage();
    } else {
      isFirstPage = false;
    }

    renderHeader(team);

    let startY = 35;

    // Team summary banner
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(14, startY, pageWidth - 28, 12, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, startY, pageWidth - 28, 12, 2, 2, 'S');

    // Team Pill
    const accentColor = team.color || '#3B82F6';
    const tr = parseInt(accentColor.slice(1, 3), 16) || 59;
    const tg = parseInt(accentColor.slice(3, 5), 16) || 130;
    const tb = parseInt(accentColor.slice(5, 7), 16) || 246;
    doc.setFillColor(tr, tg, tb);
    doc.roundedRect(16, startY + 2.5, 18, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(team.code, 25, startY + 7, { align: 'center' });

    // Team Name
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(team.name, 38, startY + 7.5);

    // Candidates count
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Total Candidates: ${teamCandidates.length}`,
      pageWidth - 18,
      startY + 7.5,
      { align: 'right' }
    );

    startY += 16;

    // Determine columns.
    // Strictly Chest Number and Name as requested, plus Sl No.
    // User can optionally enable section/points in options if needed.
    const showSection = options.includeFields?.section ?? false;
    const showPoints = options.includeFields?.points ?? false;

    const headRow = ['Sl', 'Chest Number', 'Candidate Name'];
    if (showSection) headRow.push('Section');
    if (showPoints) headRow.push('Points');

    const tableRows = teamCandidates.map((c, index) => {
      const row = [index + 1, c.chestNumber || '-', c.name || '-'];
      if (showSection) row.push((c.section || '-').toUpperCase());
      if (showPoints) row.push(c.points?.toString() || '0');
      return row;
    });

    if (tableRows.length === 0) {
      tableRows.push([1, '-', 'No candidates registered in this team']);
      if (showSection) tableRows[0].push('-');
      if (showPoints) tableRows[0].push('-');
    }

    autoTable(doc, {
      startY: startY,
      head: [headRow],
      body: tableRows,
      margin: { left: 14, right: 14, bottom: 15 },
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [15, 23, 42],
        minCellHeight: 7,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' }, // Sl
        1: { cellWidth: 35, fontStyle: 'bold', halign: 'center' }, // Chest Number
        2: { cellWidth: showSection || showPoints ? 80 : 135 }, // Candidate Name
        ...(showSection ? { 3: { cellWidth: 30, halign: 'center' } } : {}),
        ...(showPoints ? { [showSection ? 4 : 3]: { cellWidth: 20, halign: 'center' } } : {}),
      },
      didDrawPage: (data) => {
        // Page footer
        const totalPages = doc.getNumberOfPages();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Page ${data.pageNumber} of ${totalPages}  •  ${festivalTitle}  •  Candidate Call Sheet`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      },
    });
  });

  // If no candidates at all across all teams
  if (isFirstPage) {
    renderHeader();
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('No candidates found matching the selected filter.', 14, 40);
  }

  // Construct filename
  const teamLabel =
    options.teamCode === 'all' ? 'All_Teams' : options.teamCode;
  const filename = `${festivalTitle.replace(/\s+/g, '_')}_Candidates_${teamLabel}_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}

/**
 * Generate and download an Excel spreadsheet (.xlsx) of candidates.
 */
export function generateCandidatesExcel(
  candidates: Candidate[],
  teams: Team[],
  options: CandidateExportOptions
): void {
  const targetCandidates = sortCandidates(
    candidates.filter((c) =>
      options.teamCode === 'all' ? true : c.team === options.teamCode
    ),
    options.sortBy || 'chestNumber'
  );

  const hasExplicitFields = !!options.includeFields;
  const showTeam = hasExplicitFields
    ? (options.includeFields?.team ?? false)
    : (options.teamCode === 'all');
  const showSection = hasExplicitFields
    ? (options.includeFields?.section ?? false)
    : true;
  const showPoints = hasExplicitFields
    ? (options.includeFields?.points ?? false)
    : true;

  const headers = ['Sl No', 'Chest Number', 'Candidate Name'];
  if (showTeam) headers.push('Team Code', 'Team Name');
  if (showSection) headers.push('Section');
  if (showPoints) headers.push('Points');

  const rows = targetCandidates.map((c, index) => {
    const t = teams.find((team) => team.code === c.team);
    const row: (string | number)[] = [index + 1, c.chestNumber || '', c.name || ''];
    if (showTeam) {
      row.push(c.team || '', t?.name || c.team || '');
    }
    if (showSection) {
      row.push(c.section ? c.section.toUpperCase() : '');
    }
    if (showPoints) {
      row.push(c.points || 0);
    }
    return row;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Adjust column widths
  ws['!cols'] = [
    { wch: 8 },  // Sl No
    { wch: 15 }, // Chest No
    { wch: 28 }, // Name
    ...(showTeam ? [{ wch: 12 }, { wch: 24 }] : []),
    ...(showSection ? [{ wch: 15 }] : []),
    ...(showPoints ? [{ wch: 10 }] : []),
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

  const isXls = options.format === 'xls';
  const ext = isXls ? 'xls' : 'xlsx';
  const teamLabel = options.teamCode === 'all' ? 'All_Teams' : options.teamCode;
  const filename = `Candidates_${teamLabel}_${new Date().toISOString().slice(0, 10)}.${ext}`;

  if (isXls) {
    XLSX.writeFile(wb, filename, { bookType: 'biff8' });
  } else {
    XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
  }
}

/**
 * Generate and download a CSV file (.csv) of candidates.
 */
export function generateCandidatesCsv(
  candidates: Candidate[],
  teams: Team[],
  options: CandidateExportOptions
): void {
  const targetCandidates = sortCandidates(
    candidates.filter((c) =>
      options.teamCode === 'all' ? true : c.team === options.teamCode
    ),
    options.sortBy || 'chestNumber'
  );

  const showTeam = options.includeFields?.team ?? (options.teamCode === 'all');
  const showSection = options.includeFields?.section ?? true;
  const showPoints = options.includeFields?.points ?? true;

  const headers = ['Sl No', 'Chest Number', 'Candidate Name'];
  if (showTeam) headers.push('Team Code', 'Team Name');
  if (showSection) headers.push('Section');
  if (showPoints) headers.push('Points');

  const rows = targetCandidates.map((c, index) => {
    const t = teams.find((team) => team.code === c.team);
    const row: (string | number)[] = [index + 1, c.chestNumber || '', `"${(c.name || '').replace(/"/g, '""')}"`];
    if (showTeam) {
      row.push(c.team || '', `"${(t?.name || c.team || '').replace(/"/g, '""')}"`);
    }
    if (showSection) {
      row.push(c.section ? c.section.toUpperCase() : '');
    }
    if (showPoints) {
      row.push(c.points || 0);
    }
    return row.join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const teamLabel = options.teamCode === 'all' ? 'All_Teams' : options.teamCode;
  link.setAttribute('href', url);
  link.setAttribute('download', `Candidates_${teamLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
