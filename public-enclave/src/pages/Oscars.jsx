import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Star, Trophy, Sparkles, ChevronRight, Play } from 'lucide-react';
import { getLatestReviews } from '../services/api';
import { Link } from 'react-router-dom';

const GoldParticles = () => {
    const particles = useMemo(() => [...Array(40)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * -20
    })), []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    animate={{
                        y: [p.y + '%', (p.y - 100) + '%'],
                        x: [p.x + '%', (p.x + (Math.random() * 10 - 5)) + '%'],
                        rotate: [0, 360],
                        opacity: [0, 0.4, 0]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                    style={{
                        position: 'absolute',
                        left: p.x + '%',
                        top: '100%',
                        width: p.size,
                        height: p.size,
                        backgroundColor: '#FFD700',
                        borderRadius: '1px',
                        boxShadow: '0 0 10px #FFD700',
                    }}
                />
            ))}
        </div>
    );
};

const RitualItem = ({ review, index }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: "-10%" }}
            className="relative group mb-32 px-6"
        >
            <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center max-w-[1200px] mx-auto">
                {/* Ranking Marker - Ghost Numbers */}
                <div className="absolute -left-12 -top-12 md:-left-32 md:-top-24 pointer-events-none select-none">
                    <span className="text-[12rem] md:text-[24rem] font-black italic tracking-tighter leading-none text-white/[0.02] transition-all group-hover:text-amber-500/[0.04]">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                </div>

                {/* Poster Frame - Floating & Glowing */}
                <div className="relative w-full md:w-[400px] aspect-[2/3] shrink-0 group/poster">
                    <div className="absolute -inset-4 bg-amber-500/10 rounded-[60px] blur-3xl opacity-0 group-hover/poster:opacity-100 transition-all duration-1000" />
                    <div className="relative h-full overflow-hidden rounded-[40px] border border-white/10 glass-obsidian shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <img 
                            src={review.movie_poster_url} 
                            alt={review.movie_title}
                            className="w-full h-full object-cover transition-transform duration-[2.5s] ease-out group-hover/poster:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        
                        {/* Divine Badge */}
                        <div className="absolute top-8 right-8 px-6 py-3 bg-black/80 backdrop-blur-xl border border-amber-500/30 rounded-2xl flex items-center gap-2 transform translate-y-2 opacity-0 group-hover/poster:translate-y-0 group-hover/poster:opacity-100 transition-all duration-500">
                             <Award size={14} className="text-amber-500" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Sacred Archive</span>
                        </div>
                    </div>
                </div>

                {/* Content - Cinematic Info */}
                <div className="flex-1 space-y-10 relative z-10 w-full text-center md:text-left">
                    <div className="space-y-6">
                        <div className="flex items-center gap-6 justify-center md:justify-start">
                            <span className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.6em]">RANK #{index + 1}</span>
                            <div className="h-px w-24 bg-gradient-to-r from-amber-500/20 to-transparent" />
                        </div>
                        <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] text-white group-hover:text-amber-500 transition-colors duration-700">
                            {review.movie_title}
                        </h2>
                        <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
                            {review.genres?.map(g => (
                                <span key={g} className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 border border-white/5 px-5 py-2 rounded-full bg-white/5 backdrop-blur-md">
                                    {g}
                                </span>
                            ))}
                        </div>
                    </div>

                    <p className="text-base md:text-xl text-white/40 font-medium leading-relaxed italic max-w-2xl mx-auto md:mx-0">
                        "{review.summary}"
                    </p>

                    <div className="flex flex-col md:flex-row items-center gap-12 pt-6">
                        <div className="flex flex-col items-center md:items-start">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-3">Divine Verdict</p>
                            <div className="flex items-center gap-4">
                                <span className="text-3xl font-black italic uppercase text-amber-500 tracking-tight">{review.verdict}</span>
                                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-glow-amber">
                                    <Sparkles size={20} className="text-amber-500" />
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block h-12 w-px bg-white/10" />
                        <div className="flex flex-col items-center md:items-start">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-3">Worth Index</p>
                            <span className="text-5xl font-black text-white italic tracking-tighter leading-none">{review.rating_temple}</span>
                        </div>
                    </div>

                    {/* Ritual Action */}
                    <div className="pt-10">
                        <Link to={`/review/${review.slug}`} className="group/link inline-flex items-center gap-6 px-10 py-5 bg-white text-black rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-amber-500 translate-y-full group-hover/link:translate-y-0 transition-transform duration-500" />
                            <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.4em]">Engage Selection</span>
                            <ChevronRight size={18} className="relative z-10 group-hover/link:translate-x-2 transition-transform duration-500" />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function Oscars() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOscars = async () => {
            try {
                // Fetch up to 50 latest reviews ascending securely mapped to the hierarchical rank
                const { data } = await getLatestReviews(50, 0, '', 'All', 'All', 'oscar_rank', 'asc', 'oscar');
                setReviews(data || []);
            } catch (err) {
                console.error("Failed to fetch oscar contenders", err);
                setError(err.message || 'Failed to load contenders');
            } finally {
                setLoading(false);
            }
        };
        fetchOscars();
    }, []);

    return (
        <div className="min-h-screen bg-[#020202] text-white selection:bg-amber-500/30 overflow-x-hidden relative">
            <Helmet>
                <title>The Oscar Ritual - Critic's Temple</title>
            </Helmet>

            <GoldParticles />

            {/* Cinematic Mood Layer */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* THE GOD RAY */}
                <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.15),transparent_70%)] blur-[120px] opacity-60" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-[60vh] bg-gradient-to-b from-amber-500/40 via-amber-500/10 to-transparent blur-[1px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 mix-blend-overlay" />
            </div>

            <main className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pt-32 pb-40">
                {/* Ritual Ambient Header */}
                <header className="flex flex-col items-center text-center mb-60 transition-all duration-1000">
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-6 text-amber-500 text-[11px] font-black uppercase tracking-[0.8em] mb-12 opacity-80">
                            <div className="w-16 h-px bg-gradient-to-r from-transparent to-amber-500/30" />
                            Sacred Selection
                            <div className="w-16 h-px bg-gradient-to-l from-transparent to-amber-500/30" />
                        </div>

                        <h1 className="text-[12vw] md:text-[14rem] font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-amber-500/10 mix-blend-difference drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            THE OSCAR <span className="block text-amber-500 italic-extreme drop-shadow-[0_10px_40px_rgba(245,158,11,0.3)]">RITUAL</span>
                        </h1>

                        <div className="mt-16 space-y-6">
                            <p className="text-[11px] md:text-sm font-bold uppercase tracking-[0.6em] text-white/40 max-w-2xl mx-auto leading-relaxed italic">
                                A curated archive of cinematic divine selection. <br/>
                                The contenders moving through the infinite aisle of recognition.
                            </p>
                            <div className="flex justify-center pt-12">
                                <motion.div 
                                    animate={{ y: [0, 15, 0], opacity: [0.2, 0.6, 0.2] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <div className="w-px h-24 bg-gradient-to-b from-amber-500/60 to-transparent" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-amber-500/40">Scroll to Witness</span>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </header>

                {/* Staggered Ranking List */}
                <div className="space-y-0">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center gap-8">
                            <div className="w-16 h-16 border-t-2 border-amber-500 rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60 transition-all">Recalibrating Divine Rank</p>
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center text-red-500/50 italic uppercase tracking-widest text-xs">
                            Ritual error: {error}
                        </div>
                    ) : reviews.length > 0 ? (
                        reviews.map((review, idx) => (
                            <RitualItem key={review.id} review={review} index={idx} />
                        ))
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="py-40 text-center space-y-8"
                        >
                            <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-auto" />
                            <p className="text-[11px] font-black uppercase tracking-[0.6em] text-white/20">The Golden Registry is Currently Vacant</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500/40">Contenders are being weighed in the infinite aisle</p>
                            <div className="pt-8">
                                <Link to="/" className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/40 hover:text-white">
                                    Return to Sanctuary
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Ritual Footer Motif */}
                <footer className="mt-40 pt-20 border-t border-white/5 text-center">
                    <Trophy size={16} className="text-white/10 mx-auto mb-6" />
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">The Sanctum Remains Absolute</p>
                </footer>
            </main>
        </div>
    );
}
