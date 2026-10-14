import jsPDF from 'jspdf';

export interface CompetitionPaperConfig {
  festTitle?: string;
  festSubtitle?: string;
  programmeName?: string;
  programmeCode?: string;
  section?: 'senior' | 'junior' | 'subjunior' | 'general' | 'all' | '';
  tickSectionByDefault?: boolean;
  chestNumber?: string;
  rulingType?: 'ruled' | 'blank' | 'four-line' | 'grid';
  copiesCount?: number;
  bulkCandidates?: Array<{
    chestNumber: string;
    name?: string;
    teamCode?: string;
    section?: string;
  }>;
  logoDataUrl?: string;
}

/**
 * Helper to fetch an image URL as base64 data URL in the browser
 */
export async function getLogoDataUrl(url = '/images/logo/logoayyuhannas.png'): Promise<string> {
  if (typeof window === 'undefined') return '';
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

/**
 * Generates an official Competition Answer / Writing Paper PDF matching the user's latest layout.
 */
export function createCompetitionPaperPdf(config: CompetitionPaperConfig): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 4; // Ultra-compact 4mm margin as requested
  const printableWidth = pageWidth - margin * 2; // 202mm

  const rulingType = config.rulingType || 'blank';
  const tickSection = Boolean(config.tickSectionByDefault);

  // Determine list of sheets to render
  const sheets: Array<{
    programmeDisplay: string;
    chestNumberDisplay: string;
    section: string;
  }> = [];

  const programmeDisplay = config.programmeName
    ? config.programmeCode
      ? `${config.programmeCode} - ${config.programmeName}`
      : config.programmeName
    : '';

  if (config.bulkCandidates && config.bulkCandidates.length > 0) {
    config.bulkCandidates.forEach((cand) => {
      sheets.push({
        programmeDisplay,
        chestNumberDisplay: cand.chestNumber || '',
        section: cand.section || config.section || '',
      });
    });
  } else if (config.copiesCount && config.copiesCount > 1) {
    for (let i = 0; i < config.copiesCount; i++) {
      sheets.push({
        programmeDisplay,
        chestNumberDisplay: config.chestNumber || '',
        section: config.section || '',
      });
    }
  } else {
    sheets.push({
      programmeDisplay,
      chestNumberDisplay: config.chestNumber || '',
      section: config.section || '',
    });
  }

  // Render each sheet
  sheets.forEach((sheet, sheetIndex) => {
    if (sheetIndex > 0) {
      doc.addPage('a4', 'portrait');
    }

    // =========================================================
    // 1. WHITE HEADER BANNER WITH SOLID BLACK BORDER
    // =========================================================
    const headerY = margin;
    const headerHeight = 32;

    // White rounded banner background with black border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, headerY, printableWidth, headerHeight, 6, 6, 'FD');

    // --- LEFT COLUMN: PROMINENT FESTIVAL LOGO ---
    const logoSize = 27;
    const logoX = margin + 2.5;
    const logoY = headerY + 2.5;

    if (config.logoDataUrl) {
      try {
        doc.addImage(config.logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
      } catch {
        doc.setFillColor(20, 20, 20);
        doc.roundedRect(logoX, logoY, logoSize, logoSize, 5, 5, 'F');
      }
    } else {
      doc.setFillColor(20, 20, 20);
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 5, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(239, 68, 68);
      doc.text('یا أيها', logoX + logoSize / 2, logoY + 9, { align: 'center' });
      doc.setTextColor(255, 255, 255);
      doc.text('الناس', logoX + logoSize / 2, logoY + 16, { align: 'center' });
      doc.setFontSize(5);
      doc.setTextColor(148, 163, 184);
      doc.text('FEST 2026', logoX + logoSize / 2, logoY + 22, { align: 'center' });
    }

    // --- RIGHT COLUMN: BLACK TEXT LABELS + BLACK BORDER INPUT PILLS ---
    const rightColStartX = logoX + logoSize + 6;
    const pillStartX = rightColStartX + 25;
    const pillWidth = margin + printableWidth - pillStartX - 3;
    const pillHeight = 6.4;

    // Row 1: Programme label (BLACK TEXT) + white rounded pill with black border
    const row1Y = headerY + 3.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0); // Black label
    doc.text('Programme', rightColStartX, row1Y + 4.6);

    // White rounded input field with black border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.roundedRect(pillStartX, row1Y, pillWidth, pillHeight, 3.2, 3.2, 'FD');

    if (sheet.programmeDisplay) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0); // Black text inside white pill
      const maxTextWidth = pillWidth - 6;
      let textToRender = sheet.programmeDisplay;
      if (doc.getTextWidth(textToRender) > maxTextWidth) {
        textToRender = textToRender.substring(0, 40) + '...';
      }
      doc.text(textToRender, pillStartX + 4, row1Y + 4.5);
    }

    // Row 2: chess NO label (BLACK TEXT) + white rounded pill with black border
    const row2Y = row1Y + 8.6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0); // Black label
    doc.text('chess NO', rightColStartX, row2Y + 4.6);

    // White rounded input field with black border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.roundedRect(pillStartX, row2Y, pillWidth, pillHeight, 3.2, 3.2, 'FD');

    if (sheet.chestNumberDisplay) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0); // Black text
      doc.text(sheet.chestNumberDisplay, pillStartX + 4, row2Y + 4.7);
    }

    // Row 3: Section Checkboxes (BLACK TEXT + BLACK BORDER SQUARE BOXES)
    const row3Y = row2Y + 11.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0); // Black section labels

    const checkSize = 4;
    const secItems = [
      { label: 'Senior', key: 'senior', textX: rightColStartX, boxX: rightColStartX + 16 },
      { label: 'Junior', key: 'junior', textX: rightColStartX + 32, boxX: rightColStartX + 47 },
      { label: 'Subjunior', key: 'subjunior', textX: rightColStartX + 65, boxX: rightColStartX + 88 },
    ];

    secItems.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Black text
      doc.text(item.label, item.textX, row3Y);

      // White square box with black border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.roundedRect(item.boxX, row3Y - 3.4, checkSize, checkSize, 0.6, 0.6, 'FD');

      // If pre-ticked
      if (tickSection && sheet.section?.toLowerCase() === item.key) {
        doc.setFillColor(0, 0, 0);
        doc.roundedRect(item.boxX + 0.6, row3Y - 2.8, checkSize - 1.2, checkSize - 1.2, 0.3, 0.3, 'F');
      }
    });

    // =========================================================
    // 2. COMPETITION BODY AREA (BORDERLESS BLANK CANVAS)
    // Completely borderless and padding-free
    // =========================================================
    const bodyStartY = headerY + headerHeight + 5;
    const bodyEndY = pageHeight - margin;
    const bodyHeight = bodyEndY - bodyStartY;

    if (rulingType === 'ruled') {
      const lineSpacing = 7.8;
      const totalLines = Math.floor(bodyHeight / lineSpacing);
      doc.setDrawColor(215, 220, 225);
      doc.setLineWidth(0.3);

      for (let l = 1; l <= totalLines; l++) {
        const lineY = bodyStartY + l * lineSpacing;
        doc.line(margin + 2, lineY, margin + printableWidth - 2, lineY);
      }
    }
  });

  return doc;
}

/**
 * Downloads the PDF with automatic logo fetching
 */
export async function downloadCompetitionPaperPdf(
  config: CompetitionPaperConfig,
  filename = 'Ayyuhannas_Competition_Paper.pdf'
): Promise<void> {
  const logoDataUrl = config.logoDataUrl || (await getLogoDataUrl('/images/logo/logoayyuhannas.png'));
  const doc = createCompetitionPaperPdf({ ...config, logoDataUrl });
  doc.save(filename);
}

/**
 * Opens PDF in a new browser tab with automatic logo fetching
 */
export async function openCompetitionPaperPdfInNewTab(
  config: CompetitionPaperConfig
): Promise<void> {
  const logoDataUrl = config.logoDataUrl || (await getLogoDataUrl('/images/logo/logoayyuhannas.png'));
  const doc = createCompetitionPaperPdf({ ...config, logoDataUrl });
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}
