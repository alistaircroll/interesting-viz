import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import HandTracker from './components/HandTracker';
import ParticleSystem from './components/ParticleSystem';
import { useStore } from './store';

const DebugUI = () => {
  const hands = useStore(state => state.hands);
  const handSpan = useStore(state => state.handSpan);
  const handTilt = useStore(state => state.handTilt);
  const { pointingDirection } = useStore(state => state.interaction);

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      color: 'white',
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.6)',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 20,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <h3>Debug Info</h3>
      <div>Global Span: {handSpan.toFixed(2)}</div>
      <div>Tilt: {(handTilt * 180 / Math.PI).toFixed(0)}°</div>
      <div>Density: {useStore.getState().interaction.density.toFixed(2)}</div>
      <div>Acceleration: {pointingDirection === 0 ? 'None' : (pointingDirection === 1 ? 'Right' : 'Left')}</div>

      <div style={{ borderTop: '1px solid #555', paddingTop: '5px' }}>
        <strong>Hands ({hands.length})</strong>
        {hands.map((hand, i) => (
          <div key={i} style={{ marginTop: '5px', fontSize: '0.9em' }}>
            <div style={{ fontWeight: 'bold', color: '#0af' }}>Hand {i + 1}: {hand.gesture}</div>
            <div>XY: {hand.coords.x}, {hand.coords.y}</div>
            <div>Polar: {hand.polar.angle}°, {hand.polar.distance}%</div>
            <div>Vec: {hand.vector.dx}, {hand.vector.dy}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <HandTracker />
      <DebugUI />

      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <color attach="background" args={['#111']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <Suspense fallback={null}>
          <ParticleSystem />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

export default App;
