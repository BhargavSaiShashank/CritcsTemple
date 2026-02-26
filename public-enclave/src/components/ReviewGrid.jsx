import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const VERDICT_MAP = {
    Legendary: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
    Masterpiece: { color: '#f5a623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)' },
    Essential: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
    Elite: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)' },
    Great: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
    Good: { color: '#86efac', bg: 'rgba(134,239,172,0.1)', border: 'rgba(134,239,172,0.2)' },
    Decent: { color: '#fcd34d', bg: 'rgba(252,211,77,0.1)', border: 'rgba(252,211,77,0.2)' },
    Average: { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)' },
    Mediocre: { color: '#d1d5db', bg: 'rgba(209,213,219,0.1)', border: 'rgba(209,213,219,0.2)' },
    Poor: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
};

const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };

const scoreColor = (score) => {
    if (score >= 9) return '#f5a623';
    if (score >= 8) return '#4ade80';
    if (score >= 7) return '#60a5fa';
    if (score >= 5) return '#fcd34d';
    return '#f87171';
};

function ReviewCard({ review, index }) {
    const [src, setSrc] = useState(review.movie_poster_url || FALLBACK);
    const vc = getV(review.verdict);

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            whileHover={{ y: -6, scale: 1.02 }}
        >
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
                        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(245,166,35,0.25)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(245,166,35,0.05)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    {/* Poster */}
                    <div style={{ position: 'relative', aspectRatio: '2 / 3', overflow: 'hidden', background: '#181818' }}>
                        <img
                            src={src}
                            alt={review.movie_title}
                            onError={() => setSrc(FALLBACK)}
                            style={{
                                position: 'absolute', inset: 0, width: '100%', height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        {/* Gradient overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(17,17,17,1) 0%, rgba(17,17,17,0.3) 50%, transparent 100%)',
                        }} />
                        {/* Score badge */}
                        <div style={{
                            position: 'absolute', top: '12px', right: '12px',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', borderRadius: '8px',
                            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '12px', fontWeight: 800, color: scoreColor(review.overall_rating),
                        }}>
                            <Star size={10} fill="currentColor" color="currentColor" />
                            {parseFloat(review.overall_rating || 0).toFixed(1)}
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '16px 18px 18px' }}>
                        {/* Verdict */}
                        <span style={{
                            display: 'inline-block', marginBottom: '10px',
                            padding: '2px 10px', borderRadius: '99px',
                            fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                            background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`,
                        }}>
                            {review.verdict}
                        </span>

                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f2f2f2', marginBottom: '8px', lineHeight: 1.3, letterSpacing: '-0.015em' }}>
                            {review.movie_title}
                        </h3>

                        {review.summary && (
                            <p className="line-clamp-2" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '14px' }}>
                                {review.summary}
                            </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#f5a623' }}>
                            Read review <ArrowRight size={13} />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

function SkeletonCard() {
    return (
        <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#111', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="skeleton" style={{ aspectRatio: '2 / 3' }} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '20px' }}>
            {reviews.map((r, i) => <ReviewCard key={r._id || r.id || i} review={r} index={i} />)}
        </div>
    );
}
