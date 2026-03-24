import React from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, Quote as QuoteIcon, Zap, Camera, Music, Heart, TrendingUp } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis, Tooltip } from 'recharts';
import { getProxyImageUrl } from '../services/api';

const ASPECT_GROUPS = [
    { name: 'Narrative', icon: QuoteIcon, color: '#818cf8', aspects: ['story', 'screenplay', 'originality', 'opening', 'climax'] },
    { name: 'Direction', icon: Zap, color: '#f59e0b', aspects: ['direction', 'acting', 'dialogues'] },
    { name: 'Visuals', icon: Camera, color: '#34d399', aspects: ['cinematography', 'editing', 'production_design', 'vfx'] },
    { name: 'Audio', icon: Music, color: '#f472b6', aspects: ['bg_score', 'music'] },
    { name: 'Soul', icon: Heart, color: '#fb7185', aspects: ['pacing', 'emotional_impact', 'rewatch_value'] },
];

const VERDICT_MAP = {
    Legendary: { color: '#FFFFFF', bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.3)', glow: 'rgba(255,255,255,0.25)' },
    Masterpiece: { color: '#FFD700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.3)', glow: 'rgba(255,215,0,0.2)' },
    Essential: { color: '#FF00EA', bg: 'rgba(255,0,234,0.12)', border: 'rgba(255,0,234,0.3)', glow: 'rgba(255,0,234,0.15)' },
    Elite: { color: '#9D00FF', bg: 'rgba(157,0,255,0.12)', border: 'rgba(157,0,255,0.3)', glow: 'rgba(157,0,255,0.1)' },
    Great: { color: '#00FF44', bg: 'rgba(0,255,68,0.12)', border: 'rgba(0,255,68,0.3)', glow: 'rgba(0,255,68,0.08)' },
    Good: { color: '#8FFF00', bg: 'rgba(143,255,0,0.12)', border: 'rgba(143,255,0,0.3)', glow: 'transparent' },
    Decent: { color: '#00D0FF', bg: 'rgba(0,208,255,0.1)', border: 'rgba(0,208,255,0.2)', glow: 'transparent' },
    Average: { color: '#849BB3', bg: 'rgba(132,155,179,0.08)', border: 'rgba(132,155,179,0.15)', glow: 'transparent' },
    Mediocre: { color: '#FFFB00', bg: 'rgba(255,251,0,0.08)', border: 'rgba(255,251,0,0.15)', glow: 'transparent' },
    Poor: { color: '#FF9100', bg: 'rgba(255,145,0,0.1)', border: 'rgba(255,145,0,0.2)', glow: 'transparent' },
    Bad: { color: '#FF4D00', bg: 'rgba(255,77,0,0.1)', border: 'rgba(255,77,0,0.22)', glow: 'transparent' },
    Terrible: { color: '#FF0000', bg: 'rgba(255,0,0,0.12)', border: 'rgba(255,0,0,0.28)', glow: 'transparent' },
    Disaster: { color: '#990000', bg: 'rgba(153,0,0,0.12)', border: 'rgba(153,0,0,0.28)', glow: 'transparent' },
    Abomination: { color: '#2D0000', bg: 'rgba(45,0,0,0.15)', border: 'rgba(45,0,0,0.32)', glow: 'transparent' },
};

const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', glow: 'transparent' };
const toLabel = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const ScoreBar = ({ name, score, color }) => {
    const n = parseFloat(score) || 0;
    const pct = Math.min(n / 10, 1);
    return (
        <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[7px] font-bold text-white/30 truncate uppercase">{name}</span>
                <span className="text-[9px] font-black" style={{ color: color }}>{n.toFixed(1)}</span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden relative">
                <div 
                    className="absolute inset-y-0 left-0 rounded-full" 
                    style={{ width: `${pct * 100}%`, background: color, boxShadow: `0 0 4px ${color}40` }} 
                />
            </div>
        </div>
    );
};

const DetailSection = ({ title, content, color }) => {
    if (!content) return null;
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-1">
            <h4 className="text-[7px] font-black uppercase tracking-widest" style={{ color: color }}>{title}</h4>
            <p className="text-[9px] text-white/50 leading-relaxed line-clamp-3">{content}</p>
        </div>
    );
};

const PublicPreview = ({ review, movie }) => {
    if (!review || !movie) return null;

    const vc = getV(review.verdict || 'Good');
    const aspects = review.aspects || {};
    
    const radarData = Object.entries(aspects).map(([key, val]) => ({
        subject: toLabel(key),
        A: parseFloat(val?.score || 0),
        fullMark: 10
    })).filter(d => d.A > 0);

    const groupAverages = ASPECT_GROUPS.map(g => {
        const scores = g.aspects.map(k => aspects[k]).filter(a => a && parseFloat(a?.score) > 0).map(a => parseFloat(a.score));
        const detailedAspects = g.aspects.map(k => ({ key: k, data: aspects[k] })).filter(({ data }) => data && parseFloat(data.score) > 0);
        return { ...g, avg: scores.length ? scores.reduce((a, b) => a + b) / scores.length : null, detailed: detailedAspects };
    }).filter(g => g.avg !== null);

    return (
        <div className="w-full bg-[#080808] text-white font-sans overflow-hidden rounded-[32px] border border-white/5 shadow-2xl">
            {/* Cinematic Banner */}
            <div className="relative h-44 overflow-hidden">
                <img 
                    src={getProxyImageUrl(review.movie_poster_url || movie.poster_url)} 
                    className="w-full h-full object-cover opacity-30 filter saturate-50 contrast-125"
                    alt="" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-1 text-white shadow-2xl">
                        {review.movie_title || movie.title}
                    </h1>
                    <div className="flex items-center gap-2">
                        <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                            {review.movie_year || movie.release_year} • {review.content_type?.toUpperCase() || 'MOVIE'}
                        </p>
                        <div className="h-1 w-1 rounded-full bg-white/20" />
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Archive Preview</span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Executive Summary */}
                {review.summary && (
                    <div className="relative pl-4 border-l-2 border-amber-500/50">
                        <p className="text-sm italic text-white/70 leading-relaxed font-serif">
                            "{review.summary}"
                        </p>
                    </div>
                )}

                {/* Score & Verdict Overlay */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center shadow-inner">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Overall DNA</span>
                        <div className="flex items-baseline gap-1 text-amber-500">
                             <span className="text-4xl font-black italic tracking-tighter">{(parseFloat(review.overall_rating) || 0).toFixed(2)}</span>
                             <span className="text-[10px] text-white/10 not-italic font-black">/10</span>
                        </div>
                    </div>
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-inner">
                         <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Divine Verdict</span>
                         <span 
                            className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg" 
                            style={{ background: vc.bg, color: vc.color, border: `1px solid ${vc.border}` }}
                         >
                            {review.verdict}
                         </span>
                    </div>
                </div>

                {/* Structural DNA Chart */}
                {radarData.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <TrendingUp size={12} className="text-white/20" />
                             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Structural DNA</span>
                        </div>
                        <div className="h-56 w-full border border-white/5 rounded-3xl bg-white/[0.01] p-4 relative overflow-hidden" style={{ minWidth: '1px', minHeight: '1px' }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 7, fontWeight: 900 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="none" tick={false} />
                                    <Radar
                                        name="Score"
                                        dataKey="A"
                                        stroke={vc.color}
                                        fill={vc.color}
                                        fillOpacity={0.25}
                                        dot={{ r: 3, fill: vc.color, stroke: '#fff', strokeWidth: 1 }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Deep Lore Grid */}
                {(review.cast_performances || review.director_trademarks) && (
                    <div className="grid grid-cols-2 gap-4">
                        <DetailSection title="Cast" content={review.cast_performances} color="#818cf8" />
                        <DetailSection title="Direction" content={review.director_trademarks} color="#f59e0b" />
                    </div>
                )}

                {/* Granular Aspect Breakdown */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Aspect Breakdown</span>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    
                    {groupAverages.map(g => (
                        <div key={g.name} className="space-y-3">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded bg-white/5">
                                        {React.createElement(g.icon, { size: 10, color: g.color })}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-white/80">{g.name}</span>
                                </div>
                                <span className="text-[12px] font-black italic" style={{ color: g.color }}>{g.avg.toFixed(2)}</span>
                            </div>
                            
                            <div className="space-y-2.5 pl-4 ml-2 border-l border-white/5">
                                {g.detailed.map(({ key, data }) => (
                                    <ScoreBar 
                                        key={key} 
                                        name={toLabel(key)} 
                                        score={data.score} 
                                        color={g.color} 
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quote / Dialogue */}
                {review.favourite_dialogues?.length > 0 && (
                    <div className="pt-6 border-t border-white/5">
                        <span className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-3 block">Sacred Words</span>
                        <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 italic text-[11px] text-white/60 leading-relaxed font-serif">
                            "{review.favourite_dialogues[0]}"
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicPreview;
