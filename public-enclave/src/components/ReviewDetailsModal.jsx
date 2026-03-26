import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Star, TrendingUp, Info } from 'lucide-react';

const ReviewDetailsModal = ({ review, isOpen, onClose }) => {
    if (!review) return null;

    const aspectKeys = Object.keys(review.aspects || {});

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="fixed top-[4%] left-[4%] right-[4%] bottom-[4%] md:top-[8%] md:left-[10%] md:right-[10%] md:bottom-[8%] review-modal-content overflow-hidden flex flex-col"
                    >
                        {/* Persistent Header */}
                        <div className="absolute top-8 right-8 z-[110]">
                            <button
                                onClick={onClose}
                                className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-3xl transition-all border border-white/10 hover:scale-110 active:scale-95"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Top Hero Section */}
                        <div className="relative h-[45vh] flex-shrink-0">
                            <img
                                src={review.movie_poster_url || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=800"}
                                alt={review.movie_title}
                                className="modal-header-image"
                            />
                            <div className="absolute bottom-12 left-12 right-12">
                                <div className="flex flex-wrap items-center gap-4 mb-6">
                                    <div className="modal-meta-badge">{review.verdict}</div>
                                    <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-3xl shadow-2xl">
                                        <Star size={14} className="text-amber-500" fill="currentColor" />
                                        <span className="text-sm font-black text-amber-500 italic">
                                            {typeof review.overall_rating === 'object' ? review.overall_rating.score.toFixed(2) : (parseFloat(review.overall_rating) || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-3xl text-[10px] font-black uppercase text-white/40 tracking-widest">
                                        <Calendar size={12} />
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <h2 className="modal-title uppercase line-clamp-2">
                                    {review.movie_title}
                                </h2>
                            </div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                                {/* Left Content Column */}
                                <div className="lg:col-span-12 xl:col-span-7 space-y-16">
                                    <div className="space-y-4">
                                        <span className="section-label">Executive Summary</span>
                                        <p className="summary-text">
                                            "{review.summary}"
                                        </p>
                                    </div>

                                    {review.content && (
                                        <div className="space-y-4">
                                            <span className="section-label">Full Critique</span>
                                            <div className="critique-body whitespace-pre-wrap">
                                                {review.content}
                                            </div>
                                        </div>
                                    )}

                                    {review.viewing_context && (
                                        <div className="viewing-context-card">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Info size={16} className="text-amber-500" />
                                                <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em]">Viewing Context</span>
                                            </div>
                                            <p className="text-sm text-white/50 font-medium leading-relaxed italic">
                                                {review.viewing_context}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Right DNA Column */}
                                <div className="lg:col-span-12 xl:col-span-5">
                                    <div className="dna-sidebar">
                                        <div className="dna-title-row">
                                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-[0_0_20px_rgba(245,166,35,0.1)]">
                                                <TrendingUp size={20} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Structural DNA</h3>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">15-Point Extraction</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {aspectKeys.length > 0 ? (
                                                aspectKeys.map(key => {
                                                    const aspect = review.aspects[key];
                                                    if (!aspect || !aspect.score) return null;
                                                    return (
                                                        <div key={key} className="aspect-row">
                                                            <div className="flex justify-between items-end mb-1">
                                                                <span className="aspect-label">{key.replace('_', ' ')}</span>
                                                                <span className="aspect-score">{aspect.score.toFixed(1)}</span>
                                                            </div>
                                                            <div className="aspect-bar-container">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(aspect.score / 10) * 100}%` }}
                                                                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                                                    className="aspect-bar-fill"
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="py-12 text-center opacity-30 italic text-xs">No DNA data found for this entry.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReviewDetailsModal;
