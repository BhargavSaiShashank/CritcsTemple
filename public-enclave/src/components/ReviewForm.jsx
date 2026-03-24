import React, { useState, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Star, Quote, AlignLeft, Layout, Zap, Heart, Music, Camera, Plus, Loader2, Sparkles, Download, Eye } from 'lucide-react'
import { draftVerdict, createReview, updateReview } from '../services/api'
import SanctuaryCard from './SanctuaryCard';
import html2canvas from 'html2canvas';

const aspectGroups = [
    {
        name: 'Narrative',
        icon: <Quote size={18} />,
        aspects: ['story', 'screenplay', 'originality', 'opening', 'climax', 'thematic_depth']
    },
    {
        name: 'Direction',
        icon: <Zap size={18} />,
        aspects: ['direction', 'acting', 'blocking_staging']
    },
    {
        name: 'Visuals',
        icon: <Camera size={18} />,
        aspects: ['cinematography', 'editing', 'production_design', 'vfx', 'visual_storytelling']
    },
    {
        name: 'Audio',
        icon: <Music size={18} />,
        aspects: ['bg_score', 'music', 'sound_design']
    },
    {
        name: 'Soul',
        icon: <Heart size={18} />,
        aspects: ['pacing', 'emotional_impact', 'rewatch_value', 'immersion']
    }
]

const ReviewForm = ({ movie, onSubmit, loading }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [formData, setFormData] = useState({
        summary: '',
        content: '',
        verdict: 'Good',
        status: 'published',
        is_featured: false,
        cast_performances: '',
        director_trademarks: '',
        viewing_context: '',
        trivia_and_details: '',
        tags: [],
        micro_calibration: null,
        aspects: aspectGroups.flatMap(g => g.aspects).reduce((acc, aspect) => ({
            ...acc, [aspect]: { score: 0, comment: '' }
        }), {})
    })
    const [newTag, setNewTag] = useState('')
    const [activeGroup, setActiveGroup] = useState(0)
    const [aiLoading, setAiLoading] = useState(false)

    const handleAIDraft = async () => {
        setAiLoading(true)
        try {
            const { data } = await draftVerdict(formData.aspects)
            setFormData(prev => ({ ...prev, content: data.draft }))
        } catch (err) {
            console.error("AI Drafting failed:", err)
        } finally {
            setAiLoading(false)
        }
    }

    const handleExportCard = async () => {
        if (!cardRef.current) return;
        setExportLoading(true);
        try {
            // Small delay to ensure any internal rendering/images are settled
            await new Promise(r => setTimeout(r, 200));

            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0a0a0a',
                logging: true, // Enable logging to debug non-finite issues
                onclone: (doc) => {
                    // Force the cloned element to be visible and stable
                    const el = doc.querySelector('[data-sanctuary-card]');
                    if (el) {
                        el.style.position = 'relative';
                        el.style.left = '0';
                        el.style.top = '0';
                        el.style.display = 'flex';
                        el.style.width = '600px';
                        el.style.height = '840px';
                        el.style.visibility = 'visible';
                        el.style.opacity = '1';
                    }

                    // Remove all stylesheets that might contain oklab/oklch to prevent html2canvas crash
                    const styles = doc.getElementsByTagName('style');
                    for (let i = styles.length - 1; i >= 0; i--) {
                        if (styles[i].innerHTML.includes('oklab') || styles[i].innerHTML.includes('oklch')) {
                            styles[i].remove();
                        }
                    }

                    // Keep font links, but remove tailwind/other links that might break layout or crash
                    const links = doc.getElementsByTagName('link');
                    for (let i = links.length - 1; i >= 0; i--) {
                        if (links[i].rel === 'stylesheet' && !links[i].href.includes('fonts.googleapis.com')) {
                            links[i].remove();
                        }
                    }
                }
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            const safeTitle = (movie.title || 'Sanctuary-Verdict').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

            link.setAttribute('href', dataUrl);
            link.setAttribute('download', `SanctuaryCard - ${safeTitle}.png`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Sanctuary Card Export failed:", err);
            window.alert(`Lexical Export Fragmented: ${err.message || 'System Failure'}. Ensure images are loaded.`);
        } finally {
            setExportLoading(false);
        }
    }

    const averageScore = useMemo(() => {
        const aspects = formData.aspects || {};

        const categories = {
            'Narrative': { keys: ['story', 'screenplay', 'originality', 'opening', 'climax', 'thematic_depth'], weight: 0.35 },
            'Direction': { keys: ['direction', 'acting', 'blocking_staging'], weight: 0.25 },
            'Visuals': { keys: ['cinematography', 'editing', 'production_design', 'vfx', 'visual_storytelling'], weight: 0.15 },
            'Audio': { keys: ['bg_score', 'music', 'sound_design'], weight: 0.10 },
            'Soul': { keys: ['pacing', 'emotional_impact', 'rewatch_value', 'immersion'], weight: 0.15 }
        };

        let weightedScore = 0.0;
        let activeWeightTotal = 0.0;
        let catAverages = {};

        // Step 1: Category Averages & Base Weighted Score
        for (const [catName, info] of Object.entries(categories)) {
            const catScores = [];
            for (const key of info.keys) {
                if (aspects[key] && isFinite(parseFloat(aspects[key].score))) {
                    const scoreVal = parseFloat(aspects[key].score);
                    if (scoreVal > 0) {
                        catScores.push(scoreVal);
                    }
                }
            }
            if (catScores.length > 0) {
                const catAvg = catScores.reduce((a, b) => a + b, 0) / catScores.length;
                catAverages[catName] = catAvg;
                weightedScore += (catAvg * info.weight);
                activeWeightTotal += info.weight;
            }
        }

        if (activeWeightTotal === 0) return "0.00";

        const baseScore = weightedScore / activeWeightTotal;
        let finalScore = baseScore;

        // Step 2: Foundation Penalty
        const narrativeAvg = catAverages['Narrative'] || 0;
        const directionAvg = catAverages['Direction'] || 0;
        const soulAvg = catAverages['Soul'] || 0;

        if (narrativeAvg < 6.5) finalScore -= 0.15;
        if (directionAvg < 6.5) finalScore -= 0.10;
        if (soulAvg < 6.0) finalScore -= 0.05;

        // Step 3: Refined Variance Penalty
        const catVals = Object.values(catAverages);
        if (catVals.length > 0 && Math.min(...catVals) < 7.0) {
            const maxCat = Math.max(...catVals);
            const minCat = Math.min(...catVals);
            const gap = maxCat - minCat;
            if (gap >= 3.0) finalScore -= 0.10;
            else if (gap >= 2.0) finalScore -= 0.05;
        }

        // Step 4: Controlled Boosts
        let boost = 0.0;
        if (catVals.length === 5) {
            if (catVals.every(v => v >= 8.5)) boost += 0.07;
            else if (catVals.filter(v => v >= 8.3).length >= 3) boost += 0.03;
        }
        finalScore += boost;

        // Step 5: Micro-Calibration (New)
        if (formData.micro_calibration === "Soul" && soulAvg >= 9.0) finalScore += 0.02;
        else if (formData.micro_calibration === "Narrative" && narrativeAvg >= 9.0) finalScore += 0.02;

        // Step 6: Soul Gate
        if (soulAvg < 7.0 && finalScore > 8.5) finalScore = 8.5;

        // Final Ceiling
        if (finalScore > 9.70) finalScore = 9.70;

        // Clamp 0-10
        finalScore = Math.max(0, Math.min(10, finalScore));

        return finalScore.toFixed(2);
    }, [formData.aspects, formData.micro_calibration])

    const handleAspectChange = (aspect, field, value) => {
        setFormData(prev => ({
            ...prev,
            aspects: {
                ...prev.aspects,
                [aspect]: { ...prev.aspects[aspect], [field]: value }
            }
        }))
    }

    const handleImprinting = async (status) => {
        setSubmitting(true);

        // Generate slug from movie title
        const slug = (movie.title || 'review')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

        // Backend enum is Title Case e.g. "Masterpiece", not "MASTERPIECE"
        const normalizeVerdict = (v) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();

        // Filter aspects: only send ones with a score > 0
        const cleanedAspects = Object.fromEntries(
            Object.entries(formData.aspects)
                .filter(([, val]) => parseFloat(val.score) > 0)
                .map(([key, val]) => [key, { score: parseFloat(val.score), comment: val.comment || '' }])
        );

        const payload = {
            ...formData,
            verdict: normalizeVerdict(formData.verdict),
            aspects: cleanedAspects,
            slug,
            status,
            movie_id: parseInt(movie.id) || 0,
            movie_title: movie.title,
            movie_poster_url: movie.poster_url,
            overall_rating: parseFloat(averageScore)
        };

        try {
            if (id && id !== 'new') {
                await updateReview(id, payload);
            } else {
                await createReview(payload);
            }
            if (onSubmit) onSubmit();
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to save review:", err);
            const detail = err.response?.data?.detail;
            const msg = Array.isArray(detail)
                ? detail.map(d => `${d.loc?.join('.')} — ${d.msg} `).join('\n')
                : JSON.stringify(detail) || err.message;
            window.alert(`Imprint Failed: \n\n${msg} `);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault()
            if (!formData.tags.includes(newTag.trim())) {
                setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] })
            }
            setNewTag('')
        }
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-20 pb-24 font-premium px-4 md:px-0">
            {/* Aspect Controller */}
            <div className="xl:col-span-4 space-y-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative glass-obsidian rounded-[42px] p-12 text-center group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <Sparkles className="mx-auto mb-4 md:mb-6 text-amber-500/40 animate-pulse" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 mb-4">Temple Accuracy</p>
                    <div className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-4 italic drop-shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                        {averageScore}
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-4" />
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em]">Master Distinction</p>
                </motion.div>

                <nav className="glass-obsidian rounded-[42px] p-4 space-y-2 border-white/5">
                    {aspectGroups.map((group, idx) => (
                        <button
                            key={group.name}
                            onClick={() => setActiveGroup(idx)}
                            className={`w - full flex items - center justify - between p - 6 rounded - 3xl transition - all duration - 500 group relative overflow - hidden ${activeGroup === idx
                                ? 'bg-amber-500 text-black shadow-2xl shadow-amber-500/20'
                                : 'hover:bg-white/5 text-white/30 hover:text-white'
                                } `}
                        >
                            <div className="flex items-center gap-5 relative z-10">
                                {group.icon}
                                <span className="font-black text-[10px] uppercase tracking-[0.3em]">{group.name}</span>
                            </div>
                            {activeGroup === idx && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600" />}
                            <ChevronRight size={18} className={activeGroup === idx ? 'relative z-10' : 'opacity-0'} />
                        </button>
                    ))}
                </nav>

            </div>

            {/* Detail Input */}
            <div className="xl:col-span-8 space-y-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeGroup}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 150 }}
                        className="glass-obsidian rounded-[40px] md:rounded-[60px] p-8 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 md:p-12 text-white/[0.02] font-black text-7xl md:text-9xl pointer-events-none select-none italic">
                            {activeGroup + 1}
                        </div>
                        {aspectGroups[activeGroup].aspects.map(aspect => (
                            <div key={aspect} className="space-y-6 group/item">
                                <div className="flex justify-between items-end px-1">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500/40 group-hover/item:text-amber-500 transition-colors">{aspect.replace(/_/g, ' ')}</label>
                                    <span className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">{formData.aspects[aspect].score}</span>
                                </div>
                                <input
                                    type="range" min="0" max="10" step="0.1"
                                    value={formData.aspects[aspect].score}
                                    onChange={e => handleAspectChange(aspect, 'score', parseFloat(e.target.value))}
                                    className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500"
                                />
                                <textarea
                                    placeholder="Add precision thought..."
                                    value={formData.aspects[aspect].comment}
                                    onChange={e => handleAspectChange(aspect, 'comment', e.target.value)}
                                    className="w-full bg-transparent text-sm text-white/30 outline-none border-l border-white/5 focus:border-amber-500/30 pl-6 py-2 h-16 transition-all resize-none italic group-hover/item:text-white/60"
                                />
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                <div className="glass-obsidian rounded-[40px] md:rounded-[60px] p-8 md:p-16 space-y-12 md:space-y-16">
                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">The Essence</label>
                        <input
                            value={formData.summary}
                            onChange={e => setFormData({ ...formData, summary: e.target.value })}
                            placeholder="Capture the soul..."
                            className="w-full bg-transparent border-b border-white/5 py-4 md:py-8 text-2xl md:text-4xl font-black text-white outline-none focus:border-amber-500/30 transition-all placeholder:text-white/5 tracking-tighter italic"
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">The Ritual (Critique)</label>
                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    onClick={handleAIDraft}
                                    disabled={aiLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all disabled:opacity-50"
                                >
                                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    Generate AI Verdict
                                </button>
                                <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.5em]">Markdown Engaged</span>
                            </div>
                        </div>
                        <textarea
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Enter the void... write with absolute precision."
                            className="w-full bg-white/[0.01] border border-white/5 rounded-[32px] md:rounded-[40px] p-6 md:p-12 min-h-[400px] md:min-h-[600px] outline-none focus:border-amber-500/20 transition-all placeholder:text-white/2 leading-relaxed text-lg md:text-2xl font-medium"
                        />
                    </div>

                    {/* Cinematic Lore (Optional Deep Dives) */}
                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">Cinematic Lore (Optional Details)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <textarea
                                value={formData.cast_performances}
                                onChange={e => setFormData({ ...formData, cast_performances: e.target.value })}
                                placeholder="Cast Performances..."
                                className="bg-white/[0.01] border border-white/5 rounded-[24px] p-6 min-h-[120px] outline-none focus:border-amber-500/20 transition-all placeholder:text-white/20 text-sm md:text-base font-medium resize-none"
                            />
                            <textarea
                                value={formData.director_trademarks}
                                onChange={e => setFormData({ ...formData, director_trademarks: e.target.value })}
                                placeholder="Director Trademarks & Style..."
                                className="bg-white/[0.01] border border-white/5 rounded-[24px] p-6 min-h-[120px] outline-none focus:border-amber-500/20 transition-all placeholder:text-white/20 text-sm md:text-base font-medium resize-none"
                            />
                            <textarea
                                value={formData.viewing_context}
                                onChange={e => setFormData({ ...formData, viewing_context: e.target.value })}
                                placeholder="Recommended Viewing Context (e.g. IMAX, Late Night)..."
                                className="bg-white/[0.01] border border-white/5 rounded-[24px] p-6 min-h-[120px] outline-none focus:border-amber-500/20 transition-all placeholder:text-white/20 text-sm md:text-base font-medium resize-none"
                            />
                            <textarea
                                value={formData.trivia_and_details}
                                onChange={e => setFormData({ ...formData, trivia_and_details: e.target.value })}
                                placeholder="Trivia & Hidden Details..."
                                className="bg-white/[0.01] border border-white/5 rounded-[24px] p-6 min-h-[120px] outline-none focus:border-amber-500/20 transition-all placeholder:text-white/20 text-sm md:text-base font-medium resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 px-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">Chronicle Tags</label>
                        <div className="flex flex-wrap gap-3">
                            {formData.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 text-white/40 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] group hover:border-amber-500/50 hover:text-amber-500 transition-all">
                                    #{tag}
                                    <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })} className="hover:text-red-500 transition-colors">×</button>
                                </span>
                            ))}
                            <div className="relative w-full sm:w-auto">
                                <input
                                    value={newTag}
                                    onChange={e => setNewTag(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    placeholder="Define Tags..."
                                    className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-[9px] font-black uppercase tracking-widest outline-none focus:border-amber-500/20 transition-all w-full sm:w-60"
                                />
                                <Plus size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">Micro-Calibration (Divine Adjustment)</label>
                        <div className="flex gap-3">
                            {['None', 'Soul', 'Narrative'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, micro_calibration: type === 'None' ? null : type })}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        (formData.micro_calibration === type || (type === 'None' && !formData.micro_calibration))
                                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <p className="text-[9px] text-white/20 italic">Manual +0.02 boost if specific peaks are met (Soul or Narrative ≥ 9.0).</p>
                    </div>

                    <div className="py-12 border-y border-white/5 space-y-10">
                        <div className="space-y-8">
                            <label className="text-[10px] font-black uppercase tracking-[0.6em] text-amber-500/40">The Final Verdict</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {[
                                    'Legendary', 'Masterpiece', 'Essential',
                                    'Elite', 'Great', 'Good',
                                    'Decent', 'Average', 'Mediocre',
                                    'Poor', 'Bad', 'Terrible',
                                    'Disaster', 'Abomination', 'Unwatchable'
                                ].map(v => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, verdict: v })}
                                        className={`py - 6 rounded - 2xl border text - [9px] font - black uppercase tracking - [0.2em] transition - all duration - 500 ${formData.verdict === v
                                            ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.3)] scale-105 z-10'
                                            : 'bg-white/5 border-white/10 text-white/20 hover:border-white/30 hover:text-white'
                                            } `}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center gap-8 cursor-pointer group w-fit">
                            <div className={`w - 10 h - 10 rounded - 2xl border flex items - center justify - center transition - all duration - 700 ${formData.is_featured ? 'bg-amber-500 border-amber-500 rotate-12 scale-110 shadow-[0_0_30px_rgba(245,158,11,0.4)]' : 'bg-white/5 border-white/10 group-hover:border-amber-500/30'
                                } `}>
                                {formData.is_featured && <Star size={18} className="text-black fill-black" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={formData.is_featured}
                                onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                            />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-amber-500 transition-colors">Featured Sanctuary Post</p>
                                <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest">Mark this critique for the main archives</p>
                            </div>
                        </label>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 pt-10">
                        <button
                            onClick={() => handleImprinting('draft')}
                            disabled={submitting}
                            className="flex-1 py-8 bg-white/5 hover:bg-white/10 text-white/20 hover:text-white rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] transition-all border border-white/5"
                        >
                            {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Archive to Ruins'}
                        </button>
                        <button
                            onClick={handleExportCard}
                            disabled={exportLoading}
                            className="flex-1 py-8 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500/60 hover:text-amber-500 rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] transition-all border border-amber-500/10 flex items-center justify-center gap-4 group"
                        >
                            {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} className="group-hover:bounce" />}
                            Export Sanctuary Card
                        </button>
                        <button
                            onClick={() => handleImprinting('published')}
                            disabled={submitting}
                            className="flex-[2] py-8 bg-gradient-to-r from-amber-500 to-amber-700 text-black rounded-[32px] font-black uppercase tracking-[0.4em] text-xs transition-all shadow-[0_20px_60px_rgba(245,158,11,0.3)] hover:shadow-[0_20px_80px_rgba(245,158,11,0.5)] transform hover:-translate-y-2 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-4 group"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <Sparkles size={20} className="group-hover:animate-spin" />
                                    IMPRINT ON THE TEMPLE
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div
                className="w-full flex justify-center"
                style={{
                    position: 'absolute',
                    top: '-10000px',
                    left: '0',
                    opacity: '0',
                    pointerEvents: 'none',
                    zIndex: -1
                }}
            >
                <div style={{ width: '600px' }}>
                    <SanctuaryCard
                        movie={{
                            title: movie.title,
                            poster: movie.poster_url,
                            year: movie.release_year,
                            director: movie.director || 'Visionary',
                            runtime: movie.runtime,
                            genre: movie.genres?.[0] || movie.genre
                        }}
                        review={{
                            ...formData,
                            overall_rating: averageScore,
                            id: 'PREVIEW-IMPRINT'
                        }}
                        cardRef={cardRef}
                    />
                </div>
            </div>
        </div>
    )
}

export default ReviewForm
