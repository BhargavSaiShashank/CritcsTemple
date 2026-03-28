import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { getVerdictFromScore } from '../utils/verdict';


export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios' || window.innerWidth <= 768;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleResize = () => {
            setIsMobile(Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios' || window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
}


const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const VERDICT_MAP = {
    Legendary: { color: '#FFFFFF', bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' },
    Masterpiece: { color: '#FFD700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.2)' },
    Essential: { color: '#FF66F2', bg: 'rgba(255,102,242,0.1)', border: 'rgba(255,102,242,0.2)' },
    Elite: { color: '#BB77FF', bg: 'rgba(187,119,255,0.1)', border: 'rgba(187,119,255,0.2)' },
    Great: { color: '#00FF44', bg: 'rgba(0,255,68,0.1)', border: 'rgba(0,255,68,0.2)' },
    Good: { color: '#8FFF00', bg: 'rgba(143,255,0,0.1)', border: 'rgba(143,255,0,0.2)' },
    Decent: { color: '#00D0FF', bg: 'rgba(0,208,255,0.1)', border: 'rgba(0,208,255,0.2)' },
};

const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };

const ReviewCard = ({ review, index, showRanking }) => {
    const isMobile = useIsMobile();
    const [imageLoaded, setImageLoaded] = useState(false);
    const derivedVerdict = getVerdictFromScore(review.overall_rating || 0);
    const vc = getV(derivedVerdict);

    const triggerHaptic = async () => {
        if (Capacitor.isNativePlatform()) {
            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) {}
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            style={{ 
                flex: `0 0 ${isMobile ? 'clamp(115px, 28vw, 150px)' : '280px'}`, 
                marginRight: isMobile ? '12px' : '24px', 
                height: isMobile ? 'clamp(172px, 42vw, 225px)' : '420px',
                position: 'relative' 
            }}
        >
            <Link to={`/review/${review.slug}`} onClick={triggerHaptic} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div style={{
                    height: '100%',
                    borderRadius: isMobile ? '12px' : '20px',
                    overflow: 'hidden',
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative'
                }}>
                    <motion.img 
                        src={review.movie_poster_url || FALLBACK} 
                        alt={review.movie_title}
                        onLoad={() => setImageLoaded(true)}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ 
                            opacity: imageLoaded ? 1 : 0, 
                            scale: imageLoaded ? 1 : 1.1 
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    
                    {/* Ranking Badge */}
                    {showRanking && (
                        <div style={{
                            position: 'absolute', top: isMobile ? '8px' : '16px', left: isMobile ? '8px' : '16px',
                            width: isMobile ? '32px' : '56px', height: isMobile ? '32px' : '56px', borderRadius: isMobile ? '8px' : '16px',
                            background: index < 3 ? 'linear-gradient(135deg, #f5a623, #d48c15)' : 'rgba(0,0,0,0.6)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: isMobile ? '14px' : '28px', fontWeight: 950, color: index < 3 ? '#000' : '#fff',
                            backdropFilter: 'blur(10px)', zIndex: 10,
                            boxShadow: index < 3 ? '0 8px 30px rgba(245,166,35,0.5)' : '0 4px 15px rgba(0,0,0,0.5)'
                        }}>
                            {index + 1}
                        </div>
                    )}

                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        padding: isMobile ? '10px 8px 14px 8px' : '24px',
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        maskImage: 'linear-gradient(to top, black 0%, black 85%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to top, black 0%, black 85%, transparent 100%)'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: isMobile ? '4px' : '12px' }}>
                            <span style={{
                                padding: isMobile ? '2px 6px' : '2px 10px', borderRadius: '99px', fontSize: isMobile ? '7px' : '9px', fontWeight: 700,
                                background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`,
                                textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {derivedVerdict}
                            </span>
                        </div>
                        <h3 className="line-clamp-2" style={{ fontSize: isMobile ? '12px' : '18px', fontWeight: 800, color: '#f2f2f2', marginBottom: isMobile ? '4px' : '8px', lineHeight: 1.15 }}>
                            {review.movie_title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: isMobile ? '11px' : '14px', fontWeight: 700, color: '#f5a623' }}>
                            <Star size={isMobile ? 10 : 14} fill="#f5a623" />
                            {parseFloat(review.overall_rating || 0).toFixed(2)}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default function ReviewRow({ reviews, showRankings, categoryTitle }) {
    const isMobile = useIsMobile();
    const scrollRef = useRef(null);

    const triggerHaptic = async () => {
        if (Capacitor.isNativePlatform()) {
            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) {}
        }
    };

    const scroll = (direction) => {
        triggerHaptic();
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
                    padding: isMobile ? '10px 0 16px' : '10px 0 30px',
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
                            flex: `0 0 ${isMobile ? 'clamp(115px, 28vw, 150px)' : '280px'}`, 
                            height: isMobile ? 'clamp(172px, 42vw, 225px)' : '420px',
                            position: 'relative' 
                        }}
                    >
                        <Link 
                            to={`/hall-of-fame-ranking/${categorySlug}`}
                            onClick={triggerHaptic}
                            style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                        >
                            <div style={{
                                height: '100%',
                                borderRadius: isMobile ? '12px' : '20px',
                                background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(0,0,0,0.4))',
                                border: '2px dashed rgba(245,166,35,0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: isMobile ? '6px' : '16px',
                                transition: 'all 0.3s ease'
                            }}
                            className="hover:scale-[1.02] hover:bg-amber-500/10 hover:border-amber-500 transition-all"
                            >
                                <div style={{
                                    width: isMobile ? '36px' : '64px', height: isMobile ? '36px' : '64px', borderRadius: '50%',
                                    background: 'rgba(245,166,35,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#f5a623'
                                }}>
                                    <Star size={isMobile ? 16 : 32} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ 
                                        fontSize: isMobile ? '12px' : '18px', fontWeight: 900, color: '#f2f2f2',
                                        textTransform: 'uppercase', letterSpacing: '0.1em'
                                    }}>
                                        See All
                                    </h4>
                                    <p style={{ 
                                        fontSize: isMobile ? '8px' : '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
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
                        display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
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
                        display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)'
                    }}
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}
