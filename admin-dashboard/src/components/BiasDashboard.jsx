import React, { useEffect, useState, useMemo } from 'react';
import { getBiasMetrics, recomputeBias } from '../services/api';
import InsightCard from './InsightCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, ShieldAlert, Award, User, TrendingUp } from 'lucide-react';

const BiasDashboard = () => {
  const [bias, setBias] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getBiasMetrics();
      setBias(response.data);
    } catch (error) {
      console.error("Failed to load bias metrics", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const response = await recomputeBias();
      setBias(response.data);
    } catch (error) {
      console.error("Failed to recompute bias", error);
    } finally {
      setRecomputing(false);
    }
  };

  const processedInsights = useMemo(() => {
    if (!bias?.insights) return [];
    
    const genreInsights = bias.insights.filter(i => i.type === 'genre');
    const otherInsights = bias.insights.filter(i => i.type !== 'genre');
    
    // Group identical genre deviations
    const groupedGenres = {}; // { "1.1": [Animation, Biography, Comedy] }
    genreInsights.forEach(i => {
      const match = i.message.match(/You rate (.+) movies ([\d.]+) points (higher|lower)/);
      if (match) {
        const [_, genre, points, direction] = match;
        const key = `${points}_${direction}`;
        if (!groupedGenres[key]) groupedGenres[key] = { points, direction, genres: [] };
        groupedGenres[key].genres.push(genre);
      } else {
        // Fallback for non-matching deviations
        otherInsights.push(i);
      }
    });

    const finalGenreInsights = Object.entries(groupedGenres).map(([key, data]) => ({
      type: 'genre',
      intensity: genreInsights.find(i => i.message.includes(data.genres[0]))?.intensity || 0.5,
      message: data.genres.length > 2 
        ? `You rate ${data.genres.slice(0, 2).join(', ')} and ${data.genres.length - 2} other genres ~${data.points} points ${data.direction} than your average.`
        : `You rate ${data.genres.join(' and ')} movies ${data.points} points ${data.direction} than your average.`
    }));

    return [...finalGenreInsights, ...otherInsights];
  }, [bias?.insights]);

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-indigo-400">Loading Bias profile...</div>;
  }

  if (!bias) {
    return <div className="p-8 text-center text-gray-500 italic border border-dashed border-gray-700 rounded-2xl">No bias data collected yet. Start rating to see patterns!</div>;
  }

  return (
    <div className="space-y-8 p-6 bg-black/40 rounded-3xl border border-white/5 backdrop-blur-xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-tighter">
            Bias Analytics
          </h2>
          <p className="text-xs text-gray-500 font-medium">Quantifying your cinematic patterns</p>
        </div>
        <button 
          onClick={handleRecompute}
          disabled={recomputing}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${recomputing ? 'bg-gray-800 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
        >
          <RefreshCw size={14} className={recomputing ? 'animate-spin' : ''} />
          {recomputing ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Stat Card */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <User size={80} />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Total Average</p>
          <p className="text-5xl font-black text-white">{bias.overall_average?.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-indigo-400 text-[10px] font-bold">
             <Award size={12} />
             <span>Verified Rating Profile</span>
          </div>
        </div>

        {/* Hype Bias Card */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Hype Bias Score</p>
          <p className="text-5xl font-black text-white">{bias.hype_bias_score?.toFixed(1)}</p>
          <div className={`mt-4 flex items-center gap-2 text-[10px] font-bold ${bias.hype_bias_score > 1.0 ? 'text-red-400' : 'text-green-400'}`}>
             <ShieldAlert size={12} />
             <span>{bias.hype_bias_score > 1.0 ? 'High Sentiment Shift' : 'Stable Perception'}</span>
          </div>
        </div>

        {/* Insight Quick List */}
        <div className="md:col-span-1 space-y-3">
          {processedInsights.slice(0, 2).map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-5 md:p-8 rounded-3xl">
        <h3 className="text-xs font-black text-gray-500 uppercase mb-8 flex items-center gap-2">
          <div className="w-1 h-4 bg-indigo-500 rounded-full" />
          Genre Preference Deviation
        </h3>
        <div className="h-64 mt-4 relative" style={{ minWidth: '1px', minHeight: '1px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
            <BarChart data={bias.genre_bias}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis 
                dataKey="category" 
                stroke="#4b5563" 
                fontSize={8} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                angle={window.innerWidth < 768 ? -45 : 0}
                textAnchor={window.innerWidth < 768 ? "end" : "middle"}
                height={window.innerWidth < 768 ? 60 : 30}
              />
              <YAxis 
                stroke="#4b5563" 
                fontSize={8} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                cursor={{fill: '#ffffff05'}}
                contentStyle={{ backgroundColor: '#000', border: '1px solid #1f2937', borderRadius: '12px', fontSize: '11px' }}
              />
              <Bar dataKey="deviation_score" radius={[4, 4, 0, 0]}>
                {bias.genre_bias?.map((entry, index) => (
                  <Cell key={index} fill={entry.deviation_score > 0 ? '#6366f1' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {processedInsights.length > 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           {processedInsights.slice(2).map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BiasDashboard;
