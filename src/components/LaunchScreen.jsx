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
                <h1 style={{ font: 'var(--text-h1)', margin: 0, color: 'var(--color-scan-cyan)' }}>
                    InterestingViz
                </h1>

                <p style={{ font: 'var(--text-body-large)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Control reality with your body. <br />
                    Please enable camera access to begin.
                </p>

                {cameraError ? (
                    <div style={{ animation: 'fadeIn 0.5s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '120px', height: '120px',
                            borderRadius: '50%',
                            background: 'rgba(255, 100, 100, 0.1)',
                            border: '4px solid #ff6b6b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 30px rgba(255, 100, 100, 0.5)'
                        }}>
                            <AlertTriangle size={64} color="#ff6b6b" strokeWidth={2} />
                        </div>
                        <span style={{ font: 'var(--text-h3)', color: '#ff6b6b' }}>CAMERA DENIED</span>
                        <p style={{ font: 'var(--text-body)', color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
                            {cameraError}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '16px 32px',
                                borderRadius: '50px',
                                border: '2px solid var(--color-scan-cyan)',
                                background: 'transparent',
                                color: 'var(--color-scan-cyan)',
                                font: 'var(--text-body-large)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                ) : cameraGranted ? (
                    <div style={{ animation: 'fadeIn 0.5s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '120px', height: '120px',
                            borderRadius: '50%',
                            background: 'transparent',
                            border: '4px solid var(--color-lime-flash)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 30px var(--color-lime-flash)'
                        }}>
                            <Check size={64} color="var(--color-lime-flash)" strokeWidth={4} />
                        </div>
                        <span style={{ font: 'var(--text-h3)', color: 'var(--color-lime-flash)' }}>ACCESS GRANTED</span>
                    </div>
                ) : (
                    <div style={{
                        opacity: 0.6,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
                    }}>
                        <div style={{
                            width: '80px', height: '80px',
                            borderRadius: '50%',
                            border: '4px dashed var(--color-text-secondary)',
                            animation: 'spin 4s linear infinite'
                        }} />
                        <span style={{ font: 'var(--text-body)' }}>Waiting for camera...</span>
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
