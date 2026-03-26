import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Star, TrendingUp } from 'lucide-react';

const ReviewDetailsModal = ({ review, isOpen, onClose, onDelete }) => {
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-[5%] left-[5%] right-[5%] bottom-[5%] md:top-[10%] md:left-[15%] md:right-[15%] md:bottom-[10%] review-modal-content overflow-hidden flex flex-col"
                    >
                        {/* Header Image */}
                        <div className="relative h-48 md:h-64 flex-shrink-0 bg-black">
                            <img
                                src={review.movie_poster_url || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=800"}
                                alt={review.movie_title}
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] to-transparent" />
                            <div className="absolute top-6 right-6 flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10 hover:scale-105 active:scale-95"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="absolute bottom-6 left-8 md:left-12 pr-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        {review.verdict}
                                    </span>
                                    <div className="flex items-center gap-1 text-amber-500 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
                                        <Star size={12} fill="currentColor" />
                                        <span className="text-xs font-black">
                                            {typeof review.overall_rating === 'object' ? review.overall_rating.score.toFixed(2) : (parseFloat(review.overall_rating) || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/50 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/5 text-[10px] uppercase font-bold tracking-wider">
                                        <Calendar size={12} />
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white">
                                    {review.movie_title || 'Untitled Critique'}
                                </h2>
                            </div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                {/* Main Content */}
                                <div className="lg:col-span-2 space-y-10">
                                    {/* Summary */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Executive Summary</h3>
                                        <p className="text-xl md:text-2xl font-light text-white/80 leading-relaxed italic border-l-2 border-amber-500/50 pl-6">
                                            "{review.summary}"
                                        </p>
                                    </div>

                                    {/* Full Content */}
                                    {review.content && (
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Full Critique</h3>
                                            <div className="prose prose-invert prose-amber max-w-none text-white/70">
                                                {/* If content is just plain text, render it directly, if markdown, we should ideally parse it, but standard text rendering works for a dashboard preview */}
                                                <div className="whitespace-pre-wrap leading-relaxed">{review.content}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cinematic Lore */}
                                    {(review.cast_performances || review.director_trademarks || review.viewing_context || review.trivia_and_details) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {review.cast_performances && (
                                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Cast Performances</h4>
                                                    <p className="text-sm text-white/60 leading-relaxed">{review.cast_performances}</p>
                                                </div>
                                            )}
                                            {review.director_trademarks && (
                                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Director Trademarks</h4>
                                                    <p className="text-sm text-white/60 leading-relaxed">{review.director_trademarks}</p>
                                                </div>
                                            )}
                                            {review.viewing_context && (
                                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Viewing Context</h4>
                                                    <p className="text-sm text-white/60 leading-relaxed">{review.viewing_context}</p>
                                                </div>
                                            )}
                                            {review.trivia_and_details && (
                                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Trivia & Details</h4>
                                                    <p className="text-sm text-white/60 leading-relaxed">{review.trivia_and_details}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Arrays (Dialogues / Moments) */}
                                    {(review.favourite_dialogues?.length > 0 || review.cinematic_moments?.length > 0) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                                            {review.favourite_dialogues?.length > 0 && (
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Quotable Lore</h4>
                                                    <ul className="space-y-3">
                                                        {review.favourite_dialogues.map((quote, i) => (
                                                            <li key={i} className="text-sm text-white/70 italic bg-white/5 p-4 rounded-xl">"{quote}"</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {review.cinematic_moments?.length > 0 && (
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sacred Frames</h4>
                                                    <ul className="space-y-2">
                                                        {review.cinematic_moments.map((moment, i) => (
                                                            <li key={i} className="text-sm text-white/70 flex gap-3 items-start">
                                                                <span className="text-amber-500 mt-0.5"><TrendingUp size={14} /></span>
                                                                <span>{moment}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar: Aspects DNA */}
                                <div className="space-y-8">
                                    <div className="dna-sidebar sticky top-0">
                                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                                <TrendingUp size={16} className="text-amber-500" />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Structural DNA</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {aspectKeys.length > 0 ? (
                                                aspectKeys.map(key => {
                                                    const aspect = review.aspects[key];
                                                    if (!aspect || !aspect.score) return null;
                                                    return (
                                                        <div key={key} className="space-y-1.5">
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{key.replace('_', ' ')}</span>
                                                                <span className="text-[10px] font-black text-amber-500 italic">{aspect.score.toFixed(1)}</span>
                                                            </div>
                                                            <div className="aspect-bar-container">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(aspect.score / 10) * 100}%` }}
                                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                                    className="aspect-bar-fill"
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-xs text-white/30 italic text-center py-4">No structural data recorded.</p>
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
