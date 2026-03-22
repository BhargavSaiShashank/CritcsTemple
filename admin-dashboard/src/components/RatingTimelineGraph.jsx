import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';

const RatingTimelineGraph = ({ data }) => {
  if (!data || !data.phases) return <div className="text-gray-400 italic">No timeline data available</div>;

  const phaseOrder = ['initial', 'reflection', 'rewatch'];
  const chartData = phaseOrder
    .filter(phase => data.phases[phase])
    .map(phase => ({
      name: phase.charAt(0).toUpperCase() + phase.slice(1),
      score: data.phases[phase].score,
      timestamp: new Date(data.phases[phase].timestamp).toLocaleDateString(),
    }));

  return (
    <div className="w-full h-64 bg-gray-900/50 rounded-xl p-4 border border-gray-800 shadow-inner">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4 flex justify-between items-center">
        Rating Evolution
        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
          Drift: {data.drift > 0 ? '+' : ''}{data.drift.toFixed(1)}
        </span>
      </h3>
      <div className="h-[calc(100%-40px)] w-full relative" style={{ minWidth: '1px', minHeight: '1px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#718096" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              domain={[0, 10]} 
              stroke="#718096" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              ticks={[0, 2, 4, 6, 8, 10]}
            />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748', borderRadius: '8px', fontSize: '10px' }}
            itemStyle={{ color: '#6366f1' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#6366f1" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#818cf8' }}
            animationDuration={1500}
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-gray-500">
        <span>Volatility: {data.volatility.toFixed(2)}</span>
        <span>Consistency: {(data.consistency_index * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default RatingTimelineGraph;
