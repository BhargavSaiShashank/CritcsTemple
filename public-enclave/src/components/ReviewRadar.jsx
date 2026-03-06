import React, { useMemo } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { getVerdictTheme } from '../utils/verdictTheme';

const ReviewRadar = ({ aspects }) => {
    // Transform aspects to recharts format
    const dnaData = Object.entries(aspects || {}).map(([subject, A]) => ({
        subject: subject.toUpperCase().replace(/_/g, ' '),
        A,
        fullMark: 10
    }));

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dnaData}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#ffffff40", fontSize: 9, fontWeight: 900 }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 10]}
                        axisLine={false}
                        tick={false}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-black/90 backdrop-blur-xl border border-amber-500/40 p-3 rounded-xl shadow-2xl flex flex-col gap-1">
                                        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">{data.subject}</div>
                                        <div className="text-xl font-black text-amber-500 italic">
                                            {data.A.toFixed(1)}
                                            <span className="text-[10px] text-white/10 not-italic ml-1 font-black">/ 10</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Radar
                        name="Sanctuary"
                        dataKey="A"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.4}
                        dot={{ r: 3, fill: '#f59e0b', fillOpacity: 0.8, stroke: '#fff', strokeWidth: 1 }}
                        activeDot={{ r: 5, fill: '#fff', stroke: '#f59e0b', strokeWidth: 2 }}
                        animationBegin={500}
                        animationDuration={2000}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ReviewRadar;
