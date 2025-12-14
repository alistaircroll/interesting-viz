import React, { useEffect, useRef } from 'react';
import { Hands } from '@mediapipe/hands';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { useStore } from '../store';
import GestureEngine from '../utils/GestureEngine';
import { THRESHOLDS } from '../config/thresholds';

/**
 * Main tracking component that manages camera access and MediaPipe models.
 * Tracks hands, face, and body pose, delegating gesture detection to GestureEngine.
 * @component
 */
const AppTracker = () => {
    const videoRef = useRef(null);

    // Store Setters
    const setHands = useStore((state) => state.setHands);
    const setFaces = useStore((state) => state.setFaces);
    const setPoses = useStore((state) => state.setPoses);
    const setCameraGranted = useStore((state) => state.setCameraGranted);
    const setCameraError = useStore((state) => state.setCameraError);

    // Hand interaction state
    const setHandSpan = useStore((state) => state.setHandSpan);
    const setHandHeight = useStore((state) => state.setHandHeight);
    const setHandTilt = useStore((state) => state.setHandTilt);
    const setInteraction = useStore((state) => state.setInteraction);


    const frameCount = useRef(0);

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
                        try {
                            // Prioritize Hands - Run EVERY frame
                            await hands.send({ image: videoRef.current });

                            // Throttle Secondary Models (Face/Pose)
                            // Running all 3 every frame chokes the thread.
                            // We stagger them: 
                            // Frame 0, 4, 8... -> Face
                            // Frame 2, 6, 10... -> Pose

                            const throttle = THRESHOLDS.GLOBAL.TRACKING.THROTTLE_FRAMES;
                            if (frameCount.current % throttle === 0) {
                                await faceMesh.send({ image: videoRef.current });
                            } else if (frameCount.current % throttle === 2) {
                                await pose.send({ image: videoRef.current });
                            }

                            frameCount.current++;
                        } catch (error) {
                            console.error("Tracking Error:", error);
                        }
                    }
                },
                width: 640,
                height: 480,
            });
            camera.start().catch((err) => {
                console.error('Camera access denied:', err);
                setCameraError(err.message || 'Camera access was denied. Please enable camera permissions.');
            });
        }

        return () => {
            if (camera) camera.stop();
            hands.close();
            faceMesh.close();
            pose.close();
        };
    }, []);

    // Gesture Engine Ref
    const gestureEngine = useRef(new GestureEngine());

    // Memoization ref to prevent unnecessary store updates
    const prevHandsRef = useRef([]);

    // Helper to check if hands have meaningfully changed
    const handsChanged = (newHands, prevHands) => {
        if (newHands.length !== prevHands.length) return true;
        for (let i = 0; i < newHands.length; i++) {
            const n = newHands[i];
            const p = prevHands[i];
            if (!p) return true;
            // Compare key fields (coords, gesture)
            if (n.gesture !== p.gesture) return true;
            if (Math.abs(Number(n.coords.x) - Number(p.coords.x)) > 0.01) return true;
            if (Math.abs(Number(n.coords.y) - Number(p.coords.y)) > 0.01) return true;
        }
        return false;
    };

    // --- Hand Logic (Legacy + New) ---
    const onHandResults = (results) => {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            // Only update if we previously had hands
            if (prevHandsRef.current.length > 0) {
                setHands([]);
                prevHandsRef.current = [];
            }
            setHandHeight(0.5);
            setInteraction({ pointingDirection: 0 });
            return;
        }

        // Delegate to Engine
        const output = gestureEngine.current.process(results.multiHandLandmarks);

        // Only update store if hands have meaningfully changed
        if (handsChanged(output.hands, prevHandsRef.current)) {
            setHands(output.hands);
            prevHandsRef.current = output.hands;
        }

        // Update Stats (these are numbers, cheap to set)
        setHandHeight(output.stats.handHeight);
        setHandSpan(output.stats.handSpan);
        setHandTilt(output.stats.handTilt);

        // Update Interaction
        const currentDensity = useStore.getState().interaction.density;
        let newDensity = currentDensity + output.interaction.densityChange;
        newDensity = Math.max(0.0, Math.min(1.0, newDensity));

        setInteraction({
            pointingDirection: output.interaction.pointingDirection,
            density: newDensity
        });
    };

    // --- Face Logic ---
    const onFaceResults = (results) => {
        // console.log("Face Results:", results.multiFaceLandmarks?.length); 
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setFaces([]);
            return;
        }

        // Wrap landmarks in our structure if needed, or just pass arrays
        // Store currently just holds the raw landmarks array
        const expressions = gestureEngine.current.processFace(results.multiFaceLandmarks);

        // We can attach expressions to the first face object or store separately
        // For now, let's just cheat and stick it on the first face object
        // so the DebugUI can read it easily without changing store schema yet
        if (expressions) {
            results.multiFaceLandmarks[0].expressions = expressions;
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
