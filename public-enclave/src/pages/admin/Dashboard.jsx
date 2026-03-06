import React, { useState, useEffect, useCallback } from 'react'
import { auth } from '../services/firebase'
import { fetchMovieFromOMDb, searchMovies, createReview } from '../services/api'
import { useNavigate, Link } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm'
import { Search, Film, Loader2, Info, Sparkles, LogOut, Clapperboard, ChevronRight, LayoutGrid, List, TrendingUp, Star, Clock, Calendar, Plus, CheckCircle2, X } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';

const Dashboard = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [movie, setMovie] = useState(null)
    const [loading, setLoading] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const [failedPosters, setFailedPosters] = useState(() => {
        const saved = localStorage.getItem('failed_sanctuary_posters');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    })
    const navigate = useNavigate();

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    const debouncedSearch = useCallback(
        debounce(async (term) => {
            if (!term || term.length < 2) {
                setSearchResults([])
                setSearchLoading(false)
                return
            }
            setSearchLoading(true)
            try {
                const { data } = await searchMovies(term)
                setSearchResults(data || [])
            } catch (err) {
                console.error("Search failed:", err)
            } finally {
                setSearchLoading(false)
            }
        }, 300),
        []
    )

    useEffect(() => {
        if (searchTerm) {
            debouncedSearch(searchTerm)
        } else {
            setSearchResults([])
        }
    }, [searchTerm, debouncedSearch])

    useEffect(() => {
        localStorage.setItem('failed_sanctuary_posters', JSON.stringify(Array.from(failedPosters)));
    }, [failedPosters]);

    const handlePosterError = (e, url) => {
        if (url && !failedPosters.has(url)) {
            setFailedPosters(prev => new Set(prev).add(url));
        }
        e.target.src = "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=30&w=1000";
    };

    const handleSelectMovie = async (imdbID) => {
        setLoading(true)
        try {
            const { data } = await fetchMovieFromOMDb(imdbID)
            setMovie(data)
            setSearchResults([])
            setSearchTerm('')
        } catch (err) {
            console.error("Fetch failed:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#020202] text-[#f0f0f0] font-premium selection:bg-amber-500/30">
            {/* Dynamic Ambient Background */}
            <BackgroundAtmosphere imageUrl={movie?.poster} />

            {/* Global Atmospheric Effects */}
            <div className="fixed inset-0 spotlight pointer-events-none" />
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />

            <header className="relative z-50 flex justify-between items-center px-4 md:px-12 py-6 md:py-8 border-b border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/20">
                        <Clapperboard className="text-black w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black italic tracking-tighter">THE TEMPLE</h1>
                        <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em] text-amber-500/50">Admin Sanctorum</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        to="/intelligence"
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                        title="Cinematic Intelligence"
                    >
                        <TrendingUp size={18} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
                    </Link>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => auth.signOut()}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
                    >
                        <LogOut size={18} className="text-gray-400" />
                    </motion.button>
                </div>
            </header>

            <main className="relative z-10 p-8 md:p-12 lg:p-20 max-w-[1800px] mx-auto">
                <AnimatePresence mode="wait">
                    {!movie ? (
                        <motion.div
                            key="search-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="space-y-24"
                        >
                            {/* Hero Search */}
                            <div className="max-w-4xl mx-auto space-y-8 text-center">
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-5xl md:text-7xl font-black italic tracking-tighter leading-tight"
                                >
                                    SUMMON YOUR <br />
                                    <span className="bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 bg-clip-text text-transparent underline decoration-amber-500/20 underline-offset-8">NEXT CRITIQUE</span>
                                </motion.h2>

                                <div className="relative group max-w-2xl mx-auto px-4 md:px-0">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-amber-800/30 rounded-[32px] blur-2xl opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                                    <div className="relative flex items-center bg-white/[0.02] border border-white/10 rounded-3xl p-2 transition-all group-focus-within:border-amber-500/50 overflow-hidden shadow-2xl">
                                        <div className="pl-4 md:pl-6 pr-2">
                                            <Search className="text-white/20 group-focus-within:text-amber-500 transition-colors" size={24} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search title..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="flex-1 bg-transparent py-4 md:py-8 text-lg md:text-2xl font-medium outline-none placeholder:text-white/10"
                                            autoFocus
                                        />
                                        {searchLoading && (
                                            <div className="px-6">
                                                <Loader2 className="animate-spin text-amber-500" size={24} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Grid */}
                            <div className="space-y-12">
                                {searchTerm ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-10">
                                        {searchResults.map((res, idx) => (
                                            <motion.div
                                                key={res.imdbID}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                whileHover={{ y: -15, scale: 1.02 }}
                                                onClick={() => handleSelectMovie(res.imdbID)}
                                                className="group relative aspect-[2/3] rounded-[32px] overflow-hidden cursor-pointer shadow-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all duration-700"
                                            >
                                                <img
                                                    src={failedPosters.has(res.Poster) || res.Poster === 'N/A' || !res.Poster.includes('http')
                                                        ? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=30&w=1000'
                                                        : res.Poster}
                                                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                                                    alt=""
                                                    onError={(e) => handlePosterError(e, res.Poster)}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-20 transition-all duration-700" />
                                                <div className="absolute bottom-0 left-0 right-0 p-8 space-y-2 translate-y-4 group-hover:translate-y-0 transition-all duration-700">
                                                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em]">{res.Year}</span>
                                                    <h3 className="text-lg font-bold leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">{res.Title}</h3>
                                                </div>
                                            </motion.div >
                                        ))}
                                    </div >
                                ) : (
                                    <div className="h-[60vh] flex flex-col items-center justify-center space-y-8 opacity-20 group">
                                        <div className="relative">
                                            <div className="absolute -inset-20 bg-amber-500/10 blur-[100px] rounded-full group-hover:bg-amber-500/20 transition-all duration-1000" />
                                            <TrendingUp size={80} className="text-white relative group-hover:scale-110 transition-transform duration-1000" />
                                        </div>
                                        <div className="text-center space-y-2 relative">
                                            <h3 className="text-xl font-black uppercase tracking-[0.4em]">Cinematic Sanctuary</h3>
                                            <p className="text-xs uppercase tracking-widest text-white/40">Search to begin your critique</p>
                                        </div>
                                    </div>
                                )}
                            </div >
                        </motion.div >
                    ) : (
                        <motion.div
                            key="movie-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-20 pb-40"
                        >
                            <div className="flex flex-col xl:flex-row gap-20 items-start">
                                {/* The Spotlight Card */}
                                <div className="w-full xl:w-[450px] space-y-8 xl:sticky xl:top-20">
                                    <motion.div
                                        initial={{ x: -40, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="relative aspect-[2/3] md:w-full rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-gold-pulse group"
                                    >
                                        <img
                                            src={failedPosters.has(movie.poster_url)
                                                ? 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=30&w=1000'
                                                : movie.poster_url}
                                            className="w-full h-full object-cover"
                                            alt=""
                                            onError={(e) => handlePosterError(e, movie.poster_url)}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                        <button
                                            onClick={() => setMovie(null)}
                                            className="absolute top-8 left-8 p-4 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl hover:bg-amber-500 hover:text-black transition-all"
                                        >
                                            <ChevronRight size={24} className="rotate-180" />
                                        </button>
                                    </motion.div>

                                    {/* Critic Metas */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {movie.ratings?.map(r => (
                                            <div key={r.Source} className="glass-obsidian p-6 rounded-3xl text-center space-y-1 group hover:border-amber-500/20 transition-all">
                                                <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.4em]">{r.Source}</p>
                                                <p className="text-2xl font-black text-amber-500 tracking-tighter">{r.Value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Deep Intelligence Section */}
                                <div className="flex-1 space-y-16">
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-4 text-amber-500/60 text-[10px] font-black uppercase tracking-[0.5em]">
                                            <Sparkles size={14} /> Intelligence Decrypted
                                        </div>
                                        <h2 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-[0.8]">
                                            {movie.title.split(' ').map((word, i) => (
                                                <span key={i} className={i % 2 === 1 ? 'text-amber-500' : 'text-white'}>{word} </span>
                                            ))}
                                        </h2>
                                        <div className="flex flex-wrap gap-4 pt-4">
                                            {movie.genres.map(g => (
                                                <span key={g} className="px-6 py-2 bg-amber-500/5 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-500">
                                                    {g}
                                                </span>
                                            ))}
                                            <span className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40">
                                                {movie.release_year} &bull; {movie.runtime}m
                                            </span>
                                        </div>
                                    </motion.div>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl md:text-4xl font-medium leading-[1.3] text-white/40 italic max-w-4xl"
                                    >
                                        "{movie.synopsis}"
                                    </motion.p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-12 border-t border-white/5">
                                        {[
                                            { label: 'Architect', val: movie.crew.find(c => c.job === 'Director')?.name },
                                            { label: 'Territory', val: movie.country },
                                            { label: 'Identity', val: movie.imdb_id },
                                            { label: 'Language', val: movie.language }
                                        ].map(item => (
                                            <div key={item.label} className="space-y-2">
                                                <p className="text-[9px] font-black uppercase text-amber-500/30 tracking-[0.4em]">{item.label}</p>
                                                <p className="text-lg font-bold text-white/80">{item.val || 'Decrypted'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* The Critique Ritual */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="pt-20"
                            >
                                <ReviewForm movie={movie} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence >
            </main >
        </div >
    )
}

export default Dashboard
