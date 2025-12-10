# Interactive Camera Particle System

A real-time, gesture-controlled 3D particle system built with React, Three.js, and MediaPipe.

## Overview
This application uses your computer's webcam to track your hand movements and control a 3D ring of particles in real-time. You can spin, tilt, resize, and reshape the particle ring using intuitive hand gestures.

## Requirements
- **Webcam**: Required for hand tracking.
- **Browser**: Modern browser with WebGL and Camera support (Chrome, Edge, Firefox, Safari).
- **Lighting**: Good lighting ensures the best hand tracking performance.

## Controls

### 1. Rotation (One Hand)
- **Spin Right**: Point your **Index Finger** to the **Right**.
- **Spin Left**: Point your **Index Finger** to the **Left**.
- **Coast**: Stop pointing (open palm or fist) to let the ring spin with its current momentum.
- **Physics**: The ring has inertia; pointing longer accelerates it, stopping allows it to coast.

### 2. Particle Density (One or Both Hands)
- **Tighten Ring**: Clench your hand into a **Fist**. The particles will cluster into a tight, thin ring.
- **Loosen/Scatter**: Show an **Open Palm**. The particles will scatter into a wide, loose cloud.

### 3. Positioning & Tilt (Two Hands)
- **Move Up/Down**: Raise or lower both hands to move the ring vertically.
- **Tilt**: Raise one hand higher than the other to tilt the ring (e.g., Right Hand Up -> Tilts Right Side Up).
- **Scale**: Move your hands **Apart** to make the ring larger, or **Together** to make it smaller.

## Getting Started

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/alistaircroll/interactive-camera.git
   cd interactive-camera
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser to the URL shown (usually `http://localhost:5175`).
3. Allow camera access when prompted.

## Troubleshooting
- **No Hands Detected**: Ensure your room is well-lit and your hands are visible to the camera.
- **Jittery Movement**: Try creating a solid background behind you or improving lighting.
