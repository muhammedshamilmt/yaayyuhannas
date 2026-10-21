'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  Laptop, 
  Cloud, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Cpu, 
  Bot, 
  Code2, 
  Settings, 
  Info,
  MessageSquare
} from 'lucide-react';

interface McpSetupGuideProps {
  serverName: string;
  cloudServerUrl: string;
  masterAuthToken: string;
}

export function McpSetupGuide({
  serverName,
  cloudServerUrl,
  masterAuthToken,
}: McpSetupGuideProps) {
  const [activeAI, setActiveAI] = useState<'gemini' | 'claude' | 'cursor' | 'chatgpt' | 'vscode'>('gemini');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [claudeOs, setClaudeOs] = useState<'mac' | 'windows'>('mac');

  const cleanUrl = (cloudServerUrl || 'https://yaayyuhannas.onrender.com').replace(/\/+$/, '');
  const sseEndpoint = `${cleanUrl}/sse`;
  const sseWithToken = `${cleanUrl}/sse?token=${masterAuthToken || 'YOUR_AUTH_TOKEN'}`;

  const copyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Snippets
  const claudeSnippet = `{
  "mcpServers": {
    "${serverName}": {
      "url": "${sseEndpoint}",
      "headers": {
        "Authorization": "Bearer ${masterAuthToken || 'YOUR_AUTH_TOKEN'}"
      }
    }
  }
}`;

  const cursorJsonSnippet = `{
  "mcpServers": {
    "${serverName}": {
      "url": "${sseWithToken}"
    }
  }
}`;

  const clineSnippet = `{
  "mcpServers": {
    "${serverName}": {
      "url": "${sseWithToken}",
      "transport": "sse"
    }
  }
}`;

  const samplePrompts = [
    {
      title: 'Current Team Standings',
      query: 'Who is leading the festival right now? Show me the top teams and their total points breakdown.',
    },
    {
      title: 'Candidate Lookup',
      query: 'Find candidate details for chest number 105 and show which programmes they are registered in.',
    },
    {
      title: 'Programme Results',
      query: 'Show me the results and winners for the Mappilappattu General category.',
    },
    {
      title: 'Database Anomaly Audit',
      query: 'Run a diagnostic check on the database for any scoring discrepancies, missing marks, or duplicate entries.',
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Client Setup &amp; Connection Guides
            </h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
              Step-by-Step
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Follow the instructions below to connect your favorite AI assistant to the live <span className="font-semibold text-gray-800">{serverName}</span> MCP database server.
          </p>
        </div>

        {/* Quick Credentials Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => copyText(sseWithToken, 'header-sse')}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
            title="Copy full SSE connection URL with auth token"
          >
            {copiedField === 'header-sse' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span>{copiedField === 'header-sse' ? 'Copied Link!' : 'Copy SSE Link'}</span>
          </button>

          <button
            onClick={() => copyText(masterAuthToken, 'header-token')}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
            title="Copy Master Auth Token"
          >
            {copiedField === 'header-token' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span>{copiedField === 'header-token' ? 'Copied Token!' : 'Copy Token'}</span>
          </button>
        </div>
      </div>

      {/* AI Assistant Selector Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveAI('gemini')}
          className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeAI === 'gemini'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span>Google Gemini</span>
          <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] text-blue-800">Connected Apps</span>
        </button>

        <button
          onClick={() => setActiveAI('claude')}
          className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeAI === 'claude'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Bot className="h-4 w-4 text-amber-600" />
          <span>Claude Desktop</span>
        </button>

        <button
          onClick={() => setActiveAI('cursor')}
          className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeAI === 'cursor'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Code2 className="h-4 w-4 text-indigo-600" />
          <span>Cursor IDE</span>
        </button>

        <button
          onClick={() => setActiveAI('chatgpt')}
          className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeAI === 'chatgpt'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          <span>ChatGPT / GPTs</span>
        </button>

        <button
          onClick={() => setActiveAI('vscode')}
          className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeAI === 'vscode'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Terminal className="h-4 w-4 text-purple-600" />
          <span>VS Code / Cline</span>
        </button>
      </div>

      {/* Tab 1: Google Gemini Guide */}
      {activeAI === 'gemini' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Step by step numbered guide */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Connecting Google Gemini via &quot;Custom Connected App&quot;
                </h4>
                <p className="text-xs text-blue-800/80 mt-1">
                  Google Gemini allows you to add custom cloud MCP servers directly in its Connected Apps settings. Once connected, Gemini can query festival points, candidates, and programme schedules in real time.
                </p>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Open Gemini Settings</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Go to <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">gemini.google.com</a>, click your Profile or Settings icon, and choose <strong>Connected Apps</strong> (or <strong>Extensions</strong>).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Add a Custom Connected App</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Click the <strong>&quot;+ Add custom connected app&quot;</strong> button. The setup popup will appear.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/30 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-950">Select &quot;Cloud MCP&quot;</p>
                    <p className="text-xs text-blue-900/80 mt-0.5">
                      Under <strong>&quot;Choose setup method&quot;</strong>, select the <strong>Cloud MCP</strong> radio option (connects to your live hosted Render server via URL).
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white flex-shrink-0">
                    4
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-bold text-gray-900">Paste Clean App Link</p>
                    <p className="text-xs text-gray-600">
                      Paste the clean SSE endpoint into <strong>&quot;Add a custom app link&quot;</strong> (do not add <code className="bg-gray-200 px-1 py-0.5 rounded font-mono text-gray-800">?token=...</code> because Gemini requires standard OAuth):
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={sseEndpoint}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 font-mono text-xs text-gray-800 select-all"
                      />
                      <button
                        onClick={() => copyText(sseEndpoint, 'gemini-link')}
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition flex-shrink-0 shadow-sm"
                      >
                        {copiedField === 'gemini-link' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedField === 'gemini-link' ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white flex-shrink-0">
                    5
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-bold text-blue-950">Fill &quot;Advanced settings&quot; (OAuth Credentials)</p>
                    <p className="text-xs text-blue-900/80">
                      Click <strong>Advanced settings</strong> in the Gemini modal and fill in:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">Client ID</span>
                        <div className="flex items-center justify-between mt-1">
                          <code className="font-mono text-gray-900 font-semibold">{serverName}</code>
                          <button
                            onClick={() => copyText(serverName, 'gemini-client-id')}
                            className="text-blue-600 hover:text-blue-700 text-[11px] font-semibold flex items-center gap-0.5"
                          >
                            {copiedField === 'gemini-client-id' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedField === 'gemini-client-id' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">Client Secret</span>
                        <div className="flex items-center justify-between mt-1">
                          <code className="font-mono text-gray-900 font-semibold">{masterAuthToken}</code>
                          <button
                            onClick={() => copyText(masterAuthToken, 'gemini-client-secret')}
                            className="text-blue-600 hover:text-blue-700 text-[11px] font-semibold flex items-center gap-0.5"
                          >
                            {copiedField === 'gemini-client-secret' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedField === 'gemini-client-secret' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white flex-shrink-0">
                    6
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Click &quot;Next&quot; to Authorize</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Click <strong>Next</strong>. Gemini will negotiate the standard OAuth handshake, connect to the server, and expose all 9 festival database tools!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Visual Replica of the Gemini Modal from user screenshot */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-gray-300 bg-gray-900 text-white p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
                  <h5 className="font-bold text-sm text-gray-100 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    Set up a custom connected app
                  </h5>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Gemini UI Preview
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-2">
                      Choose setup method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Local MCP Option */}
                      <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-2.5 opacity-60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-300">Local MCP</span>
                          <span className="h-3 w-3 rounded-full border border-gray-500" />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Configure a local server using direct command</p>
                      </div>

                      {/* Cloud MCP Option (Active) */}
                      <div className="rounded-xl border-2 border-blue-500 bg-blue-950/40 p-2.5 shadow-md shadow-blue-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-300">Cloud MCP</span>
                          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 ring-2 ring-blue-300/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                        </div>
                        <p className="text-[10px] text-blue-200/80 mt-1">Connect to remotely hosted MCP via URL</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      Add a custom app link
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={sseEndpoint}
                        className="w-full rounded-xl border border-blue-500/80 bg-black/60 px-3 py-2 text-xs font-mono text-blue-300 focus:outline-none select-all"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Clean OAuth-ready SSE URL
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-2.5">
                    <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
                      Advanced settings (Standard OAuth)
                    </p>
                    <div className="mt-1.5 text-[10px] text-gray-300 space-y-1 font-mono">
                      <p>Client ID: <span className="text-white font-bold">{serverName}</span></p>
                      <p>Client secret: <span className="text-white font-bold">{masterAuthToken}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                    <span className="text-xs text-gray-400">Cancel</span>
                    <button
                      onClick={() => copyText(sseWithToken, 'gemini-replica')}
                      className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                    >
                      {copiedField === 'gemini-replica' ? 'Link Copied!' : 'Copy & Next'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Claude Desktop Guide */}
      {activeAI === 'claude' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-amber-600" />
                  Claude Desktop Configuration
                </h4>
                <p className="text-xs text-amber-900/80 mt-1">
                  Claude Desktop connects via its native <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">claude_desktop_config.json</code> configuration file.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Open Config in Claude</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      In Claude Desktop, click <strong>Claude</strong> (top bar) &gt; <strong>Settings...</strong> &gt; <strong>Developer</strong> &gt; click <strong>Edit Config</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">File Location</span>
                      <div className="flex items-center gap-1 bg-gray-200 p-0.5 rounded-lg text-[10px]">
                        <button
                          onClick={() => setClaudeOs('mac')}
                          className={`px-2 py-0.5 rounded ${claudeOs === 'mac' ? 'bg-white font-bold text-gray-900 shadow-xs' : 'text-gray-600'}`}
                        >
                          macOS
                        </button>
                        <button
                          onClick={() => setClaudeOs('windows')}
                          className={`px-2 py-0.5 rounded ${claudeOs === 'windows' ? 'bg-white font-bold text-gray-900 shadow-xs' : 'text-gray-600'}`}
                        >
                          Windows
                        </button>
                      </div>
                    </div>
                    <code className="block bg-gray-100 text-gray-800 p-2 rounded-lg font-mono text-[11px] break-all border border-gray-200">
                      {claudeOs === 'mac'
                        ? '~/Library/Application Support/Claude/claude_desktop_config.json'
                        : '%APPDATA%\\Claude\\claude_desktop_config.json'}
                    </code>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Paste JSON &amp; Restart Claude</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Paste the JSON configuration on the right, save the file, then <strong>Quit Claude completely</strong> (Cmd+Q / Alt+F4) and reopen it.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">Verify Tools</p>
                    <p className="text-xs text-emerald-900/80 mt-0.5">
                      You will see a small <strong>hammer icon 🔨</strong> with <strong>9 tools</strong> active at the bottom right of your Claude chat box.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Code Block */}
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">claude_desktop_config.json snippet</span>
                <button
                  onClick={() => copyText(claudeSnippet, 'claude-json')}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  {copiedField === 'claude-json' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'claude-json' ? 'Copied Config!' : 'Copy JSON'}</span>
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-sky-300 overflow-x-auto shadow-inner">
                <pre>{claudeSnippet}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cursor IDE Guide */}
      {activeAI === 'cursor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-indigo-600" />
                  Cursor IDE Setup (2 Ways)
                </h4>
                <p className="text-xs text-indigo-900/80 mt-1">
                  You can configure Cursor either through the graphical settings panel or by committing a <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">.cursor/mcp.json</code> file.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-2">
                  <p className="text-xs font-bold text-gray-900">Method A: Graphical Settings (Recommended)</p>
                  <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
                    <li>Open <strong>Cursor Settings</strong> (Gear icon or <kbd className="bg-gray-200 px-1 rounded text-[10px]">Cmd + ,</kbd>).</li>
                    <li>Select <strong>Features</strong> in the sidebar, then click <strong>MCP</strong>.</li>
                    <li>Click the <strong>&quot;+ Add New MCP Server&quot;</strong> button.</li>
                    <li>Set <strong>Name:</strong> <code className="bg-gray-200 px-1 rounded font-bold text-gray-800">{serverName}</code></li>
                    <li>Set <strong>Type:</strong> <span className="font-semibold text-gray-800">SSE</span></li>
                    <li>Set <strong>URL:</strong> Paste the copied SSE URL with token.</li>
                    <li>Cursor will automatically display a green <strong className="text-emerald-600">● Connected</strong> badge.</li>
                  </ol>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-2">
                  <p className="text-xs font-bold text-gray-900">Method B: Workspace Config File</p>
                  <p className="text-xs text-gray-600">
                    Create or update <code className="bg-gray-200 px-1 py-0.5 rounded font-mono text-[11px]">.cursor/mcp.json</code> in your project root with the snippet on the right.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">.cursor/mcp.json snippet</span>
                <button
                  onClick={() => copyText(cursorJsonSnippet, 'cursor-json')}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  {copiedField === 'cursor-json' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'cursor-json' ? 'Copied Config!' : 'Copy JSON'}</span>
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-sky-300 overflow-x-auto shadow-inner">
                <pre>{cursorJsonSnippet}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: ChatGPT / GPTs Guide */}
      {activeAI === 'chatgpt' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              ChatGPT Custom GPTs &amp; MCP Gateway Bridge
            </h4>
            <p className="text-xs text-emerald-900/80 mt-1">
              To use with ChatGPT, you can connect either via OpenAI Custom GPT Actions or through an SSE MCP Bridge (like LibreChat or MCP Gateway).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Step 1</span>
              <p className="text-xs font-bold text-gray-900">Create Custom GPT</p>
              <p className="text-xs text-gray-600">
                Go to ChatGPT &gt; <strong>Explore GPTs</strong> &gt; <strong>Create a GPT</strong> &gt; <strong>Configure</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Step 2</span>
              <p className="text-xs font-bold text-gray-900">Add SSE Streaming Action</p>
              <p className="text-xs text-gray-600">
                Under <strong>Actions</strong>, set authentication to <strong>Bearer Token</strong> and paste your Master Auth Token.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Step 3</span>
              <p className="text-xs font-bold text-gray-900">Server Endpoint</p>
              <p className="text-xs text-gray-600">
                Point the gateway to: <code className="block mt-1 font-mono text-[10px] text-gray-800 bg-white p-1 rounded border border-gray-200">{sseEndpoint}</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: VS Code / Cline Guide */}
      {activeAI === 'vscode' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
            <h4 className="text-sm font-bold text-purple-950 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-purple-600" />
              VS Code (Cline, Roo Code, Continue.dev)
            </h4>
            <p className="text-xs text-purple-900/80 mt-1">
              Add the MCP configuration directly to your extension settings (<code className="bg-purple-100 px-1 py-0.5 rounded font-mono">cline_mcp_settings.json</code>).
            </p>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-sky-300 overflow-x-auto shadow-inner">
            <pre>{clineSnippet}</pre>
          </div>
        </div>
      )}

      {/* Suggested Prompts Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-bold text-gray-900">Sample Prompts to Ask Your AI Once Connected</h4>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Once your AI client is connected, try asking any of these questions. The AI will call the MCP tools behind the scenes and answer with real-time database facts:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {samplePrompts.map((prompt, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 hover:bg-white hover:border-blue-300 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition">
                  {prompt.title}
                </span>
                <button
                  onClick={() => copyText(prompt.query, `prompt-${idx}`)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 group-hover:text-blue-600 transition"
                  title="Copy Prompt"
                >
                  {copiedField === `prompt-${idx}` ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 italic">
                &ldquo;{prompt.query}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
