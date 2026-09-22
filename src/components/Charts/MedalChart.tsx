'use client';

import { useEffect, useRef, useState } from 'react';

interface TeamStats {
    team: { name: string; code: string; color: string };
    medals: { gold: number; silver: number; bronze: number };
    rank: number;
}

interface MedalChartProps {
    data: TeamStats[];
}

export function MedalChart({ data }: MedalChartProps) {
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

        // Draw background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Get max medals for scaling
        const maxMedals = Math.max(...data.map(d => d.medals.gold + d.medals.silver + d.medals.bronze));
        if (maxMedals === 0) return;

        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw stacked bars
        const barWidth = chartWidth / data.length * 0.7;
        const barSpacing = chartWidth / data.length * 0.3;

        data.forEach((team, index) => {
            const totalMedals = team.medals.gold + team.medals.silver + team.medals.bronze;
            const totalBarHeight = (totalMedals / maxMedals) * chartHeight;
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const baseY = padding + chartHeight;

            let currentY = baseY;

            // Draw bronze medals (bottom)
            if (team.medals.bronze > 0) {
                const bronzeHeight = (team.medals.bronze / totalMedals) * totalBarHeight;
                const gradient = ctx.createLinearGradient(0, currentY - bronzeHeight, 0, currentY);
                gradient.addColorStop(0, '#f97316');
                gradient.addColorStop(1, '#ea580c');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, currentY - bronzeHeight, barWidth, bronzeHeight);
                
                // Add bronze text if space allows
                if (bronzeHeight > 20) {
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 12px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('🥉', x + barWidth / 2, currentY - bronzeHeight / 2 + 4);
                }
                
                currentY -= bronzeHeight;
            }

            // Draw silver medals (middle)
            if (team.medals.silver > 0) {
                const silverHeight = (team.medals.silver / totalMedals) * totalBarHeight;
                const gradient = ctx.createLinearGradient(0, currentY - silverHeight, 0, currentY);
                gradient.addColorStop(0, '#9ca3af');
                gradient.addColorStop(1, '#6b7280');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, currentY - silverHeight, barWidth, silverHeight);
                
                if (silverHeight > 20) {
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 12px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('🥈', x + barWidth / 2, currentY - silverHeight / 2 + 4);
                }
                
                currentY -= silverHeight;
            }

            // Draw gold medals (top)
            if (team.medals.gold > 0) {
                const goldHeight = (team.medals.gold / totalMedals) * totalBarHeight;
                const gradient = ctx.createLinearGradient(0, currentY - goldHeight, 0, currentY);
                gradient.addColorStop(0, '#fbbf24');
                gradient.addColorStop(1, '#f59e0b');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, currentY - goldHeight, barWidth, goldHeight);
                
                if (goldHeight > 20) {
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 12px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('🥇', x + barWidth / 2, currentY - goldHeight / 2 + 4);
                }
            }

            // Draw border around entire bar
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, baseY - totalBarHeight, barWidth, totalBarHeight);

            // Draw team name
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                team.team.code.length > 8 ? team.team.code.substring(0, 8) + '...' : team.team.code,
                x + barWidth / 2,
                height - padding + 20
            );

            // Draw total medals count
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillText(
                totalMedals.toString(),
                x + barWidth / 2,
                baseY - totalBarHeight - 10
            );
        });

        // Draw title
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Medal Distribution', width / 2, 30);

        // Draw legend
        const legendY = 50;
        const legendSpacing = 80;
        const legendStartX = width / 2 - legendSpacing;

        // Gold legend
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(legendStartX - 40, legendY - 8, 15, 15);
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🥇 Gold', legendStartX - 20, legendY + 4);

        // Silver legend
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(legendStartX + 20, legendY - 8, 15, 15);
        ctx.fillStyle = '#374151';
        ctx.fillText('🥈 Silver', legendStartX + 40, legendY + 4);

        // Bronze legend
        ctx.fillStyle = '#f97316';
        ctx.fillRect(legendStartX + 80, legendY - 8, 15, 15);
        ctx.fillStyle = '#374151';
        ctx.fillText('🥉 Bronze', legendStartX + 100, legendY + 4);

        // Draw y-axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxMedals / 5) * (5 - i));
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
                <p className="text-gray-500">No medal data available</p>
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