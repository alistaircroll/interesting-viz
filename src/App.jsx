import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AppTracker from './components/AppTracker';
import ParticleSystem from './components/ParticleSystem';
import LaunchScreen from './components/LaunchScreen';
import MainMenu from './components/MainMenu';
import MenuSquare from './components/MenuSquare';
import { useStore } from './store';

const DebugUI = () => {
  const hands = useStore(state => state.hands);
  const handSpan = useStore(state => state.handSpan);
  const handTilt = useStore(state => state.handTilt);
  const { pointingDirection } = useStore(state => state.interaction);
  const faces = useStore(state => state.faces);
  const poses = useStore(state => state.poses);


  return (
    <>
      {/* HANDS TRACKING - TOP LEFT */}
      <div className="glass-panel" style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'var(--color-text-primary)',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: 0, color: 'var(--color-scan-cyan)', fontSize: '1.2em' }}>HANDS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9em' }}>
          <span style={{ opacity: 0.7 }}>Span:</span> <strong>{handSpan.toFixed(2)}</strong>
          <span style={{ opacity: 0.7 }}>Tilt:</span> <strong>{(handTilt * 180 / Math.PI).toFixed(0)}°</strong>
          <span style={{ opacity: 0.7 }}>Density:</span> <strong>{useStore.getState().interaction.density.toFixed(2)}</strong>
          <span style={{ opacity: 0.7 }}>Accel:</span> <strong>{pointingDirection === 0 ? '-' : (pointingDirection === 1 ? 'R' : 'L')}</strong>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
          <div style={{ color: 'var(--color-plasma-violet)', marginBottom: '8px', fontWeight: 'bold' }}>DETECTED ({hands.length})</div>
          {hands.map((hand, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '0.9em', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', color: 'white' }}>#{i + 1} {hand.gesture}</div>
              <div style={{ opacity: 0.6, fontSize: '0.85em' }}>XY: {Number(hand.coords.x).toFixed(2)}, {Number(hand.coords.y).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FACE & POSE - TOP RIGHT */}
      <div className="glass-panel" style={{
        position: 'absolute',
        top: 20,
        right: 20,
        color: 'var(--color-text-primary)',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '300px',
        textAlign: 'right'
      }}>
        <h3 style={{ margin: 0, color: 'var(--color-lime-flash)', fontSize: '1.2em' }}>ANALYSIS</h3>

        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div style={{ color: 'var(--color-lime-flash)', marginBottom: '8px', fontWeight: 'bold' }}>FACES ({faces.length})</div>
          {faces.length > 0 && faces[0].expressions && (
            <div style={{ fontSize: '0.9em' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Smile</span>
                <strong>{faces[0].expressions.smile ? 'YES' : 'No'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mouth</span>
                <strong>{(faces[0].expressions.mouthOpen * 100).toFixed(0)}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Turn</span>
                <strong>{faces[0].expressions.headTurnVal ? faces[0].expressions.headTurnVal.toFixed(2) : 0}</strong>
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={{ color: '#a0f', marginBottom: '8px', fontWeight: 'bold' }}>POSES ({poses.length})</div>
          {poses.length > 0 && <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Pose Detected</div>}
        </div>
      </div>
    </>
  );
};

function App() {
  const currentScreen = useStore((state) => state.currentScreen);
  const setCurrentScreen = useStore((state) => state.setCurrentScreen);

  // Check URL param for debug=on
  const showDebug = new URLSearchParams(window.location.search).get('debug') === 'on';

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      <AppTracker />

      {showDebug && <DebugUI />}

      {currentScreen === 'LAUNCH' && <LaunchScreen />}

      {currentScreen === 'MENU' && <MainMenu />}

      {currentScreen === 'SPINNING_RING' && (
        <>
          {/* Back to Menu Button - Bottom Right */}
          <div style={{ position: 'absolute', bottom: 40, right: 40, zIndex: 30 }}>
            <MenuSquare
              label="EXIT"
              size="small"
              onClick={() => setCurrentScreen('MENU')}
              style={{ width: '180px', height: '80px' }}
            />
          </div>

          {/* Transparent Canvas for AR feel */}
          <Canvas gl={{ alpha: true }} camera={{ position: [0, 0, 10], fov: 60 }}>
            {/* Ambient light only, no background color */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            <Suspense fallback={null}>
              <ParticleSystem />
            </Suspense>

            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </>
      )}
    </div>
  );
}

export default App;
