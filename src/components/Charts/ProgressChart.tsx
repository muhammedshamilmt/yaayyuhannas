'use client';

import { useEffect, useRef, useState } from 'react';

interface ProgressData {
    programme: string;
    points: number;
    date: string;
}

interface ProgressChartProps {
    data: ProgressData[];
    teamColor?: string;
}

export function ProgressChart({ data, teamColor = '#8b5cf6' }: ProgressChartProps) {
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
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Sort data by date
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Calculate cumulative points
        let cumulativePoints = 0;
        const cumulativeData = sortedData.map(item => {
            cumulativePoints += item.points;
            return { ...item, cumulative: cumulativePoints };
        });

        const maxPoints = Math.max(...cumulativeData.map(d => d.cumulative));
        if (maxPoints === 0) return;

        // Draw background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw the progress line
        if (cumulativeData.length > 1) {
            ctx.strokeStyle = teamColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            cumulativeData.forEach((point, index) => {
                const x = padding + (index / (cumulativeData.length - 1)) * chartWidth;
                const y = padding + chartHeight - (point.cumulative / maxPoints) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Draw points on the line
            cumulativeData.forEach((point, index) => {
                const x = padding + (index / (cumulativeData.length - 1)) * chartWidth;
                const y = padding + chartHeight - (point.cumulative / maxPoints) * chartHeight;
                
                // Draw point circle
                ctx.fillStyle = teamColor;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();

                // Draw white border
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw points gained (if not the first point)
                if (index > 0) {
                    ctx.fillStyle = '#374151';
                    ctx.font = '10px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`+${point.points}`, x, y - 15);
                }
            });
        }

        // Draw area under the curve
        if (cumulativeData.length > 1) {
            const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
            gradient.addColorStop(0, teamColor + '40');
            gradient.addColorStop(1, teamColor + '10');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            
            // Start from bottom left
            ctx.moveTo(padding, padding + chartHeight);
            
            // Draw the curve
            cumulativeData.forEach((point, index) => {
                const x = padding + (index / (cumulativeData.length - 1)) * chartWidth;
                const y = padding + chartHeight - (point.cumulative / maxPoints) * chartHeight;
                ctx.lineTo(x, y);
            });
            
            // Close the path at bottom right
            ctx.lineTo(padding + chartWidth, padding + chartHeight);
            ctx.closePath();
            ctx.fill();
        }

        // Draw y-axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = Math.round((maxPoints / 4) * (4 - i));
            const y = padding + (chartHeight / 4) * i + 3;
            ctx.fillText(value.toString(), padding - 5, y);
        }

        // Draw x-axis labels (show first, middle, and last)
        ctx.textAlign = 'center';
        if (cumulativeData.length > 0) {
            // First point
            ctx.fillText('Start', padding, height - 5);
            
            // Last point
            ctx.fillText('Latest', padding + chartWidth, height - 5);
            
            // Middle point if there are enough data points
            if (cumulativeData.length > 2) {
                const middleIndex = Math.floor(cumulativeData.length / 2);
                const middleX = padding + (middleIndex / (cumulativeData.length - 1)) * chartWidth;
                ctx.fillText('Mid', middleX, height - 5);
            }
        }

    }, [data, teamColor, isClient]);

    if (!isClient) {
        return (
            <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg animate-pulse">
                <div className="text-gray-400 text-sm">Loading...</div>
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">No progress data available</p>
            </div>
        );
    }

    return (
        <div className="w-full h-24">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}