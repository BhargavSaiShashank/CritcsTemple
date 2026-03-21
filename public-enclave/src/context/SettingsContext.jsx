import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const AVAILABLE_THEMES = [
    { id: 'dynamic', name: 'Default (Adaptive)' },
    { id: 'midnight', name: 'Midnight Royal' },
    { id: 'obsidian', name: 'Obsidian' },
    { id: 'crimson', name: 'Crimson Theater' },
    { id: 'frost', name: 'Frost' },
    { id: 'emerald', name: 'Emerald' },
    { id: 'neon', name: 'Neon Arcade' },
    { id: 'minimal', name: 'Minimalist' }
];

export const SettingsProvider = ({ children }) => {
    // Read from localStorage on mount (synchronous init to avoid flash)
    const getSaved = (key, defaultVal) => {
        try {
            const item = localStorage.getItem(`sanctorum_${key}`);
            return item !== null ? JSON.parse(item) : defaultVal;
        } catch { 
            return localStorage.getItem(`sanctorum_${key}`) || defaultVal; 
        }
    };

    const [theme, setThemeState] = useState(() => getSaved('theme', 'dynamic'));
    const [posterQuality, setPosterQualityState] = useState(() => getSaved('posterQuality', 'High'));
    const [dataSaver, setDataSaverState] = useState(() => getSaved('dataSaver', false));
    const [amoledBlack, setAmoledBlackState] = useState(() => getSaved('amoledBlack', false));
    const [defaultTab, setDefaultTabState] = useState(() => getSaved('defaultTab', '/'));
    
    // Save helpers
    const setTheme = (val) => { setThemeState(val); localStorage.setItem('sanctorum_theme', val); };
    const setPosterQuality = (val) => { setPosterQualityState(val); localStorage.setItem('sanctorum_posterQuality', val); };
    const setDataSaver = (val) => { 
        setDataSaverState(val);
        localStorage.setItem('sanctorum_dataSaver', val);
        if(val) setPosterQuality('Low'); // Forced side-effect
    };
    const setAmoledBlack = (val) => { setAmoledBlackState(val); localStorage.setItem('sanctorum_amoledBlack', val); };
    const setDefaultTab = (val) => { setDefaultTabState(val); localStorage.setItem('sanctorum_defaultTab', val); };

    // Apply theme and amoled classes to document.body
    useEffect(() => {
        document.body.className = ''; // reset
        document.body.classList.add(`theme-${theme}`);
        if (amoledBlack) {
            document.body.classList.add('amoled-black');
        }
    }, [theme, amoledBlack]);

    const clearAppCache = useCallback(async () => {
        try {
            localStorage.removeItem('sanctorum_offlineData'); 
            sessionStorage.clear();
            return true;
        } catch(e) {
            console.error("Cache clear failed", e);
            return false;
        }
    }, []);

    const value = {
        theme, setTheme,
        posterQuality, setPosterQuality,
        dataSaver, setDataSaver,
        amoledBlack, setAmoledBlack,
        defaultTab, setDefaultTab,
        clearAppCache
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
