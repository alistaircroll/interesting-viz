import { create } from 'zustand'

/**
 * @typedef {Object} HandData
 * @property {string} gesture - Detected gesture name (e.g., "Open Palm", "Closed Fist")
 * @property {{x: number, y: number}} coords - Normalized hand position (0-1)
 * @property {{angle: number, distance: number}} polar - Polar coordinates from center
 * @property {{dx: number, dy: number}} vector - Movement vector
 */

/**
 * @typedef {Object} FaceData
 * @property {Object} [expressions] - Detected facial expressions
 * @property {boolean} [expressions.smile] - Whether user is smiling
 * @property {number} [expressions.mouthOpen] - Mouth openness (0-1)
 * @property {number} [expressions.headTurnVal] - Head turn value (-1 to 1)
 */

/**
 * @typedef {Object} InteractionState
 * @property {number} pointingDirection - -1 (Left), 1 (Right), 0 (None)
 * @property {number} density - Particle density (0.0 Loose to 1.0 Tight)
 */

/**
 * @typedef {Object} AppState
 * @property {HandData[]} hands - Array of tracked hands
 * @property {FaceData[]} faces - Array of tracked faces
 * @property {Object[]} poses - Array of tracked body poses
 * @property {'LAUNCH'|'MENU'|'SPINNING_RING'} currentScreen - Current screen
 * @property {boolean} cameraGranted - Whether camera access was granted
 * @property {string|null} cameraError - Error message if camera access failed
 * @property {number} handSpan - Normalized distance between hands (0.0 to 1.0+)
 * @property {number} handHeight - Normalized vertical position (0.0 top, 1.0 bottom)
 * @property {number} handTilt - Hand tilt in radians
 * @property {InteractionState} interaction - Current interaction state
 */

/**
 * Global application state store using Zustand
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<AppState>>}
 */
export const useStore = create((set) => ({
    // Tracking Data
    hands: [],
    faces: [],
    poses: [],

    // Navigation State
    currentScreen: 'LAUNCH',
    cameraGranted: false,
    cameraError: null,

    // Interaction State
    handSpan: 0,
    handHeight: 0.5,
    handTilt: 0,
    interaction: {
        pointingDirection: 0,
        density: 0.5,
    },

    // Setters
    setHands: (hands) => set({ hands }),
    setFaces: (faces) => set({ faces }),
    setPoses: (poses) => set({ poses }),
    setCurrentScreen: (screen) => set({ currentScreen: screen }),
    setCameraGranted: (granted) => set({ cameraGranted: granted }),
    setCameraError: (error) => set({ cameraError: error }),
    setHandSpan: (span) => set({ handSpan: span }),
    setHandHeight: (height) => set({ handHeight: height }),
    setHandTilt: (tilt) => set({ handTilt: tilt }),
    setInteraction: (update) => set((state) => ({
        interaction: { ...state.interaction, ...update }
    })),
}))
