'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Mail, 
  CheckCircle2, 
  XCircle,
  Link2
} from 'lucide-react';
import { McpAuthorizedUser } from '@/app/api/admin/mcp/route';

interface McpWhitelistTableProps {
  cloudServerUrl: string;
  users: McpAuthorizedUser[];
  onAddUser: (email: string, name: string, role: 'admin' | 'viewer') => Promise<boolean>;
  onToggleStatus: (userId: string, newStatus: 'active' | 'revoked') => Promise<boolean>;
  onRegenerateToken: (userId: string) => Promise<string | null>;
  onDeleteUser: (userId: string) => Promise<boolean>;
}

export function McpWhitelistTable({
  cloudServerUrl,
  users,
  onAddUser,
  onToggleStatus,
  onRegenerateToken,
  onDeleteUser,
}: McpWhitelistTableProps) {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'viewer'>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Track copied state by user id
  const [copiedTokens, setCopiedTokens] = useState<Record<string, boolean>>({});
  const [copiedLinks, setCopiedLinks] = useState<Record<string, boolean>>({});

  const cleanUrl = (cloudServerUrl || '').replace(/\/+$/, '');

  const copyItem = (id: string, text: string, type: 'token' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedTokens((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedTokens((prev) => ({ ...prev, [id]: false })), 2000);
    } else {
      setCopiedLinks((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedLinks((prev) => ({ ...prev, [id]: false })), 2000);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setAddError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const success = await onAddUser(newEmail.trim(), newName.trim(), newRole);
    setIsSubmitting(false);

    if (success) {
      setNewEmail('');
      setNewName('');
      setNewRole('viewer');
      setShowAddModal(false);
    } else {
      setAddError('Failed to add email. It may already exist in the list.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Authorized User Emails Whitelist
            </h3>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 border border-gray-200">
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Only users whose emails are listed here can connect to the MCP server. Revoking or deleting an email terminates their access immediately.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/80 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none w-48 sm:w-60 shadow-inner transition"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-sm active:scale-95 flex-shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Authorized Email</span>
          </button>
        </div>
      </div>

      {/* Whitelist Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Authorized User / Email</th>
              <th className="py-3 px-4">Scope</th>
              <th className="py-3 px-4">Personal Token</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <Mail className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="font-semibold text-sm text-gray-700">No authorized emails found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click &quot;Add Authorized Email&quot; to give team captains or judges access to your MCP server.
                  </p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isCopiedToken = copiedTokens[user.id];
                const isCopiedLink = copiedLinks[user.id];
                const userSseUrl = `${cleanUrl}/sse?token=${user.token}`;

                return (
                  <tr key={user.id} className="hover:bg-gray-50/70 transition">
                    {/* User & Email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name || user.email.split('@')[0]}</p>
                          <p className="text-[11px] font-mono text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Scope / Role */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        user.role === 'admin' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {user.role === 'admin' ? 'Admin Access' : 'Read-Only Viewer'}
                      </span>
                    </td>

                    {/* Personal Token */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200 font-medium">
                          {user.token.slice(0, 10)}••••••••
                        </span>
                        <button
                          onClick={() => copyItem(user.id, user.token, 'token')}
                          title="Copy Token"
                          className="rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                        >
                          {isCopiedToken ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => onRegenerateToken(user.id)}
                          title="Regenerate Token"
                          className="rounded p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onToggleStatus(user.id, user.status === 'active' ? 'revoked' : 'active')}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition border ${
                          user.status === 'active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Revoked</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy full SSE link with token */}
                        <button
                          onClick={() => copyItem(user.id, userSseUrl, 'link')}
                          title="Copy personalized SSE Connection URL"
                          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition"
                        >
                          {isCopiedLink ? <Check className="h-3 w-3 text-emerald-600" /> : <Link2 className="h-3 w-3" />}
                          <span>{isCopiedLink ? 'Copied Link!' : 'Copy SSE Link'}</span>
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${user.email} from authorized MCP users?`)) {
                              onDeleteUser(user.id);
                            }
                          }}
                          title="Remove User"
                          className="rounded-lg p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-900">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Add Authorized MCP Email
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 rounded-lg hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  User Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="captain@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  The user must log in with this exact email to connect to the MCP server.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Display Name or Team (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Captain - Team Sumud"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Access Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('viewer')}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      newRole === 'viewer'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-900">Read-Only Viewer</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Can query data and stats</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      newRole === 'admin'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 ring-1 ring-rose-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-900">Admin Privileges</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Full access to all tools</p>
                  </button>
                </div>
              </div>

              {addError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                  {addError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? 'Authorizing...' : 'Authorize User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
