import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, Calendar, Share2, Film, Check, Quote as QuoteIcon, Zap, Camera, Music, Heart, Info, Target, Sparkles, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import * as htmlToImage from 'html-to-image';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { getReviewBySlug, clapReview, unclapReview, reactReview, getRelatedReviews } from '../services/api';
import ReviewExportCard from '../components/ReviewExportCard';
import SanctuaryTicket from '../components/SanctuaryTicket';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';

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
    const exportRef = useRef(null);
    const [exporting, setExporting] = useState(false);
    const [claps, setClaps] = useState(0);
    const [hasClapped, setHasClapped] = useState(false);
    const [related, setRelated] = useState([]);
    const ticketRef = useRef(null);
    const [exportingTicket, setExportingTicket] = useState(false);

    const handleDownloadCard = async () => {
        if (!exportRef.current) return;
        setExporting(true);
        try {
            const dataUrl = await htmlToImage.toPng(exportRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#080808'
            });

            if (Capacitor.isNativePlatform()) {
                const fileName = `sanctuary-${review.slug}-square.png`;
                const base64Data = dataUrl.split(',')[1];

                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache
                });

                await Share.share({
                    title: 'Sanctuary Square Card',
                    text: `Check out my cinematic verdict for ${review.movie_title}!`,
                    url: savedFile.uri,
                    dialogTitle: 'Share Cinematic Card'
                });
            } else {
                const link = document.createElement('a');
                link.download = `sanctuary-${review.slug}-square.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error('Failed to generate square card:', error);
        } finally {
            setExporting(false);
        }
    };

    const handleDownloadTicket = async () => {
        if (!ticketRef.current) return;
        setExportingTicket(true);
        try {
            const dataUrl = await htmlToImage.toPng(ticketRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#0a0a0a'
            });

            if (Capacitor.isNativePlatform()) {
                const fileName = `sanctuary-${review.slug}-ticket.png`;
                const base64Data = dataUrl.split(',')[1];

                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache
                });

                await Share.share({
                    title: 'Sanctuary Ticket',
                    text: `My exclusive Sanctuary Ticket for ${review.movie_title}!`,
                    url: savedFile.uri,
                    dialogTitle: 'Share Sanctuary Ticket'
                });
            } else {
                const link = document.createElement('a');
                link.download = `sanctuary-${review.slug}-ticket.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error('Failed to generate ticket:', error);
            alert("Failed to generate your ticket.");
        } finally {
            setExportingTicket(false);
        }
    };

    useEffect(() => {
        getReviewBySlug(slug)
            .then(({ data }) => {
                setReview(data);
                setSrc(data?.movie_poster_url || FALLBACK);
                setClaps(data.claps || 0);
                setHasClapped(localStorage.getItem(`clap_${data.slug}`) === 'true');
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        getRelatedReviews(slug)
            .then(({ data }) => setRelated(data))
            .catch(console.error);

        window.scrollTo(0, 0);
    }, [slug]);

    const handleReaction = async (type) => {
        const key = `react_${review?.slug}`;
        const currentReaction = localStorage.getItem(key);

        // Determine the action
        let nextReaction = type;
        if (currentReaction === type) nextReaction = null; // Toggle off

        // Optimistic update
        setReview(prev => {
            const newReactions = { ...(prev.reactions || {}) };

            // Undo previous if exists
            if (currentReaction) {
                newReactions[currentReaction] = Math.max(0, (newReactions[currentReaction] || 1) - 1);
            }

            // Apply new if not just a toggle off
            if (nextReaction) {
                newReactions[nextReaction] = (newReactions[nextReaction] || 0) + 1;
            }

            return { ...prev, reactions: newReactions };
        });

        if (nextReaction) {
            localStorage.setItem(key, nextReaction);
        } else {
            localStorage.removeItem(key);
        }

        try {
            await reactReview(review.slug, nextReaction, currentReaction);
        } catch (e) {
            console.error("Reaction failed", e);
            // Simple approach: refresh data on failure to ensure consistency
            getReviewBySlug(slug).then(({ data }) => setReview(data));
            if (currentReaction) {
                localStorage.setItem(key, currentReaction);
            } else {
                localStorage.removeItem(key);
            }
        }
    };

    const handleClap = async () => {
        if (hasClapped) {
            // Unclap logic
            setClaps(prev => Math.max(0, prev - 1));
            setHasClapped(false);
            localStorage.removeItem(`clap_${review?.slug}`);
            try {
                await unclapReview(review.slug);
            } catch (e) {
                console.error("Unclap failed", e);
                // Rollback optimistic update
                setClaps(prev => prev + 1);
                setHasClapped(true);
                localStorage.setItem(`clap_${review?.slug}`, 'true');
            }
        } else {
            // Clap logic
            setClaps(prev => prev + 1);
            setHasClapped(true);
            localStorage.setItem(`clap_${review?.slug}`, 'true');
            try {
                await clapReview(review.slug);
            } catch (e) {
                console.error("Clap failed", e);
                // Rollback optimistic update
                setClaps(prev => Math.max(0, prev - 1));
                setHasClapped(false);
                localStorage.removeItem(`clap_${review?.slug}`);
            }
        }
    };

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
    const wordCount = review.content ? review.content.split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const groupAverages = ASPECT_GROUPS.map(g => {
        const scores = g.aspects.map(k => aspects[k]).filter(a => a && parseFloat(a?.score) > 0).map(a => parseFloat(a.score));
        return { ...g, avg: scores.length ? scores.reduce((a, b) => a + b) / scores.length : null };
    }).filter(g => g.avg !== null);

    return (
        <div style={{ background: '#080808', minHeight: '100vh', position: 'relative' }}>
            <BackgroundAtmosphere activeColor={vc.color} />
            {/* ── CINEMATIC BANNER ── */}
            <div style={{ position: 'relative', height: '35vh', minHeight: '220px', overflow: 'hidden' }}>
                <img src={src} alt="" onError={() => setSrc(FALLBACK)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.2) saturate(0.6)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #080808 0%, rgba(8,8,8,0.5) 60%, transparent 100%)' }} />
                {/* Verdict glow */}
                <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '30%', height: '60%', background: `radial-gradient(ellipse, ${vc.glow !== 'transparent' ? vc.glow : 'rgba(245,166,35,0.05)'} 0%, transparent 70%)`, filter: 'blur(32px)', pointerEvents: 'none' }} />

                {/* Banner content */}
                <div className="max-w-container" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: '16px' }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.05em', marginBottom: '14px', textTransform: 'uppercase' }}>
                        <ChevronLeft size={12} /> Archive
                    </Link>
                    <h1 className="display" style={{ fontSize: 'clamp(2rem, 8vw, 4.2rem)', fontWeight: 800, color: '#f2f2f2', lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: '8px' }}>
                        {review.movie_title}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
                        {review.content_type === 'tv' && (
                            <span style={{ color: 'rgba(245,166,35,0.6)', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>TV Show &bull;</span>
                        )}
                        {review.movie_year && <span>{review.movie_year}</span>}
                        {review.seasons_count && (
                            <>
                                <span style={{ color: 'rgba(255,255,255,0.1)' }}>&bull;</span>
                                <span>{review.seasons_count} Seasons</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="max-w-container" style={{ paddingTop: '24px', paddingBottom: '100px' }}>
                <div className="review-grid-container">

                    {/* ── LEFT SIDEBAR ── */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="md:sticky md:top-[80px]"
                        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
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
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Calendar size={12} />
                                        {new Date(review.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.1)' }}>•</span>
                                    <span style={{ color: '#f5a623', fontWeight: 600 }}>{readTime} Min Read</span>
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
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '4px' }}>
                                <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4ade80' : 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 500, padding: 0, transition: 'color 0.2s' }}>
                                    {copied ? <Check size={12} /> : <Share2 size={12} />}
                                    {copied ? 'Copied!' : 'Copy link'}
                                </button>
                                <button
                                    onClick={handleDownloadTicket}
                                    disabled={exportingTicket}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', cursor: exportingTicket ? 'not-allowed' : 'pointer', color: '#f5a623', fontSize: '11px', fontWeight: 700, padding: '6px 14px', borderRadius: '8px', transition: 'all 0.2s', opacity: exportingTicket ? 0.5 : 1 }}
                                    onMouseEnter={e => !exportingTicket && (e.currentTarget.style.background = 'rgba(245,166,35,0.15)')}
                                    onMouseLeave={e => !exportingTicket && (e.currentTarget.style.background = 'rgba(245,166,35,0.08)')}
                                >
                                    <Sparkles size={11} />
                                    {exportingTicket ? 'Minting...' : 'Sanctuary Ticket'}
                                </button>
                                <button
                                    onClick={handleDownloadCard}
                                    disabled={exporting}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: exporting ? 'not-allowed' : 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 500, padding: 0, transition: 'color 0.2s', opacity: exporting ? 0.5 : 1 }}
                                    onMouseEnter={e => !exporting && (e.currentTarget.style.color = '#fff')}
                                    onMouseLeave={e => !exporting && (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                                >
                                    <Download size={12} />
                                    {exporting ? 'Square...' : 'Square Card'}
                                </button>
                            </div>

                            {review.watch_links && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>Where to Watch</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {review.watch_links.split(',').map((link, idx) => {
                                            const url = link.trim();
                                            let platform = 'Stream Now';
                                            if (url.includes('netflix.com')) platform = 'Netflix';
                                            else if (url.includes('primevideo.com') || url.includes('amazon.')) platform = 'Prime Video';
                                            else if (url.includes('apple.com')) platform = 'Apple TV';
                                            else if (url.includes('hbo.com') || url.includes('max.com')) platform = 'Max';
                                            else if (url.includes('disneyplus.com')) platform = 'Disney+';
                                            else if (url.includes('hulu.com')) platform = 'Hulu';

                                            return (
                                                <a key={idx} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                                                >
                                                    ▶ {platform}
                                                </a>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Table of Contents */}
                        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }} className="hidden md:block">
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>Contents</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {review.summary && <a href="#summary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', opacity: 0.8 }} className="hover:text-amber-500 hover:opacity-100 transition-colors">The Essence</a>}
                                {review.content && <a href="#critique" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', opacity: 0.8 }} className="hover:text-amber-500 hover:opacity-100 transition-colors">The Critique</a>}
                                {(review.cast_performances || review.director_trademarks || review.viewing_context || review.trivia_and_details) && <a href="#lore" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', opacity: 0.8 }} className="hover:text-amber-500 hover:opacity-100 transition-colors">Deep Lore</a>}
                                {hasAspects && <a href="#dna" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', opacity: 0.8 }} className="hover:text-amber-500 hover:opacity-100 transition-colors">Structural DNA</a>}
                                {review.spoiler_section && <a href="#spoilers" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', opacity: 0.8 }} className="hover:text-amber-500 hover:opacity-100 transition-colors">Spoilers</a>}
                            </div>
                        </div>
                    </motion.div>

                    {/* ── RIGHT CONTENT ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                        {/* Summary quote */}
                        {review.summary && (
                            <motion.div
                                id="summary"
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                style={{ position: 'relative', padding: '28px 32px', background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)', borderRadius: '16px', borderLeft: '3px solid #f5a623' }}
                            >
                                <div style={{ fontSize: '19px', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, fontFamily: 'Playfair Display, Georgia, serif' }}>
                                    "{review.summary}"
                                </div>
                            </motion.div>
                        )}

                        {/* Written critique */}
                        {review.content && (
                            <motion.div
                                id="critique"
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    The Critique
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(255,255,255,0.52)', lineHeight: 1.9, whiteSpace: 'pre-wrap', letterSpacing: '0.01em' }}>
                                    {review.content}
                                </div>
                            </motion.div>
                        )}

                        {/* Cinematic Lore */}
                        {(review.cast_performances || review.director_trademarks || review.viewing_context || review.trivia_and_details) && (
                            <div id="lore">
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    Deep Cinematic Lore
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
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
                            <motion.div
                                id="dna"
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    Structural DNA
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                </div>

                                {/* Radar Chart Integration */}
                                <div style={{ height: '320px', background: '#111', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                                            Object.keys(aspects)
                                                .filter(k => aspects[k]?.score > 0)
                                                .map(k => ({ subject: toLabel(k), A: parseFloat(aspects[k].score), fullMark: 10 }))
                                        }>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 10]} axisLine={false} tick={false} />
                                            <Radar
                                                name="Score"
                                                dataKey="A"
                                                stroke={vc.color}
                                                fill={vc.color}
                                                fillOpacity={0.35}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>

                                {ASPECT_GROUPS.map(g => <GroupSection key={g.name} group={g} aspects={aspects} />)}
                            </motion.div>
                        )}

                        {/* Dialogues + Moments */}
                        {(review.favourite_dialogues?.length > 0 || review.cinematic_moments?.length > 0) && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '14px' }}>
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
                            <details id="spoilers" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '14px' }}>
                                <summary style={{ padding: '15px 18px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: 'rgba(239,68,68,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', listStyle: 'none' }}>
                                    ⚠ Spoiler Section — click to reveal
                                </summary>
                                <div style={{ padding: '0 18px 18px', fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.85, whiteSpace: 'pre-wrap', borderTop: '1px solid rgba(239,68,68,0.08)', paddingTop: '14px', marginTop: '0' }}>
                                    {review.spoiler_section}
                                </div>
                            </details>
                        )}

                        {/* Claps */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', marginBottom: '20px' }}>
                            <button
                                onClick={handleClap}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: hasClapped ? 'rgba(239,68,68,0.1)' : '#111', border: `1px solid ${hasClapped ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`, padding: '12px 24px', borderRadius: '99px', color: hasClapped ? '#ef4444' : 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}
                                onMouseEnter={e => {
                                    if (!hasClapped) {
                                        e.currentTarget.style.background = 'rgba(239,68,68,0.05)';
                                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                                        e.currentTarget.style.color = '#ef4444';
                                    } else {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!hasClapped) {
                                        e.currentTarget.style.background = '#111';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                    } else {
                                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                                        e.currentTarget.style.color = '#ef4444';
                                    }
                                }}
                            >
                                <Heart size={18} fill={hasClapped ? '#ef4444' : 'none'} color={hasClapped ? '#ef4444' : 'currentColor'} style={{ transform: hasClapped ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s' }} />
                                {claps} {claps === 1 ? 'Resonance' : 'Resonances'}
                            </button>
                        </div>

                        {/* Reactions Widget */}
                        <div style={{ marginTop: '20px', padding: '24px', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>Community Consensus</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                {[
                                    { id: 'agree', label: 'Agree', color: '#4ade80' },
                                    { id: 'disagree', label: 'Disagree', color: '#f87171' },
                                    { id: 'havent_seen', label: 'Haven\'t Seen', color: '#94a3b8' }
                                ].map(r => {
                                    const count = review.reactions?.[r.id] || 0;
                                    const hasReacted = localStorage.getItem(`react_${review.slug}`) === r.id;

                                    return (
                                        <button
                                            key={r.id}
                                            onClick={() => handleReaction(r.id)}
                                            style={{
                                                background: hasReacted ? `${r.color}20` : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${hasReacted ? `${r.color}50` : 'rgba(255,255,255,0.06)'}`,
                                                padding: '16px 8px',
                                                borderRadius: '16px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: hasReacted ? `0 0 20px ${r.color}15` : 'none'
                                            }}
                                        >
                                            <span style={{ fontSize: '14px', fontWeight: 900, color: hasReacted ? r.color : 'rgba(255,255,255,0.8)' }}>{count}</span>
                                            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: hasReacted ? r.color : 'rgba(255,255,255,0.3)' }}>{r.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* More Like This */}
                        {related.length > 0 && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px', marginTop: '40px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Sanctuary Recommendations</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    {related.map(r => (
                                        <Link key={r.slug} to={`/review/${r.slug}`} style={{ textDecoration: 'none', background: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', transition: 'transform 0.2s, border-color 0.2s' }} className="group hover:-translate-y-1 hover:border-amber-500/30 font-premium">
                                            <div style={{ height: '120px', overflow: 'hidden', position: 'relative' }}>
                                                <img src={r.movie_poster_url || FALLBACK} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} />
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, color: '#f5a623' }}>{parseFloat(r.overall_rating).toFixed(1)}</div>
                                            </div>
                                            <div style={{ padding: '16px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f2f2f2', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.movie_title}</div>
                                                <div style={{ fontSize: '11px', color: getV(r.verdict).color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.verdict}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Back link */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Link to="/" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                            >
                                <ChevronLeft size={13} /> All Reviews
                            </Link>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                                {review.author ? `Penned by ${review.author} · ` : ''}Critic's Temple Archive
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Export Components */}
            <ReviewExportCard ref={exportRef} review={review} />
            <SanctuaryTicket ref={ticketRef} review={review} />
        </div>
    );
}
