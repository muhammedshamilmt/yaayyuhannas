'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, ShieldAlert, Eye, EyeOff, CheckCircle2, XCircle,
  Loader2, Database, FileJson, AlertTriangle, History, ChevronDown,
  ChevronUp, Trash2, X, Clock, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

// ── types ─────────────────────────────────────────────────────────────────────
type ColStatus = 'pending' | 'loading' | 'success' | 'error';

interface ColResult {
  collection: string;
  inserted: number;
  skipped: number;
  error?: string;
  status: ColStatus;
}

interface HistoryEntry {
  id: string;
  filename: string;
  timestamp: string;
  results: ColResult[];
  totalInserted: number;
  totalSkipped: number;
  hadErrors: boolean;
}

// ── colour helpers ────────────────────────────────────────────────────────────
const COL_TEXT: Record<string, string> = {
  users: 'text-blue-400', careers: 'text-purple-400',
  career_applications: 'text-indigo-400', internships: 'text-orange-400',
  internship_applications: 'text-amber-400', contacts: 'text-green-400',
  subscribers: 'text-teal-400', settings: 'text-zinc-400',
  analytics: 'text-pink-400', channels: 'text-cyan-400',
  clients: 'text-rose-400', gallery: 'text-fuchsia-400',
};
const colText = (n: string) => COL_TEXT[n] ?? 'text-primary';

// ── status icon ───────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: ColStatus }) {
  if (status === 'pending')
    return <div className="w-5 h-5 rounded-full border-2 border-border/40 flex-shrink-0" />;
  if (status === 'loading')
    return <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />;
  if (status === 'success')
    return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }} className="flex-shrink-0">
        <CheckCircle2 className="w-5 h-5 text-green-400" />
      </motion.div>
    );
  return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
}

// ── main component ────────────────────────────────────────────────────────────
export default function RestoreTab() {
  const fileRef = useRef<HTMLInputElement>(null);

  // file / parse
  const [file, setFile]         = useState<File | null>(null);
  const [parsed, setParsed]     = useState<Record<string, unknown[]> | null>(null);
  const [parseErr, setParseErr] = useState('');

  // confirm dialog
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [confirmErr, setConfirmErr]   = useState('');

  // running state
  const [running, setRunning]       = useState(false);
  const [cols, setCols]             = useState<ColResult[]>([]);
  const [bgToasts, setBgToasts]     = useState<ColResult[]>([]);   // live toast stack

  // history
  const [history, setHistory]           = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('restore_history');
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {}
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (historyLoaded) {
      localStorage.setItem('restore_history', JSON.stringify(history));
    }
  }, [history, historyLoaded]);

  // ── file handling ─────────────────────────────────────────────────────────
  const handleFile = (f: File) => {
    setFile(f); setParsed(null); setParseErr(''); setCols([]);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (Array.isArray(json)) {
          const name = f.name.replace(/-backup-\d+\.json$/, '').replace('.json', '');
          setParsed({ [name]: json });
        } else if (typeof json === 'object' && json !== null) {
          if (!Object.values(json).every(v => Array.isArray(v)))
            throw new Error('Each key must map to an array of documents.');
          setParsed(json as Record<string, unknown[]>);
        } else throw new Error('Unrecognised backup format.');
      } catch (e: any) { setParseErr(e.message ?? 'Invalid JSON'); }
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFile(null); setParsed(null); setParseErr('');
    setPassword(''); setCols([]); setShowConfirm(false);
    setConfirmErr(''); setShowPw(false);
  };

  // ── run restore (true background — dialog closes immediately) ────────────
  const runRestore = useCallback(() => {
    if (!parsed || !password) { setConfirmErr('Password is required.'); return; }
    setConfirmErr('');
    setShowConfirm(false);   // close dialog right away

    // Capture password value NOW before any state changes
    const pw = password;

    const initial: ColResult[] = Object.keys(parsed).map(name => ({
      collection: name, inserted: 0, skipped: 0, status: 'pending',
    }));
    setCols(initial);
    setRunning(true);

    // fire-and-forget — never awaited by the caller
    void (async () => {
      const final = [...initial];

      for (let i = 0; i < final.length; i++) {
        final[i] = { ...final[i], status: 'loading' };
        setCols([...final]);
        await new Promise(r => setTimeout(r, 280));

        try {
          const res = await fetch('/api/admin/database/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              password: pw,
              data: { [final[i].collection]: parsed[final[i].collection] },
            }),
          });
          const j = await res.json();
          if (!res.ok || !j.success) {
            final[i] = { ...final[i], status: 'error', error: j.error ?? 'Failed' };
          } else {
            const r = j.results[0];
            final[i] = { ...final[i], status: 'success', inserted: r.inserted, skipped: r.skipped };
          }
        } catch (e: any) {
          final[i] = { ...final[i], status: 'error', error: e.message };
        }

        setCols([...final]);

        // fire toast for this collection
        const done = { ...final[i] };
        setBgToasts(t => [...t, done]);
        setTimeout(() => setBgToasts(t => t.filter(x => x !== done)), 4000);

        await new Promise(r => setTimeout(r, 180));
      }

      // save to history
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        filename: file?.name ?? 'backup.json',
        timestamp: new Date().toLocaleString(),
        results: final,
        totalInserted: final.reduce((s, c) => s + c.inserted, 0),
        totalSkipped:  final.reduce((s, c) => s + c.skipped,  0),
        hadErrors: final.some(c => c.status === 'error'),
      };
      setHistory(h => [entry, ...h]);
      setRunning(false);
    })();
  }, [parsed, password, file]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── top row: drop zone + summary ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* drop zone */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <UploadCloud className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Upload Backup</h3>
            </div>
            <div
              onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => !running && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 transition-all
                ${running ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'}
                ${file && !parseErr ? 'border-primary/40 bg-primary/5' : 'border-border/40'}`}>
              <input ref={fileRef} type="file" accept=".json" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-primary" />
              </div>
              {file ? (
                <>
                  <p className="text-sm font-medium text-foreground text-center truncate max-w-full">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">Drop JSON backup here</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </>
              )}
            </div>

            {parseErr && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {parseErr}
              </div>
            )}

            {parsed && !parseErr && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collections detected</p>
                <div className="space-y-1">
                  {Object.entries(parsed).map(([name, docs]) => (
                    <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 border border-border/20">
                      <Database className={`w-3 h-3 flex-shrink-0 ${colText(name)}`} />
                      <span className="text-xs text-foreground flex-1">{name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{(docs as unknown[]).length}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  Duplicates will be skipped automatically
                </p>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={reset} disabled={running}>
                    <X className="w-3 h-3 mr-1" /> Clear
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:text-primary" onClick={() => setShowConfirm(true)} disabled={running}>
                    <UploadCloud className="w-3 h-3 mr-1" /> Restore
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* live progress */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {running
                  ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  : <RotateCcw className="w-4 h-4 text-muted-foreground" />}
                <h3 className="text-sm font-semibold text-foreground">
                  {running ? 'Restoring…' : cols.length > 0 ? 'Last Restore' : 'Progress'}
                </h3>
              </div>
              {cols.length > 0 && !running && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-green-400 font-medium">+{cols.reduce((s, c) => s + c.inserted, 0)}</span>
                  <span className="text-muted-foreground">{cols.reduce((s, c) => s + c.skipped, 0)} skipped</span>
                </div>
              )}
            </div>

            {cols.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <Database className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Upload a backup to see progress</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cols.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 border border-border/20">
                    <StatusIcon status={col.status} />
                    <span className={`text-sm flex-1 ${colText(col.collection)}`}>{col.collection}</span>
                    {col.status === 'success' && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-400">+{col.inserted}</span>
                        <span className="text-muted-foreground">{col.skipped} skip</span>
                      </div>
                    )}
                    {col.status === 'error' && (
                      <span className="text-xs text-red-400 truncate max-w-[150px]" title={col.error}>{col.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── history ── */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Restore History</h3>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No previous restores found in this browser.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(entry => (
                <div key={entry.id} className="border border-border/40 bg-white/[0.02] rounded-xl overflow-hidden">
                  <div 
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.hadErrors ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                        {entry.hadErrors ? <XCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.filename}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {entry.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-green-400">+{entry.totalInserted} docs</p>
                        <p className="text-xs text-muted-foreground">{entry.totalSkipped} skipped</p>
                      </div>
                      {expandedId === entry.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedId === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/20 bg-black/20"
                      >
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {entry.results.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                              <StatusIcon status={r.status} />
                              <span className="text-xs font-medium flex-1 truncate">{r.collection}</span>
                              <span className="text-xs text-green-400">+{r.inserted}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Confirm Password Dialog ── */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60]" onClick={() => setShowConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-luxury overflow-hidden">
                <div className="h-1 w-full bg-primary" />
                <div className="p-7 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <UploadCloud className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-bold text-foreground">Confirm Restore</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        You are about to restore <b>{Object.keys(parsed || {}).length}</b> collections from this backup. Existing documents with the same ID will be skipped.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Admin Password
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Enter admin password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setConfirmErr(''); }}
                        className="pr-10 bg-background border-border/60"
                        onKeyDown={e => e.key === 'Enter' && password && runRestore()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  {confirmErr && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 flex-shrink-0" /> {confirmErr}
                    </motion.p>
                  )}
                  
                  <div className="flex gap-3 pt-1">
                    <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
                    <Button variant="outline" className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" onClick={runRestore} disabled={!password}>
                      <UploadCloud className="w-4 h-4 mr-2" /> Start Restore
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast Stack ── */}
      <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {bgToasts.map(t => (
            <motion.div
              key={t.collection}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              layout
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-luxury border text-sm font-medium bg-background/95 backdrop-blur-md pointer-events-auto
                ${t.status === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}
            >
              <StatusIcon status={t.status} />
              <div className="flex flex-col">
                <span className="text-foreground">{t.collection}</span>
                {t.status === 'success' ? (
                  <span className="text-xs text-green-400">Restored +{t.inserted} ({t.skipped} skipped)</span>
                ) : (
                  <span className="text-xs text-red-400">{t.error || 'Failed'}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
