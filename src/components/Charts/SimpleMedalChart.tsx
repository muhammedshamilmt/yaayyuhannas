'use client';

interface TeamStats {
    team: { name: string; code: string; color: string };
    medals: { gold: number; silver: number; bronze: number };
    rank: number;
}

interface SimpleMedalChartProps {
    data: TeamStats[];
    title?: string;
}

export function SimpleMedalChart({ data, title = "Medal Distribution" }: SimpleMedalChartProps) {
    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No medal data available</p>
            </div>
        );
    }

    const maxMedals = Math.max(...data.map(d => d.medals.gold + d.medals.silver + d.medals.bronze));

    return (
        <div className="w-full h-64 p-4 bg-white rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
            <div className="space-y-3">
                {data.slice(0, 5).map((team, index) => {
                    const totalMedals = team.medals.gold + team.medals.silver + team.medals.bronze;
                    const percentage = maxMedals > 0 ? (totalMedals / maxMedals) * 100 : 0;

                    return (
                        <div key={team.team.code} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700 truncate">
                                    {team.team.name}
                                </span>
                                <div className="flex gap-2 text-xs">
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                        🥇 {team.medals.gold}
                                    </span>
                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                        🥈 {team.medals.silver}
                                    </span>
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                        🥉 {team.medals.bronze}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${percentage}%`,
                                        background: `linear-gradient(to right, #fbbf24 ${(team.medals.gold / totalMedals) * 100}%, #9ca3af ${(team.medals.gold / totalMedals) * 100}% ${((team.medals.gold + team.medals.silver) / totalMedals) * 100}%, #f97316 ${((team.medals.gold + team.medals.silver) / totalMedals) * 100}%)`
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}