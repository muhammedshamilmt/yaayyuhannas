'use client';

import { useEffect, useRef, useState } from 'react';

interface ChartData {
    label: string;
    value: number;
    color?: string;
}

interface DynamicChartProps {
    data: ChartData[];
    type?: 'bar' | 'line' | 'pie';
    title?: string;
    height?: number;
}

export function DynamicChart({ data, type = 'bar', title, height = 300 }: DynamicChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || !canvasRef.current || !data.length) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const width = rect.width;
        const chartHeight = rect.height;
        const padding = 60;
        const chartWidth = width - padding * 2;
        const innerHeight = chartHeight - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, chartHeight);

        // Draw background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, chartHeight);

        if (type === 'bar') {
            drawBarChart(ctx, data, padding, chartWidth, innerHeight, width, chartHeight);
        } else if (type === 'line') {
            drawLineChart(ctx, data, padding, chartWidth, innerHeight, width, chartHeight);
        } else if (type === 'pie') {
            drawPieChart(ctx, data, width, chartHeight);
        }

        // Draw title
        if (title) {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, width / 2, 30);
        }

    }, [data, type, title, isClient]);

    const drawBarChart = (ctx: CanvasRenderingContext2D, data: ChartData[], padding: number, chartWidth: number, innerHeight: number, width: number, chartHeight: number) => {
        const maxValue = Math.max(...data.map(d => d.value));
        if (maxValue === 0) return;

        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (innerHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw bars
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * innerHeight;
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = padding + innerHeight - barHeight;

            // Create gradient
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, item.color || '#8b5cf6');
            gradient.addColorStop(1, (item.color || '#8b5cf6') + '80');

            // Draw bar
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw bar border
            ctx.strokeStyle = item.color || '#8b5cf6';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Draw label
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label,
                x + barWidth / 2,
                chartHeight - padding + 20
            );

            // Draw value
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillText(
                item.value.toString(),
                x + barWidth / 2,
                y - 10
            );
        });

        // Draw y-axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxValue / 5) * (5 - i));
            const y = padding + (innerHeight / 5) * i + 5;
            ctx.fillText(value.toString(), padding - 10, y);
        }
    };

    const drawLineChart = (ctx: CanvasRenderingContext2D, data: ChartData[], padding: number, chartWidth: number, innerHeight: number, width: number, chartHeight: number) => {
        const maxValue = Math.max(...data.map(d => d.value));
        if (maxValue === 0 || data.length < 2) return;

        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (innerHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw line
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + innerHeight - (point.value / maxValue) * innerHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw points
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + innerHeight - (point.value / maxValue) * innerHeight;
            
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw area under curve
        const gradient = ctx.createLinearGradient(0, padding, 0, padding + innerHeight);
        gradient.addColorStop(0, '#8b5cf640');
        gradient.addColorStop(1, '#8b5cf610');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(padding, padding + innerHeight);
        
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + innerHeight - (point.value / maxValue) * innerHeight;
            ctx.lineTo(x, y);
        });
        
        ctx.lineTo(padding + chartWidth, padding + innerHeight);
        ctx.closePath();
        ctx.fill();
    };

    const drawPieChart = (ctx: CanvasRenderingContext2D, data: ChartData[], width: number, chartHeight: number) => {
        const centerX = width / 2;
        const centerY = chartHeight / 2;
        const radius = Math.min(width, chartHeight) / 3;
        
        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) return;

        let currentAngle = -Math.PI / 2; // Start from top

        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.fillStyle = item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            // Draw border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.value.toString(), labelX, labelY);

            currentAngle += sliceAngle;
        });

        // Draw legend
        const legendX = width - 150;
        let legendY = 50;
        
        data.forEach((item, index) => {
            // Legend color box
            ctx.fillStyle = item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`;
            ctx.fillRect(legendX, legendY, 15, 15);
            
            // Legend text
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, legendX + 20, legendY + 12);
            
            legendY += 25;
        });
    };

    if (!isClient) {
        return (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg animate-pulse" style={{ height }}>
                <div className="text-gray-400">Loading chart...</div>
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height }}>
                <p className="text-gray-500">No data available for chart</p>
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height }}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}