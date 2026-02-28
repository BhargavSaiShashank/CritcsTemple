import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Star, ChevronRight, Search, Film, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLatestReviews } from '../services/api';
import ReviewGrid from '../components/ReviewGrid';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';
const VERDICT_COLOR = {
    Legendary: '#f87171', Masterpiece: '#f5a623', Essential: '#60a5fa',
    Elite: '#c084fc', Great: '#4ade80', Good: '#86efac',
};

export default function Home() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [featuredReview, setFeaturedReview] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (window.innerWidth < 768) return; // Disable parallax on mobile
        const x = (e.clientX - window.innerWidth / 2) / 50;
        const y = (e.clientY - window.innerHeight / 2) / 50;
        setMousePos({ x, y });
    };

    // Filters
    const [verdictFilter, setVerdictFilter] = useState('All');
    const [sortOption, setSortOption] = useState('date-desc');

    // Infinite Scroll State
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef();

    const fetchReviews = async (currentPage, isReset = false, currentSearch = search, currentVerdict = verdictFilter, currentSort = sortOption) => {
        try {
            const limit = 15;
            const offset = currentPage * limit;
            const [sortBy, order] = currentSort.split('-');
            const { data } = await getLatestReviews(limit, offset, currentSearch, currentVerdict, sortBy, order);

            if (data && data.length > 0) {
                setReviews(prev => isReset || currentPage === 0 ? data : [...prev, ...data]);
                setHasMore(data.length === limit);
            } else {
                if (isReset || currentPage === 0) setReviews([]);
                setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to fetch archives", err);
            setHasMore(false); // Prevent infinite IntersectionObserver retry loops
        }
    };

    // Fetch Featured Review once on mount
    useEffect(() => {
        getLatestReviews(1, 0, '', 'All', 'date', 'desc')
            .then(({ data }) => {
                if (data && data.length > 0) setFeaturedReview(data[0]);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        setPage(0);
        setHasMore(true);
        const timeout = setTimeout(() => {
            fetchReviews(0, true, search, verdictFilter, sortOption).finally(() => setLoading(false));
        }, 400);
        return () => clearTimeout(timeout);
    }, [search, verdictFilter, sortOption]);

    const lastElementRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setLoadingMore(true);
                setPage(prev => {
                    const nextPage = prev + 1;
                    fetchReviews(nextPage, false, search, verdictFilter, sortOption).finally(() => setLoadingMore(false));
                    return nextPage;
                });
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, search, verdictFilter, sortOption]);

    const hero = featuredReview;
    const heroColor = VERDICT_COLOR[hero?.verdict] || '#f5a623';

    // The backend now natively filters via MongoDB `$regex` so we pass reviews directly
    const filtered = reviews;

    return (
        <div onMouseMove={handleMouseMove} style={{ background: '#080808', minHeight: '100vh', position: 'relative' }}>
            <Helmet>
                <title>The Sanctuary: Cinema Archive</title>
                <meta property="og:title" content="The Sanctuary: Cinema Archive" />
                <meta property="og:description" content="An elite, highly aesthetics-focused movie review platform." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>

            <BackgroundAtmosphere activeColor={heroColor} />

            {/* ── HERO ── */}
            <section style={{
                position: 'relative',
                minHeight: '90vh',
                paddingTop: 'clamp(100px, 12vh, 160px)',
                paddingBottom: '80px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
            }}>
                {/* Background Ken Burns */}
                <AnimatePresence mode="wait">
                    {hero?.movie_poster_url && (
                        <motion.div
                            key={hero._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2 }}
                            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                        >
                            <motion.img
                                src={hero.movie_poster_url}
                                alt=""
                                animate={{
                                    scale: [1, 1.15],
                                    x: [0, -20],
                                    y: [0, -10]
                                }}
                                transition={{
                                    duration: 30,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    ease: "linear"
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: 'brightness(0.12) saturate(0.6) blur(15px)'
                                }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #080808 0%, rgba(8,8,8,0.6) 50%, #080808 100%)' }} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-container" style={{ position: 'relative', zIndex: 1, width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'center', gap: 'clamp(2rem, 8vw, 6rem)' }}>
                    {/* Left: Text */}
                    <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        style={{
                            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
                            transition: 'transform 0.1s ease-out'
                        }}
                    >
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: '99px', background: `${heroColor}14`, border: `1px solid ${heroColor}25`, marginBottom: '24px' }}
                        >
                            <TrendingUp size={11} color={heroColor} />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: heroColor, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Latest Imprint</span>
                        </motion.div>

                        <h1 className="display" style={{
                            fontSize: 'clamp(2.5rem, 8vw, 6.5rem)',
                            fontWeight: 900,
                            color: '#f2f2f2',
                            lineHeight: 0.95,
                            letterSpacing: '-0.04em',
                            marginBottom: '18px',
                            textShadow: '0 20px 40px rgba(0,0,0,0.5)'
                        }}>
                            {hero?.movie_title || 'The Sanctuary'}
                        </h1>

                        {hero?.summary && hero.summary.length > 6 && (
                            <p style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', fontWeight: 300, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: '500px', marginBottom: '32px' }}>
                                {hero.summary}
                            </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                            {hero?.verdict && (
                                <span style={{ padding: '5px 14px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: `${heroColor}18`, color: heroColor, border: `1px solid ${heroColor}30` }}>
                                    {hero.verdict}
                                </span>
                            )}
                            {hero?.overall_rating != null && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 700, color: '#f5a623' }}>
                                    <Star size={14} fill="#f5a623" color="#f5a623" />
                                    {parseFloat(hero.overall_rating).toFixed(1)}
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>/10</span>
                                </div>
                            )}
                            {hero?.slug && (
                                <Link to={`/review/${hero.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '12px', background: '#f5a623', color: '#000', fontSize: '13px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 30px rgba(245,166,35,0.25)' }}>
                                    Read Full Review <ChevronRight size={14} />
                                </Link>
                            )}
                        </div>
                    </motion.div>

                    {/* Right: floating poster card */}
                    {hero?.movie_poster_url && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, rotateY: 20 }}
                            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                            transition={{ duration: 1.2, delay: 0.4 }}
                            style={{
                                perspective: '1000px',
                                transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)`,
                                transition: 'transform 0.1s ease-out'
                            }}
                        >
                            <div style={{
                                width: '100%',
                                maxWidth: '340px',
                                justifySelf: 'center',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 50px 100px rgba(0,0,0,0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: '#111'
                            }}>
                                <div style={{ aspectRatio: '2 / 3', width: '100%', overflow: 'hidden' }}>
                                    <img src={hero.movie_poster_url} alt={hero.movie_title} style={{ width: '100%', height: '100%', minHeight: '100%', minWidth: '100%', objectFit: 'cover' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ── ARCHIVE GRID ── */}
            <section className="max-w-container" style={{ paddingTop: '64px', paddingBottom: '100px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.6)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Film size={10} /> Cinema Archive
                        </div>
                        <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#f2f2f2', letterSpacing: '-0.02em', lineHeight: 1 }}>
                            All Reviews
                        </h2>
                        {!loading && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '5px' }}>{filtered.length} imprints in the archive</div>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search title, verdict, tag…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: '9px 14px 9px 34px', borderRadius: '10px', width: 'clamp(200px, 20vw, 260px)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#f2f2f2', outline: 'none', fontFamily: 'Outfit, sans-serif' }}
                                onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.25)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>

                        <select
                            value={verdictFilter}
                            onChange={e => setVerdictFilter(e.target.value)}
                            style={{ padding: '9px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#fff', outline: 'none', fontFamily: 'Outfit, sans-serif', cursor: 'pointer' }}
                        >
                            <option value="All" style={{ background: '#111', color: '#fff' }}>All Verdicts</option>
                            <option value="Legendary" style={{ background: '#111', color: '#fff' }}>Legendary</option>
                            <option value="Masterpiece" style={{ background: '#111', color: '#fff' }}>Masterpiece</option>
                            <option value="Essential" style={{ background: '#111', color: '#fff' }}>Essential</option>
                            <option value="Elite" style={{ background: '#111', color: '#fff' }}>Elite</option>
                            <option value="Great" style={{ background: '#111', color: '#fff' }}>Great</option>
                            <option value="Good" style={{ background: '#111', color: '#fff' }}>Good</option>
                            <option value="Decent" style={{ background: '#111', color: '#fff' }}>Decent</option>
                            <option value="Average" style={{ background: '#111', color: '#fff' }}>Average</option>
                            <option value="Mediocre" style={{ background: '#111', color: '#fff' }}>Mediocre</option>
                            <option value="Poor" style={{ background: '#111', color: '#fff' }}>Poor</option>
                        </select>

                        <select
                            value={sortOption}
                            onChange={e => setSortOption(e.target.value)}
                            style={{ padding: '9px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#fff', outline: 'none', fontFamily: 'Outfit, sans-serif', cursor: 'pointer' }}
                        >
                            <option value="date-desc" style={{ background: '#111', color: '#fff' }}>Newest First</option>
                            <option value="score-desc" style={{ background: '#111', color: '#fff' }}>Highest Rated</option>
                            <option value="score-asc" style={{ background: '#111', color: '#fff' }}>Lowest Rated</option>
                        </select>
                    </div>
                </div>

                <ReviewGrid reviews={filtered} loading={loading} />

                {/* Infinite Scroll Trigger */}
                <div ref={lastElementRef} style={{ height: '40px', marginTop: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {loadingMore && <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(245,166,35,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', animation: 'pulse 1.5s infinite' }}>Unearthing Deeper Archives...</div>}
                </div>
            </section>
        </div >
    );
}
