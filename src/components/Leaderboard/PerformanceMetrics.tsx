'use client';

interface TeamStats {
    team: { name: string; code: string; color: string };
    totalPoints: number;
    totalWins: number;
    medals: { gold: number; silver: number; bronze: number };
    rank: number;
    momentum: 'up' | 'down' | 'stable';
}

interface IndividualStats {
    candidate: { name: string; chestNumber: string };
    team: { name: string; code: string };
    totalPoints: number;
    totalWins: number;
    medals: { gold: number; silver: number; bronze: number };
    rank: number;
    momentum: 'up' | 'down' | 'stable';
}

interface PerformanceMetricsProps {
    teamStats: TeamStats[];
    individualStats: IndividualStats[];
}

export function PerformanceMetrics({ teamStats, individualStats }: PerformanceMetricsProps) {
    const totalPoints = teamStats.reduce((sum, team) => sum + team.totalPoints, 0);
    const totalMedals = teamStats.reduce((sum, team) => sum + team.medals.gold + team.medals.silver + team.medals.bronze, 0);
    const averagePointsPerTeam = teamStats.length > 0 ? totalPoints / teamStats.length : 0;
    const topPerformer = individualStats[0];
    const leadingTeam = teamStats[0];

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

    return (
        <div className="space-y-8">
            {/* Overall Performance Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Performance Analytics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100">Total Points</p>
                                <p className="text-3xl font-bold">{totalPoints.toLocaleString()}</p>
                            </div>
                            <div className="text-4xl opacity-80">🏆</div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100">Total Medals</p>
                                <p className="text-3xl font-bold">{totalMedals}</p>
                            </div>
                            <div className="text-4xl opacity-80">🏅</div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100">Avg Points/Team</p>
                                <p className="text-3xl font-bold">{Math.round(averagePointsPerTeam)}</p>
                            </div>
                            <div className="text-4xl opacity-80">📊</div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100">Active Teams</p>
                                <p className="text-3xl font-bold">{teamStats.length}</p>
                            </div>
                            <div className="text-4xl opacity-80">🎯</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Leaders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Leading Team */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🥇 Leading Team</h3>
                    {leadingTeam ? (
                        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-2xl font-bold text-gray-900">{leadingTeam.team.name}</h4>
                                    <p className="text-gray-600">{leadingTeam.team.code}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-yellow-600">{leadingTeam.totalPoints}</p>
                                    <p className="text-sm text-gray-600">points</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">🥇 {leadingTeam.medals.gold}</span>
                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">🥈 {leadingTeam.medals.silver}</span>
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">🥉 {leadingTeam.medals.bronze}</span>
                                </div>
                                <div className={`flex items-center gap-1 ${getMomentumColor(leadingTeam.momentum)}`}>
                                    <span>{getMomentumIcon(leadingTeam.momentum)}</span>
                                    <span className="text-sm font-medium">{leadingTeam.momentum}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No team data available
                        </div>
                    )}
                </div>

                {/* Top Individual */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">⭐ Top Individual</h3>
                    {topPerformer ? (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-2xl font-bold text-gray-900">{topPerformer.candidate.name}</h4>
                                    <p className="text-gray-600">#{topPerformer.candidate.chestNumber} • {topPerformer.team.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-purple-600">{topPerformer.totalPoints}</p>
                                    <p className="text-sm text-gray-600">points</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">🥇 {topPerformer.medals.gold}</span>
                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">🥈 {topPerformer.medals.silver}</span>
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">🥉 {topPerformer.medals.bronze}</span>
                                </div>
                                <div className={`flex items-center gap-1 ${getMomentumColor(topPerformer.momentum)}`}>
                                    <span>{getMomentumIcon(topPerformer.momentum)}</span>
                                    <span className="text-sm font-medium">{topPerformer.momentum}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No individual data available
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Trends */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Performance Trends</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl mb-2">📈</div>
                        <div className="text-2xl font-bold text-green-600">
                            {teamStats.filter(t => t.momentum === 'up').length}
                        </div>
                        <div className="text-sm text-gray-600">Teams Trending Up</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-2">➡️</div>
                        <div className="text-2xl font-bold text-gray-600">
                            {teamStats.filter(t => t.momentum === 'stable').length}
                        </div>
                        <div className="text-sm text-gray-600">Teams Stable</div>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl mb-2">📉</div>
                        <div className="text-2xl font-bold text-red-600">
                            {teamStats.filter(t => t.momentum === 'down').length}
                        </div>
                        <div className="text-sm text-gray-600">Teams Declining</div>
                    </div>
                </div>
            </div>

            {/* Competition Insights */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🔍 Competition Insights</h3>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                        <span className="font-medium text-gray-800">Most Competitive</span>
                        <span className="text-blue-600 font-bold">
                            {teamStats.length > 1 ? 
                                `${Math.abs(teamStats[0]?.totalPoints - teamStats[1]?.totalPoints)} point gap` : 
                                'Single team leading'
                            }
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                        <span className="font-medium text-gray-800">Gold Medal Leaders</span>
                        <span className="text-purple-600 font-bold">
                            {teamStats.reduce((max, team) => team.medals.gold > max.medals.gold ? team : max, teamStats[0] || { medals: { gold: 0 } })?.team?.name || 'N/A'}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                        <span className="font-medium text-gray-800">Most Consistent</span>
                        <span className="text-green-600 font-bold">
                            {individualStats.filter(i => i.totalWins >= 3).length} performers with 3+ wins
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}