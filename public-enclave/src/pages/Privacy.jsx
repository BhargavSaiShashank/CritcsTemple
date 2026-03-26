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
                            content="We use Google Firebase for biometric and credentialed authentication. Your temporal identity (email) is used strictly to anchor your reviews and projections within the Sanctuary ecosystem. We do not sell your personal identifier to third-party data harvesters."
                        />
                        <PrivacySection 
                            icon={<Database size={20} />}
                            title="Sanctuary Storage"
                            content="Your imprints, ratings, and bias simulations are stored securely. This data feeds our proprietary V8.0 Sanctuary Protocol—generating the global analytics and 'Elite' recommendations that define our platform's critical hierarchy."
                        />
                        <PrivacySection 
                            icon={<Eye size={20} />}
                            title="Visibility & Imprints"
                            content="By default, your cinematic imprints are public as part of the permanent record. Under the Sanctuary Protocol, you retain the right to expunge your data at any time through your profile settings (accessible on mobile)."
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
