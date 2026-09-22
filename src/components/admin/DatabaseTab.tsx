'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Trash2, Download, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, HardDrive, FileJson, Loader2,
  ShieldAlert, Eye, EyeOff, ArchiveRestore, ChevronLeft,
  ChevronRight, Table2, Search, X, Braces, UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

// ── types ─────────────────────────────────────────────────────────────────────
interface CollectionStat { name: string; count: number; estimatedKB: number }
type ActionType = 'clear' | 'backup' | 'backup-all' | 'clear-all' | 'restore';
interface PendingAction {
  type: ActionType; collection?: string;
  label: string; confirmWord: string; destructive: boolean;
}

// ── SWR keys / fetcher ────────────────────────────────────────────────────────
const DB_KEY = '/api/admin/database';
const previewKey = (col: string, page: number) =>
  `/api/admin/database/preview?collection=${col}&page=${page}&limit=20`;
const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── colour map ────────────────────────────────────────────────────────────────
const COL_COLORS: Record<string, string> = {
  users: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  careers: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  career_applications: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  internships: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  internship_applications: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  contacts: 'bg-green-500/10 text-green-400 border-green-500/20',
  subscribers: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  settings: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  analytics: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  channels: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  clients: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  gallery: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
};
const defaultColor = 'bg-primary/10 text-primary border-primary/20';

// ── JSON syntax highlighter ───────────────────────────────────────────────────
function JsonHighlight({ obj }: { obj: Record<string, unknown> }) {
  const lines = JSON.stringify(obj, null, 2).split('\n');
  return (
    <>
      {lines.map((line, i) => {
        // key: "value"
        const keyMatch = line.match(/^(\s*)("[\w$@.-]+")\s*:/);
        const strMatch = line.match(/"([^"]*)"/g);
        const numMatch = /:\s*(-?\d+\.?\d*)/.test(line);
        const boolMatch = /:\s*(true|false)/.test(line);
        const nullMatch = /:\s*null/.test(line);

        if (keyMatch) {
          const indent = keyMatch[1];
          const key = keyMatch[2];
          const rest = line.slice(indent.length + key.length + 1); // after "key":
          let valueEl: React.ReactNode = <span className="text-foreground">{rest}</span>;
          if (boolMatch) valueEl = <span>{rest.replace(/(true|false)/, '')}<span className="text-purple-400">{rest.match(/(true|false)/)?.[0]}</span></span>;
          else if (nullMatch) valueEl = <span>{rest.replace('null', '')}<span className="text-zinc-500">null</span></span>;
          else if (numMatch) valueEl = <span>{rest.replace(/(-?\d+\.?\d*)/, '')}<span className="text-blue-400">{rest.match(/(-?\d+\.?\d*)/)?.[0]}</span></span>;
          else if (strMatch && rest.includes('"')) {
            // truncate long string values (e.g. base64) — match `: "value"` pattern
            const inner = rest.match(/^(\s*:\s*")(.+?)("[\s,]*)$/);
            if (inner && inner[2].length > TRUNC) {
              valueEl = (
                <span className="text-green-400" title={inner[2]}>
                  {inner[1]}{inner[2].slice(0, TRUNC)}<span className="text-muted-foreground">…</span>{inner[3]}
                </span>
              );
            } else {
              valueEl = <span className="text-green-400">{rest}</span>;
            }
          }
          return (
            <span key={i} className="block">
              <span className="select-none">{indent}</span>
              <span className="text-yellow-300">{key}</span>
              <span className="text-muted-foreground">:</span>
              {valueEl}{'\n'}
            </span>
          );
        }
        // brackets / braces
        if (/^\s*[{}\[\],]/.test(line))
          return <span key={i} className="block text-muted-foreground/60">{line}{'\n'}</span>;
        return <span key={i} className="block text-foreground">{line}{'\n'}</span>;
      })}
    </>
  );
}

// ── cell renderer ─────────────────────────────────────────────────────────────
const TRUNC = 80; // chars shown before "…"

function CellValue({ val }: { val: unknown }) {
  if (val === null || val === undefined)
    return <span className="text-muted-foreground/40 italic text-xs">null</span>;
  if (typeof val === 'boolean')
    return <span className={val ? 'text-green-400' : 'text-red-400'}>{String(val)}</span>;
  if (typeof val === 'number')
    return <span className="text-blue-400 font-mono">{val}</span>;
  if (typeof val === 'object') {
    const str = JSON.stringify(val);
    const short = str.length > TRUNC ? str.slice(0, TRUNC) + '…' : str;
    return (
      <span className="text-muted-foreground font-mono text-xs block cursor-default" title={str}>
        {short}
      </span>
    );
  }
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s))
    return <span className="text-yellow-400 font-mono text-xs">{new Date(s).toLocaleString()}</span>;
  const short = s.length > TRUNC ? s.slice(0, TRUNC) + '…' : s;
  return (
    <span className="text-foreground block cursor-default" title={s}>
      {short}
    </span>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function DatabaseTab() {
  const { data: listData, isLoading: listLoading, error: listError } =
    useSWR<{ success: boolean; collections: CollectionStat[] }>(
      DB_KEY, fetcher, { revalidateOnFocus: false, dedupingInterval: 30_000 }
    );

  const collections: CollectionStat[] = listData?.collections ?? [];
  const totalDocs = collections.reduce((s, c) => s + c.count, 0);
  const totalKB = collections.reduce((s, c) => s + c.estimatedKB, 0);

  // ── selected collection + pagination ─────────────────────────────────────
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'json' | 'table'>('json');

  const { data: previewData, isLoading: previewLoading } = useSWR(
    selected ? previewKey(selected, page) : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10_000, keepPreviousData: true }
  );

  const docs: Record<string, unknown>[] = previewData?.docs ?? [];
  const totalPages: number = previewData?.pages ?? 1;
  const totalRows: number = previewData?.total ?? 0;

  // derive columns from first doc
  const columns = docs.length > 0 ? Object.keys(docs[0]) : [];

  // client-side search filter (searches stringified row)
  const filtered = search.trim()
    ? docs.filter(d => JSON.stringify(d).toLowerCase().includes(search.toLowerCase()))
    : docs;

  const selectCollection = (name: string) => {
    setSelected(name);
    setPage(1);
    setSearch('');
    // keep viewMode as user preference across collections
  };

  // ── dialog state ─────────────────────────────────────────────────────────
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [password, setPassword] = useState('');
  const [confirmInput, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [dialogErr, setDialogErr] = useState('');
  const [acting, setActing] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  // ── toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const openDialog = (action: PendingAction) => {
    setPending(action); setPassword(''); setConfirm(''); setShowPw(false); setDialogErr(''); setRestoreFile(null);
  };
  const closeDialog = () => {
    if (acting) return;
    setPending(null); setPassword(''); setConfirm(''); setDialogErr(''); setRestoreFile(null);
  };

  const execute = useCallback(async () => {
    if (!pending) return;
    if (!password) { setDialogErr('Password is required.'); return; }
    if (confirmInput !== pending.confirmWord) {
      setDialogErr(`Type exactly "${pending.confirmWord}" to confirm.`); return;
    }
    setActing(true); setDialogErr('');
    try {
      if (pending.type === 'restore') {
        if (!restoreFile) { setDialogErr('Please select a backup JSON file to restore.'); return; }
        const text = await restoreFile.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          setDialogErr('Invalid JSON file format.'); setActing(false); return;
        }

        const res = await fetch('/api/admin/database/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, password }),
        });
        
        const j = await res.json();
        if (!res.ok || !j.success) { setDialogErr(j.error ?? 'Failed to restore'); setActing(false); return; }
        
        await mutate(DB_KEY);
        if (selected) await mutate(previewKey(selected, page));
        closeDialog();
        showToast('Database successfully restored from backup.', true);
        return;
      }

      const res = await fetch(DB_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pending.type, collection: pending.collection, password }),
      });
      if (pending.type === 'backup' || pending.type === 'backup-all') {
        if (!res.ok) { const j = await res.json(); setDialogErr(j.error ?? 'Failed'); setActing(false); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const cd = res.headers.get('Content-Disposition') ?? '';
        const name = cd.match(/filename="(.+?)"/)?.[1] ?? 'backup.json';
        a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
        closeDialog(); showToast(`Backup downloaded: ${name}`, true); return;
      }
      const j = await res.json();
      if (!res.ok || !j.success) { setDialogErr(j.error ?? 'Failed'); setActing(false); return; }
      await mutate(DB_KEY);
      if (selected === pending.collection) await mutate(previewKey(pending.collection!, page));
      closeDialog();
      const label = pending.type === 'clear-all'
        ? `Entire database cleared — ${j.deleted} documents removed.`
        : `Cleared "${pending.collection}" — ${j.deleted} documents removed.`;
      showToast(label, true);
    } catch (e: any) { setDialogErr(e.message ?? 'Network error'); }
    finally { setActing(false); }
  }, [pending, password, confirmInput, selected, page]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Collections', value: listLoading ? '…' : collections.length, icon: Database, color: 'text-primary' },
          { label: 'Total Docs', value: listLoading ? '…' : totalDocs.toLocaleString(), icon: FileJson, color: 'text-blue-400' },
          { label: 'Est. Size', value: listLoading ? '…' : totalKB > 1024 ? `${(totalKB / 1024).toFixed(1)} MB` : `${totalKB} KB`, icon: HardDrive, color: 'text-orange-400' },
          { label: 'Status', value: listError ? 'Error' : listLoading ? 'Connecting…' : 'Connected', icon: CheckCircle2, color: listError ? 'text-red-400' : 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-gradient-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-base font-bold text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Full-width DB explorer card ── */}
      <Card className="bg-gradient-card border-border/50 overflow-hidden">
        <div className="flex h-[700px] overflow-hidden">

          {/* ── LEFT column: collection list ── */}
          <div className="w-64 flex-shrink-0 border-r border-border/40 flex flex-col">
            {/* header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-border/40 bg-white/[0.05]">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collections</span>
              <div className="flex gap-1">
                <button onClick={() => mutate(DB_KEY)} title="Refresh"
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                  <RefreshCw className={`w-3 h-3 ${listLoading ? 'animate-spin' : ''}`} />
                </button>
                <button title="Backup all"
                  onClick={() => openDialog({ type: 'backup-all', label: 'Backup Entire Database', confirmWord: 'Backup Files', destructive: false })}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <ArchiveRestore className="w-3 h-3" />
                </button>
                <button title="Restore Database"
                  onClick={() => openDialog({ type: 'restore', label: 'Restore Database', confirmWord: 'Restore Data', destructive: false })}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                  <UploadCloud className="w-3 h-3" />
                </button>
                <button title="Clear entire database"
                  onClick={() => openDialog({ type: 'clear-all', label: 'Clear Entire Database', confirmWord: 'Delete', destructive: true })}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto">
              {listLoading && Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="px-3 py-2.5 animate-pulse flex items-center gap-2 border-b border-border/20">
                  <div className="w-3 h-3 rounded bg-muted flex-shrink-0" />
                  <div className="h-3 rounded bg-muted flex-1" />
                  <div className="h-3 w-6 rounded bg-muted" />
                </div>
              ))}
              {!listLoading && collections.map(col => {
                const isActive = selected === col.name;
                return (
                  <button key={col.name} onClick={() => selectCollection(col.name)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition-all group border-b border-border/20
                      ${isActive
                        ? 'bg-primary/10 border-l-2 border-l-primary'
                        : 'hover:bg-white/10 border-l-2 border-l-transparent'}`}>
                    <Database className={`w-3.5 h-3.5 flex-shrink-0 transition-colors
                      ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <span className={`text-sm truncate flex-1 transition-colors
                      ${isActive ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {col.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono flex-shrink-0 tabular-nums">
                      {col.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT column: preview pane ── */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
            {!selected ? (
              /* empty state */
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Table2 className="w-8 h-8 text-primary/40" />
                </div>
                <p className="text-muted-foreground text-sm">Select a collection from the left to preview its data</p>
              </div>
            ) : (
              <>
                {/* toolbar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-white/[0.02] flex-wrap flex-shrink-0">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${COL_COLORS[selected] ?? defaultColor}`}>
                    <Database className="w-3 h-3" />{selected}
                  </div>
                  <span className="text-xs text-muted-foreground">{totalRows.toLocaleString()} docs</span>

                  <div className="ml-auto flex items-center gap-2">
                    {/* search */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search rows…"
                        className="pl-7 pr-6 py-1.5 text-xs rounded-lg bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-36" />
                      {search && (
                        <button onClick={() => setSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* view toggle */}
                    <div className="flex items-center bg-background border border-border/60 rounded-lg p-0.5 gap-0.5">
                      <button
                        onClick={() => setViewMode('json')}
                        title="JSON view"
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all
                          ${viewMode === 'json' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Braces className="w-3 h-3" /> JSON
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        title="Table view"
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all
                          ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Table2 className="w-3 h-3" /> Table
                      </button>
                    </div>

                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs"
                      onClick={() => openDialog({ type: 'backup', collection: selected, label: `Backup "${selected}"`, confirmWord: 'Backup Files', destructive: false })}>
                      <Download className="w-3 h-3 mr-1" /> Backup
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => openDialog({ type: 'clear', collection: selected, label: `Clear "${selected}"`, confirmWord: 'Delete', destructive: true })}>
                      <Trash2 className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  </div>
                </div>

                {/* data area — scrolls in ALL directions, never bleeds to page */}
                <div className="flex-1 min-h-0 overflow-auto relative">
                  {previewLoading ? (
                    <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-sm">
                      <Table2 className="w-6 h-6 opacity-30" />
                      {search ? 'No rows match your search.' : 'This collection is empty.'}
                    </div>
                  ) : viewMode === 'json' ? (
                    /* ── JSON view ── */
                    <div className="p-4 space-y-2">
                      {filtered.map((row, ri) => (
                        <motion.div key={`${String(row['_id'] ?? row['id'] ?? '')}-${ri}`}
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: ri * 0.02 }}
                          className="group rounded-xl border border-border/30 bg-white/[0.02] hover:bg-white/[0.08] hover:border-border/60 transition-all overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 bg-white/[0.05]">
                            <span className="text-xs font-mono text-muted-foreground/50 select-none tabular-nums w-6">
                              {(page - 1) * 20 + ri + 1}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono truncate flex-1">
                              {String(row['_id'] ?? row['id'] ?? '')}
                            </span>
                          </div>
                          <pre className="px-4 py-3 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                            <JsonHighlight obj={row} />
                          </pre>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    /* ── Table view: isolated scroll container ── */
                    <div className="absolute inset-0 overflow-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <table className="w-max text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/10 border-b border-border/50 sticky top-0 z-100">
                            <th className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider w-10 select-none bg-white/10">#</th>
                            {columns.map(col => (
                              <th key={col} className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap bg-white/10">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((row, ri) => (
                            <motion.tr key={`${String(row['_id'] ?? row['id'] ?? '')}-${ri}`}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              transition={{ delay: ri * 0.015 }}
                              className="border-b border-border/20 hover:bg-white/[0.05] transition-colors -z-10 " >
                              <td className="px-3 py-2 text-muted-foreground/40 font-mono select-none tabular-nums">
                                {(page - 1) * 20 + ri + 1}
                              </td>
                              {columns.map(col => (
                                <td key={col} className="px-3 py-2 whitespace-nowrap">
                                  <CellValue val={row[col]} />
                                </td>
                              ))}
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* pagination — pinned to bottom */}
                {!previewLoading && totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30 bg-white/[0.02] flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      Page {page} / {totalPages} · {totalRows.toLocaleString()} rows
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                        return (
                          <button key={p} onClick={() => setPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                              ${p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`}>
                            {p}
                          </button>
                        );
                      })}
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </Card>

      {/* ── Confirmation Dialog ── */}
      <AnimatePresence>
        {pending && (
          <>
            <motion.div key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60]" onClick={closeDialog} />
            <motion.div key="dialog"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-luxury overflow-hidden">
                <div className={`h-1 w-full ${pending.destructive ? 'bg-red-500' : 'bg-primary'}`} />
                <div className="p-7 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${pending.destructive ? 'bg-red-500/10' : pending.type === 'restore' ? 'bg-blue-500/10' : 'bg-primary/10'}`}>
                      {pending.destructive ? <AlertTriangle className="w-5 h-5 text-red-400" /> : pending.type === 'restore' ? <UploadCloud className="w-5 h-5 text-blue-400" /> : <ArchiveRestore className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-bold text-foreground">{pending.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pending.destructive
                          ? pending.type === 'clear-all'
                            ? 'This will permanently delete ALL documents in ALL collections. This cannot be undone.'
                            : 'This will permanently delete all documents. This cannot be undone.'
                          : pending.type === 'restore'
                            ? 'Upload a JSON backup file to restore data.'
                            : 'A JSON backup file will be downloaded to your device.'}
                      </p>
                    </div>
                  </div>
                  {pending.type === 'restore' && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">Backup File (JSON)</Label>
                      <Input type="file" accept=".json" onChange={e => setRestoreFile(e.target.files?.[0] || null)} className="bg-background border-border/60 text-xs" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Admin Password
                    </Label>
                    <div className="relative">
                      <Input type={showPw ? 'text' : 'password'} placeholder="Enter admin password"
                        value={password} onChange={e => { setPassword(e.target.value); setDialogErr(''); }}
                        className="pr-10 bg-background border-border/60" />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">
                      Type{' '}
                      <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${pending.destructive ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'}`}>
                        {pending.confirmWord}
                      </code>{' '}
                      to confirm
                    </Label>
                    <Input placeholder={pending.confirmWord} value={confirmInput}
                      onChange={e => { setConfirm(e.target.value); setDialogErr(''); }}
                      className="bg-background border-border/60" />
                  </div>
                  {dialogErr && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 flex-shrink-0" /> {dialogErr}
                    </motion.p>
                  )}
                  <div className="flex gap-3 pt-1">
                    <Button variant="outline" className="flex-1" onClick={closeDialog} disabled={acting}>Cancel</Button>
                    <Button
                      className={`flex-1 ${pending.destructive ? 'bg-red-500 hover:bg-red-600 text-white border-red-600' : ''}`}
                      variant={pending.destructive ? 'outline' : 'luxury'}
                      onClick={execute}
                      disabled={acting || !password || confirmInput !== pending.confirmWord}>
                      {acting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : pending.destructive ? <Trash2 className="w-4 h-4 mr-2" /> : pending.type === 'restore' ? <UploadCloud className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                      {acting ? 'Processing…' : pending.destructive ? 'Delete' : pending.type === 'restore' ? 'Restore Data' : 'Download Backup'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[70]">
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-luxury border text-sm font-medium
              ${toast.ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {toast.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
