import React, { useState, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Star, Quote, AlignLeft, Layout, Zap, Heart, Music, Camera, Plus, Loader2, Sparkles, Download, Eye, MoreVertical, X, Globe } from 'lucide-react'
import { createReview, updateReview, getProxyImageUrl } from '../services/api'
import SanctuaryCard from './SanctuaryCard';
import PublicPreview from './PublicPreview';
import html2canvas from 'html2canvas';

const aspectGroups = [
    {
        name: 'Narrative',
        icon: <Quote size={18} />,
        aspects: ['story', 'screenplay', 'originality', 'opening', 'climax']
    },
    {
        name: 'Direction',
        icon: <Zap size={18} />,
        aspects: ['direction', 'acting', 'dialogues']
    },
    {
        name: 'Visuals',
        icon: <Camera size={18} />,
        aspects: ['cinematography', 'editing', 'production_design', 'vfx']
    },
    {
        name: 'Audio',
        icon: <Music size={18} />,
        aspects: ['bg_score', 'music']
    },
    {
        name: 'Soul',
        icon: <Heart size={18} />,
        aspects: ['pacing', 'emotional_impact', 'rewatch_value']
    }
]

const ReviewForm = ({ movie, onSubmit, loading, initialData }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const draftKey = useMemo(() => {
        if (id && id !== 'new') return `review_draft_edit_${id}`;
        if (movie && (movie.imdb_id || movie.id)) return `review_draft_movie_${movie.imdb_id || movie.id}`;
        return 'review_draft_new';
    }, [id, movie]);

    const [formData, setFormData] = useState(() => {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                return JSON.parse(savedDraft);
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        }

        const defaultAspects = aspectGroups.flatMap(g => g.aspects).reduce((acc, aspect) => ({
            ...acc, [aspect]: { score: 0, comment: '' }
        }), {});

        if (initialData) {
            return {
                summary: initialData.summary || '',
                movie_title: initialData.movie_title || '',
                content: initialData.content || '',
                verdict: initialData.verdict || 'Good',
                status: initialData.status || 'published',
                is_featured: initialData.is_featured || false,
                author: initialData.author || '',
                watch_links: initialData.watch_links || '',
                movie_poster_url: initialData.movie_poster_url || '',
                cast_performances: initialData.cast_performances || '',
                director_trademarks: initialData.director_trademarks || '',
                viewing_context: initialData.viewing_context || '',
                trivia_and_details: initialData.trivia_and_details || '',
                tags: initialData.tags || [],
                language: initialData.language || '',
                trailer_url: initialData.trailer_url || '',
                movie_year: initialData.movie_year || '',
                scheduled_date: initialData.scheduled_date ? initialData.scheduled_date.slice(0, 16) : '',
                content_type: initialData.content_type || 'movie',
                aspects: { ...defaultAspects, ...(initialData.aspects || {}) }
            };
        }

        return {
            summary: '',
            movie_title: movie?.title || '',
            content: '',
            verdict: '',
            status: 'published',
            is_featured: false,
            author: '',
            watch_links: '',
            movie_poster_url: '',
            cast_performances: '',
            director_trademarks: '',
            viewing_context: '',
            trivia_and_details: '',
            tags: [],
            language: '',
            trailer_url: movie?.trailer_url || '',
            movie_year: movie?.release_year || '',
            scheduled_date: '',
            content_type: movie?.content_type || 'movie',
            aspects: defaultAspects
        };
    });

    React.useEffect(() => {
        localStorage.setItem(draftKey, JSON.stringify(formData));
    }, [formData, draftKey]);

    // Reload form data if draftKey changes (e.g. user selects a different draft in dashboard)
    React.useEffect(() => {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setFormData(prev => ({
                    ...prev,
                    ...parsed,
                    // Ensure the title is synced if it was missing in the draft but present in the movie prop
                    movie_title: parsed.movie_title || movie?.title || prev.movie_title
                }));
            } catch (e) {
                console.error("Failed to parse draft on key change", e);
            }
        }
    }, [draftKey]);

    const [newTag, setNewTag] = useState('')
    const [activeGroup, setActiveGroup] = useState(0)
    const [activeAspectIdx, setActiveAspectIdx] = useState(0)
    const [langSearch, setLangSearch] = useState('')
    const [showLangSuggestions, setShowLangSuggestions] = useState(false)

    const ALL_LANGUAGES = useMemo(() => [
        { code: 'en', name: 'English' },
        { code: 'te', name: 'Telugu' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ta', name: 'Tamil' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'kn', name: 'Kannada' },
        { code: 'es', name: 'Spanish' },
        { code: 'ko', name: 'Korean' },
        { code: 'ja', name: 'Japanese' },
        { code: 'fr', name: 'French' },
        { code: 'it', name: 'Italian' },
        { code: 'de', name: 'German' },
        { code: 'ru', name: 'Russian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ar', name: 'Arabic' }
    ], []);

    const filteredLanguages = useMemo(() => {
        if (!langSearch) return ALL_LANGUAGES;
        return ALL_LANGUAGES.filter(l => 
            l.name.toLowerCase().includes(langSearch.toLowerCase()) || 
            l.code.toLowerCase().includes(langSearch.toLowerCase())
        );
    }, [langSearch, ALL_LANGUAGES]);

    const currentLanguageName = useMemo(() => {
        return ALL_LANGUAGES.find(l => l.code === formData.language)?.name || formData.language || 'Auto Detect';
    }, [formData.language, ALL_LANGUAGES]);

    // Reset aspect index when group changes
    React.useEffect(() => {
        setActiveAspectIdx(0);
    }, [activeGroup]);

    // Keyboard Shortcuts (Kinetic Scoring)
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Numbers 1-9 for scoring the active aspect
            if (e.key >= '1' && e.key <= '9' && !(['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) {
                const activeAspects = aspectGroups[activeGroup].aspects;
                const aspectKey = activeAspects[activeAspectIdx];
                if (aspectKey) {
                    handleAspectChange(aspectKey, 'score', parseFloat(e.key));
                }
            }

            // '0' for a perfect 10
            if (e.key === '0' && !(['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) {
                const activeAspects = aspectGroups[activeGroup].aspects;
                const aspectKey = activeAspects[activeAspectIdx];
                if (aspectKey) {
                    handleAspectChange(aspectKey, 'score', 10);
                }
            }

            // Up/Down Arrows to adjust score precisely
            if (!(['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) {
                const activeAspects = aspectGroups[activeGroup].aspects;
                const aspectKey = activeAspects[activeAspectIdx];
                const currentScore = parseFloat(formData.aspects[aspectKey]?.score || 0);

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleAspectChange(aspectKey, 'score', Math.min(10, currentScore + 0.1).toFixed(1));
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleAspectChange(aspectKey, 'score', Math.max(0, currentScore - 0.1).toFixed(1));
                }
            }

            // Tab / Shift+Tab to cycle aspects in group
            if (e.key === 'Tab' && !(['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) {
                e.preventDefault();
                const count = aspectGroups[activeGroup].aspects.length;
                if (e.shiftKey) {
                    setActiveAspectIdx(prev => (prev - 1 + count) % count);
                } else {
                    setActiveAspectIdx(prev => (prev + 1) % count);
                }
            }

            // Shift + Arrows to cycle groups
            if (e.shiftKey) {
                if (e.key === 'ArrowRight') {
                    setActiveGroup(prev => (prev + 1) % aspectGroups.length);
                } else if (e.key === 'ArrowLeft') {
                    setActiveGroup(prev => (prev - 1 + aspectGroups.length) % aspectGroups.length);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeGroup, activeAspectIdx, formData.aspects]);

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
            link.setAttribute('download', `SanctuaryCard-${safeTitle}.png`);
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
            'Narrative': { keys: ['story', 'screenplay', 'originality', 'opening', 'climax'], weight: 0.25 },
            'Direction': { keys: ['direction', 'acting', 'dialogues'], weight: 0.25 },
            'Soul': { keys: ['pacing', 'emotional_impact', 'rewatch_value'], weight: 0.20 },
            'Visuals': { keys: ['cinematography', 'editing', 'production_design', 'vfx'], weight: 0.15 },
            'Audio': { keys: ['bg_score', 'music'], weight: 0.15 }
        };

        let weightedScore = 0.0;
        let activeWeightTotal = 0.0;
        let craftPenalty = 0.0;
        let catAverages = {};

        // Step 1: Base Score & Craft Penalty
        for (const [catName, info] of Object.entries(categories)) {
            const catScores = [];
            for (const key of info.keys) {
                if (aspects[key] && isFinite(parseFloat(aspects[key].score))) {
                    const scoreVal = parseFloat(aspects[key].score);
                    if (scoreVal > 0) {
                        catScores.push(scoreVal);
                        if (scoreVal <= 4.5) {
                            craftPenalty += 0.03;
                        }
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

        // Step 2: Variance Penalty
        const catVals = Object.values(catAverages);
        let variancePenalty = 0.0;
        if (catVals.length > 0) {
            const maxCat = Math.max(...catVals);
            const minCat = Math.min(...catVals);
            const variance = maxCat - minCat;
            if (variance >= 3) variancePenalty = 0.10;
            else if (variance >= 2) variancePenalty = 0.05;
        }

        // Step 3: Foundation Penalty
        let foundationPenalty = 0.0;
        if (catAverages['Narrative'] !== undefined && catAverages['Narrative'] < 6.5) {
            foundationPenalty += 0.10;
        }
        if (catAverages['Direction'] !== undefined && catAverages['Direction'] < 6.5) {
            foundationPenalty += 0.05;
        }

        // Step 4: Greatness Boost
        const above85 = catVals.filter(v => v >= 8.5).length;
        const above83 = catVals.filter(v => v >= 8.3).length;
        let boost = 0.0;
        if (above85 >= 4) {
            boost = 0.10;
        } else if (above83 >= 3) {
            boost = 0.05;
        }

        // Step 5: Emotion Adjustment
        let emotionAdj = 0.0;
        if (aspects['emotional_impact'] && isFinite(parseFloat(aspects['emotional_impact'].score))) {
            const eiScore = parseFloat(aspects['emotional_impact'].score);
            if (eiScore > 0) {
                const narrAvg = catAverages['Narrative'] || 0;
                if (eiScore >= 8.5 && narrAvg >= 7.0) {
                    emotionAdj = 0.05;
                } else if (eiScore <= 5.5) {
                    emotionAdj = -0.05;
                }
            }
        }

        // Step 6: Final Score Compilation
        let finalScore = baseScore + boost + emotionAdj - variancePenalty - foundationPenalty - craftPenalty;

        if (finalScore > 10.0) finalScore = 10.0;
        if (finalScore < 0.0) finalScore = 0.0;

        return finalScore.toFixed(2);
    }, [formData.aspects])

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
        console.log("[DEBUG] Form Data before submission:", formData);
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
            verdict: formData.verdict ? normalizeVerdict(formData.verdict) : null,
            aspects: cleanedAspects,
            slug,
            status,
            content_type: formData.content_type || movie.content_type || 'movie',
            movie_id: movie.id || 0,
            movie_title: formData.movie_title || movie.title,
            movie_poster_url: formData.movie_poster_url || movie.poster_url,
            watch_links: formData.watch_links,
            language: formData.language || null,
            trailer_url: formData.trailer_url,
            movie_year: parseInt(formData.movie_year) || null,
            scheduled_date: formData.status === 'scheduled' ? formData.scheduled_date : null,
            overall_rating: parseFloat(averageScore) || 0.0
        };

        try {
            if (id && id !== 'new') {
                await updateReview(id, payload);
            } else {
                await createReview(payload);
            }

            localStorage.removeItem(draftKey);

            if (onSubmit) {
                onSubmit();
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error("Failed to save review:", err);
            const detail = err.response?.data?.detail;
            const msg = Array.isArray(detail)
                ? detail.map(d => `${d.loc?.join('.')} — ${d.msg}`).join('\n')
                : JSON.stringify(detail) || err.message;
            window.alert(`Imprint Failed:\n\n${msg}`);
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
        <div className="relative">
            {/* Mobile Preview Trigger */}
            <div className="xl:hidden fixed top-6 right-6 z-[60]">
                <button
                    onClick={() => setShowPreview(true)}
                    className="w-12 h-12 rounded-2xl glass-obsidian border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-500/10 active:scale-95 transition-all"
                >
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Mobile Preview Overlay */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="xl:hidden fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="max-w-md mx-auto relative pt-12 pb-20"
                        >
                            <button
                                onClick={() => setShowPreview(false)}
                                className="absolute top-0 right-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                            
                            <PublicPreview
                                movie={{
                                    title: movie.title,
                                    poster_url: formData.movie_poster_url || movie.poster_url,
                                    release_year: formData.movie_year || movie.release_year,
                                    director: movie.director || 'Visionary',
                                    runtime: movie.runtime,
                                    genres: movie.genres || [movie.genre]
                                }}
                                review={{
                                    ...formData,
                                    overall_rating: averageScore,
                                }}
                            />

                            <div className="text-center mt-8">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Temporal Imprint Preview</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-12 xl:grid-cols-16 gap-8 md:gap-12 pb-24 font-premium">
            {/* Aspect Controller */}
            <div className="md:col-span-4 xl:col-span-3 space-y-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative glass-obsidian rounded-[42px] py-12 px-6 text-center group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <Sparkles className="mx-auto mb-4 md:mb-6 text-amber-500/40 animate-pulse" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 mb-4">Temple Accuracy</p>
                    <div className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 italic drop-shadow-[0_0_50px_rgba(245,158,11,0.2)]">
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
                            className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all duration-500 group relative overflow-hidden ${activeGroup === idx
                                ? 'bg-amber-500 text-black shadow-2xl shadow-amber-500/20'
                                : 'hover:bg-white/5 text-white/30 hover:text-white'
                                }`}
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
            <div className="md:col-span-8 xl:col-span-9 space-y-12">
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
                        {aspectGroups[activeGroup].aspects.map((aspect, idx) => (
                            <div 
                                key={aspect} 
                                className={`space-y-6 group/item p-4 rounded-3xl transition-all duration-500 ${
                                    activeAspectIdx === idx ? 'bg-amber-500/5 ring-1 ring-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.05)]' : ''
                                }`}
                            >
                                <div className="flex justify-between items-end px-1">
                                    <div className="flex items-center gap-3">
                                        <label className={`text-[9px] font-black uppercase tracking-[0.4em] transition-colors ${
                                            activeAspectIdx === idx ? 'text-amber-500' : 'text-amber-500/40 group-hover/item:text-amber-500'
                                        }`}>
                                            {aspect.replace(/_/g, ' ')}
                                        </label>
                                        {activeAspectIdx === idx && (
                                            <motion.div layoutId="focus-dot" className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                                        )}
                                    </div>
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

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative group">
                                <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus-within:border-amber-500/30 transition-all min-w-[240px]">
                                    <Globe size={16} className="text-amber-500/50 group-focus-within:text-amber-500" />
                                    <input
                                        type="text"
                                        value={langSearch}
                                        onChange={e => {
                                            setLangSearch(e.target.value);
                                            setShowLangSuggestions(true);
                                        }}
                                        onFocus={() => setShowLangSuggestions(true)}
                                        placeholder={currentLanguageName}
                                        className="bg-transparent text-xs font-black uppercase tracking-widest text-white/60 outline-none w-full placeholder:text-white/20"
                                    />
                                    {formData.language && (
                                        <button 
                                            onClick={() => {
                                                setFormData({ ...formData, language: '' });
                                                setLangSearch('');
                                            }}
                                            className="text-white/20 hover:text-white"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {showLangSuggestions && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full mb-4 left-0 w-full glass-obsidian border border-white/10 rounded-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
                                        >
                                            {filteredLanguages.length > 0 ? (
                                                filteredLanguages.map(l => (
                                                    <button
                                                        key={l.code}
                                                        onClick={() => {
                                                            setFormData({ ...formData, language: l.code });
                                                            setLangSearch('');
                                                            setShowLangSuggestions(false);
                                                        }}
                                                        className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all border-b border-white/5 last:border-0"
                                                    >
                                                        {l.name}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/20">No matching realms</div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                {showLangSuggestions && (
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setShowLangSuggestions(false)} 
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">The Author</label>
                        <input
                            value={formData.author}
                            onChange={e => setFormData({ ...formData, author: e.target.value })}
                            placeholder="Written by..."
                            className="w-full bg-transparent border-b border-white/5 py-4 text-xl md:text-2xl font-black text-amber-500/80 outline-none focus:border-amber-500/30 transition-all placeholder:text-white/5 tracking-tighter"
                        />
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">Custom Poster URL</label>
                        <input
                            value={formData.movie_poster_url}
                            onChange={e => setFormData({ ...formData, movie_poster_url: e.target.value })}
                            placeholder="Paste direct image URL to override default cover..."
                            className="w-full bg-transparent border-b border-white/5 py-4 text-base md:text-lg font-mono text-white/60 outline-none focus:border-amber-500/30 transition-all placeholder:text-white/5"
                        />
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">Where to Watch</label>
                        <input
                            value={formData.watch_links}
                            onChange={e => setFormData({ ...formData, watch_links: e.target.value })}
                            placeholder="e.g. Netflix, Prime Video (comma separated or URL)"
                            className="w-full bg-transparent border-b border-white/5 py-4 text-base md:text-xl font-bold text-blue-400 outline-none focus:border-blue-500/30 transition-all placeholder:text-white/5 tracking-tight"
                        />
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">Cinematic Trailer (YouTube URL)</label>
                        <input
                            value={formData.trailer_url}
                            onChange={e => setFormData({ ...formData, trailer_url: e.target.value })}
                            placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                            className="w-full bg-transparent border-b border-white/5 py-4 text-base md:text-xl font-bold text-red-500/80 outline-none focus:border-red-500/30 transition-all placeholder:text-white/5 tracking-tight font-premium"
                        />
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">Release Year</label>
                        <input
                            type="number"
                            value={formData.movie_year}
                            onChange={e => setFormData({ ...formData, movie_year: e.target.value })}
                            placeholder="e.g. 2024"
                            className="w-full bg-transparent border-b border-white/5 py-4 text-base md:text-xl font-bold text-amber-500/80 outline-none focus:border-amber-500/30 transition-all placeholder:text-white/5 tracking-tight"
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.6em] text-white/10">The Ritual (Critique)</label>
                            <div className="flex flex-wrap items-center gap-4">
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
                                        onClick={() => setFormData({ ...formData, verdict: formData.verdict === v ? '' : v })}
                                        className={`py-6 rounded-2xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${formData.verdict === v
                                            ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.3)] scale-105 z-10'
                                            : 'bg-white/5 border-white/10 text-white/20 hover:border-white/30 hover:text-white'
                                            }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <label className="text-[10px] font-black uppercase tracking-[0.6em] text-amber-500/40">Publication Status</label>
                                <div className="flex flex-wrap gap-3">
                                    {['draft', 'published', 'scheduled'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: s })}
                                            className={`px-6 py-4 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${formData.status === s
                                                ? 'bg-white/10 border-amber-500/50 text-amber-500'
                                                : 'bg-white/5 border-white/10 text-white/20 hover:text-white/40'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <AnimatePresence>
                                {formData.status === 'scheduled' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="space-y-8"
                                    >
                                        <label className="text-[10px] font-black uppercase tracking-[0.6em] text-amber-500/40">Scheduled Date</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.scheduled_date}
                                            onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/30 transition-all text-xs"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <label className="flex items-center gap-8 cursor-pointer group w-fit">
                            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-700 ${formData.is_featured ? 'bg-amber-500 border-amber-500 rotate-12 scale-110 shadow-[0_0_30px_rgba(245,158,11,0.4)]' : 'bg-white/5 border-white/10 group-hover:border-amber-500/30'
                                }`}>
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
                            onClick={() => handleImprinting(formData.status)}
                            disabled={submitting}
                            className="flex-[2] py-8 bg-gradient-to-r from-amber-500 to-amber-700 text-black rounded-[32px] font-black uppercase tracking-[0.4em] text-xs transition-all shadow-[0_20px_60px_rgba(245,158,11,0.3)] hover:shadow-[0_20px_80px_rgba(245,158,11,0.5)] transform hover:-translate-y-2 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-4 group"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <Sparkles size={20} className="group-hover:animate-spin" />
                                    {formData.status === 'scheduled' ? 'SCHEDULE IMPRINT' : 'IMPRINT ON THE TEMPLE'}
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
                    top: '0',
                    left: '-10000px',
                    opacity: '0',
                    pointerEvents: 'none',
                    zIndex: -1
                }}
            >
                <div style={{ width: '600px' }}>
                    <SanctuaryCard
                        movie={{
                            title: movie.title,
                            poster: getProxyImageUrl(formData.movie_poster_url || movie.poster_url),
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

            {/* Live Sanctuary Card Overlay (Desktop Only) */}
            <div className="hidden xl:block xl:col-span-4 sticky top-10 h-fit">
                <div className="glass-obsidian rounded-[42px] p-6 border-amber-500/10 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-2">
                            <Eye size={14} className="text-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Temporal Preview</span>
                        </div>
                        <div className="h-1 w-12 bg-white/5 rounded-full" />
                    </div>
                    
                    <div className="mt-2">
                         <PublicPreview
                            movie={{
                                title: movie.title,
                                poster_url: formData.movie_poster_url || movie.poster_url,
                                release_year: formData.movie_year || movie.release_year,
                                director: movie.director || 'Visionary',
                                runtime: movie.runtime,
                                genres: movie.genres || [movie.genre]
                            }}
                            review={{
                                ...formData,
                                overall_rating: averageScore,
                            }}
                        />
                    </div>
                    
                    <div className="pt-8 border-t border-white/5 relative z-10">
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] text-center leading-relaxed">
                            Behold the final imprint as it will manifest in the archives. 
                            <span className="block text-amber-500/40 mt-1">Updates in real-time.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
)
}

export default ReviewForm
