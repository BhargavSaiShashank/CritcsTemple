import React from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

const ReviewRadar = ({ aspects, rating }) => {
    // Transform aspects to recharts format
    const dnaData = Object.entries(aspects || {}).map(([subject, A]) => ({
        subject: subject.toUpperCase().replace(/_/g, ' '),
        A,
        fullMark: 10
    }));

    return (
        <div className="h-[400px] w-full group-hover:scale-105 transition-transform duration-1000">
            <ResponsiveContainer width="100%" height="100%">
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
                    <Radar
                        name="Sanctuary"
                        dataKey="A"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.4}
                        animationBegin={500}
                        animationDuration={2000}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ReviewRadar;
