'use client';

import React from 'react';
import { ProgrammeWithCandidates, FestExportMeta, ScheduledProgrammeItem } from './SchedulePdfGenerator';
import { Calendar, Clock, MapPin, Sparkles, Users, Award, FileText, CheckCircle2 } from 'lucide-react';

interface SchedulePreviewDocumentProps {
  programmes: ProgrammeWithCandidates[];
  meta: FestExportMeta & {
    scheduleTitle?: string;
    scheduleSubtitle?: string;
    headerDate?: string;
  };
  includeScoringColumns?: boolean;
  pageBreakBetweenProgrammes?: boolean;
  viewDensity?: 'compact' | 'comfortable';
  activeViewMode?: 'lineup' | 'callsheet';
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

export const SchedulePreviewDocument: React.FC<SchedulePreviewDocumentProps> = ({
  programmes,
  meta,
  includeScoringColumns = true,
  pageBreakBetweenProgrammes = false,
  viewDensity = 'comfortable',
  activeViewMode = 'lineup',
}) => {
  // Group programmes by Day
  const dayGroupsMap = new Map<string, { dayName: string; dayDate: string; items: ProgrammeWithCandidates[] }>();

  // Pre-seed with meta.daysConfig if provided
  if (meta.daysConfig && meta.daysConfig.length > 0) {
    meta.daysConfig.forEach((d) => {
      dayGroupsMap.set(d.name, {
        dayName: d.name,
        dayDate: d.date,
        items: [],
      });
    });
  }

  // Filter programmes if a specific day is requested
  const filteredProgrammes = meta.exportDayFilter && meta.exportDayFilter !== 'all'
    ? programmes.filter(
        (p) => (p.day || 'Day 1').toLowerCase() === meta.exportDayFilter!.toLowerCase()
      )
    : programmes;

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

  // Displayed Date (updates to that day's date if filtering by day)
  let dateText = meta.headerDate || meta.generatedDate || '27 September 2026';
  if (meta.exportDayFilter && meta.exportDayFilter !== 'all') {
    const matchedDay = meta.daysConfig?.find(
      (d) => d.name.toLowerCase() === meta.exportDayFilter!.toLowerCase()
    );
    if (matchedDay && matchedDay.date) {
      dateText = matchedDay.date;
    }
  }

  return (
    <div
      id="printable-schedule-document"
      className="bg-white text-slate-800 shadow-xl rounded-2xl border border-slate-200 overflow-hidden font-sans p-6 sm:p-10 max-w-4xl mx-auto print:p-0 print:shadow-none print:border-none print:max-w-none"
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-schedule-document,
          #printable-schedule-document * {
            visibility: visible;
          }
          #printable-schedule-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Header matching Screenshot: Title, Subtitle, Date, Golden Rule */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-1">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172554] tracking-tight">
            {meta.scheduleTitle || 'Programme Schedule'}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1 font-medium">
            {meta.scheduleSubtitle || 'Event line-up by category'}
          </p>
        </div>
        <div className="mt-2 sm:mt-1 text-slate-800 font-semibold text-sm sm:text-base tracking-tight text-left sm:text-right">
          Date: {dateText}
        </div>
      </div>

      {/* Golden Accent Line (#c89326 / RGB 200, 147, 38) */}
      <div className="h-[3.5px] bg-[#c89326] w-full mt-3 mb-8 rounded-full" />

      {/* Empty State */}
      {filteredProgrammes.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Calendar className="w-16 h-16 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
          <h3 className="text-lg font-semibold text-slate-700">No Programmes Added Yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {meta.exportDayFilter && meta.exportDayFilter !== 'all'
              ? `No programmes found for ${meta.exportDayFilter}. Add programmes to this day or switch to another day.`
              : 'Add programmes or custom events from the left builder panel to generate your schedule line-up.'}
          </p>
        </div>
      ) : activeViewMode === 'callsheet' ? (
        // Detailed Call Sheet View
        <div className="space-y-8">
          {filteredProgrammes.map((prog, index) => (
            <div
              key={prog.id || index}
              className="page-break-avoid border border-slate-200 rounded-xl overflow-hidden shadow-xs"
            >
              <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-xs">
                    #{index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-200 text-slate-800">
                        {prog.programmeCode}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                        {prog.programmeName}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="capitalize font-medium text-slate-600">{prog.day || 'Day 1'}</span>
                      <span>&bull;</span>
                      <span className="capitalize font-medium text-slate-600">{prog.category}</span>
                      <span>&bull;</span>
                      <span className="uppercase font-medium text-slate-600">{prog.section}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {prog.time && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {prog.time}
                    </span>
                  )}
                  {prog.stage && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      {prog.stage}
                    </span>
                  )}
                </div>
              </div>
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-12 text-center">Sl</th>
                    <th className="py-2.5 px-4 w-44">Team</th>
                    <th className="py-2.5 px-3 w-28 text-center">Chest No</th>
                    <th className="py-2.5 px-4">Candidate Name</th>
                    <th className="py-2.5 px-3 w-24 text-center">Section</th>
                    {includeScoringColumns && (
                      <>
                        <th className="py-2.5 px-3 w-28 text-center">Marks / Score</th>
                        <th className="py-2.5 px-4 w-36">Remarks</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prog.teamsData.map((team, tIdx) => {
                    const cands = team.candidates.length > 0 ? team.candidates : [{ chestNumber: '-', name: 'No candidate registered', section: '-' }];
                    return cands.map((cand, cIdx) => (
                      <tr key={`${team.teamCode}-${cIdx}`} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{tIdx + 1}.{cIdx + 1}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{team.teamName || team.teamCode}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{cand.chestNumber}</td>
                        <td className="py-2.5 px-4 text-slate-800">{cand.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600 capitalize">{cand.section}</td>
                        {includeScoringColumns && (
                          <>
                            <td className="py-2.5 px-3 text-center bg-slate-50/50">
                              <div className="w-16 h-7 mx-auto border border-dashed border-slate-300 rounded-sm"></div>
                            </td>
                            <td className="py-2.5 px-4 bg-slate-50/50">
                              <div className="w-full h-7 border-b border-dashed border-slate-300"></div>
                            </td>
                          </>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        // Exact Layout from Screenshot: Day blocks with Navy Header, Golden Table Header, and Clean Alternating Rows
        <div className="space-y-8">
          {dayGroups.map((dayGroup) => (
            <div
              key={dayGroup.dayName}
              className="page-break-avoid border border-slate-200 overflow-hidden shadow-2xs rounded-none"
            >
              {/* Navy Day Header Bar (#192744 / Deep Navy) */}
              <div className="bg-[#192744] text-white px-5 py-3.5 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold tracking-wide">
                  {dayGroup.dayName}
                </h2>
                <span className="text-xs sm:text-sm font-medium text-slate-200">
                  {dayGroup.dayDate}
                </span>
              </div>

              {/* Golden Table Header Bar (#c89326 / Gold) */}
              <div className="bg-[#c89326] text-white text-xs sm:text-sm font-bold grid grid-cols-12 px-5 py-2.5 items-center">
                <div className="col-span-2 text-center sm:text-left font-bold">Time</div>
                <div className="col-span-5 font-bold">Event</div>
                <div className="col-span-5 font-bold">Category</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-200 text-xs sm:text-sm">
                {dayGroup.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`grid grid-cols-12 px-5 py-3.5 items-center transition-colors ${
                      idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'
                    }`}
                  >
                    {/* Time Column (Bold Navy #1e3a8a) */}
                    <div className="col-span-2 text-center sm:text-left font-bold text-[#1e3a8a] text-sm">
                      {item.time || '—'}
                    </div>

                    {/* Event Column (Bold Dark Slate #0f172a) */}
                    <div className="col-span-5 font-bold text-slate-900 text-sm pr-3">
                      {item.programmeName}
                    </div>

                    {/* Category Column (Italic Slate #475569) */}
                    <div className="col-span-5 italic text-slate-700 text-sm font-normal">
                      {formatCategoryText(item)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
