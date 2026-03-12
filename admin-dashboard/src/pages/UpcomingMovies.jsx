import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Plus, Loader2, Search, Calendar, Film,
    CheckCircle2, AlertCircle, TrendingUp
} from 'lucide-react';
import { getUpcomingMovies, createUpcomingMovie, resolveUpcomingMovie } from '../services/api';

const UpcomingMovies = () => {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Movie Form State
    const [title, setTitle] = useState('');
    const [posterUrl, setPosterUrl] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    // Resolving State
    const [resolvingId, setResolvingId] = useState(null);
    const [verdict, setVerdict] = useState('');

    const verdicts = [
        "Legendary", "Masterpiece", "Essential", "Elite", "Great",
        "Good", "Decent", "Average", "Mediocre", "Poor",
        "Bad", "Terrible", "Disaster", "Abomination", "Unwatchable"
    ];

    const loadMovies = async () => {
        try {
            const { data } = await getUpcomingMovies();
            setMovies(data);
        } catch (error) {
            console.error("Failed to load upcoming movies", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMovies();
    }, []);

    const handleAddMovie = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            await createUpcomingMovie({ title, poster_url: posterUrl });
            setTitle('');
            setPosterUrl('');
            setIsAdding(false);
            loadMovies();
        } catch (error) {
            console.error("Failed to add upcoming movie", error);
            alert("Failed to add movie.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleResolve = async (id) => {
        if (!verdict) return alert("Select a verdict first.");
        if (!window.confirm(`Are you sure you want to resolve this movie as '${verdict}'? This will process all user predictions and award points. This Action CANNOT be undone.`)) return;

        try {
            await resolveUpcomingMovie(id, verdict);
            setResolvingId(null);
            setVerdict('');
            loadMovies();
        } catch (error) {
            console.error("Failed to resolve movie", error);
            alert("Failed to resolve movie.");
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-[#f0f0f0] font-premium selection:bg-amber-500/30 p-8 md:p-12 lg:p-20 relative">
            {/* Global Atmospheric Effects */}
            <div className="fixed inset-0 spotlight pointer-events-none" />
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />

            <div className="relative z-10 max-w-6xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all group shadow-xl"
                        >
                            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">Upcoming <span className="text-amber-500">Movies</span></h1>
                            <p className="text-xs font-black uppercase tracking-[0.4em] text-white/40 mt-2 flex items-center gap-2">
                                <TrendingUp size={12} /> Prediction Management
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${isAdding
                                ? 'bg-white/10 text-white hover:bg-white/20'
                                : 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 hover:scale-105'
                            }`}
                    >
                        {isAdding ? <><ChevronLeft size={16} /> Cancel</> : <><Plus size={16} /> New Prediction Target</>}
                    </button>
                </div>

                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md overflow-hidden"
                        >
                            <form onSubmit={handleAddMovie} className="space-y-6 max-w-2xl">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">Movie Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 transition-colors outline-none"
                                        placeholder="e.g. Dune: Part Two"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">Poster URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={posterUrl}
                                        onChange={(e) => setPosterUrl(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 transition-colors outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="px-8 py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-amber-400 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                    Create Target
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-amber-500" size={48} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {movies.map((m) => (
                            <motion.div
                                key={m._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group"
                            >
                                <div className="absolute top-4 right-4 z-10">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${m.status === 'resolved'
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                        }`}>
                                        {m.status}
                                    </span>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-20 h-28 bg-black/50 rounded-xl overflow-hidden border border-white/5 flex-shrink-0">
                                        {m.poster_url ? (
                                            <img src={m.poster_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/10">
                                                <Film size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <h3 className="font-bold text-lg leading-tight truncate">{m.title}</h3>
                                        <p className="text-xs text-white/40 mt-2 font-mono">ID: {m._id.slice(-6)}</p>

                                        {m.status === 'resolved' && (
                                            <div className="mt-4 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 inline-block">
                                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest text-center">
                                                    Verdict: {m.actual_verdict}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {m.status === 'open' && (
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        {resolvingId === m._id ? (
                                            <div className="space-y-4">
                                                <select
                                                    value={verdict}
                                                    onChange={(e) => setVerdict(e.target.value)}
                                                    className="w-full bg-black/50 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                                                >
                                                    <option value="" disabled>Select the final verdict...</option>
                                                    {verdicts.map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleResolve(m._id)}
                                                        className="flex-1 bg-amber-500 text-black py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => { setResolvingId(null); setVerdict(''); }}
                                                        className="flex-1 bg-white/5 text-white py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setResolvingId(m._id)}
                                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group-hover:border-amber-500/30"
                                            >
                                                <AlertCircle size={14} className="text-amber-500" />
                                                Resolve Verdict
                                            </button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingMovies;
