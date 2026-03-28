import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getVerdictFromScore } from '../utils/verdict';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const VERDICT_MAP = {
    Legendary: { color: '#FFFFFF', bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' },
    Masterpiece: { color: '#FFD700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.2)' },
    Essential: { color: '#FF00EA', bg: 'rgba(255,0,234,0.1)', border: 'rgba(255,0,234,0.2)' },
    Elite: { color: '#9D00FF', bg: 'rgba(157,0,255,0.1)', border: 'rgba(157,0,255,0.2)' },
    Great: { color: '#00FF44', bg: 'rgba(0,255,68,0.1)', border: 'rgba(0,255,68,0.2)' },
    Good: { color: '#8FFF00', bg: 'rgba(143,255,0,0.1)', border: 'rgba(143,255,0,0.2)' },
    Decent: { color: '#00D0FF', bg: 'rgba(0,208,255,0.1)', border: 'rgba(0,208,255,0.2)' },
    Average: { color: '#849BB3', bg: 'rgba(132,155,179,0.1)', border: 'rgba(132,155,179,0.2)' },
    Mediocre: { color: '#FFFB00', bg: 'rgba(255,251,0,0.1)', border: 'rgba(255,251,0,0.2)' },
    Poor: { color: '#FF9100', bg: 'rgba(255,145,0,0.1)', border: 'rgba(255,145,0,0.2)' },
    Bad: { color: '#FF4D00', bg: 'rgba(255,77,0,0.1)', border: 'rgba(255,77,0,0.2)' },
    Terrible: { color: '#FF0000', bg: 'rgba(255,0,0,0.1)', border: 'rgba(255,0,0,0.2)' },
    Disaster: { color: '#990000', bg: 'rgba(153,0,0,0.1)', border: 'rgba(153,0,0,0.2)' },
    Abomination: { color: '#2D0000', bg: 'rgba(45,0,0,0.1)', border: 'rgba(45,0,0,0.2)' },
};

const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };

const scoreColor = (score) => {
    if (score >= 9.6) return '#FFFFFF';
    if (score >= 9.2) return '#FFD700';
    if (score >= 8.8) return '#FF00EA';
    if (score >= 8.4) return '#9D00FF';
    if (score >= 8.0) return '#00FF44';
    if (score >= 7.5) return '#8FFF00';
    if (score >= 7.0) return '#00D0FF';
    if (score >= 6.0) return '#849BB3';
    if (score >= 5.0) return '#FFFB00';
    if (score >= 4.0) return '#FF9100';
    if (score >= 3.0) return '#FF4D00';
    if (score >= 2.0) return '#FF0000';
    if (score >= 1.0) return '#990000';
    return '#2D0000';
};

const ReviewCard = React.memo(({ review, index, showRanking }) => {
    const [src, setSrc] = useState(review.movie_poster_url || FALLBACK);
    const derivedVerdict = getVerdictFromScore(review.overall_rating || 0);
    const vc = getV(derivedVerdict);

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            whileHover={{ y: -6, scale: 1.02 }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <Link
                to={`/review/${review.slug}`}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}
            >
                <div
                    className="group"
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
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
                    <div style={{ position: 'relative', aspectRatio: '2 / 3', overflow: 'hidden', background: '#181818', flexShrink: 0 }}>
                        <motion.img
                            layoutId={`poster-${review.slug}`}
                            src={src}
                            alt={review.movie_title}
                            onError={() => setSrc(FALLBACK)}
                            style={{
                                position: 'absolute', inset: 0, width: '100%', height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                        />
                        {/* Gradient overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(17,17,17,1) 0%, rgba(17,17,17,0.3) 50%, transparent 100%)',
                        }} />
                        
                        {/* Ranking Badge */}
                        {showRanking && (
                            <div style={{
                                position: 'absolute', top: '12px', left: '12px',
                                width: '38px', height: '38px', borderRadius: '10px',
                                background: index < 3 ? 'linear-gradient(135deg, #f5a623, #d48c15)' : 'rgba(0,0,0,0.7)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '16px', fontWeight: 900, color: index < 3 ? '#000' : '#fff',
                                backdropFilter: 'blur(10px)', zIndex: 10,
                                boxShadow: index < 3 ? '0 8px 20px rgba(245,166,35,0.4)' : 'none'
                            }}>
                                {index + 1}
                            </div>
                        )}

                        {/* Oscar Rank badge (if any, fallback if no ranking is shown) */}
                        {!showRanking && review.oscar_rank && (
                            <div style={{
                                position: 'absolute', top: '12px', left: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '4px 10px', borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(184,134,11,0.9))',
                                border: '1px solid rgba(255,255,255,0.3)',
                                fontSize: '13px', fontWeight: 900, color: '#000',
                                backdropFilter: 'blur(5px)',
                                boxShadow: '0 4px 15px rgba(255,215,0,0.3)'
                            }}>
                                #{review.oscar_rank}
                            </div>
                        )}
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
                            {parseFloat(review.overall_rating || 0).toFixed(2)}
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Verdict & Type */}
                        <div style={{ height: '24px', marginBottom: '10px', display: 'flex', gap: '8px' }}>
                            {review && (
                                <span style={{
                                    display: 'inline-block',
                                    padding: '2px 10px', borderRadius: '99px',
                                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                                    background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`,
                                }}>
                                    {derivedVerdict}
                                </span>
                            )}
                            {review.content_type === 'tv' && (
                                <span style={{
                                    display: 'inline-block',
                                    padding: '2px 10px', borderRadius: '99px',
                                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    TV Show
                                </span>
                            )}
                        </div>

                        <h3 className="line-clamp-2" style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 700, color: '#f2f2f2', marginBottom: '8px', lineHeight: 1.3, letterSpacing: '-0.015em', height: '2.6em', overflow: 'hidden' }}>
                            {review.movie_title}
                        </h3>

                        <div style={{ flex: 1 }}>
                            {review.summary && (
                                <p className="line-clamp-2" style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '14px' }}>
                                    {review.summary}
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#f5a623', marginTop: 'auto' }}>
                            Read review <ArrowRight size={13} />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

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

export default function ReviewGrid({ reviews, loading, showRankings }) {
    if (loading) {
        return (
            <div className="discovery-grid">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }
    if (!reviews?.length) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
                No reviews yet
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div className="discovery-grid">
                {reviews.map((r, i) => <ReviewCard key={r._id || r.id || i} review={r} index={i} showRanking={showRankings} />)}
            </div>
        </div>
    );
}
