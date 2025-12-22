import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import MenuSquare from './MenuSquare';

/**
 * Exit button for visualization screen with hand-proximity-based opacity.
 * Low opacity when no hand is near, full opacity when hand approaches.
 * @component
 */
const ExitButton = ({ onClick }) => {
    const boxRef = useRef(null);
    const hands = useStore((state) => state.hands);
    const [isNearby, setIsNearby] = useState(false);

    useEffect(() => {
        if (!boxRef.current) return;

        const rect = boxRef.current.getBoundingClientRect();

        // Large detection area around the button
        const PAD = 150;
        const nearRect = {
            left: rect.left - PAD,
            right: rect.right + PAD,
            top: rect.top - PAD,
            bottom: rect.bottom + PAD
        };

        let handNear = false;

        hands.forEach(hand => {
            const rawX = parseFloat(hand.coords.x);
            const rawY = parseFloat(hand.coords.y);

            const screenX = (1 - rawX) * window.innerWidth;
            const screenY = rawY * window.innerHeight;

            if (
                screenX >= nearRect.left &&
                screenX <= nearRect.right &&
                screenY >= nearRect.top &&
                screenY <= nearRect.bottom
            ) {
                handNear = true;
            }
        });

        setIsNearby(handNear);
    }, [hands]);

    return (
        <div
            ref={boxRef}
            style={{
                position: 'absolute',
                bottom: 80,
                right: 80,
                zIndex: 30,
                opacity: isNearby ? 1 : 0.6,
                transition: 'opacity 0.3s ease-out'
            }}
        >
            <MenuSquare
                label="EXIT"
                size="small"
                onClick={onClick}
                style={{ width: '180px', height: '80px' }}
            />
        </div>
    );
};

export default ExitButton;
