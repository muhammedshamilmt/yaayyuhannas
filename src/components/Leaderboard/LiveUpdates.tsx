'use client';

import { useState, useEffect } from 'react';

interface LiveUpdate {
    id: string;
    type: 'result' | 'achievement' | 'milestone';
    message: string;
    timestamp: Date;
    importance: 'high' | 'medium' | 'low';
}

interface LiveUpdatesProps {
    updates: LiveUpdate[];
}

export function LiveUpdates({ updates }: LiveUpdatesProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);

    useEffect(() => {
        if (updates.length > 1) {
            const interval = setInterval(() => {
                setCurrentUpdateIndex((prev) => (prev + 1) % updates.length);
            }, 5000); // Change update every 5 seconds

            return () => clearInterval(interval);
        }
    }, [updates.length]);

    const getImportanceColor = (importance: 'high' | 'medium' | 'low') => {
        switch (importance) {
            case 'high': return 'bg-red-50 border-red-200 text-red-800';
            case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
            default: return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const getTypeIcon = (type: 'result' | 'achievement' | 'milestone') => {
        switch (type) {
            case 'result': return '🏆';
            case 'achievement': return '🌟';
            case 'milestone': return '🎯';
            default: return '📢';
        }
    };

    if (!updates.length) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-900">🔴 Live Updates</h2>
                </div>
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">📡</div>
                    <p className="text-gray-500">No live updates available</p>
                    <p className="text-sm text-gray-400 mt-2">Updates will appear here as events unfold</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Live Updates Feed */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <h2 className="text-2xl font-bold text-white">🔴 Live Updates</h2>
                        </div>
                        <button
                            onClick={() => setIsVisible(!isVisible)}
                            className="text-white hover:text-red-200 transition-colors"
                        >
                            {isVisible ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    <p className="text-red-100 text-sm mt-1">Real-time competition updates</p>
                </div>

                {isVisible && (
                    <div className="p-6">
                        {/* Current Featured Update */}
                        {updates.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">🌟 Featured Update</h3>
                                <div className={`p-4 rounded-lg border-2 ${getImportanceColor(updates[currentUpdateIndex]?.importance)}`}>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{getTypeIcon(updates[currentUpdateIndex]?.type)}</span>
                                        <div className="flex-1">
                                            <p className="font-medium">{updates[currentUpdateIndex]?.message}</p>
                                            <p className="text-sm opacity-75 mt-1">
                                                {updates[currentUpdateIndex]?.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* All Updates List */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800">📋 Recent Updates</h3>
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {updates.map((update, index) => (
                                    <div 
                                        key={update.id} 
                                        className={`p-4 rounded-lg border transition-all duration-300 ${
                                            index === currentUpdateIndex 
                                                ? 'ring-2 ring-blue-300 bg-blue-50' 
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl">{getTypeIcon(update.type)}</span>
                                            <div className="flex-1">
                                                <p className="text-gray-800">{update.message}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImportanceColor(update.importance)}`}>
                                                        {update.importance.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {update.timestamp.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Update Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Update Statistics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl mb-2">🚨</div>
                        <div className="text-2xl font-bold text-red-600">
                            {updates.filter(u => u.importance === 'high').length}
                        </div>
                        <div className="text-sm text-gray-600">High Priority</div>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl mb-2">⚠️</div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {updates.filter(u => u.importance === 'medium').length}
                        </div>
                        <div className="text-sm text-gray-600">Medium Priority</div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl mb-2">ℹ️</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {updates.filter(u => u.importance === 'low').length}
                        </div>
                        <div className="text-sm text-gray-600">Low Priority</div>
                    </div>
                </div>
            </div>

            {/* Update Types Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Update Types</h3>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🏆</span>
                            <span className="font-medium">Results</span>
                        </div>
                        <span className="text-green-600 font-bold">
                            {updates.filter(u => u.type === 'result').length}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🌟</span>
                            <span className="font-medium">Achievements</span>
                        </div>
                        <span className="text-purple-600 font-bold">
                            {updates.filter(u => u.type === 'achievement').length}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🎯</span>
                            <span className="font-medium">Milestones</span>
                        </div>
                        <span className="text-orange-600 font-bold">
                            {updates.filter(u => u.type === 'milestone').length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}