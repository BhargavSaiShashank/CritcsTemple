import React, { useState, useEffect, useRef } from 'react';
import { Clapperboard, Star } from 'lucide-react';
import { getProxyImageUrl } from '../services/api';

const SanctuaryCard = ({ movie, review, cardRef }) => {
    const viewportRef = useRef(null);
    const [displayScale, setDisplayScale] = useState(1);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        const updateScale = () => {
            if (viewportRef.current) {
                const parentWidth = viewportRef.current.parentElement.clientWidth;
                // Only scale down if the screen is smaller than the card
                if (parentWidth < 640) {
                    setDisplayScale(parentWidth / 640);
                } else {
                    setDisplayScale(1);
                }
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    if (!movie || !review) return null;

    const handleImageError = (e) => {
        setImageFailed(true);
        // High-fidelity cinematic fallback for 404s
        e.target.src = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=800";
    };

    // V5 Celestial Arch Palette
    const colors = {
        bg: '#010101',
        surface: '#080808',
        surfaceLight: '#121212',
        amber: '#fcd34d',
        amberDeep: '#b45309',
        white: '#ffffff',
        white10: 'rgba(255, 255, 255, 0.1)',
        white05: 'rgba(255, 255, 255, 0.05)',
        amberGlow: 'rgba(252, 211, 77, 0.15)',
        spectralGlow: 'linear-gradient(135deg, rgba(252, 211, 77, 0.2) 0%, rgba(0, 0, 0, 0) 60%)',
        glass: 'rgba(255, 255, 255, 0.02)',
        border: 'rgba(255, 255, 255, 0.08)'
    };

    const calculateDNATiers = () => {
        const aspects = review.aspects || {};
        const getAvg = (list) => {
            const scores = list.map(k => {
                const aspect = aspects[k];
                const s = typeof aspect === 'object' ? aspect?.score : aspect;
                return isFinite(s) ? parseFloat(s) : null;
            }).filter(v => v !== null);
            if (scores.length === 0) return '0.00';
            return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
        };

        return [
            { label: 'NARRATIVE', val: getAvg(['story', 'screenplay', 'originality', 'opening', 'climax']) },
            { label: 'EXECUTION', val: getAvg(['direction', 'acting', 'dialogues', 'thematic_depth']) },
            { label: 'VISUALS', val: getAvg(['cinematography', 'editing', 'production_design', 'vfx']) },
            { label: 'AUDIO', val: getAvg(['bg_score', 'music']) },
            { label: 'SOUL', val: getAvg(['pacing', 'emotional_impact', 'rewatch_value']) }
        ];
    };

    const dnaTiers = calculateDNATiers();

    const styles = {
        viewportGuard: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            padding: '20px 0'
        },
        scaler: {
            transform: `scale(${displayScale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
            width: '600px',
            height: '840px'
        },
        container: {
            width: '600px',
            height: '840px',
            backgroundColor: colors.bg,
            color: colors.white,
            borderRadius: '72px',
            border: `10px solid ${colors.surface}`,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Outfit', sans-serif",
            boxSizing: 'border-box',
            boxShadow: '0 50px 100px rgba(0,0,0,0.9)'
        },
        spectralOverlay: {
            position: 'absolute',
            inset: '0',
            background: colors.spectralGlow,
            pointerEvents: 'none',
            zIndex: '1'
        },
        gridOverlay: {
            position: 'absolute',
            inset: '0',
            backgroundImage: `radial-gradient(${colors.white05} 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            opacity: '0.5',
            pointerEvents: 'none',
            zIndex: '2'
        },
        header: {
            padding: '32px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${colors.white05}`,
            position: 'relative',
            zIndex: '10'
        },
        logoBox: {
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
        },
        logoOrb: {
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${colors.amber}, ${colors.amberDeep})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 32px ${colors.amberGlow}`
        },
        main: {
            flex: '1',
            padding: '40px 52px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: '10'
        },
        posterFrame: {
            width: '150px',
            height: '220px',
            borderRadius: '40px',
            overflow: 'hidden',
            border: `1px solid ${colors.amberDeep}`,
            boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
            marginBottom: '32px',
            background: colors.surface
        },
        dataRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '10px',
            fontWeight: '900',
            letterSpacing: '0.4em',
            color: colors.amber,
            marginBottom: '16px',
            opacity: '0.8'
        },
        title: {
            fontSize: '52px',
            fontWeight: '900',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: '0.85',
            margin: '0 0 24px 0',
            letterSpacing: '-0.06em',
            textTransform: 'uppercase',
            maxWidth: '500px'
        },
        summaryBox: {
            width: '100%',
            maxWidth: '440px',
            textAlign: 'center',
            marginBottom: '32px',
            position: 'relative'
        },
        summaryText: {
            fontSize: '15px',
            fontWeight: '400',
            fontStyle: 'italic',
            lineHeight: '1.6',
            color: 'rgba(255,255,255,0.7)',
            margin: '0'
        },
        dnaSection: {
            width: '100%',
            marginTop: 'auto'
        },
        dnaGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '12px'
        },
        dnaBarTrack: {
            height: '52px',
            width: '100%',
            borderRadius: '6px',
            background: colors.white05,
            border: `1px solid ${colors.white05}`,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
        },
        footer: {
            padding: '40px 48px 52px 48px',
            background: colors.surface,
            borderTop: `1px solid ${colors.white10}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: '10'
        }
    };

    return (
        <div ref={viewportRef} style={styles.viewportGuard}>
            <div style={styles.scaler}>
                <div ref={cardRef} data-sanctuary-card style={styles.container}>
                    <div style={styles.spectralOverlay} />
                    <div style={styles.gridOverlay} />

                    <div style={styles.header}>
                        <div style={styles.logoBox}>
                            <div style={styles.logoOrb}>
                                <Clapperboard size={24} style={{ color: colors.bg }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '14px', fontWeight: '900', margin: '0', fontStyle: 'italic' }}>SANCTUARY ARCHIVE</h2>
                                <p style={{ fontSize: '7px', fontWeight: '900', letterSpacing: '0.5em', margin: '0', color: colors.amber }}>DIVINE IMPRINT V5.0</p>
                            </div>
                        </div>
                        <div style={{ padding: '8px 18px', borderRadius: '99px', border: `1px solid ${colors.amberDeep}`, fontSize: '9px', fontWeight: '900', color: colors.amber, letterSpacing: '0.2em' }}>
                            {review.verdict?.toUpperCase() || 'CLASSIFIED'}
                        </div>
                    </div>

                    <div style={styles.main}>
                        <div style={styles.posterFrame}>
                            <img
                                src={imageFailed ? "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=800" : getProxyImageUrl(movie.poster)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt={movie.title}
                                crossOrigin="anonymous"
                                onError={handleImageError}
                            />
                        </div>

                        <div style={styles.dataRow}>
                            <span>{movie.year || '20XX'}</span>
                            <span style={{ opacity: '0.2' }}>•</span>
                            <span>{movie.runtime || '120 MIN'}</span>
                            <span style={{ opacity: '0.2' }}>•</span>
                            <span>{movie.genre?.split(',')[0].toUpperCase() || 'CLASSIC'}</span>
                        </div>

                        <h1 style={styles.title}>{movie.title}</h1>

                        <div style={{ width: '48px', height: '1.5px', background: colors.amber, marginBottom: '24px' }} />

                        {review.summary && review.summary !== '""' && (
                            <div style={styles.summaryBox}>
                                <p style={styles.summaryText}>{review.summary}</p>
                            </div>
                        )}

                        <div style={styles.dnaSection}>
                            <div style={styles.dnaGrid}>
                                {dnaTiers.map(tier => {
                                    const barHeight = Math.max(6, (parseFloat(tier.val) / 10) * 100);
                                    return (
                                        <div key={tier.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div style={styles.dnaBarTrack}>
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: `${barHeight}%`,
                                                        background: `linear-gradient(to top, ${colors.amberDeep}, ${colors.amber})`,
                                                        boxShadow: `0 0 20px ${colors.amberGlow}`,
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '1px', background: '#fff', opacity: '0.4' }} />
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '5.5px', fontWeight: '900', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', margin: '0' }}>{tier.label}</p>
                                            <p style={{ fontSize: '11px', fontWeight: '900', color: colors.amber, margin: '0' }}>{tier.val}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div style={styles.footer}>
                        <div>
                            <p style={{ fontSize: '7px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '4px' }}>Architect</p>
                            <p style={{ fontSize: '14px', fontWeight: '800', color: '#fff', margin: '0' }}>{movie.director?.toUpperCase() || 'VISIONARY'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <p style={{ fontSize: '7px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Sanctuary Score</p>
                                
                                {/* Status Tags UI */}
                                {review.overall_rating?.flags && (
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                        {review.overall_rating.flags.isCapped && (
                                            <span style={{ fontSize: '5px', fontWeight: '900', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '1px 4px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(239,68,68,0.2)' }}>Narrative Capped</span>
                                        )}
                                        {review.overall_rating.flags.isLegendary && (
                                            <span style={{ fontSize: '5px', fontWeight: '900', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '1px 4px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(245,158,11,0.2)' }}>Legendary State</span>
                                        )}
                                        {review.overall_rating.flags.isElite && (
                                            <span style={{ fontSize: '5px', fontWeight: '900', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', padding: '1px 4px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(168,85,247,0.2)' }}>Elite Synergy</span>
                                        )}
                                        {review.overall_rating.flags.isTranscendent && (
                                            <span style={{ fontSize: '5px', fontWeight: '900', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '1px 4px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(6,182,212,0.2)' }}>Transcendent Synergy</span>
                                        )}
                                        {review.overall_rating.flags.mercyActive && (
                                            <span style={{ fontSize: '5px', fontWeight: '900', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '1px 4px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(59,130,246,0.2)' }}>Mercy Applied</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Star size={18} style={{ color: colors.amber, fill: colors.amber }} />
                                <span style={{ fontSize: '38px', fontWeight: '900', fontStyle: 'italic', lineHeight: '1' }}>
                                    {typeof review.overall_rating === 'object' ? review.overall_rating.score.toFixed(2) : (parseFloat(review.overall_rating) || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(SanctuaryCard);
