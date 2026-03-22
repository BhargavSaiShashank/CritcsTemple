import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, Cell, PieChart, Pie, LabelList
} from 'recharts';
import { 
    Activity, Globe, Zap, Clock, Star, TrendingUp, Sparkles, 
    ChevronLeft, LayoutGrid, Heart, Film, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const COLORS = ['#f5a623', '#60a5fa', '#9D00FF', '#00FF44', '#FF00EA', '#FF5733'];

const BentoCard = ({ title, icon: Icon, children, className = "" }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/[0.03] border border-white/10 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-700 ${className}`}
    >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Icon size={18} className="text-amber-500" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">{title}</h3>
            </div>
            <Sparkles size={14} className="text-white/10 group-hover:text-amber-500/50 transition-colors" />
        </div>
        <div className="relative z-10">{children}</div>
    </motion.div>
);

const TheSanctorum = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/oracle/legacy');
                setStats(data);
            } catch (err) {
                console.error("Failed to unearth legacy:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-t-2 border-amber-500 rounded-full"
            />
        </div>
    );

    if (!stats) return <div className="text-white p-20">The Oracle is silent.</div>;

    const radarData = Object.entries(stats.prime_radar).map(([key, value]) => ({
        subject: key.charAt(0).toUpperCase() + key.slice(1),
        A: value,
        fullMark: 10
    }));

    const langData = stats.language_dna.map(l => ({
        name: l.language,
        value: l.count,
        avg: l.avg_score,
        displayLabel: `${l.language} (${l.count})`
    })).sort((a,b) => b.value - a.value);

    const temporalData = Object.entries(stats.temporal_imprints).map(([month, count]) => ({
        month,
        count
    })).sort((a,b) => a.month.localeCompare(b.month));

    const corrData = Object.entries(stats.aspect_correlation).map(([key, value]) => ({
        aspect: key.charAt(0).toUpperCase() + key.slice(1),
        correlation: value
    })).sort((a,b) => b.correlation - a.correlation);

    return (
        <div className="min-h-screen bg-[#080808] text-white p-6 md:p-12 selection:bg-amber-500/30">
            {/* Header */}
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-16">
                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-amber-500 hover:text-black transition-all">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase">The Sanctorum</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500/50">Ecclesiastical Critical Analytics</p>
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Master Signature</span>
                    <span className="text-xl font-black italic text-amber-500 underline underline-offset-4 decoration-amber-500/20">{stats.master_signature}</span>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
                {/* 1. Global Presence (Language DNA) */}
                <BentoCard title="Language DNA" icon={Globe} className="md:col-span-4">
                    <div className="h-64 mt-4 relative" style={{ minWidth: '1px', minHeight: '1px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
                            <PieChart>
                                <Pie
                                    data={langData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {langData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {langData.map((l, i) => (
                            <div key={l.name} className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/20 uppercase">{l.name} <span className="opacity-40 italic">x{l.value}</span></span>
                                <span className="text-lg font-black" style={{ color: COLORS[i % COLORS.length] }}>{l.avg.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </BentoCard>

                {/* 2. The Prime Radar */}
                <BentoCard title="The Architectural Radar" icon={Zap} className="md:col-span-5">
                    <div className="h-72 relative" style={{ minWidth: '1px', minHeight: '1px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis 
                                    dataKey="subject" 
                                    tick={({ payload, x, y, textAnchor, stroke, radius }) => {
                                        const data = radarData.find(d => d.subject === payload.value);
                                        return (
                                            <text x={x} y={y} textAnchor={textAnchor} fontSize={10} fontWeight={700} fill="rgba(255,255,255,0.4)">
                                                <tspan x={x} dy="0">{payload.value}</tspan>
                                                <tspan x={x} dy="12" fill="#f5a623" fontSize={11}>{data ? data.A.toFixed(1) : ''}</tspan>
                                            </text>
                                        );
                                    }}
                                />
                                <Radar
                                    name="Averages"
                                    dataKey="A"
                                    stroke="#f5a623"
                                    fill="#f5a623"
                                    fillOpacity={0.4}
                                    dot={{ r: 4, fill: '#f5a623' }}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value) => [value.toFixed(2), "Score"]}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-[10px] font-medium text-white/30 tracking-widest uppercase mt-4">Your core critical baseline</p>
                </BentoCard>

                {/* 3. Hero Stats */}
                <motion.div 
                    className="md:col-span-3 grid grid-cols-1 gap-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="bg-amber-500 rounded-[32px] p-8 text-black flex flex-col justify-between h-full">
                        <Award size={32} />
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Imprints</span>
                            <h4 className="text-5xl font-black tracking-tighter">{stats.total_imprints}</h4>
                        </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 flex flex-col justify-between hover:border-blue-500/30 transition-all duration-700">
                        <Activity size={32} className="text-blue-400" />
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Critical Range</span>
                            <h4 className="text-4xl font-black">Celestial</h4>
                        </div>
                    </div>
                </motion.div>

                {/* 4. Aspect Correlation (Long Card) */}
                <BentoCard title="Critical Anchors (Correlation to Overall)" icon={TrendingUp} className="md:col-span-7">
                    <div className="h-64 mt-6 relative" style={{ minWidth: '1px', minHeight: '1px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
                            <BarChart data={corrData} layout="vertical" margin={{ right: 60 }}>
                                <XAxis type="number" hide domain={[0, 1]} />
                                <YAxis dataKey="aspect" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }} width={100} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    formatter={(v) => [`${(v * 100).toFixed(1)}%`, 'Weight']}
                                />
                                <Bar dataKey="correlation" radius={[0, 20, 20, 0]}>
                                    {corrData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.correlation > 0.8 ? '#f5a623' : '#60a5fa'} opacity={0.8} />
                                    ))}
                                    <LabelList dataKey="correlation" position="right" formatter={(v) => `${Math.round(v * 100)}%`} fill="white" fontSize={10} fontWeight="bold" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-white/20 italic mt-4">*Which DNA aspect most determines your final score.</p>
                </BentoCard>

                {/* 5. Temporal Imprints (Time Analysis) */}
                <BentoCard title="Temporal Activity" icon={Clock} className="md:col-span-5">
                    <div className="h-48 mt-8 relative" style={{ minWidth: '1px', minHeight: '1px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
                            <AreaChart data={temporalData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f5a623" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f5a623" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#f5a623" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* 6. Genre Dominance */}
                <BentoCard title="Genre Affinity" icon={Film} className="md:col-span-12">
                   <div className="flex flex-wrap gap-8 justify-around py-8">
                        {Object.entries(stats.genre_dna).map(([genre, score], idx) => (
                            <div key={genre} className="text-center group">
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 group-hover:text-white transition-colors">{genre}</div>
                                <div className="text-4xl font-black italic tracking-tighter" style={{ color: COLORS[idx % COLORS.length] }}>{score.toFixed(2)}</div>
                            </div>
                        ))}
                   </div>
                </BentoCard>
            </main>

            {/* Grain & Noise */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] contrast-150 grayscale mix-blend-overlay z-50">
               <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>
        </div>
    );
};

export default TheSanctorum;
