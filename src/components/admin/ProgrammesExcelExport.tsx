'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Programme } from '@/types';

interface ProgrammesExcelExportProps {
  programmes: Programme[];
  filterCategory?: string;
  filterSubcategory?: string;
  filterSection?: string;
  filterPositionType?: string;
  searchQuery?: string;
  className?: string;
}

export default function ProgrammesExcelExport({
  programmes,
  filterCategory = '',
  filterSubcategory = '',
  filterSection = '',
  filterPositionType = '',
  searchQuery = '',
  className = ''
}: ProgrammesExcelExportProps) {
  const [exporting, setExporting] = useState(false);

  const getFilteredProgrammes = () => {
    return programmes.filter((programme) => {
      if (filterCategory && programme.category !== filterCategory) return false;
      if (filterCategory === 'arts' && filterSubcategory && programme.subcategory !== filterSubcategory) return false;
      if (filterSection && programme.section !== filterSection) return false;
      if (filterPositionType && programme.positionType !== filterPositionType) return false;
      if (
        searchQuery &&
        !programme.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !programme.code?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  };

  const getExportFileName = (extension: string) => {
    const filterParts: string[] = [];
    if (filterSection) filterParts.push(filterSection.toUpperCase());
    if (filterCategory) filterParts.push(filterCategory.toUpperCase());
    if (filterCategory === 'arts' && filterSubcategory) filterParts.push(filterSubcategory.toUpperCase());
    if (filterPositionType) filterParts.push(filterPositionType.toUpperCase());

    const dateStr = new Date().toISOString().split('T')[0];
    const prefix = filterParts.length > 0 ? `Programmes_${filterParts.join('_')}` : 'Wattaqa_Programmes_List';
    return `${prefix}_${dateStr}.${extension}`;
  };

  const handleExportExcel = () => {
    try {
      setExporting(true);
      const dataToExport = getFilteredProgrammes();

      if (dataToExport.length === 0) {
        alert('No programmes to export with current filters!');
        setExporting(false);
        return;
      }

      // Prepare worksheet rows with clear, professional headers
      const worksheetData = dataToExport.map((p, index) => {
        const isOver = p.status === 'completed' || (p as any).isOver === true;
        const req = p.requiredParticipants || 1;
        const max = (p.maxParticipants && String(p.maxParticipants).trim() !== '') ? p.maxParticipants : req;

        return {
          'Sl. No.': index + 1,
          'Code': p.code || '',
          'Programme Name': p.name || '',
          'Category': p.category ? p.category.toUpperCase() : 'UNKNOWN',
          'Subcategory': p.subcategory ? p.subcategory.toUpperCase() : '-',
          'Section': p.section ? p.section.toUpperCase() : 'GENERAL',
          'Position Type': p.positionType ? p.positionType.toUpperCase() : 'INDIVIDUAL',
          'Required / Team': Number(req),
          'Max / Team': Number(max),
          '1st Place Points': p.firstPoints ?? 10,
          '2nd Place Points': p.secondPoints ?? 8,
          '3rd Place Points': p.thirdPoints ?? 5,
          'Participation Points': p.participationPoints ?? 2,
          'Status': isOver ? 'OVER' : 'ACTIVE'
        };
      });

      // Create Worksheet
      const ws = XLSX.utils.json_to_sheet(worksheetData);

      // Set optimal column widths
      ws['!cols'] = [
        { wch: 8 },  // Sl. No.
        { wch: 12 }, // Code
        { wch: 35 }, // Programme Name
        { wch: 14 }, // Category
        { wch: 14 }, // Subcategory
        { wch: 14 }, // Section
        { wch: 16 }, // Position Type
        { wch: 16 }, // Required / Team
        { wch: 14 }, // Max / Team
        { wch: 16 }, // 1st Points
        { wch: 16 }, // 2nd Points
        { wch: 16 }, // 3rd Points
        { wch: 18 }, // Participation Points
        { wch: 12 }  // Status
      ];

      // Create Workbook and append sheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Programmes');

      // Generate filename and trigger download
      const fileName = getExportFileName('xlsx');
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export programmes to Excel. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleExportExcel}
        disabled={exporting}
        className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all duration-150 disabled:opacity-50 text-sm"
        title="Export filtered programmes as Excel (.xlsx) file"
      >
        <span className="mr-2 text-base">📊</span>
        {exporting ? 'Exporting...' : 'Export to Excel (.xlsx)'}
      </button>
    </div>
  );
}
