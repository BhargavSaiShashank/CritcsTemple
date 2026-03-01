import React from 'react';
import { Star, Film, Calendar, User, Hash } from 'lucide-react';
import { API_URL } from '../services/api';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const getProxiedUrl = (url) => {
    if (!url) return '';
    return `${API_URL}/proxy-image?url=${encodeURIComponent(url)}`;
};

const VERDICT_COLOR = {
    Legendary: '#f87171', Masterpiece: '#f5a623', Essential: '#60a5fa',
    Elite: '#c084fc', Great: '#4ade80', Good: '#86efac',
    Decent: '#fcd34d', Average: '#9ca3af', Mediocre: '#d1d5db',
    Poor: '#fca5a5', Bad: '#f87171', Terrible: '#ef4444',
    Disaster: '#dc2626', Abomination: '#b91c1c', Unwatchable: '#991b1b',
};

const SanctuaryTicket = React.forwardRef(({ review }, ref) => {
    if (!review) return null;

    const color = VERDICT_COLOR[review.verdict] || '#f5a623';
    const score = parseFloat(review.overall_rating || 0).toFixed(1);
    const date = review.published_at ? new Date(review.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -1000, pointerEvents: 'none' }}>
            <div
                ref={ref}
                style={{
                    width: '800px',
                    height: '400px',
                    background: '#0a0a0a',
                    display: 'flex',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                    fontFamily: '"Outfit", sans-serif',
                }}
            >
                {/* Left Section: Poster + Movie Info (Ticket Stub) */}
                <div style={{
                    width: '280px',
                    height: '100%',
                    position: 'relative',
                    borderRight: '2px dashed rgba(255,255,255,0.15)',
                }}>
                    <img
                        src={getProxiedUrl(review.movie_poster_url || FALLBACK)}
                        crossOrigin="anonymous"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.25) saturate(0.8)' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 0%, transparent 60%)' }} />

                    <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f5a623', marginBottom: '8px' }}>
                            <Film size={14} />
                            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Review Imprint</span>
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{review.movie_title}</h2>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{review.movie_year || 'Movie Artifact'}</div>
                    </div>

                    {/* Perforation punch effects (top & bottom) */}
                    <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '30px', height: '30px', borderRadius: '50%', background: '#080808', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', width: '30px', height: '30px', borderRadius: '50%', background: '#080808', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                {/* Right Section: Verdict + Scores */}
                <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>

                    {/* Header Branding */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                                CRITIC'S <span style={{ color: '#f5a623' }}>TEMPLE</span>
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Official Cinema Seal</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{review.verdict}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>VERDICT ID: #{review._id?.substring(0, 8).toUpperCase()}</div>
                        </div>
                    </div>

                    {/* Main Score Block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', margin: 'auto 0' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '30px',
                            background: `${color}10`,
                            border: `2px solid ${color}30`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 20px 40px ${color}10`
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: color, textTransform: 'uppercase', marginBottom: '2px' }}>Rating</div>
                            <div style={{ fontSize: '48px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{score}</div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>/ 10</div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                Core Aspects
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {['story', 'direction', 'acting', 'cinematography'].map(k => {
                                    const val = review.aspects?.[k]?.score || '–';
                                    const label = k === 'cinematography' ? 'Visuals' : k;
                                    return (
                                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{label}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f2f2f2' }}>{val}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Issued Date</div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{date}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Reviewer</div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{review.author || 'Archivist'}</div>
                            </div>
                        </div>

                        {/* Mock Barcode */}
                        <div style={{ display: 'flex', gap: '2px', height: '30px', alignItems: 'stretch' }}>
                            {[2, 4, 1, 3, 2, 6, 1, 2, 5, 3, 1, 4, 2].map((w, i) => (
                                <div key={i} style={{ width: `${w}px`, background: i % 2 === 0 ? 'rgba(255,255,255,0.3)' : 'transparent' }} />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
});

export default SanctuaryTicket;
