"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Programme, ProgrammeParticipant, Team, Candidate, Result } from '@/types';

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'programmes' | 'categories' | 'sections'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'arts' | 'sports'>('all');
  const [selectedSection, setSelectedSection] = useState<'all' | 'senior' | 'junior' | 'sub-junior' | 'general'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'active' | 'upcoming'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programmesRes, participantsRes, teamsRes, candidatesRes, resultsRes] = await Promise.all([
        fetch('/api/programmes'),
        fetch('/api/programme-participants'),
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/results')
      ]);

      const [programmesData, participantsData, teamsData, candidatesData, resultsData] = await Promise.all([
        programmesRes.json(),
        participantsRes.json(),
        teamsRes.json(),
        candidatesRes.json(),
        resultsRes.json()
      ]);

      setProgrammes(programmesData || []);
      setParticipants(participantsData || []);
      setTeams(teamsData || []);
      setCandidates(candidatesData || []);
      setResults(resultsData || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'arts': return '🎭';
      case 'sports': return '⚽';
      default: return '🏆';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'arts': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sports': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'senior': return 'bg-red-100 text-red-800';
      case 'junior': return 'bg-yellow-100 text-yellow-800';
      case 'sub-junior': return 'bg-pink-100 text-pink-800';
      case 'general': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionTypeIcon = (positionType: string) => {
    switch (positionType) {
      case 'individual': return '👤';
      case 'group': return '👥';
      case 'general': return '🌟';
      default: return '📋';
    }
  };

  const getProgrammeParticipants = (programmeId: string) => {
    return participants.filter(p => p.programmeId === programmeId);
  };

  const getProgrammeResults = (programmeName: string) => {
    return results.filter(r => r.programme.includes(programmeName));
  };

  const getProgrammeStatus = (programme: Programme) => {
    const programmeResults = getProgrammeResults(programme.name);
    if (programmeResults.length > 0) return 'completed';
    if (programme.status === 'active') return 'active';
    return 'upcoming';
  };

  const filteredProgrammes = programmes.filter(programme => {
    const matchesSearch = programme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         programme.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || programme.category === selectedCategory;
    const matchesSection = selectedSection === 'all' || programme.section === selectedSection;
    const programmeStatus = getProgrammeStatus(programme);
    const matchesStatus = selectedStatus === 'all' || programmeStatus === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesSection && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'active': return '🔄';
      case 'upcoming': return '⏰';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Loading programmes...</p>
        </div>
      </div>
    );
  }

  const categories = [...new Set(programmes.map(p => p.category))].filter(Boolean);
  const sections = [...new Set(programmes.map(p => p.section))].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}>
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-6">
              <span className="text-white text-2xl">🎭</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Festival Programmes
            </h1>
            <p className="text-xl text-blue-100 mb-6 max-w-3xl mx-auto">
              Explore all competitions and events in the Wattaqa Arts & Sports Festival 2K25
            </p>
            <div className="flex items-center justify-center space-x-4 text-blue-200">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                Live Updates
              </span>
              <span>•</span>
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="flex flex-wrap border-b">
            {[
              { key: 'overview', label: '📊 Overview', icon: '📊' },
              { key: 'programmes', label: '🎭 All Programmes', icon: '🎭' },
              { key: 'categories', label: '📂 By Category', icon: '📂' },
              { key: 'sections', label: '🏛️ By Section', icon: '🏛️' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-4 font-medium text-sm md:text-base transition-colors duration-200 ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-xl">🎭</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{programmes.length}</div>
                    <div className="text-sm text-gray-500">Total Programmes</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-xl">🎨</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {programmes.filter(p => p.category === 'arts').length}
                    </div>
                    <div className="text-sm text-gray-500">Arts Programmes</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-xl">⚽</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {programmes.filter(p => p.category === 'sports').length}
                    </div>
                    <div className="text-sm text-gray-500">Sports Programmes</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-xl">✅</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {programmes.filter(p => getProgrammeStatus(p) === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Programmes */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white">🌟 Featured Programmes</h2>
                <p className="text-blue-100">Popular competitions and events</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {programmes.slice(0, 6).map((programme) => {
                    const programmeParticipants = getProgrammeParticipants(programme._id?.toString() || '');
                    const status = getProgrammeStatus(programme);
                    const totalParticipants = programmeParticipants.reduce((sum, p) => sum + p.participants.length, 0);
                    
                    return (
                      <Link
                        key={programme._id?.toString()}
                        href={`/programmes/${programme._id}`}
                        className="block group"
                      >
                        <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 group-hover:border-blue-300">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{getCategoryIcon(programme.category)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(programme.category)}`}>
                                {programme.category}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {getStatusIcon(status)}
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {programme.name}
                          </h3>
                          
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>{programme.section}</span>
                            <span>{programme.positionType}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-600 font-medium">{programmeParticipants.length} teams</span>
                            <span className="text-green-600 font-medium">{totalParticipants} participants</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Programmes Tab */}
        {activeTab === 'programmes' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search programmes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category, idx) => (
                    <option key={idx} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sections</option>
                  {sections.map((section, idx) => (
                    <option key={idx} value={section}>{section}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
            </div>

            {/* Programmes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProgrammes.map((programme) => {
                const programmeParticipants = getProgrammeParticipants(programme._id?.toString() || '');
                const status = getProgrammeStatus(programme);
                const totalParticipants = programmeParticipants.reduce((sum, p) => sum + p.participants.length, 0);
                
                return (
                  <Link
                    key={programme._id?.toString()}
                    href={`/programmes/${programme._id}`}
                    className="block group"
                  >
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl">{getCategoryIcon(programme.category)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg group-hover:text-blue-100 transition-colors">
                          {programme.name}
                        </h3>
                        <p className="text-blue-100 text-sm">{programme.code}</p>
                      </div>

                      <div className="p-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(programme.category)}`}>
                            {programme.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSectionColor(programme.section)}`}>
                            {programme.section}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600">{programmeParticipants.length}</div>
                            <div className="text-xs text-gray-500">Teams</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">{totalParticipants}</div>
                            <div className="text-xs text-gray-500">Participants</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-600">{programme.requiredParticipants}</div>
                            <div className="text-xs text-gray-500">Required</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {categories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className={`px-6 py-4 ${category === 'arts' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'}`}>
                  <h2 className="text-2xl font-bold text-white">
                    {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)} Programmes
                  </h2>
                  <p className="text-white opacity-90">
                    {programmes.filter(p => p.category === category).length} programmes available
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {programmes.filter(p => p.category === category).map((programme) => {
                      const programmeParticipants = getProgrammeParticipants(programme._id?.toString() || '');
                      const status = getProgrammeStatus(programme);
                      const totalParticipants = programmeParticipants.reduce((sum, p) => sum + p.participants.length, 0);
                      
                      return (
                        <Link
                          key={programme._id?.toString()}
                          href={`/programmes/${programme._id}`}
                          className="block group"
                        >
                          <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {programme.name}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>{programme.section}</span>
                              <span>{programme.positionType}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-600 font-medium">{programmeParticipants.length} teams</span>
                              <span className="text-green-600 font-medium">{totalParticipants} participants</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">🏛️ {section.charAt(0).toUpperCase() + section.slice(1)} Section</h2>
                  <p className="text-orange-100">
                    {programmes.filter(p => p.section === section).length} programmes • Mixed categories
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {programmes.filter(p => p.section === section).map((programme) => {
                      const programmeParticipants = getProgrammeParticipants(programme._id?.toString() || '');
                      const status = getProgrammeStatus(programme);
                      const totalParticipants = programmeParticipants.reduce((sum, p) => sum + p.participants.length, 0);
                      
                      return (
                        <Link
                          key={programme._id?.toString()}
                          href={`/programmes/${programme._id}`}
                          className="block group"
                        >
                          <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getCategoryIcon(programme.category)}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(programme.category)}`}>
                                  {programme.category}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                              </span>
                            </div>
                            
                            <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                              {programme.name}
                            </h3>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-600 font-medium">{programmeParticipants.length} teams</span>
                              <span className="text-green-600 font-medium">{totalParticipants} participants</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {programmes.length === 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">🎭</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Programmes Available</h2>
            <p className="text-gray-600">
              Programme information will appear here once events are scheduled
            </p>
          </div>
        )}
      </div>
    </div>
  );
}