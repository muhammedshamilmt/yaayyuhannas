import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Candidate, Programme, ProgrammeParticipant, Team } from '@/types';

export interface TeamProgrammeCardItem {
  programmeId: string;
  programmeCode: string;
  programmeName: string;
  category: string;
  subcategory?: string;
  section: string;
  positionType: string;
  requiredParticipants: number;
  isRegistered: boolean;
  candidates: {
    chestNumber: string;
    name: string;
    section?: string;
  }[];
}

export interface TeamExportMeta {
  teamName: string;
  teamCode: string;
  teamColor?: string;
  festivalName: string;
  year?: string;
  venue?: string;
  generatedDate: string;
  filterTitle?: string;
}

/**
 * Format category / section tag
 */
export function formatProgrammeTag(prog: TeamProgrammeCardItem): string {
  const parts: string[] = [];
  if (prog.category) parts.push(prog.category.toUpperCase());
  if (prog.subcategory) parts.push(prog.subcategory.toUpperCase());
  if (prog.section) parts.push(prog.section.toUpperCase());
  if (prog.positionType) parts.push(prog.positionType.toUpperCase());
  return parts.join(' • ');
}

/**
 * Creates a 3-column Grid PDF document for Team Admin programmes.
 * Matches user's exact specification: "use the grid corl 3 as each col for each programme".
 */
export function createTeamProgrammesGridPdf(
  items: TeamProgrammeCardItem[],
  meta: TeamExportMeta
): jsPDF {
  // Use A4 Portrait (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const contentWidth = pageWidth - marginX * 2; // 190mm
  const numCols = 3;
  const colGap = 3.5; // 3.5mm gap between columns
  const colWidth = (contentWidth - colGap * (numCols - 1)) / numCols; // ~61mm per column

  // Convert hex color to RGB
  const hexToRgb = (hex?: string) => {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return [16, 185, 129]; // emerald-500 default
    return [
      parseInt(hex.slice(1, 3), 16) || 16,
      parseInt(hex.slice(3, 5), 16) || 185,
      parseInt(hex.slice(5, 7), 16) || 129,
    ];
  };

  const teamRgb = hexToRgb(meta.teamColor);
  const totalRegisteredCandidates = items.reduce((sum, item) => sum + item.candidates.length, 0);

  // Render Header matching the screenshot (strictly on Page 1)
  const renderFirstPageHeader = () => {
    const headerHeight = 22;
    const headerY = 8;

    // Dark Navy rounded background container (#162138)
    doc.setFillColor(22, 33, 56);
    doc.roundedRect(marginX, headerY, contentWidth, headerHeight, 2.5, 2.5, 'F');

    // Bottom accent border line in team color (e.g. vibrant green)
    doc.setFillColor(teamRgb[0], teamRgb[1], teamRgb[2]);
    doc.rect(marginX, headerY + headerHeight - 1.2, contentWidth, 1.2, 'F');

    // Left Team Badge: rounded square in team color
    const badgeX = marginX + 4;
    const badgeY = headerY + 4;
    const badgeSize = 14;
    doc.setFillColor(teamRgb[0], teamRgb[1], teamRgb[2]);
    doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(meta.teamCode || 'TEAM', badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 1.2, {
      align: 'center',
    });

    // Festival tag line above team name
    const textStartX = badgeX + badgeSize + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(245, 158, 11); // Amber / Gold
    const festTitle = (meta.festivalName || 'WATTAQA ARTS FESTIVAL 2K25').toUpperCase();
    doc.text(festTitle, textStartX, headerY + 6.5);

    const festTitleWidth = doc.getTextWidth(festTitle);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    doc.text(' • ', textStartX + festTitleWidth, headerY + 6.5);
    doc.setTextColor(226, 232, 240); // slate-200
    doc.text('Official Roster', textStartX + festTitleWidth + 3.5, headerY + 6.5);

    // Large Bold Team Name (natural casing without tracking)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(meta.teamName, textStartX, headerY + 12.5);

    // Subtitle below team name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('Team Programme Entries & Registered Candidate List', textStartX, headerY + 17);

    // Right Side Statistics Pill Boxes matching the screenshot
    const boxW = 16.5;
    const boxH = 13.5;
    const boxY = headerY + 4;

    // Box 1: PROGRAMMES
    const box1X = pageWidth - marginX - 58;
    doc.setFillColor(30, 41, 59); // #1e293b
    doc.roundedRect(box1X, boxY, boxW, boxH, 1.5, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`${items.length}`, box1X + boxW / 2, boxY + 6.2, { align: 'center' });

    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('PROGRAMMES', box1X + boxW / 2, boxY + 10.2, { align: 'center' });

    // Box 2: CANDIDATES
    const box2X = pageWidth - marginX - 39;
    doc.setFillColor(30, 41, 59); // #1e293b
    doc.roundedRect(box2X, boxY, boxW, boxH, 1.5, 1.5, 'F');

    doc.setTextColor(52, 211, 153); // Emerald-400
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`${totalRegisteredCandidates}`, box2X + boxW / 2, boxY + 6.2, { align: 'center' });

    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('CANDIDATES', box2X + boxW / 2, boxY + 10.2, { align: 'center' });

    // Date Generated box / info
    const dateX = pageWidth - marginX - 20;
    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text('Date Generated', dateX, boxY + 5.2);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text(meta.generatedDate, dateX, boxY + 9.5);
  };

  // Render header ONLY on Page 1
  let pageNumber = 1;
  renderFirstPageHeader();
  let currentY = 35; // Start cards at 35mm on Page 1

  // Height estimate for 3-col card
  const rowHeightEstimate = (item: TeamProgrammeCardItem): number => {
    const candidateLines = Math.max(item.candidates.length, 1);
    // Header (8mm) + Meta tag (4mm) + candidates (~4.5mm each) + footer (5mm)
    return 12 + candidateLines * 4.5 + 5;
  };

  for (let i = 0; i < items.length; i += 3) {
    const rowItems = items.slice(i, i + 3);
    const maxRowH = Math.max(...rowItems.map(rowHeightEstimate), 26);

    // Check page overflow
    if (currentY + maxRowH > pageHeight - 10) {
      // Page footer on current page
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `${meta.festivalName} • Team ${meta.teamName} (${meta.teamCode}) • Generated on ${meta.generatedDate}`,
        marginX,
        pageHeight - 5
      );
      doc.text(`Page ${pageNumber}`, pageWidth - marginX, pageHeight - 5, { align: 'right' });

      doc.addPage();
      pageNumber++;
      // HEADER ONLY ON FIRST PAGE: On page 2+, start right at the top margin (10mm)
      currentY = 10;
    }

    // Render 3 columns in this row
    rowItems.forEach((item, colIndex) => {
      const globalIndex = i + colIndex;
      const colX = marginX + colIndex * (colWidth + colGap);
      const cardHeight = maxRowH;
      const isReg = item.isRegistered && item.candidates.length > 0;

      // Card Outer Container: White fill with subtle border (#e2e8f0)
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(colX, currentY, colWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.2);
      doc.roundedRect(colX, currentY, colWidth, cardHeight, 1.5, 1.5, 'S');

      // Top Header Row of Card:
      // 1. Programme Code Badge (e.g. AS11, TS18, BS07 in team color)
      const codeW = 8.8;
      const codeH = 4;
      doc.setFillColor(teamRgb[0], teamRgb[1], teamRgb[2]);
      doc.roundedRect(colX + 2, currentY + 2, codeW, codeH, 0.8, 0.8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.text(item.programmeCode || '—', colX + 2 + codeW / 2, currentY + 4.7, {
        align: 'center',
      });

      // 2. Programme Name (Bold dark text)
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      const splitName = doc.splitTextToSize(item.programmeName, colWidth - 22);
      doc.text(splitName[0] || item.programmeName, colX + codeW + 3.5, currentY + 4.8);

      // 3. Registered Count Pill on top right (e.g. checkmark icon + 2 in emerald)
      const pillW = 6.8;
      const pillH = 3.8;
      const pillX = colX + colWidth - pillW - 2;
      const pillY = currentY + 2;

      if (isReg) {
        doc.setFillColor(236, 253, 245); // emerald-50
        doc.setDrawColor(167, 243, 208); // emerald-200
        doc.setLineWidth(0.15);
        doc.roundedRect(pillX, pillY, pillW, pillH, 0.8, 0.8, 'FD');

        doc.setTextColor(4, 120, 87); // emerald-700
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text(`${item.candidates.length}`, pillX + pillW / 2, pillY + 2.7, { align: 'center' });
      } else {
        doc.setFillColor(241, 245, 249); // slate-100
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.15);
        doc.roundedRect(pillX, pillY, pillW, pillH, 0.8, 0.8, 'FD');

        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.text('0', pillX + pillW / 2, pillY + 2.6, { align: 'center' });
      }

      // Tag Subtitle Row: "Senior  •  Arts  •  Individual"
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139); // slate-500
      const tagText = `${item.section.charAt(0).toUpperCase() + item.section.slice(1)}   •   ${item.category.charAt(0).toUpperCase() + item.category.slice(1)
        }   •   ${item.positionType.charAt(0).toUpperCase() + item.positionType.slice(1)}`;
      doc.text(tagText, colX + 2.5, currentY + 9.5);

      // Card Header Divider Line
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.2);
      doc.line(colX + 2, currentY + 11.5, colX + colWidth - 2, currentY + 11.5);

      // Candidate List Body
      let candY = currentY + 15;

      if (!isReg) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        doc.setTextColor(156, 163, 175); // gray-400
        doc.text('No candidates registered yet', colX + colWidth / 2, candY + 2, {
          align: 'center',
        });
      } else {
        item.candidates.forEach((cand) => {
          // Chest Number Pill (#f1f5f9)
          const chestW = 8;
          const chestH = 3.6;
          doc.setFillColor(241, 245, 249);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.15);
          doc.roundedRect(colX + 2, candY - 2.6, chestW, chestH, 0.7, 0.7, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(30, 41, 59); // slate-800
          doc.text(cand.chestNumber, colX + 2 + chestW / 2, candY - 0.2, { align: 'center' });

          // Candidate Name
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(15, 23, 42); // slate-900
          const candNameText = doc.splitTextToSize(cand.name, colWidth - 27);
          doc.text(candNameText[0] || cand.name, colX + chestW + 3.5, candY - 0.1);

          // Candidate Section on the right in light uppercase (e.g. SENIOR, SUB-JUNIOR)
          const secText = (cand.section || item.section).toUpperCase();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(secText, colX + colWidth - 2.5, candY - 0.1, { align: 'right' });

          candY += 4.5;
        });
      }

      // Card Bottom Footer
      const footerDividerY = currentY + cardHeight - 5;
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(colX + 2, footerDividerY, colX + colWidth - 2, footerDividerY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Req: ${item.requiredParticipants || 1} participant(s)`, colX + 2.5, currentY + cardHeight - 1.8);

      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(`#${globalIndex + 1}`, colX + colWidth - 2.5, currentY + cardHeight - 1.8, { align: 'right' });
    });

    currentY += maxRowH + colGap;
  }

  // Footer on final page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${meta.festivalName} • Team ${meta.teamName} (${meta.teamCode}) • Generated on ${meta.generatedDate}`,
    marginX,
    pageHeight - 5
  );
  doc.text(`Page ${pageNumber}`, pageWidth - marginX, pageHeight - 5, { align: 'right' });

  return doc;
}

/**
 * Downloads the PDF directly
 */
export function generateTeamProgrammesPdf(
  items: TeamProgrammeCardItem[],
  meta: TeamExportMeta
): void {
  const doc = createTeamProgrammesGridPdf(items, meta);
  const cleanTeam = (meta.teamCode || 'Team').replace(/\s+/g, '_');
  const filename = `${cleanTeam}_Programmes_Roster_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Opens the generated PDF in a new tab
 */
export function openTeamProgrammesPdfInNewTab(
  items: TeamProgrammeCardItem[],
  meta: TeamExportMeta
): void {
  const doc = createTeamProgrammesGridPdf(items, meta);
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl, '_blank');
  if (win) {
    win.focus();
  }
}
