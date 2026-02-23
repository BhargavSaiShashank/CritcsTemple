import React from 'react';

const BackgroundAtmosphere = ({ imageUrl }) => {
    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            {/* Subtle ambient glow */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(245,166,35,0.05) 0%, transparent 70%)',
                borderRadius: '50%',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '50%',
                height: '50%',
                background: 'radial-gradient(circle, rgba(245,166,35,0.04) 0%, transparent 70%)',
                borderRadius: '50%',
            }} />
        </div>
    );
};

export default BackgroundAtmosphere;
