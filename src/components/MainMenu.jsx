import React from 'react';
import { useStore } from '../store';
import MenuSquare from './MenuSquare';

const MainMenu = () => {
    const setCurrentScreen = useStore((state) => state.setCurrentScreen);

    const handleSelect = (screen) => {
        console.log("Selected:", screen);
        setCurrentScreen(screen);
    };

    // Calculate positions for the 8 squares (4 Left, 4 Right)
    // We can use flexbox/grid or absolute.
    // Video is bottom 70%.
    // So the grid should overlay that or be around it?
    // "Atop the video, create 8 squares"
    // So zIndex > Video.
    // "4 on the left, 4 on the right".

    // Let's use a Grid layout over the entire bottom 70% area?
    // Title/Instructions take top 30%.

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Header Area (Top 30%) */}
            <div style={{
                height: '30%',
                width: '100%',
                background: '#111',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                borderBottom: '1px solid #333'
            }}>
                <h1 style={{ margin: 0, fontSize: '3rem' }}>InterestingViz</h1>
                <p style={{ marginTop: '10px', fontSize: '1.2rem', color: '#aaa' }}>
                    Spread your palm wide and hold one hand over the visualization you want to launch.
                </p>
            </div>

            {/* Content Area (Bottom 70%) - Video Background (handled transparently here) + Overlay Grid */}
            <div style={{
                height: '70%',
                width: '100%',
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between', // Left and Right columns
                padding: '40px',
                boxSizing: 'border-box'
            }}>
                {/* Left Column (4 Squares) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <MenuSquare
                        label="SPINNING RING"
                        onClick={() => handleSelect('SPINNING_RING')}
                    />
                    <MenuSquare label="COMING SOON" onClick={() => { }} />
                    <MenuSquare label="COMING SOON" onClick={() => { }} />
                    <MenuSquare label="COMING SOON" onClick={() => { }} />
                </div>

                {/* Right Column (4 Squares) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <MenuSquare label="COMING SOON" onClick={() => { }} />
                    <MenuSquare label="COMING SOON" onClick={() => { }} />
                    <MenuSquare label="COMING SOON" onClick={() => { }} />
                    <MenuSquare label="COMING SOON" onClick={() => { }} />
                </div>
            </div>
        </div>
    );
};

export default MainMenu;
