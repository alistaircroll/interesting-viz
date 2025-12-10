import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const PARTICLE_COUNT = 2000;

const ParticleSystem = () => {
    const groupRef = useRef();
    const meshRef = useRef();
    const { rotationSpeed, rotationDirection, pointingDirection, density } = useStore((state) => state.interaction);
    const handSpan = useStore((state) => state.handSpan);
    const currentVelocity = useRef(0.002); // Initial low speed

    // Initialize particles
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Static attributes for particles (Angle, Random Offset)
    const particlesData = useMemo(() => {
        const data = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const theta = Math.random() * Math.PI * 2;
            const offset = Math.random();
            const y = (Math.random() - 0.5) * 0.5; // Slight vertical spread
            const scale = Math.random() * 0.1 + 0.05;
            data.push({ theta, offset, y, scale });
        }
        return data;
    }, []);

    useFrame((state, delta) => {
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
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

            // Dynamic Particle Update (Density)
            const baseRadius = 2.0;
            const maxSpread = 3.0; // Radius varies from 2 to 5
            const currentSpread = (1.0 - density) * maxSpread;

            particlesData.forEach((p, i) => {
                const r = baseRadius + p.offset * currentSpread;
                const x = r * Math.cos(p.theta);
                const z = r * Math.sin(p.theta);

                dummy.position.set(x, p.y, z);
                dummy.scale.setScalar(p.scale);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            });
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group ref={groupRef}>
            <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial color="#00aaff" />
            </instancedMesh>
        </group>
    );
};

export default ParticleSystem;
