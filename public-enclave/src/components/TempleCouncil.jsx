import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Target, Library, Loader2, Quote, Activity, Award } from 'lucide-react';
import { getOracleDebate } from '../services/api';

const TypewriterText = ({ text, delay = 0.05, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let currentText = '';
        let index = 0;
        const interval = setInterval(() => {
            currentText += text[index];
            setDisplayedText(currentText);
            index++;
            if (index >= text.length) {
                clearInterval(interval);
                onComplete?.();
            }
        }, delay * 1000);
        return () => clearInterval(interval);
    }, [text]);

    return <span>{displayedText}</span>;
};

const DomainGauge = ({ score, color, label }) => {
    const n = parseFloat(score) || 0;
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (n / 10) * circumference;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <motion.circle
                        cx="28" cy="28" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
                        strokeLinecap="round"
                    />
                </svg>
                <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 900, color: color }}>{n.toFixed(2)}</span>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        </div>
    );
};

const PersonaCard = ({ name, rawContent, icon: Icon, color, delay, isActive, onHover }) => {
    const { score, label, text } = useMemo(() => {
        if (!rawContent) return { score: 0, label: 'Verdict', text: '' };

        const cleanRaw = rawContent.replace(/\*\*/g, '');

        // 1. Primary Strategy: Look for the Pipe '|' Delimiter
        const pipeMatch = cleanRaw.match(/^([^:|]+):\s*\[?([\d.]+)\/10\]?\s*\|\s*(.*)$/s);

        if (pipeMatch) {
            return {
                label: pipeMatch[1].trim(),
                score: parseFloat(pipeMatch[2]),
                text: pipeMatch[3].trim()
            };
        }

        // 2. Fallback: Flexible match for missing pipe
        const flexMatch = cleanRaw.match(/^([^:]+):\s*\[?([\d.]+)(?:\/10)?\]?\.?\s*(.*)$/s);
        if (flexMatch) {
            return {
                label: flexMatch[1].trim(),
                score: parseFloat(flexMatch[2]),
                text: flexMatch[3].trim()
            };
        }

        return { label: 'Verdict', score: 0, text: cleanRaw };
    }, [rawContent]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay }}
            onMouseEnter={onHover}
            style={{
                background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isActive ? color : color + '20'}`,
                borderRadius: '32px',
                padding: '32px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                boxShadow: isActive ? `0 0 40px ${color}15` : 'none',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                flex: 1,
                minWidth: '300px',
                minHeight: '420px',
                cursor: 'pointer',
                translateY: isActive ? '-5px' : '0px'
            }}
        >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${color}15, transparent 70%)`, pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '14px', background: `${color}15`, border: `1px solid ${color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isActive ? `0 0 20px ${color}30` : 'none'
                    }}>
                        <Icon size={20} color={color} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '15.5px', fontWeight: 900, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>{name}</h3>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                            {name.includes('Formalist') ? 'Technical Architect' : name.includes('Surrealist') ? 'Keeper of Atmosphere' : 'Archival Guardian'}
                        </span>
                    </div>
                </div>
                <DomainGauge
                    score={score}
                    color={color}
                    label={label === 'Verdict' || label === 'Rating' ? (name.includes('Formalist') ? 'TECHNICAL' : name.includes('Surrealist') ? 'ATMOSPHERIC' : 'ARCHIVAL') : label.split(' ')[0]}
                />
            </div>

            <div className="custom-scrollbar" style={{
                position: 'relative',
                zIndex: 1,
                flex: 1,
                overflowY: 'auto',
                paddingRight: '8px',
                maskImage: 'linear-gradient(to bottom, black 92%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 92%, transparent 100%)'
            }}>
                <Quote size={18} style={{ opacity: 0.1, color: color, marginBottom: '12px' }} />
                <p style={{
                    fontSize: '14px', lineHeight: 1.8, color: 'rgba(255, 255, 255, 0.75)',
                    fontStyle: 'italic', fontWeight: 300, margin: 0,
                    letterSpacing: '0.01em'
                }}>
                    {isActive ? (
                        <TypewriterText text={text} delay={0.018} />
                    ) : (
                        text
                    )}
                </p>
            </div>

            {isActive && (
                <motion.div
                    layoutId="aura"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ position: 'absolute', inset: 0, border: `2px solid ${color}`, borderRadius: '32px', pointerEvents: 'none' }}
                />
            )}
        </motion.div>
    );
};

const TempleCouncil = ({ slug, isOpen, onClose, movieTitle }) => {
    const [responses, setResponses] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activePersona, setActivePersona] = useState(0); // 0, 1, 2

    useEffect(() => {
        if (isOpen && slug) {
            setLoading(true);
            setResponses(null);
            setError(false);
            setActivePersona(0);

            getOracleDebate(slug)
                .then(({ data }) => {
                    setResponses(data);
                })
                .catch(err => {
                    console.error("Council summoning failed:", err);
                    setError(true);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, slug]);

    const councilAverage = useMemo(() => {
        if (!responses) return 0;
        const scores = Object.values(responses).map(raw => {
            if (!raw) return 0;
            const cleanRaw = raw.replace(/\*\*/g, '');
            // Match pipe or bracketed score
            const match = cleanRaw.match(/\[?([\d.]+)(?:\/10)?\]?\s*\|/) || cleanRaw.match(/:\s*\[?([\d.]+)\/10\]?/);
            return match ? parseFloat(match[1]) : 0;
        });
        const validScores = scores.filter(s => s > 0);
        return validScores.length === 0 ? 0 : validScores.reduce((a, b) => a + b, 0) / validScores.length;
    }, [responses]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.95)',
                            backdropFilter: 'blur(20px)', zIndex: 10000
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.95, y: 50, x: '-50%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: '4vh',
                            left: '50%',
                            width: 'min(1240px, 95vw)',
                            height: '92vh',
                            background: '#040404',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '48px',
                            padding: 'clamp(24px, 4vw, 56px)',
                            zIndex: 10001,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '32px',
                            boxShadow: '0 50px 150px rgba(0,0,0,0.9), 0 0 80px rgba(245,166,35,0.05)',
                        }}
                    >
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: '32px', right: '40px', background: 'rgba(255,255,255,0.05)',
                                border: 'none', color: 'rgba(255,255,255,0.4)', padding: '12px', borderRadius: '50%',
                                cursor: 'pointer', transition: 'all 0.2s', zIndex: 10
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <motion.div
                                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 24px', borderRadius: '99px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', marginBottom: '20px' }}>
                                <Award size={14} color="#f5a623" />
                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#f5a623', letterSpacing: '0.25em', textTransform: 'uppercase' }}>High Altar of Interpretation</span>
                            </motion.div>
                            <h2 className="display" style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 900, color: '#fff', margin: '0 0 12px 0', letterSpacing: '-0.03em' }}>
                                Council of <span style={{ color: '#f5a623' }}>Eternal Truth</span>
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                                You stand before the keepers. They have examined <span style={{ color: '#fff', fontWeight: 700 }}>{movieTitle}</span>.
                            </p>
                        </div>

                        {loading ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                                <motion.div
                                    animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid rgba(245,166,35,0.05)', borderTop: '2px solid #f5a623', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Sparkles size={32} color="#f5a623" />
                                </motion.div>
                                <p style={{ fontSize: '12px', fontWeight: 900, color: 'rgba(245,166,35,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Synchronizing with the Archive...</p>
                            </div>
                        ) : error ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <Activity size={48} color="rgba(239,68,68,0.5)" style={{ marginBottom: '24px' }} />
                                <p style={{ color: 'rgba(239,68,68,0.8)', fontSize: '16px', fontWeight: 600 }}>The Oracle is silent. The connection to the vault has severed.</p>
                                <button onClick={() => window.location.reload()} style={{ marginTop: '24px', background: '#fff', color: '#000', padding: '12px 32px', borderRadius: '16px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Restore Connection</button>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                    gap: '24px',
                                    flex: 1,
                                    width: '100%'
                                }}>
                                    <PersonaCard
                                        name="The Formalist"
                                        rawContent={responses.formalist}
                                        icon={Target} color="#60a5fa" delay={0.2}
                                        isActive={activePersona === 0}
                                        onHover={() => setActivePersona(0)}
                                    />
                                    <PersonaCard
                                        name="The Surrealist"
                                        rawContent={responses.surrealist}
                                        icon={Sparkles} color="#f472b6" delay={0.4}
                                        isActive={activePersona === 1}
                                        onHover={() => setActivePersona(1)}
                                    />
                                    <PersonaCard
                                        name="The Historian"
                                        rawContent={responses.historian}
                                        icon={Library} color="#f5a623" delay={0.6}
                                        isActive={activePersona === 2}
                                        onHover={() => setActivePersona(2)}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
                                    {[0, 1, 2].map(idx => (
                                        <button
                                            key={idx}
                                            onClick={() => setActivePersona(idx)}
                                            style={{
                                                width: activePersona === idx ? '32px' : '12px',
                                                height: '6px',
                                                borderRadius: '3px',
                                                background: activePersona === idx ? '#f5a623' : 'rgba(255,255,255,0.1)',
                                                border: 'none', cursor: 'pointer', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        />
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.5 }}
                                    style={{
                                        flexShrink: 0,
                                        padding: '32px 48px',
                                        borderRadius: '32px',
                                        background: 'linear-gradient(90deg, rgba(245,166,35,0.08), rgba(245,166,35,0.02))',
                                        border: '1px solid rgba(245,166,35,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginTop: 'auto',
                                        boxShadow: '0 -20px 40px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Sparkles size={24} color="#f5a623" />
                                        </motion.div>
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: 900, color: '#f5a623', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '4px' }}>Collective Consensus</div>
                                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>Verdict of the High Keepers</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                        <motion.span
                                            animate={{ opacity: [0.8, 1, 0.8] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{ fontSize: '56px', fontWeight: 950, color: '#f5a623', fontFamily: 'serif', fontStyle: 'italic', lineHeight: 1 }}
                                        >
                                            {councilAverage.toFixed(2)}
                                        </motion.span>
                                        <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.2)', fontWeight: 800 }}> / 10</span>
                                    </div>
                                </motion.div>
                            </>
                        )}

                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
                        `}</style>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TempleCouncil;
