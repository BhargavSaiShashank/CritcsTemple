import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { getHallOfFameReviews } from '../services/api';
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
            <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '60px' }}>
                {hero?.movie_poster_url && (
                    <>
                        <img src={hero.movie_poster_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.1) saturate(0.4)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.7) 0%, #080808 100%)', pointerEvents: 'none' }} />
                    </>
                )}

                <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '56px 28px 48px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '99px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.14)', marginBottom: '18px' }}>
                        <Trophy size={11} color="#f5a623" />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Legendary Tier</span>
                    </div>

                    <h1 className="display" style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, color: '#f2f2f2', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '12px' }}>
                        Hall of Fame
                    </h1>
                    <p style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(255,255,255,0.35)', maxWidth: '440px', lineHeight: 1.75 }}>
                        The sacred pantheon — films that rose above cinema and became culture.
                    </p>
                    {!loading && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '10px' }}>{reviews.length} immortalized</div>}
                </div>

                {/* Divider glow */}
                <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(245,166,35,0.15), transparent)', maxWidth: '1200px', margin: '0 auto' }} />
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 28px 100px' }}>
                <ReviewGrid reviews={reviews} loading={loading} />
            </div>
        </div>
    );
}
