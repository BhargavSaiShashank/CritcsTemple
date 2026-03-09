import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { API_URL } from '../services/api';
import axios from 'axios';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';

const TypeWriter = ({ text, speed = 20, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text.charAt(index));
                setIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timeout);
        } else {
            onComplete?.();
        }
    }, [index, text, speed, onComplete]);

    return <span>{displayedText}</span>;
};

const CeremonyOracle = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { role: 'oracle', content: "Welcome, Seeker. I am the Mystic. What cinematic enlightenment do you seek within the Temple today?", isNew: false }
    ]);
    const [persona, setPersona] = useState('mystic');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async () => {
        if (!query.trim() || loading) return;

        const userMsg = { role: 'user', content: query, isNew: false };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            // Include message history in the query (last 10 messages for context)
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const { data } = await axios.post(`${API_URL}/oracle/query`, {
                query,
                history,
                persona
            });

            const content = data.response;
            let dnaData = null;

            // Robust Prophetic DNA Extraction
            if (content.includes('PROPHETIC_DNA:')) {
                try {
                    const parts = content.split('PROPHETIC_DNA:');
                    const jsonPart = parts[1].trim();
                    // Match the first JSON object block to avoid trailing text issues
                    const jsonMatch = jsonPart.match(/\{[\s\S]*?\}/);
                    if (jsonMatch) {
                        dnaData = JSON.parse(jsonMatch[0]);
                    }
                } catch (e) {
                    console.error("DNA Parsing Error", e);
                }
            }

            setMessages(prev => [...prev, {
                role: 'oracle',
                content: content.split('PROPHETIC_DNA:')[0].trim(),
                isNew: true,
                propheticDNA: dnaData
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'oracle', content: 'The winds of fate are turbulent. I cannot see clearly right now.', isNew: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Oracle Eye Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: window.innerWidth < 768 ? '20px' : '30px',
                    right: window.innerWidth < 768 ? '20px' : '30px',
                    width: window.innerWidth < 768 ? '52px' : '64px',
                    height: window.innerWidth < 768 ? '52px' : '64px',
                    borderRadius: '50%',
                    background: persona === 'mystic' ? 'linear-gradient(135deg, #f5a623 0%, #d97706 100%)' :
                        persona === 'scholar' ? 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)' :
                            'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 40px rgba(245,166,35,0.4), inset 0 0 15px rgba(255,255,255,0.3)',
                    zIndex: 1000,
                    cursor: 'pointer',
                    border: 'none',
                }}
            >
                <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '1px solid rgba(245,166,35,0.3)', animation: 'pulse-ring 2s infinite' }} />
                <Sparkles size={28} />

                <style>{`
@keyframes pulse - ring {
    0 % { transform: scale(0.95); opacity: 0.8; }
    50 % { transform: scale(1.1); opacity: 0.4; }
    100 % { transform: scale(0.95); opacity: 0.8; }
}
`}</style>
            </motion.button>

            {/* Oracle Chat Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1001 }}
                        />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                right: 0,
                                bottom: 0,
                                width: 'min(400px, 100vw)',
                                background: 'rgba(12,12,12,0.98)',
                                backdropFilter: 'blur(30px)',
                                borderLeft: `1px solid ${persona === 'mystic' ? 'rgba(245,166,35,0.2)' : persona === 'scholar' ? 'rgba(96,165,250,0.2)' : 'rgba(239,68,68,0.2)'} `,
                                display: 'flex',
                                flexDirection: 'column',
                                zIndex: 1002,
                                boxShadow: '-20px 0 50px rgba(0,0,0,0.5)',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '24px',
                                paddingTop: 'calc(24px + var(--safe-top))',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: persona === 'mystic' ? 'rgba(245,166,35,0.1)' : persona === 'scholar' ? 'rgba(96,165,250,0.1)' : 'rgba(239,68,68,0.1)',
                                        border: `1px solid ${persona === 'mystic' ? 'rgba(245,166,35,0.2)' : persona === 'scholar' ? 'rgba(96,165,250,0.2)' : 'rgba(239,68,68,0.2)'} `,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Sparkles size={18} color={persona === 'mystic' ? '#f5a623' : persona === 'scholar' ? '#60a5fa' : '#ef4444'} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <select
                                            value={persona}
                                            onChange={(e) => setPersona(e.target.value)}
                                            style={{
                                                background: 'none', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 800,
                                                outline: 'none', cursor: 'pointer', padding: 0, margin: 0, appearance: 'none',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            <option value="mystic" style={{ background: '#111' }}>The Mystic</option>
                                            <option value="scholar" style={{ background: '#111' }}>The Scholar</option>
                                            <option value="critic" style={{ background: '#111' }}>The Critic</option>
                                        </select>
                                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            {persona === 'mystic' ? 'Guardian of Lore' : persona === 'scholar' ? 'Archivist of Craft' : 'Ruthless Evaluator'}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '8px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div
                                ref={scrollRef}
                                style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                            >
                                {messages.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        }}
                                    >
                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: m.role === 'user' ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${m.role === 'user' ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.06)'} `,
                                            fontSize: '14px',
                                            lineHeight: 1.6,
                                            color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,0.8)',
                                            fontStyle: m.role === 'oracle' ? 'italic' : 'normal',
                                        }}>
                                            {m.role === 'oracle' && m.isNew ? (
                                                <TypeWriter
                                                    text={m.content}
                                                    onComplete={() => {
                                                        const newMsgs = [...messages];
                                                        newMsgs[i].isNew = false;
                                                        setMessages(newMsgs);
                                                    }}
                                                />
                                            ) : m.content}

                                            {/* Prophetic DNA Radar Chart */}
                                            {m.propheticDNA && (
                                                <div style={{ marginTop: '16px', height: '240px', width: '100%', minHeight: '240px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px', position: 'relative', display: 'block' }}>
                                                    <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prophetic DNA Projection</div>
                                                    <div style={{ position: 'absolute', inset: '40px 12px 12px 12px' }}>
                                                        <ResponsiveContainer width="99%" height="99%" minHeight={180}>
                                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={Object.entries(m.propheticDNA).map(([k, v]) => ({ subject: k.toUpperCase(), A: v }))}>
                                                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8 }} />
                                                                <Tooltip
                                                                    content={({ active, payload }) => {
                                                                        if (active && payload && payload.length) {
                                                                            const data = payload[0].payload;
                                                                            const color = persona === 'mystic' ? '#f5a623' : persona === 'scholar' ? '#60a5fa' : '#ef4444';
                                                                            return (
                                                                                <div style={{
                                                                                    background: 'rgba(15, 15, 15, 0.9)',
                                                                                    backdropFilter: 'blur(8px)',
                                                                                    border: `1px solid ${color} 40`,
                                                                                    padding: '8px 12px',
                                                                                    borderRadius: '8px',
                                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                                                    display: 'flex',
                                                                                    flexDirection: 'column',
                                                                                    gap: '2px'
                                                                                }}>
                                                                                    <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{data.subject}</div>
                                                                                    <div style={{ fontSize: '16px', fontWeight: 900, color: color, fontFamily: 'serif' }}>{data.A.toFixed(1)}</div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    }}
                                                                />
                                                                <Radar name="DNA" dataKey="A" stroke={persona === 'mystic' ? '#f5a623' : persona === 'scholar' ? '#60a5fa' : '#ef4444'} fill={persona === 'mystic' ? '#f5a623' : persona === 'scholar' ? '#60a5fa' : '#ef4444'} fillOpacity={0.6} />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: '18px' }}>
                                        <Loader2 size={16} className="animate-spin" color="rgba(245,166,35,0.5)" />
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div style={{
                                padding: '24px',
                                paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(10,10,10,0.5)'
                            }}>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Channel your query..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '12px',
                                            padding: '12px 48px 12px 16px',
                                            fontSize: '13px',
                                            color: '#fff',
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={loading || !query.trim()}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            background: query.trim() ? '#f5a623' : 'rgba(245,166,35,0.1)',
                                            border: 'none',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            color: query.trim() ? '#000' : 'rgba(255,255,255,0.2)',
                                            display: 'flex',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                                <div style={{ fontSize: '9px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', marginTop: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Powered by Groq High-Resonance Intelligence
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default CeremonyOracle;
