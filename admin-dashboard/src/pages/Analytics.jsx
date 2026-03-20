import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { 
    TrendingUp, Award, Activity, PieChart as PieChartIcon, 
    ArrowLeft, LayoutDashboard, Target, Sparkles, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getReviews } from '../services/api';
import { VERDICT_SCALE, getVerdictForScore } from '../constants/verdictScale';
import BiasDashboard from '../components/BiasDashboard';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#111] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] uppercase font-black tracking-widest text-amber-500 mb-1">{label}</p>
                <p className="text-xl font-black text-white">{payload[0].value} Reviews</p>
                {data.range && <p className="text-[9px] text-white/40 italic uppercase mt-1">{data.range}</p>}
            </div>
        );
    }
    return null;
};

const Analytics = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await getReviews();
                setReviews(data || []);
            } catch (error) {
                console.error('Failed to fetch analytics data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        if (!reviews.length) return null;

        // 1. Verdict Distribution
        const distribution = VERDICT_SCALE.map(tier => ({
            name: tier.verdict,
            count: reviews.filter(r => getVerdictForScore(r.overall_rating || r.rating_temple || 0).verdict === tier.verdict).length,
            color: tier.color,
            range: tier.range
        })).reverse(); // Professional low-to-high flow

        // 2. Genre DNA
        const genreMap = {};
        reviews.forEach(r => {
            const genresArr = r.tags || r.genres || [];
            genresArr.forEach(g => {
                if (!genreMap[g]) genreMap[g] = { sum: 0, count: 0 };
                genreMap[g].sum += (r.overall_rating || r.rating_temple || 0);
                genreMap[g].count += 1;
            });
        });
        const genreDNA = Object.entries(genreMap)
            .map(([name, data]) => ({
                subject: name,
                value: parseFloat((data.sum / data.count).toFixed(1)),
                fullMark: 10
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Top 8 genres

        // 3. Overall Averages
        const avgScore = (reviews.reduce((acc, r) => acc + (r.overall_rating || r.rating_temple || 0), 0) / reviews.length).toFixed(1);
        const topVerdict = [...distribution].sort((a,b) => b.count - a.count)[0].name;

        return { distribution, genreDNA, avgScore, topVerdict, total: reviews.length };
    }, [reviews]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020202] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-t-2 border-amber-500 rounded-full animate-spin" />
                    <p className="text-[10px] uppercase font-black tracking-[0.5em] text-amber-500 animate-pulse">Synchronizing Intelligence</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-10">
                    <LayoutDashboard size={40} className="text-white/10" />
                </div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-4">No Analytical Fragments Detected</h1>
                <p className="text-[10px] uppercase font-black tracking-[0.4em] text-white/20 mb-12 max-w-sm leading-relaxed">
                    The archives are currently devoid of recorded intelligence. <br/>
                    Begin imprinting reviews to generate cinematic DNA.
                </p>
                <Link to="/dashboard" className="px-10 py-4 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-amber-400 transition-all">
                    Return to Mission Control
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-white selection:bg-amber-500/30 font-premium overflow-x-hidden">
            {/* Atmosphere */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,191,0,0.05),transparent_50%)] pointer-events-none" />
            <div className="fixed inset-0 spotlight pointer-events-none" />

            <div className="relative z-10 max-w-[1400px] mx-auto pt-10 pb-20 px-6 lg:px-12">
                {/* Header Navigation */}
                <div className="flex items-center justify-between mb-16">
                    <div className="flex items-center gap-8">
                        <Link to="/dashboard" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 text-amber-500/60 text-[10px] font-black uppercase tracking-[0.5em] mb-2">
                                <Activity size={12} /> Analytical Ritual
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                                CRITERION <span className="text-amber-500">DNA</span>
                            </h1>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Total Intelligence</p>
                            <p className="text-2xl font-black text-white">{stats?.total} REVIEWS</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Average Worth</p>
                            <p className="text-2xl font-black text-amber-500">{stats?.avgScore}</p>
                        </div>
                    </div>
                </div>

                {/* Main Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Spectral Distribution (Verdict Chart) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-8 glass-obsidian rounded-[40px] p-8 md:p-12 relative overflow-hidden group border border-white/10"
                    >
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight mb-2">Spectral Distribution</h3>
                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest italic">Rating frequency across the Divine Scale</p>
                            </div>
                            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 text-amber-500">
                                <TrendingUp size={24} />
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.distribution} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#ffffff40', fontSize: 9, fontWeight: 900 }}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#ffffff20', fontSize: 10 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {stats?.distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Quick Insights Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Dominant Tier Card */}
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-obsidian rounded-[40px] p-8 border border-white/5 relative overflow-hidden"
                        >
                            <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] mb-4">Dominant Tier</p>
                            <h4 className="text-4xl font-black text-amber-500 italic tracking-tighter mb-2 uppercase">
                                {stats?.topVerdict}
                            </h4>
                            <p className="text-[11px] text-white/40 font-medium italic">Most reviews reside within this specific echelon of the scale.</p>
                            <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                                <Award size={120} />
                            </div>
                        </motion.div>

                        {/* Genre Intelligence (Radar) */}
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-obsidian rounded-[40px] p-8 border border-white/5 h-[calc(100%-144px)] flex flex-col"
                        >
                            <div className="mb-8">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-1 italic">Genre Dominance</h3>
                                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest italic">Average score by collective categories</p>
                            </div>
                            
                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats?.genreDNA}>
                                        <PolarGrid stroke="#ffffff10" />
                                        <PolarAngleAxis 
                                            dataKey="subject" 
                                            tick={{ fill: '#ffffff60', fontSize: 8, fontWeight: 900 }}
                                        />
                                        <Radar
                                            name="Avg Score"
                                            dataKey="value"
                                            stroke="#f59e0b"
                                            fill="#f59e0b"
                                            fillOpacity={0.4}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    {/* Summary Row */}
                    <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Intelligence Records', val: stats?.total, icon: LayoutDashboard },
                            { label: 'Divine Average', val: stats?.avgScore, icon: Sparkles },
                            { label: 'Ecosystem Balance', val: '94%', icon: Zap },
                            { label: 'Audit Status', val: 'DECRYPTED', icon: Target }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 + 0.3 }}
                                className="glass-obsidian rounded-3xl p-6 border border-white/5 flex items-center gap-5 hover:border-white/10 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber-500/60 border border-white/5">
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">{item.label}</p>
                                    <p className="text-xl font-black text-white">{item.val}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bias Analytics Section */}
                <div className="mt-20">
                    <BiasDashboard />
                </div>
            </div>
        </div>
    );
};

export default Analytics;
