'use client';

interface TeamStats {
    team: { name: string; code: string; color: string };
    totalPoints: number;
    rank: number;
}

interface SimpleBarChartProps {
    data: TeamStats[];
    title?: string;
}

export function SimpleBarChart({ data, title = "Team Rankings" }: SimpleBarChartProps) {
    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No data available</p>
            </div>
        );
    }

    const maxPoints = Math.max(...data.map(d => d.totalPoints));

    return (
        <div className="w-full h-64 p-4 bg-white rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
            <div className="space-y-3">
                {data.slice(0, 5).map((team, index) => {
                    const percentage = maxPoints > 0 ? (team.totalPoints / maxPoints) * 100 : 0;
                    const getRankEmoji = (rank: number) => {
                        if (rank === 1) return '🥇';
                        if (rank === 2) return '🥈';
                        if (rank === 3) return '🥉';
                        return `#${rank}`;
                    };

                    return (
                        <div key={team.team.code} className="flex items-center gap-3">
                            <div className="w-8 text-center">
                                <span className="text-sm font-bold">{getRankEmoji(team.rank)}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700 truncate">
                                        {team.team.name}
                                    </span>
                                    <span className="text-sm font-bold text-purple-600">
                                        {team.totalPoints}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: team.team.color || '#8b5cf6'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}