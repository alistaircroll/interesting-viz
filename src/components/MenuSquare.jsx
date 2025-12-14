
import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { Hand } from 'lucide-react';

const MenuSquare = ({ label, onClick, style }) => {
    const boxRef = useRef(null);
    const progressRef = useRef(null); // Direct DOM access for performance
    const hands = useStore((state) => state.hands); // Get global hands
    const [status, setStatus] = useState('IDLE'); // IDLE, DETECTED, SELECTED
    // const [progress, setProgress] = useState(0); // Removed state-based progress
    const [hoverState, setHoverState] = useState({ opacity: 0, x: 0, y: 0 }); // Ghost Hand

    // Timer Ref
    const selectionStartTime = useRef(null);
    const DWELL_TIME = 1000; // 1 second (faster selection)

    useEffect(() => {
        if (!boxRef.current) return;

        const rect = boxRef.current.getBoundingClientRect();

        // Expansion using padding logic
        const PAD = 40; // Reduced from 100 to prevent overlapping proximity triggers
        const nearRect = {
            left: rect.left - PAD,
            right: rect.right + PAD,
            top: rect.top - PAD,
            bottom: rect.bottom + PAD
        };

        let isCovered = false;
        let isNear = false;
        let isHandOpen = false;

        // Ghost Hand Local Coords
        let handX = 0;
        let handY = 0;

        hands.forEach(hand => {
            const rawX = parseFloat(hand.coords.x); // 0..1
            const rawY = parseFloat(hand.coords.y); // 0..1

            const screenX = (1 - rawX) * window.innerWidth;
            const screenY = rawY * window.innerHeight;

            // Check Interaction Zone (Strict)
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

            // Check Near Zone (Expanded)
            if (
                screenX >= nearRect.left &&
                screenX <= nearRect.right &&
                screenY >= nearRect.top &&
                screenY <= nearRect.bottom
            ) {
                isNear = true;
                // Track relative to box center or top-left?
                // Let's use top-left for absolute positioning inside the relative box
                // Wait, if box is relative, absolute child is relative to box.
                // Box origin is (0,0).
                // Hand relative X = screenX - rect.left
                handX = screenX - rect.left;
                handY = screenY - rect.top;
            }
        });

        // State Machine
        if (isCovered) {
            if (isHandOpen) {
                if (status !== 'SELECTED') {
                    setStatus('SELECTED');
                    selectionStartTime.current = Date.now();
                }
            } else {
                setStatus('DETECTED');
                selectionStartTime.current = null;
                // setProgress(0);
                if (progressRef.current) progressRef.current.style.height = '0%';
            }
        } else {
            setStatus('IDLE');
            selectionStartTime.current = null;
            // setProgress(0);
            if (progressRef.current) progressRef.current.style.height = '0%';
        }

        // Ghost Hand State
        if (isNear) {
            setHoverState({ opacity: 1, x: handX, y: handY });
        } else {
            setHoverState({ opacity: 0, x: 0, y: 0 });
        }

        return () => {
            // NO cleanup of selectionStartTime here
        };
    }, [hands, status]);

    // Separate cleanup for Unmount ONLY
    useEffect(() => {
        return () => {
            selectionStartTime.current = null;
        };
    }, []);

    // Animation Loop for Progress
    useEffect(() => {
        let animationFrameId;

        const loop = () => {
            if (status === 'SELECTED' && selectionStartTime.current) {
                const elapsed = Date.now() - selectionStartTime.current;
                const p = Math.min(1, elapsed / DWELL_TIME);

                // Direct DOM update
                if (progressRef.current) {
                    progressRef.current.style.height = `${p * 100}%`;
                }

                if (p >= 1) {
                    // Action Triggered!
                    onClick();
                    // Reset to prevent double trigger?
                    // Usually onClick changes view, mounting new components.
                    // If not, we might need a cooldown.
                    setStatus('IDLE');
                    // setProgress(0); // Removed state-based progress
                    selectionStartTime.current = null;
                    if (progressRef.current) progressRef.current.style.height = '0%';
                } else {
                    animationFrameId = requestAnimationFrame(loop);
                }
            } else {
                if (progressRef.current) progressRef.current.style.height = '0%';
            }
        };

        if (status === 'SELECTED') {
            loop();
        } else {
            if (progressRef.current) progressRef.current.style.height = '0%';
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
        cursor: 'pointer',
        transition: 'all 0.3s ease', // Smooth transition for border/scale
        overflow: 'visible', // Allow ghost hand to go outside? Or clip? "Outline of hand when near". Probably visible.
        ...style
    };

    let background = 'transparent';
    let color = 'rgba(255,255,255,0.5)'; // Muted
    let borderColor = 'white';
    let scale = 1;

    // Apply "Near" effects
    if (hoverState.opacity > 0) {
        borderColor = '#00aaff'; // Blue glow
        scale = 1.1; // Slightly bigger
    }

    if (status === 'DETECTED') {
        background = 'rgba(255,255,255,0.2)';
        color = 'white';
        scale = 1.15;
    } else if (status === 'SELECTED') {
        background = 'rgba(255,255,255,0.2)';
        color = 'white';
        scale = 1.15;
    }

    return (
        <div
            ref={boxRef}
            style={{ ...baseStyle, background, color, borderColor, transform: `scale(${scale})` }}
            onClick={onClick}
        >
            {/* Fill Progress Bar - Always rendered but controlled via ref */}
            <div
                ref={progressRef}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '0%', // Start empty
                    backgroundColor: '#00aaff',
                    zIndex: 0,
                    transition: 'height 0.1s linear'
                }}
            />

            {/* Ghost Hand Cursor */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate(${hoverState.x - 24}px, ${hoverState.y - 24}px)`, // Center icon? 24 is half of 48 size
                opacity: hoverState.opacity,
                pointerEvents: 'none',
                transition: 'opacity 0.2s',
                zIndex: 10
            }}>
                <Hand size={48} color="#00aaff" strokeWidth={2} />
            </div>

            <span style={{ zIndex: 1, fontWeight: 'bold' }}>{label}</span>
        </div>
    );
};

export default MenuSquare;
