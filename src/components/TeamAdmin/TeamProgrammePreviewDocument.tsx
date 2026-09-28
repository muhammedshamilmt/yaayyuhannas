'use client';

import React from 'react';
import { TeamProgrammeCardItem, TeamExportMeta } from './TeamProgrammePdfGenerator';
import { Award, Calendar, CheckCircle2, FileText, Layers, MapPin, Sparkles, Users } from 'lucide-react';

interface TeamProgrammePreviewDocumentProps {
  items: TeamProgrammeCardItem[];
  meta: TeamExportMeta;
  printId?: string;
}

export const TeamProgrammePreviewDocument: React.FC<TeamProgrammePreviewDocumentProps> = ({
  items,
  meta,
  printId = 'printable-team-programmes-doc',
}) => {
  const registeredCount = items.filter((i) => i.isRegistered && i.candidates.length > 0).length;
  const totalCandidates = items.reduce((acc, i) => acc + i.candidates.length, 0);

  return (
    <div
      id={printId}
      className="bg-white text-slate-800 shadow-xl rounded-2xl border border-slate-200 overflow-hidden font-sans p-6 sm:p-8 max-w-6xl mx-auto print:p-0 print:shadow-none print:border-none print:max-w-none"
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #${printId},
          #${printId} * {
            visibility: visible;
          }
          #${printId} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          .team-grid-3 {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Document Top Header */}
      <div
        className="rounded-xl p-5 sm:p-6 text-white shadow-md mb-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #162138 0%, #0f172a 100%)`,
          borderBottom: `4px solid ${meta.teamColor || '#10B981'}`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-md border-2 border-white/20 shrink-0"
              style={{ backgroundColor: meta.teamColor || '#3B82F6' }}
            >
              {meta.teamCode}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-300">
                  {meta.festivalName || 'Arts & Sports Festival'}
                </span>
                <span className="text-white/40">&bull;</span>
                <span className="text-xs font-semibold text-slate-300">Official Roster</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white ">
                {meta.teamName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Team Programme Entries &amp; Registered Candidate List
              </p>
            </div>
          </div>

          {/* Right Statistics Badges */}
          <div className="flex items-center gap-3 text-right">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15">
              <div className="text-lg font-extrabold text-white leading-tight">
                {items.length}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-300">Programmes</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15">
              <div className="text-lg font-extrabold text-emerald-400 leading-tight">
                {totalCandidates}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-300">Candidates</div>
            </div>

            <div className="text-left sm:text-right hidden md:block pl-2 border-l border-white/15">
              <div className="text-[11px] font-semibold text-slate-300">Date Generated</div>
              <div className="text-xs font-bold text-white">{meta.generatedDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-700">No Programmes Selected</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Please select at least one programme from the selection controls to generate the candidate roster.
          </p>
        </div>
      ) : (
        /* Exact 3-column Grid Layout (user requested: "use the grid corl 3 as each col for each progreamme") */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 team-grid-3">
          {items.map((item, index) => {
            const isReg = item.isRegistered && item.candidates.length > 0;
            return (
              <div
                key={item.programmeId || item.programmeCode || index}
                className="page-break-avoid border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                {/* Card Top Header */}
                <div>
                  <div
                    className={`p-3 border-b flex items-start justify-between gap-2 ${isReg ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-50/50 border-slate-200'
                      }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: meta.teamColor || '#3B82F6' }}
                      >
                        {item.programmeCode}
                      </span>
                      <h3
                        className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2"
                        title={item.programmeName}
                      >
                        {item.programmeName}
                      </h3>
                    </div>

                    {isReg ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {item.candidates.length}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        Empty
                      </span>
                    )}
                  </div>

                  {/* Section, Category, Position Tag Bar */}
                  <div className="px-3 py-1.5 bg-white border-b border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                    <span className="capitalize">{item.section}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{item.category}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{item.positionType}</span>
                  </div>

                  {/* Candidate Entries Table */}
                  <div className="p-3">
                    {!isReg ? (
                      <div className="py-4 text-center text-xs text-slate-400 italic">
                        No candidates registered yet
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {item.candidates.map((cand, cIdx) => (
                          <div
                            key={`${cand.chestNumber}-${cIdx}`}
                            className="py-1.5 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[11px] shrink-0 border border-slate-200">
                                {cand.chestNumber}
                              </span>
                              <span className="font-medium text-slate-800 truncate text-xs">
                                {cand.name}
                              </span>
                            </div>

                            {cand.section && (
                              <span className="text-[10px] text-slate-400 uppercase shrink-0 font-medium">
                                {cand.section}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Requirement note */}
                <div className="px-3 py-1.5 bg-slate-50/70 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Req: {item.requiredParticipants || 1} participant(s)</span>
                  <span className="font-mono text-[9px] text-slate-300">#{index + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
