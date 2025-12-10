import React, { useEffect, useRef } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { useStore } from '../store';

const HandTracker = () => {
    const setHandTilt = useStore((state) => state.setHandTilt);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const setHands = useStore((state) => state.setHands);
    const setHandSpan = useStore((state) => state.setHandSpan);
    const setHandHeight = useStore((state) => state.setHandHeight);
    const setInteraction = useStore((state) => state.setInteraction);

    useEffect(() => {
        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            },
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);

        let camera = null;
        if (videoRef.current) {
            camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current) {
                        await hands.send({ image: videoRef.current });
                    }
                },
                width: 640,
                height: 480,
            });
            camera.start();
        }

        return () => {
            if (camera) camera.stop();
            hands.close();
        };
    }, []);

    const prevHandsRef = useRef({}); // Store previous positions by index/id

    const onResults = (results) => {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            setHands([]);
            // setHandSpan(0); // Kept current span as requested
            setHandHeight(0.5); // Reset hand height to middle
            setInteraction({ pointingDirection: 0 }); // Stop accelerating
            return;
        }

        const landmarks = results.multiHandLandmarks;

        // Process Hands for Debug & Logic
        const processedHands = landmarks.map((hand, index) => {
            const wrist = hand[0];
            const indexTip = hand[8];
            const middleTip = hand[12];
            const ringTip = hand[16];
            const pinkyTip = hand[20];
            const thumbTip = hand[4];

            // 1. Coordinates (0-1)
            const x = wrist.x;
            const y = wrist.y;

            // 2. Polar Coords
            // Center is (0.5, 0.5)
            const cx = 0.5;
            const cy = 0.5;
            const dx_center = x - cx;
            const dy_center = y - cy;

            // Distance (0-100)
            // Max distance corner to center is sqrt(0.5^2 + 0.5^2) ~= 0.707
            // Map 0 - 0.5 to 0-100 approx? Or logical distance?
            // User asked 0 is center, 100 is edge.
            // Edge is 0.5 away in X or Y. Let's use distance from center normalized by 0.5
            const rawDist = Math.sqrt(dx_center * dx_center + dy_center * dy_center);
            const distance = Math.min(100, Math.round((rawDist / 0.5) * 100));

            // Angle (0-359). 90 is Right.
            // Atan2(y, x) gives radians. 0 is Right in math usually?
            // Screen Y is down.
            // Vector (1, 0) -> Right. Atan2(0, 1) = 0.
            // Vector (0, 1) -> Down. Atan2(1, 0) = PI/2 (90).
            // User wants 90 to be Right. 
            // So we need to rotate our coords? 
            // If Math 0 is Right, then Math 90 is Down.
            // User: 90 is Right.
            // Means 0 is Up? 180 is Down? 270 Left?
            // Let's assume standard Clockwise from North?
            // North (Up) = 0.
            // East (Right) = 90.
            // South (Down) = 180.
            // West (Left) = 270.
            // Math.atan2(dy, dx):
            // Up (dy < 0). Atan2(-1, 0) = -PI/2.
            // Right (dx > 0). Atan2(0, 1) = 0.
            // Shift: Angle = degrees(atan2(dy, dx)) + 90?
            // Up: -90 + 90 = 0.
            // Right: 0 + 90 = 90.
            // Down: 90 + 90 = 180.
            // Left: 180 + 90 = 270.
            let angle = Math.round((Math.atan2(dy_center, dx_center) * 180 / Math.PI) + 90);
            if (angle < 0) angle += 360;


            // 3. Gesture
            // Fist: Tips close to wrist
            // Pointing: Index extended, others curled
            // Open: All extended

            // Calculate Reference Scale (Wrist to Middle MCP) for scale invariance
            const middleMCP = hand[9];
            const scale = Math.sqrt(Math.pow(middleMCP.x - wrist.x, 2) + Math.pow(middleMCP.y - wrist.y, 2));
            // Fallback for very weird cases or 0 scale
            const refScale = scale > 0 ? scale : 0.1;

            const dist = (pt) => Math.sqrt(Math.pow(pt.x - wrist.x, 2) + Math.pow(pt.y - wrist.y, 2));
            const dIndex = dist(indexTip);
            const dMiddle = dist(middleTip);
            const dRing = dist(ringTip);
            const dPinky = dist(pinkyTip);

            const avgCurl = (dMiddle + dRing + dPinky) / 3;

            // Heuristics based on Reference Scale (S):
            // Extended Tip: > 1.8 * S (Tip usually 2x S from wrist)
            // Curled Tip: < 1.4 * S (Tip usually near knuckle distance)

            let gesture = "Unknown";

            if (dIndex < 1.4 * refScale && avgCurl < 1.4 * refScale) {
                gesture = "Fist";
            } else if (dIndex > 1.6 * refScale && avgCurl < 1.4 * refScale) {
                gesture = "Pointing";
            } else if (avgCurl > 1.5 * refScale) { // If average of others is extended
                gesture = "Open Palm";
            } else {
                gesture = "Unknown"; // E.g. Peace sign?
            }

            // 4. Vector (Movement)
            const prev = prevHandsRef.current[index] || { x, y };
            const vx = x - prev.x;
            const vy = y - prev.y;
            // Store for next frame
            prevHandsRef.current[index] = { x, y };

            return {
                id: index,
                gesture,
                coords: { x: x.toFixed(3), y: y.toFixed(3) },
                polar: { angle, distance },
                vector: { dx: vx.toFixed(4), dy: vy.toFixed(4) }
            };
        });

        setHands(processedHands);

        // Logic uses raw landmarks still for Span/Height
        // Calculate Span, Height & Tilt
        let count = landmarks.length;
        let avgY = 0;

        landmarks.forEach(hand => {
            avgY += hand[0].y; // Use wrist for stability
        });
        avgY /= count;

        setHandHeight(avgY);

        if (landmarks.length === 2) {
            // Sort hands by X to distinguish Left vs Right on screen
            // h1 (Left on screen, smaller X), h2 (Right on screen, larger X)
            const sortedHands = [...landmarks].sort((a, b) => a[0].x - b[0].x);
            const h1 = sortedHands[0][0];
            const h2 = sortedHands[1][0];

            const dx = h2.x - h1.x;
            const dy = h2.y - h1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            setHandSpan(distance);

            // Calculate Tilt
            // Screen Y is down. 
            // If Right hand (h2) is higher (smaller y) than Left (h1), dy is negative.
            // visual angle needs to be counter-clockwise positive.
            // Math.atan2(dy, dx) -> if dy<0, angle is negative.
            // User reported previous logic (-angle) was inverted.
            // So we use raw angle (Negative -> Clockwise -> Right Side Down?)
            // Wait, User said Right Hand Up -> Right Side Down. 
            // If I remove minus, angle is Negative. Negative Z is CW. Right Side Down.
            // User WANTS Right Up.
            // If current is Right Down, then I need to flip.
            // Let's just flip the sign from -angle to angle as requested "Reverse this".
            const angle = Math.atan2(dy, dx);
            setHandTilt(angle);  // Removed negative sign
        } else {
            // Reset tilt if not 2 hands? Or persist?
            // Let's reset to horizontal for stability if 1 hand
            setHandTilt(0);
        }

        // Gesture Logic for Interaction (Pointing / Density)
        let newPointingDirection = 0;
        let densityChange = 0;

        // Check each hand's gesture
        processedHands.forEach(hand => {
            if (hand.gesture === "Pointing") {
                // Determining direction from this hand
                const handIndex = hand.id;
                const rawHand = landmarks[handIndex];
                const wrist = rawHand[0];
                const indexTip = rawHand[8];
                // Reversed: Point Right -> CCW (Positive), Point Left -> CW (Negative)
                const direction = indexTip.x < wrist.x ? 1 : -1;
                newPointingDirection = direction; // Last one wins or logic to combine? 
                // Usually one hand points.
            } else if (hand.gesture === "Fist") {
                densityChange = 0.01; // Tighten
            } else if (hand.gesture === "Open Palm") {
                densityChange = -0.01; // Loosen
            }
        });

        // Update Store
        // We need current density to increment it? 
        // Or we can use setInteraction functional update if supported, or read state.
        // Zustand set can take a function: set(state => ...) but our setInteraction takes an object.
        // Let's modify setInteraction in store to support functional updates OR read state here.
        // Reading state is easier for now without changing store API too much, 
        // though strictly we should pass functional update.
        // Actually, let's just use useStore.getState().interaction.density

        // Wait, inside component function we shouldn't read getState() during render, but this is a callback.
        const currentDensity = useStore.getState().interaction.density;
        let newDensity = currentDensity + densityChange;
        newDensity = Math.max(0.0, Math.min(1.0, newDensity));

        setInteraction({
            pointingDirection: newPointingDirection,
            density: newDensity
        });
    };

    // Helper not needed inside if logic is inline

    return (
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10 }}>
            {/* Show Camera Feed */}
            <video
                ref={videoRef}
                style={{ width: '200px', borderRadius: '10px', border: '2px solid white' }}
            />
        </div>
    );
};

export default HandTracker;
