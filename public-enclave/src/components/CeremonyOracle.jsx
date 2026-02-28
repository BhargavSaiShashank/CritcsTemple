import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, MessageSquare, Loader2 } from 'lucide-react';
import { API_URL } from '../services/api';
import axios from 'axios';

const CeremonyOracle = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { role: 'oracle', content: 'Approach, Seeker. What knowledge do you desire from the Sanctuary archives?' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!query.trim() || loading) return;

        const userMsg = { role: 'user', content: query };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${API_URL}/oracle/query`, { query });
            setMessages(prev => [...prev, { role: 'oracle', content: data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'oracle', content: 'The winds of fate are turbulent. I cannot see clearly right now.' }]);
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
                    bottom: '30px',
                    right: '30px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f5a623 0%, #d97706 100%)',
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
                    @keyframes pulse-ring {
                        0% { transform: scale(0.95); opacity: 0.8; }
                        50% { transform: scale(1.1); opacity: 0.4; }
                        100% { transform: scale(0.95); opacity: 0.8; }
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
                                background: 'rgba(12,12,12,0.95)',
                                backdropFilter: 'blur(20px)',
                                borderLeft: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                zIndex: 1002,
                                boxShadow: '-20px 0 50px rgba(0,0,0,0.5)',
                            }}
                        >
                            {/* Header */}
                            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Sparkles size={18} color="#f5a623" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#f2f2f2', letterSpacing: '0.02em' }}>The Cinematic Oracle</div>
                                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(245,166,35,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Guardian of Lore</div>
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
                                            border: `1px solid ${m.role === 'user' ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                            fontSize: '14px',
                                            lineHeight: 1.6,
                                            color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,0.8)',
                                            fontStyle: m.role === 'oracle' ? 'italic' : 'normal',
                                        }}>
                                            {m.content}
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
                            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,10,0.5)' }}>
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
