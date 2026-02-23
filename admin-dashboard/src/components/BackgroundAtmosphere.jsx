import React, { useEffect, useState } from 'react';
import ColorThief from 'colorthief';

const BackgroundAtmosphere = ({ imageUrl }) => {
    const [colors, setColors] = useState(['#fbbf24', '#0c0c0c']); // Default amber/black

    useEffect(() => {
        if (!imageUrl || imageUrl === 'N/A') return;

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        img.onload = () => {
            try {
                const colorThief = new ColorThief();
                const palette = colorThief.getPalette(img, 3);
                if (palette && palette.length > 0) {
                    const hexColors = palette.map(rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
                    setColors(hexColors);
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
                className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 transition-all duration-[3000ms] ease-in-out"
                style={{ backgroundColor: colors[0] }}
            />

            {/* Secondary Glow */}
            <div
                className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10 transition-all duration-[3000ms] ease-in-out"
                style={{ backgroundColor: colors[1] || colors[0] }}
            />

            {/* Ambient Dark Overlay */}
            <div className="absolute inset-0 bg-[#0c0c0c]/40 backdrop-blur-[2px]" />
        </div>
    );
};

export default BackgroundAtmosphere;
