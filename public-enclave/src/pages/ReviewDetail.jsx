import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, Calendar, Share2, Film, Check, Quote as QuoteIcon, Zap, Camera, Music, Heart, Info, Target, Sparkles, Download, Sword } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis, Tooltip } from 'recharts';
import * as htmlToImage from 'html-to-image';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { getReviewBySlug, clapReview, unclapReview, reactReview, getRelatedReviews, proxyImage, getRatingTimeline } from '../services/api';
import ReviewExportCard from '../components/ReviewExportCard';
import SanctuaryTicket from '../components/SanctuaryTicket';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';
import RatingTimelineGraph from '../components/RatingTimelineGraph';

import { useColorHarmonizer } from '../hooks/useColorHarmonizer';
import { getVerdictFromScore } from '../utils/verdict';

const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200';

const VERDICT_MAP = {
    // Divine Tiers (Celestial & Archival Shimmer)
    Legendary: { color: '#FFFFFF', bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.3)', glow: 'rgba(255,255,255,0.25)', range: '9.6 - 10.0' },
    Masterpiece: { color: '#FFD700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.3)', glow: 'rgba(255,215,0,0.2)', range: '9.2 - 9.5' },
    Essential: { color: '#FF00EA', bg: 'rgba(255,0,234,0.12)', border: 'rgba(255,0,234,0.3)', glow: 'rgba(255,0,234,0.15)', range: '8.8 - 9.1' },
    Elite: { color: '#9D00FF', bg: 'rgba(157,0,255,0.12)', border: 'rgba(157,0,255,0.3)', glow: 'rgba(157,0,255,0.1)', range: '8.4 - 8.7' },

    // Grace Tiers (Vibrant Performance)
    Great: { color: '#00FF44', bg: 'rgba(0,255,68,0.12)', border: 'rgba(0,255,68,0.3)', glow: 'rgba(0,255,68,0.08)', range: '8.0 - 8.3' },
    Good: { color: '#8FFF00', bg: 'rgba(143,255,0,0.12)', border: 'rgba(143,255,0,0.3)', glow: 'transparent', range: '7.5 - 7.9' },
    Decent: { color: '#00D0FF', bg: 'rgba(0,208,255,0.1)', border: 'rgba(0,208,255,0.2)', glow: 'transparent', range: '7.0 - 7.4' },

    // Mundane Tiers (Neutrality)
    Average: { color: '#849BB3', bg: 'rgba(132,155,179,0.08)', border: 'rgba(132,155,179,0.15)', glow: 'transparent', range: '6.0 - 6.9' },
    Mediocre: { color: '#FFFB00', bg: 'rgba(255,251,0,0.08)', border: 'rgba(255,251,0,0.15)', glow: 'transparent', range: '5.0 - 5.9' },

    // Descent Tiers (Warning & Failure)
    Poor: { color: '#FF9100', bg: 'rgba(255,145,0,0.1)', border: 'rgba(255,145,0,0.2)', glow: 'transparent', range: '4.0 - 4.9' },
    Bad: { color: '#FF4D00', bg: 'rgba(255,77,0,0.1)', border: 'rgba(255,77,0,0.22)', glow: 'transparent', range: '3.0 - 3.9' },
    Terrible: { color: '#FF0000', bg: 'rgba(255,0,0,0.12)', border: 'rgba(255,0,0,0.28)', glow: 'transparent', range: '2.0 - 2.9' },
    Disaster: { color: '#990000', bg: 'rgba(153,0,0,0.12)', border: 'rgba(153,0,0,0.28)', glow: 'transparent', range: '1.0 - 1.9' },
    Abomination: { color: '#2D0000', bg: 'rgba(45,0,0,0.15)', border: 'rgba(45,0,0,0.32)', glow: 'transparent', range: '0.0 - 0.9' },
};
const getV = (v) => VERDICT_MAP[v] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', glow: 'transparent' };

const ASPECT_GROUPS = [
    { name: 'Narrative', icon: QuoteIcon, color: '#818cf8', aspects: ['story', 'screenplay', 'thematic_depth', 'originality', 'opening_climax'] },
    { name: 'Direction', icon: Zap, color: '#f59e0b', aspects: ['vision', 'blocking_staging', 'pacing', 'executive_control'] },
    { name: 'Acting', icon: Target, color: '#10b981', aspects: ['performance', 'chemistry', 'presence', 'casting'] },
    { name: 'Visuals', icon: Camera, color: '#34d399', aspects: ['cinematography', 'production_design', 'visual_storytelling'] },
    { name: 'Music', icon: Music, color: '#f472b6', aspects: ['score', 'sound_design', 'silence', 'soundtrack'] },
    { name: 'Soul', icon: Heart, color: '#fb7185', aspects: ['emotional_impact', 'rewatch_value', 'immersion', 'resonance'] },
];

const toLabel = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const scoreColor = (n) => {
    n = parseFloat(n) || 0;
    if (n >= 9.6) return '#FFFFFF'; // Legendary
    if (n >= 9.2) return '#FFD700'; // Masterpiece
    if (n >= 8.8) return '#FF00EA'; // Essential
    if (n >= 8.4) return '#9D00FF'; // Elite
    if (n >= 8.0) return '#00FF44'; // Great
    if (n >= 7.5) return '#8FFF00'; // Good
    if (n >= 7.0) return '#00D0FF'; // Decent
    if (n >= 6.0) return '#849BB3'; // Average
    if (n >= 5.0) return '#FFFB00'; // Mediocre
    if (n >= 4.0) return '#FF9100'; // Poor
    if (n >= 3.0) return '#FF4D00'; // Bad
    if (n >= 2.0) return '#FF0000'; // Terrible
    if (n >= 1.0) return '#990000'; // Disaster
    return '#2D0000'; // Abomination
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
                    <span style={{ fontSize: '18px', fontWeight: 900, color: group.color, lineHeight: 1 }}>{avg.toFixed(2)}</span>
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
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);
    const [ratingTimeline, setRatingTimeline] = useState(null);


    // Dynamic Color Harmonization
    const { resetAtmosphere } = useColorHarmonizer(review?.movie_poster_url ? proxyImage(review.movie_poster_url) : null);

    // Reset atmosphere when leaving the detail page
    useEffect(() => {
        return () => {
            resetAtmosphere();
        };
    }, [resetAtmosphere]);

    // Robust YouTube ID extraction
    const getEmbedUrl = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
        return '';
    };

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
                console.log("[DEBUG] Review data in Detail:", data);
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

    useEffect(() => {
        const targetId = review?.movie_id || review?.imdb_id || (review?.movie?.tmdb_id) || (review?.movie?.imdb_id);
        if (targetId) {
            getRatingTimeline(targetId)
                .then(res => setRatingTimeline(res.data))
                .catch(() => setRatingTimeline(null));
        }
    }, [review]);

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
            
            if (Capacitor.isNativePlatform()) {
                Haptics.impact({ style: ImpactStyle.Light }).catch(() => Haptics.vibrate());
            }

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

            if (Capacitor.isNativePlatform()) {
                Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => Haptics.vibrate());
            }

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

    const handleShare = async () => {
        const textToCopy = `https://critiquetemplesanctuary.vercel.app/review/${review.slug}`;
        
        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: review.movie_title,
                text: `Check out this cinematic critique of ${review.movie_title}!`,
                url: textToCopy,
                dialogTitle: 'Share Review'
            });
        } else {
            try {
                await navigator.clipboard?.writeText(textToCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (e) {
                console.error("Failed to copy", e);
            }
        }
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

    const derivedVerdict = getVerdictFromScore(review.overall_rating);
    const vc = getV(derivedVerdict);
    const aspects = review.aspects || {};
    const hasAspects = Object.values(aspects).some(a => a && parseFloat(a?.score) > 0);
    const wordCount = review.content ? review.content.split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const groupAverages = ASPECT_GROUPS.map(g => {
        const scores = g.aspects.map(k => aspects[k]).filter(a => a && parseFloat(a?.score) > 0).map(a => parseFloat(a.score));
        return { ...g, avg: scores.length ? scores.reduce((a, b) => a + b) / scores.length : null };
    }).filter(g => g.avg !== null);

    const radarData = Object.entries(aspects).map(([key, val]) => ({
        subject: toLabel(key),
        A: parseFloat(val?.score || 0),
        fullMark: 10
    })).filter(d => d.A > 0);

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
                    <h1 className="display" style={{ fontSize: 'clamp(24px, 10vw, 64px)', fontWeight: 800, color: '#f2f2f2', lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: '8px' }}>
                        {review.movie_title}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: 'clamp(11px, 3vw, 13px)', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
                        {review.content_type === 'tv' && (
                            <span style={{ color: 'var(--accent-primary, rgba(245,166,35,0.6))', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>TV Show &bull;</span>
                        )}
                        {review.movie_year && <span>{review.movie_year}</span>}
                        {review.language && (
                            <>
                                <span style={{ color: 'rgba(255,255,255,0.1)' }}>&bull;</span>
                                <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 600 }}>{review.language}</span>
                            </>
                        )}
                        {review.trailer_url && (
                            <>
                                <span style={{ color: 'rgba(255,255,255,0.1)' }}>&bull;</span>
                                <button
                                    onClick={() => setIsTrailerOpen(true)}
                                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-primary, #f5a623)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    className="hover:brightness-125 transition-all"
                                >
                                    <Film size={12} /> Watch Glimpse
                                </button>
                            </>
                        )}
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
                            <motion.img
                                layoutId={`poster-${review.slug}`}
                                src={src}
                                alt={review.movie_title}
                                onError={() => setSrc(FALLBACK)}
                                style={{ width: '100%', display: 'block' }}
                            />
                        </div>

                        {/* Score + verdict card */}
                        <div style={{
                            borderRadius: '16px', padding: 'clamp(16px, 4vw, 24px) clamp(12px, 3vw, 20px)', textAlign: 'center',
                            background: vc.glow !== 'transparent' ? `linear-gradient(135deg, ${vc.glow}, rgba(17,17,17,0))` : '#111',
                            border: `1px solid ${vc.border}`,
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>Overall Score</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
                                <Star size={18} fill="#f5a623" color="#f5a623" style={{ marginBottom: '4px' }} />
                                <span style={{ fontSize: 'clamp(40px, 12vw, 56px)', fontWeight: 900, color: '#f5a623', lineHeight: 1, letterSpacing: '-0.04em' }}>
                                    {parseFloat(review.overall_rating || 0).toFixed(2)}
                                </span>
                                <span style={{ fontSize: 'clamp(14px, 4vw, 18px)', color: 'rgba(255,255,255,0.18)', fontWeight: 400 }}>/10</span>
                            </div>
                            <span style={{
                                display: 'inline-block', padding: '4px 16px', borderRadius: '99px',
                                fontSize: 'clamp(9px, 2.5vw, 11px)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                                background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`,
                            }}>
                                {derivedVerdict}
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
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: g.color, width: '28px', textAlign: 'right' }}>{g.avg.toFixed(2)}</span>
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

                        {/* Temple Verdict Legend */}
                        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '16px' }}>Temple Verdict Scale</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    'Legendary', 'Masterpiece', 'Essential', 'Elite', 'Great',
                                    'Good', 'Decent', 'Average', 'Mediocre', 'Poor',
                                    'Bad', 'Terrible', 'Disaster', 'Abomination'
                                ].map(v => (
                                    <div key={v} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: VERDICT_MAP[v].color, boxShadow: `0 0 8px ${VERDICT_MAP[v].color}40` }} />
                                            <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{v}</span>
                                        </div>
                                        <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.2)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{VERDICT_MAP[v].range}</span>
                                    </div>
                                ))}
                            </div>
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
                                style={{ position: 'relative', padding: 'clamp(20px, 5vw, 32px)', background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.12)', borderRadius: '16px', borderLeft: '3px solid #f5a623' }}
                            >
                                <div style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, fontFamily: 'Playfair Display, Georgia, serif' }}>
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
                                <div style={{ fontSize: 'clamp(14px, 3.5vw, 15px)', fontWeight: 300, color: 'rgba(255,255,255,0.52)', lineHeight: 1.9, whiteSpace: 'pre-wrap', letterSpacing: '0.01em' }}>
                                    {review.content}
                                </div>
                            </motion.div>
                        )}

                        {/* Rating Evolution */}
                        {ratingTimeline && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <RatingTimelineGraph data={ratingTimeline} />
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

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                    <Link
                                        to={`/compare?c1=${review._id}`}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 16px',
                                            borderRadius: '10px',
                                            background: 'rgba(245,166,35,0.1)',
                                            border: '1px solid rgba(245,166,35,0.2)',
                                            color: '#f5a623',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            textDecoration: 'none',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.2)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(245,166,35,0.2)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <Sword size={12} />
                                        Launch Duel
                                    </Link>
                                </div>

                                {/* Radar Chart Integration */}
                                <div style={{ height: 'clamp(280px, 70vw, 380px)', width: '100%', display: 'block', minHeight: '280px', position: 'relative' }}>
                                    <ResponsiveContainer width="99%" height="99%" minHeight={280}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 10]} axisLine={false} tick={false} />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div style={{
                                                                background: 'rgba(15, 15, 15, 0.85)',
                                                                backdropFilter: 'blur(12px)',
                                                                border: `1px solid ${vc.color}40`,
                                                                padding: '12px 16px',
                                                                borderRadius: '12px',
                                                                boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${vc.color}10`,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '4px'
                                                            }}>
                                                                <div style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{data.subject}</div>
                                                                <div style={{ fontSize: '20px', fontWeight: 900, color: vc.color, fontFamily: 'serif', fontStyle: 'italic' }}>{data.A.toFixed(2)}<span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontStyle: 'normal', marginLeft: '4px' }}>/ 10</span></div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Radar
                                                name="Score"
                                                dataKey="A"
                                                stroke={vc.color}
                                                fill={vc.color}
                                                fillOpacity={0.35}
                                                dot={{ r: 4, fill: vc.color, fillOpacity: 0.8, stroke: '#fff', strokeWidth: 1 }}
                                                activeDot={{ r: 6, fill: '#fff', stroke: vc.color, strokeWidth: 2 }}
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
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, color: '#f5a623' }}>{parseFloat(r.overall_rating).toFixed(2)}</div>
                                            </div>
                                            <div style={{ padding: '16px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f2f2f2', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.movie_title}</div>
                                                <div style={{ fontSize: '11px', color: getV(getVerdictFromScore(r.overall_rating)).color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{getVerdictFromScore(r.overall_rating)}</div>
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

            {/* Cinematic Trailer Modal */}
            <AnimatePresence>
                {isTrailerOpen && review.trailer_url && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsTrailerOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1000,
                            background: 'rgba(0,0,0,0.92)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: '1000px',
                                aspectRatio: '16/9',
                                background: '#000',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <iframe
                                width="100%"
                                height="100%"
                                src={getEmbedUrl(review.trailer_url)}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </motion.div>
                        <button
                            onClick={() => setIsTrailerOpen(false)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px' }}
                        >
                            ×
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    );
}
