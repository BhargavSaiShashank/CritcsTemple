import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clapperboard, Trophy, Flame } from 'lucide-react';

const NAV = [
    { to: '/', label: 'Archive', icon: Flame },
    { to: '/hall-of-fame', label: 'Hall of Fame', icon: Trophy },
];

export default function PublicHeader() {
    const { pathname } = useLocation();

    return (
        <header style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
            height: '60px',
            background: 'rgba(8,8,8,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
            <div className="max-w-container" style={{
                height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '10px'
            }}>
                {/* Brand */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f5a623 0%, #c47a0a 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(245,166,35,0.25)',
                    }}>
                        <Clapperboard size={16} color="#000" strokeWidth={2.5} />
                    </div>
                    <div style={{ lineHeight: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#f2f2f2', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                            THE SANCTUARY
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(245,166,35,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '2px' }}>
                            Cinema Archive
                        </div>
                    </div>
                </Link>

                {/* Nav pills */}
                <div style={{ display: 'none', gap: '32px', '@media (minWidth: 768px)': { display: 'flex' } }}>
                    {[
                        { to: '/', label: 'Archive' },
                        { to: '/compare', label: 'Compare' },
                        { to: '/hall-of-fame', label: 'Hall of Fame' }
                    ].map(({ to, label }) => {
                        const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
                        return (
                            <Link key={to} to={to} style={{
                                display: 'flex', alignItems: 'center', gap: '7px',
                                padding: '7px 15px', borderRadius: '10px',
                                fontSize: '12px', fontWeight: 600, textDecoration: 'none',
                                letterSpacing: '0.01em',
                                color: active ? '#f5a623' : 'rgba(255,255,255,0.4)',
                                background: active ? 'rgba(245,166,35,0.09)' : 'transparent',
                                border: active ? '1px solid rgba(245,166,35,0.15)' : '1px solid transparent',
                                transition: 'all 0.18s ease',
                            }}>
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}
