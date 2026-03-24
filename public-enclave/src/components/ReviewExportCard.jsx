import React from 'react';
import { Star } from 'lucide-react';
import { API_URL } from '../services/api';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const getProxiedUrl = (url) => {
    if (!url) return '';
    return `${API_URL}/proxy-image?url=${encodeURIComponent(url)}`;
};

const VERDICT_MAP = {
    Legendary: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', glow: 'rgba(248,113,113,0.15)' },
    Masterpiece: { color: '#f5a623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)', glow: 'rgba(245,166,35,0.15)' },
    Essential: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', glow: 'rgba(96,165,250,0.15)' },
    Elite: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.3)', glow: 'rgba(192,132,252,0.15)' },
    Great: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.3)', glow: 'rgba(74,222,128,0.15)' },
    Good: { color: '#86efac', bg: 'rgba(134,239,172,0.1)', border: 'rgba(134,239,172,0.3)', glow: 'rgba(134,239,172,0.15)' },
    Decent: { color: '#fcd34d', bg: 'rgba(252,211,77,0.1)', border: 'rgba(252,211,77,0.3)', glow: 'transparent' },
    Average: { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)', glow: 'transparent' },
    Mediocre: { color: '#d1d5db', bg: 'rgba(209,213,219,0.1)', border: 'rgba(209,213,219,0.3)', glow: 'transparent' },
    Poor: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', glow: 'rgba(248,113,113,0.1)' },
};

const ASPECT_GROUPS = [
    { name: 'Narrative', color: '#818cf8', aspects: ['story', 'screenplay', 'thematic_depth', 'originality', 'opening_climax'] },
    { name: 'Direction', color: '#f59e0b', aspects: ['vision', 'blocking_staging', 'pacing', 'executive_control'] },
    { name: 'Acting', color: '#10b981', aspects: ['performance', 'chemistry', 'presence', 'casting'] },
    { name: 'Visuals', color: '#34d399', aspects: ['cinematography', 'production_design', 'visual_storytelling'] },
    { name: 'Music', color: '#f472b6', aspects: ['score', 'sound_design', 'silence', 'soundtrack'] },
    { name: 'Soul', color: '#fb7185', aspects: ['emotional_impact', 'rewatch_value', 'immersion', 'resonance'] },
];

const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', glow: 'transparent' };

// Hidden wrapper component to isolate the canvas rendering context
const ReviewExportCard = React.forwardRef(({ review }, ref) => {
    if (!review) return null;

    const vc = getV(review.verdict);
    const score = parseFloat(review.overall_rating || 0).toFixed(2);

    const aspects = review.aspects || {};
    const groupAverages = ASPECT_GROUPS.map(g => {
        const scores = g.aspects.map(k => aspects[k]).filter(a => a && parseFloat(a?.score) > 0).map(a => parseFloat(a.score));
        return { ...g, avg: scores.length ? scores.reduce((a, b) => a + b) / scores.length : null };
    }).filter(g => g.avg !== null);

    return (
        <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', zIndex: -1000, pointerEvents: 'none' }}>
            <div
                ref={ref}
                style={{
                    width: '1080px',
                    height: '1080px', // Standard Instagram square
                    background: '#080808',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
            >
                {/* 1. Background Poster (Blurred/Darkened) */}
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src={getProxiedUrl(review.movie_poster_url || FALLBACK)}
                        crossOrigin="anonymous" // Important for html2canvas
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.2) saturate(0.5)', opacity: 0.8 }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.4) 60%, rgba(8,8,8,0.8) 100%)' }} />
                </div>

                {/* 2. Top Bar (Branding) */}
                <div style={{ position: 'absolute', top: '60px', left: '80px', right: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: '#f5a623', color: '#000', padding: '12px', borderRadius: '16px', display: 'grid', placeItems: 'center' }}>
                            {/* Simple SVG icon equivalent for the branding */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="2.5" ry="2.5"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line>
                            </svg>
                        </div>
                        <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Critic's Temple</span>
                    </div>
                    {/* Verdict simple pill at top right */}
                    <div style={{
                        padding: '12px 32px', borderRadius: '99px', fontSize: '20px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
                        background: vc.bg, color: vc.color, border: `2px solid ${vc.border}`
                    }}>
                        {review.verdict}
                    </div>
                </div>

                {/* 3. Main Central Composition */}
                <div style={{ position: 'absolute', inset: '160px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>

                    {/* Glowing Accent Behind Poster */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: '800px', height: '800px', background: `radial-gradient(circle, ${vc.glow !== 'transparent' ? vc.glow : 'rgba(255,255,255,0.03)'} 0%, transparent 60%)`, zIndex: -1
                    }} />

                    <div style={{ display: 'flex', gap: '80px', alignItems: 'center' }}>

                        {/* Left: Poster */}
                        <div style={{ width: '420px', flexShrink: 0, borderRadius: '40px', overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,0.9)', border: '2px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                            <img
                                src={getProxiedUrl(review.movie_poster_url || FALLBACK)}
                                crossOrigin="anonymous" // Important for html2canvas
                                style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                            />
                        </div>

                        {/* Right: Info Component */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            <div>
                                <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '72px', fontWeight: 800, color: '#f2f2f2', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {review.movie_title}
                                </h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {review.movie_year && <span style={{ fontSize: '28px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{review.movie_year}</span>}
                                    {review.movie_year && review.movie_director && <span style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} />}
                                    {review.movie_director && <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>DIR. {review.movie_director.toUpperCase()}</span>}
                                </div>
                            </div>

                            {review.tags?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {review.tags.slice(0, 4).map(t => (
                                        <span key={t} style={{ padding: '6px 14px', borderRadius: '99px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 500, letterSpacing: '0.05em' }}>
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Quote / Summary */}
                            {review.summary && (
                                <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 300, fontStyle: 'italic', maxHeight: '180px', overflow: 'hidden' }}>
                                    "{review.summary}"
                                </p>
                            )}

                            {/* Stats Flexbox */}
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: 'auto' }}>
                                {/* Big Score Block */}
                                <div style={{ background: 'rgba(10,10,10,0.8)', borderRadius: '24px', padding: '16px 32px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-flex', alignItems: 'baseline', gap: '12px' }}>
                                    <Star size={40} fill="#f5a623" color="#f5a623" style={{ alignSelf: 'center' }} />
                                    <span style={{ fontSize: '80px', fontWeight: 900, color: '#f5a623', lineHeight: 0.8, letterSpacing: '-0.04em' }}>{score}</span>
                                    <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>/10</span>
                                </div>

                                {/* Category Mini Badges */}
                                {groupAverages.map(g => (
                                    <div key={g.name} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px', flex: 1 }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{g.name}</span>
                                        <span style={{ fontSize: '28px', fontWeight: 800, color: g.color }}>{g.avg.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>

                {/* 4. Bottom Footer */}
                <div style={{ position: 'absolute', bottom: '60px', left: '80px', right: '80px', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
                    <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        Critic's Temple • Film Archive
                    </div>
                </div>

            </div>
        </div>
    );
});

export default ReviewExportCard;
