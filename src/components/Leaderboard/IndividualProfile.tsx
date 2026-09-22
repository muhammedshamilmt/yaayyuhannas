'use client';

import { useState } from 'react';

interface IndividualStats {
    candidate: {
        name: string;
        chestNumber: string;
        section: string;
        profileImage?: string;
    };
    team: {
        name: string;
        code: string;
        color: string;
    };
    totalPoints: number;
    totalWins: number;
    medals: {
        gold: number;
        silver: number;
        bronze: number;
    };
    rank: number;
    winRate: number;
    averagePoints: number;
    recentPerformance: number[];
    achievements: string[];
    strongCategories: string[];
    participationCount: number;
    consistency: number;
    momentum: 'up' | 'down' | 'stable';
}

interface IndividualProfileProps {
    individual: IndividualStats;
}

export function IndividualProfile({ individual }: IndividualProfileProps) {
    const [activeSection, setActiveSection] = useState<'overview' | 'performance' | 'achievements'>('overview');

    const getMomentumIcon = (momentum: 'up' | 'down' | 'stable') => {
        switch (momentum) {
            case 'up': return '📈';
            case 'down': return '📉';
            default: return '➡️';
        }
    };

    const getMomentumColor = (momentum: 'up' | 'down' | 'stable') => {
        switch (momentum) {
            case 'up': return 'text-green-600';
            case 'down': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getConsistencyRating = (consistency: number) => {
        if (consistency >= 80) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
        if (consistency >= 60) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
        if (consistency >= 40) return { label: 'Average', color: 'text-yellow-600 bg-yellow-100' };
        return { label: 'Inconsistent', color: 'text-red-600 bg-red-100' };
    };

    const getSectionColor = (section: string) => {
        switch (section?.toLowerCase()) {
            case 'senior': return 'bg-purple-100 text-purple-800';
            case 'junior': return 'bg-yellow-100 text-yellow-800';
            case 'sub-junior': return 'bg-pink-100 text-pink-800';
            case 'general': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const consistencyRating = getConsistencyRating(individual.consistency);

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                        {individual.candidate.profileImage ? (
                            <img
                                src={individual.candidate.profileImage}
                                alt={individual.candidate.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div 
                                className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: individual.team.color || '#8b5cf6' }}
                            >
                                {individual.candidate.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {individual.candidate.name}
                            <span className={`text-lg ${getMomentumColor(individual.momentum)}`}>
                                {getMomentumIcon(individual.momentum)}
                            </span>
                        </h3>
                        <p className="text-gray-600">#{individual.candidate.chestNumber} • {individual.team.name}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                                Rank #{individual.rank}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSectionColor(individual.candidate.section)}`}>
                                {individual.candidate.section}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex border-b">
                {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'performance', label: 'Performance Analysis' },
                    { key: 'achievements', label: 'Achievements' }
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
                                <p className="text-2xl font-bold text-purple-600">{individual.totalPoints}</p>
                                <p className="text-sm text-gray-600">Total Points</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">{individual.totalWins}</p>
                                <p className="text-sm text-gray-600">Total Wins</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-blue-600">{individual.winRate.toFixed(1)}%</p>
                                <p className="text-sm text-gray-600">Win Rate</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-orange-600">{individual.averagePoints.toFixed(1)}</p>
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
                                    <p className="text-xl font-bold text-yellow-600">{individual.medals.gold}</p>
                                    <p className="text-sm text-gray-600">Gold</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🥈</div>
                                    <p className="text-xl font-bold text-gray-600">{individual.medals.silver}</p>
                                    <p className="text-sm text-gray-600">Silver</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🥉</div>
                                    <p className="text-xl font-bold text-orange-600">{individual.medals.bronze}</p>
                                    <p className="text-sm text-gray-600">Bronze</p>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-lg font-bold text-gray-800">
                                    Total: {individual.medals.gold + individual.medals.silver + individual.medals.bronze} medals
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'performance' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Performance Metrics</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Participation Count:</span>
                                    <span className="font-bold">{individual.participationCount}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Win Rate:</span>
                                    <span className="font-bold text-green-600">{individual.winRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Consistency:</span>
                                    <span className={`font-bold px-2 py-1 rounded ${consistencyRating.color}`}>
                                        {consistencyRating.label}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Current Momentum:</span>
                                    <span className={`font-bold ${getMomentumColor(individual.momentum)}`}>
                                        {getMomentumIcon(individual.momentum)} {individual.momentum.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Recent Form</h4>
                            <div className="space-y-3">
                                <div className="flex gap-2 mb-2">
                                    {individual.recentPerformance.slice(-10).map((points, idx) => (
                                        <div 
                                            key={idx}
                                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${
                                                points >= individual.averagePoints ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                            title={`${points} points`}
                                        >
                                            {points}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600">
                                    Recent average: {individual.recentPerformance.length > 0 ? 
                                        (individual.recentPerformance.reduce((a, b) => a + b, 0) / individual.recentPerformance.length).toFixed(1) : 0} points
                                </p>
                                <div className="mt-4">
                                    <h5 className="font-medium text-gray-700 mb-2">Strong Categories</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {individual.strongCategories.map((category, idx) => (
                                            <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium">
                                                {category}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Chart Placeholder */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-800 mb-3">Performance Trend</h4>
                        <div className="h-32 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="text-3xl mb-2">📊</div>
                                <p>Performance chart visualization</p>
                                <p className="text-sm">Shows points progression over time</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'achievements' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Recent Achievements</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {individual.achievements.length > 0 ? (
                                    individual.achievements.map((achievement, idx) => (
                                        <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                            <p className="text-sm font-medium text-purple-800">{achievement}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <div className="text-3xl mb-2">🏆</div>
                                        <p>No achievements recorded yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Achievement Statistics</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-yellow-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-yellow-800 font-medium">🥇 Gold Medals</span>
                                        <span className="text-xl font-bold text-yellow-600">{individual.medals.gold}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 font-medium">🥈 Silver Medals</span>
                                        <span className="text-xl font-bold text-gray-600">{individual.medals.silver}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-orange-800 font-medium">🥉 Bronze Medals</span>
                                        <span className="text-xl font-bold text-orange-600">{individual.medals.bronze}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-800 font-medium">📊 Total Events</span>
                                        <span className="text-xl font-bold text-blue-600">{individual.participationCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Achievement Milestones */}
                    <div className="bg-white border rounded-lg p-6">
                        <h4 className="font-semibold text-gray-800 mb-4">🎯 Achievement Milestones</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-3 rounded-lg ${individual.medals.gold >= 1 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                                <div className="flex items-center justify-between">
                                    <span>First Gold Medal</span>
                                    <span>{individual.medals.gold >= 1 ? '✅' : '⏳'}</span>
                                </div>
                            </div>
                            
                            <div className={`p-3 rounded-lg ${individual.totalWins >= 5 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                                <div className="flex items-center justify-between">
                                    <span>5 Wins Milestone</span>
                                    <span>{individual.totalWins >= 5 ? '✅' : '⏳'}</span>
                                </div>
                            </div>
                            
                            <div className={`p-3 rounded-lg ${individual.totalPoints >= 50 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                                <div className="flex items-center justify-between">
                                    <span>50 Points Club</span>
                                    <span>{individual.totalPoints >= 50 ? '✅' : '⏳'}</span>
                                </div>
                            </div>
                            
                            <div className={`p-3 rounded-lg ${individual.consistency >= 80 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                                <div className="flex items-center justify-between">
                                    <span>Consistency Master</span>
                                    <span>{individual.consistency >= 80 ? '✅' : '⏳'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}