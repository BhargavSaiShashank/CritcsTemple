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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex flex-col md:flex-row gap-8 py-16 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors px-4 rounded-3xl"
        >
            {/* Rank Indicator */}
            <div className="flex flex-col items-center justify-center gap-2 md:w-24">
                <span className="text-[10px] font-black tracking-[0.4em] text-amber-500/40 uppercase">Rank</span>
                <span className="text-5xl md:text-6xl font-black italic text-white/10 group-hover:text-amber-500/20 transition-colors uppercase leading-none">
                    #{index + 1}
                </span>
            </div>

            {/* Poster Section */}
            <div className="relative w-full md:w-48 aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-transform group-hover:scale-[1.02]">
                {review.movie_poster_url && (
                    <img 
                        src={review.movie_poster_url} 
                        alt={review.movie_title}
                        className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 drop-shadow-md">
                        <Award size={10} /> {review.oscar_rank < 10 ? 'TOP CONTENDER' : 'OSCAR SHORTLIST'}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black tracking-widest text-white/40 uppercase">
                        {review.movie_year}
                    </span>
                    <div className="flex gap-1 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} fill={i < Math.round(review.rating_temple/2) ? "currentColor" : "none"} strokeWidth={1} />
                        ))}
                    </div>
                </div>

                <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase mb-6 leading-none group-hover:text-amber-500 transition-colors">
                    {review.movie_title}
                </h2>

                <p className="text-sm md:text-lg text-white/50 font-medium italic mb-8 max-w-2xl leading-relaxed">
                    {review.summary}
                </p>

                <div className="flex items-center gap-6">
                    <Link 
                        to={`/review/${review.slug}`}
                        className="flex items-center gap-3 px-6 py-3 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-amber-500 transition-colors rounded-full"
                    >
                        Read Critique <Play size={14} fill="currentColor" />
                    </Link>
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                        {review.content_type || 'Feature Film'} &bull; {review.language || 'Global Ritual'}
                    </div>
                </div>
            </div>

            {/* Decorative Sparkle */}
            <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles size={24} className="text-amber-500/20 animate-pulse" />
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

            {/* Ritual Atmosphere Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(218,165,32,0.15),transparent_70%)]" />
                <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#020202] to-transparent" />
            </div>

            <main className="relative z-10 max-w-[1200px] mx-auto px-6 pt-32 pb-40">
                {/* Ritual Header */}
                <header className="flex flex-col items-center text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="mb-12 relative"
                    >
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-200/20 to-amber-600/5 flex items-center justify-center border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.15)]">
                            <Trophy size={48} className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        </div>
                        <div className="absolute -inset-4 border border-amber-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 bg-gradient-to-b from-white via-white to-amber-500/60 bg-clip-text text-transparent"
                    >
                        THE OSCAR RITUAL
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="w-24 h-px bg-amber-500/50 mb-8"
                    />

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-white/40 max-w-[500px] leading-relaxed"
                    >
                        A Curated Archive of Cinematic Divine Selection. <br className="hidden md:block" />
                        The Contenders Moving Through the Infinite Aisle of Recognition.
                    </motion.p>
                </header>

                {/* Staggered Ranking List */}
                <div className="space-y-0">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center gap-8">
                            <div className="w-16 h-16 border-t-2 border-amber-500 rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60">Recalibrating Divine Rank</p>
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center text-red-500/50 italic uppercase tracking-widest text-xs">
                            Ritual error: {error}
                        </div>
                    ) : (
                        reviews.map((review, idx) => (
                            <RitualItem key={review.id} review={review} index={idx} />
                        ))
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
