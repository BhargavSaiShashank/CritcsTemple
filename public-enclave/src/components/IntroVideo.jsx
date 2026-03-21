import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroVideo({ onComplete }) {
    const videoRef = useRef(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isStarted, setIsStarted] = useState(false);

    useEffect(() => {
        // Safety fallback: 30s for extremely slow/old device initializations
        const fallback = setTimeout(() => {
            if (isVisible) {
                console.warn("[IntroVideo] Global safety skip triggered at 30s.");
                setIsVisible(false);
            }
        }, 30000); 

        return () => clearTimeout(fallback);
    }, [isVisible]);

    const handlePlay = () => {
        console.log("[IntroVideo] Playback started successfully.");
        setIsStarted(true);
    };

    const handleExitComplete = () => {
        onComplete();
    };

    return (
        <AnimatePresence onExitComplete={handleExitComplete}>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: '#000000',
                        zIndex: 99999,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <video
                        ref={videoRef}
                        src="/assets/intro.mp4"
                        autoPlay
                        playsInline
                        preload="auto"
                        muted={false}
                        onPlay={handlePlay}
                        onEnded={() => setIsVisible(false)}
                        onError={(e) => {
                            console.error("[IntroVideo] Video error:", e);
                            setIsVisible(false);
                        }}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            opacity: isStarted ? 1 : 0,
                            transition: 'opacity 0.6s ease-in'
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
