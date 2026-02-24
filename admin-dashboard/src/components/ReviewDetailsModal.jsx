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
                        className="fixed top-[5%] left-[5%] right-[5%] bottom-[5%] md:top-[10%] md:left-[15%] md:right-[15%] md:bottom-[10%] bg-[#080808] border border-white/10 rounded-[32px] md:rounded-[40px] z-[101] overflow-hidden flex flex-col shadow-2xl"
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
                                    onClick={() => onDelete(review._id || review.id)}
                                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full backdrop-blur-md transition-colors group"
                                    title="Delete Review"
                                >
                                    <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => window.location.href = `/edit/${review._id || review.id}`}
                                    className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-full backdrop-blur-md transition-colors group"
                                    title="Edit Review"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
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
                                        <span className="text-xs font-black">{review.overall_rating}</span>
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
                                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/5 shadow-2xl sticky top-0">
                                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                            <TrendingUp size={18} className="text-amber-500" />
                                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/80">Structural DNA</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {aspectKeys.length > 0 ? (
                                                aspectKeys.map(key => {
                                                    const aspect = review.aspects[key];
                                                    if (!aspect || !aspect.score) return null;
                                                    return (
                                                        <div key={key} className="space-y-2">
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{key.replace('_', ' ')}</span>
                                                                <span className="text-xs font-black text-amber-500">{aspect.score}/10</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-amber-700 to-amber-400 rounded-full"
                                                                    style={{ width: `${(aspect.score / 10) * 100}%` }}
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
