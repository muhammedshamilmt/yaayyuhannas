'use client';

import { useState } from 'react';

interface TeamStats {
    team: {
        name: string;
        code: string;
        color: string;
        description: string;
    };
    totalPoints: number;
    totalWins: number;
    medals: {
        gold: number;
        silver: number;
        bronze: number;
    };
    memberCount: number;
    rank: number;
    winRate: number;
    averagePoints: number;
    recentPerformance: number[];
    progressData: { programme: string; points: number; date: string; position: number }[];
    strongCategories: string[];
    participationRate: number;
    momentum: 'up' | 'down' | 'stable';
}

interface TeamProfileProps {
    team: TeamStats;
}

export function TeamProfile({ team }: TeamProfileProps) {
    const [activeSection, setActiveSection] = useState<'overview' | 'progress' | 'analysis'>('overview');

    const getPositionColor = (position: number) => {
        switch (position) {
            case 1: return 'bg-yellow-100 text-yellow-800';
            case 2: return 'bg-gray-100 text-gray-800';
            case 3: return 'bg-orange-100 text-orange-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const getPositionEmoji = (position: number) => {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '🏅';
        }
    };

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: team.team.color || '#8b5cf6' }}
                    >
                        {team.team.code.substring(0, 2)}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{team.team.name}</h3>
                        <p className="text-gray-600">{team.team.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                                Rank #{team.rank}
                            </span>
                            <span className="text-sm text-gray-600">
                                {team.memberCount} members
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex border-b">
                {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'progress', label: 'Progress Timeline' },
                    { key: 'analysis', label: 'Performance Analysis' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveSection(tab.key as any)}
                        className={`px-4 py-2 font-medium text-sm ${
                            activeSection === tab.key
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            {activeSection === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">Performance Summary</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-purple-600">{team.totalPoints}</p>
                                <p className="text-sm text-gray-600">Total Points</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">{team.totalWins}</p>
                                <p className="text-sm text-gray-600">Total Wins</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-blue-600">{team.winRate.toFixed(1)}%</p>
                                <p className="text-sm text-gray-600">Win Rate</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-orange-600">{team.averagePoints.toFixed(1)}</p>
                                <p className="text-sm text-gray-600">Avg Points</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">Medal Collection</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-around">
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🥇</div>
                                    <p className="text-xl font-bold text-yellow-600">{team.medals.gold}</p>
                                    <p className="text-sm text-gray-600">Gold</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🥈</div>
                                    <p className="text-xl font-bold text-gray-600">{team.medals.silver}</p>
                                    <p className="text-sm text-gray-600">Silver</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🥉</div>
                                    <p className="text-xl font-bold text-orange-600">{team.medals.bronze}</p>
                                    <p className="text-sm text-gray-600">Bronze</p>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-lg font-bold text-gray-800">
                                    Total: {team.medals.gold + team.medals.silver + team.medals.bronze} medals
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'progress' && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Competition Timeline</h4>
                    <div className="max-h-96 overflow-y-auto">
                        <div className="space-y-3">
                            {team.progressData.slice().reverse().map((progress, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getPositionColor(progress.position)}`}>
                                        {getPositionEmoji(progress.position)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{progress.programme}</p>
                                        <p className="text-sm text-gray-600">{progress.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-purple-600">+{progress.points} pts</p>
                                        <p className="text-sm text-gray-500">Position {progress.position}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'analysis' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Strong Categories</h4>
                            <div className="flex flex-wrap gap-2">
                                {team.strongCategories.map((category, idx) => (
                                    <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium">
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Recent Form</h4>
                            <div className="flex gap-2 mb-2">
                                {team.recentPerformance.slice(-10).map((points, idx) => (
                                    <div 
                                        key={idx}
                                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${
                                            points >= team.averagePoints ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                        title={`${points} points`}
                                    >
                                        {points}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-gray-600">
                                Recent average: {team.recentPerformance.length > 0 ? 
                                    (team.recentPerformance.reduce((a, b) => a + b, 0) / team.recentPerformance.length).toFixed(1) : 0} points
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Team Insights</h4>
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-blue-600">{team.participationRate.toFixed(1)}%</p>
                                    <p className="text-sm text-gray-600">Participation Rate</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-green-600">
                                        {team.momentum === 'up' ? '📈 Rising' : team.momentum === 'down' ? '📉 Declining' : '➡️ Stable'}
                                    </p>
                                    <p className="text-sm text-gray-600">Current Momentum</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-purple-600">
                                        {team.progressData.length}
                                    </p>
                                    <p className="text-sm text-gray-600">Events Participated</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}