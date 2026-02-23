import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600';

const VERDICT_MAP = {
    Legendary: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
    Masterpiece: { color: '#f5a623', bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.25)' },
    Essential: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
    Elite: { color: '#c084fc', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' },
    Great: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
    Good: { color: '#86efac', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.15)' },
    Decent: { color: '#fde047', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.15)' },
};
const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.15)' };

const scoreColor = (s) => {
    const n = parseFloat(s);
    if (n >= 8.5) return '#fbbf24';
    if (n >= 7) return '#4ade80';
    if (n >= 5) return '#60a5fa';
    return '#f87171';
};

function ReviewCard({ review, index }) {
    const [src, setSrc] = useState(review.movie_poster_url || FALLBACK);
    const vc = getV(review.verdict);
    const delay = Math.min(index * 0.04, 0.24);

    return (
        <Link
            to={`/review/${review.slug}`}
            style={{ textDecoration: 'none', display: 'block' }}
        >
            <div
                className="group"
                style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                    animation: `fadeUp 0.45s ease ${delay}s both`,
                    cursor: 'pointer',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,166,35,0.08)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {/* Poster */}
                <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', background: '#181818' }}>
                    <img
                        src={src}
                        alt={review.movie_title}
                        onError={() => setSrc(FALLBACK)}
                        style={{
                            position: 'absolute', inset: 0, width: '100%', height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.35s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    {/* Gradient overlay */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(17,17,17,1) 0%, rgba(17,17,17,0.3) 50%, transparent 100%)',
                    }} />
                    {/* Score badge */}
                    <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '12px', fontWeight: 800, color: scoreColor(review.overall_rating),
                    }}>
                        <Star size={10} fill="currentColor" color="currentColor" />
                        {parseFloat(review.overall_rating || 0).toFixed(1)}
                    </div>
                </div>

                {/* Info */}
                <div style={{ padding: '14px 16px 16px' }}>
                    {/* Verdict */}
                    <span style={{
                        display: 'inline-block', marginBottom: '8px',
                        padding: '2px 10px', borderRadius: '99px',
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                        background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`,
                    }}>
                        {review.verdict}
                    </span>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f2f2f2', marginBottom: '6px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                        {review.movie_title}
                    </h3>

                    {review.summary && (
                        <p className="line-clamp-2" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, marginBottom: '12px' }}>
                            {review.summary}
                        </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: 'rgba(245,166,35,0.7)' }}>
                        Read review <ArrowRight size={11} />
                    </div>
                </div>
            </div>
        </Link>
    );
}

function SkeletonCard() {
    return (
        <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#111', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="skeleton" style={{ paddingTop: '56.25%' }} />
            <div style={{ padding: '14px 16px' }}>
                <div className="skeleton" style={{ height: '14px', borderRadius: '99px', width: '35%', marginBottom: '10px' }} />
                <div className="skeleton" style={{ height: '18px', borderRadius: '6px', width: '75%', marginBottom: '7px' }} />
                <div className="skeleton" style={{ height: '12px', borderRadius: '6px', width: '90%', marginBottom: '5px' }} />
                <div className="skeleton" style={{ height: '12px', borderRadius: '6px', width: '60%' }} />
            </div>
        </div>
    );
}

export default function ReviewGrid({ reviews, loading }) {
    if (loading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }
    if (!reviews?.length) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
                No reviews yet
            </div>
        );
    }
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
            {reviews.map((r, i) => <ReviewCard key={r._id || r.id || i} review={r} index={i} />)}
        </div>
    );
}
