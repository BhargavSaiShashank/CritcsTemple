import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, Search, Film, TrendingUp } from 'lucide-react';
import { getLatestReviews } from '../services/api';
import ReviewGrid from '../components/ReviewGrid';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';
const VERDICT_COLOR = {
    Legendary: '#f87171', Masterpiece: '#f5a623', Essential: '#60a5fa',
    Elite: '#c084fc', Great: '#4ade80', Good: '#86efac',
};

export default function Home() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        getLatestReviews(30)
            .then(({ data }) => setReviews(data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const hero = reviews[0];
    const heroColor = VERDICT_COLOR[hero?.verdict] || '#f5a623';

    const filtered = reviews.filter(r =>
        !search ||
        r.movie_title?.toLowerCase().includes(search.toLowerCase()) ||
        r.verdict?.toLowerCase().includes(search.toLowerCase()) ||
        r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div style={{ background: '#080808', minHeight: '100vh' }}>

            {/* ── HERO: Flexible height to prevent massive gaps ── */}
            <section style={{
                position: 'relative',
                minHeight: '70vh',
                paddingTop: '120px',
                paddingBottom: '80px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
            }}>
                {/* Cinematic background image with filter */}
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src={hero?.movie_poster_url || FALLBACK}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.22) saturate(0.7)' }}
                    />
                    {/* Gradient overlays */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.5) 0%, transparent 40%, rgba(8,8,8,0.4) 70%, #080808 100%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(8,8,8,0.4) 100%)' }} />
                    {/* Ambient glow from verdict color */}
                    <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '35%', height: '40%', background: `radial-gradient(ellipse, ${heroColor}12 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
                </div>

                {/* Content Centered */}
                <div style={{
                    position: 'relative', zIndex: 2,
                    maxWidth: '1200px', margin: '0 auto', width: '100%',
                    padding: '0 48px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '64px',
                }}>
                    {/* Left text block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: '99px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.14)', marginBottom: '24px' }}>
                            <TrendingUp size={11} color="#f5a623" />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Latest Imprint</span>
                        </div>

                        <h1 className="display" style={{ fontSize: 'clamp(2.8rem, 6.5vw, 5.5rem)', fontWeight: 800, color: '#f2f2f2', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: '18px' }}>
                            {hero?.movie_title || 'The Sanctuary'}
                        </h1>

                        {hero?.summary && hero.summary.length > 6 && (
                            <p style={{ fontSize: '16px', fontWeight: 300, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: '500px', marginBottom: '32px' }}>
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
                    </div>

                    {/* Right: floating poster card */}
                    {hero?.movie_poster_url && (
                        <div style={{ width: '280px', flexShrink: 0, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <img src={hero.movie_poster_url} alt={hero.movie_title} style={{ width: '100%', display: 'block' }} />
                        </div>
                    )}
                </div>
            </section>

            {/* ── ARCHIVE GRID ──────────────────────────────────── */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 48px 100px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.6)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Film size={10} /> Cinema Archive
                        </div>
                        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f2f2f2', letterSpacing: '-0.02em', lineHeight: 1 }}>
                            All Reviews
                        </h2>
                        {!loading && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '5px' }}>{filtered.length} imprints in the archive</div>}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Search title, verdict, tag…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ padding: '9px 14px 9px 34px', borderRadius: '10px', width: '230px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#f2f2f2', outline: 'none', fontFamily: 'Outfit, sans-serif' }}
                            onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.25)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                        />
                    </div>
                </div>

                <ReviewGrid reviews={filtered} loading={loading} />
            </section>
        </div >
    );
}
