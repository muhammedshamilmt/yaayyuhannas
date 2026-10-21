'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Copy, 
  Check, 
  Lock, 
  UserCheck, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function McpUserAccessVerifier() {
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [isChecking, setIsChecking] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testEmail.trim()) return;

    setIsChecking(true);
    setVerificationResult(null);

    try {
      const res = await fetch('/api/mcp/my-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err: any) {
      setVerificationResult({
        authorized: false,
        error: err.message || 'Verification request failed',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          Email Authorization & Connection Verifier
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Verify whether an email is permitted to connect to the MCP server. Users must authenticate with their approved email to unlock their personal connector strings.
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="email"
            required
            placeholder="Enter user or captain email to test..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={isChecking}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm active:scale-95 disabled:opacity-50 flex-shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          <span>{isChecking ? 'Verifying...' : 'Verify Email Access'}</span>
        </button>
      </form>

      {/* Verification Result Display */}
      {verificationResult && (
        <div className="transition animate-in fade-in duration-200">
          {verificationResult.authorized ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-emerald-200 text-emerald-600 shadow-sm flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                    Access Granted!
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {verificationResult.role === 'admin' ? 'Super Admin' : 'Authorized Viewer'}
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-900/80 mt-0.5">
                    Email <span className="font-semibold text-emerald-950">{verificationResult.email}</span> matches an approved festival record.
                  </p>
                </div>
              </div>

              {/* Personal Connection URL */}
              <div className="rounded-xl border border-emerald-200/80 bg-white p-3.5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Personalized MCP SSE Connection String
                  </span>
                  <button
                    onClick={() => copyToClipboard(verificationResult.sseUrl)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="font-mono text-xs text-gray-900 break-all bg-gray-50 p-2.5 rounded-lg border border-gray-200 select-all">
                  {verificationResult.sseUrl}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
              <div className="flex items-start gap-3 text-rose-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-rose-200 text-rose-600 shadow-sm flex-shrink-0">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-rose-950">Access Denied</h4>
                  <p className="text-xs text-rose-800 mt-1">
                    {verificationResult.error || 'This email is not authorized by the festival administrator.'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-2">
                    To grant access, add this email in the Whitelist Table above.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
