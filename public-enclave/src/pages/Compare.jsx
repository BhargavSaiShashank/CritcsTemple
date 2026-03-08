import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, X, Zap, Camera, Music, Heart, QuoteIcon, Star, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis, Tooltip } from 'recharts';
import { getLatestReviews, proxyImage, getOracleDuel } from '../services/api';
import { useColorHarmonizer } from '../hooks/useColorHarmonizer';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const VERDICT_MAP = {
    Legendary: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', glow: 'rgba(239,68,68,0.08)' },
    Masterpiece: { color: '#f5a623', bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.3)', glow: 'rgba(245,166,35,0.08)' },
    Essential: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', glow: 'rgba(59,130,246,0.06)' },
    Elite: { color: '#c084fc', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', glow: 'rgba(168,85,247,0.06)' },
    Great: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', glow: 'rgba(34,197,94,0.06)' },
    Good: { color: '#86efac', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', glow: 'transparent' },
    Decent: { color: '#fde047', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', glow: 'transparent' },
    Average: { color: '#9ca3af', bg: 'rgba(156,163,175,0.06)', border: 'rgba(156,163,175,0.15)', glow: 'transparent' },
    Mediocre: { color: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', glow: 'transparent' },
    Poor: { color: '#fca5a5', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.18)', glow: 'transparent' },
    Bad: { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)', glow: 'transparent' },
    Terrible: { color: '#ef4444', bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.28)', glow: 'transparent' },
    Disaster: { color: '#dc2626', bg: 'rgba(185,28,28,0.12)', border: 'rgba(185,28,28,0.28)', glow: 'transparent' },
    Abomination: { color: '#b91c1c', bg: 'rgba(127,29,29,0.15)', border: 'rgba(127,29,29,0.32)', glow: 'transparent' },
    Unwatchable: { color: '#991b1b', bg: 'rgba(69,10,10,0.18)', border: 'rgba(69,10,10,0.36)', glow: 'transparent' },
};
const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', glow: 'transparent' };

const ASPECT_GROUPS = [
    { name: 'Narrative', icon: QuoteIcon, color: '#818cf8', aspects: ['story', 'screenplay', 'originality', 'opening', 'climax'] },
    { name: 'Direction', icon: Zap, color: '#f59e0b', aspects: ['direction', 'acting', 'dialogues'] },
    { name: 'Visuals', icon: Camera, color: '#34d399', aspects: ['cinematography', 'editing', 'production_design', 'vfx'] },
    { name: 'Audio', icon: Music, color: '#f472b6', aspects: ['bg_score', 'music'] },
    { name: 'Soul', icon: Heart, color: '#fb7185', aspects: ['pacing', 'emotional_impact', 'rewatch_value'] },
];

const toLabel = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const getGroupAverage = (group, aspects) => {
    if (!aspects) return 0;
    const scores = group.aspects.map(k => aspects[k]).filter(a => a && parseFloat(a?.score) > 0).map(a => parseFloat(a.score));
    return scores.length ? scores.reduce((a, b) => a + b) / scores.length : 0;
};

function SearchSlot({ slotId, selected, onSelect, onClear }) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let isCurrent = true;

        if (!search.trim()) {
            // Instead of synchronous setState here, wrap it in a microtask or simply let the timeout handle basic clears, 
            // but the React 18 acceptable way to bypass the 'cascading render' warning is to ensure we process state
            // changes organically or use `useEffect` purely for external sync, but here we can just use a fast timeout:
            const clearTimer = setTimeout(() => {
                if (isCurrent) setResults([]);
            }, 0);
            return () => {
                isCurrent = false;
                clearTimeout(clearTimer);
            };
        }

        setIsSearching(true);
        const timeoutId = setTimeout(async () => {
            try {
                const { data } = await getLatestReviews(10, 0, search);
                if (isCurrent) setResults(data || []);
            } catch (err) {
                console.error("Search error", err);
            } finally {
                if (isCurrent) setIsSearching(false);
            }
        }, 300);
        return () => {
            isCurrent = false;
            clearTimeout(timeoutId);
        };
    }, [search]);

    if (selected) {
        const vc = getV(selected.verdict);
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ position: 'relative', width: '100%', height: '100%' }}
                className="perspective-1000"
            >
                <div className="glass-premium" style={{
                    background: `linear-gradient(135deg, ${vc.glow === 'transparent' ? 'rgba(255,255,255,0.02)' : vc.glow}, rgba(17,17,17,0.4))`,
                    border: `1px solid ${vc.border}`,
                    borderRadius: '24px',
                    padding: 'clamp(12px, 3vw, 24px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'clamp(12px, 3vw, 20px)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 20px 50px ${vc.glow === 'transparent' ? 'rgba(0,0,0,0.5)' : vc.glow}`
                }}>
                    <button
                        onClick={onClear}
                        style={{
                            position: 'absolute', top: '16px', right: '16px',
                            background: 'rgba(0,0,0,0.6)', border: `1px solid rgba(255,255,255,0.1)`,
                            color: 'rgba(255,255,255,0.6)', width: '32px', height: '32px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', zIndex: 10, transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(239,68,68,0.5)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.8)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                        <X size={16} />
                    </button>

                    <motion.div
                        whileHover={{ scale: 1.05, rotateY: 10 }}
                        style={{ width: 'clamp(100px, 25vw, 140px)', height: 'clamp(150px, 37.5vw, 210px)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <img src={selected.movie_poster_url || FALLBACK} alt={selected.movie_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </motion.div>

                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <h3 className="display" style={{ fontSize: 'clamp(16px, 2.5vw, 24px)', fontWeight: 800, margin: 0, color: '#fff', textShadow: `0 0 20px ${vc.color}40`, lineHeight: 1.2 }}>{selected.movie_title}</h3>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontWeight: 500, letterSpacing: '0.05em' }}>{selected.movie_year}</div>
                    </div>

                    <div style={{
                        display: 'inline-flex', padding: '6px 20px', borderRadius: '99px',
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                        background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`,
                        boxShadow: `0 0 20px ${vc.glow}`
                    }}>
                        {selected.verdict}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <Star size={20} fill={vc.color} color={vc.color} style={{ filter: `drop-shadow(0 0 8px ${vc.color})` }} />
                        <span style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 900, color: vc.color, lineHeight: 1, textShadow: `0 0 30px ${vc.color}60` }}>
                            {parseFloat(selected.overall_rating || 0).toFixed(1)}
                        </span>
                        <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>/10</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div ref={searchRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: '24px',
                    padding: 'clamp(24px, 5vw, 40px) clamp(16px, 3vw, 24px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    height: '100%',
                    minHeight: 'clamp(280px, 40vw, 380px)',
                    transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(245,166,35,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            >
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                >
                    <Search size={28} color="rgba(245,166,35,0.6)" />
                </motion.div>

                <div style={{ textAlign: 'center' }}>
                    <div className="display" style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Slot {slotId}</div>
                    <div style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'rgba(255,255,255,0.4)', fontWeight: 300, maxWidth: '200px', margin: '0 auto', lineHeight: 1.5 }}>Search the archives to mount a cinematic contender.</div>
                </div>

                <div style={{ position: 'relative', width: '100%', maxWidth: '300px', marginTop: '16px' }}>
                    <input
                        type="text"
                        placeholder="Type a title or tag..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        style={{
                            width: '100%', padding: 'clamp(12px, 3vw, 16px) clamp(12px, 3vw, 20px) clamp(12px, 3vw, 16px) clamp(32px, 8vw, 48px)',
                            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '12px', color: '#fff', fontSize: 'clamp(12px, 2.5vw, 14px)', outline: 'none',
                            fontFamily: 'Outfit, sans-serif', transition: 'all 0.3s',
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                        }}
                        onFocusCapture={e => { e.target.style.borderColor = 'rgba(245,166,35,0.5)'; e.target.style.boxShadow = '0 0 20px rgba(245,166,35,0.15), inset 0 2px 10px rgba(0,0,0,0.5)'; }}
                        onBlurCapture={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.5)'; }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: 'clamp(10px, 3vw, 20px)', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />

                    {/* Dropdown */}
                    <AnimatePresence>
                        {showDropdown && search.trim() && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className="glass-premium"
                                style={{
                                    position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0,
                                    borderRadius: '16px', overflow: 'hidden', zIndex: 100,
                                    padding: '8px'
                                }}
                            >
                                {isSearching ? (
                                    <div style={{ padding: '24px 16px', fontSize: '12px', color: 'rgba(245,166,35,0.6)', textAlign: 'center', fontWeight: 600, letterSpacing: '0.1em', animation: 'pulse 1.5s infinite' }}>
                                        SEARCHING ARCHIVE...
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="custom-scrollbar" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {results.map(r => {
                                            const rVc = getV(r.verdict);
                                            return (
                                                <div
                                                    key={r._id}
                                                    onClick={() => { onSelect(r); setSearch(''); setShowDropdown(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '14px', padding: '10px',
                                                        cursor: 'pointer', borderRadius: '10px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <img src={r.movie_poster_url || FALLBACK} style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} alt="" />
                                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{r.movie_title}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                            <span style={{ fontSize: '10px', color: rVc.color, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{r.verdict}</span>
                                                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>&bull;</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                <Star size={10} fill={rVc.color} color={rVc.color} />
                                                                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{parseFloat(r.overall_rating || 0).toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ padding: '24px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>No imprints found in the database.</div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

export default function Compare() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [item1, setItem1] = useState(null);
    const [item2, setItem2] = useState(null);
    const [oracleReport, setOracleReport] = useState(null);
    const [isOracleLoading, setIsOracleLoading] = useState(false);
    const [isStickyVisible, setIsStickyVisible] = useState(false);
    const { scrollY } = useScroll();

    // Check URL params on mount
    useEffect(() => {
        const c1ID = searchParams.get('c1');
        const c2ID = searchParams.get('c2');

        const fetchInitItems = async () => {
            if (c1ID) {
                // Find review by object ID (we will use getLatestReviews with query for _id for now)
                const res = await getLatestReviews(250, 0, "");
                const target = res.data.find(r => r._id === c1ID);
                if (target) setItem1(target);
            }
            if (c2ID) {
                const res = await getLatestReviews(250, 0, "");
                const target = res.data.find(r => r._id === c2ID);
                if (target) setItem2(target);
            }
        };

        if ((c1ID && !item1) || (c2ID && !item2)) {
            fetchInitItems();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount to capture the initial URL load

    // Update URL when items change
    useEffect(() => {
        const nextParams = new URLSearchParams(searchParams);
        let changed = false;

        if (item1 && nextParams.get('c1') !== item1._id) {
            nextParams.set('c1', item1._id);
            changed = true;
        } else if (!item1 && nextParams.has('c1')) { // Handle removal of item1
            nextParams.delete('c1');
            changed = true;
        }

        if (item2 && nextParams.get('c2') !== item2._id) {
            nextParams.set('c2', item2._id);
            changed = true;
        } else if (!item2 && nextParams.has('c2')) { // Handle removal of item2
            nextParams.delete('c2');
            changed = true;
        }

        if (changed) {
            setSearchParams(nextParams, { replace: true });
        }
    }, [item1, item2, searchParams, setSearchParams]);

    // Track scroll for sticky header
    useEffect(() => {
        return scrollY.on('change', (latest) => {
            setIsStickyVisible(latest > 500 && item1 && item2);
        });
    }, [scrollY, item1, item2]);

    const handleSwap = () => {
        const temp1 = item1;
        setItem1(item2);
        setItem2(temp1);
        setOracleReport(null);
    };

    const handleOracleConsult = async () => {
        if (!item1 || !item2 || isOracleLoading) return;
        setIsOracleLoading(true);
        try {
            const { data } = await getOracleDuel(item1, item2);
            setOracleReport(data.report);
        } catch (err) {
            console.error("Oracle Duel Error", err);
        } finally {
            setIsOracleLoading(false);
        }
    };

    // Dynamic Color Harmonization Hook based on primary selected item
    useColorHarmonizer(item1?.movie_poster_url ? proxyImage(item1.movie_poster_url) : null);

    // Prepare Radar Data if both exist
    const radarData = [];
    let allKeys = new Set();
    if (item1?.aspects) Object.keys(item1.aspects).filter(k => item1.aspects[k]?.score > 0).forEach(k => allKeys.add(k));
    if (item2?.aspects) Object.keys(item2.aspects).filter(k => item2.aspects[k]?.score > 0).forEach(k => allKeys.add(k));

    Array.from(allKeys).forEach(k => {
        radarData.push({
            subject: toLabel(k),
            A: item1?.aspects?.[k]?.score ? parseFloat(item1.aspects[k].score) : 0,
            B: item2?.aspects?.[k]?.score ? parseFloat(item2.aspects[k].score) : 0,
            fullMark: 10
        });
    });

    const activeColor = item1 ? getV(item1.verdict).color : 'rgba(245,166,35,0.5)';

    return (
        <div style={{ background: '#080808', minHeight: '100vh', paddingTop: 'calc(120px + var(--safe-top))', paddingBottom: '120px', position: 'relative' }}>
            <Helmet>
                <title>Compare Imprints | Critic's Temple</title>
            </Helmet>

            <BackgroundAtmosphere activeColor={activeColor} />

            <div className="max-w-container" style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', marginBottom: '16px' }}>
                        <Zap size={12} color="#f5a623" />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#f5a623', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                            Cinematic Diagnostics
                        </span>
                    </div>
                    <h1 className="display text-glow" style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                        Compare Imprints
                    </h1>
                </div>

                {/* Selection Slots */}
                <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(16px, 4vw, 32px)', marginBottom: '64px' }}>
                    <SearchSlot slotId={1} selected={item1} onSelect={setItem1} onClear={() => setItem1(null)} />

                    {/* Swap Button (between the slots) */}
                    <div style={{
                        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                        zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSwap}
                            style={{
                                width: 'clamp(36px, 10vw, 48px)', height: 'clamp(36px, 10vw, 48px)', borderRadius: '50%', background: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', color: '#fff'
                            }}
                        >
                            <ArrowLeftRight size={20} />
                        </motion.button>
                    </div>

                    <SearchSlot slotId={2} selected={item2} onSelect={setItem2} onClear={() => setItem2(null)} />
                </div>

                {/* Comparison UI (Only visible when both are selected) */}
                {item1 && item2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, staggerChildren: 0.2 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
                    >
                        {/* Radar Chart */}
                        <motion.div className="glass-premium" style={{ borderRadius: '32px', padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
                                <div style={{ height: '1px', width: '40px', background: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                    Structural DNA Overlap
                                </span>
                                <div style={{ height: '1px', width: '40px', background: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            {radarData.length > 0 ? (
                                <div style={{ height: 'clamp(300px, 70vw, 480px)', width: '100%', maxWidth: '800px', minHeight: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 10]} axisLine={false} tick={false} />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        const colorA = getV(item1.verdict).color;
                                                        const colorB = getV(item2.verdict).color;
                                                        return (
                                                            <div className="glass-premium" style={{ padding: '16px 20px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
                                                                <div style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.15em', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>{data.subject}</div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colorA, boxShadow: `0 0 10px ${colorA}` }} />
                                                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item1.movie_title}</span>
                                                                        </div>
                                                                        <span style={{ fontSize: '16px', fontWeight: 900, color: colorA, textShadow: `0 0 15px ${colorA}80` }}>{data.A > 0 ? data.A.toFixed(1) : '-'}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colorB, boxShadow: `0 0 10px ${colorB}` }} />
                                                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item2.movie_title}</span>
                                                                        </div>
                                                                        <span style={{ fontSize: '16px', fontWeight: 900, color: colorB, textShadow: `0 0 15px ${colorB}80` }}>{data.B > 0 ? data.B.toFixed(1) : '-'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Radar name={item1.movie_title} dataKey="A" stroke={getV(item1.verdict).color} strokeWidth={2} fill={getV(item1.verdict).color} fillOpacity={0.25} dot={{ r: 4, fill: '#111', stroke: getV(item1.verdict).color, strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff', stroke: getV(item1.verdict).color, strokeWidth: 2 }} />
                                            <Radar name={item2.movie_title} dataKey="B" stroke={getV(item2.verdict).color} strokeWidth={2} fill={getV(item2.verdict).color} fillOpacity={0.25} dot={{ r: 4, fill: '#111', stroke: getV(item2.verdict).color, strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff', stroke: getV(item2.verdict).color, strokeWidth: 2 }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div style={{ padding: '60px', color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center' }}>
                                    <Zap size={32} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                                    Insufficient data to map structural DNA.
                                </div>
                            )}

                            {/* Legend */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px', marginTop: '20px', padding: '16px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '99px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: getV(item1.verdict).color, boxShadow: `0 0 15px ${getV(item1.verdict).color}80` }} />
                                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700, letterSpacing: '0.02em' }}>{item1.movie_title}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: getV(item2.verdict).color, boxShadow: `0 0 15px ${getV(item2.verdict).color}80` }} />
                                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700, letterSpacing: '0.02em' }}>{item2.movie_title}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Oracle Duel Report */}
                        <motion.div
                            className="glass-premium"
                            style={{
                                borderRadius: '32px', padding: 'clamp(24px, 5vw, 40px)',
                                background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(10,10,10,0.4) 100%)',
                                border: '1px solid rgba(245,166,35,0.15)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Sparkles size={24} color="#f5a623" />
                                <h3 className="display" style={{ fontSize: '20px', fontWeight: 900, color: '#f5a623', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Oracle Duel Decree</h3>
                            </div>

                            {!oracleReport ? (
                                <button
                                    onClick={handleOracleConsult}
                                    disabled={isOracleLoading}
                                    style={{
                                        padding: '12px 32px', borderRadius: '99px', background: 'rgba(245,166,35,0.1)',
                                        border: '1px solid rgba(245,166,35,0.3)', color: '#f5a623', fontSize: '12px', fontWeight: 800,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                >
                                    {isOracleLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                    CONSULT THE DIVINE REFEREE
                                </button>
                            ) : (
                                <div style={{ textAlign: 'center', maxWidth: '700px' }}>
                                    <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', fontStyle: 'italic', margin: 0, whiteSpace: 'pre-wrap' }}>
                                        "{oracleReport}"
                                    </p>
                                    <button
                                        onClick={() => setOracleReport(null)}
                                        style={{ marginTop: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                    >
                                        Dismiss Revelation
                                    </button>
                                </div>
                            )}
                        </motion.div>

                        {/* Category Averages breakdown */}
                        <motion.div className="glass-premium" style={{ borderRadius: '32px', padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 32px)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '48px' }}>
                                <div style={{ height: '1px', flex: 1, maxWidth: '100px', background: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                    Category Diagnostics
                                </span>
                                <div style={{ height: '1px', flex: 1, maxWidth: '100px', background: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                                {ASPECT_GROUPS.map((g, index) => {
                                    const avg1 = getGroupAverage(g, item1.aspects);
                                    const avg2 = getGroupAverage(g, item2.aspects);
                                    if (avg1 === 0 && avg2 === 0) return null;

                                    const c1 = getV(item1.verdict).color;
                                    const c2 = getV(item2.verdict).color;
                                    const Icon = g.icon;

                                    const isWin1 = avg1 > avg2;
                                    const isWin2 = avg2 > avg1;
                                    const isTie = avg1 === avg2 && avg1 > 0;

                                    const textC1 = avg1 > 0 ? (isWin1 || isTie ? c1 : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.1)';
                                    const shadowC1 = avg1 > 0 && (isWin1 || isTie) ? `0 0 20px ${c1}80` : 'none';
                                    const barGrad1 = isWin1 || isTie ? `linear-gradient(90deg, ${c1}40 0%, ${c1} 100%)` : `linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.2) 100%)`;
                                    const barShadow1 = isWin1 || isTie ? `4px 0 15px ${c1}80` : 'none';

                                    const textC2 = avg2 > 0 ? (isWin2 || isTie ? c2 : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.1)';
                                    const shadowC2 = avg2 > 0 && (isWin2 || isTie) ? `0 0 20px ${c2}80` : 'none';
                                    const barGrad2 = isWin2 || isTie ? `linear-gradient(-90deg, ${c2}40 0%, ${c2} 100%)` : `linear-gradient(-90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.2) 100%)`;
                                    const barShadow2 = isWin2 || isTie ? `-4px 0 15px ${c2}80` : 'none';

                                    return (
                                        <motion.div
                                            key={g.name}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: index * 0.1 }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${g.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${g.color}30` }}>
                                                    <Icon size={14} color={g.color} />
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>{g.name}</span>
                                            </div>

                                            {/* Advanced Tug-of-war Bar Display */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, auto) 1fr minmax(40px, auto)', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)' }}>
                                                {/* Left side (Item 1) */}
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 900, color: textC1, textShadow: shadowC1, transition: 'all 0.4s' }}>
                                                        {avg1 > 0 ? avg1.toFixed(1) : '-'}
                                                    </span>
                                                </div>

                                                {/* Middle (Bars) */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                                                    {/* Center divider line */}
                                                    <div style={{ position: 'absolute', left: '50%', top: '-8px', bottom: '-8px', width: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />

                                                    <div style={{ height: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '99px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${(avg1 / 10) * 100}%` }}
                                                            viewport={{ once: true }}
                                                            transition={{ duration: 1.2, ease: "easeOut" }}
                                                            style={{ height: '100%', background: barGrad1, borderRadius: '99px', boxShadow: barShadow1, transition: 'background 0.4s, box-shadow 0.4s' }}
                                                        />
                                                    </div>
                                                    <div style={{ height: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '99px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
                                                        <motion.div
                                                            initial={{ width: 0, left: '100%' }}
                                                            whileInView={{ width: `${(avg2 / 10) * 100}%`, left: `${100 - (avg2 / 10) * 100}%` }}
                                                            viewport={{ once: true }}
                                                            transition={{ duration: 1.2, ease: "easeOut" }}
                                                            style={{ height: '100%', position: 'absolute', background: barGrad2, borderRadius: '99px', boxShadow: barShadow2, transition: 'background 0.4s, box-shadow 0.4s' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Right side (Item 2) */}
                                                <div style={{ textAlign: 'left' }}>
                                                    <span style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 900, color: textC2, textShadow: shadowC2, transition: 'all 0.4s' }}>
                                                        {avg2 > 0 ? avg2.toFixed(1) : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>

                        </motion.div>

                        {/* Aspect Clash Report (Micro Diagnostics) */}
                        <motion.div className="glass-premium" style={{ borderRadius: '32px', padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 32px)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '40px' }}>
                                <div style={{ height: '1px', flex: 1, maxWidth: '100px', background: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                    Aspect Clash Report
                                </span>
                                <div style={{ height: '1px', flex: 1, maxWidth: '100px', background: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {ASPECT_GROUPS.map((g, index) => {
                                    const validAspects = g.aspects.filter(k => {
                                        const s1 = parseFloat(item1.aspects?.[k]?.score || 0);
                                        const s2 = parseFloat(item2.aspects?.[k]?.score || 0);
                                        return s1 > 0 || s2 > 0;
                                    });

                                    if (validAspects.length === 0) return null;

                                    const Icon = g.icon;

                                    return (
                                        <motion.div
                                            key={`micro-${g.name}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: index * 0.1 }}
                                            style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '24px', padding: 'clamp(16px, 3vw, 24px)', position: 'relative' }}
                                        >
                                            {/* Decorative Background Icon */}
                                            <Icon size={120} color={g.color} style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', opacity: 0.02, zIndex: 0, pointerEvents: 'none' }} />

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', position: 'relative', zIndex: 1 }}>
                                                <Icon size={16} color={g.color} />
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: g.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{g.name} Metrics</span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
                                                {validAspects.map(k => {
                                                    const val1 = item1.aspects?.[k]?.score ? parseFloat(item1.aspects[k].score) : 0;
                                                    const val2 = item2.aspects?.[k]?.score ? parseFloat(item2.aspects[k].score) : 0;

                                                    const c1 = getV(item1.verdict).color;
                                                    const c2 = getV(item2.verdict).color;

                                                    const isWin1 = val1 > val2;
                                                    const isWin2 = val2 > val1;
                                                    const isTie = val1 === val2 && val1 > 0;

                                                    const textC1 = val1 > 0 ? (isWin1 || isTie ? c1 : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.1)';
                                                    const shadowC1 = val1 > 0 && (isWin1 || isTie) ? `0 0 15px ${c1}80` : 'none';
                                                    const bgRow1 = isWin1 ? `linear-gradient(90deg, ${c1}15 0%, transparent 100%)` : 'transparent';

                                                    const textC2 = val2 > 0 ? (isWin2 || isTie ? c2 : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.1)';
                                                    const shadowC2 = val2 > 0 && (isWin2 || isTie) ? `0 0 15px ${c2}80` : 'none';
                                                    const bgRow2 = isWin2 ? `linear-gradient(-90deg, ${c2}15 0%, transparent 100%)` : 'transparent';

                                                    return (
                                                        <div key={k} style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, auto) 1fr minmax(40px, auto)', alignItems: 'center', gap: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                                                            {/* Left side (Item 1) */}
                                                            <div style={{ padding: '8px', textAlign: 'right', background: bgRow1, borderLeft: isWin1 ? `3px solid ${c1}` : 'none' }}>
                                                                <span style={{ fontSize: 'clamp(14px, 2vw, 18px)', fontWeight: 800, color: textC1, textShadow: shadowC1, transition: 'all 0.3s' }}>
                                                                    {val1 > 0 ? val1.toFixed(1) : '-'}
                                                                </span>
                                                            </div>

                                                            {/* Middle (Aspect Name) */}
                                                            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                                                <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
                                                                    {toLabel(k)}
                                                                </span>
                                                            </div>

                                                            {/* Right side (Item 2) */}
                                                            <div style={{ padding: '8px', textAlign: 'left', background: bgRow2, borderRight: isWin2 ? `3px solid ${c2}` : 'none' }}>
                                                                <span style={{ fontSize: 'clamp(14px, 2vw, 18px)', fontWeight: 800, color: textC2, textShadow: shadowC2, transition: 'all 0.3s' }}>
                                                                    {val2 > 0 ? val2.toFixed(1) : '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>

            {/* Sticky Scrolling Header */}
            <AnimatePresence>
                {isStickyVisible && item1 && item2 && (
                    <motion.div
                        initial={{ opacity: 0, y: -100, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -100, x: '-50%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="glass-premium"
                        style={{
                            position: 'fixed', top: '70px', left: '50%',
                            zIndex: 9999, background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none',
                            borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px',
                            padding: 'clamp(8px, 2vw, 16px) clamp(16px, 4vw, 48px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 'clamp(16px, 4vw, 48px)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                            width: 'max-content', maxWidth: '95vw'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)' }}>
                            <span style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 900, color: getV(item1?.verdict).color, textShadow: `0 0 20px ${getV(item1?.verdict).color}80` }}>
                                {item1?.movie_title}
                            </span>
                            <img src={proxyImage(item1?.movie_poster_url)} alt="c1" style={{ width: 'clamp(28px, 6vw, 40px)', height: 'clamp(42px, 9vw, 60px)', borderRadius: '6px', objectFit: 'cover', boxShadow: `0 0 15px ${getV(item1?.verdict).color}80` }} />
                        </div>

                        <div style={{
                            width: 'clamp(28px, 6vw, 40px)', height: 'clamp(28px, 6vw, 40px)', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 900, color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 0 15px rgba(255,255,255,0.2)'
                        }}>
                            VS
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)' }}>
                            <img src={proxyImage(item2?.movie_poster_url)} alt="c2" style={{ width: 'clamp(28px, 6vw, 40px)', height: 'clamp(42px, 9vw, 60px)', borderRadius: '6px', objectFit: 'cover', boxShadow: `0 0 15px ${getV(item2?.verdict).color}80` }} />
                            <span style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 900, color: getV(item2?.verdict).color, textShadow: `0 0 20px ${getV(item2?.verdict).color}80` }}>
                                {item2?.movie_title}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
