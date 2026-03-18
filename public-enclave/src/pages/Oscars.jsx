import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Award, Film } from 'lucide-react';
import { getLatestReviews } from '../services/api';
import ReviewGrid from '../components/ReviewGrid';

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
                    Oscar Contenders
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
                        lineHeight: 1.6
                    }}
                >
                    A curated archive of cinematic excellence. The films pushing the boundaries of the medium, contending for the highest accolades.
                </motion.p>
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
                    <ReviewGrid reviews={reviews} loading={loading} />
                )}
            </section>
        </div>
    );
}
