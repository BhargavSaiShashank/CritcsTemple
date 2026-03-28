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

    return (
        <div className="min-h-screen bg-[#020202] text-[#f0f0f0] font-premium pb-20">
            <BackgroundAtmosphere />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32">
                <Link 
                    to="/hall-of-fame" 
                    className="inline-flex items-center gap-2 text-white/40 hover:text-amber-500 transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Hall of Fame</span>
                </Link>

                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        {category.type === 'dynamic' && <Sparkles size={16} className="text-amber-500" />}
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase whitespace-pre-line">
                            {category.title}
                        </h1>
                    </div>
                    {category.description && (
                        <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
                            {category.description}
                        </p>
                    )}
                    <div className="mt-6 flex items-center gap-4">
                        <div className="px-4 py-1 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">
                                {category.items?.length || 0} Total Critiques
                            </span>
                        </div>
                    </div>
                </header>

                <div className="pt-8 border-t border-white/5">
                    <ReviewGrid 
                        reviews={category.items || []} 
                        showRankings={category.show_rankings}
                    />
                </div>
            </div>
        </div>
    );
}
