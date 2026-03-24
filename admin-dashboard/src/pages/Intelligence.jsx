import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import {
    TrendingUp, History, LayoutDashboard, Loader2, Star, ChevronRight, Filter, Search, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getReviews, getDNAAnalytics, getEngagementAnalytics, deleteReview, getProxyImageUrl } from '../services/api';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';
import ReviewDetailsModal from '../components/ReviewDetailsModal';

const Intelligence = () => {
    const [dnaData, setDnaData] = useState([]);
    const [engagementData, setEngagementData] = useState({ trending: [], consensus: [] });
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReview, setSelectedReview] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [failedPosters, setFailedPosters] = useState(() => {
        const saved = localStorage.getItem('failed_sanctuary_posters');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        localStorage.setItem('failed_sanctuary_posters', JSON.stringify(Array.from(failedPosters)));
    }, [failedPosters]);

    const handlePosterError = (e, url) => {
        if (url && !failedPosters.has(url)) {
            setFailedPosters(prev => new Set(prev).add(url));
        }
        e.target.src = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=800";
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [dnaRes, engagementRes, reviewsRes] = await Promise.all([
                    getDNAAnalytics(),
                    getEngagementAnalytics(),
                    getReviews()
                ]);
                const allowedAspects = [
                    'Story', 'Screenplay', 'Originality', 'Opening', 'Climax',
                    'Direction', 'Acting', 'Dialogues',
                    'Cinematography', 'Editing', 'Production Design', 'Vfx',
                    'Bg Score', 'Music',
                    'Pacing', 'Emotional Impact', 'Rewatch Value'
                ];
                const filteredDNA = (dnaRes.data || []).filter(item => allowedAspects.includes(item.subject));
                setDnaData(filteredDNA);
                setEngagementData(engagementRes.data || { trending: [], consensus: [] });
                setReviews(reviewsRes.data || []);
            } catch (err) {
                console.error("Failed to fetch intelligence data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredReviews = reviews.filter(r => {
        const matchesStatus = filter === 'all' ? true : r.status === filter;
        const matchesSearch = r.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.verdict.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this critique?")) {
            try {
                await deleteReview(id);
                setReviews(reviews.filter(r => (r._id || r.id) !== id));
                setIsModalOpen(false);
                setSelectedReview(null);
            } catch (err) {
                console.error("Failed to delete review:", err);
                alert("Failed to delete the critique. Check console for details.");
            }
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden overflow-y-auto">
            <BackgroundAtmosphere imageUrl={reviews[0]?.movie_id ? `https://images.unsplash.com/photo-1485846234645-a62644f84728?q=30&w=1000` : null} />

            {/* Header / Nav */}
            <div className="max-w-container pt-8 md:pt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-amber-500/60 mb-2">
                        <TrendingUp size={20} />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Sanctuary Intelligence</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter">
                        CINEMATIC <span className="text-amber-500">DNA</span>
                    </h1>
                </div>

                <div className="flex gap-4">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl border border-white/5 transition-all group"
                    >
                        <LayoutDashboard size={16} className="group-hover:text-amber-500 transition-colors md:w-[18px] md:h-[18px]" />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Dashboard</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-container grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 relative z-10">
                {/* Radar Chart Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-12 xl:col-span-5 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 p-10 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

                    <div className="flex items-center justify-between mb-10 relative">
                        <div>
                            <h2 className="text-2xl font-black italic">LEXICON PROFILE</h2>
                            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">17-Tier Structural Analysis</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="text-amber-500" size={24} />
                        </div>
                    </div>

                    <div className="h-[300px] md:h-[450px] w-full mt-4 transform group-hover:scale-105 transition-transform duration-1000 relative" style={{ minHeight: '400px', minWidth: '1px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={dnaData}>
                                    <PolarGrid stroke="#ffffff10" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={({ payload, x, y, textAnchor, stroke, radius }) => (
                                            <g transform={`translate(${x},${y})`}>
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={4}
                                                    textAnchor={textAnchor}
                                                    fill="#ffffff40"
                                                    fontSize={8}
                                                    fontWeight={900}
                                                    className="uppercase tracking-tighter"
                                                >
                                                    {payload.value}
                                                </text>
                                            </g>
                                        )}
                                    />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 10]}
                                        axisLine={false}
                                        tick={false}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-black/80 backdrop-blur-xl border border-amber-500/30 p-4 rounded-2xl shadow-2xl flex flex-col gap-1">
                                                        <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">{data.subject}</div>
                                                        <div className="text-2xl font-black text-amber-500 italic">
                                                            {data.A.toFixed(2)}
                                                            <span className="text-xs text-white/10 not-italic ml-2 font-black">/ 10</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Radar
                                        name="Sanctuary"
                                        dataKey="A"
                                        stroke="#f59e0b"
                                        fill="#f59e0b"
                                        fillOpacity={0.4}
                                        dot={{ r: 4, fill: '#f59e0b', fillOpacity: 0.8, stroke: '#fff', strokeWidth: 1 }}
                                        activeDot={{ r: 6, fill: '#fff', stroke: '#f59e0b', strokeWidth: 2 }}
                                        animationBegin={500}
                                        animationDuration={2000}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Engagement Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {/* Trending Card */}
                    <div className="bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                <TrendingUp className="text-amber-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black italic uppercase">Trending</h3>
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Top Claps</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {engagementData.trending.map((item, i) => (
                                <div key={item.slug} className="flex items-center gap-4 group cursor-default">
                                    <div className="w-8 h-10 rounded-lg bg-white/5 overflow-hidden">
                                        <img src={getProxyImageUrl(item.poster) || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-white/70 truncate uppercase">{item.title}</p>
                                        <p className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest">{item.claps} CLAPS</p>
                                    </div>
                                    <div className="text-[10px] font-black text-white/10 group-hover:text-amber-500 transition-colors italic">#{i + 1}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Consensus Card */}
                    <div className="bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Sparkles className="text-blue-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black italic uppercase">Consensus</h3>
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Reaction Totals</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {engagementData.consensus.map((item) => (
                                <div key={item.slug} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-bold text-white/70 truncate uppercase">{item.title}</p>
                                        <p className="text-[8px] font-bold text-white/30">{item.total} REAX</p>
                                    </div>
                                    <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
                                        <div style={{ width: `${(item.reactions.agree / item.total) * 100 || 0}%` }} className="bg-green-500/50" />
                                        <div style={{ width: `${(item.reactions.disagree / item.total) * 100 || 0}%` }} className="bg-red-500/50" />
                                        <div style={{ width: `${(item.reactions.havent_seen / item.total) * 100 || 0}%` }} className="bg-white/20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* History Gallery Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-12 space-y-8 mt-12"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                        <div>
                            <div className="flex items-center gap-3 text-white/40 mb-2">
                                <History size={20} />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Sanctuary Scroll</span>
                            </div>
                            <h2 className="text-3xl font-black italic">HISTORY <span className="text-amber-500">GALLERY</span></h2>
                        </div>

                        <div className="flex gap-4">
                            <div className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                                <input
                                    type="text"
                                    placeholder="SEARCH VERDICTS..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-500/50 transition-all w-full md:w-64"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        {loading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />
                            ))
                        ) : filteredReviews.map((review, idx) => (
                            <motion.div
                                key={review._id || review.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (idx * 0.05) }}
                                whileHover={{ scale: 1.02, y: -5 }}
                                onClick={() => {
                                    setSelectedReview(review);
                                    setIsModalOpen(true);
                                }}
                                className="group bg-white/5 backdrop-blur-xl border border-white/5 p-6 rounded-[32px] flex gap-6 hover:border-amber-500/30 transition-all duration-500 cursor-pointer"
                            >
                                <div className="w-24 aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 shadow-xl transition-transform duration-700 group-hover:scale-110">
                                    <img
                                        src={failedPosters.has(review.movie_poster_url) || !review.movie_poster_url
                                                ? "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=800"
                                            : getProxyImageUrl(review.movie_poster_url)}
                                        className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                                        alt={review.movie_title}
                                        onError={(e) => handlePosterError(e, review.movie_poster_url)}
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{review.verdict}</span>
                                            <div className="h-1 w-1 rounded-full bg-white/20" />
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors uppercase">
                                            {review.movie_title || `Critique #${(review._id || review.id || '').slice(-4)}`}
                                        </h3>
                                        <p className="text-xs text-white/40 line-clamp-2 font-medium italic">
                                            "{review.summary}"
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Star size={12} fill="currentColor" />
                                        <span className="text-sm font-black italic">{review.overall_rating}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {!loading && filteredReviews.length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                                <History size={48} className="mx-auto" />
                                <p className="text-xs uppercase tracking-[0.4em] font-black">Sanctuary Empty</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Review Details Modal */}
            <ReviewDetailsModal
                review={selectedReview}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setTimeout(() => setSelectedReview(null), 300); // Wait for exit animation
                }}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default Intelligence;
