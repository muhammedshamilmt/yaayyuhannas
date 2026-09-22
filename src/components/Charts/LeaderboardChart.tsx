'use client';

import { useEffect, useRef, useState } from 'react';

interface TeamStats {
    team: { name: string; code: string; color: string };
    totalPoints: number;
    totalWins: number;
    medals: { gold: number; silver: number; bronze: number };
    rank: number;
}

interface LeaderboardChartProps {
    data: TeamStats[];
}

export function LeaderboardChart({ data }: LeaderboardChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        if (!canvasRef.current || !data.length) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const width = rect.width;
        const height = rect.height;
        const padding = 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get max points for scaling
        const maxPoints = Math.max(...data.map(d => d.totalPoints));
        if (maxPoints === 0) return;

        // Draw background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw bars
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        data.forEach((team, index) => {
            const barHeight = (team.totalPoints / maxPoints) * chartHeight;
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = padding + chartHeight - barHeight;

            // Create gradient
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, team.team.color || '#8b5cf6');
            gradient.addColorStop(1, team.team.color ? team.team.color + '80' : '#8b5cf680');

            // Draw bar
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw bar border
            ctx.strokeStyle = team.team.color || '#8b5cf6';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Draw team name
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                team.team.code.length > 8 ? team.team.code.substring(0, 8) + '...' : team.team.code,
                x + barWidth / 2,
                height - padding + 20
            );

            // Draw points value
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillText(
                team.totalPoints.toString(),
                x + barWidth / 2,
                y - 10
            );

            // Draw rank badge
            const rankBadge = team.rank === 1 ? '🥇' : team.rank === 2 ? '🥈' : team.rank === 3 ? '🥉' : `#${team.rank}`;
            ctx.font = '16px Inter, sans-serif';
            ctx.fillText(rankBadge, x + barWidth / 2, y - 30);
        });

        // Draw title
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Team Points Comparison', width / 2, 30);

        // Draw y-axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxPoints / 5) * (5 - i));
            const y = padding + (chartHeight / 5) * i + 5;
            ctx.fillText(value.toString(), padding - 10, y);
        }

    }, [data, isClient]);

    if (!isClient) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg animate-pulse">
                <div className="text-gray-400">Loading chart...</div>
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No data available for chart</p>
            </div>
        );
    }

    return (
        <div className="w-full h-64">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}