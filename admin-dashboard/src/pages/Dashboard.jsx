import React, { useState, useEffect, useCallback } from 'react'
import { auth } from '../services/firebase'
import { fetchMovieFromOMDb, searchMovies, fetchShowFromTMDB, searchShows, createReview, exportDataVault } from '../services/api'
import { useNavigate, Link } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm'
import {
    Search, Plus, LogOut, TrendingUp, Sparkles, Image as ImageIcon,
    Clock, Calendar, DownloadCloud, Loader2, Play, BookOpen, Star, Clapperboard, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    const [exporting, setExporting] = useState(false);
    const [showDrafts, setShowDrafts] = useState(false);
    const [localDrafts, setLocalDrafts] = useState([]);

    const loadDrafts = () => {
        const drafts = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('review_draft_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    drafts.push({ key, ...data });
                } catch (e) {
                    console.error("Failed parsing draft", e);
                }
            }
        }
        setLocalDrafts(drafts);
    };

    const handleExportVault = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const response = await exportDataVault();
            // Create a blob from the response data
            const blob = new Blob([response.data], { type: 'application/json' });
            // Extract filename from the Content-Disposition header if possible, else use default
            let filename = 'sanctuary_vault.json';
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            // Create a temporary link to trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Failed to export The Data Vault:", error);
            alert("Failed to export to The Data Vault. Please check console.");
        } finally {
            setExporting(false);
        }
    };

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    const debouncedSearch = useCallback(
        debounce(async (term) => {
            if (!term || term.length < 3) {
                setSearchResults([])
                setSearchLoading(false)
                return
            }
            setSearchLoading(true)
            try {
                const [moviesRes, showsRes] = await Promise.all([
                    searchMovies(term),
                    searchShows(term)
                ])
                const combined = [
                    ...(moviesRes.data || []),
                    ...(showsRes.data || [])
                ].sort((a, b) => b.Year.localeCompare(a.Year))
                setSearchResults(combined)
            } catch (err) {
                console.error("Search failed:", err)
            } finally {
                setSearchLoading(false)
            }
        }, 600),
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

    const handleSelectMovie = async (item, draftData = null) => {
        setLoading(true)
        try {
            const isTV = item.Type === 'tv'
            const { data } = isTV
                ? await fetchShowFromTMDB(item.imdbID)
                : await fetchMovieFromOMDb(item.imdbID)

            // Normalize for the form/preview
            const normalized = {
                ...data,
                id: data.tmdb_id || data.id,
                content_type: isTV ? 'tv' : 'movie',
                release_year: isTV ? data.first_air_year : data.release_year,
                director: isTV ? (data.crew?.find(c => c.job === 'Executive Producer')?.name || 'Showrunner') : (data.crew?.find(c => c.job === 'Director')?.name || 'Visionary')
            }
            setMovie(normalized)
            setSearchResults([])
            setSearchTerm('')
        } catch (err) {
            console.error("Fetch failed:", err)
            // Resilient Fallback: If we have draft data, use it to reconstruct a minimal movie object
            if (draftData) {
                console.log("[Resilience] API Failed, using draft data fallback");
                const normalized = {
                    title: draftData.movie_title || "Unknown Title",
                    id: item.imdbID,
                    imdb_id: item.imdbID,
                    poster_url: draftData.movie_poster_url,
                    content_type: item.Type || 'movie',
                    release_year: draftData.movie_year,
                    genres: [],
                    crew: [],
                    ratings: [],
                    synopsis: draftData.summary || "Draft content restored without API link."
                };
                setMovie(normalized);
                setSearchResults([]);
                setSearchTerm('');
            } else {
                alert("Neural link to external databases failed (500). If you are in a restricted region, please use local drafts if available.");
            }
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
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/20 flex-shrink-0">
                        <Clapperboard className="text-black w-4 h-4 md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-2xl font-black italic tracking-tighter truncate">THE TEMPLE</h1>
                        <p className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.4em] text-amber-500/50">Admin Sanctorum</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <Link
                        to="/hall-of-fame"
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                        title="Hall of Fame Details"
                    >
                        <Star size={18} className="text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                    </Link>

                    <Link
                        to="/upcoming-movies"
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                        title="Upcoming Movies (Predictions)"
                    >
                        <Calendar size={18} className="text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                    </Link>

                    <div className="relative">
                        <button
                            onClick={() => {
                                if (!showDrafts) loadDrafts();
                                setShowDrafts(!showDrafts);
                            }}
                            className={`p-3 border rounded-2xl transition-all group ${showDrafts ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}
                            title="Uncompleted Drafts"
                        >
                            <BookOpen size={18} className={`${showDrafts ? 'text-amber-500' : 'text-gray-400 group-hover:text-amber-500'} transition-colors`} />
                        </button>

                        <AnimatePresence>
                            {showDrafts && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-4 w-72 md:w-96 bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-4 shadow-2xl z-50 overflow-hidden"
                                >
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-4 px-2">Local Drafts Unfinished</h3>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                                        {localDrafts.length === 0 ? (
                                            <p className="text-sm text-white/30 italic px-2 py-4">No drafts found drifting in the void.</p>
                                        ) : (
                                            localDrafts.map((draft, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setShowDrafts(false);
                                                        if (draft.key.startsWith('review_draft_edit_')) {
                                                            const editId = draft.key.replace('review_draft_edit_', '');
                                                            navigate(`/edit/${editId}`);
                                                        } else if (draft.key.startsWith('review_draft_movie_')) {
                                                            const movieId = draft.key.replace('review_draft_movie_', '');
                                                            // Pass as object with proper type inference
                                                            handleSelectMovie({
                                                                imdbID: movieId,
                                                                Type: movieId.startsWith('tt') ? 'movie' : 'tv'
                                                            }, draft);
                                                            setTimeout(() => {
                                                                window.scrollTo({ top: 800, behavior: 'smooth' });
                                                            }, 600);
                                                        }
                                                    }}
                                                    className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all flex flex-col gap-2 relative group flex-shrink-0 cursor-pointer"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-sm text-white/90 truncate pr-4">
                                                            {draft.movie_title || draft.key.replace('review_draft_movie_', '').replace('review_draft_edit_', '')}
                                                        </h4>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                localStorage.removeItem(draft.key);
                                                                loadDrafts();
                                                            }}
                                                            className="text-white/20 hover:text-red-500 transition-colors z-10"
                                                            title="Delete Draft"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-white/40 italic truncate">{draft.summary || 'No essence written...'}</p>

                                                    <span className="mt-2 text-[9px] font-black uppercase tracking-widest text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity w-fit">
                                                        RESUME IMPRINTING &rarr;
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Link
                        to="/intelligence"
                        className="p-2 md:p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl md:rounded-2xl transition-all group"
                        title="Cinematic Intelligence"
                    >
                        <TrendingUp size={16} className="text-gray-400 group-hover:text-amber-500 transition-colors md:w-[18px] md:h-[18px]" />
                    </Link>

                    <button
                        onClick={handleExportVault}
                        disabled={exporting}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group disabled:opacity-50"
                        title="Export Data Vault (JSON)"
                    >
                        {exporting ? (
                            <Loader2 size={18} className="text-amber-500 animate-spin" />
                        ) : (
                            <DownloadCloud size={18} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
                        )}
                    </button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => auth.signOut()}
                        className="p-2 md:p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl md:rounded-2xl transition-all"
                    >
                        <LogOut size={16} className="text-gray-400 md:w-[18px] md:h-[18px]" />
                    </motion.button>
                </div>
            </header>

            <main className="relative z-10 max-w-container py-8 md:py-12 lg:py-20">
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
                                    className="text-4xl md:text-7xl font-black italic tracking-tighter leading-tight"
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
                                {searchTerm && searchTerm.length < 3 && !searchLoading && searchResults.length === 0 && (
                                    <div className="h-[40vh] flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-sm mt-8">
                                        <Search size={48} className="text-white/10 mb-4" />
                                        <p className="text-lg font-medium tracking-widest uppercase text-white/30">Enter at least 3 characters</p>
                                    </div>
                                )}

                                {searchLoading && searchTerm.length >= 3 && (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-10">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="animate-pulse bg-white/5 rounded-[32px] border border-white/10 aspect-[2/3] overflow-hidden flex flex-col justify-end p-8">
                                                <div className="h-4 bg-white/10 rounded w-1/4 mb-4"></div>
                                                <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {searchTerm && searchTerm.length >= 3 && !searchLoading ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-10">
                                        {searchResults.map((res, idx) => (
                                            <motion.div
                                                key={res.imdbID}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                whileHover={{ y: -15, scale: 1.02 }}
                                                onClick={() => handleSelectMovie(res)}
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
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em]">{res.Year}</span>
                                                        <span className="px-2 py-0.5 bg-white/10 rounded-md text-[8px] font-black uppercase tracking-widest text-white/40">{res.Type === 'tv' ? 'TV SHOW' : 'MOVIE'}</span>
                                                    </div>
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
                            <div className="flex flex-col xl:flex-row gap-8 xl:gap-20 items-start">
                                {/* The Spotlight Card */}
                                <div className="w-full xl:w-[450px] space-y-6 md:space-y-8 xl:sticky xl:top-20">
                                    <motion.div
                                        initial={{ x: -40, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="relative aspect-[2/3] w-full max-w-sm xl:max-w-full mx-auto rounded-[32px] md:rounded-[40px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-gold-pulse group"
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
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {movie.ratings?.map(r => (
                                            <div key={r.Source} className="glass-obsidian w-full max-w-[160px] p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-center space-y-1 group hover:border-amber-500/20 transition-all flex flex-col justify-center">
                                                <p className="text-[7px] sm:text-[8px] font-black uppercase text-white/30 tracking-[0.2em] sm:tracking-[0.4em] mb-1">{r.Source}</p>
                                                <p className="text-xl sm:text-2xl font-black text-amber-500 tracking-tighter">{r.Value}</p>
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
                                        <h2 className="text-4xl sm:text-5xl md:text-9xl font-black italic tracking-tighter leading-[0.85] break-words">
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
