import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Film, ChevronDown, Calendar } from 'lucide-react';
import { getLatestReviews, getSettings, getOscarYears } from '../services/api';
import ReviewGrid from '../components/ReviewGrid';

export default function Oscars() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState(2026);
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
    const [availableYears, setAvailableYears] = useState([2024, 2025, 2026]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await getSettings();
                if (data && data.active_oscar_year) {
                    setSelectedYear(data.active_oscar_year);
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };

        const fetchYears = async () => {
            try {
                const { data } = await getOscarYears();
                if (data && Array.isArray(data)) {
                    // Ensure the active year is also in the list even if it's new
                    setAvailableYears(prev => {
                        const combined = [...new Set([...data, selectedYear])];
                        return combined.sort((a, b) => b - a);
                    });
                }
            } catch (err) {
                console.error("Failed to fetch Oscar years", err);
            }
        };

        fetchSettings();
        fetchYears();
    }, []);

    // Update available years if selectedYear changes and isn't in the list
    useEffect(() => {
        if (!availableYears.includes(selectedYear)) {
            setAvailableYears(prev => [...new Set([...prev, selectedYear])].sort((a, b) => b - a));
        }
    }, [selectedYear]);

    useEffect(() => {
        const fetchOscars = async () => {
            setLoading(true);
            try {
                // Fetch up to 50 latest reviews ascending securely mapped to the hierarchical rank, including year filter
                const { data } = await getLatestReviews(50, 0, '', 'All', 'All', 'oscar_rank', 'asc', 'oscar', selectedYear);
                setReviews(data || []);
            } catch (err) {
                console.error("Failed to fetch oscar contenders", err);
                setError(err.message || 'Failed to load contenders');
            } finally {
                setLoading(false);
            }
        };
        fetchOscars();
    }, [selectedYear]);

    return (
        <div style={{ background: '#080808', minHeight: '100vh', position: 'relative' }}>
            <Helmet>
                <title>Oscar Contenders - Critic's Temple</title>
            </Helmet>

            {/* Premium Gold Background Atmosphere  */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
                background: 'radial-gradient(circle at 50% -20%, rgba(255, 215, 0, 0.15), transparent 70%)'
            }} />

            <section
                style={{
                    position: 'relative',
                    paddingTop: 'calc(140px + var(--safe-top))',
                    paddingBottom: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    zIndex: 1
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.05))',
                        border: '1px solid rgba(255,215,0,0.4)',
                        marginBottom: '24px',
                        boxShadow: '0 0 50px rgba(255,215,0,0.2)'
                    }}
                >
                    <Award size={40} color="#FFD700" strokeWidth={1.5} />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    style={{
                        fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        marginBottom: '16px',
                        background: 'linear-gradient(to bottom, #FFFFFF 20%, #FFD700 80%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 10px 30px rgba(255,215,0,0.15)'
                    }}
                >
                    Oscar Contenders {selectedYear}
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    style={{
                        fontSize: 'clamp(14px, 2vw, 18px)',
                        color: 'rgba(255,255,255,0.5)',
                        maxWidth: '600px',
                        margin: '0 auto',
                        lineHeight: 1.6,
                        marginBottom: '40px'
                    }}
                >
                    A curated archive of cinematic excellence. The films pushing the boundaries of the medium, contending for the highest accolades.
                </motion.p>

                {/* Fixed Exploration Dropdown on Top Left */}
                <div style={{
                    position: 'absolute',
                    top: 'calc(100px + var(--safe-top))',
                    left: '40px',
                    zIndex: 100
                }}>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 18px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                color: '#FFD700',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s'
                            }}
                        >
                            <Calendar size={14} />
                            Explore {selectedYear}
                            <ChevronDown size={14} style={{ transform: isYearDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                        </button>

                        <AnimatePresence>
                            {isYearDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    style={{
                                        position: 'absolute',
                                        top: '120%',
                                        left: 0,
                                        width: '160px',
                                        background: '#0a0a0a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                        zIndex: 101
                                    }}
                                >
                                    {availableYears.map(year => (
                                        <button
                                            key={year}
                                            onClick={() => {
                                                setSelectedYear(year);
                                                setIsYearDropdownOpen(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '12px 20px',
                                                background: selectedYear === year ? 'rgba(255,215,0,0.1)' : 'transparent',
                                                color: selectedYear === year ? '#FFD700' : 'rgba(255,255,255,0.5)',
                                                border: 'none',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Oscars {year}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            <section className="max-w-container" style={{ position: 'relative', zIndex: 1, paddingBottom: '120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                    <div style={{ width: '40px', height: '1px', background: 'rgba(255,215,0,0.4)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFD700', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        The Select Few
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                </div>

                {error ? (
                    <div style={{ textAlign: 'center', color: '#ff4d4d', padding: '40px' }}>
                        {error}
                    </div>
                ) : (
                    <ReviewGrid reviews={reviews} loading={loading} showOscarRank={true} />
                )}
            </section>
        </div>
    );
}
