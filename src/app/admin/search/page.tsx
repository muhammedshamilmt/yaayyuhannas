"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useState } from "react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock search results
    const mockResults = [
      {
        type: "candidate",
        name: "Ahmed Ali",
        team: "Team Sumud",
        chestNo: "001",
        details: "Senior Section • Chest No. 001"
      },
      {
        type: "programme",
        name: "P001 - Classical Singing",
        section: "Senior",
        position: "Individual",
        details: "Senior • Individual Competition"
      },
      {
        type: "result",
        name: "Classical Singing (P001)",
        winner: "Chest No. 002 - Fatima Hassan",
        date: "March 15, 2025",
        details: "Senior • Individual • 10 Points"
      },
      {
        type: "team",
        name: "Team Aqsa",
        captain: "Fatima Hassan",
        members: "45",
        details: "Creative & Athletic Champions"
      }
    ];
    setSearchResults(mockResults);
  };

  return (
    <>
      <Breadcrumb pageName="Search" />

      <div className="space-y-6">
        {/* Search Form */}
        <ShowcaseSection title="Search Festival Data">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Query
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for candidates, teams, results, events..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Type
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                >
                  <option value="all">All</option>
                  <option value="candidates">Candidates</option>
                  <option value="programmes">Programmes</option>
                  <option value="teams">Teams</option>
                  <option value="results">Results</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </form>
        </ShowcaseSection>

        {/* Quick Search Filters */}
        <ShowcaseSection title="Quick Filters">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 text-left transform hover:scale-105">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-bold text-green-700">All Candidates</h3>
              <p className="text-sm text-green-600 font-medium">135 total</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 text-left transform hover:scale-105">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-bold text-yellow-700">Winners</h3>
              <p className="text-sm text-yellow-600 font-medium">48 results</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-left transform hover:scale-105">
              <div className="text-3xl mb-2">🎨</div>
              <h3 className="font-bold text-purple-700">Arts Events</h3>
              <p className="text-sm text-purple-600 font-medium">25 events</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-left transform hover:scale-105">
              <div className="text-3xl mb-2">⚽</div>
              <h3 className="font-bold text-blue-700">Sports Events</h3>
              <p className="text-sm text-blue-600 font-medium">18 events</p>
            </button>
          </div>
        </ShowcaseSection>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <ShowcaseSection title={`Search Results (${searchResults.length})`}>
            <div className="space-y-4">
              {searchResults.map((result, index) => {
                const getResultColor = (type: string) => {
                  switch (type) {
                    case 'candidate': return 'from-green-50 to-emerald-50 border-green-200';
                    case 'result': return 'from-yellow-50 to-orange-50 border-yellow-200';
                    case 'team': return 'from-blue-50 to-cyan-50 border-blue-200';
                    default: return 'from-purple-50 to-pink-50 border-purple-200';
                  }
                };
                
                const getIconColor = (type: string) => {
                  switch (type) {
                    case 'candidate': return 'from-green-400 to-emerald-500';
                    case 'result': return 'from-yellow-400 to-orange-500';
                    case 'team': return 'from-blue-400 to-cyan-500';
                    default: return 'from-purple-400 to-pink-500';
                  }
                };

                const getTextColor = (type: string) => {
                  switch (type) {
                    case 'candidate': return 'text-green-700';
                    case 'result': return 'text-yellow-700';
                    case 'team': return 'text-blue-700';
                    default: return 'text-purple-700';
                  }
                };

                return (
                  <div key={index} className={`bg-gradient-to-br ${getResultColor(result.type)} border-2 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${getIconColor(result.type)} rounded-lg flex items-center justify-center shadow-lg`}>
                          {result.type === 'candidate' && <span className="text-white">👤</span>}
                          {result.type === 'programme' && <span className="text-white">📋</span>}
                          {result.type === 'result' && <span className="text-white">🏆</span>}
                          {result.type === 'team' && <span className="text-white">👥</span>}
                        </div>
                        <div>
                          <h3 className={`font-bold ${getTextColor(result.type)}`}>{result.name}</h3>
                          <p className={`text-sm ${getTextColor(result.type)} font-medium`}>{result.details}</p>
                          {result.team && <p className={`text-sm ${getTextColor(result.type)}`}>Team: {result.team}</p>}
                          {result.chestNo && <p className={`text-sm ${getTextColor(result.type)}`}>Chest No: {result.chestNo}</p>}
                          {result.section && <p className={`text-sm ${getTextColor(result.type)}`}>Section: {result.section}</p>}
                          {result.position && <p className={`text-sm ${getTextColor(result.type)}`}>Position: {result.position}</p>}
                          {result.winner && <p className={`text-sm ${getTextColor(result.type)}`}>Winner: {result.winner}</p>}
                          {result.captain && <p className={`text-sm ${getTextColor(result.type)}`}>Captain: {result.captain}</p>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                        <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">Edit</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ShowcaseSection>
        )}

        {/* Advanced Search */}
        <ShowcaseSection title="Advanced Search">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Filter
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent">
                <option value="">All Teams</option>
                <option value="sumud">Team Sumud</option>
                <option value="aqsa">Team Aqsa</option>
                <option value="inthifada">Team Inthifada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Filter
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent">
                <option value="">All Categories</option>
                <option value="arts">Arts</option>
                <option value="sports">Sports</option>
                <option value="music">Music</option>
                <option value="dance">Dance</option>
                <option value="drama">Drama</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
          </div>
        </ShowcaseSection>
      </div>
    </>
  );
}