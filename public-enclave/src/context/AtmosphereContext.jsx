import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import ColorThief from 'colorthief';

const AtmosphereContext = createContext();

export const useAtmosphere = () => useContext(AtmosphereContext);

const defaultColors = {
  primary: '#60a5fa', // Default blue
  secondary: '#3b82f6',
  glow: 'rgba(96, 165, 250, 0.3)'
};

export const AtmosphereProvider = ({ children }) => {
  const currentPosterRef = useRef(null);
  const [colors, setColors] = useState(defaultColors);

  const updateAtmosphere = useCallback(async (posterUrl) => {
    if (!posterUrl || posterUrl === currentPosterRef.current) return;
    currentPosterRef.current = posterUrl;

    // MICRO-ROUTING OPTIMIZATION: 
    // Prevent ColorThief from processing massive byte payloads on the main UI thread. 
    // This violently drops the CPU overhead, preventing thousands of dropped frames on Android WebViews.
    let extractUrl = posterUrl;
    if (extractUrl.includes('/proxy-image')) {
        extractUrl = extractUrl.replace(/quality=[a-zA-Z]+/, 'quality=Micro');
    } else if (extractUrl.includes('image.tmdb.org')) {
        extractUrl = extractUrl.replace(/\/(w\d+|original)\//, '/w92/');
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = extractUrl;

    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 5);
        
        const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');

        // Helper to ensure color is bright enough for dark background
        const ensureLegible = (rgb, minL = 130) => {
          const [r, g, b] = rgb;
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
          if (luminance < minL) {
            const factor = minL / (luminance || 1);
            return [
              Math.min(255, Math.round(r * factor + 30)), // Boost both scale and floor
              Math.min(255, Math.round(g * factor + 30)),
              Math.min(255, Math.round(b * factor + 30))
            ];
          }
          return rgb;
        };

        const dominant = ensureLegible(palette[0], 140);
        const vibrant = ensureLegible(palette[1] || palette[0], 160);
        
        const primaryHex = rgbToHex(...dominant);
        const secondaryHex = rgbToHex(...vibrant);
        const glow = `rgba(${dominant[0]}, ${dominant[1]}, ${dominant[2]}, 0.4)`;

        setColors({ primary: primaryHex, secondary: secondaryHex, glow });

        // Update CSS Variables
        document.documentElement.style.setProperty('--theme-primary', primaryHex);
        document.documentElement.style.setProperty('--theme-secondary', secondaryHex);
        document.documentElement.style.setProperty('--theme-glow', glow);
        
        console.log('[Atmosphere] Soul-Sync Activated:', primaryHex);
      } catch (e) {
        console.error('[Atmosphere] Extraction Error:', e);
      }
    };
  }, []);

  const resetAtmosphere = useCallback(() => {
    currentPosterRef.current = null;

    setColors(defaultColors);
    document.documentElement.style.removeProperty('--theme-primary');
    document.documentElement.style.removeProperty('--theme-secondary');
    document.documentElement.style.removeProperty('--theme-glow');
    console.log('[Atmosphere] Reset to default');
  }, []);

  return (
    <AtmosphereContext.Provider value={{ colors, updateAtmosphere, resetAtmosphere }}>
      {children}
    </AtmosphereContext.Provider>
  );

};
