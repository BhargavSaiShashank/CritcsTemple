import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { getVerdictFromScore } from '../utils/verdict';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const CarouselCard = ({ review, index }) => {
    const derivedVerdict = getVerdictFromScore(review.overall_rating || 0);

    const handleInteract = () => {
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        }
    };
    
    const handleClick = () => {
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onHoverStart={handleInteract}
            style={{
                width: 'clamp(240px, 40vw, 320px)',
                flexShrink: 0,
                scrollSnapAlign: 'start'
            }}
        >
            <Link to={`/review/${review.slug}`} style={{ textDecoration: 'none', display: 'block' }} onClick={handleClick}>
                <div style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative',
                    aspectRatio: '2/3',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                }}
                className="group hover:border-[rgba(245,166,35,0.3)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(245,166,35,0.1)]"
                >
                    <motion.img
                        layoutId={`poster-${review.slug}`}
                        src={review.movie_poster_url || FALLBACK}
                        alt={review.movie_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        className="group-hover:scale-105"
                    />
                    
                    {/* Gradient Overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.4) 40%, transparent 100%)' }} />
                    
                    {/* Content overlay */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '99px', fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                                {derivedVerdict}
                            </span>
                        </div>
                        <h3 style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 800, color: '#f2f2f2', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '6px', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                            {review.movie_title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#f5a623' }}>
                            <Star size={12} fill="#f5a623" /> {parseFloat(review.overall_rating || 0).toFixed(1)} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: '11px' }}>/ 10</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default function DiscoveryCarousel({ title, reviews, loading }) {
    const containerRef = useRef(null);

    const mustWatch = reviews || [];

    if (loading || mustWatch.length === 0) return null;

    const layoutPadding = 'max(var(--page-padding), calc(50vw - (var(--max-width) / 2) + var(--page-padding)))';

    return (
        <div style={{ margin: '40px 0 60px 0', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', paddingLeft: 'var(--page-padding)', paddingRight: 'var(--page-padding)', maxWidth: 'var(--max-width)', margin: '0 auto 24px auto' }}>
                <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#f5a623', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>Hall of Glory</div>
                        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Must-Watch Reviews</h2>
                    </div>
                <Link to="/hall-of-fame" style={{ fontSize: '12px', fontWeight: 700, color: '#f5a623', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    View Hall <ChevronRight size={14} />
                </Link>
            </div>

            <div 
                ref={containerRef}
                className="custom-scrollbar"
                style={{
                    display: 'flex',
                    gap: '24px',
                    overflowX: 'auto',
                    paddingTop: '10px',
                    paddingBottom: '40px',
                    scrollPaddingLeft: layoutPadding,
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                <div style={{ flexShrink: 0, width: `calc(${layoutPadding} - 24px)` }} />
                {mustWatch.map((review, i) => (
                    <CarouselCard key={review._id || i} review={review} index={i} />
                ))}
                <div style={{ flexShrink: 0, width: `calc(${layoutPadding} - 24px)` }} />
            </div>
        </div>
    );
}
