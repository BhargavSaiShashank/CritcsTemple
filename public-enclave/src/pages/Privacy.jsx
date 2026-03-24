import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Lock, Eye, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Privacy() {
    return (
        <div style={{ background: '#080808', minHeight: '100vh', padding: '120px 0 80px' }}>
            <Helmet>
                <title>Privacy Policy - Critic's Temple</title>
            </Helmet>
            
            <div className="max-w-container">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ maxWidth: '800px', margin: '0 auto' }}
                >
                    <header style={{ marginBottom: '60px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(255,215,0,0.1)', borderRadius: '16px', marginBottom: '20px' }}>
                            <Shield size={32} color="#FFD700" />
                        </div>
                        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' }}>
                            Privacy & Data Protocol
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Last Synchronized: March 24, 2026
                        </p>
                    </header>

                    <section style={{ display: 'grid', gap: '40px' }}>
                        <PrivacySection 
                            icon={<Lock size={20} />}
                            title="Authentication"
                            content="We use Google Firebase for authentication. Your email and basic profile info are used strictly to identify your reviews and predictions. We do not sell your personal identifier to third-party data harvesters."
                        />
                        <PrivacySection 
                            icon={<Database size={20} />}
                            title="Data Storage"
                            content="Your reviews, ratings, and predictions are stored securely in our database. This data is used to generate the global analytics and 'must-watch' recommendations that define our platform."
                        />
                        <PrivacySection 
                            icon={<Eye size={20} />}
                            title="Visibility"
                            content="By default, your reviews and predictions are public as part of the cinematic record. If you wish to delete your imprints, you may do so at any time through your profile settings (coming soon to mobile)."
                        />
                    </section>
                </motion.div>
            </div>
        </div>
    );
}

function PrivacySection({ icon, title, content }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#FFD700' }}>
                {icon}
                <h2 style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontSize: '15px' }}>
                {content}
            </p>
        </div>
    );
}
