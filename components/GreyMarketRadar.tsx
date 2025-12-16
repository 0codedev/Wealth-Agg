import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, ReferenceArea, ReferenceLine } from 'recharts';
import { CustomTooltip } from './shared/CustomTooltip';

interface GreyMarketRadarProps {
    currentGmp: number;
    subscription: number;
}

const GreyMarketRadar: React.FC<GreyMarketRadarProps> = ({ currentGmp, subscription }) => {
    const data = [
        { x: subscription, y: currentGmp, z: 100, name: 'Current IPO' }
    ];

    // Zones
    // Safe: High Sub (>50x), High GMP (>50%)
    // Risky: Low Sub (<10x), Low GMP (<10%)
    // Multibagger: Very High Sub (>100x), Very High GMP (>80%)

    return (
        <div className="w-full h-64 bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-2 left-2 z-10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded">Risk Radar</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <XAxis type="number" dataKey="x" name="Subscription" unit="x" domain={[0, 150]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis type="number" dataKey="y" name="GMP" unit="%" domain={[0, 150]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <ZAxis type="number" dataKey="z" range={[100, 100]} />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={<CustomTooltip formatter={(val: any, name: string) => name === 'Subscription' ? val + 'x' : val + '%'} />}
                    />

                    {/* Zones */}
                    <ReferenceArea x1={0} x2={10} y1={0} y2={10} fill="#f43f5e" fillOpacity={0.1} stroke="none" />
                    <ReferenceArea x1={50} x2={150} y1={50} y2={150} fill="#10b981" fillOpacity={0.1} stroke="none" />

                    <Scatter name="IPO" data={data} fill="#6366f1">
                        <Cell key="cell-0" fill={currentGmp > 50 && subscription > 50 ? '#10b981' : currentGmp < 10 && subscription < 10 ? '#f43f5e' : '#fbbf24'} />
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>

            {/* Labels */}
            <div className="absolute bottom-2 right-2 text-[10px] text-emerald-500 font-bold">SAFE ZONE</div>
            <div className="absolute bottom-2 left-8 text-[10px] text-rose-500 font-bold">DANGER ZONE</div>
        </div>
    );
};

export default GreyMarketRadar;
