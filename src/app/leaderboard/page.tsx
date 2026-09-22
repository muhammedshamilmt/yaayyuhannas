'use client';

import { useState, useEffect, useCallback } from 'react';
import { Team, Candidate, Programme, Result } from '@/types';
import { PublicNavbar } from '@/components/Navigation/PublicNavbar';
import { PublicFooter } from '@/components/Navigation/PublicFooter';
import { DynamicChart } from '@/components/Charts/DynamicChart';
import { PerformanceMetrics } from '@/components/Leaderboard/PerformanceMetrics';
import { LiveUpdates } from '@/components/Leaderboard/LiveUpdates';
import { TeamProfile } from '@/components/Leaderboard/TeamProfile';
import { IndividualProfile } from '@/components/Leaderboard/IndividualProfile';

interface TeamStats {
    team: Team;
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

interface IndividualStats {
    candidate: Candidate;
    team: Team;
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

interface SectionStats {
    section: string;
    totalPoints: number;
    teamCount: number;
    topTeam: string;
    averagePoints: number;
    rank: number;
    participationRate: number;
    competitiveness: number;
    dominantCategory: string;
}

interface LiveUpdate {
    id: string;
    type: 'result' | 'achievement' | 'milestone';
    message: string;
    timestamp: Date;
    importance: 'high' | 'medium' | 'low';
}

export default function DynamicLeaderboardPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'individuals' | 'sections' | 'live'>('overview');
    const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
    const [individualStats, setIndividualStats] = useState<IndividualStats[]>([]);
    const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [selectedIndividual, setSelectedIndividual] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isClient, setIsClient] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [teamsRes, candidatesRes, programmesRes, resultsRes] = await Promise.all([
                fetch('/api/teams'),
                fetch('/api/candidates'),
                fetch('/api/programmes'),
                fetch('/api/results')
            ]);

            const [teamsData, candidatesData, programmesData, resultsData] = await Promise.all([
                teamsRes.json(),
                candidatesRes.json(),
                programmesRes.json(),
                resultsRes.json()
            ]);

            setTeams(teamsData || []);
            setCandidates(candidatesData || []);
            setProgrammes(programmesData || []);
            setResults(resultsData || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsClient(true);
        fetchData();
    }, [fetchData]);

    // Auto-refresh functionality
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh && isClient) {
            interval = setInterval(() => {
                fetchData();
            }, 30000); // Refresh every 30 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, isClient, fetchData]);

    useEffect(() => {
        if (teams.length > 0 && results.length > 0 && candidates.length > 0) {
            calculateAdvancedStats();
        }
    }, [teams, results, candidates, programmes]);

    const calculateAdvancedStats = () => {
        // Enhanced team statistics calculation
        const teamStatsMap: { [teamCode: string]: TeamStats } = {};
        
        teams.forEach(team => {
            const teamCandidates = candidates.filter(c => c.team === team.code);
            teamStatsMap[team.code] = {
                team,
                totalPoints: 0,
                totalWins: 0,
                medals: { gold: 0, silver: 0, bronze: 0 },
                memberCount: teamCandidates.length,
                rank: 0,
                winRate: 0,
                averagePoints: 0,
                recentPerformance: [],
                progressData: [],
                strongCategories: [],
                participationRate: 0,
                momentum: 'stable'
            };
        });

        // Calculate detailed statistics from results
        const recentResults = results.slice(-10); // Last 10 results for momentum
        let totalParticipations = 0;

        results.forEach((result, index) => {
            const programme = programmes.find(p => p._id === result.programmeId || p.id === result.programmeId);
            const programmeName = programme?.name || 'Unknown Programme';
            const category = programme?.category || 'general';
            const resultDate = result.createdAt ? new Date(result.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const isRecent = recentResults.includes(result);

            totalParticipations++;

            // Process individual results
            [
                { place: result.firstPlace, points: programme?.firstPoints ?? result.firstPoints, medal: 'gold' as const, position: 1 },
                { place: result.secondPlace, points: programme?.secondPoints ?? result.secondPoints, medal: 'silver' as const, position: 2 },
                { place: result.thirdPlace, points: programme?.thirdPoints ?? result.thirdPoints, medal: 'bronze' as const, position: 3 }
            ].forEach(({ place, points, medal, position }) => {
                (place || []).forEach(participant => {
                    const candidate = candidates.find(c => c.chestNumber === participant.chestNumber);
                    if (candidate && teamStatsMap[candidate.team]) {
                        const teamStat = teamStatsMap[candidate.team];
                        teamStat.totalPoints += points;
                        teamStat.totalWins += 1;
                        teamStat.medals[medal] += 1;
                        
                        // Track progress over time
                        teamStat.progressData.push({
                            programme: programmeName,
                            points: points,
                            date: resultDate,
                            position: position
                        });

                        // Track recent performance for momentum
                        if (isRecent) {
                            teamStat.recentPerformance.push(points);
                        }

                        // Track strong categories
                        if (!teamStat.strongCategories.includes(category)) {
                            teamStat.strongCategories.push(category);
                        }
                    }
                });
            });

            // Process individual participation grades
            (result.participationGrades || []).forEach(participant => {
                const candidate = candidates.find(c => c.chestNumber === participant.chestNumber);
                if (candidate && teamStatsMap[candidate.team]) {
                    const teamStat = teamStatsMap[candidate.team];
                    const points = participant.points || programme?.participationPoints || result.participationPoints || 0;
                    if (points > 0) {
                        teamStat.totalPoints += points;
                        
                        teamStat.progressData.push({
                            programme: programmeName,
                            points: points,
                            date: resultDate,
                            position: 4 // 4 for participation
                        });

                        if (isRecent) {
                            teamStat.recentPerformance.push(points);
                        }
                    }
                }
            });

            // Process team results
            [
                { teams: result.firstPlaceTeams, points: programme?.firstPoints ?? result.firstPoints, medal: 'gold' as const, position: 1 },
                { teams: result.secondPlaceTeams, points: programme?.secondPoints ?? result.secondPoints, medal: 'silver' as const, position: 2 },
                { teams: result.thirdPlaceTeams, points: programme?.thirdPoints ?? result.thirdPoints, medal: 'bronze' as const, position: 3 }
            ].forEach(({ teams, points, medal, position }) => {
                (teams || []).forEach(teamResult => {
                    if (teamStatsMap[teamResult.teamCode]) {
                        const teamStat = teamStatsMap[teamResult.teamCode];
                        teamStat.totalPoints += points;
                        teamStat.totalWins += 1;
                        teamStat.medals[medal] += 1;
                        
                        teamStat.progressData.push({
                            programme: programmeName,
                            points: points,
                            date: resultDate,
                            position: position
                        });

                        if (isRecent) {
                            teamStat.recentPerformance.push(points);
                        }
                    }
                });
            });

            // Process team participation grades
            (result.participationTeamGrades || []).forEach(teamResult => {
                if (teamStatsMap[teamResult.teamCode]) {
                    const teamStat = teamStatsMap[teamResult.teamCode];
                    const points = teamResult.points || programme?.participationPoints || result.participationPoints || 0;
                    
                    if (points > 0) {
                        teamStat.totalPoints += points;
                        
                        teamStat.progressData.push({
                            programme: programmeName,
                            points: points,
                            date: resultDate,
                            position: 4 // 4 for participation
                        });

                        if (isRecent) {
                            teamStat.recentPerformance.push(points);
                        }
                    }
                }
            });
        });

        // Calculate advanced metrics for teams
        Object.values(teamStatsMap).forEach(teamStat => {
            const totalParticipationsForTeam = teamStat.progressData.length;
            teamStat.winRate = totalParticipationsForTeam > 0 ? (teamStat.totalWins / totalParticipationsForTeam) * 100 : 0;
            teamStat.averagePoints = totalParticipationsForTeam > 0 ? teamStat.totalPoints / totalParticipationsForTeam : 0;
            teamStat.participationRate = teamStat.memberCount > 0 ? (totalParticipationsForTeam / teamStat.memberCount) * 100 : 0;
            
            // Calculate momentum based on recent performance
            if (teamStat.recentPerformance.length >= 3) {
                const recent = teamStat.recentPerformance.slice(-3);
                const earlier = teamStat.recentPerformance.slice(-6, -3);
                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const earlierAvg = earlier.length > 0 ? earlier.reduce((a, b) => a + b, 0) / earlier.length : recentAvg;
                
                if (recentAvg > earlierAvg * 1.1) {
                    teamStat.momentum = 'up';
                } else if (recentAvg < earlierAvg * 0.9) {
                    teamStat.momentum = 'down';
                } else {
                    teamStat.momentum = 'stable';
                }
            }
        });

        // Sort and assign ranks
        const sortedTeamStats = Object.values(teamStatsMap)
            .sort((a, b) => b.totalPoints - a.totalPoints || b.totalWins - a.totalWins)
            .map((team, index) => ({ ...team, rank: index + 1 }));

        setTeamStats(sortedTeamStats);

        // Calculate individual statistics
        const individualStatsMap: { [chestNumber: string]: IndividualStats } = {};
        
        candidates.forEach(candidate => {
            const team = teams.find(t => t.code === candidate.team);
            if (team) {
                individualStatsMap[candidate.chestNumber] = {
                    candidate,
                    team,
                    totalPoints: 0,
                    totalWins: 0,
                    medals: { gold: 0, silver: 0, bronze: 0 },
                    rank: 0,
                    winRate: 0,
                    averagePoints: 0,
                    recentPerformance: [],
                    achievements: [],
                    strongCategories: [],
                    participationCount: 0,
                    consistency: 0,
                    momentum: 'stable'
                };
            }
        });

        results.forEach(result => {
            const programme = programmes.find(p => p._id === result.programmeId || p.id === result.programmeId);
            const programmeName = programme?.name || 'Unknown Programme';
            const category = programme?.category || 'general';
            const isRecent = recentResults.includes(result);

            [
                { place: result.firstPlace, points: programme?.firstPoints ?? result.firstPoints, medal: 'gold' as const, emoji: '🥇' },
                { place: result.secondPlace, points: programme?.secondPoints ?? result.secondPoints, medal: 'silver' as const, emoji: '🥈' },
                { place: result.thirdPlace, points: programme?.thirdPoints ?? result.thirdPoints, medal: 'bronze' as const, emoji: '🥉' }
            ].forEach(({ place, points, medal, emoji }) => {
                (place || []).forEach(participant => {
                    if (individualStatsMap[participant.chestNumber]) {
                        const individualStat = individualStatsMap[participant.chestNumber];
                        individualStat.totalPoints += points;
                        individualStat.totalWins += 1;
                        individualStat.medals[medal] += 1;
                        individualStat.participationCount += 1;
                        individualStat.achievements.push(`${emoji} ${programmeName}`);
                        
                        if (!individualStat.strongCategories.includes(category)) {
                            individualStat.strongCategories.push(category);
                        }

                        if (isRecent) {
                            individualStat.recentPerformance.push(points);
                        }
                    }
                });
            });

            // Process individual participation grades
            (result.participationGrades || []).forEach(participant => {
                if (individualStatsMap[participant.chestNumber]) {
                    const individualStat = individualStatsMap[participant.chestNumber];
                    const points = participant.points || programme?.participationPoints || result.participationPoints || 0;
                    
                    if (points > 0) {
                        individualStat.totalPoints += points;
                        individualStat.participationCount += 1;
                        individualStat.achievements.push(`🎖️ ${programmeName} (Grade ${participant.grade})`);
                        
                        if (!individualStat.strongCategories.includes(category)) {
                            individualStat.strongCategories.push(category);
                        }

                        if (isRecent) {
                            individualStat.recentPerformance.push(points);
                        }
                    }
                }
            });
        });

        // Calculate advanced metrics for individuals
        Object.values(individualStatsMap).forEach(individualStat => {
            individualStat.winRate = individualStat.participationCount > 0 ? (individualStat.totalWins / individualStat.participationCount) * 100 : 0;
            individualStat.averagePoints = individualStat.participationCount > 0 ? individualStat.totalPoints / individualStat.participationCount : 0;
            
            // Calculate consistency (lower standard deviation = higher consistency)
            if (individualStat.recentPerformance.length > 1) {
                const mean = individualStat.recentPerformance.reduce((a, b) => a + b, 0) / individualStat.recentPerformance.length;
                const variance = individualStat.recentPerformance.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / individualStat.recentPerformance.length;
                individualStat.consistency = Math.max(0, 100 - Math.sqrt(variance));
            } else {
                individualStat.consistency = 100;
            }

            // Calculate momentum
            if (individualStat.recentPerformance.length >= 3) {
                const recent = individualStat.recentPerformance.slice(-3);
                const earlier = individualStat.recentPerformance.slice(-6, -3);
                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const earlierAvg = earlier.length > 0 ? earlier.reduce((a, b) => a + b, 0) / earlier.length : recentAvg;
                
                if (recentAvg > earlierAvg * 1.1) {
                    individualStat.momentum = 'up';
                } else if (recentAvg < earlierAvg * 0.9) {
                    individualStat.momentum = 'down';
                } else {
                    individualStat.momentum = 'stable';
                }
            }
        });

        const sortedIndividualStats = Object.values(individualStatsMap)
            .filter(individual => individual.totalPoints > 0)
            .sort((a, b) => b.totalPoints - a.totalPoints || b.totalWins - a.totalWins)
            .map((individual, index) => ({ ...individual, rank: index + 1 }));

        setIndividualStats(sortedIndividualStats);

        // Calculate section statistics
        const sectionStatsMap: { [section: string]: SectionStats } = {};
        
        teams.forEach(team => {
            const section = team.code.split('-')[0] || 'Other';
            if (!sectionStatsMap[section]) {
                sectionStatsMap[section] = {
                    section,
                    totalPoints: 0,
                    teamCount: 0,
                    topTeam: '',
                    averagePoints: 0,
                    rank: 0,
                    participationRate: 0,
                    competitiveness: 0,
                    dominantCategory: ''
                };
            }

            const teamStat = sortedTeamStats.find(t => t.team.code === team.code);
            if (teamStat) {
                sectionStatsMap[section].totalPoints += teamStat.totalPoints;
                sectionStatsMap[section].teamCount += 1;

                if (!sectionStatsMap[section].topTeam || teamStat.totalPoints > 
                    (sortedTeamStats.find(t => t.team.name === sectionStatsMap[section].topTeam)?.totalPoints || 0)) {
                    sectionStatsMap[section].topTeam = team.name;
                }
            }
        });

        // Calculate section metrics
        Object.values(sectionStatsMap).forEach(section => {
            section.averagePoints = section.teamCount > 0 ? section.totalPoints / section.teamCount : 0;
            
            // Calculate competitiveness (how close teams are to each other)
            const sectionTeams = sortedTeamStats.filter(t => t.team.code.startsWith(section.section));
            if (sectionTeams.length > 1) {
                const points = sectionTeams.map(t => t.totalPoints);
                const max = Math.max(...points);
                const min = Math.min(...points);
                section.competitiveness = max > 0 ? ((max - min) / max) * 100 : 0;
            }
        });

        const sortedSectionStats = Object.values(sectionStatsMap)
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((section, index) => ({ ...section, rank: index + 1 }));

        setSectionStats(sortedSectionStats);

        // Generate live updates
        generateLiveUpdates(sortedTeamStats, sortedIndividualStats);
    };

    const generateLiveUpdates = (teamStats: TeamStats[], individualStats: IndividualStats[]) => {
        const updates: LiveUpdate[] = [];
        const now = new Date();

        // Check for milestones and achievements
        teamStats.forEach(team => {
            if (team.totalPoints >= 100 && team.totalPoints < 110) {
                updates.push({
                    id: `milestone-${team.team.code}-100`,
                    type: 'milestone',
                    message: `🎯 ${team.team.name} has reached 100 points!`,
                    timestamp: now,
                    importance: 'high'
                });
            }

            if (team.momentum === 'up') {
                updates.push({
                    id: `momentum-${team.team.code}`,
                    type: 'achievement',
                    message: `📈 ${team.team.name} is on a winning streak!`,
                    timestamp: now,
                    importance: 'medium'
                });
            }
        });

        individualStats.slice(0, 3).forEach(individual => {
            if (individual.medals.gold >= 3) {
                updates.push({
                    id: `gold-${individual.candidate.chestNumber}`,
                    type: 'achievement',
                    message: `🏆 ${individual.candidate.name} has won ${individual.medals.gold} gold medals!`,
                    timestamp: now,
                    importance: 'high'
                });
            }
        });

        setLiveUpdates(updates.slice(0, 10)); // Keep only latest 10 updates
    };    
const getRankBadge = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
        if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-purple-100 text-purple-800 border-purple-200';
    };

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

    const filteredTeamStats = teamStats.filter(team => {
        const matchesSearch = team.team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             team.team.code.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const filteredIndividualStats = individualStats.filter(individual => {
        const matchesSearch = individual.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             individual.team.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (!isClient || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
                <PublicNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                        <p className="text-gray-600">Loading dynamic leaderboard...</p>
                    </div>
                </div>
                <PublicFooter />
            </div>
        );
    }

    const hasData = teams.length > 0 && results.length > 0;

    if (!hasData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
                <PublicNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🚀</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dynamic Leaderboard Loading...</h1>
                        <p className="text-gray-600 mb-6">
                            Real-time competition tracking will be available once events begin.
                        </p>
                        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
                            <h3 className="font-semibold mb-2">Coming Features:</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Live performance tracking</li>
                                <li>• Dynamic momentum indicators</li>
                                <li>• Real-time achievement notifications</li>
                                <li>• Advanced analytics dashboard</li>
                                <li>• Interactive team profiles</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <PublicFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100" suppressHydrationWarning>
            <PublicNavbar />

            <div className="container mx-auto px-4 py-8">
                {/* Dynamic Header with Live Stats */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        🚀 Dynamic Leaderboard
                        <span className="ml-3 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            LIVE
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
                        Real-time competition tracking with advanced analytics and performance insights
                    </p>
                    <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
                        <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <span>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
                        </div>
                    </div>
                </div>

                {/* Live Updates Ticker */}
                {liveUpdates.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-8 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold text-gray-800">Live Updates</span>
                        </div>
                        <div className="animate-marquee whitespace-nowrap">
                            {liveUpdates.map((update, index) => (
                                <span key={update.id} className="inline-block mr-8 text-sm text-gray-600">
                                    {update.message}
                                    {index < liveUpdates.length - 1 && <span className="mx-4">•</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Enhanced Stats Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center transform hover:scale-105 transition-transform">
                        <div className="text-3xl mb-2">🏆</div>
                        <p className="text-3xl font-bold text-purple-600">{teamStats.length}</p>
                        <p className="text-gray-600">Active Teams</p>
                        <div className="mt-2 text-xs text-gray-500">
                            {teamStats.filter(t => t.momentum === 'up').length} trending up
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center transform hover:scale-105 transition-transform">
                        <div className="text-3xl mb-2">⭐</div>
                        <p className="text-3xl font-bold text-green-600">{individualStats.length}</p>
                        <p className="text-gray-600">Top Performers</p>
                        <div className="mt-2 text-xs text-gray-500">
                            {individualStats.filter(i => i.medals.gold > 0).length} gold medalists
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center transform hover:scale-105 transition-transform">
                        <div className="text-3xl mb-2">🎯</div>
                        <p className="text-3xl font-bold text-blue-600">{results.length}</p>
                        <p className="text-gray-600">Events Completed</p>
                        <div className="mt-2 text-xs text-gray-500">
                            {Math.round((results.length / programmes.length) * 100)}% progress
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center transform hover:scale-105 transition-transform">
                        <div className="text-3xl mb-2">🔥</div>
                        <p className="text-3xl font-bold text-orange-600">
                            {teamStats.reduce((sum, team) => sum + team.totalPoints, 0)}
                        </p>
                        <p className="text-gray-600">Total Points</p>
                        <div className="mt-2 text-xs text-gray-500">
                            Avg: {Math.round(teamStats.reduce((sum, team) => sum + team.totalPoints, 0) / teamStats.length || 0)}
                        </div>
                    </div>
                </div>

                {/* Control Panel */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <input
                                type="text"
                                placeholder="Search teams or performers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="autoRefresh"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="autoRefresh" className="text-sm text-gray-700">Auto-refresh</label>
                            </div>
                            
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        🔄 Refresh
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-8">
                    <div className="flex flex-wrap border-b">
                        {[
                            { key: 'overview', label: '📊 Overview', icon: '📊' },
                            { key: 'teams', label: '🏆 Team Analytics', icon: '🏆' },
                            { key: 'individuals', label: '⭐ Individual Stats', icon: '⭐' },
                            { key: 'sections', label: '🏛️ Section Analysis', icon: '🏛️' },
                            { key: 'live', label: '🔴 Live Feed', icon: '🔴' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`px-4 py-4 font-medium text-sm md:text-base transition-colors ${activeTab === tab.key
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="hidden md:inline">{tab.label}</span>
                                <span className="md:hidden">{tab.icon}</span>
                            </button>
                        ))}
                    </div>
                </div>          
      {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Dynamic Championship Podium */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🏆 Live Championship Standings</h2>
                            {teamStats.length >= 3 ? (
                                <div className="flex items-end justify-center gap-8 mb-8">
                                    {/* Second Place */}
                                    <div className="text-center">
                                        <div className="bg-gradient-to-t from-gray-400 to-gray-300 rounded-lg p-6 h-32 flex items-end justify-center mb-4 shadow-lg relative">
                                            <div className="absolute top-2 right-2">
                                                <span className={`text-lg ${getMomentumColor(teamStats[1]?.momentum)}`}>
                                                    {getMomentumIcon(teamStats[1]?.momentum)}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-4xl mb-2">🥈</div>
                                                <div className="text-white font-bold text-lg">{teamStats[1]?.totalPoints}</div>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg">{teamStats[1]?.team.name}</h3>
                                        <p className="text-gray-600">{teamStats[1]?.team.code}</p>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-center gap-1">
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">🥇 {teamStats[1]?.medals.gold}</span>
                                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">🥈 {teamStats[1]?.medals.silver}</span>
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">🥉 {teamStats[1]?.medals.bronze}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Win Rate: {teamStats[1]?.winRate.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* First Place */}
                                    <div className="text-center">
                                        <div className="bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-lg p-6 h-40 flex items-end justify-center mb-4 shadow-lg animate-pulse relative">
                                            <div className="absolute top-2 right-2">
                                                <span className={`text-lg ${getMomentumColor(teamStats[0]?.momentum)}`}>
                                                    {getMomentumIcon(teamStats[0]?.momentum)}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-5xl mb-2">🥇</div>
                                                <div className="text-white font-bold text-xl">{teamStats[0]?.totalPoints}</div>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-xl text-yellow-600">{teamStats[0]?.team.name}</h3>
                                        <p className="text-gray-600">{teamStats[0]?.team.code}</p>
                                        <div className="mt-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                            🏆 Festival Champion
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-center gap-1">
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">🥇 {teamStats[0]?.medals.gold}</span>
                                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">🥈 {teamStats[0]?.medals.silver}</span>
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">🥉 {teamStats[0]?.medals.bronze}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Win Rate: {teamStats[0]?.winRate.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Third Place */}
                                    <div className="text-center">
                                        <div className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-lg p-6 h-24 flex items-end justify-center mb-4 shadow-lg relative">
                                            <div className="absolute top-2 right-2">
                                                <span className={`text-lg ${getMomentumColor(teamStats[2]?.momentum)}`}>
                                                    {getMomentumIcon(teamStats[2]?.momentum)}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-4xl mb-2">🥉</div>
                                                <div className="text-white font-bold">{teamStats[2]?.totalPoints}</div>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg">{teamStats[2]?.team.name}</h3>
                                        <p className="text-gray-600">{teamStats[2]?.team.code}</p>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-center gap-1">
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">🥇 {teamStats[2]?.medals.gold}</span>
                                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">🥈 {teamStats[2]?.medals.silver}</span>
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">🥉 {teamStats[2]?.medals.bronze}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Win Rate: {teamStats[2]?.winRate.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🏆</div>
                                    <p className="text-gray-500">Championship standings will be revealed as competitions progress...</p>
                                </div>
                            )}
                        </div>

                        {/* Performance Insights */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Momentum Leaders */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Momentum Leaders</h3>
                                <div className="space-y-3">
                                    {teamStats.filter(t => t.momentum === 'up').slice(0, 5).map((team) => (
                                        <div key={team.team.code} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="text-green-600 text-lg">📈</span>
                                                <div>
                                                    <p className="font-semibold">{team.team.name}</p>
                                                    <p className="text-sm text-gray-600">Recent avg: {team.recentPerformance.length > 0 ? (team.recentPerformance.reduce((a, b) => a + b, 0) / team.recentPerformance.length).toFixed(1) : 0} pts</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">{team.totalPoints} pts</p>
                                                <p className="text-sm text-gray-500">#{team.rank}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Individual Performers */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">⭐ Star Performers</h3>
                                <div className="space-y-3">
                                    {individualStats.slice(0, 5).map((individual) => (
                                        <div key={individual.candidate.chestNumber} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getRankColor(individual.rank)}`}>
                                                    {getRankBadge(individual.rank)}
                                                </span>
                                                <div>
                                                    <p className="font-semibold">{individual.candidate.name}</p>
                                                    <p className="text-sm text-gray-600">#{individual.candidate.chestNumber} • {individual.team.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-purple-600">{individual.totalPoints} pts</p>
                                                <div className="flex gap-1">
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">🥇{individual.medals.gold}</span>
                                                    <span className="text-xs bg-gray-100 text-gray-800 px-1 rounded">🥈{individual.medals.silver}</span>
                                                    <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">🥉{individual.medals.bronze}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section Performance Overview */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏛️ Section Performance Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sectionStats.map((section) => (
                                    <div key={section.section} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-bold">{section.section}</h3>
                                            <span className={`px-2 py-1 rounded-full text-sm font-bold border ${getRankColor(section.rank)}`}>
                                                {getRankBadge(section.rank)}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-purple-600 font-bold">{section.totalPoints} points</p>
                                            <p className="text-sm text-gray-600">{section.teamCount} teams</p>
                                            <p className="text-sm text-blue-600">Avg: {Math.round(section.averagePoints)} pts</p>
                                            <p className="text-sm text-green-600">Leader: {section.topTeam}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
                                                    style={{ width: `${Math.min((section.averagePoints / (teamStats[0]?.totalPoints || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}    
            {activeTab === 'teams' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">🏆 Advanced Team Analytics</h2>
                                <div className="text-sm text-gray-600">
                                    {filteredTeamStats.length} teams • Real-time tracking
                                </div>
                            </div>

                            <div className="space-y-6">
                                {filteredTeamStats.map((team) => (
                                    <div key={team.team.code} className="border rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-4 py-2 rounded-full font-bold border-2 ${getRankColor(team.rank)} text-lg`}>
                                                    {getRankBadge(team.rank)}
                                                </span>
                                                <div>
                                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                                        {team.team.name}
                                                        <span className={`text-lg ${getMomentumColor(team.momentum)}`}>
                                                            {getMomentumIcon(team.momentum)}
                                                        </span>
                                                    </h3>
                                                    <p className="text-gray-600">{team.team.code} • {team.memberCount} members</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setSelectedTeam(selectedTeam === team.team.code ? null : team.team.code)}
                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                {selectedTeam === team.team.code ? 'Hide Details' : 'View Profile'}
                                            </button>
                                        </div>

                                        {/* Team Stats Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                <p className="text-2xl font-bold text-purple-600">{team.totalPoints}</p>
                                                <p className="text-sm text-gray-600">Total Points</p>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <p className="text-2xl font-bold text-green-600">{team.totalWins}</p>
                                                <p className="text-sm text-gray-600">Total Wins</p>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <p className="text-2xl font-bold text-blue-600">{team.winRate.toFixed(1)}%</p>
                                                <p className="text-sm text-gray-600">Win Rate</p>
                                            </div>
                                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                <p className="text-2xl font-bold text-orange-600">{team.averagePoints.toFixed(1)}</p>
                                                <p className="text-sm text-gray-600">Avg Points</p>
                                            </div>
                                        </div>

                                        {/* Medal Display */}
                                        <div className="flex justify-center gap-4 mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-yellow-600">{team.medals.gold}</div>
                                                <div className="text-xs text-gray-500">🥇 Gold</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-600">{team.medals.silver}</div>
                                                <div className="text-xs text-gray-500">🥈 Silver</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-orange-600">{team.medals.bronze}</div>
                                                <div className="text-xs text-gray-500">🥉 Bronze</div>
                                            </div>
                                        </div>

                                        {/* Performance Indicators */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-sm text-gray-600 mb-1">Participation Rate</p>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${Math.min(team.participationRate, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{team.participationRate.toFixed(1)}%</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-sm text-gray-600 mb-1">Strong Categories</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {team.strongCategories.map((category, idx) => (
                                                        <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                                            {category}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-sm text-gray-600 mb-1">Recent Form</p>
                                                <div className="flex gap-1">
                                                    {team.recentPerformance.slice(-5).map((points, idx) => (
                                                        <div 
                                                            key={idx}
                                                            className={`w-4 h-4 rounded ${points >= team.averagePoints ? 'bg-green-500' : 'bg-red-500'}`}
                                                            title={`${points} points`}
                                                        ></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Team Profile */}
                                        {selectedTeam === team.team.code && (
                                            <div className="mt-6 pt-6 border-t bg-white rounded-lg p-4">
                                                <TeamProfile team={team} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'individuals' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">⭐ Individual Performance Analytics</h2>
                                <div className="text-sm text-gray-600">
                                    {filteredIndividualStats.length} top performers
                                </div>
                            </div>

                            <div className="space-y-6">
                                {filteredIndividualStats.map((individual) => (
                                    <div key={individual.candidate.chestNumber} className="border rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-purple-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-4 py-2 rounded-full font-bold border-2 ${getRankColor(individual.rank)} text-lg`}>
                                                    {getRankBadge(individual.rank)}
                                                </span>
                                                <div>
                                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                                        {individual.candidate.name}
                                                        <span className={`text-lg ${getMomentumColor(individual.momentum)}`}>
                                                            {getMomentumIcon(individual.momentum)}
                                                        </span>
                                                    </h3>
                                                    <p className="text-gray-600">#{individual.candidate.chestNumber} • {individual.team.name} • {individual.candidate.section}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setSelectedIndividual(selectedIndividual === individual.candidate.chestNumber ? null : individual.candidate.chestNumber)}
                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                {selectedIndividual === individual.candidate.chestNumber ? 'Hide Profile' : 'View Profile'}
                                            </button>
                                        </div>

                                        {/* Individual Stats Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                <p className="text-xl font-bold text-purple-600">{individual.totalPoints}</p>
                                                <p className="text-xs text-gray-600">Points</p>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <p className="text-xl font-bold text-green-600">{individual.totalWins}</p>
                                                <p className="text-xs text-gray-600">Wins</p>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <p className="text-xl font-bold text-blue-600">{individual.winRate.toFixed(1)}%</p>
                                                <p className="text-xs text-gray-600">Win Rate</p>
                                            </div>
                                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                <p className="text-xl font-bold text-orange-600">{individual.averagePoints.toFixed(1)}</p>
                                                <p className="text-xs text-gray-600">Avg Points</p>
                                            </div>
                                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                                <p className="text-xl font-bold text-yellow-600">{individual.consistency.toFixed(0)}%</p>
                                                <p className="text-xs text-gray-600">Consistency</p>
                                            </div>
                                        </div>

                                        {/* Medal Display */}
                                        <div className="flex justify-center gap-6 mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-yellow-600">{individual.medals.gold}</div>
                                                <div className="text-xs text-gray-500">🥇 Gold</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-600">{individual.medals.silver}</div>
                                                <div className="text-xs text-gray-500">🥈 Silver</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-orange-600">{individual.medals.bronze}</div>
                                                <div className="text-xs text-gray-500">🥉 Bronze</div>
                                            </div>
                                        </div>

                                        {/* Recent Achievements Preview */}
                                        {individual.achievements.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Achievements</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {individual.achievements.slice(0, 3).map((achievement, idx) => (
                                                        <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                                            {achievement}
                                                        </span>
                                                    ))}
                                                    {individual.achievements.length > 3 && (
                                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                                                            +{individual.achievements.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Expanded Individual Profile */}
                                        {selectedIndividual === individual.candidate.chestNumber && (
                                            <div className="mt-6 pt-6 border-t bg-white rounded-lg p-4">
                                                <IndividualProfile individual={individual} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sections' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">🏛️ Section Analysis Dashboard</h2>
                            <div className="text-sm text-gray-600">
                                Comprehensive department performance
                            </div>
                        </div>

                        <div className="space-y-6">
                            {sectionStats.map((section) => (
                                <div key={section.section} className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-gradient-to-r from-white to-blue-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-4 py-2 rounded-full font-bold border-2 ${getRankColor(section.rank)} text-lg`}>
                                                {getRankBadge(section.rank)}
                                            </span>
                                            <div>
                                                <h3 className="text-2xl font-bold">{section.section}</h3>
                                                <p className="text-gray-600">{section.teamCount} teams competing</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-purple-600">{section.totalPoints}</p>
                                            <p className="text-sm text-gray-600">Total Points</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-2">Performance Metrics</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Average Points:</span>
                                                    <span className="font-bold text-blue-600">{Math.round(section.averagePoints)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Participation Rate:</span>
                                                    <span className="font-bold text-green-600">{section.participationRate.toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Competitiveness:</span>
                                                    <span className="font-bold text-orange-600">{section.competitiveness.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-2">Leading Team</h4>
                                            <p className="text-lg font-bold text-green-600">{section.topTeam}</p>
                                            <p className="text-sm text-gray-600">Department Champion</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-2">Performance Index</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                    <div 
                                                        className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full"
                                                        style={{ width: `${Math.min((section.averagePoints / (teamStats[0]?.totalPoints || 1)) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-bold text-purple-600">
                                                    {Math.round((section.averagePoints / (teamStats[0]?.totalPoints || 1)) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'live' && (
                    <div className="space-y-6">
                        <LiveUpdates updates={liveUpdates} />
                        <PerformanceMetrics teamStats={teamStats} individualStats={individualStats} />
                    </div>
                )}
            </div>

            <PublicFooter />
        </div>
    );
}