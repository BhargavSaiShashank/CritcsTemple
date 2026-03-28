import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { getCategories } from '../services/api';
import ReviewGrid from '../components/ReviewGrid';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';

export default function CategoryDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategory();
    }, [slug]);

    const fetchCategory = async () => {
        setLoading(true);
        try {
            const res = await getCategories();
            const allCategories = res.data || [];
            // Find category by title (slugified) or we might need a slug in the model.
            // For now, let's slugify the title for matching if no slug exists.
            const cat = allCategories.find(c => 
                c.title.toLowerCase().replace(/ /g, '-') === slug
            );
            
            if (cat) {
                setCategory(cat);
            } else {
                console.error("Category not found:", slug);
                navigate('/hall-of-fame');
            }
        } catch (err) {
            console.error("Failed to fetch category:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020202] flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
        );
    }

    if (!category) return null;

    const hero = category?.items && category.items.length > 0 ? category.items[0] : null;

    return (
        <div style={{ minHeight: '100vh', background: '#080808', overflowX: 'hidden' }}>
            <BackgroundAtmosphere />
            
            {/* Header banner */}
            <div style={{ position: 'relative', overflow: 'hidden', height: '45vh', minHeight: '380px' }}>
                {hero?.movie_poster_url && (
                    <div style={{ position: 'absolute', inset: 0 }}>
                        <motion.img
                            key={hero._id || hero.id || 'hero'}
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            src={hero.movie_poster_url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.12) saturate(0.5)' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, #080808 100%)' }} />
                    </div>
                )}

                <div className="max-w-container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Link 
                            to="/hall-of-fame" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textDecoration: 'none', marginBottom: '24px', transition: 'all 0.3s ease' }}
                            className="hover:bg-white/10"
                        >
                            <ArrowLeft size={11} color="rgba(255,255,255,0.6)" />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Back to Hall of Fame</span>
                        </Link>

                        <h1 
                            className="display" 
                            style={{ 
                                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', 
                                fontWeight: 800, 
                                color: '#f2f2f2', 
                                letterSpacing: '-0.03em', 
                                lineHeight: 1.05,
                                marginBottom: '16px'
                            }}
                        >
                            {category.title}
                        </h1>
                        
                        {category.description && (
                            <p style={{ fontSize: '17px', fontWeight: 300, color: 'rgba(255,255,255,0.45)', maxWidth: '500px', lineHeight: 1.8, marginBottom: '0' }}>
                                {category.description}
                            </p>
                        )}
                    </motion.div>
                </div>

                {/* Divider glow */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(245,166,35,0.1), transparent)' }} />
            </div>

            <div className="max-w-container" style={{ paddingTop: '48px', paddingBottom: '100px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '99px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.14)', marginBottom: '32px' }}>
                    {category.type === 'dynamic' && (
                        <Sparkles size={11} color="#f5a623" />
                    )}
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245,166,35,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        Total Critiques: {category.items?.length || 0}
                    </span>
                </div>

                <div className="w-full">
                    <ReviewGrid 
                        reviews={category.items || []} 
                        showRankings={category.show_rankings}
                    />
                </div>
            </div>
        </div>
    );
}
