import React from 'react';
import { motion } from 'framer-motion';

const BackgroundAtmosphere = ({ activeColor = '#f5a623' }) => {
    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            {/* Subtle ambient glow top-left */}
            <motion.div
                animate={{
                    background: `radial-gradient(circle, ${activeColor}08 0%, transparent 70%)`
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-5%',
                    width: '70%',
                    height: '70%',
                    borderRadius: '50%',
                }}
            />

            {/* Subtle ambient glow bottom-right */}
            <motion.div
                animate={{
                    background: `radial-gradient(circle, ${activeColor}05 0%, transparent 70%)`
                }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
                style={{
                    position: 'absolute',
                    bottom: '-15%',
                    right: '-5%',
                    width: '60%',
                    height: '60%',
                    borderRadius: '50%',
                }}
            />

            {/* Global grain/noise overlay for texture */}
            <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.02,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                pointerEvents: 'none'
            }} />
        </div>
    );
};

export default BackgroundAtmosphere;
