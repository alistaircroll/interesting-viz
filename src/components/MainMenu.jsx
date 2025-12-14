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
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Top 30% - Header Area */}
            <div style={{
                height: '30%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="glass-panel" style={{
                    padding: '24px 48px',
                    borderRadius: '100px',
                    textAlign: 'center'
                }}>
                    <h1 style={{ font: 'var(--text-h2)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        CHOOSE VISUALIZATION
                    </h1>
                    <p style={{ font: 'var(--text-body)', color: 'var(--color-text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                        Hold hand over option to select
                    </p>
                </div>
            </div>

            {/* Bottom 70% - Buttons Area */}
            <div style={{
                height: '70%',
                width: '100%',
                padding: '0 80px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center' // Vertically center within the 70% height
            }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
