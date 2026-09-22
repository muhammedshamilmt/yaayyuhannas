"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useState } from "react";

export default function SyncPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<any>(null);

  const handleSync = async (action: 'sync-to-sheets' | 'sync-from-sheets', type: string = 'all') => {
    setIsLoading(true);
    setSyncResults(null);
    
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, type }),
      });

      const data = await response.json();
      setSyncResults(data);
      
      if (data.success) {
        setLastSync(new Date().toLocaleString());
      }
    } catch (error) {
      setSyncResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Google Sheets Sync" />

      <div className="space-y-6">
        {/* Sync Status */}
        <ShowcaseSection title="Sync Status">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-bold text-blue-700">Spreadsheet ID</h3>
              <p className="text-sm text-blue-600 font-mono break-all">
                {process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || '19Ug-K85q4u3yNmF0MDgC8D4lOkSRs_-MVR-CbzV2rzA'}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-bold text-green-700">Last Sync</h3>
              <p className="text-sm text-green-600 font-medium">
                {lastSync || 'Never'}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-bold text-purple-700">Status</h3>
              <p className="text-sm text-purple-600 font-medium">
                {isLoading ? 'Syncing...' : 'Ready'}
              </p>
            </div>
          </div>
        </ShowcaseSection>

        {/* Sync Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sync TO Sheets */}
          <ShowcaseSection title="Sync TO Google Sheets">
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Push data from your admin panel to Google Sheets. This will overwrite the sheet data.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSync('sync-to-sheets', 'teams')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium"
                >
                  Sync Teams
                </button>
                
                <button
                  onClick={() => handleSync('sync-to-sheets', 'candidates')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium"
                >
                  Sync Candidates
                </button>
                
                <button
                  onClick={() => handleSync('sync-to-sheets', 'programmes')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium"
                >
                  Sync Programmes
                </button>
                
                <button
                  onClick={() => handleSync('sync-to-sheets', 'results')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium"
                >
                  Sync Results
                </button>
                
                <button
                  onClick={() => handleSync('sync-to-sheets', 'all')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium col-span-2"
                >
                  Sync All
                </button>
              </div>
            </div>
          </ShowcaseSection>

          {/* Sync FROM Sheets */}
          <ShowcaseSection title="Sync FROM Google Sheets">
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Pull data from Google Sheets to your admin panel. This will update your database.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSync('sync-from-sheets', 'teams')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium border-2 border-green-200"
                >
                  Import Teams
                </button>
                
                <button
                  onClick={() => handleSync('sync-from-sheets', 'candidates')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 text-blue-700 px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium border-2 border-blue-200"
                >
                  Import Candidates
                </button>
                
                <button
                  onClick={() => handleSync('sync-from-sheets', 'programmes')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 text-orange-700 px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium border-2 border-orange-200"
                >
                  Import Programmes
                </button>
                
                <button
                  onClick={() => handleSync('sync-from-sheets', 'results')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-100 to-rose-100 hover:from-red-200 hover:to-rose-200 text-red-700 px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium border-2 border-red-200"
                >
                  Import Results
                </button>
                
                <button
                  onClick={() => handleSync('sync-from-sheets', 'all')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium border-2 border-purple-200 col-span-2"
                >
                  Import All
                </button>
              </div>
            </div>
          </ShowcaseSection>
        </div>

        {/* Sync Results */}
        {syncResults && (
          <ShowcaseSection title="Sync Results">
            <div className={`p-4 rounded-lg ${syncResults.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">{syncResults.success ? '✅' : '❌'}</span>
                <h3 className={`font-bold ${syncResults.success ? 'text-green-700' : 'text-red-700'}`}>
                  {syncResults.success ? 'Success' : 'Error'}
                </h3>
              </div>
              
              <p className={`text-sm font-medium ${syncResults.success ? 'text-green-600' : 'text-red-600'}`}>
                {syncResults.message || syncResults.error}
              </p>
              
              {syncResults.results && (
                <div className="mt-3 space-y-1">
                  {syncResults.results.map((result: any, index: number) => (
                    <div key={index} className="text-xs text-gray-600">
                      {result.error ? `❌ ${result.error}` : `✅ ${result.count || result.inserted + result.updated} records processed`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ShowcaseSection>
        )}

        {/* Instructions */}
        <ShowcaseSection title="How to Share Your Spreadsheet">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <h3 className="font-bold text-yellow-800 mb-3">📋 Setup Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-yellow-700">
              <li>Open your Google Spreadsheet: <a href="https://docs.google.com/spreadsheets/d/19Ug-K85q4u3yNmF0MDgC8D4lOkSRs_-MVR-CbzV2rzA/edit" target="_blank" className="text-blue-600 underline">Click here</a></li>
              <li>Click the &quot;Share&quot; button (top right corner)</li>
              <li>Add your service account email (from your .env.local file)</li>
              <li>Set permission to &quot;Editor&quot;</li>
              <li>Click &quot;Send&quot;</li>
              <li>Come back here and test the sync!</li>
            </ol>
          </div>
        </ShowcaseSection>
      </div>
    </>
  );
}