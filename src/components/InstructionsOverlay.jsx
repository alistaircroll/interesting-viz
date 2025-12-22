import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { SPINNING_RING_INSTRUCTIONS } from '../config/instructions';

/**
 * Overlay component that displays instructions when no hands are detected.
 * Shows after 10 seconds of no hand detection, fades out over 1 second when hands appear.
 * @component
 */
const InstructionsOverlay = () => {
    const hands = useStore((state) => state.hands);
    const [visible, setVisible] = useState(false);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        let timeout;

        if (hands.length === 0) {
            // No hands detected - start 10 second timer
            timeout = setTimeout(() => {
                setVisible(true);
                setFading(false);
            }, 10000);
        } else {
            // Hands detected - fade out if visible
            if (visible) {
                setFading(true);
                timeout = setTimeout(() => {
                    setVisible(false);
                    setFading(false);
                }, 500); // 500ms fade
            }
        }

        return () => clearTimeout(timeout);
    }, [hands.length, visible]);

    if (!visible && !fading) return null;

    const { title, instructions, footer } = SPINNING_RING_INSTRUCTIONS;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            opacity: fading ? 0 : 1,
            transition: 'opacity 500ms ease-out',
            pointerEvents: fading ? 'none' : 'auto'
        }}>
            <div className="glass-panel" style={{
                maxWidth: '900px',
                padding: 'var(--space-16)',
                margin: 'var(--space-6)',
                textAlign: 'left'
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--font-size-4xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-brand-blue)',
                    margin: '0 0 var(--space-8) 0'
                }}>
                    {title}
                </h2>

                <ul style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--font-size-2xl)',
                    color: 'var(--color-ink)',
                    lineHeight: '2',
                    margin: '0 0 var(--space-8) 0',
                    paddingLeft: 'var(--space-8)'
                }}>
                    {instructions.map((instruction, index) => (
                        <li key={index} style={{ marginBottom: 'var(--space-4)' }}>
                            {instruction}
                        </li>
                    ))}
                </ul>

                <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--font-size-xl)',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic',
                    margin: 0,
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--color-ink-faint)'
                }}>
                    {footer}
                </p>
            </div>
        </div>
    );
};

export default InstructionsOverlay;
