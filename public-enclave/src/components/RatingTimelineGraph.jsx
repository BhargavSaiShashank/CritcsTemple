import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { History, TrendingUp } from 'lucide-react';

const RatingTimelineGraph = ({ data }) => {
  if (!data || !data.phases) return null;

  const phaseOrder = ['initial', 'reflection', 'rewatch'];
  const chartData = phaseOrder
    .filter(phase => data.phases[phase])
    .map(phase => ({
      name: phase.charAt(0).toUpperCase() + phase.slice(1),
      score: data.phases[phase].score,
      timestamp: new Date(data.phases[phase].timestamp).toLocaleDateString(),
    }));

  if (chartData.length < 1) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={14} color="#f5a623" />
          <h3 style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Temporal Drift Registry</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,166,35,0.1)', padding: '4px 12px', borderRadius: '99px', border: '1px solid rgba(245,166,35,0.2)' }}>
          <TrendingUp size={10} color="#f5a623" />
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#f5a623' }}>Drift: {data.drift > 0 ? '+' : ''}{data.drift.toFixed(1)}</span>
        </div>
      </div>

      <div style={{ height: '180px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              domain={[0, 10]} 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              ticks={[0, 5, 10]}
              dx={-10}
            />
            <Tooltip 
              cursor={{ stroke: 'rgba(245,166,35,0.2)', strokeWidth: 1 }}
              contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#f5a623' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#f5a623" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#f5a623', strokeWidth: 2, stroke: '#080808' }}
              activeDot={{ r: 6, fill: '#fff', stroke: '#f5a623', strokeWidth: 2 }}
              animationDuration={2000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: 700 }}>Volatility</span>
            <span style={{ fontSize: '13px', color: '#f2f2f2', fontWeight: 900 }}>{data.volatility.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: 700 }}>Consistency</span>
            <span style={{ fontSize: '13px', color: '#f2f2f2', fontWeight: 900 }}>{(data.consistency_index * 100).toFixed(0)}%</span>
          </div>
        </div>
        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)', fontStyle: 'italic', maxWidth: '160px', textAlign: 'right', margin: 0, lineHeight: 1.4 }}>
          This cinematic verdict has evolved as the critic's perspective matured.
        </p>
      </div>
    </div>
  );
};

export default RatingTimelineGraph;
