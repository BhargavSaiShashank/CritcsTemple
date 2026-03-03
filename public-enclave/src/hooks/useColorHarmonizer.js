import { useState, useEffect } from 'react';
import ColorThief from 'colorthief';

export const useColorHarmonizer = (imageUrl) => {
    const [palette, setPalette] = useState({
        primary: '#3b82f6', // Default blue
        accent: '#60a5fa',
        glow: 'rgba(59, 130, 246, 0.5)',
        secondary: '#1e40af'
    });

    useEffect(() => {
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        img.onload = () => {
            const colorThief = new ColorThief();
            try {
                const colors = colorThief.getPalette(img, 5);
                const p = colors[0]; // Dominant
                const s = colors[1] || colors[0]; // Secondary

                const primaryRgb = `rgb(${p[0]}, ${p[1]}, ${p[2]})`;
                const accentRgb = `rgb(${s[0]}, ${s[1]}, ${s[2]})`;
                const glowRgba = `rgba(${p[0]}, ${p[1]}, ${p[2]}, 0.35)`;
                const darkRgb = `rgb(${Math.max(0, p[0] - 40)}, ${Math.max(0, p[1] - 40)}, ${Math.max(0, p[2] - 40)})`;

                const newPalette = {
                    primary: primaryRgb,
                    accent: accentRgb,
                    glow: glowRgba,
                    secondary: darkRgb
                };

                setPalette(newPalette);

                // Update CSS variables on the root for global access
                const root = document.documentElement;
                root.style.setProperty('--accent-primary', primaryRgb);
                root.style.setProperty('--accent-secondary', accentRgb);
                root.style.setProperty('--accent-glow', glowRgba);
                root.style.setProperty('--accent-dark', darkRgb);
            } catch (err) {
                console.error("Color extraction failed:", err);
            }
        };
    }, [imageUrl]);

    return palette;
};
