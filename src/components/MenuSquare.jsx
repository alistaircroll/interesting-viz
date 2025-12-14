import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';

const MenuSquare = ({ label, onClick, style }) => {
    const boxRef = useRef(null);
    const hands = useStore((state) => state.hands); // Get global hands
    const [status, setStatus] = useState('IDLE'); // IDLE, DETECTED, SELECTED
    const [progress, setProgress] = useState(0); // 0 to 1

    // Timer Ref
    const selectionStartTime = useRef(null);
    const DWELL_TIME = 3000; // 3 seconds

    useEffect(() => {
        if (!boxRef.current) return;

        const rect = boxRef.current.getBoundingClientRect();

        let isCovered = false;
        let isHandOpen = false;

        // Check intersections
        // We assume video is mirrored horizontally (ScaleX -1).
        // Screen X = (1 - Hand X) * Screen Width
        // Screen Y = Hand Y * Screen Height

        hands.forEach(hand => {
            const rawX = parseFloat(hand.coords.x); // 0..1
            const rawY = parseFloat(hand.coords.y); // 0..1

            const screenX = (1 - rawX) * window.innerWidth;
            const screenY = rawY * window.innerHeight;

            if (
                screenX >= rect.left &&
                screenX <= rect.right &&
                screenY >= rect.top &&
                screenY <= rect.bottom
            ) {
                isCovered = true;
                if (hand.gesture === "Open Palm") {
                    isHandOpen = true;
                }
            }
        });

        // State Machine
        if (isCovered) {
            if (isHandOpen) {
                // Should be SELECTED (Filling)
                if (status !== 'SELECTED') {
                    setStatus('SELECTED');
                    selectionStartTime.current = Date.now();
                }
            } else {
                // Covered but not Open Palm -> DETECTED (Hover)
                setStatus('DETECTED');
                selectionStartTime.current = null;
                setProgress(0);
            }
        } else {
            // Not covered -> IDLE
            setStatus('IDLE');
            selectionStartTime.current = null;
            setProgress(0);
        }

    }, [hands, status]); // Re-run on hands update

    // Animation Loop for Progress
    useEffect(() => {
        let animationFrameId;

        const loop = () => {
            if (status === 'SELECTED' && selectionStartTime.current) {
                const elapsed = Date.now() - selectionStartTime.current;
                const p = Math.min(1, elapsed / DWELL_TIME);
                setProgress(p);

                if (p >= 1) {
                    // Action Triggered!
                    onClick();
                    // Reset to prevent double trigger? 
                    // Usually onClick changes view, mounting new components.
                    // If not, we might need a cooldown.
                    setStatus('IDLE');
                    setProgress(0);
                    selectionStartTime.current = null;
                } else {
                    animationFrameId = requestAnimationFrame(loop);
                }
            }
        };

        if (status === 'SELECTED') {
            loop();
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [status, onClick]);


    // Styles
    const baseStyle = {
        width: '150px',
        height: '150px',
        border: '3px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative', // For fill overlay
        cursor: 'default',
        transition: 'background 0.2s',
        ...style // Allow override position
    };

    let background = 'transparent';
    let color = 'rgba(255,255,255,0.5)'; // Muted

    if (status === 'DETECTED') {
        background = 'rgba(255,255,255,0.2)'; // Muted fill
        color = 'white';
    } else if (status === 'SELECTED') {
        background = 'rgba(255,255,255,0.2)';
        color = 'white';
    }

    return (
        <div ref={boxRef} style={{ ...baseStyle, background, color }}>
            {/* Fill Progress Bar */}
            {status === 'SELECTED' && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: `${progress * 100}%`,
                    backgroundColor: '#00aaff', // Bright Color
                    zIndex: 0,
                    transition: 'height 0.1s linear' // Smooth out frame jitters if any
                }} />
            )}

            <span style={{ zIndex: 1, fontWeight: 'bold' }}>{label}</span>
        </div>
    );
};

export default MenuSquare;
