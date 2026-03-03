import React, { memo } from 'react';

// Use React.memo to prevent unnecessary re-renders when parent states (like mouse position) change
const BackgroundAtmosphere = memo(({ activeColor = '#f5a623', secondaryColor = null }) => {
    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, overflow: 'hidden' }}>
            {/* 
                Left/Top-left ambient glow (Contender 1)
            */}
            <div
                style={{
                    position: 'absolute',
                    top: '-15%',
                    left: '-10%',
                    width: secondaryColor ? '60%' : '80%',
                    height: '80%',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, var(--accent-glow, ${activeColor}08) 0%, transparent 70%)`,
                    transition: 'all 1.5s ease-in-out',
                    filter: 'blur(60px)',
                }}
            />

            {/* 
                Right/Bottom-right ambient glow (Contender 2)
            */}
            <div
                style={{
                    position: 'absolute',
                    bottom: secondaryColor ? '-10%' : '-20%',
                    right: '-10%',
                    width: secondaryColor ? '60%' : '70%',
                    height: '70%',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, var(--accent-glow, ${secondaryColor || activeColor}05) 0%, transparent 70%)`,
                    transition: 'all 2s ease-in-out',
                    filter: 'blur(80px)',
                    transitionDelay: '0.2s'
                }}
            />

            {/* 
                LIGHTEST NOISE OVERLAY:
                Using a very simple repeating pattern instead of complex SVG filters.
                This significantly reduces paint times during scroll.
            */}
            <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.015,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                pointerEvents: 'none',
                mixBlendMode: 'overlay'
            }} />
        </div>
    );
});

export default BackgroundAtmosphere;
