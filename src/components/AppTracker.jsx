import React, { useEffect, useRef } from 'react';
import { Hands } from '@mediapipe/hands';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { useStore } from '../store';
import GestureEngine from '../utils/GestureEngine';

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
                            // Prioritize Hands for now as it's critical for navigation
                            await hands.send({ image: videoRef.current });

                            // Temporarily disable Face and Pose to isolate 'No Hands' issue
                            // detection can be heavy.
                            // await faceMesh.send({ image: videoRef.current });
                            // await pose.send({ image: videoRef.current });
                        } catch (error) {
                            console.error("Tracking Error:", error);
                        }
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

    // Gesture Engine Ref
    const gestureEngine = useRef(new GestureEngine());

    // --- Hand Logic (Legacy + New) ---
    const onHandResults = (results) => {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            // Use store setters to reset
            setHands([]);
            setHandHeight(0.5);
            setInteraction({ pointingDirection: 0 });
            return;
        }

        // Delegate to Engine
        const output = gestureEngine.current.process(results.multiHandLandmarks);

        // Update Store
        setHands(output.hands);

        // Update Stats
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
