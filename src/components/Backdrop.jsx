import React from 'react';

export default function Backdrop({ image = '/tanjiro.png', blurPx = 18, scale = 1.06, children }) {
    const imgStyle = {
        backgroundImage: `url('${image}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: `blur(${blurPx}px) brightness(0.6) saturate(0.9)`,
        transform: `scale(${scale})`,
    };

    const overlayStyle = {
        background: `radial-gradient(ellipse at center, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.12) 28%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.92) 100%), linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.9) 95%)`,
    };

    return (
        <div className="home-full-bg relative overflow-x-hidden" style={{ minHeight: '100vh', width: '100vw', position: 'relative' }}>
            <div className="absolute inset-0" style={imgStyle} />
            <div className="absolute inset-0" style={overlayStyle} />
            <div className="relative z-10 min-h-screen flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}
