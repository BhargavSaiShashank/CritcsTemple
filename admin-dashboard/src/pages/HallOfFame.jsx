import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Home, Plus, Trash2, Save, X, Search, Clapperboard,
    ArrowLeft, Loader2, Edit3, GripVertical
} from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory, getReviews } from '../services/api';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';

export default function HallOfFame() {
    const [categories, setCategories] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ title: '', description: '', rank: 0, items: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, revRes] = await Promise.all([
                getCategories(),
                getReviews()
            ]);
            setCategories(catRes.data || []);
            setReviews(revRes.data || []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        const newRank = categories.length > 0 ? Math.max(...categories.map(c => c.rank)) + 1 : 1;
        setSelectedCategory(null);
        setFormData({ title: 'New Category', description: '', rank: newRank, items: [] });
        setIsEditing(true);
    };

    const handleSelectCategory = (cat) => {
        setSelectedCategory(cat);
        setFormData({
            title: cat.title,
            description: cat.description || '',
            rank: cat.rank,
            items: [...cat.items]
        });
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (selectedCategory && selectedCategory._id) {
                await updateCategory(selectedCategory._id, formData);
            } else {
                await createCategory(formData);
            }
            await fetchData();
            setIsEditing(false);
            setSelectedCategory(null);
        } catch (err) {
            console.error("Failed to save category:", err);
            alert("Failed to save category");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            await deleteCategory(id);
            if (selectedCategory?._id === id) {
                setSelectedCategory(null);
                setIsEditing(false);
            }
            await fetchData();
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const toggleItem = (slug) => {
        setFormData(prev => {
            const hasItem = prev.items.includes(slug);
            return {
                ...prev,
                items: hasItem
                    ? prev.items.filter(i => i !== slug)
                    : [...prev.items, slug]
            };
        });
    };

    const filteredReviews = reviews.filter(r =>
        r.status === 'published' &&
        (r.movie_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.slug?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#020202] text-[#f0f0f0] font-premium selection:bg-amber-500/30 pb-20">
            <BackgroundAtmosphere />
            <div className="fixed inset-0 spotlight pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-6">
                        <Link to="/dashboard" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group">
                            <ArrowLeft className="text-white/40 group-hover:text-amber-500 transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter">HALL OF FAME</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/50 mt-1">Category Control</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-amber-500" size={40} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Sidebar: Category List */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold uppercase tracking-widest text-white/50">Categories</h2>
                                <button
                                    onClick={handleCreateNew}
                                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {categories.map(cat => (
                                    <div
                                        key={cat._id}
                                        onClick={() => handleSelectCategory(cat)}
                                        className={`group p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${selectedCategory?._id === cat._id
                                            ? 'bg-amber-500/10 border-amber-500/30'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-xs font-black text-amber-500/50 mb-1">RANK {cat.rank}</div>
                                                <h3 className="font-bold text-lg">{cat.title}</h3>
                                                <p className="text-xs text-white/40 mt-1">{cat.items.length} items</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(cat._id); }}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <p className="text-sm text-white/30 italic">No categories created yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Main Body: Category Editor */}
                        <div className="lg:col-span-8">
                            <AnimatePresence mode="wait">
                                {(selectedCategory || isEditing) ? (
                                    <motion.div
                                        key="editor"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8"
                                    >
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-xl font-bold italic tracking-wider">
                                                {isEditing ? (selectedCategory ? 'Edit Category' : 'Create Category') : 'Category Details'}
                                            </h2>
                                            {!isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    {selectedCategory && (
                                                        <button
                                                            onClick={() => handleDelete(selectedCategory._id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                            <span className="text-sm font-bold">Delete</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setIsEditing(true)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                                    >
                                                        <Edit3 size={16} />
                                                        <span className="text-sm font-bold">Edit</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (selectedCategory) handleSelectCategory(selectedCategory);
                                                            else { setIsEditing(false); setSelectedCategory(null); }
                                                        }}
                                                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                        className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-xl transition-colors disabled:opacity-50"
                                                    >
                                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                        <span>SAVE</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            {/* Metadata Form */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="col-span-1 md:col-span-3">
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Title</label>
                                                    <input
                                                        type="text"
                                                        value={formData.title}
                                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                        disabled={!isEditing}
                                                        className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                                                        placeholder="e.g. Masterpieces"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Display Rank</label>
                                                    <input
                                                        type="number"
                                                        value={formData.rank}
                                                        onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) || 0 })}
                                                        disabled={!isEditing}
                                                        className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Description</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    disabled={!isEditing}
                                                    rows={2}
                                                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50 resize-none"
                                                />
                                            </div>

                                            {/* Item Assignment */}
                                            <div className="pt-8 border-t border-white/5">
                                                <div className="flex items-center justify-between mb-6">
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Curated Items ({formData.items.length})</label>
                                                    {isEditing && (
                                                        <div className="relative">
                                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search archive..."
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                className="bg-[#111] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-amber-500/30 w-64"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {isEditing ? (
                                                        filteredReviews.map(r => {
                                                            const isSelected = formData.items.includes(r.slug);
                                                            return (
                                                                <div
                                                                    key={r.slug}
                                                                    onClick={() => toggleItem(r.slug)}
                                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#111] border-white/5 hover:border-white/20'
                                                                        }`}
                                                                >
                                                                    <img src={r.movie_poster_url || '/placeholder.jpg'} alt="" className="w-8 h-12 object-cover rounded opacity-80" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-bold truncate">{r.movie_title}</h4>
                                                                        <p className="text-xs text-white/40 truncate">{r.verdict}</p>
                                                                    </div>
                                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />}
                                                                </div>
                                                            )
                                                        })
                                                    ) : (
                                                        // View Mode: Only show selected items
                                                        formData.items.map(slug => {
                                                            const r = reviews.find(rev => rev.slug === slug);
                                                            if (!r) return null;
                                                            return (
                                                                <div key={slug} className="flex items-center gap-3 p-3 rounded-xl bg-[#111] border border-white/5">
                                                                    <img src={r.movie_poster_url || '/placeholder.jpg'} alt="" className="w-8 h-12 object-cover rounded opacity-80" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-bold truncate">{r.movie_title}</h4>
                                                                        <p className="text-xs text-white/40 truncate">{r.verdict}</p>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    )}

                                                    {isEditing && filteredReviews.length === 0 && (
                                                        <div className="col-span-2 text-center py-8 text-white/30 text-sm">No reviews found matching "{searchTerm}"</div>
                                                    )}
                                                    {!isEditing && formData.items.length === 0 && (
                                                        <div className="col-span-2 text-center py-8 text-white/30 text-sm italic">No items assigned to this category.</div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full min-h-[400px] flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-white/[0.02]"
                                    >
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <Clapperboard className="text-white/20" size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white/50 mb-2">Select a Category</h3>
                                        <p className="text-sm text-white/30 max-w-sm text-center">
                                            Choose a category from the sidebar to edit its curated list, or create a new one.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
