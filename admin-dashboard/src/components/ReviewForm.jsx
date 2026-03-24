import React, { useState, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Save, X, Calendar, MessageSquare, Star, Sliders, Layout, 
    Type, Globe, Hash, Info, User, Check, Trash2, Edit3, 
    Sparkles, Eye, Download, List, Loader2, Quote, Zap, Camera, Music, Heart,
    TrendingUp, Award, Layers, Ghost, Filter, ChevronRight, Plus, MoreVertical, Archive, AlignLeft
} from 'lucide-react'
import { createReview, updateReview, getProxyImageUrl, getRatingTimeline, updateDynamicRating, resetRatingTimeline } from '../services/api'
import SanctuaryCard from './SanctuaryCard';
import PublicPreview from './PublicPreview';
import RatingTimelineGraph from './RatingTimelineGraph';
import html2canvas from 'html2canvas';
import { VERDICT_SCALE } from '../constants/verdictScale';
import { History, RefreshCw } from 'lucide-react';

const CRITICAL_PRESETS = [
    { 
        id: 'blockbuster', 
        name: 'Epic Blockbuster', 
        description: 'High Visuals/Audio, Balanced Narrative',
        values: {
            story: 7.5, screenplay: 7.0, originality: 6.5, opening: 8.5, climax: 9.0,
            direction: 8.5, acting: 8.0, dialogues: 7.0, thematic_depth: 6.0,
            cinematography: 9.2, editing: 9.0, production_design: 9.5, vfx: 9.8,
            bg_score: 9.5, music: 9.0,
            pacing: 8.5, emotional_impact: 8.0, rewatch_value: 9.0
        }
    },
    { 
        id: 'auteur', 
        name: 'Auteur Drama', 
        description: 'Elite Writing and Thematic Depth',
        values: {
            story: 9.5, screenplay: 9.8, originality: 9.0, opening: 8.0, climax: 9.2,
            direction: 9.5, acting: 9.5, dialogues: 9.2, thematic_depth: 9.8,
            cinematography: 8.5, editing: 8.2, production_design: 8.0, vfx: 5.0,
            bg_score: 8.5, music: 7.0,
            pacing: 7.5, emotional_impact: 9.5, rewatch_value: 7.0
        }
    },
    { 
        id: 'sensory', 
        name: 'Sensory Masterpiece', 
        description: 'Technical Perfection, Minimalist Story',
        values: {
            story: 6.5, screenplay: 6.0, originality: 8.5, opening: 9.0, climax: 8.5,
            direction: 9.5, acting: 7.5, dialogues: 6.0, thematic_depth: 8.5,
            cinematography: 10, editing: 9.8, production_design: 10, vfx: 9.5,
            bg_score: 10, music: 9.5,
            pacing: 8.5, emotional_impact: 9.0, rewatch_value: 8.0
        }
    }
];

const aspectGroups = [
    {
        name: 'Narrative',
        icon: <Quote size={18} />,
        aspects: ['story', 'screenplay', 'originality', 'opening', 'climax']
    },
    {
        name: 'Execution',
        icon: <Zap size={18} />,
        aspects: ['direction', 'acting', 'dialogues', 'thematic_depth']
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
    const [showRatingScale, setShowRatingScale] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1280);
    const [ratingTimeline, setRatingTimeline] = useState(null);
    const [phaseLoading, setPhaseLoading] = useState(false);



    React.useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1280);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const draftKey = useMemo(() => {
        if (id && id !== 'new') return `review_draft_edit_${id}`;
        if (movie && (movie.imdb_id || movie.id)) return `review_draft_movie_${movie.imdb_id || movie.id}`;
        return 'review_draft_new';
    }, [id, movie]);
    const [formData, setFormData] = useState(() => {
        const defaultAspects = aspectGroups.flatMap(g => g.aspects).reduce((acc, aspect) => ({
            ...acc, [aspect]: { score: 0, comment: '' }
        }), {});

        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                // Clean aspects of nulls
                const cleanAspects = Object.fromEntries(
                    Object.entries(parsed.aspects || {}).filter(([_, v]) => v != null)
                );
                return {
                    ...parsed,
                    aspects: { ...defaultAspects, ...cleanAspects }
                };
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        }

        if (initialData) {
            // Clean initial aspects of nulls
            const cleanInitialAspects = Object.fromEntries(
                Object.entries(initialData.aspects || {}).filter(([_, v]) => v != null)
            );
            return {
                summary: initialData.summary || '',
                movie_title: initialData.movie_title || '',
                content: initialData.content || '',
                verdict: initialData.verdict || 'Good',
                status: initialData.status || 'published',
                is_featured: initialData.is_featured || false,
                is_must_watch: initialData.is_must_watch || false,
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
                movie_year: initialData.movie_year ? initialData.movie_year.toString() : '',
                oscar_rank: initialData.oscar_rank || 0,
                scheduled_date: initialData.scheduled_date ? initialData.scheduled_date.slice(0, 16) : '',
                content_type: initialData.content_type || 'movie',
                micro_calibration: initialData.micro_calibration || null,
                aspects: { ...defaultAspects, ...cleanInitialAspects }
            };
        }

        return {
            summary: '',
            movie_title: movie?.title || '',
            content: '',
            verdict: '',
            status: 'published',
            is_featured: false,
            is_must_watch: false,
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
            movie_year: movie?.release_year ? movie.release_year.toString() : '',
            oscar_rank: 0,
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
    
    // Fetch Rating Timeline
    React.useEffect(() => {
        const fetchTimeline = async () => {
            if (movie?.imdb_id || movie?.id) {
                try {
                    const response = await getRatingTimeline(movie.imdb_id || movie.id);
                    setRatingTimeline(response.data);
                } catch (e) {
                    console.log("No timeline yet");
                }
            }
        };
        fetchTimeline();
    }, [movie]);

    const handlePhaseUpdate = async (phaseName) => {
        // Ensure we have a valid movie_id
        const movieId = movie.imdb_id || movie.id || initialData?.movie_id;
        
        if (!movieId || movieId === 0 || movieId === '0') {
            console.error("[EVOLUTION_REGISTRY] Cannot update without valid movie_id", { movie, initialData });
            alert("This record lacks a persistent identity (movie_id). Please re-select from search or ensure it has an IMDB ID.");
            return;
        }

        setPhaseLoading(true);
        try {
            const payload = {
                movie_id: String(movieId),
                phase_name: phaseName,
                score: parseFloat(averageScore),
                metadata: { 
                    date: new Date().toISOString(),
                    context: "Admin Ritual Update"
                }
            };
            const response = await updateDynamicRating(payload);
            setRatingTimeline(response.data);
        } catch (e) {
            console.error("Phase update failed", e);
        } finally {
            setPhaseLoading(false);
        }
    };

    const handleResetTimeline = async () => {
        if (!window.confirm("Are you sure you want to reset the entire rating evolution for this movie?")) return;
        setPhaseLoading(true);
        try {
            await resetRatingTimeline(movie.imdb_id || movie.id);
            setRatingTimeline(null);
        } catch (e) {
            console.error("Reset failed", e);
        } finally {
            setPhaseLoading(false);
        }
    };

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
        // V7.2 SCORING ENGINE (THE DEFINITIVE MATRIX)
        const aspectsMap = formData.aspects || {};
        const categories = {
            'Narrative': { keys: ['story', 'screenplay', 'originality', 'opening', 'climax'], weights: [0.09, 0.08, 0.05, 0.03, 0.05] },
            'Execution': { keys: ['direction', 'acting', 'dialogues', 'thematic_depth'], weights: [0.10, 0.07, 0.03, 0.05] },
            'Visuals': { keys: ['cinematography', 'editing', 'production_design', 'vfx'], weights: [0.06, 0.06, 0.05, 0.03] },
            'Audio': { keys: ['bg_score', 'music'], weights: [0.06, 0.04] },
            'Soul': { keys: ['pacing', 'emotional_impact', 'rewatch_value'], weights: [0.05, 0.06, 0.04] }
        };

        let baseScore = 0.0;
        let catAverages = {};
        let aspectScores = [];

        Object.entries(categories).forEach(([name, cat]) => {
            let catSum = 0;
            cat.keys.forEach((key, idx) => {
                const s = parseFloat(aspectsMap[key]?.score) || 0;
                baseScore += s * cat.weights[idx];
                catSum += s;
                aspectScores.push(s);
            });
            catAverages[name] = catSum / cat.keys.length;
        });

        // 1. Excellence Bonus
        const count90 = aspectScores.filter(s => s >= 9.0).length;
        const count95 = aspectScores.filter(s => s >= 9.5).length;
        const bonus = Math.min(0.20, (count90 * 0.02) + (count95 * 0.04));

        // 2. Peak Reward
        let peak = 0;
        const minScore = Math.min(...aspectScores);
        if (count95 >= 3 && minScore >= 7.5) peak = 0.10;

        // 3. Penalties
        // 3.1 Weak Link
        let weakLinkPenalty = 0;
        if (minScore < 6.5) weakLinkPenalty = 0.40;
        else if (minScore < 7.0) weakLinkPenalty = 0.30;
        else if (minScore < 7.5) weakLinkPenalty = 0.20;
        else if (minScore < 8.0) weakLinkPenalty = 0.10;

        // 3.2 Smoothed Inflation
        let inflationPenalty = 0;
        if (baseScore < 9.5 && count90 >= 10) {
            inflationPenalty = (count90 - 9) * 0.05;
            if (baseScore >= 9.3) inflationPenalty *= 0.5; // Smoothing
            if (inflationPenalty > 0.25) inflationPenalty = 0.25;
        }

        // 3.3 Imbalance
        const pillarAvgs = Object.values(catAverages);
        const gap = Math.max(...pillarAvgs) - Math.min(...pillarAvgs);
        let imbalancePenalty = 0;
        if (gap > 2.0) imbalancePenalty = 0.25;
        else if (gap > 1.5) imbalancePenalty = 0.15;

        // 4. Overlap Mercy Fix
        if (weakLinkPenalty > 0) imbalancePenalty = Math.min(0.10, imbalancePenalty);

        // 3.4 Transcendent Synergy (V7.2 Enhancement)
        const highPillars = pillarAvgs.filter(a => a >= 9.2).length;
        let transcendentBonus = 0;
        let isTranscendent = false;
        if (highPillars >= 4) {
            transcendentBonus = 0.15;
            isTranscendent = true;
        }

        let finalScore = baseScore + bonus + peak + transcendentBonus - (weakLinkPenalty + inflationPenalty + imbalancePenalty);

        // 5. Narrative Guardrail (Hard Ceiling)
        const nAvg = catAverages['Narrative'];
        let isCapped = false;
        if (nAvg < 7.5 && finalScore > 8.3) { finalScore = 8.3; isCapped = true; }
        else if (nAvg < 8.0 && finalScore > 8.7) { finalScore = 8.7; isCapped = true; }
        else if (nAvg < 8.5 && finalScore > 9.1) { finalScore = 9.1; isCapped = true; }

        return {
            score: Math.max(0, Math.min(10, finalScore)),
            flags: {
                isCapped,
                isElite: baseScore >= 9.3 && baseScore < 9.5,
                isLegendary: baseScore >= 9.5,
                isTranscendent,
                mercyActive: weakLinkPenalty > 0 && imbalancePenalty > 0
            }
        };
    }, [formData.aspects]);

    const scoringResult = averageScore;
    const numericScore = scoringResult.score.toFixed(2);
    const activeFlags = scoringResult.flags;


    const [aiLoading, setAiLoading] = useState(false);

    const [showPresets, setShowPresets] = useState(false);
    
    const handleApplyPreset = (preset) => {
        const updatedAspects = { ...formData.aspects };
        Object.entries(preset.values).forEach(([key, val]) => {
            updatedAspects[key] = {
                ...(updatedAspects[key] || { comment: '' }),
                score: val
            };
        });
        setFormData(prev => ({ ...prev, aspects: updatedAspects }));
        setShowPresets(false);
    };

    const handleAIDraft = async () => {
        if (!movie && !formData.movie_title) {
            alert("No movie intelligence detected to reforge.");
            return;
        }

        setAiLoading(true);
        // Simulate "Divine Processing" delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const baseRating = movie?.ratings?.find(r => r.Source === "The Movie Database" || r.Source === "TMDB" || r.Source === "Internet Movie Database" || r.Source === "Metacritic")?.Value;
            let numericScore = 7.0; // Default baseline

            if (baseRating) {
                if (baseRating.includes('/')) numericScore = (parseFloat(baseRating.split('/')[0]) / (baseRating.includes('/100') ? 10 : 1));
                else if (baseRating.includes('%')) numericScore = parseFloat(baseRating) / 10;
                else numericScore = parseFloat(baseRating);
            }

            // Procedural Aspect Scattering (Divine Inspiration)
            const draftAspects = {};
            aspectGroups.forEach(group => {
                group.aspects.forEach(aspect => {
                    const variance = (Math.random() - 0.5); // -0.5 to +0.5
                    const score = Math.min(10, Math.max(1, (numericScore + variance))).toFixed(1);
                    draftAspects[aspect] = { score: parseFloat(score), comment: '' };
                });
            });

            // Spiritual Summary Drafting
            const year = movie?.release_year || movie?.Year || formData.movie_year || 'Unknown Era';
            const director = movie?.director || movie?.crew?.find(c => c.job === 'Director')?.name || 'a legendary filmmaker';
            const tiers = ['LEGENDARY', 'MASTERPIECE', 'ESSENTIAL', 'ELITE', 'GREAT', 'GOOD', 'DECENT', 'AVERAGE'];
            const predictedVerdict = tiers[Math.min(tiers.length - 1, Math.floor((10 - numericScore) / 1.25))] || 'DECENT';
            
            const spiritualSummary = `A ${predictedVerdict} manifestation of ${movie?.genres?.[0] || 'cinema'}. This is ${director}'s vision reaching heights of ${movie?.genres?.[1] || 'dramatic'} resonance during the ${year} cycle. A necessary decryption for the collective consciousness.`;

            // Tag Generation
            const movieTags = [...new Set([
                ...(movie?.genres || []),
                predictedVerdict.toLowerCase(),
                'divine_intelligence',
                numericScore > 8 ? 'must_watch' : 'critique_ritual'
            ])].slice(0, 6);

            setFormData(prev => ({
                ...prev,
                aspects: draftAspects,
                summary: spiritualSummary,
                tags: movieTags,
                content: prev.content || `The cinematic fabric of ${formData.movie_title || movie?.title} is woven with threads of ${movie?.genres?.join(', ') || 'pure artistry'}. In the year ${year}, ${director} unleashed a work that demands profound analysis...`,
                cast_performances: prev.cast_performances || `The ensemble manifests performances that ground the ethereal scope of ${director}'s vision.`,
                director_trademarks: prev.director_trademarks || `${director} utilizes distinct visual language to bridge the gap between audience and art.`,
            }));

        } catch (error) {
            console.error("Divine drafting failed:", error);
        } finally {
            setAiLoading(false);
        }
    };

    const handleAspectChange = (aspect, field, value) => {
        setFormData(prev => ({
            ...prev,
            aspects: {
                ...prev.aspects,
                [aspect]: { 
                    ...(prev.aspects?.[aspect] || { score: 0, comment: '' }), 
                    [field]: value 
                }
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
            is_must_watch: formData.is_must_watch,
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
            overall_rating: parseFloat(numericScore) || 0.0
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
            {/* Global Actions Floating Buttons */}
            <div className="fixed top-12 md:top-10 right-6 md:right-10 z-[100] flex items-center gap-3">
                {/* Critical Presets Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowPresets(!showPresets)}
                        className={`w-12 h-12 rounded-2xl glass-obsidian border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-500/10 active:scale-95 transition-all ${showPresets ? 'bg-blue-500/10' : ''}`}
                        title="Critical Presets"
                    >
                        <Layers size={20} />
                    </button>
                    
                    <AnimatePresence>
                        {showPresets && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-4 w-72 glass-obsidian border border-white/10 rounded-3xl p-4 shadow-2xl z-[110] backdrop-blur-2xl"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2 pb-2 border-b border-white/5">
                                        <Filter size={14} className="text-blue-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Critical Templates</span>
                                    </div>
                                    <div className="grid gap-2">
                                        {CRITICAL_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => handleApplyPreset(preset)}
                                                className="w-full text-left p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                                            >
                                                <p className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-blue-400 transition-colors">{preset.name}</p>
                                                <p className="text-[9px] text-white/30 italic mt-1 line-clamp-1">{preset.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={handleAIDraft}
                    disabled={aiLoading}
                    className={`w-12 h-12 rounded-2xl glass-obsidian border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-500/10 active:scale-95 transition-all ${aiLoading ? 'animate-pulse opacity-50' : ''}`}
                    title="Generate Intelligence Draft"
                >
                    {aiLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                </button>
                <button
                    onClick={() => setShowPreview(true)}
                    className="w-12 h-12 rounded-2xl glass-obsidian border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-500/10 active:scale-95 transition-all"
                    title="View Preview"
                >
                    <Eye size={20} />
                </button>
                <button
                    onClick={() => setShowRatingScale(true)}
                    className="w-12 h-12 rounded-2xl glass-obsidian border border-white/10 flex items-center justify-center text-white/40 shadow-2xl active:scale-95 transition-all"
                    title="Rating Scale"
                >
                    <List size={20} />
                </button>
            </div>

            {/* Rating Scale Overlay */}
            <AnimatePresence>
                {showRatingScale && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-[#020202]/95 backdrop-blur-3xl overflow-y-auto px-6 py-12 md:py-20 flex justify-center items-start"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 md:p-14 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                            
                            <header className="mb-10 text-center">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Temple Protocol</h2>
                                <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">THE VERDICT SCALE</h1>
                            </header>

                            <div className="space-y-4">
                                {VERDICT_SCALE.map((tier, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="group flex items-start gap-4 py-3 px-4 rounded-2xl hover:bg-white/[0.03] transition-all relative"
                                    >
                                        <div 
                                            className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_10px_currentColor]" 
                                            style={{ backgroundColor: tier.color, color: tier.color }} 
                                        />
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-white group-hover:text-amber-500 transition-colors uppercase italic tracking-tight">
                                                    {tier.verdict}
                                                </span>
                                                <span className="text-[10px] font-black text-white/20 group-hover:text-amber-500/60 transition-colors tracking-widest uppercase">
                                                    {tier.range}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-white/30 font-medium italic group-hover:text-white/60 transition-colors leading-relaxed max-w-[240px]">
                                                {tier.description}
                                            </p>
                                        </div>

                                        {/* Background Interaction Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                                    </motion.div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowRatingScale(false)}
                                className="mt-12 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all"
                            >
                                CLOSE ARCHIVE
                            </button>

                            <button
                                onClick={() => setShowRatingScale(false)}
                                className="absolute top-6 right-6 text-white/10 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        {numericScore}
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

                {/* Rating Evolution Tracker */}
                <div className="glass-obsidian rounded-[42px] p-8 border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                            <History size={14} className="text-indigo-400" />
                            Evolution Registry
                        </h3>
                        {ratingTimeline && (
                            <button
                                type="button"
                                onClick={handleResetTimeline}
                                disabled={phaseLoading}
                                className="text-[10px] font-bold text-red-400/50 hover:text-red-400 uppercase tracking-tighter transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    
                    {ratingTimeline && <RatingTimelineGraph data={ratingTimeline} />}
                    
                    <div className="grid grid-cols-1 gap-2">
                        {['initial', 'reflection', 'rewatch'].map(phase => (
                            <button
                                key={phase}
                                onClick={() => handlePhaseUpdate(phase)}
                                disabled={phaseLoading}
                                className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-300">
                                    Stamp {phase}
                                </span>
                                {ratingTimeline?.phases?.[phase] ? (
                                    <span className="text-xs font-black text-indigo-400 italic">
                                        {ratingTimeline.phases[phase].score.toFixed(1)}
                                    </span>
                                ) : (
                                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-black transition-all">
                                        {phaseLoading ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-[8px] font-medium text-gray-600 italic text-center leading-relaxed">
                        Register the current score ({averageScore}) to the temporal registry to track your perception drift.
                    </p>
                </div>

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
                                    <span className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">{(formData.aspects[aspect]?.score ?? 0)}</span>
                                </div>
                                <input
                                    type="range" min="0" max="10" step="0.1"
                                    value={formData.aspects[aspect]?.score ?? 0}
                                    onChange={e => handleAspectChange(aspect, 'score', parseFloat(e.target.value))}
                                    className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500"
                                />
                                <textarea
                                    placeholder="Add precision thought..."
                                    value={formData.aspects[aspect]?.comment ?? ''}
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
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full mt-4 left-0 w-full bg-[#111] border border-white/10 rounded-2xl overflow-hidden z-[70] max-h-64 overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
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

                        <div className="flex flex-wrap gap-8 items-center bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div
                                    onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                                    className={`w-14 h-7 rounded-full transition-all relative ${formData.is_featured ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,166,35,0.4)]' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${formData.is_featured ? 'left-8 bg-black' : 'left-1 bg-white/40'}`} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/80 group-hover:text-amber-500 transition-colors">Spotlight Featured</span>
                                    <p className="text-[10px] text-white/30 italic">Primary Carousel visibility</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div
                                    onClick={() => setFormData(prev => ({ ...prev, is_must_watch: !prev.is_must_watch }))}
                                    className={`w-14 h-7 rounded-full transition-all relative ${formData.is_must_watch ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${formData.is_must_watch ? 'left-8 bg-black' : 'left-1 bg-white/40'}`} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/80 group-hover:text-red-500 transition-colors">Must Watch Legacy</span>
                                    <p className="text-[10px] text-white/30 italic">Discovery Section inclusion</p>
                                </div>
                            </label>
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

                        <div className="flex flex-col sm:flex-row gap-10">
                            <label className="flex items-center gap-6 cursor-pointer group w-fit">
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

                            <label className="flex items-center gap-6 cursor-pointer group w-fit">
                                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-700 ${formData.is_must_watch ? 'bg-indigo-500 border-indigo-500 -rotate-12 scale-110 shadow-[0_0_30px_rgba(99,102,241,0.4)]' : 'bg-white/5 border-white/10 group-hover:border-indigo-500/30'
                                    }`}>
                                    {formData.is_must_watch && <Heart size={18} className="text-black fill-black" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.is_must_watch}
                                    onChange={e => setFormData({ ...formData, is_must_watch: e.target.checked })}
                                />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-indigo-500 transition-colors">Must Watch Designation</p>
                                    <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest">Pin to the "Must Watch" high-priority scroll</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-6 cursor-pointer group w-fit">
                                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-700 ${formData.tags.includes('oscar') ? 'bg-[#FFD700] border-[#FFD700] -rotate-12 scale-110 shadow-[0_0_30px_rgba(255,215,0,0.4)]' : 'bg-white/5 border-white/10 group-hover:border-[#FFD700]/30'
                                    }`}>
                                    {formData.tags.includes('oscar') && <Award size={18} className="text-black" strokeWidth={2.5} />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.tags.includes('oscar')}
                                    onChange={e => {
                                        const tags = e.target.checked 
                                            ? Array.from(new Set([...formData.tags, 'oscar']))
                                            : formData.tags.filter(t => t !== 'oscar');
                                        setFormData({ ...formData, tags });
                                    }}
                                />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-[#FFD700] transition-colors">Oscar Contender</p>
                                    <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest">Pin exclusively to the Golden Contenders Page</p>
                                </div>
                            </label>

                            {formData.tags.includes('oscar') && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-4 bg-white/5 border border-[#FFD700]/20 px-6 py-2 rounded-2xl"
                                >
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#FFD700]">Rank #</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={formData.oscar_rank || ''}
                                        onChange={e => setFormData({ ...formData, oscar_rank: parseInt(e.target.value) || 0 })}
                                        className="bg-transparent text-white font-black text-sm outline-none w-12 text-center"
                                        placeholder="0"
                                    />
                                </motion.div>
                            )}
                        </div>
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
            {isDesktop && (
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
            )}
        </div>
    </div>
)
}

export default ReviewForm
