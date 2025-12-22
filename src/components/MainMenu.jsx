import React from 'react';
import { useStore } from '../store';
import MenuSquare from './MenuSquare';
import { MENU_ITEMS } from '../config/menu';

/**
 * Main menu screen displaying visualization options.
 * Uses a 30/70 split layout with header in top 30% and buttons in bottom 70%.
 * Buttons are arranged in two columns (4 left, 4 right) overlaying the video feed.
 * @component
 */
const MainMenu = () => {
    const setCurrentScreen = useStore((state) => state.setCurrentScreen);

    const handleSelect = (screen) => {
        console.log("Selected:", screen);
        setCurrentScreen(screen);
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>

            {/* Header - Positioned at top, overlaying content */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                padding: 'var(--space-4)',
                paddingTop: 'var(--space-6)',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 70%, transparent 100%)'
            }}>
                <h1 style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--font-size-4xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    margin: 0,
                    color: 'var(--color-ink)',
                    letterSpacing: '-0.02em'
                }}>
                    InterestingViz
                </h1>
                <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-brand-blue)',
                    marginTop: 'var(--space-2)',
                    marginBottom: 0
                }}>
                    Hold your palm over a button to select
                </p>
            </div>

            {/* Buttons Area - Full height with top padding for header */}
            <div style={{
                height: '100%',
                width: '100%',
                padding: '100px 80px 40px 80px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {MENU_ITEMS.slice(0, 4).map((item) => (
                        <MenuSquare
                            key={item.id}
                            label={item.label}
                            onClick={() => item.active && handleSelect(item.id)}
                            style={{
                                opacity: item.active ? 1 : 0.4,
                                pointerEvents: item.active ? 'auto' : 'none',
                                filter: item.active ? 'none' : 'grayscale(1)'
                            }}
                        />
                    ))}
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {MENU_ITEMS.slice(4, 8).map((item) => (
                        <MenuSquare
                            key={item.id}
                            label={item.label}
                            onClick={() => item.active && handleSelect(item.id)}
                            style={{
                                opacity: item.active ? 1 : 0.4,
                                pointerEvents: item.active ? 'auto' : 'none',
                                filter: item.active ? 'none' : 'grayscale(1)'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MainMenu;
