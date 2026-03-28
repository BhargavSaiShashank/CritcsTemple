import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
};

const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };

const ReviewCard = ({ review, index, showRanking }) => {
    const derivedVerdict = getVerdictFromScore(review.overall_rating || 0);
    const vc = getV(derivedVerdict);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            style={{ 
                flex: '0 0 280px', 
                marginRight: '24px', 
                height: '420px',
                position: 'relative' 
            }}
        >
            <Link to={`/review/${review.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div style={{
                    height: '100%',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative'
                }}>
                    <img 
                        src={review.movie_poster_url || FALLBACK} 
                        alt={review.movie_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                    />
                    
                    {/* Ranking Badge */}
                    {showRanking && (
                        <div style={{
                            position: 'absolute', top: '16px', left: '16px',
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: index < 3 ? 'linear-gradient(135deg, #f5a623, #d48c15)' : 'rgba(0,0,0,0.6)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', fontWeight: 900, color: index < 3 ? '#000' : '#fff',
                            backdropFilter: 'blur(10px)', zIndex: 10,
                            boxShadow: index < 3 ? '0 8px 20px rgba(245,166,35,0.4)' : 'none'
                        }}>
                            {index + 1}
                        </div>
                    )}

                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        padding: '24px',
                        background: 'linear-gradient(to top, #111 20%, rgba(17,17,17,0.8) 50%, transparent 100%)'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <span style={{
                                padding: '2px 10px', borderRadius: '99px', fontSize: '9px', fontWeight: 700,
                                background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`,
                                textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {derivedVerdict}
                            </span>
                        </div>
                        <h3 className="line-clamp-2" style={{ fontSize: '18px', fontWeight: 800, color: '#f2f2f2', marginBottom: '8px', lineHeight: 1.2 }}>
                            {review.movie_title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: '#f5a623' }}>
                            <Star size={14} fill="#f5a623" />
                            {parseFloat(review.overall_rating || 0).toFixed(2)}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default function ReviewRow({ reviews, showRankings, categoryTitle }) {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!reviews?.length) return null;

    const categorySlug = categoryTitle?.toLowerCase().replace(/ /g, '-');
    const showSeeAll = reviews.length > 20;

    return (
        <div style={{ position: 'relative', width: '100%', group: 'true' }}>
            <div 
                ref={scrollRef}
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    padding: '10px 0 30px',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth'
                }}
                className="hide-scrollbar"
            >
                {reviews.slice(0, 20).map((review, i) => (
                    <ReviewCard 
                        key={review.slug + i} 
                        review={review} 
                        index={i} 
                        showRanking={showRankings} 
                    />
                ))}

                {showSeeAll && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: reviews.length * 0.05 }}
                        style={{ 
                            flex: '0 0 280px', 
                            height: '420px',
                            position: 'relative' 
                        }}
                    >
                        <Link 
                            to={`/hall-of-fame-ranking/${categorySlug}`}
                            style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                        >
                            <div style={{
                                height: '100%',
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(0,0,0,0.4))',
                                border: '2px dashed rgba(245,166,35,0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '16px',
                                transition: 'all 0.3s ease'
                            }}
                            className="hover:scale-[1.02] hover:bg-amber-500/10 hover:border-amber-500 transition-all"
                            >
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: 'rgba(245,166,35,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#f5a623'
                                }}>
                                    <Star size={32} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ 
                                        fontSize: '18px', fontWeight: 900, color: '#f2f2f2',
                                        textTransform: 'uppercase', letterSpacing: '0.1em'
                                    }}>
                                        See All
                                    </h4>
                                    <p style={{ 
                                        fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                                        marginTop: '4px', textTransform: 'uppercase'
                                    }}>
                                        {reviews.length} Rankings
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Nav Arrows - Hidden on mobile if needed, but shown here for desktop */}
            <div style={{
                position: 'absolute', top: '50%', left: '-20px', transform: 'translateY(-50%)',
                zIndex: 20
            }}>
                <button 
                    onClick={() => scroll('left')}
                    style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: 'rgba(17,17,17,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
            </div>
            <div style={{
                position: 'absolute', top: '50%', right: '-20px', transform: 'translateY(-50%)',
                zIndex: 20
            }}>
                <button 
                    onClick={() => scroll('right')}
                    style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: 'rgba(17,17,17,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)'
                    }}
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}
