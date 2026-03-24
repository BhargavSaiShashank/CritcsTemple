import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Shield, ChevronRight, X } from 'lucide-react';

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasOnboarded = localStorage.getItem('sanctuary_onboarded');
        if (!hasOnboarded) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const completeOnboarding = () => {
        localStorage.setItem('sanctuary_onboarded', 'true');
        setIsVisible(false);
    };

    const steps = [
        {
            icon: <Star size={40} color="#FFD700" />,
            title: "The Final Verdict",
            description: "We don't just rate movies. We conduct deep cinematic imprints across 22 distinct technical aspects."
        },
        {
            icon: <Zap size={40} color="#f5a623" />,
            title: "Weighted Algorithm",
            description: "Narrative (19%), Direction (19%), Acting (17%), Visuals (15%), Music (15%), and Soul (15%) combine for a clinical score."
        },
        {
            icon: <Shield size={40} color="#7dd3fc" />,
            title: "Profound Archives",
            description: "Enter the hall of fame, compare structural DNA, and witness the evolution of cinema through our data-driven lens."
        }
    ];

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.92)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}
            >
                <div style={{ maxWidth: '440px', width: '100%', position: 'relative' }}>
                    <button 
                        onClick={completeOnboarding}
                        style={{ position: 'absolute', top: '-48px', right: '0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1, y: -20 }}
                            transition={{ duration: 0.4 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ display: 'inline-flex', marginBottom: '32px', filter: 'drop-shadow(0 0 20px rgba(245,166,35,0.3))' }}>
                                {steps[step].icon}
                            </div>
                            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' }}>
                                {steps[step].title}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px' }}>
                                {steps[step].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {steps.map((_, i) => (
                                <div 
                                    key={i} 
                                    style={{ 
                                        width: i === step ? '24px' : '8px', 
                                        height: '4px', 
                                        borderRadius: '2px', 
                                        background: i === step ? '#f5a623' : 'rgba(255,255,255,0.1)',
                                        transition: 'all 0.3s ease'
                                    }} 
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => step < steps.length - 1 ? setStep(step + 1) : completeOnboarding()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#f5a623',
                                color: '#000',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {step === steps.length - 1 ? "ENTER TEMPLE" : "CONTINUE"} <ChevronRight size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
