import { useEffect } from 'react';
import { useAtmosphere } from '../context/AtmosphereContext';

export const useColorHarmonizer = (imageUrl) => {
    const { colors, updateAtmosphere, resetAtmosphere } = useAtmosphere();

    useEffect(() => {
        if (imageUrl) {
            updateAtmosphere(imageUrl);
        }
    }, [imageUrl, updateAtmosphere]);

    return {
        primary: colors.primary,
        accent: colors.secondary,
        glow: colors.glow,
        secondary: colors.secondary,
        resetAtmosphere
    };
};
