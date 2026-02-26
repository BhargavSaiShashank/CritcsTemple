import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Award, Archive, Search } from 'lucide-react';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: scrolled ? '12px 0' : '24px 0',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            background: scrolled ? 'rgba(8, 8, 8, 0.85)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
        }}>
            <div className="max-w-container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                {/* Logo */}
                <Link to="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    color: '#f2f2f2'
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f5a623 0%, #f57c00 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)'
                    }}>
                        <Film size={20} color="#000" strokeWidth={2.5} />
                    </div>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(to bottom, #fff, #aaa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        SANCTUARY
                    </span>
                </Link>

                {/* Links */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '32px'
                }}>
                    <NavLink to="/" active={isActive('/')} icon={<Archive size={14} />}>Archive</NavLink>
                    <NavLink to="/hall-of-fame" active={isActive('/hall-of-fame')} icon={<Award size={14} />}>Hall of Fame</NavLink>

                    <div style={{
                        width: '1px',
                        height: '20px',
                        background: 'rgba(255, 255, 255, 0.1)'
                    }} />

                    {/* Search trigger or just indicator */}
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                    }} onMouseEnter={e => e.currentTarget.style.color = '#f5a623'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}>
                        <Search size={18} />
                    </div>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ to, children, active, icon }) {
    return (
        <Link to={to} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            color: active ? '#f5a623' : 'rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s ease',
            position: 'relative',
            padding: '4px 0'
        }}>
            {icon}
            {children}
            {active && (
                <div style={{
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#f5a623',
                    borderRadius: '99px',
                    boxShadow: '0 0 8px rgba(245, 166, 35, 0.5)'
                }} />
            )}
        </Link>
    );
}
