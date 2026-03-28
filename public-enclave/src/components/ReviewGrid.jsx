import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getVerdictFromScore } from '../utils/verdict';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const VERDICT_MAP = {
    Legendary: { color: '#FFFFFF', bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' },
    Masterpiece: { color: '#FFD700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.2)' },
    Essential: { color: '#FF66F2', bg: 'rgba(255,102,242,0.1)', border: 'rgba(255,102,242,0.2)' },
    Elite: { color: '#BB77FF', bg: 'rgba(187,119,255,0.1)', border: 'rgba(187,119,255,0.2)' },
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
            style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
        >
            <Link
                to={`/review/${review.slug}`}
                style={{ textDecoration: 'none', display: 'block', width: '100%' }}
            >
                <div
                    className="group"
                    style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '2 / 3',
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
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#181818' }}>
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
                        {/* Gradient overlay focused heavily on the bottom to protect the text */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
                            background: 'linear-gradient(to top, rgba(17,17,17,1) 0%, rgba(17,17,17,0.8) 40%, transparent 100%)',
                        }} />
                        
                        {/* Ranking Badge */}
                        {showRanking && (
                            <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center justify-center font-black rounded-lg backdrop-blur-md z-10 w-8 h-8 md:w-14 md:h-14 text-xs md:text-2xl border box-border shadow-2xl"
                                style={{
                                    background: index < 3 ? 'linear-gradient(135deg, #f5a623, #d48c15)' : 'rgba(0,0,0,0.7)',
                                    color: index < 3 ? '#000' : '#fff',
                                    borderColor: 'rgba(255,255,255,0.2)'
                                }}>
                                {index + 1}
                            </div>
                        )}

                        {/* Oscar Rank badge (if any, fallback if no ranking is shown) */}
                        {!showRanking && review.oscar_rank && (
                            <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center justify-center font-black rounded-md z-10 px-2.5 md:px-4 py-1.5 md:py-2 text-[11px] md:text-lg shadow-2xl backdrop-blur-md"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(184,134,11,0.9))',
                                    color: '#000',
                                    border: '1px solid rgba(255,255,255,0.3)'
                                }}>
                                #{review.oscar_rank}
                            </div>
                        )}

                        {/* Dense Text Section Overlaying Bottom */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            padding: '12px 10px 16px 10px',
                            display: 'flex', flexDirection: 'column', gap: '6px'
                        }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <span className="line-clamp-1" style={{
                                    display: 'inline-block',
                                    padding: '2px 6px', borderRadius: '4px',
                                    fontSize: 'clamp(7px, 2vw, 9px)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                                    background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`
                                }}>
                                    {derivedVerdict}
                                </span>
                            </div>

                            <h3 className="line-clamp-2" style={{ 
                                fontSize: 'clamp(11px, 3.5vw, 15px)', 
                                fontWeight: 800, 
                                color: '#f2f2f2', 
                                lineHeight: 1.15, 
                                letterSpacing: '-0.015em'
                            }}>
                                {review.movie_title}
                            </h3>

                            <div style={{ 
                                display: 'flex', alignItems: 'center', gap: '3px', 
                                fontSize: 'clamp(10px, 3vw, 13px)', 
                                fontWeight: 800, 
                                color: scoreColor(review.overall_rating)
                            }}>
                                <Star size={10} fill="currentColor" />
                                {parseFloat(review.overall_rating || 0).toFixed(2)}
                            </div>
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
            <div className="skeleton" style={{ width: '100%', aspectRatio: '2 / 3' }} />
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
