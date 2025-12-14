import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

import { THRESHOLDS } from '../config/thresholds';

/** Number of particles in the visualization */
const PARTICLE_COUNT = THRESHOLDS.APPS.SPINNING_RING.PARTICLE_COUNT;

/**
 * Interactive 3D particle system visualization.
 * Responds to hand gestures (pointing, fist, palm) and face expressions (mouth open, head turn).
 * Uses instanced rendering for performance with 2000 particles.
 * @component
 */
const ParticleSystem = () => {
    const groupRef = useRef();
    const meshRef = useRef();
    const [currentShape, setCurrentShape] = React.useState('sphere');
    const faces = useStore((state) => state.faces);

    // Hand interaction state
    const { pointingDirection, density } = useStore((state) => state.interaction);
    const handSpan = useStore((state) => state.handSpan);
    const currentVelocity = useRef(0.002);
    const targetScaleVec = useRef(new THREE.Vector3());

    // Physics state for falling particles (smile interaction)
    // Parallel array to particlesData
    const physicsState = useRef(new Array(PARTICLE_COUNT).fill(null).map(() => ({
        isFalling: false,
        vy: 0,
        worldPos: new THREE.Vector3() // Store absolute world position
    })));

    // Initialize particles
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Static attributes for particles (Angle, Random Offset)
    const particlesData = useMemo(() => {
        const data = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const theta = Math.random() * Math.PI * 2;
            const radiusOffset = Math.random(); // 0 to 1
            const yOffset = (Math.random() - 0.5); // -0.5 to 0.5
            const scale = Math.random() * 0.1 + 0.05;
            // "Organic" motion attributes
            const driftSpeed = Math.random() * 2 + 0.5;
            const driftPhase = Math.random() * Math.PI * 2;

            data.push({ theta, radiusOffset, yOffset, scale, driftSpeed, driftPhase });
        }
        return data;
    }, []);

    // Geometries (Larger for visibility)
    const geometries = useMemo(() => ({
        sphere: new THREE.SphereGeometry(0.35, 12, 12),
        cube: new THREE.BoxGeometry(0.5, 0.5, 0.5),
        tetrahedron: new THREE.TetrahedronGeometry(0.5)
    }), []);

    // Interaction Refs
    const mouthTimer = useRef(0);
    const mouthLock = useRef(false);
    const hueRef = useRef(0.0); // Hue 0-1

    // Initial Colors
    useEffect(() => {
        if (meshRef.current) {
            const tempColor = new THREE.Color();
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                tempColor.set('#00aaff');
                meshRef.current.setColorAt(i, tempColor);
            }
            meshRef.current.instanceColor.needsUpdate = true;
        }
    }, [PARTICLE_COUNT]);

    useFrame((state, delta) => {
        // --- Facial Interaction Logic ---
        if (faces.length > 0 && faces[0].expressions) {
            const { mouthOpen, facingDirection } = faces[0].expressions;

            // 1. Mouth Shape Cycling
            if (mouthOpen > THRESHOLDS.APPS.SPINNING_RING.MOUTH_OPEN_TRIGGER) {
                if (!mouthLock.current) {
                    mouthTimer.current += delta;
                    if (mouthTimer.current > THRESHOLDS.APPS.SPINNING_RING.MOUTH_CYCLE_DURATION) {
                        setCurrentShape(prev => {
                            if (prev === 'sphere') return 'cube';
                            if (prev === 'cube') return 'tetrahedron';
                            return 'sphere';
                        });
                        mouthLock.current = true;
                        mouthTimer.current = 0;
                    }
                } else {
                    mouthTimer.current = 0;
                }
            } else {
                if (mouthLock.current) {
                    mouthTimer.current += delta;
                    if (mouthTimer.current > THRESHOLDS.APPS.SPINNING_RING.MOUTH_LOCK_RESET_DURATION) {
                        mouthLock.current = false;
                        mouthTimer.current = 0;
                    }
                } else {
                    mouthTimer.current = 0;
                }
            }

            // 2. Head Turn Color Logic (Organic Update)
            const headTurnVal = faces[0].expressions.headTurnVal || 0;

            // Threshold for turning
            if (Math.abs(headTurnVal) > THRESHOLDS.APPS.SPINNING_RING.HEAD_TURN_MIN) {
                const cycleSpeed = 0.1;
                // Negative (Left) -> Decrease Hue, Positive (Right) -> Increase Hue
                const change = (headTurnVal > 0 ? 1 : -1) * cycleSpeed * delta;

                hueRef.current += change;
                if (hueRef.current > 1) hueRef.current -= 1;
                if (hueRef.current < 0) hueRef.current += 1;

                // Calculate turn strength for proportional updates
                const turnStrength = Math.min(1.0, Math.abs(headTurnVal) - THRESHOLDS.APPS.SPINNING_RING.HEAD_TURN_MIN);

                // Instead of checking every particle, sample a fixed number
                const samplesToUpdate = Math.floor(100 * turnStrength); // 0 to ~80 particles

                if (meshRef.current && samplesToUpdate > 0) {
                    const newColor = new THREE.Color().setHSL(hueRef.current, 1.0, 0.5);
                    for (let j = 0; j < samplesToUpdate; j++) {
                        const i = Math.floor(Math.random() * PARTICLE_COUNT);
                        meshRef.current.setColorAt(i, newColor);
                    }
                    meshRef.current.instanceColor.needsUpdate = true;
                }
            }
        }

        // 1. Physics & Spin (Applied to INNER MESH)
        if (meshRef.current) {
            const acceleration = 0.5 * delta;
            const matchMaxSpeed = 2.0;

            if (pointingDirection !== 0) {
                currentVelocity.current += pointingDirection * acceleration;
            }
            currentVelocity.current = Math.max(-matchMaxSpeed, Math.min(matchMaxSpeed, currentVelocity.current));

            // Spin Rotation (Local Y)
            meshRef.current.rotation.y += currentVelocity.current * delta;
        }

        // 2. Position & Tilt (Applied to OUTER GROUP)
        if (groupRef.current) {
            // Vertical Position
            const targetY = (0.5 - useStore.getState().handHeight) * 14;
            groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.1;

            // Tilt (Z-axis)
            const targetTilt = useStore.getState().handTilt;
            // Lerp Tilt
            groupRef.current.rotation.z += (targetTilt - groupRef.current.rotation.z) * 0.1;
        }

        // 3. Scaling & Particles (Applied to INNER MESH)
        if (meshRef.current) {
            // Scaling based on Hand Span
            const targetScale = handSpan > 0 ? 0.2 + handSpan * 1.5 : 1;
            targetScaleVec.current.setScalar(targetScale);
            meshRef.current.scale.lerp(targetScaleVec.current, 0.1);

            // Dynamic Particle Update (Density -> Variance)
            const time = state.clock.elapsedTime;

            // Density 0 (Palm) = Loose, High Spread, Organic Motion
            // Density 1 (Fist) = Tight Ring, Low Spread, Static

            const inverseDensity = (1.0 - density); // 1 = Palm, 0 = Fist

            // Dynamic Radius Logic:
            // Fist (density 1) -> Large Diameter (User hands are wide) -> baseRadius ~ 3.5
            // Palm (density 0) -> Small Diameter (Cloud on screen) -> baseRadius ~ 1.5
            const baseRadius = 1.5 + (density * 2.5); // 1.5 to 4.0

            const spreadRadius = inverseDensity * 3.0; // 0 to 3.0
            const spreadY = inverseDensity * 2.5; // 0 to 2.5 (Vertical sprawl)
            const motionAmp = inverseDensity * 0.5; // 0 to 0.5 (Drift)

            // Smile / Fall Logic
            const isSmiling = faces.length > 0 && faces[0].expressions && faces[0].expressions.smile;

            // Pre-calculate inverse matrix for world->local transformation
            // We must update the world matrix first since we modified rotation above
            meshRef.current.updateMatrixWorld();
            const invMatrix = meshRef.current.matrixWorld.clone().invert();
            const tempVec = new THREE.Vector3(); // Helper for transforms

            particlesData.forEach((p, i) => {
                const phys = physicsState.current[i];
                const CONSTANTS = THRESHOLDS.APPS.SPINNING_RING;
                let finalX, finalY, finalZ;

                // 1. Calculate Standard Ring Position (Local)
                const drift = Math.sin(time * p.driftSpeed + p.driftPhase) * motionAmp;
                const r = baseRadius + (p.radiusOffset * spreadRadius) + drift;
                const ringX = r * Math.cos(p.theta);
                const ringZ = r * Math.sin(p.theta);
                const ringY = (p.yOffset * spreadY) + drift;

                // 2. Handle Falling State
                if (phys.isFalling) {
                    // Update Physics (World Space)
                    phys.vy += CONSTANTS.FALL_GRAVITY * delta;
                    phys.worldPos.y -= phys.vy * delta;

                    // Convert World -> Local for rendering
                    tempVec.copy(phys.worldPos);
                    tempVec.applyMatrix4(invMatrix);

                    finalX = tempVec.x;
                    finalY = tempVec.y;
                    finalZ = tempVec.z;

                    // Check boundaries (Reset if too low)
                    // We check local Y here for simplicity, or World Y? 
                    // World Y < -5 generally means off bottom of screen
                    if (phys.worldPos.y < -5.0) {
                        phys.isFalling = false;
                        phys.vy = 0;
                    }
                } else {
                    // Standard Ring Behavior
                    finalX = ringX;
                    finalY = ringY;
                    finalZ = ringZ;

                    // Trigger Fall?
                    if (isSmiling && Math.random() < CONSTANTS.FALL_CHANCE) {
                        phys.isFalling = true;
                        phys.vy = 0;

                        // Capture current World Position
                        tempVec.set(ringX, ringY, ringZ);
                        tempVec.applyMatrix4(meshRef.current.matrixWorld);
                        phys.worldPos.copy(tempVec);
                    }
                }

                dummy.position.set(finalX, finalY, finalZ);
                dummy.scale.setScalar(p.scale);

                // Rotation (keep spinning if in ring, maybe tumble if falling?)
                // For now keep simple spin
                dummy.rotation.set(time * 0.5 * p.driftSpeed, time * 0.3 * p.driftSpeed, 0);

                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            });
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group ref={groupRef}>
            <instancedMesh ref={meshRef} args={[geometries[currentShape], null, PARTICLE_COUNT]}>
                <primitive object={geometries[currentShape]} attach="geometry" />
                <meshBasicMaterial color={undefined} />
            </instancedMesh>
        </group>
    );
};

export default ParticleSystem;
