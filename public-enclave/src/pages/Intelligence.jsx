import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, History, LayoutDashboard, Loader2, Star, ChevronRight, Filter, Search, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLatestReviews } from '../services/api';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';
import ReviewDetailsModal from '../components/ReviewDetailsModal';

const Intelligence = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReview, setSelectedReview] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const reviewsRes = await getLatestReviews(50);
                setReviews(reviewsRes.data || []);
            } catch (err) {
                console.error("Failed to fetch sanctuary data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredReviews = reviews.filter(r => {
        const matchesSearch = r.movie_title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             r.summary?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div style={{ background: '#080808', minHeight: '100vh', padding: '120px 0 80px' }}>
            <BackgroundAtmosphere imageUrl={reviews[0]?.movie_poster_url} />

            <div className="max-w-container">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}
                >
                    <header style={{ marginBottom: '80px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(245,166,35,0.1)', borderRadius: '16px', marginBottom: '20px' }}>
                            <TrendingUp size={32} color="var(--amber)" />
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: '16px', fontStyle: 'italic' }}>
                            Cinematic DNA Protocol
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            SANCTUARY CORE V8.0 • ACTIVE
                        </p>
                    </header>

                    <section style={{ display: 'grid', gap: '32px', marginBottom: '100px' }}>
                        <ProtocolCard 
                            icon={<TrendingUp size={24} />}
                            title="Refinement HUD"
                            content="Our scoring engine utilizes the Hammer/Zenith dichotomy—a dual-layered weighting system that separates technical craft from emotional resonance. Every decimal point is a temporal imprint of focus."
                        />
                        <ProtocolCard 
                            icon={<Shield size={24} />}
                            title="Bias Shield"
                            content="Proprietary simulation layers neutralize genre-specific drift and critic strictness. Whether it's a minimal indie or a maximalist blockbuster, the Shield ensures an absolute peer-to-peer comparison."
                        />
                        <ProtocolCard 
                            icon={<Star size={24} />}
                            title="Masterpiece Detection"
                            content="The protocol automatically identifies high-tier critiques (≥ 8.5) that have been culturally overlooked by mainstream award hierarchies. We prioritize truth over buzz."
                        />
                    </section>

                    <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', marginBottom: '80px' }} />

                    <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            <History size={20} />
                            <h2 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em' }}>History Gallery</h2>
                        </div>
                        
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                            <input 
                                type="text"
                                placeholder="Search the record..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '16px 16px 16px 50px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {loading ? (
                            [1, 2, 3, 4].map(i => <div key={i} style={{ height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }} className="skeleton" />)
                        ) : filteredReviews.map((review, idx) => (
                            <motion.div
                                key={review._id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => { setSelectedReview(review); setIsModalOpen(true); }}
                                style={{ 
                                    background: 'rgba(255,255,255,0.02)', 
                                    border: '1px solid rgba(255,255,255,0.05)', 
                                    borderRadius: '20px', 
                                    padding: '20px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    gap: '16px',
                                    alignItems: 'center'
                                }}
                                whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.04)' }}
                            >
                                <div style={{ width: '60px', height: '90px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                                    <img src={review.movie_poster_url} style={{ width: '100%', h: '100%', objectFit: 'cover' }} alt="" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{review.verdict}</div>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '4px' }} className="line-clamp-1">{review.movie_title}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--amber)', fontSize: '13px', fontWeight: 900 }}>
                                        <Star size={10} fill="currentColor" />
                                        <span>{parseFloat(review.overall_rating || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <ReviewDetailsModal
                review={selectedReview}
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setTimeout(() => setSelectedReview(null), 300); }}
                onDelete={() => {}}
            />
        </div>
    );
};

function ProtocolCard({ icon, title, content }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', color: 'var(--amber)' }}>
                <div style={{ padding: '10px', background: 'rgba(245,166,35,0.1)', borderRadius: '12px' }}>{icon}</div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic' }}>{title}</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontSize: '16px', fontWeight: 500 }}>
                {content}
            </p>
        </div>
    );
}

export default Intelligence;
