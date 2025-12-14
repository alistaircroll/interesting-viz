import { create } from 'zustand'

export const useStore = create((set) => ({
    hands: [],
    faces: [], // Face Mesh Data
    poses: [], // Full Body Pose Data

    // Navigation State
    currentScreen: 'LAUNCH', // 'LAUNCH', 'MENU', 'SPINNING_RING'
    cameraGranted: false,

    // Interaction State
    handSpan: 0, // Normalized distance between hands (0.0 to 1.0+)
    handHeight: 0.5, // Normalized height (0.0 top, 1.0 bottom)
    handTilt: 0, // Radians
    interaction: {
        pointingDirection: 0, // -1 (Left), 1 (Right), 0 (None)
        density: 0.5, // 0.0 (Loose) to 1.0 (Tight)
    },

    setHands: (hands) => set({ hands }),
    setFaces: (faces) => set({ faces }),
    setPoses: (poses) => set({ poses }),
    setCurrentScreen: (screen) => set({ currentScreen: screen }),
    setCameraGranted: (granted) => set({ cameraGranted: granted }),

    setHandSpan: (span) => set({ handSpan: span }),

    setHandHeight: (height) => set({ handHeight: height }),

    setHandTilt: (tilt) => set({ handTilt: tilt }),

    setInteraction: (update) => set((state) => ({
        interaction: { ...state.interaction, ...update }
    })),
}))
