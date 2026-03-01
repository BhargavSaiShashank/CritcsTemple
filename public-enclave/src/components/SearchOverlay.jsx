import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, Star, ArrowRight } from 'lucide-react';
import { getLatestReviews } from '../services/api';

const SearchOverlay = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const response = await getLatestReviews(6, 0, query);
                setResults(response.data.reviews || []);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleResultClick = (slug) => {
        onClose();
        navigate(`/review/${slug}`);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 2000,
                        background: 'rgba(8, 8, 8, 0.95)',
                        backdropFilter: 'blur(30px)',
                        padding: 'calc(24px + env(safe-area-inset-top, 0px)) 24px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    {/* Header/Close */}
                    <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '50%',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Search Input Box */}
                    <div style={{ width: '100%', maxWidth: '800px', position: 'relative' }}>
                        <Search
                            size={28}
                            style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#f5a623' }}
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search the Sanctuary..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '24px 24px 24px 64px',
                                fontSize: '24px',
                                fontWeight: 500,
                                color: 'white',
                                outline: 'none',
                                focus: { border: '1px solid #f5a623' }
                            }}
                        />
                    </div>

                    {/* Results Area */}
                    <div style={{
                        width: '100%',
                        maxWidth: '800px',
                        marginTop: '40px',
                        flex: 1,
                        overflowY: 'auto',
                        paddingBottom: '40px'
                    }}>
                        {results.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {results.map((movie) => (
                                    <motion.div
                                        key={movie.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => handleResultClick(movie.slug)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            gap: '16px',
                                            alignItems: 'center',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        whileHover={{ background: 'rgba(255, 255, 255, 0.06)', transform: 'translateY(-2px)' }}
                                    >
                                        <div style={{
                                            width: '60px',
                                            height: '90px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            background: '#1a1a1a'
                                        }}>
                                            <img
                                                src={movie.poster_url}
                                                alt={movie.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{movie.title}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '12px', color: '#f5a623', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                                    <Star size={12} fill="#f5a623" /> {movie.rating}
                                                </span>
                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                                    {movie.verdict}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight size={18} color="rgba(255,255,255,0.2)" />
                                    </motion.div>
                                ))}
                            </div>
                        ) : query && !isLoading ? (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '40px' }}>
                                <Film size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p>No imprints found for "{query}"</p>
                            </div>
                        ) : query ? (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '40px' }}>
                                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 16px' }} />
                                <p>Searching the archive...</p>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', marginTop: '40px' }}>
                                <Search size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                <p>Type to explore the Sanctuary archive</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SearchOverlay;
