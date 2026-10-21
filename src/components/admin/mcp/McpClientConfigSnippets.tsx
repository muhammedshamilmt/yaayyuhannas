'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Sparkles, Code2, Bot } from 'lucide-react';

interface McpClientConfigSnippetsProps {
  serverName: string;
  cloudServerUrl: string;
  masterAuthToken: string;
}

export function McpClientConfigSnippets({
  serverName,
  cloudServerUrl,
  masterAuthToken,
}: McpClientConfigSnippetsProps) {
  const [activeTab, setActiveTab] = useState<'cursor' | 'claude' | 'gemini' | 'chatgpt'>('cursor');
  const [copied, setCopied] = useState(false);

  const cleanUrl = (cloudServerUrl || 'https://yaayyuhannas.onrender.com').replace(/\/+$/, '');
  const sseEndpoint = `${cleanUrl}/sse`;
  const sseWithToken = `${cleanUrl}/sse?token=${masterAuthToken || 'YOUR_AUTH_TOKEN'}`;

  const cursorSnippet = `{
  "mcpServers": {
    "${serverName}": {
      "url": "${sseWithToken}"
    }
  }
}`;

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

  const geminiSnippet = `{
  "name": "${serverName}",
  "type": "sse",
  "endpoint": "${sseEndpoint}",
  "auth": {
    "type": "bearer",
    "token": "${masterAuthToken || 'YOUR_AUTH_TOKEN'}"
  }
}`;

  const chatgptSnippet = `// In ChatGPT Custom GPT Actions / MCP Bridge:
Server URL: ${sseEndpoint}
Authentication: Bearer Token
Token: ${masterAuthToken || 'YOUR_AUTH_TOKEN'}
Protocol: Model Context Protocol (2024-11-05)`;

  const getCurrentSnippet = () => {
    switch (activeTab) {
      case 'cursor':
        return cursorSnippet;
      case 'claude':
        return claudeSnippet;
      case 'gemini':
        return geminiSnippet;
      case 'chatgpt':
        return chatgptSnippet;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-600" />
            AI Client Setup Snippets
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Copy and paste these pre-configured snippets directly into your AI assistant settings.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition active:scale-95 border border-gray-200 shadow-sm"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? 'Copied Config!' : 'Copy Config'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cursor')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
            activeTab === 'cursor'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Cursor IDE</span>
        </button>

        <button
          onClick={() => setActiveTab('claude')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
            activeTab === 'claude'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Claude Desktop</span>
        </button>

        <button
          onClick={() => setActiveTab('gemini')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
            activeTab === 'gemini'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>Google Gemini / Antigravity</span>
        </button>

        <button
          onClick={() => setActiveTab('chatgpt')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition border-b-2 whitespace-nowrap ${
            activeTab === 'chatgpt'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>ChatGPT / Codex</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="mb-3 text-xs text-gray-600">
        {activeTab === 'cursor' && (
          <p>
            In Cursor: Open <strong>Settings &gt; Features &gt; MCP</strong> and add a new server with type <strong>SSE</strong> and the URL below, or paste this into <code className="bg-gray-100 text-gray-800 border border-gray-200 px-1 py-0.5 rounded font-mono">.cursor/mcp.json</code>.
          </p>
        )}
        {activeTab === 'claude' && (
          <p>
            In Claude Desktop: Add this to your <code className="bg-gray-100 text-gray-800 border border-gray-200 px-1 py-0.5 rounded font-mono">claude_desktop_config.json</code> under <code className="text-gray-900 font-mono font-semibold">mcpServers</code>.
          </p>
        )}
        {activeTab === 'gemini' && (
          <p>
            In Google Gemini or Antigravity agents: Configure the SSE connection parameters below.
          </p>
        )}
        {activeTab === 'chatgpt' && (
          <p>
            In ChatGPT Custom GPTs: Point the Actions or MCP Gateway to the SSE streaming endpoint below.
          </p>
        )}
      </div>

      {/* Code Snippet Box */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-sky-300 overflow-x-auto shadow-inner">
        <pre className="whitespace-pre">{getCurrentSnippet()}</pre>
      </div>
    </div>
  );
}
