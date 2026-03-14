import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from '../services/firebase';
import { getMyProfile, getUpcomingPublicMovies, getMyPredictions, makePrediction } from '../services/api';
import Navbar from '../components/Navbar';
import BackgroundAtmosphere from '../components/BackgroundAtmosphere';
import './Predictions.css';
import {
    Sparkles, LogIn, LogOut, Shield, ChevronRight, Loader2, Award, Target, HelpCircle
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const verdicts = [
    "Legendary", "Masterpiece", "Essential", "Elite", "Great",
    "Good", "Decent", "Average", "Mediocre", "Poor",
    "Bad", "Terrible", "Disaster", "Abomination", "Unwatchable"
];

const Predictions = () => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [movies, setMovies] = useState([]);
    const [myPredictions, setMyPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePrediction, setActivePrediction] = useState({}); // { movieId: selectedVerdict }
    const [submittingId, setSubmittingId] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await loadUserData();
            } else {
                setProfile(null);
                setMyPredictions([]);
                await loadMovies(); // Just load movies anyway
            }
        });
        return () => unsubscribe();
    }, []);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const [profRes, predRes] = await Promise.all([
                getMyProfile(),
                getMyPredictions()
            ]);
            setProfile(profRes.data);
            setMyPredictions(predRes.data);
            await loadMovies();
        } catch (err) {
            console.error("Failed to load user data", err);
        } finally {
            setLoading(false);
        }
    };

    const loadMovies = async () => {
        try {
            const { data } = await getUpcomingPublicMovies();
            setMovies(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Login failed:", err);
            alert("Failed to authenticate with Google.");
        }
    };

    const handlePredict = async (movieId) => {
        const verdict = activePrediction[movieId];
        if (!verdict) return alert("Select a prophecy first.");

        setSubmittingId(movieId);
        try {
            await makePrediction(movieId, verdict);
            if (Capacitor.isNativePlatform()) {
                Haptics.notification({ type: NotificationType.Success }).catch(() => Haptics.vibrate());
            }
            await loadUserData(); // Reload to get updated myPredictions list
        } catch (err) {
            console.error("Prediction failed:", err);
            alert(err.response?.data?.detail || "Failed to seal prophecy.");
        } finally {
            setSubmittingId(null);
        }
    };

    const getPredictionForMovie = (movieId) => {
        return myPredictions.find(p => p.upcoming_movie_id === movieId);
    };

    // Calculate level requirements based on prediction_service.py logic
    // Level diff increases by 5 each time. 15, 20, 25...
    const getNextLevelReq = (currentLevel) => {
        let req = 0;
        let diff = 15;
        for (let i = 1; i <= currentLevel; i++) {
            req += diff;
            diff += 5;
        }
        return req;
    };

    return (
        <div className="predictions-page selection:bg-amber-500/30">
            <BackgroundAtmosphere />

            <main className="ritual-surface">

                {/* Hero Section */}
                <div className="hero-section">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="prophecy-badge"
                    >
                        <Sparkles size={14} /> The Prophecy
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="hero-title"
                    >
                        Seal Your <span>Verdict</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="hero-description"
                    >
                        A true critic anticipates the outcome before the curtains part. Predict the final verdict. Rise through the ranks of the Temple.
                    </motion.p>

                    <div className="decorative-divider" />
                </div>

                {loading ? (
                    <div className="loading-center">
                        <Loader2 className="animate-spin text-amber-500" size={48} />
                    </div>
                ) : (
                    <div className="predictions-layout">

                        {/* Control Panel / Profile (Left Sidebar) */}
                        <aside className="sidebar">
                            {user ? (
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="profile-card"
                                >
                                    <button onClick={() => auth.signOut()} className="logout-btn" title="Sign Out">
                                        <LogOut size={18} />
                                    </button>

                                    <div className="level-badge-large">
                                        <span className="label">Level</span>
                                        <span className="value">{profile?.level || 1}</span>
                                    </div>

                                    <div className="user-identity">
                                        <h3 className="text-white font-bold tracking-tight">
                                            {profile?.display_name || user.email.split('@')[0]}
                                        </h3>
                                        <p className="email" title={user.email}>
                                            {user.email}
                                        </p>
                                    </div>

                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <div className="stat-label">
                                                <span>Correct Prophecies</span>
                                                <span className="stat-value">{profile?.correct_predictions || 0}</span>
                                            </div>

                                            {/* Progress Bar */}
                                            {(() => {
                                                const currentLvlReq = profile?.level > 1 ? getNextLevelReq(profile.level - 1) : 0;
                                                const nextLvlReq = getNextLevelReq(profile?.level || 1);
                                                const progress = Math.max(0, Math.min(100, ((profile?.correct_predictions - currentLvlReq) / (nextLvlReq - currentLvlReq)) * 100));
                                                return (
                                                    <div className="progress-container">
                                                        <div className="progress-track">
                                                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                                                        </div>
                                                        <p className="progress-hint">
                                                            {nextLvlReq - profile?.correct_predictions} remaining for Rank {profile?.level + 1}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="badges-section">
                                            <h3 className="badges-title">
                                                <Award size={14} /> Badges of Honor
                                            </h3>
                                            {profile?.badges?.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.badges.map(b => (
                                                        <span key={b} className="badge-tag">
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] italic text-white/10 text-center py-4">
                                                    No badges acquired yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="auth-card"
                                >
                                    <Shield size={64} className="shield-icon" />
                                    <h3>Identify Yourself</h3>
                                    <p>Log in to cast prophecies and ascend the ranks of the Temple.</p>
                                    <button
                                        onClick={handleLogin}
                                        className="google-btn"
                                    >
                                        <LogIn size={20} /> Authenticate with Google
                                    </button>
                                </motion.div>
                            )}
                        </aside>

                        {/* Prophecy Dashboard (Right Main View) */}
                        <section className="main-content">
                            <div className="section-header">
                                <Sparkles size={24} className="icon" />
                                <h2>Active Rites</h2>
                            </div>

                            {movies.length === 0 ? (
                                <div className="empty-temple">
                                    <Shield size={80} className="icon" />
                                    <h3>The Ritual Stillness</h3>
                                    <p>No cinematic imprints currently await your vision.</p>
                                </div>
                            ) : (
                                <div className="movie-grid">
                                    {movies.map(m => {
                                        const myPred = getPredictionForMovie(m._id);
                                        const isResolved = m.status === 'resolved';

                                        return (
                                            <motion.div
                                                key={m._id}
                                                initial={{ y: 20, opacity: 0 }}
                                                whileInView={{ y: 0, opacity: 1 }}
                                                viewport={{ once: true }}
                                                className="movie-ritual-card"
                                            >
                                                <div className="ritual-glow" />

                                                <div className="poster-box">
                                                    {m.poster_url && <img src={m.poster_url} alt={m.title} loading="lazy" />}
                                                    {isResolved && (
                                                        <div className="archived-overlay">
                                                            <span>Archived</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="movie-info">
                                                    <div className="info-header">
                                                        <p>Initiated {new Date(m.created_at).toLocaleDateString()}</p>
                                                        <h3>{m.title}</h3>
                                                    </div>

                                                    <div className="prediction-area">
                                                        {!user ? (
                                                            <div className="locked-prediction">
                                                                <div>
                                                                    <label>Authorization Missing</label>
                                                                    <p className="text-sm text-white/40 italic">Log in to entry the rite.</p>
                                                                </div>
                                                                <Shield size={32} className="text-amber-500/20" />
                                                            </div>
                                                        ) : isResolved ? (
                                                            <div className="resolved-grid">
                                                                <div className="res-box">
                                                                    <p className="res-label">Final Verdict</p>
                                                                    <p className="res-value">{m.actual_verdict}</p>
                                                                </div>
                                                                <div className={`res-box ${myPred ? (myPred.status === 'correct' ? 'correct' : 'wrong') : ''}`}>
                                                                    <p className="res-label">Your Prophecy</p>
                                                                    <p className="res-value">
                                                                        {myPred ? myPred.predicted_verdict : 'None Cast'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : myPred ? (
                                                            <div className="locked-prediction">
                                                                <div>
                                                                    <label>Sealed Prophecy</label>
                                                                    <p className="verdict-val">{myPred.predicted_verdict}</p>
                                                                </div>
                                                                <Sparkles size={40} className="text-amber-500/20" />
                                                            </div>
                                                        ) : (
                                                            <div className="ritual-controls">
                                                                <label className="control-label">Determine the Imprint</label>
                                                                <div className="verdict-selector">
                                                                    {verdicts.map(v => (
                                                                        <button
                                                                            key={v}
                                                                            onClick={() => {
                                                                                setActivePrediction({ ...activePrediction, [m._id]: v });
                                                                                if (Capacitor.isNativePlatform()) {
                                                                                    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => Haptics.vibrate());
                                                                                }
                                                                            }}
                                                                            className={`verdict-btn ${activePrediction[m._id] === v ? 'active' : ''}`}
                                                                        >
                                                                            {v}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <button
                                                                    onClick={() => handlePredict(m._id)}
                                                                    disabled={!activePrediction[m._id] || submittingId === m._id}
                                                                    className="seal-btn"
                                                                >
                                                                    {submittingId === m._id ? <Loader2 className="animate-spin" size={18} /> : (
                                                                        <>Seal Prophecy <ChevronRight size={18} /></>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Predictions;
