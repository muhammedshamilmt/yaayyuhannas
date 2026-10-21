'use client';

import React, { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { McpServerStatusCard } from '@/components/admin/mcp/McpServerStatusCard';
import { McpWhitelistTable } from '@/components/admin/mcp/McpWhitelistTable';
import { McpSetupGuide } from '@/components/admin/mcp/McpSetupGuide';
import { McpUserAccessVerifier } from '@/components/admin/mcp/McpUserAccessVerifier';
import { McpAuthorizedUser, McpSettings } from '@/app/api/admin/mcp/route';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AdminMcpPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<McpSettings>({
    serverName: 'ayyuhannas-fest',
    cloudServerUrl: 'https://yaayyuhannas.onrender.com',
    masterAuthToken: 'ayyuhannas-secret-2026',
    readOnly: true,
    authorizedEmails: [],
    updatedAt: new Date().toISOString(),
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/mcp');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      } else {
        throw new Error(data.error || 'Failed to load MCP settings');
      }
    } catch (err: any) {
      console.error('Error fetching MCP settings:', err);
      setError(err.message || 'Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateSettings = async (cloudServerUrl: string, masterAuthToken: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          cloudServerUrl,
          masterAuthToken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          cloudServerUrl,
          masterAuthToken,
          updatedAt: new Date().toISOString(),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddUser = async (email: string, name: string, role: 'admin' | 'viewer'): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_user',
          email,
          name,
          role,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setSettings((prev) => ({
          ...prev,
          authorizedEmails: [...prev.authorizedEmails, data.user],
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleToggleStatus = async (userId: string, newStatus: 'active' | 'revoked'): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/mcp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          userId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          authorizedEmails: prev.authorizedEmails.map((u) =>
            u.id === userId ? { ...u, status: newStatus } : u
          ),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleRegenerateToken = async (userId: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/admin/mcp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_token',
          userId,
        }),
      });
      const data = await res.json();
      if (data.success && data.newToken) {
        setSettings((prev) => ({
          ...prev,
          authorizedEmails: prev.authorizedEmails.map((u) =>
            u.id === userId ? { ...u, token: data.newToken, status: 'active' } : u
          ),
        }));
        return data.newToken;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleDeleteUser = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/mcp?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          authorizedEmails: prev.authorizedEmails.filter((u) => u.id !== userId),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl pb-12">
      <Breadcrumb pageName="MCP Connectors & Access" />

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500 font-medium">Loading MCP configurations...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Main Status & Connection Card */}
          <McpServerStatusCard
            serverName={settings.serverName}
            cloudServerUrl={settings.cloudServerUrl}
            masterAuthToken={settings.masterAuthToken}
            readOnly={settings.readOnly}
            onUpdateSettings={handleUpdateSettings}
          />

          {/* 2. Whitelist Management Table */}
          <McpWhitelistTable
            cloudServerUrl={settings.cloudServerUrl}
            users={settings.authorizedEmails}
            onAddUser={handleAddUser}
            onToggleStatus={handleToggleStatus}
            onRegenerateToken={handleRegenerateToken}
            onDeleteUser={handleDeleteUser}
          />

          {/* 3. Live Email Verification Tester */}
          <McpUserAccessVerifier />

          {/* 4. Complete Step-by-Step AI Setup Guides & Connectors */}
          <McpSetupGuide
            serverName={settings.serverName}
            cloudServerUrl={settings.cloudServerUrl}
            masterAuthToken={settings.masterAuthToken}
          />
        </div>
      )}
    </div>
  );
}
