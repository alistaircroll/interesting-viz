import React, { useEffect } from 'react';
import { useStore } from '../store';
import { Check } from 'lucide-react';

const LaunchScreen = () => {
    const cameraGranted = useStore((state) => state.cameraGranted);
    const setCurrentScreen = useStore((state) => state.setCurrentScreen);

    useEffect(() => {
        if (cameraGranted) {
            // If we are mounting and it's already true, maybe user refreshed or nav'd back?
            // User says "skip to MainMenu immediately". 
            // We can check if it just happened or was already true.
            // Using a short timeout is safer for UI transition, but 3000 is long.
            // Let's use 500ms to allow text to flash if new, or 0 if immediate?
            // Let's assume 100ms.
            const timer = setTimeout(() => {
                setCurrentScreen('MENU');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [cameraGranted, setCurrentScreen]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            color: 'white'
        }}>
            {/* Left 2/3: Title & Instructions (Overlaid on Video) */}
            <div style={{
                width: '66.66%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                background: 'rgba(0,0,0,0.4)' // Dim the video a bit
            }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '20px' }}>InterestingViz</h1>
                <p style={{ fontSize: '1.5rem', textAlign: 'center', maxWidth: '600px' }}>
                    Control things with your body. <br />
                    To get started, give this app permission to use your camera. <br />
                    <span style={{ fontSize: '1rem', color: '#aaa', marginTop: '10px', display: 'block' }}>
                        To protect privacy, you'll need to do this each time you launch the app.
                    </span>
                </p>
            </div>

            {/* Right 1/3: Status */}
            <div style={{
                width: '33.33%',
                height: '100%',
                background: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {cameraGranted ? (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div style={{
                            width: '150px',
                            height: '150px',
                            borderRadius: '50%',
                            background: '#0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 50px #0f0'
                        }}>
                            <Check size={100} color="black" strokeWidth={3} />
                        </div>
                        <p style={{ textAlign: 'center', marginTop: '20px', color: '#0f0' }}>Access Granted</p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: '#555' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            border: '5px dashed #555',
                            borderRadius: '50%',
                            margin: '0 auto',
                            marginBottom: '20px'
                        }} />
                        <p>Waiting for camera...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LaunchScreen;
