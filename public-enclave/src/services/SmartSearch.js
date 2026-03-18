import Fuse from 'fuse.js';

export const initializeSmartSearch = (reviews) => {
    // Fuse configuration for offline typo-tolerant "Smart Search"
    // This provides a heavily augmented ML-like fuzzy search natively
    const options = {
        includeScore: true,
        threshold: 0.4, // A lower threshold requires more strict matching but handles typos well
        ignoreLocation: true, // Searches across the entire document
        keys: [
            { name: 'movie_title', weight: 0.5 },
            { name: 'verdict', weight: 0.3 },
            { name: 'summary', weight: 0.2 },
        ]
    };

    return new Fuse(reviews, options);
};

export const performSmartSearch = (fuse, query) => {
    if (!query) return null;
    try {
        const results = fuse.search(query);
        // Map back to the original review object
        return results.map(result => result.item);
    } catch (e) {
        console.warn('[SmartSearch] Failed', e);
        return null;
    }
};
