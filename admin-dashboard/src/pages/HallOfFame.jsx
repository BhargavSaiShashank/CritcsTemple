import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Home, Plus, Trash2, Save, X, Search, Clapperboard,
    ArrowLeft, Loader2, Edit3, GripVertical, Settings, Sparkles, Filter
} from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory, getReviews, getProxyImageUrl } from '../services/api';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function HallOfFame() {
    const [categories, setCategories] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ 
        title: '', description: '', rank: 0, items: [], show_rankings: false,
        type: 'static', dynamic_criteria: { tags: [], language: 'all' }
    });
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
        setFormData({ 
            title: 'New Category', description: '', rank: newRank, items: [], show_rankings: false,
            type: 'static', dynamic_criteria: { tags: [], language: 'all' }
        });
        setIsEditing(true);
    };

    const handleSelectCategory = (cat) => {
        setSelectedCategory(cat);
        setFormData({
            title: cat.title,
            description: cat.description || '',
            rank: cat.rank,
            items: [...(cat.items || [])],
            show_rankings: cat.show_rankings || false,
            type: cat.type || 'static',
            dynamic_criteria: cat.dynamic_criteria || { tags: [], language: 'all' }
        });
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Prepare submission data: map full review objects back to slugs if necessary
            const submissionData = {
                ...formData,
                items: formData.type === 'static' 
                    ? formData.items.map(item => typeof item === 'string' ? item : (item.slug || item)) 
                    : []
            };

            if (selectedCategory && selectedCategory._id) {
                await updateCategory(selectedCategory._id, submissionData);
            } else {
                await createCategory(submissionData);
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

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const newItems = Array.from(formData.items);
        const [reorderedItem] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reorderedItem);
        setFormData({ ...formData, items: newItems });
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
                                            {/* Category Mode Selector */}
                                            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                                                <button
                                                    onClick={() => isEditing && setFormData({ ...formData, type: 'static' })}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${formData.type === 'static' ? 'bg-white/10 text-white border border-white/10' : 'text-white/40 hover:text-white/60'}`}
                                                >
                                                    <GripVertical size={16} />
                                                    <span className="text-sm font-bold">Manual Curation</span>
                                                </button>
                                                <button
                                                    onClick={() => isEditing && setFormData({ ...formData, type: 'dynamic' })}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${formData.type === 'dynamic' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-white/40 hover:text-white/60'}`}
                                                >
                                                    <Sparkles size={16} />
                                                    <span className="text-sm font-bold">Auto-Sync (Genres)</span>
                                                </button>
                                            </div>

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

                                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                                <div>
                                                    <h4 className="text-sm font-bold tracking-tight">Show Ranking Badges</h4>
                                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Displays #1, #2, #3... on every item</p>
                                                </div>
                                                <button
                                                    onClick={() => isEditing && setFormData({ ...formData, show_rankings: !formData.show_rankings })}
                                                    disabled={!isEditing}
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.show_rankings ? 'bg-amber-500' : 'bg-white/10'
                                                        } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.show_rankings ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </button>
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

                                            {/* Item Assignment: Only for static type */}
                                            {formData.type === 'static' ? (
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

                                                    <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {isEditing ? (
                                                            <DragDropContext onDragEnd={onDragEnd}>
                                                                <Droppable droppableId="curated-items">
                                                                    {(provided) => (
                                                                        <div 
                                                                            {...provided.droppableProps} 
                                                                            ref={provided.innerRef}
                                                                            className="space-y-2"
                                                                        >
                                                                            {formData.items.map((slug, index) => {
                                                                                const r = reviews.find(rev => rev.slug === slug);
                                                                                if (!r) return null;
                                                                                return (
                                                                                    <Draggable key={slug} draggableId={slug} index={index}>
                                                                                        {(provided, snapshot) => (
                                                                                            <div
                                                                                                ref={provided.innerRef}
                                                                                                {...provided.draggableProps}
                                                                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                                                                    snapshot.isDragging 
                                                                                                    ? 'bg-amber-500/20 border-amber-500/50 scale-[1.02] shadow-xl z-50' 
                                                                                                    : 'bg-[#111] border-white/5 hover:border-white/10'
                                                                                                }`}
                                                                                            >
                                                                                                <div {...provided.dragHandleProps} className="p-1 hover:bg-white/5 rounded cursor-grab active:cursor-grabbing">
                                                                                                    <GripVertical size={16} className="text-white/20" />
                                                                                                </div>
                                                                                                <img src={getProxyImageUrl(r.movie_poster_url) || '/placeholder.jpg'} alt="" className="w-8 h-12 object-cover rounded opacity-80" />
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <h4 className="text-sm font-bold truncate">{r.movie_title}</h4>
                                                                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{r.verdict}</p>
                                                                                                </div>
                                                                                                <button 
                                                                                                    onClick={() => toggleItem(slug)}
                                                                                                    className="p-2 hover:bg-red-500/20 text-red-500/40 hover:text-red-500 rounded-lg transition-colors"
                                                                                                >
                                                                                                    <Trash2 size={14} />
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </Draggable>
                                                                                );
                                                                            })}
                                                                            {provided.placeholder}
                                                                            
                                                                            {/* Search results integration if needed or separate section? 
                                                                                Actually, let's keep search separate for clarity. */}
                                                                        </div>
                                                                    )}
                                                                </Droppable>
                                                            </DragDropContext>
                                                        ) : (
                                                            // View Mode: Only show selected items
                                                            <div className="space-y-2">
                                                                {formData.items.map(slug => {
                                                                    const r = reviews.find(rev => rev.slug === slug);
                                                                    if (!r) return null;
                                                                    return (
                                                                        <div key={slug} className="flex items-center gap-3 p-3 rounded-xl bg-[#111] border border-white/10">
                                                                            <img src={getProxyImageUrl(r.movie_poster_url) || '/placeholder.jpg'} alt="" className="w-8 h-12 object-cover rounded opacity-80" />
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="text-sm font-bold truncate">{r.movie_title}</h4>
                                                                                <p className="text-xs text-white/40 truncate">{r.verdict}</p>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}

                                                        {isEditing && (
                                                            <div className="mt-8 pt-8 border-t border-white/5">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 italic">Add more from archive</h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                    {filteredReviews.filter(r => !formData.items.includes(r.slug)).slice(0, 10).map(r => (
                                                                        <div
                                                                            key={r.slug}
                                                                            onClick={() => toggleItem(r.slug)}
                                                                            className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-amber-500/30 cursor-pointer transition-all group"
                                                                        >
                                                                            <img src={getProxyImageUrl(r.movie_poster_url) || '/placeholder.jpg'} alt="" className="w-6 h-9 object-cover rounded opacity-40 group-hover:opacity-100" />
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="text-xs font-bold truncate">{r.movie_title}</h4>
                                                                            </div>
                                                                            <Plus size={14} className="text-white/20 group-hover:text-amber-500" />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isEditing && filteredReviews.length === 0 && (
                                                            <div className="col-span-2 text-center py-8 text-white/30 text-sm">No reviews found matching "{searchTerm}"</div>
                                                        )}
                                                        {!isEditing && formData.items.length === 0 && (
                                                            <div className="col-span-2 text-center py-8 text-white/30 text-sm italic">No items assigned to this category.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Dynamic Configuration */
                                                <div className="pt-8 border-t border-white/5 space-y-8">
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
                                                            <Filter size={12} /> Target Genres
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['Action', 'Horror', 'Sci-Fi', 'Thriller', 'Drama', 'War', 'Crime', 'Biography', 'History', 'Mystery', 'Animation', 'Adventure'].map(tag => {
                                                                const isSelected = formData.dynamic_criteria?.tags?.includes(tag);
                                                                return (
                                                                    <button
                                                                        key={tag}
                                                                        disabled={!isEditing}
                                                                        onClick={() => {
                                                                            const tags = formData.dynamic_criteria.tags || [];
                                                                            const newTags = isSelected ? tags.filter(t => t !== tag) : [...tags, tag];
                                                                            setFormData({ 
                                                                                ...formData, 
                                                                                dynamic_criteria: { ...formData.dynamic_criteria, tags: newTags } 
                                                                            });
                                                                        }}
                                                                        className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${isSelected
                                                                            ? 'bg-amber-500 border-amber-600 text-black'
                                                                            : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                                                                            } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        {tag}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Language Group</label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {['en', 'indian', 'all'].map(lang => (
                                                                    <button
                                                                        key={lang}
                                                                        disabled={!isEditing}
                                                                        onClick={() => setFormData({ 
                                                                            ...formData, 
                                                                            dynamic_criteria: { ...formData.dynamic_criteria, language: lang } 
                                                                        })}
                                                                        className={`py-2 rounded-xl border text-xs font-black uppercase transition-all ${formData.dynamic_criteria.language === lang
                                                                            ? 'bg-amber-500 border-amber-600 text-black'
                                                                            : 'bg-white/5 border-white/5 text-white/40'
                                                                            } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        {lang === 'en' ? 'International' : lang === 'indian' ? 'Indian' : 'Universal'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                                            <p className="text-xs text-amber-500/70 font-medium leading-relaxed italic">
                                                                "Automatic categories always pull top-rated movies first. Mixing multiple tags acts as an 'OR' filter."
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

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
