import React, { useMemo } from 'react';

interface SparklineProps {
    data?: number[];
    color?: string;
    width?: number;
    height?: number;
    trend?: 'UP' | 'DOWN' | 'NEUTRAL';
}

const Sparkline: React.FC<SparklineProps> = ({
    data,
    color,
    width = 60,
    height = 20,
    trend
}) => {
    // Generate deterministic mock data if none provided
    const points = useMemo(() => {
        if (data && data.length > 0) return data;

        // Mock generation based on trend
        const mock = [];
        let val = 50;
        for (let i = 0; i < 10; i++) {
            const change = (Math.random() - 0.5) * 10;
            if (trend === 'UP') val += Math.abs(change);
            else if (trend === 'DOWN') val -= Math.abs(change);
            else val += change;
            mock.push(val);
        }
        return mock;
    }, [data, trend]);

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const pathD = points.map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    const strokeColor = color || (
        trend === 'UP' ? '#10b981' :
            trend === 'DOWN' ? '#ef4444' :
                '#64748b'
    );

    return (
        <svg width={width} height={height} className="overflow-visible">
            <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* End Dot */}
            <circle
                cx={width}
                cy={height - ((points[points.length - 1] - min) / range) * height}
                r="2"
                fill={strokeColor}
            />
        </svg>
    );
};

export default Sparkline;
