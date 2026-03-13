import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Award, Archive, Search, Target, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';

import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export default function Navbar({ onSearchOpen }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Close menu on route change
        setMobileMenuOpen(false);
    }, [location]);

    const handleLogin = async () => {
        try {
            // Attempt Native Auth first
            let nativeResult = null;
            try {
                nativeResult = await FirebaseAuthentication.signInWithGoogle();
                if (nativeResult?.credential?.idToken) {
                    const credential = GoogleAuthProvider.credential(nativeResult.credential.idToken);
                    await signInWithCredential(auth, credential);
                    return; // Success, exit function
                }
            } catch (nativeErr) {
                console.error("NATIVE AUTH ERROR:", nativeErr.message || nativeErr);
                console.log("Native auth unavailable or failed, falling back to Web Auth.", nativeErr);
            }

            // Fallback to Web Auth if native failed or was unavailable
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    const handleLogout = async () => {
        try {
            try {
                await FirebaseAuthentication.signOut();
            } catch (nativeErr) {
                console.log("Native sign out logic bypassed.", nativeErr);
            }
            await signOut(auth);
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={{
            position: 'fixed',
            top: 'calc(var(--safe-top) + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: 'calc(100% - (var(--page-padding) * 2))',
            maxWidth: '1200px',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <div
                className="glass-premium"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '8px 20px',
                    borderRadius: '32px',
                    background: scrolled || mobileMenuOpen ? 'rgba(8, 8, 8, 0.95)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: scrolled || mobileMenuOpen ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
                }}
            >
                {/* Logo */}
                <Link to="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                    color: '#f2f2f2',
                    zIndex: 1001
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f5a623 0%, #f57c00 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
                        padding: '6px'
                    }}>
                        <Film size={18} color="#000" strokeWidth={2.5} />
                    </div>
                    <span style={{
                        display: 'block',
                        fontSize: 'clamp(11px, 3vw, 14px)',
                        fontWeight: 900,
                        letterSpacing: '0.15em',
                        color: '#fff',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                    }}>
                        CRITIC'S TEMPLE
                    </span>
                </Link>

                {/* Desktop Links - HUD Style */}
                <div className="mobile-hidden" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(8px, 1.5vw, 24px)',
                }}>
                    <NavLink to="/" active={isActive('/')} icon={<Archive size={12} />}>Archive</NavLink>
                    <HUDSeparator />
                    <NavLink to="/compare" active={isActive('/compare')} icon={<Film size={12} />}>Compare</NavLink>
                    <HUDSeparator />
                    <NavLink to="/hall-of-fame" active={isActive('/hall-of-fame')} icon={<Award size={12} />}>Hall of Fame</NavLink>
                    <HUDSeparator />
                    <NavLink to="/predictions" active={isActive('/predictions')} icon={<Target size={12} />}>Prophecies</NavLink>

                    <div style={{
                        width: '1px',
                        height: '14px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        margin: '0 8px'
                    }} />

                    <motion.div
                        whileHover={{ scale: 1.1, color: '#f5a623' }}
                        onClick={user ? handleLogout : handleLogin}
                        style={{
                            color: user ? '#f5a623' : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                    >
                        {user ? (
                            <>
                                <span className="mobile-hidden">Logout</span>
                                <LogOut size={16} />
                            </>
                        ) : (
                            <>
                                <span className="mobile-hidden">Login</span>
                                <LogIn size={16} />
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Mobile Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-hidden">
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={user ? handleLogout : handleLogin}
                        style={{
                            color: user ? '#f5a623' : 'rgba(255, 255, 255, 0.6)',
                            padding: '8px'
                        }}
                    >
                        {user ? <LogOut size={18} /> : <LogIn size={18} />}
                    </motion.div>
                    <div
                        onClick={onSearchOpen}
                        style={{ color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', padding: '8px' }}
                    >
                        <Search size={18} />
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{
                            background: mobileMenuOpen ? 'rgba(245, 166, 35, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: mobileMenuOpen ? '#f5a623' : '#fff',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Ritual Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            top: 'calc(100% + 12px)',
                            left: 0,
                            right: 0,
                            background: 'rgba(8, 8, 8, 0.98)',
                            backdropFilter: 'blur(40px)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            zIndex: 999,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                        }}
                    >
                        <MobileNavLink to="/" active={isActive('/')} icon={<Archive size={16} />}>Archive</MobileNavLink>
                        <MobileNavLink to="/compare" active={isActive('/compare')} icon={<Film size={16} />}>Compare</MobileNavLink>
                        <MobileNavLink to="/hall-of-fame" active={isActive('/hall-of-fame')} icon={<Award size={16} />}>Hall of Fame</MobileNavLink>
                        <MobileNavLink to="/predictions" active={isActive('/predictions')} icon={<Target size={16} />}>Prophecies</MobileNavLink>

                        <div style={{ margin: '8px 0', height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />

                        <button
                            onClick={user ? handleLogout : handleLogin}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '13px',
                                fontWeight: 800,
                                textDecoration: 'none',
                                color: user ? '#ff4d4d' : '#f5a623',
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                padding: '14px 16px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                transition: 'all 0.3s ease',
                                textAlign: 'left',
                                width: '100%'
                            }}
                        >
                            {user ? <LogOut size={18} /> : <LogIn size={18} />}
                            {user ? 'Terminate Session' : 'Authenticate'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

function NavLink({ to, children, active, icon }) {
    return (
        <Link to={to} className="no-wrap" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 800,
            textDecoration: 'none',
            color: active ? '#f5a623' : 'rgba(255, 255, 255, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            padding: '4px 8px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            borderRadius: '6px',
            background: active ? 'rgba(245, 166, 35, 0.08)' : 'transparent'
        }}>
            <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
            {children}
            {active && (
                <motion.div
                    layoutId="nav-glow"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at center, rgba(245, 166, 35, 0.15), transparent 70%)',
                        zIndex: -1,
                        borderRadius: '6px'
                    }}
                />
            )}
        </Link>
    );
}

function HUDSeparator() {
    return (
        <div style={{
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            margin: '0 4px'
        }} />
    );
}

function MobileNavLink({ to, children, active, icon }) {
    return (
        <Link to={to} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            fontWeight: 800,
            textDecoration: 'none',
            color: active ? '#f5a623' : 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: '12px 16px',
            background: active ? 'rgba(245, 166, 35, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: active ? '1px solid rgba(245, 166, 35, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'all 0.3s ease'
        }}>
            <span style={{ color: active ? '#f5a623' : 'rgba(255, 255, 255, 0.2)' }}>{icon}</span>
            {children}
            {active && <ChevronIndicator />}
        </Link>
    );
}

function ChevronIndicator() {
    return (
        <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ marginLeft: 'auto', fontSize: '14px' }}
        >
            →
        </motion.span>
    );
}
