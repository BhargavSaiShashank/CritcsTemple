import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BookOpen, Scale, MessageSquare, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Guidelines() {
    return (
        <div style={{ background: '#080808', minHeight: '100vh', padding: '120px 0 80px' }}>
            <Helmet>
                <title>Community Guidelines - Critic's Temple</title>
            </Helmet>
            
            <div className="max-w-container">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ maxWidth: '800px', margin: '0 auto' }}
                >
                    <header style={{ marginBottom: '60px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(255,215,0,0.1)', borderRadius: '16px', marginBottom: '20px' }}>
                            <Scale size={32} color="#FFD700" />
                        </div>
                        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' }}>
                            The Critic's Code
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Maintaining Atmospheric Integrity
                        </p>
                    </header>

                    <section style={{ display: 'grid', gap: '32px' }}>
                        <Rule 
                            icon={<MessageSquare size={18} />}
                            title="01. Objective Subjectivity"
                            content="Critique the art, not the person. We encourage deep analysis and harsh truth, provided it remains focused on the cinematic craft."
                        />
                        <Rule 
                            icon={<BookOpen size={18} />}
                            title="02. Spoilers Protocol"
                            content="Respect the temporal experience of others. Use spoiler warnings for any critical plot unravellings in your imprints."
                        />
                        <Rule 
                            icon={<AlertTriangle size={18} />}
                            title="03. No Defilement"
                            content="Hate speech, harassment, or non-cinematic spam will result in a permanent expulsion from The Temple."
                        />
                    </section>
                </motion.div>
            </div>
        </div>
    );
}

function Rule({ icon, title, content }) {
    return (
        <div style={{ borderLeft: '2px solid #FFD700', paddingLeft: '24px', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#fff' }}>
                <span style={{ color: '#FFD700' }}>{icon}</span>
                <h2 style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontSize: '14px' }}>
                {content}
            </p>
        </div>
    );
}
