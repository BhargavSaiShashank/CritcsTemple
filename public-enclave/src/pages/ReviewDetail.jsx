import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, Calendar, Share2, Film, Check, Quote as QuoteIcon, Zap, Camera, Music, Heart } from 'lucide-react';
import { getReviewBySlug } from '../services/api';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const VERDICT_MAP = {
    Legendary: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', glow: 'rgba(239,68,68,0.08)' },
    Masterpiece: { color: '#f5a623', bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.3)', glow: 'rgba(245,166,35,0.08)' },
    Essential: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', glow: 'rgba(59,130,246,0.06)' },
    Elite: { color: '#c084fc', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', glow: 'rgba(168,85,247,0.06)' },
    Great: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', glow: 'rgba(34,197,94,0.06)' },
    Good: { color: '#86efac', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', glow: 'transparent' },
    Decent: { color: '#fde047', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', glow: 'transparent' },
    Average: { color: '#9ca3af', bg: 'rgba(156,163,175,0.06)', border: 'rgba(156,163,175,0.15)', glow: 'transparent' },
    Mediocre: { color: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', glow: 'transparent' },
    Poor: { color: '#fca5a5', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.18)', glow: 'transparent' },
    Bad: { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)', glow: 'transparent' },
    Terrible: { color: '#ef4444', bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.28)', glow: 'transparent' },
    Disaster: { color: '#dc2626', bg: 'rgba(185,28,28,0.12)', border: 'rgba(185,28,28,0.28)', glow: 'transparent' },
    Abomination: { color: '#b91c1c', bg: 'rgba(127,29,29,0.15)', border: 'rgba(127,29,29,0.32)', glow: 'transparent' },
    Unwatchable: { color: '#991b1b', bg: 'rgba(69,10,10,0.18)', border: 'rgba(69,10,10,0.36)', glow: 'transparent' },
};
const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', glow: 'transparent' };

const ASPECT_GROUPS = [
    { name: 'Narrative', icon: QuoteIcon, color: '#818cf8', aspects: ['story', 'screenplay', 'originality', 'opening', 'climax'] },
    { name: 'Direction', icon: Zap, color: '#f59e0b', aspects: ['direction', 'acting', 'dialogues'] },
    { name: 'Visuals', icon: Camera, color: '#34d399', aspects: ['cinematography', 'editing', 'production_design', 'vfx'] },
    { name: 'Audio', icon: Music, color: '#f472b6', aspects: ['bg_score', 'music'] },
    { name: 'Soul', icon: Heart, color: '#fb7185', aspects: ['pacing', 'emotional_impact', 'rewatch_value'] },
];

const toLabel = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const scoreColor = (n) => {
    n = parseFloat(n) || 0;
    if (n >= 8.5) return '#fbbf24';
    if (n >= 7) return '#4ade80';
    if (n >= 5) return '#60a5fa';
    return '#f87171';
};

function ScoreBar({ name, score, comment, color }) {
    const n = parseFloat(score) || 0;
    const pct = Math.min(n / 10, 1);
    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>{name}</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: scoreColor(n), fontVariantNumeric: 'tabular-nums' }}>{n.toFixed(1)}</span>
            </div>
            {/* Track */}
            <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${pct * 100}%`,
                    background: `linear-gradient(90deg, ${color}60, ${color})`,
                    borderRadius: '99px',
                    boxShadow: `0 0 8px ${color}50`,
                }} />
            </div>
            {comment && (
                <div style={{ marginTop: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {comment}
                </div>
            )}
        </div>
    );
}

function GroupSection({ group, aspects }) {
    const Icon = group.icon;
    const filled = group.aspects.map(k => ({ key: k, data: aspects?.[k] })).filter(({ data }) => data && parseFloat(data.score) > 0);
    if (!filled.length) return null;
    const avg = filled.reduce((s, { data }) => s + parseFloat(data.score), 0) / filled.length;
    return (
        <div style={{ marginBottom: '20px', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: `linear-gradient(90deg, ${group.color}06 0%, transparent 100%)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${group.color}14`, border: `1px solid ${group.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={13} color={group.color} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f2f2f2', letterSpacing: '-0.01em' }}>{group.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>avg</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: group.color, lineHeight: 1 }}>{avg.toFixed(1)}</span>
                </div>
            </div>
            <div style={{ padding: '18px 20px' }}>
                {filled.map(({ key, data }) => <ScoreBar key={key} name={toLabel(key)} score={data.score} comment={data.comment} color={group.color} />)}
            </div>
        </div>
    );
}

export default function ReviewDetail() {
    const { slug } = useParams();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [src, setSrc] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        getReviewBySlug(slug)
            .then(({ data }) => { setReview(data); setSrc(data?.movie_poster_url || FALLBACK); })
            .catch(console.error)
            .finally(() => setLoading(false));
        window.scrollTo(0, 0);
    }, [slug]);

    const handleShare = () => {
        navigator.clipboard?.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid rgba(245,166,35,0.15)', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    if (!review) return (
        <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
            <Film size={40} color="rgba(255,255,255,0.15)" />
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>Review not found</p>
            <Link to="/" style={{ color: '#f5a623', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>← Back to Archive</Link>
        </div>
    );

    const vc = getV(review.verdict);
    const aspects = review.aspects || {};
    const hasAspects = Object.values(aspects).some(a => a && parseFloat(a?.score) > 0);

    const groupAverages = ASPECT_GROUPS.map(g => {
        const scores = g.aspects.map(k => aspects[k]).filter(a => a && parseFloat(a?.score) > 0).map(a => parseFloat(a.score));
        return { ...g, avg: scores.length ? scores.reduce((a, b) => a + b) / scores.length : null };
    }).filter(g => g.avg !== null);

    return (
        <div style={{ background: '#080808', minHeight: '100vh' }}>
            {/* ── CINEMATIC BANNER ── */}
            <div style={{ position: 'relative', height: '52vh', minHeight: '320px', overflow: 'hidden' }}>
                <img src={src} alt="" onError={() => setSrc(FALLBACK)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.2) saturate(0.6)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #080808 0%, rgba(8,8,8,0.5) 60%, transparent 100%)' }} />
                {/* Verdict glow */}
                <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '30%', height: '60%', background: `radial-gradient(ellipse, ${vc.glow !== 'transparent' ? vc.glow : 'rgba(245,166,35,0.05)'} 0%, transparent 70%)`, filter: 'blur(32px)', pointerEvents: 'none' }} />

                {/* Banner content */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 28px 32px' }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.05em', marginBottom: '14px', textTransform: 'uppercase' }}>
                        <ChevronLeft size={12} /> Archive
                    </Link>
                    <h1 className="display" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', fontWeight: 800, color: '#f2f2f2', lineHeight: 1.08, letterSpacing: '-0.025em', marginBottom: '8px' }}>
                        {review.movie_title}
                    </h1>
                    {review.movie_year && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>{review.movie_year}</div>}
                </div>
            </div>

            {/* ── BODY ── */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 28px 100px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px', alignItems: 'start' }}>

                    {/* ── LEFT SIDEBAR ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>
                        {/* Poster */}
                        <div style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <img src={src} alt={review.movie_title} onError={() => setSrc(FALLBACK)} style={{ width: '100%', display: 'block' }} />
                        </div>

                        {/* Score + verdict card */}
                        <div style={{
                            borderRadius: '16px', padding: '22px 20px', textAlign: 'center',
                            background: vc.glow !== 'transparent' ? `linear-gradient(135deg, ${vc.glow}, rgba(17,17,17,0))` : '#111',
                            border: `1px solid ${vc.border}`,
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>Overall Score</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
                                <Star size={18} fill="#f5a623" color="#f5a623" style={{ marginBottom: '4px' }} />
                                <span style={{ fontSize: '52px', fontWeight: 900, color: '#f5a623', lineHeight: 1, letterSpacing: '-0.04em' }}>
                                    {parseFloat(review.overall_rating || 0).toFixed(1)}
                                </span>
                                <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.18)', fontWeight: 400 }}>/10</span>
                            </div>
                            <span style={{
                                display: 'inline-block', padding: '5px 18px', borderRadius: '99px',
                                fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                                background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`,
                            }}>
                                {review.verdict}
                            </span>
                        </div>

                        {/* Category mini chart */}
                        {groupAverages.length > 0 && (
                            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px 20px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>By Category</div>
                                {groupAverages.map(g => (
                                    <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', width: '70px', flexShrink: 0, fontWeight: 500 }}>{g.name}</span>
                                        <div style={{ flex: 1, height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(g.avg / 10) * 100}%`, background: g.color, borderRadius: '99px', opacity: 0.75 }} />
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: g.color, width: '28px', textAlign: 'right' }}>{g.avg.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Meta */}
                        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                            {review.published_at && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>
                                    <Calendar size={12} />
                                    {new Date(review.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            )}
                            {review.tags?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                                    {review.tags.map(t => (
                                        <span key={t} style={{ padding: '2px 9px', borderRadius: '99px', fontSize: '10px', color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontWeight: 500 }}>
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4ade80' : 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: 500, padding: 0, transition: 'color 0.2s' }}>
                                {copied ? <Check size={12} /> : <Share2 size={12} />}
                                {copied ? 'Copied!' : 'Copy link'}
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT CONTENT ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                        {/* Summary quote */}
                        {review.summary && (
                            <div style={{ position: 'relative', padding: '28px 32px', background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)', borderRadius: '16px', borderLeft: '3px solid #f5a623' }}>
                                <div style={{ fontSize: '19px', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, fontFamily: 'Playfair Display, Georgia, serif' }}>
                                    "{review.summary}"
                                </div>
                            </div>
                        )}

                        {/* Written critique */}
                        {review.content && (
                            <div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    The Critique
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(255,255,255,0.52)', lineHeight: 1.9, whiteSpace: 'pre-wrap', letterSpacing: '0.01em' }}>
                                    {review.content}
                                </div>
                            </div>
                        )}

                        {/* Cinematic Lore */}
                        {(review.cast_performances || review.director_trademarks || review.viewing_context || review.trivia_and_details) && (
                            <div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    Deep Cinematic Lore
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                    {review.cast_performances && (
                                        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>Cast Performances</div>
                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{review.cast_performances}</div>
                                        </div>
                                    )}
                                    {review.director_trademarks && (
                                        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>Director Trademarks</div>
                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{review.director_trademarks}</div>
                                        </div>
                                    )}
                                    {review.viewing_context && (
                                        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>Viewing Context</div>
                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{review.viewing_context}</div>
                                        </div>
                                    )}
                                    {review.trivia_and_details && (
                                        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>Trivia & Details</div>
                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{review.trivia_and_details}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Aspect breakdown */}
                        {hasAspects && (
                            <div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    Cinematic Breakdown
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                </div>
                                {ASPECT_GROUPS.map(g => <GroupSection key={g.name} group={g} aspects={aspects} />)}
                            </div>
                        )}

                        {/* Dialogues + Moments */}
                        {(review.favourite_dialogues?.length > 0 || review.cinematic_moments?.length > 0) && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                {review.favourite_dialogues?.length > 0 && (
                                    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>Favourite Dialogues</div>
                                        {review.favourite_dialogues.map((d, i) => (
                                            <div key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.42)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '8px', paddingLeft: '10px', borderLeft: '2px solid rgba(245,166,35,0.2)' }}>
                                                "{d}"
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {review.cinematic_moments?.length > 0 && (
                                    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>Cinematic Moments</div>
                                        {review.cinematic_moments.map((m, i) => (
                                            <div key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, marginBottom: '8px', display: 'flex', gap: '8px' }}>
                                                <span style={{ color: 'rgba(245,166,35,0.5)', flexShrink: 0, marginTop: '2px' }}>▸</span> {m}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Spoiler */}
                        {review.spoiler_section && (
                            <details style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '14px' }}>
                                <summary style={{ padding: '15px 18px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: 'rgba(239,68,68,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', listStyle: 'none' }}>
                                    ⚠ Spoiler Section — click to reveal
                                </summary>
                                <div style={{ padding: '0 18px 18px', fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.85, whiteSpace: 'pre-wrap', borderTop: '1px solid rgba(239,68,68,0.08)', paddingTop: '14px', marginTop: '0' }}>
                                    {review.spoiler_section}
                                </div>
                            </details>
                        )}

                        {/* Back link */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Link to="/" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                            >
                                <ChevronLeft size={13} /> All Reviews
                            </Link>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.12)' }}>The Sanctuary · Cinema Archive</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
