import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Dice5, ChevronRight, Star } from 'lucide-react';
import { getLatestReviews, proxyImage } from '../services/api';
import { Link } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { getVerdictFromScore } from '../utils/verdict';

const VERDICT_COLOR = {
    Legendary: '#FFFFFF', Masterpiece: '#FFD700', Essential: '#FF00EA',
    Elite: '#9D00FF', Great: '#00FF44', Good: '#8FFF00',
    Decent: '#00D0FF', Average: '#849BB3', Mediocre: '#FFFB00',
    Poor: '#FF9100', Bad: '#FF4D00', Terrible: '#FF0000',
    Disaster: '#990000', Abomination: '#2D0000'
};

export default function SurpriseOracle() {
    const [allMeta, setAllMeta] = useState([]);
    const [selected, setSelected] = useState(null);
    const [isRevealing, setIsRevealing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch a large sample for maximum variety in the randomizer
        getLatestReviews(500, 0, '', 'All', 'All', 'date', 'desc')
            .then(({ data }) => {
                if (data) setAllMeta(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const triggerOracle = async () => {
        if (allMeta.length === 0) return;
        
        // Haptic Feedback
        if (Capacitor.isNativePlatform()) {
            try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch (e) {}
        }

        setIsRevealing(true);
        setSelected(null);

        // Dramatic pause for the "ritual"
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * allMeta.length);
            setSelected(allMeta[randomIndex]);
            setIsRevealing(false);
        }, 800);
    };

    const derivedVerdict = selected ? getVerdictFromScore(selected.overall_rating || 0) : null;
    const accentColor = derivedVerdict ? VERDICT_COLOR[derivedVerdict] : '#f5a623';

    return (
        <section style={{ 
            padding: '40px 0', 
            background: 'linear-gradient(to bottom, transparent, rgba(245,166,35,0.03), transparent)',
            margin: '20px 0',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div className="max-w-container" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 16px',
                            borderRadius: '99px',
                            background: 'rgba(245,166,35,0.08)',
                            border: '1px solid rgba(245,166,35,0.15)',
                            marginBottom: '16px'
                        }}
                    >
                        <Sparkles size={12} color="#f5a623" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#f5a623', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            The Sanctuary Oracle
                        </span>
                    </motion.div>
                    
                    <h2 style={{ 
                        fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', 
                        fontWeight: 900, 
                        color: '#fff', 
                        letterSpacing: '-0.03em',
                        marginBottom: '24px'
                    }}>
                        Stuck in the Archives?
                    </h2>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={triggerOracle}
                        disabled={loading}
                        style={{
                            padding: '16px 32px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #f5a623 0%, #c47a0a 100%)',
                            color: '#000',
                            fontSize: '14px',
                            fontWeight: 900,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 30px rgba(245,166,35,0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        <Dice5 size={18} />
                        {selected ? 'Shuffle Again' : 'Surprise Me'}
                    </motion.button>
                </div>

                <AnimatePresence mode="wait">
                    {isRevealing && (
                        <motion.div
                            key="oracle-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ textAlign: 'center', padding: '40px' }}
                        >
                            <div style={{
                                width: '40px', height: '40px',
                                border: '3px solid rgba(245,166,35,0.1)',
                                borderTopColor: '#f5a623',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                margin: '0 auto 16px auto'
                            }} />
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                Consulting the Ancient Scrolls...
                            </p>
                        </motion.div>
                    )}

                    {!isRevealing && selected && (
                        <motion.div
                            key={selected._id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            style={{ 
                                maxWidth: '600px', 
                                margin: '0 auto',
                                position: 'relative',
                                display: 'flex',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                padding: '20px',
                                gap: '24px',
                                boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 40px ${accentColor}10`
                            }}
                        >
                            {/* Aura Glow */}
                            <div style={{
                                position: 'absolute', inset: 0, 
                                background: `radial-gradient(circle at center, ${accentColor}08, transparent 70%)`,
                                pointerEvents: 'none'
                            }} />

                            {/* Card Poster */}
                            <div style={{ flexShrink: 0, width: '140px', aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                <img 
                                    src={selected.movie_poster_url} 
                                    alt={selected.movie_title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            </div>

                            {/* Content */}
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, textAlign: 'left' }}>
                                <div style={{ 
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    color: accentColor, fontSize: '10px', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                    marginBottom: '8px'
                                }}>
                                    <Star size={12} fill={accentColor} />
                                    {derivedVerdict} Recommendation
                                </div>
                                <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '8px', lineHeight: 1.1 }}>
                                    {selected.movie_title}
                                </h3>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {selected.summary || "This archive holds secrets waiting to be unearthed. Experience the ritual of this cinematic masterpiece."}
                                </p>
                                <Link 
                                    to={`/review/${selected.slug}`}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        fontSize: '13px', fontWeight: 800, color: '#f5a623',
                                        textDecoration: 'none'
                                    }}
                                >
                                    Experience the Ritual <ChevronRight size={14} strokeWidth={3} />
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
