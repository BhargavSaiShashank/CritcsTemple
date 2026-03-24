import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, BookOpen, Info } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            background: '#0a0a0a',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '60px 0 40px',
            marginTop: 'auto',
            position: 'relative',
            zIndex: 10
        }}>
            <div className="max-w-container">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '40px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', background: '#FFD700', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#000', fontWeight: 900, fontSize: '18px' }}>T</span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.2em', color: '#fff', textTransform: 'uppercase' }}>
                            CRITIC'S TEMPLE
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '32px',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        <FooterLink to="/privacy" icon={<Shield size={14} />}>Privacy Policy</FooterLink>
                        <FooterLink to="/guidelines" icon={<BookOpen size={14} />}>Community Guidelines</FooterLink>
                        <FooterLink to="/intelligence" icon={<Info size={14} />}>About the Algorithm</FooterLink>
                    </div>

                    <div style={{
                        marginTop: '20px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.05em'
                    }}>
                        © {new Date().getFullYear()} CRITIC'S TEMPLE. All temporal imprints recorded.
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ to, children, icon }) {
    return (
        <Link 
            to={to} 
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                color: 'rgba(255,255,255,0.4)', 
                textDecoration: 'none', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
            }}
            onMouseOver={e => e.currentTarget.style.color = '#FFD700'}
            onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
            {icon}
            {children}
        </Link>
    );
}
