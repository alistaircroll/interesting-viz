import React, { useEffect, useRef } from 'react';
import { Hands } from '@mediapipe/hands';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { useStore } from '../store';

const AppTracker = () => {
    const videoRef = useRef(null);

    // Store Setters
    const setHands = useStore((state) => state.setHands);
    const setFaces = useStore((state) => state.setFaces);
    const setPoses = useStore((state) => state.setPoses);
    const setCameraGranted = useStore((state) => state.setCameraGranted);

    // Legacy Hand State (Maintain compatibility)
    const setHandSpan = useStore((state) => state.setHandSpan);
    const setHandHeight = useStore((state) => state.setHandHeight);
    const setHandTilt = useStore((state) => state.setHandTilt);
    const setInteraction = useStore((state) => state.setInteraction);

    // Refs for previous values
    const prevHandsRef = useRef({});

    useEffect(() => {
        // --- Initialize Hands ---
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });
        hands.onResults(onHandResults);

        // --- Initialize Face Mesh ---
        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });
        faceMesh.onResults(onFaceResults);

        // --- Initialize Pose ---
        const pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });
        pose.onResults(onPoseResults);

        // --- Initialize Camera ---
        let camera = null;
        if (videoRef.current) {
            camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current) {
                        setCameraGranted(true);
                        // Send frame to all trackers
                        // Parallelize for best performance, though JS is single threaded
                        // MediaPipe might handle some internal threading
                        await Promise.all([
                            hands.send({ image: videoRef.current }),
                            faceMesh.send({ image: videoRef.current }),
                            pose.send({ image: videoRef.current })
                        ]);
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
            faceMesh.close();
            pose.close();
        };
    }, []);

    // --- Hand Logic (Legacy + New) ---
    const onHandResults = (results) => {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            setHands([]);
            setHandHeight(0.5);
            setInteraction({ pointingDirection: 0 });
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

            // 1. Coordinates (0-1)
            const x = wrist.x;
            const y = wrist.y;

            // 2. Polar Coords & Angle (Maintained from HandTracker)
            const cx = 0.5;
            const cy = 0.5;
            const dx_center = x - cx;
            const dy_center = y - cy;
            const rawDist = Math.sqrt(dx_center * dx_center + dy_center * dy_center);
            const distance = Math.min(100, Math.round((rawDist / 0.5) * 100));

            // Angle (North=0, East=90...)
            let angle = Math.round((Math.atan2(dy_center, dx_center) * 180 / Math.PI) + 90);
            if (angle < 0) angle += 360;

            // 3. Gesture Recognition
            const middleMCP = hand[9];
            const scale = Math.sqrt(Math.pow(middleMCP.x - wrist.x, 2) + Math.pow(middleMCP.y - wrist.y, 2));
            const refScale = scale > 0 ? scale : 0.1;

            const dist = (pt) => Math.sqrt(Math.pow(pt.x - wrist.x, 2) + Math.pow(pt.y - wrist.y, 2));
            const dIndex = dist(indexTip);
            const dMiddle = dist(middleTip);
            const dRing = dist(ringTip);
            const dPinky = dist(pinkyTip);
            const avgCurl = (dMiddle + dRing + dPinky) / 3;

            let gesture = "Unknown";
            if (dIndex < 1.4 * refScale && avgCurl < 1.4 * refScale) {
                gesture = "Fist";
            } else if (dIndex > 1.6 * refScale && avgCurl < 1.4 * refScale) {
                gesture = "Pointing";
            } else if (avgCurl > 1.5 * refScale) {
                gesture = "Open Palm";
            }

            // 4. Vector
            const prev = prevHandsRef.current[index] || { x, y };
            const vx = x - prev.x;
            const vy = y - prev.y;
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

        // --- Store Interaction Logic (Legacy) ---
        let count = landmarks.length;
        let avgY = 0;
        landmarks.forEach(hand => avgY += hand[0].y);
        avgY /= count;
        setHandHeight(avgY);

        if (landmarks.length === 2) {
            const sortedHands = [...landmarks].sort((a, b) => a[0].x - b[0].x);
            const h1 = sortedHands[0][0];
            const h2 = sortedHands[1][0];
            const dx = h2.x - h1.x;
            const dy = h2.y - h1.y;
            setHandSpan(Math.sqrt(dx * dx + dy * dy));
            setHandTilt(Math.atan2(dy, dx));
        } else {
            setHandTilt(0);
        }

        // Interaction (Spin/Density)
        let newPointingDirection = 0;
        let densityChange = 0;
        processedHands.forEach(hand => {
            if (hand.gesture === "Pointing") {
                const rawHand = landmarks[hand.id];
                const wrist = rawHand[0];
                const indexTip = rawHand[8];
                newPointingDirection = indexTip.x < wrist.x ? 1 : -1;
            } else if (hand.gesture === "Fist") {
                densityChange = 0.01;
            } else if (hand.gesture === "Open Palm") {
                densityChange = -0.01;
            }
        });

        const currentDensity = useStore.getState().interaction.density;
        let newDensity = currentDensity + densityChange;
        newDensity = Math.max(0.0, Math.min(1.0, newDensity));
        setInteraction({ pointingDirection: newPointingDirection, density: newDensity });
    };

    // --- Face Logic ---
    const onFaceResults = (results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setFaces([]);
            return;
        }
        setFaces(results.multiFaceLandmarks);
    };

    // --- Pose Logic ---
    const onPoseResults = (results) => {
        if (!results.poseLandmarks) {
            setPoses([]);
            return;
        }
        // Pose returns single "poseLandmarks", wrap in array for consistency or use as is
        // Store expects array of poses? Usually only 1 person for basic pose.
        // Let's store as an array to be future safe or just the object.
        // Store default was [], so let's wrap it.
        setPoses([results.poseLandmarks]);
    };

    // --- Dynamic Video Styling ---
    const currentScreen = useStore((state) => state.currentScreen);

    const getVideoStyle = () => {
        const baseStyle = {
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror
            position: 'absolute',
            zIndex: -1, // Behind UI usually, but for Launch/Menu it constructs the background
        };

        if (currentScreen === 'LAUNCH') {
            return {
                ...baseStyle,
                left: 0,
                top: 0,
                width: '66.66%',
                height: '100%',
                zIndex: 0, // Background for Launch content
                borderRight: '2px solid #333'
            };
        } else if (currentScreen === 'MENU') {
            return {
                ...baseStyle,
                left: 0,
                bottom: 0,
                width: '100%',
                height: '70%',
                zIndex: 0,
            };
        } else {
            // Spinning Ring / Default
            return {
                ...baseStyle,
                width: '200px',
                height: 'auto',
                borderRadius: '10px',
                border: '2px solid white',
                zIndex: 10, // On top of Viz
                bottom: 10,
                left: 10,
                position: 'fixed'
            };
        }
    };

    return (
        <>
            <video
                ref={videoRef}
                style={getVideoStyle()}
                playsInline
                muted
            />
        </>
    );
};

export default AppTracker;
