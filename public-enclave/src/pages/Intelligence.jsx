import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, History, LayoutDashboard, Loader2, Star, ChevronRight, Filter, Search, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLatestReviews } from '../services/api';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';
import ReviewDetailsModal from '../components/ReviewDetailsModal';
import './Intelligence.css';

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
        <div className="intelligence-page">
            <BackgroundAtmosphere imageUrl={reviews[0]?.movie_poster_url} />

            <div className="max-w-container">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}
                >
                    <header className="protocol-header">
                        <div className="protocol-icon-wrapper">
                            <TrendingUp size={32} color="var(--amber)" />
                        </div>
                        <h1 className="protocol-title">
                            Cinematic DNA Protocol
                        </h1>
                        <p className="protocol-subtitle">
                            SANCTUARY CORE V8.0 • ACTIVE
                        </p>
                    </header>

                    <section className="protocol-grid">
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

                    <div className="history-section-header">
                         <div className="history-title-wrapper">
                            <History size={20} />
                            <h2 className="history-title">History Gallery</h2>
                        </div>
                        
                        <div className="search-wrapper">
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                            <input 
                                type="text"
                                placeholder="Search the record..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="history-grid">
                        {loading ? (
                            [1, 2, 3, 4].map(i => <div key={i} style={{ height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }} className="skeleton" />)
                        ) : filteredReviews.map((review, idx) => (
                            <motion.div
                                key={review._id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => { setSelectedReview(review); setIsModalOpen(true); }}
                                className="history-item"
                                whileHover={{ scale: 1.02 }}
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
        <div className="protocol-card">
            <div className="protocol-card-header">
                <div className="protocol-card-icon">{icon}</div>
                <h2 className="protocol-card-title">{title}</h2>
            </div>
            <p className="protocol-card-content">
                {content}
            </p>
        </div>
    );
}

export default Intelligence;
