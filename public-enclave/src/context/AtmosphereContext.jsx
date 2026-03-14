import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import ColorThief from 'colorthief';

const AtmosphereContext = createContext();

export const useAtmosphere = () => useContext(AtmosphereContext);

export const AtmosphereProvider = ({ children }) => {
  const [currentPoster, setCurrentPoster] = useState(null);
  const [colors, setColors] = useState({
    primary: '#60a5fa', // Default blue
    secondary: '#3b82f6',
    glow: 'rgba(96, 165, 250, 0.3)'
  });

  const updateAtmosphere = async (posterUrl) => {
    if (!posterUrl || posterUrl === currentPoster) return;
    setCurrentPoster(posterUrl);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = posterUrl;

    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 5);
        
        const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');

        const dominant = palette[0];
        const vibrant = palette[1] || palette[0];
        
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
  };

  return (
    <AtmosphereContext.Provider value={{ colors, updateAtmosphere }}>
      {children}
    </AtmosphereContext.Provider>
  );
};
