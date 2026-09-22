'use client';

import React, { useState } from "react";
import DatabaseTab from "@/components/admin/DatabaseTab";
import RestoreTab from "@/components/admin/RestoreTab";
import { Database, UploadCloud } from "lucide-react";

export default function AdminDatabasePage() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'restore'>('explorer');

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Database Administration</h1>
          <p className="text-sm text-white/40 mt-1">Directly manage, backup, and restore your raw MongoDB collections.</p>
        </div>
        
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'explorer' 
                ? 'bg-primary text-primary-foreground shadow-luxury' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" /> Explorer
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'restore' 
                ? 'bg-primary text-primary-foreground shadow-luxury' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <UploadCloud className="w-4 h-4" /> Restore
          </button>
        </div>
      </div>
      
      {activeTab === 'explorer' ? <DatabaseTab /> : <RestoreTab />}
    </div>
  );
}
