import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { getHallOfFameReviews } from '../services/api';
import { motion } from 'framer-motion';
import ReviewGrid from '../components/ReviewGrid';

export default function HallOfFame() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHallOfFameReviews().then(({ data }) => setReviews(data || [])).catch(console.error).finally(() => setLoading(false));
    }, []);

    const hero = reviews[0];

    return (
        <div style={{ minHeight: '100vh', background: '#080808' }}>
            {/* Header banner */}
            <div style={{ position: 'relative', overflow: 'hidden', height: '45vh', minHeight: '380px' }}>
                {hero?.movie_poster_url && (
                    <div style={{ position: 'absolute', inset: 0 }}>
                        <motion.img
                            key={hero.imdb_id}
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            src={hero.movie_poster_url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.12) saturate(0.5)' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, #080808 100%)' }} />
                    </div>
                )}

                <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', height: '100%', padding: '0 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '99px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.14)', marginBottom: '24px' }}>
                            <Trophy size={11} color="#f5a623" />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Legendary Tier</span>
                        </div>

                        <h1 className="display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: '#f2f2f2', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '16px' }}>
                            Hall of Fame
                        </h1>
                        <p style={{ fontSize: '17px', fontWeight: 300, color: 'rgba(255,255,255,0.45)', maxWidth: '500px', lineHeight: 1.8, marginBottom: '0' }}>
                            The primary archive of cinematic excellence — works that define the medium.
                        </p>
                    </motion.div>
                </div>

                {/* Divider glow */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(245,166,35,0.1), transparent)' }} />
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 28px 100px' }}>
                <ReviewGrid reviews={reviews} loading={loading} />
            </div>
        </div>
    );
}
