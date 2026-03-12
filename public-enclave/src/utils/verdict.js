export const getVerdictFromScore = (score) => {
    const n = parseFloat(score) || 0;
    if (n >= 9.6) return 'Legendary';
    if (n >= 9.2) return 'Masterpiece';
    if (n >= 8.8) return 'Essential';
    if (n >= 8.4) return 'Elite';
    if (n >= 8.0) return 'Great';
    if (n >= 7.5) return 'Good';
    if (n >= 7.0) return 'Decent';
    if (n >= 6.0) return 'Average';
    if (n >= 5.0) return 'Mediocre';
    if (n >= 4.0) return 'Poor';
    if (n >= 3.0) return 'Bad';
    if (n >= 2.0) return 'Terrible';
    if (n >= 1.0) return 'Disaster';
    return 'Abomination';
};
