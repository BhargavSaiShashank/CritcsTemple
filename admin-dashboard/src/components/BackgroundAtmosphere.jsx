import React, { useEffect, useState } from 'react';
import ColorThief from 'colorthief';
import { getProxyImageUrl } from '../services/api';

const BackgroundAtmosphere = ({ imageUrl }) => {
    const [colors, setColors] = useState(['#fbbf24', '#0c0c0c']); // Default amber/black

    useEffect(() => {
        if (!imageUrl || imageUrl === 'N/A') {
            setColors(['#fbbf24', '#0c0c0c']);
            return;
        }
        
        const proxiedUrl = getProxyImageUrl(imageUrl);
        if (!proxiedUrl) return;

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = proxiedUrl;

        img.onload = () => {
            try {
                const colorThief = new ColorThief();
                const palette = colorThief.getPalette(img, 5); // Get more colors for better blending
                if (palette && palette.length > 0) {
                    const hexColors = palette.map(rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
                    setColors(hexColors);
                    
                    // Inject dominant color into root for wider UI tinting
                    const dominant = palette[0];
                    document.documentElement.style.setProperty('--accent-movie', `rgb(${dominant[0]}, ${dominant[1]}, ${dominant[2]})`);
                    document.documentElement.style.setProperty('--accent-movie-muted', `rgba(${dominant[0]}, ${dominant[1]}, ${dominant[2]}, 0.3)`);
                }
            } catch (err) {
                console.error("Color extraction failed:", err);
            }
        };
    }, [imageUrl]);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Primary Glow */}
            <div
                className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] rounded-full blur-[160px] opacity-[0.15] transition-all duration-[4000ms] ease-in-out"
                style={{ backgroundColor: colors[0] }}
            />

            {/* Secondary Glow */}
            <div
                className="absolute -bottom-[20%] -right-[20%] w-[70%] h-[70%] rounded-full blur-[160px] opacity-[0.08] transition-all duration-[4000ms] ease-in-out"
                style={{ backgroundColor: colors[1] || colors[0] }}
            />

            {/* Ambient Dark Overlay */}
            <div className="absolute inset-0 bg-[#0c0c0c]/60 backdrop-blur-[4px]" />
            
            {/* Dynamic Noise texture if needed for premium feel */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </div>
    );
};

export default BackgroundAtmosphere;
