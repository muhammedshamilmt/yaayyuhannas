'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Server, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Save, 
  RefreshCw,
  Sparkles,
  Link2
} from 'lucide-react';

interface McpServerStatusCardProps {
  serverName: string;
  cloudServerUrl: string;
  masterAuthToken: string;
  readOnly: boolean;
  onUpdateSettings: (cloudServerUrl: string, masterAuthToken: string) => Promise<boolean>;
}

export function McpServerStatusCard({
  serverName,
  cloudServerUrl,
  masterAuthToken,
  readOnly,
  onUpdateSettings,
}: McpServerStatusCardProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(cloudServerUrl);
  const [editToken, setEditToken] = useState(masterAuthToken);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditUrl(cloudServerUrl);
  }, [cloudServerUrl]);

  useEffect(() => {
    setEditToken(masterAuthToken);
  }, [masterAuthToken]);

  // Ping status
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    status: 'online' | 'offline' | 'idle';
    latencyMs?: number;
    message?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    if (cloudServerUrl) {
      handlePing();
    }
  }, [cloudServerUrl]);

  const cleanUrl = (editUrl || cloudServerUrl || '').replace(/\/+$/, '');
  const sseEndpoint = `${cleanUrl}/sse`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onUpdateSettings(editUrl.trim(), editToken.trim());
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handlePing = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/admin/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping_server', url: editUrl || cloudServerUrl }),
      });
      const data = await res.json();
      if (data.success && data.status === 'online') {
        setPingResult({
          status: 'online',
          latencyMs: data.latencyMs,
          message: `Connected (${data.latencyMs}ms)`,
        });
      } else {
        setPingResult({
          status: 'offline',
          latencyMs: data.latencyMs,
          message: data.error || 'Server offline or unreachable',
        });
      }
    } catch (err: any) {
      setPingResult({
        status: 'offline',
        message: err.message || 'Connection failed',
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm transition-all">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Branding & Info */}
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-black p-1.5 shadow-md">
              <Image
                src="/images/logo/ayyuhannas-fest-logo.png"
                alt="Ayyuhannas Fest 2026"
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white shadow">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                Ayyuhannas Fest MCP
              </h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                {serverName}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              Live Model Context Protocol database connector for cloud AI clients
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Status pill */}
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                pingResult.status === 'online' 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                  : pingResult.status === 'offline'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  pingResult.status === 'online' ? 'bg-emerald-500 animate-pulse' : pingResult.status === 'offline' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <span>
                  {pingResult.status === 'online' ? pingResult.message : pingResult.status === 'offline' ? 'Offline' : 'Ready on Cloud'}
                </span>
              </div>

              {/* Read-Only Badge */}
              <div className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                <span>{readOnly ? 'Read-Only Guardrails' : 'Read-Write Mode'}</span>
              </div>

              {/* Protocol Spec */}
              <div className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-mono text-gray-600 font-semibold">
                MCP 2024-11-05 SSE
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Ping Action */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePing}
            disabled={isPinging}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isPinging ? 'animate-spin text-blue-600' : 'text-gray-500'}`} />
            <span>{isPinging ? 'Pinging...' : 'Test Connection'}</span>
          </button>

          <a
            href={cleanUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-500/20"
          >
            <span>Open Server</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Connection Endpoint Bar */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 md:grid-cols-2">
        {/* SSE URL */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-blue-600" />
              Live SSE Endpoint URL
            </label>
            <button
              onClick={() => copyToClipboard(sseEndpoint, setCopiedUrl)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
            >
              {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedUrl ? 'Copied!' : 'Copy SSE URL'}</span>
            </button>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://your-mcp-server.onrender.com"
              className="w-full rounded-lg border border-blue-400 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 border border-gray-200 shadow-sm">
              <span className="font-mono text-xs text-gray-800 truncate select-all">{sseEndpoint}</span>
            </div>
          )}
        </div>

        {/* Master Auth Token */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-purple-600" />
              Master Secret Token
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowToken(!showToken)}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition"
              >
                {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{showToken ? 'Hide' : 'Reveal'}</span>
              </button>
              <button
                onClick={() => copyToClipboard(editToken || masterAuthToken, setCopiedToken)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
              >
                {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedToken ? 'Copied!' : 'Copy Token'}</span>
              </button>
            </div>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editToken}
              onChange={(e) => setEditToken(e.target.value)}
              placeholder="Master auth token"
              className="w-full rounded-lg border border-blue-400 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-sm"
            />
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 border border-gray-200 shadow-sm font-mono text-xs text-gray-800">
              <span>{showToken ? masterAuthToken : '••••••••••••••••••••••••••••••••'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Settings Footer */}
      <div className="mt-4 flex items-center justify-end gap-2">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                setEditUrl(cloudServerUrl);
                setEditToken(masterAuthToken);
                setIsEditing(false);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-gray-500 hover:text-blue-600 transition flex items-center gap-1"
          >
            <span>Edit Server URL or Master Token</span>
          </button>
        )}
      </div>
    </div>
  );
}
