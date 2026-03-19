export const VERDICT_SCALE = [
    { range: '9.6 – 10.0', verdict: 'LEGENDARY', description: 'Cultural shift. Genre redefining. Long-term impact. Few films live here.', color: '#FFFFFF' },
    { range: '9.2 – 9.5', verdict: 'MASTERPIECE', description: 'Near-flawless execution. Technical and emotional dominance.', color: '#FFD700' },
    { range: '8.8 – 9.1', verdict: 'ESSENTIAL', description: 'High craft, strong identity, must-watch within its genre.', color: '#FF00FF' },
    { range: '8.4 – 8.7', verdict: 'ELITE', description: 'Exceptional execution with minor flaws. Strong authorial control.', color: '#9D00FF' },
    { range: '8.0 – 8.3', verdict: 'GREAT', description: 'Very well made. Strong craft. Not transcendent.', color: '#00FF00' },
    { range: '7.5 – 7.9', verdict: 'GOOD', description: 'Solid. Worth watching. Has noticeable flaws.', color: '#ADFF2F' },
    { range: '7.0 – 7.4', verdict: 'DECENT', description: 'Watchable. Functional. Lacks depth or consistency.', color: '#00CCFF' },
    { range: '6.0 – 6.9', verdict: 'AVERAGE', description: 'Technically fine. Emotionally forgettable.', color: '#8E9AAF' },
    { range: '5.0 – 5.9', verdict: 'MEDIOCRE', description: 'Inconsistent. Weak in key areas.', color: '#FFFF00' },
    { range: '4.0 – 4.9', verdict: 'POOR', description: 'Multiple structural or execution failures.', color: '#FF8C00' },
    { range: '3.0 – 3.9', verdict: 'BAD', description: 'Broken storytelling or technical incompetence.', color: '#FF4500' },
    { range: '2.0 – 2.9', verdict: 'TERRIBLE', description: 'Painfully flawed.', color: '#FF0000' },
    { range: '1.0 – 1.9', verdict: 'DISASTER', description: 'Collapse of craft.', color: '#B22222' },
    { range: '0.0 – 0.9', verdict: 'ABOMINATION', description: 'Fundamentally unwatchable.', color: '#4B0000' }
];

export const getVerdictForScore = (score) => {
    return VERDICT_SCALE.find(tier => {
        const [min, max] = tier.range.split(' – ').map(v => v === 'Below 1.0' ? 0 : parseFloat(v));
        if (tier.range === '0.0 – 0.9' || tier.range === 'Below 1.0') return score < 1.0;
        return score >= min && score <= max;
    }) || VERDICT_SCALE[VERDICT_SCALE.length - 1];
};
