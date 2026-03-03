import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { Sword, Trophy, ChevronLeft, Search, Star, Zap, Info, Share2, Check } from 'lucide-react';
import { getLatestReviews, getReviewBySlug, proxyImage } from '../services/api';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';

const Duel = () => {
    const { slug1, slug2 } = useParams();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [contender1, setContender1] = useState(null);
    const [contender2, setContender2] = useState(null);
    const [loadingDuel, setLoadingDuel] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch all reviews for selection
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const { data } = await getLatestReviews(100);
                setReviews(data || []);
            } catch (err) {
                console.error("Failed to fetch contenders", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Load specific contenders if slugs are in URL
    useEffect(() => {
        const loadDuel = async () => {
            if (!slug1 && !slug2) return;
            setLoadingDuel(true);
            try {
                const promises = [];
                if (slug1) promises.push(getReviewBySlug(slug1));
                if (slug2) promises.push(getReviewBySlug(slug2));

                const results = await Promise.all(promises);
                if (slug1) setContender1(results[0].data);
                if (slug2) setContender2(results[slug1 ? 1 : 0].data);
            } catch (err) {
                console.error("Failed to load duel contenders", err);
            } finally {
                setLoadingDuel(false);
            }
        };
        loadDuel();
    }, [slug1, slug2]);

    const handleSelect = (index, slug) => {
        if (index === 0) {
            navigate(`/duel/${slug}${slug2 ? `/${slug2}` : ''}`);
        } else {
            navigate(`/duel/${slug1 ? slug1 : 'none'}/${slug}`);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Prepare chart data
    const aspects = contender1?.aspects || contender2?.aspects || [];
    const dnaData = Object.keys(aspects || {}).map(key => ({
        subject: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        A: contender1?.aspects?.[key] || 0,
        B: contender2?.aspects?.[key] || 0,
        fullMark: 10
    }));

    const getWinner = (key) => {
        const val1 = contender1?.aspects?.[key] || 0;
        const val2 = contender2?.aspects?.[key] || 0;
        if (val1 > val2) return 1;
        if (val2 > val1) return 2;
        return 0;
    };

    const avg1 = contender1?.overall_rating || 0;
    const avg2 = contender2?.overall_rating || 0;

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#080808] pt-24 pb-20">
            <BackgroundAtmosphere
                activeColor={contender1 ? (contender1.overall_rating > 8 ? '#f5a623' : '#60a5fa') : '#333'}
            />

            <div className="max-w-container relative z-10 px-4 md:px-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-amber-500/60 mb-2"
                        >
                            <Sword size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">The Showdown</span>
                        </motion.div>
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white">
                            CINEMATIC <span className="text-amber-500">DUEL</span>
                        </h1>
                    </div>

                    <Link to="/" className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white transition-colors group">
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Enclave
                    </Link>

                    {(contender1 && contender2) && (
                        <button
                            onClick={copyLink}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-all group"
                        >
                            {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} className="group-hover:text-amber-500 transition-colors" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Copied!' : 'Share Duel'}</span>
                        </button>
                    )}
                </div>

                {/* Contender Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 mb-20 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex z-20">
                        <div className="w-16 h-16 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
                            <span className="text-2xl font-black italic text-amber-500/80">VS</span>
                        </div>
                    </div>

                    {/* Left Contender */}
                    <div className="flex flex-col gap-6">
                        <div className="relative group">
                            <select
                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-bold appearance-none outline-none focus:border-amber-500/50 transition-all cursor-pointer"
                                value={contender1?.slug || ""}
                                onChange={(e) => handleSelect(0, e.target.value)}
                            >
                                <option value="" disabled>Select First Contender...</option>
                                {reviews.map(r => (
                                    <option key={r.slug} value={r.slug}>{r.movie_title}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 group-hover:opacity-100 transition-opacity">
                                <Search size={14} />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {contender1 ? (
                                <motion.div
                                    key={contender1.slug}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="relative aspect-[2/3] w-full max-w-[300px] mx-auto rounded-[32px] overflow-hidden shadow-2xl border border-white/10 group bg-black"
                                >
                                    <img
                                        src={contender1.movie_poster_url}
                                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                                        <div className="text-[10px] font-black text-amber-500 tracking-widest uppercase mb-1">{contender1.verdict}</div>
                                        <h3 className="text-xl font-black italic text-white uppercase leading-tight">{contender1.movie_title}</h3>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="aspect-[2/3] w-full max-w-[300px] mx-auto rounded-[32px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/10 italic">
                                    <Zap size={32} className="mb-4 opacity-5" />
                                    Choose an Imprint
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Contender */}
                    <div className="flex flex-col gap-6">
                        <div className="relative group">
                            <select
                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-bold appearance-none outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                                value={contender2?.slug || ""}
                                onChange={(e) => handleSelect(1, e.target.value)}
                            >
                                <option value="" disabled>Select Second Contender...</option>
                                {reviews.map(r => (
                                    <option key={r.slug} value={r.slug}>{r.movie_title}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 group-hover:opacity-100 transition-opacity">
                                <Search size={14} />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {contender2 ? (
                                <motion.div
                                    key={contender2.slug}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="relative aspect-[2/3] w-full max-w-[300px] mx-auto rounded-[32px] overflow-hidden shadow-2xl border border-white/10 group bg-black"
                                >
                                    <img
                                        src={contender2.movie_poster_url}
                                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                                        <div className="text-[10px] font-black text-blue-400 tracking-widest uppercase mb-1">{contender2.verdict}</div>
                                        <h3 className="text-xl font-black italic text-white uppercase leading-tight">{contender2.movie_title}</h3>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="aspect-[2/3] w-full max-w-[300px] mx-auto rounded-[32px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/10 italic">
                                    <Zap size={32} className="mb-4 opacity-5" />
                                    Choose an Imprint
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* THE CLASH: Radar Overlay */}
                {(contender1 || contender2) && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 p-8 md:p-12 mb-20 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Zap size={100} />
                        </div>

                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black italic tracking-tight">DNA CLASH</h2>
                            <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mt-2">15-Tier Structural Overlay</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
                            {/* Chart */}
                            <div className="h-[400px] md:h-[500px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dnaData}>
                                        <PolarGrid stroke="#ffffff10" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: "#ffffff40", fontSize: 10, fontWeight: 900 }}
                                        />
                                        <PolarRadiusAxis angle={30} domain={[0, 10]} axisLine={false} tick={false} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-black/90 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl shadow-2xl">
                                                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">{data.subject}</div>
                                                            <div className="flex gap-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black text-amber-500 uppercase">CONTENDER A</span>
                                                                    <span className="text-xl font-black italic text-white">{data.A.toFixed(1)}</span>
                                                                </div>
                                                                <div className="flex flex-col border-l border-white/10 pl-6">
                                                                    <span className="text-[8px] font-black text-blue-400 uppercase">CONTENDER B</span>
                                                                    <span className="text-xl font-black italic text-white">{data.B.toFixed(1)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Radar
                                            name="Contender A"
                                            dataKey="A"
                                            stroke="#f59e0b"
                                            fill="#f59e0b"
                                            fillOpacity={0.3}
                                            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1, stroke: '#fff' }}
                                        />
                                        <Radar
                                            name="Contender B"
                                            dataKey="B"
                                            stroke="#60a5fa"
                                            fill="#60a5fa"
                                            fillOpacity={0.3}
                                            dot={{ r: 4, fill: '#60a5fa', strokeWidth: 1, stroke: '#fff' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Aspect Battlefield */}
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
                                {Object.keys(aspects || {}).map((key) => {
                                    const winner = getWinner(key);
                                    const sub = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 ${winner === 0 ? 'bg-white/2 border-white/5' :
                                                winner === 1 ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]' :
                                                    'bg-blue-500/10 border-blue-500/20 shadow-[0_0_20px_rgba(96,165,250,0.05)]'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">{sub}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-lg font-black italic ${winner === 1 ? 'text-amber-500' : 'text-white/40'}`}>
                                                        {contender1?.aspects?.[key]?.toFixed(1) || '0.0'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-white/5 opacity-50 italic underline underline-offset-4 decoration-white/20">VS</span>
                                                    <span className={`text-lg font-black italic ${winner === 2 ? 'text-blue-400' : 'text-white/40'}`}>
                                                        {contender2?.aspects?.[key]?.toFixed(1) || '0.0'}
                                                    </span>
                                                </div>
                                            </div>

                                            {winner !== 0 && (
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${winner === 1 ? 'bg-amber-500 text-black' : 'bg-blue-500 text-black'
                                                    }`}>
                                                    Superior <Star size={8} fill="currentColor" />
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Final Verdict Score */}
                        {(contender1 && contender2) && (
                            <div className="mt-16 pt-16 border-t border-white/10 flex flex-col md:flex-row justify-center items-center gap-12 md:gap-32">
                                <div className="text-center group overflow-visible">
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Masterpiece Status</div>
                                    <div className="relative">
                                        <div className="text-6xl md:text-8xl font-black italic text-white flex items-center justify-center gap-2">
                                            {avg1.toFixed(1)}
                                            {avg1 > avg2 && <Trophy className="text-amber-500 animate-bounce" size={40} />}
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-amber-500/80 mt-2 uppercase">{contender1.movie_title}</div>
                                </div>

                                <div className="text-center opacity-30">
                                    <div className="h-20 w-[1px] bg-gradient-to-b from-transparent via-white/50 to-transparent hidden md:block" />
                                    <span className="text-2xl font-black italic md:static absolute mt-[-40px]">VS</span>
                                </div>

                                <div className="text-center group overflow-visible">
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Masterpiece Status</div>
                                    <div className="relative">
                                        <div className="text-6xl md:text-8xl font-black italic text-white flex items-center justify-center gap-2">
                                            {avg2.toFixed(1)}
                                            {avg2 > avg1 && <Trophy className="text-blue-500 animate-bounce" size={40} />}
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-blue-400/80 mt-2 uppercase">{contender2.movie_title}</div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Info Card */}
                {!contender1 || !contender2 ? (
                    <div className="max-w-2xl mx-auto flex gap-6 p-8 rounded-[32px] bg-white/5 border border-white/10">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                            <Info className="text-amber-500" size={24} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black italic uppercase">Initiating Showdown</h3>
                            <p className="text-sm text-white/50 leading-relaxed">
                                Choose two cinematic works from the Sanctuary archives to compare their **Structural DNA**. Our comparison engine will reveal technical superiorities across all 15 cinematic tiers.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Duel;
