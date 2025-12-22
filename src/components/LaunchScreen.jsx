import React, { useEffect } from 'react';
import { useStore } from '../store';
import { Check, AlertTriangle } from 'lucide-react';

/**
 * Initial launch screen that waits for camera permission.
 * Displays success state when granted, error state if denied,
 * and transitions to main menu automatically on success.
 * @component
 */
const LaunchScreen = () => {
    const cameraGranted = useStore((state) => state.cameraGranted);
    const cameraError = useStore((state) => state.cameraError);
    const setCurrentScreen = useStore((state) => state.setCurrentScreen);

    useEffect(() => {
        if (cameraGranted) {
            const timer = setTimeout(() => {
                setCurrentScreen('MENU');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [cameraGranted, setCurrentScreen]);

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.2)'
        }}>
            <div className="glass-panel" style={{
                padding: '60px',
                borderRadius: '24px',
                textAlign: 'center',
                maxWidth: '800px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '32px'
            }}>
                <h1 style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--font-size-gestural-h1)',
                    fontWeight: 'var(--font-weight-bold)',
                    margin: 0,
                    color: 'var(--color-brand-blue)'
                }}>
                    InterestingViz
                </h1>

                <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--font-size-gestural-body)',
                    color: 'var(--color-text-secondary)',
                    margin: 0
                }}>
                    Control reality with your body. <br />
                    Please enable camera access to begin.
                </p>

                {cameraError ? (
                    <div style={{ animation: 'fadeIn 0.5s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '120px', height: '120px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'rgba(224, 122, 95, 0.1)',
                            border: '4px solid var(--color-brand-coral)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'var(--shadow-pop)'
                        }}>
                            <AlertTriangle size={64} color="var(--color-brand-coral)" strokeWidth={2} />
                        </div>
                        <span style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-brand-coral)'
                        }}>CAMERA DENIED</span>
                        <p style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--font-size-lg)',
                            color: 'var(--color-text-secondary)',
                            maxWidth: '400px'
                        }}>
                            {cameraError}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '16px 32px',
                                borderRadius: 'var(--radius-lg)',
                                border: '2px solid var(--color-ink)',
                                background: 'var(--color-brand-blue)',
                                color: 'var(--color-text-inverse)',
                                fontFamily: 'var(--font-sans)',
                                fontSize: 'var(--font-size-lg)',
                                fontWeight: 'var(--font-weight-semibold)',
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-pop-sm)',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                ) : cameraGranted ? (
                    <div style={{ animation: 'fadeIn 0.5s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '120px', height: '120px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'transparent',
                            border: '4px solid var(--color-brand-sage)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'var(--shadow-pop)'
                        }}>
                            <Check size={64} color="var(--color-brand-sage)" strokeWidth={4} />
                        </div>
                        <span style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-brand-sage)'
                        }}>ACCESS GRANTED</span>
                    </div>
                ) : (
                    <div style={{
                        opacity: 0.6,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
                    }}>
                        <div style={{
                            width: '80px', height: '80px',
                            borderRadius: 'var(--radius-lg)',
                            border: '4px dashed var(--color-text-secondary)',
                            animation: 'spin 4s linear infinite'
                        }} />
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-lg)' }}>Waiting for camera...</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default LaunchScreen;
