import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Camera, Music, Heart, QuoteIcon, Star, TrendingUp, ChevronRight, Search, Film, ChevronLeft } from 'lucide-react';
import { getLatestReviews, proxyImage } from '../services/api';
import ReviewGrid from '../components/ReviewGrid';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';
import { getVerdictFromScore } from '../utils/verdict';
import { useColorHarmonizer } from '../hooks/useColorHarmonizer';
import DiscoveryCarousel from '../components/DiscoveryCarousel';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { initializeSmartSearch, performSmartSearch } from '../services/SmartSearch';
const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';
const VERDICT_COLOR = {
    Legendary: '#FFFFFF', Masterpiece: '#FFD700', Essential: '#FF00EA',
    Elite: '#9D00FF', Great: '#00FF44', Good: '#8FFF00',
    Decent: '#00D0FF', Average: '#849BB3', Mediocre: '#FFFB00',
    Poor: '#FF9100', Bad: '#FF4D00', Terrible: '#FF0000',
    Disaster: '#990000', Abomination: '#2D0000'
};

export default function Home() {
    const [featuredReviews, setFeaturedReviews] = useState([]);
    const [mustWatchReviews, setMustWatchReviews] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [error, setError] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const heroRef = useRef(null);


    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isSmall = windowWidth < 768;
    const isUltraSmall = windowWidth < 400;

    const handleMouseMove = useCallback((e) => {
        if (isSmall) return; // Disable parallax on mobile
        const x = (e.clientX - window.innerWidth / 2) / 50;
        const y = (e.clientY - window.innerHeight / 2) / 50;
        setMousePos({ x, y });
    }, [isSmall]);

    // Filters
    const [verdictFilter, setVerdictFilter] = useState('All');
    const [contentTypeFilter, setContentTypeFilter] = useState('All');
    const [sortOption, setSortOption] = useState('date-desc');

    const handleFilterChange = (setter, value) => {
        setter(value);
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        }
    };

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startY = useRef(0);
    const isPulling = useRef(false);



    // Infinite Scroll State
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef();

    const fetchReviews = useCallback(async (offset = 0, isReset = false) => {
        try {
            const limit = 15;
            const [sortBy, order] = sortOption.split('-');
            const { data } = await getLatestReviews(limit, offset, search, verdictFilter, contentTypeFilter, sortBy, order);

            if (data && data.length > 0) {
                setReviews(prev => isReset || offset === 0 ? data : [...prev, ...data]);
                setHasMore(data.length === limit);
            } else {
                if (isReset || offset === 0) setReviews([]);
                setHasMore(false);
            }
        } catch (err) {
            console.error("Home fetch error", err);
            setError(err.message || "Failed to fetch content");
            setHasMore(false); // Prevent infinite IntersectionObserver retry loops
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [search, verdictFilter, contentTypeFilter, sortOption]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleStart = (e) => {
            startY.current = e.touches[0].pageY;
            isPulling.current = false;
        };

        const handleMove = (e) => {
            const currentY = e.touches[0].pageY;
            const diffY = currentY - startY.current;

            if (diffY > 0 && window.scrollY <= 5 && !isPulling.current) {
                isPulling.current = true;
            }

            if (isPulling.current) {
                const distance = Math.min(diffY * 0.4, 80);
                setPullDistance(distance);
                if (distance > 10 && e.cancelable) e.preventDefault();
            }
        };

        const handleEnd = () => {
            if (isPulling.current) {
                isPulling.current = false;
                if (pullDistance > 60) {
                    setIsRefreshing(true);
                    setPullDistance(70);
                    fetchReviews(0, true).finally(() => {
                        setTimeout(() => {
                            setIsRefreshing(false);
                            setPullDistance(0);
                        }, 600);
                    });
                } else {
                    setPullDistance(0);
                }
            }
        };

        el.addEventListener('touchstart', handleStart, { passive: true });
        el.addEventListener('touchmove', handleMove, { passive: false });
        el.addEventListener('touchend', handleEnd, { passive: true });

        return () => {
            el.removeEventListener('touchstart', handleStart);
            el.removeEventListener('touchmove', handleMove);
            el.removeEventListener('touchend', handleEnd);
        };
    }, [pullDistance, fetchReviews]);

    // Hero Swipe Logic
    useEffect(() => {
        const el = heroRef.current;
        if (!el) return;

        let hStartX = 0;
        let hStartY = 0;
        let hIsHorizontal = false;
        let hHasDetermined = false;

        const handleStart = (e) => {
            hStartX = e.touches[0].pageX;
            hStartY = e.touches[0].pageY;
            hIsHorizontal = false;
            hHasDetermined = false;
        };

        const handleMove = (e) => {
            if (hHasDetermined && !hIsHorizontal) return;

            const currentX = e.touches[0].pageX;
            const currentY = e.touches[0].pageY;
            const diffX = currentX - hStartX;
            const diffY = currentY - hStartY;

            if (!hHasDetermined) {
                if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
                    hHasDetermined = true;
                    if (Math.abs(diffX) > Math.abs(diffY)) {
                        hIsHorizontal = true;
                    }
                }
            }

            if (hIsHorizontal && e.cancelable) {
                e.preventDefault();
            }
        };

        const handleEnd = (e) => {
            if (hIsHorizontal) {
                const endX = e.changedTouches[0].pageX;
                const diffX = endX - hStartX;
                if (Math.abs(diffX) > 50) {
                    setIsAutoPlaying(false);
                    if (diffX > 0) {
                        setCurrentIndex(prev => (prev - 1 + featuredReviews.length) % featuredReviews.length);
                    } else {
                        setCurrentIndex(prev => (prev + 1) % featuredReviews.length);
                    }
                }
            }
        };

        el.addEventListener('touchstart', handleStart, { passive: true });
        el.addEventListener('touchmove', handleMove, { passive: false });
        el.addEventListener('touchend', handleEnd, { passive: true });

        return () => {
            el.removeEventListener('touchstart', handleStart);
            el.removeEventListener('touchmove', handleMove);
            el.removeEventListener('touchend', handleEnd);
        };
    }, [featuredReviews.length]);


    // Fetch Featured Reviews once on mount
    useEffect(() => {
        getLatestReviews(5, 0, '', 'All', 'All', 'date', 'desc')
            .then(({ data }) => {
                if (data && data.length > 0) setFeaturedReviews(data);
            })
            .catch(console.error);

        // Fetch Must Watch Reviews
        getLatestReviews(10, 0, '', 'All', 'All', 'date', 'desc', null, null, true)
            .then(({ data }) => {
                if (data) setMustWatchReviews(data);
            })
            .catch(console.error);
    }, []);

    // Auto-play Logic
    useEffect(() => {
        if (!isAutoPlaying || featuredReviews.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % featuredReviews.length);
        }, 8000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, featuredReviews.length]);

    useEffect(() => {
        setLoading(true);
        setHasMore(true);
        const timeout = setTimeout(() => {
            fetchReviews(0, true);
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchReviews]);

    const lastElementRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                // We mock pagination for now, fetch again or manage page tokens
                setLoadingMore(true);
                setTimeout(() => {
                    fetchReviews(reviews.length);
                }, 500);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, fetchReviews, reviews.length]);

    const hero = featuredReviews[currentIndex];
    
    // Soul-Sync Hero Atmosphere
    const { resetAtmosphere } = useColorHarmonizer(hero?.movie_poster_url ? proxyImage(hero.movie_poster_url) : null);

    // Reset atmosphere when leaving the home page
    useEffect(() => {
        return () => {
            resetAtmosphere();
        };
    }, [resetAtmosphere]);

    const derivedVerdict = getVerdictFromScore(hero?.overall_rating || 0);
    const heroColor = VERDICT_COLOR[derivedVerdict] || '#FFFFFF';

    // The backend natively filters, but we augment it with Fuse.js for heavy local typo tolerance 
    // and instant offline querying of the baseline payload
    const smartSearchIndex = React.useMemo(() => initializeSmartSearch(reviews), [reviews]);
    const filtered = search ? performSmartSearch(smartSearchIndex, search) : reviews;

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{ background: '#080808', minHeight: '100vh', position: 'relative', touchAction: pullDistance > 0 ? 'none' : 'auto' }}
        >
            <Helmet>
                <title>Critic's Temple: Cinema Archive</title>
                <meta property="og:title" content="Critic's Temple: Cinema Archive" />
                <meta property="og:description" content="An elite, highly aesthetics-focused movie review platform." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>

            {/* Refresh Indicator */}
            <motion.div
                style={{
                    position: 'fixed',
                    top: pullDistance - 40,
                    left: '50%',
                    x: '-50%',
                    zIndex: 2000,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f5a623',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    opacity: pullDistance > 10 ? 1 : 0,
                }}
            >
                <motion.div
                    animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 5 }}
                    transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0 }}
                >
                    <TrendingUp size={16} color="#000" />
                </motion.div>
            </motion.div>

            <BackgroundAtmosphere activeColor={heroColor} />

            {/* ── HERO ── */}
            <section
                ref={heroRef}

                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                style={{
                    position: 'relative',
                    minHeight: isSmall ? 'auto' : '90vh',
                    paddingTop: isSmall
                        ? 'calc(130px + var(--safe-top))'
                        : 'calc(clamp(160px, 15vh, 220px) + var(--safe-top))',
                    paddingBottom: isSmall ? '60px' : '100px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {/* Background Ken Burns */}
                <AnimatePresence mode="wait">
                    {hero?.movie_poster_url && (
                        <motion.div
                            key={`bg-${hero._id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                        >
                            <motion.img
                                src={hero.movie_poster_url}
                                alt=""
                                animate={{
                                    scale: [1, 1.1],
                                    x: [0, -10],
                                    y: [0, -5]
                                }}
                                transition={{
                                    duration: 20,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    ease: "linear"
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: 'brightness(0.15) saturate(0.6) blur(20px)'
                                }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #080808 0%, rgba(8,8,8,0.4) 50%, #080808 100%)' }} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`content-${hero?._id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.6 }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: isSmall ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
                                alignItems: 'center',
                                gap: isSmall ? '2.5rem' : 'clamp(2rem, 8vw, 6rem)',
                                textAlign: isSmall ? 'center' : 'left'
                            }}
                        >
                            {/* Left: Text */}
                            <motion.div
                                style={{
                                    transform: isSmall ? 'none' : `translate(${mousePos.x}px, ${mousePos.y}px)`,
                                    transition: 'transform 0.1s ease-out',
                                    order: 1
                                }}
                            >
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        padding: '4px 12px',
                                        borderRadius: '99px',
                                        background: `${heroColor}14`,
                                        border: `1px solid ${heroColor}25`,
                                        marginBottom: '12px',
                                        marginLeft: isSmall ? 'auto' : '0',
                                        marginRight: isSmall ? 'auto' : '0'
                                    }}
                                >
                                    <TrendingUp size={11} color={heroColor} />
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: heroColor, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                                        Latest Imprint
                                    </span>
                                </motion.div>

                                <h1 className="display" style={{
                                    fontSize: isSmall ? 'clamp(1.6rem, 10vw, 3rem)' : 'clamp(2.5rem, 8vw, 6.5rem)',
                                    fontWeight: 900,
                                    color: '#FFFFFF',
                                    lineHeight: 0.95,
                                    letterSpacing: '-0.04em',
                                    marginBottom: '8px',
                                    textShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word'
                                }}>
                                    {hero?.movie_title || "Critic's Temple"}
                                </h1>

                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{
                                        fontSize: 'clamp(12px, 2vw, 14px)',
                                        fontWeight: 800,
                                        color: 'rgba(255,215,0,0.6)',
                                        letterSpacing: '0.3em',
                                        textTransform: 'uppercase',
                                        marginBottom: '24px',
                                        lineHeight: 1.4
                                    }}
                                >
                                    A Profound Archive of <br className="desktop-hidden" /> Cinematic Critique & Analytics
                                </motion.p>

                                {hero?.summary && (
                                    <p style={{
                                        fontSize: 'clamp(14px, 1.5vw, 16px)',
                                        fontWeight: 300,
                                        color: 'rgba(255,255,255,0.45)',
                                        lineHeight: 1.8,
                                        maxWidth: '500px',
                                        marginBottom: '32px',
                                        marginLeft: isSmall ? 'auto' : '0',
                                        marginRight: isSmall ? 'auto' : '0'
                                    }}>
                                        {hero.summary}
                                    </p>
                                )}

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: isSmall ? 'center' : 'flex-start',
                                    gap: '14px',
                                    flexWrap: 'wrap'
                                }}>
                                    {hero && (
                                        <span style={{ padding: '5px 14px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: `${heroColor}18`, color: heroColor, border: `1px solid ${heroColor}30` }}>
                                            {derivedVerdict}
                                        </span>
                                    )}
                                    {hero?.overall_rating != null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 700, color: heroColor }}>
                                            <Star size={14} fill={heroColor} color={heroColor} />
                                            {parseFloat(hero.overall_rating).toFixed(2)}
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>/10</span>
                                        </div>
                                    )}
                                    {hero?.slug && (
                                        <Link to={`/review/${hero.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '12px', background: heroColor, color: '#000', fontSize: '13px', fontWeight: 800, textDecoration: 'none', boxShadow: `0 10px 40px ${heroColor}40`, transition: 'all 0.3s ease' }}>
                                            Read Full Review <ChevronRight size={14} strokeWidth={3} />
                                        </Link>
                                    )}
                                </div>


                            </motion.div>

                            {/* Right: floating poster card */}
                            {hero?.movie_poster_url && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, rotateY: 10 }}
                                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                                    transition={{ duration: 0.8 }}
                                    style={{
                                        perspective: '1000px',
                                        transform: isSmall ? 'none' : `translate(${-mousePos.x}px, ${-mousePos.y}px)`,
                                        transition: 'transform 0.1s ease-out',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        order: isSmall ? 2 : 2
                                    }}
                                >
                                    <div style={{
                                        width: '100%',
                                        maxWidth: isSmall ? (isUltraSmall ? '260px' : '300px') : '340px',
                                        justifySelf: 'center',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        boxShadow: '0 50px 100px rgba(0,0,0,0.9)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: '#111'
                                    }}>
                                        <div style={{ aspectRatio: '2 / 3', width: '100%', overflow: 'hidden' }}>
                                            <img src={hero.movie_poster_url} alt={hero.movie_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Indicators - Positioned below everything */}
                    {featuredReviews.length > 1 && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center',
                            marginTop: isSmall ? '40px' : '60px',
                            position: 'relative'
                        }}>
                            {featuredReviews.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setCurrentIndex(idx);
                                        setIsAutoPlaying(false);
                                    }}
                                    style={{
                                        minWidth: idx === currentIndex ? '34px' : '8px',
                                        width: idx === currentIndex ? '34px' : '8px',
                                        height: '6px',
                                        flexShrink: 0,
                                        borderRadius: '3px',
                                        background: idx === currentIndex ? heroColor : 'rgba(255,255,255,0.15)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                        padding: 0
                                    }}
                                    title={`Slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}


                </div>
            </section>

            {/* ── DISCOVERY CAROUSEL ── */}
            <DiscoveryCarousel reviews={mustWatchReviews} loading={mustWatchReviews.length === 0 && loading} />

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
                            onChange={e => handleFilterChange(setVerdictFilter, e.target.value)}
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
                            value={contentTypeFilter}
                            onChange={e => handleFilterChange(setContentTypeFilter, e.target.value)}
                            style={{ padding: '9px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#fff', outline: 'none', fontFamily: 'Outfit, sans-serif', cursor: 'pointer' }}
                        >
                            <option value="All" style={{ background: '#111', color: '#fff' }}>All Content</option>
                            <option value="movie" style={{ background: '#111', color: '#fff' }}>Movies</option>
                            <option value="tv" style={{ background: '#111', color: '#fff' }}>TV Shows</option>
                        </select>

                        <select
                            value={sortOption}
                            onChange={e => handleFilterChange(setSortOption, e.target.value)}
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
                    {loadingMore && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '24px', height: '24px', border: '2px solid rgba(245,166,35,0.2)', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(245,166,35,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', animation: 'pulse 1.5s infinite' }}>Unearthing Deeper Archives...</div>
                        </div>
                    )}
                </div>
            </section>
        </div >
    );
}
