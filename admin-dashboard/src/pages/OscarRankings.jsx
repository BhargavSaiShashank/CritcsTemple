import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Search, ArrowUp, ArrowDown, X, Save, Loader2, Plus } from 'lucide-react';
import { getReviews, getProxyImageUrl, updateOscarRankings } from '../services/api';

export default function OscarRankings() {
    const [allReviews, setAllReviews] = useState([]);
    const [contenders, setContenders] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data } = await getReviews({ limit: 1000, status: 'published' });
            setAllReviews(data);
            
            // Filter out those with 'oscar' tag
            const oscars = data.filter(r => (r.tags || []).includes('oscar'));
            // Sort by oscar_rank
            oscars.sort((a, b) => {
                const rankA = a.oscar_rank ?? 999;
                const rankB = b.oscar_rank ?? 999;
                return rankA - rankB;
            });
            setContenders(oscars);
        } catch (err) {
            console.error("Failed to fetch reviews for oscars", err);
        } finally {
            setLoading(false);
        }
    };

    const addToContenders = (review) => {
        if (!contenders.find(c => c._id === review._id)) {
            setContenders([...contenders, review]);
        }
        setSearchQuery('');
    };

    const removeFromContenders = (id) => {
        setContenders(contenders.filter(c => c._id !== id));
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newArr = [...contenders];
        const temp = newArr[index - 1];
        newArr[index - 1] = newArr[index];
        newArr[index] = temp;
        setContenders(newArr);
    };

    const moveDown = (index) => {
        if (index === contenders.length - 1) return;
        const newArr = [...contenders];
        const temp = newArr[index + 1];
        newArr[index + 1] = newArr[index];
        newArr[index] = temp;
        setContenders(newArr);
    };

    const saveHierarchy = async () => {
        setSaving(true);
        try {
            const payload = contenders.map((c, index) => ({
                id: c._id,
                rank: index + 1
            }));
            await updateOscarRankings(payload);
            alert("Oscar Hierarchy Successfully Published!");
        } catch (err) {
            console.error("Failed to save rankings", err);
            alert("Failed to save rankings. Check the console.");
        } finally {
            setSaving(false);
        }
    };

    const searchResults = allReviews.filter(r => 
        r.movie_title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !contenders.find(c => c._id === r._id)
    );

    return (
        <div className="min-h-screen bg-[#020202] text-[#f0f0f0] font-premium selection:bg-amber-500/30">
            <div className="fixed inset-0 spotlight pointer-events-none" />
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFD700]/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />

            <header className="relative z-50 flex justify-between items-center px-4 md:px-12 py-6 md:py-8 border-b border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-3 md:gap-6">
                    <button onClick={() => window.history.back()} className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                        <Award className="text-[#FFD700]/50 group-hover:text-[#FFD700]" size={18} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-2xl font-black italic tracking-tighter truncate">CONTENDER CONTROL</h1>
                        <p className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.4em] text-[#FFD700]/50">Oscar Hierarchy Vault</p>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-container mx-auto py-8 md:py-12 lg:py-20 px-4 md:px-12">
                <div className="flex flex-col gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <Award className="text-[#FFD700]" size={48} strokeWidth={2} />
                        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#FFD700] to-yellow-600">Golden Hierarchy</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Search Panel */}
                    <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[32px] p-6 lg:p-8 space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFD700]/50 flex items-center gap-2">
                            <Search size={14} /> Master Vault Query
                        </label>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#FFD700]/20 to-amber-800/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                            <input 
                                type="text"
                                placeholder="Find a candidate..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="relative w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm font-medium text-white focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                            />
                        </div>
                        
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {searchQuery && searchResults.length === 0 && (
                                <p className="text-xs font-medium text-white/30 text-center py-12 italic">No remaining cinematic subjects.</p>
                            )}
                            {searchQuery && searchResults.slice(0, 15).map(r => (
                                <motion.div 
                                    key={r._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] hover:bg-white/5 cursor-pointer border border-transparent hover:border-[#FFD700]/20 group transition-all"
                                    onClick={() => addToContenders(r)}
                                >
                                    <img src={getProxyImageUrl(r.movie_poster_url)} className="w-10 h-14 md:w-14 md:h-20 object-cover rounded shadow-2xl" alt="poster" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white/90 truncate">{r.movie_title}</p>
                                        <p className="text-[10px] text-[#FFD700]/40 font-black mt-1 uppercase tracking-widest">{r.movie_year}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/10 group-hover:border-[#FFD700]/40 group-hover:bg-[#FFD700]/10 transition-colors">
                                        <Plus size={14} className="text-white/40 group-hover:text-[#FFD700]" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Hierarchy Target Area */}
                    <div className="lg:col-span-8 bg-gradient-to-br from-[#0c0c0c] to-[#FFD700]/[0.02] border border-[#FFD700]/10 rounded-[40px] p-6 lg:p-12 shadow-[0_0_50px_rgba(255,215,0,0.03)] flex flex-col min-h-[700px]">
                        <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                            <div>
                                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white/90">The Chosen List</h2>
                                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[#FFD700]/50 mt-2">Explicit Ordered Deployment</p>
                            </div>
                            <button 
                                onClick={saveHierarchy}
                                disabled={saving}
                                className="group relative px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-gradient-to-r from-[#FFD700] to-yellow-500 overflow-hidden disabled:opacity-30 disabled:pointer-events-none transition-transform active:scale-95"
                            >
                                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full transition-transform duration-700 ease-out skew-x-12" />
                                <div className="relative flex items-center gap-3">
                                    {saving ? <Loader2 size={18} className="animate-spin text-black" /> : <Save size={18} className="text-black" />}
                                    <span className="text-black font-black uppercase tracking-widest text-xs">{saving ? "Deploying..." : "Approve Array"}</span>
                                </div>
                            </button>
                        </div>

                        {loading ? (
                             <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                <Loader2 size={48} className="animate-spin text-[#FFD700]/50" />
                            </div>
                        ) : contenders.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-30">
                                <Award size={80} strokeWidth={1} />
                                <p className="text-sm font-black uppercase tracking-[0.3em]">No Contenders Validated</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {contenders.map((c, index) => (
                                        <motion.div 
                                            key={c._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                            className={`relative flex items-center gap-6 p-4 md:p-6 rounded-3xl border transition-colors ${
                                                index === 0 
                                                    ? 'bg-[#111] border-[#FFD700]/50 shadow-[0_10px_40px_rgba(255,215,0,0.1)]' 
                                                    : index <= 2 
                                                        ? 'bg-[#0a0a0a] border-[#FFD700]/20' 
                                                        : 'bg-black/50 border-white/5'
                                            }`}
                                        >
                                            <div className="w-12 md:w-20 flex flex-col items-center justify-center pointer-events-none">
                                                <span className={`text-4xl md:text-5xl italic font-black ${
                                                    index === 0 ? 'text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]' :
                                                    index <= 2 ? 'text-[#FFD700]/60' : 'text-white/10'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </div>

                                            <img src={getProxyImageUrl(c.movie_poster_url)} className={`w-12 h-16 md:w-16 md:h-24 object-cover rounded-xl shadow-2xl ${index === 0 ? 'scale-110' : ''}`} alt="poster" />
                                            
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h3 className={`font-black truncate ${index === 0 ? 'text-2xl md:text-3xl text-white' : 'text-xl text-white/80'}`}>
                                                    {c.movie_title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[9px] font-black text-[#FFD700]/70 uppercase tracking-[0.2em] bg-[#FFD700]/10 px-3 py-1.5 rounded-md">
                                                        {c.verdict || 'UNRATED'}
                                                    </span>
                                                    <span className="text-sm font-bold text-white/40">{c.overall_rating}/10</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-2">
                                                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-2 md:p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-0 transition-opacity">
                                                        <ArrowUp size={16} className="text-white/60 hover:text-white" />
                                                    </button>
                                                    <button onClick={() => moveDown(index)} disabled={index === contenders.length - 1} className="p-2 md:p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-0 transition-opacity">
                                                        <ArrowDown size={16} className="text-white/60 hover:text-white" />
                                                    </button>
                                                </div>

                                                <button onClick={() => removeFromContenders(c._id)} className="p-4 md:p-5 ml-2 md:ml-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500/60 hover:bg-red-500 hover:text-white hover:scale-110 transition-all group">
                                                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
