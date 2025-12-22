
import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { playConfirmSound, triggerHaptic } from '../utils/audio';
import { THRESHOLDS } from '../config/thresholds';

/**
 * Interactive button component for touchless UI.
 * Detects hand hover and activates via dwell timer when palm is held over button.
 * @component
 * @param {Object} props
 * @param {string} props.label - Button text
 * @param {Function} props.onClick - Callback when button is activated
 * @param {Object} [props.style] - Additional CSS styles
 * @param {'large'|'small'} [props.size='large'] - Button size variant
 */
const MenuSquare = ({ label, onClick, style, size = 'large' }) => {
    const boxRef = useRef(null);
    const progressRef = useRef(null);
    const hands = useStore((state) => state.hands);
    const [status, setStatus] = useState('IDLE');
    const [hoverState, setHoverState] = useState({ opacity: 0, x: 0, y: 0 });

    // Timer Ref
    const selectionStartTime = useRef(null);
    const DWELL_TIME = THRESHOLDS.GLOBAL.MENU.DWELL_TIME_MS;

    // Size Config
    const SIZES = {
        large: { w: 320, h: 140, r: 8 },
        small: { w: 180, h: 80, r: 8 }
    };
    const { w, h, r } = SIZES[size] || SIZES.large;

    // Perimeter approx
    const STROKE_LEN = 2 * (w - 2 * r) + 2 * Math.PI * r;

    useEffect(() => {
        if (!boxRef.current) return;

        const rect = boxRef.current.getBoundingClientRect();

        // Expansion using padding logic
        const PAD = 40;
        const nearRect = {
            left: rect.left - PAD,
            right: rect.right + PAD,
            top: rect.top - PAD,
            bottom: rect.bottom + PAD
        };

        let isCovered = false;
        let isNear = false;
        let isHandOpen = false;

        let handX = 0;
        let handY = 0;

        hands.forEach(hand => {
            const rawX = parseFloat(hand.coords.x);
            const rawY = parseFloat(hand.coords.y);

            const screenX = (1 - rawX) * window.innerWidth;
            const screenY = rawY * window.innerHeight;

            if (
                screenX >= rect.left &&
                screenX <= rect.right &&
                screenY >= rect.top &&
                screenY <= rect.bottom
            ) {
                isCovered = true;
                if (hand.gesture === "Open Palm") isHandOpen = true;
            }

            if (
                screenX >= nearRect.left &&
                screenX <= nearRect.right &&
                screenY >= nearRect.top &&
                screenY <= nearRect.bottom
            ) {
                isNear = true;
                handX = screenX - rect.left;
                handY = screenY - rect.top;
            }
        });

        if (isCovered) {
            if (isHandOpen) {
                if (status !== 'SELECTED') {
                    setStatus('SELECTED');
                    selectionStartTime.current = Date.now();
                }
            } else {
                setStatus('DETECTED');
                selectionStartTime.current = null;
                if (progressRef.current) progressRef.current.style.strokeDashoffset = STROKE_LEN;
            }
        } else {
            setStatus('IDLE');
            selectionStartTime.current = null;
            if (progressRef.current) progressRef.current.style.strokeDashoffset = STROKE_LEN;
        }

        if (isNear) {
            setHoverState({ opacity: 1, x: handX, y: handY });
        } else {
            setHoverState({ opacity: 0, x: 0, y: 0 });
        }

        return () => { };
    }, [hands, status, w, h, STROKE_LEN]);

    useEffect(() => {
        return () => { selectionStartTime.current = null; };
    }, []);

    useEffect(() => {
        let animationFrameId;
        const loop = () => {
            if (status === 'SELECTED' && selectionStartTime.current) {
                const elapsed = Date.now() - selectionStartTime.current;
                const p = Math.min(1, elapsed / DWELL_TIME);

                if (progressRef.current) {
                    const offset = STROKE_LEN * (1 - p);
                    progressRef.current.style.strokeDashoffset = offset;
                }

                if (p >= 1) {
                    onClick();
                    setStatus('IDLE');
                    selectionStartTime.current = null;
                    if (progressRef.current) progressRef.current.style.strokeDashoffset = STROKE_LEN;
                } else {
                    animationFrameId = requestAnimationFrame(loop);
                }
            } else {
                if (progressRef.current) progressRef.current.style.strokeDashoffset = STROKE_LEN;
            }
        };

        if (status === 'SELECTED') loop();
        else if (progressRef.current) progressRef.current.style.strokeDashoffset = STROKE_LEN;

        return () => cancelAnimationFrame(animationFrameId);
    }, [status, onClick, STROKE_LEN]);


    const isActive = status === 'DETECTED' || status === 'SELECTED';
    const isHover = hoverState.opacity > 0;

    const baseStyle = {
        width: `${w}px`,
        height: `${h}px`,
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--color-ink)',
        background: isActive
            ? 'var(--color-brand-blue)'
            : 'var(--color-gestural-surface)',
        boxShadow: isHover
            ? '8px 8px 0px var(--color-ink)'
            : isActive
                ? '4px 4px 0px var(--color-ink)'
                : 'var(--shadow-pop)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform var(--transition-normal), background var(--transition-normal), box-shadow var(--transition-normal)',
        transform: isHover ? 'translate(-3px, -3px) scale(1.02)' : 'translate(0, 0)',
        color: isActive ? 'var(--color-text-inverse)' : 'var(--color-ink)',
        overflow: 'visible',
        ...style
    };

    return (
        <div
            ref={boxRef}
            style={baseStyle}
            onClick={onClick}
        >
            {/* Dwell Border (SVG Overlay) */}
            <svg
                style={{
                    position: 'absolute',
                    top: -2, left: -2,
                    width: `${w + 4}px`, height: `${h + 4}px`,
                    pointerEvents: 'none',
                    overflow: 'visible'
                }}
            >
                <rect
                    x="2" y="2" width={w} height={h} rx={r} ry={r}
                    fill="none"
                    stroke={isActive ? "white" : "var(--color-ink)"}
                    strokeWidth="2"
                    strokeOpacity={isActive ? 1 : 0.3}
                />

                <rect
                    ref={progressRef}
                    x="2" y="2" width={w} height={h} rx={r} ry={r}
                    fill="none"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={STROKE_LEN}
                    strokeDashoffset={STROKE_LEN}
                    style={{
                        transition: status === 'SELECTED' ? 'stroke-dashoffset 0.1s linear' : 'none'
                    }}
                />
            </svg>

            {/* Ghost Hand Cursor */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate(${hoverState.x - 40}px, ${hoverState.y - 40}px)`,
                opacity: hoverState.opacity,
                pointerEvents: 'none',
                transition: 'opacity var(--transition-fast)',
                zIndex: 10
            }}>
                <div style={{
                    width: '80px', height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(5, 130, 202, 0.3)',
                    border: '3px solid var(--color-text-inverse)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(4px)'
                }} />
            </div>

            <span style={{
                zIndex: 1,
                textTransform: 'uppercase',
                fontFamily: 'var(--font-sans)',
                fontSize: size === 'small' ? 'var(--font-size-xl)' : 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                letterSpacing: '0.05em',
                textAlign: 'center',
                lineHeight: 1.2,
                whiteSpace: 'pre-line'
            }}>
                {label}
            </span>
        </div>
    );
};

export default MenuSquare;

