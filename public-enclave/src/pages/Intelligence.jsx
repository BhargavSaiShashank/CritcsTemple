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
            <BackgroundAtmosphere imageUrl={null} />

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
                            SANCTUARY CORE V8.0 • ELITE ENCLAVE
                        </p>
                    </header>

                    <section className="protocol-grid">
                        <ProtocolCard 
                            icon={<TrendingUp size={24} />}
                            title="The Hammer & Zenith"
                            content="The Protocol operates on a proprietary duality. 'The Hammer' measures the cold, technical precision of the cinematic craft, while 'The Zenith' captures the transcendent emotional impact. True greatness is found in their absolute intersection."
                        />
                        <ProtocolCard 
                            icon={<Shield size={24} />}
                            title="Bias Shield V8.0"
                            content="Our Shield is an automated refinement layer that neutralizes genre-specific drifts and critic strictness. It ensures that every review, regardless of genre or era, is processed through a normalized, absolute peer-to-peer lens."
                        />
                        <ProtocolCard 
                            icon={<Star size={24} />}
                            title="Pillar Equilibrium"
                            content="The Protocol analyzes nineteen distinct cinematic aspects across five conceptual pillars. Each aspect is weighted through an iterative stabilization process to ensure the final score represents a cinematic reality rather than a statistical fluke."
                        />
                    </section>

                    <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', marginBottom: '80px' }} />
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
