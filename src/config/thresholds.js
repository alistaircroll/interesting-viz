/**
 * Centralized configuration for application thresholds and constants.
 * Organized by Global settings and specific App configurations.
 */
export const THRESHOLDS = {
    GLOBAL: {
        MENU: {
            DWELL_TIME_MS: 1000,
        },
        TRACKING: {
            THROTTLE_FRAMES: 4, // Stagger secondary models (Face/Pose)
            SMILE_RATIO_THRESHOLD: 0.40, // MouthWidth / FaceWidth ratio (Lower = more sensitive)
        }
    },
    APPS: {
        SPINNING_RING: {
            PARTICLE_COUNT: 2000,

            // Interaction Triggers
            MOUTH_OPEN_TRIGGER: 0.5,
            MOUTH_CYCLE_DURATION: 1.0, // Seconds between shape changes
            MOUTH_LOCK_RESET_DURATION: 1.0, // Seconds to wait before unlocking
            HEAD_TURN_MIN: 0.2,

            // Physics / Animation
            FALL_GRAVITY: 5.0,     // Downward acceleration
            FALL_CHANCE: 0.02,     // Probability per frame to start falling if smiling
            RESPAWN_Y_THRESHOLD: -5.0, // Local Y position to reset at
        },
        // Placeholders for future apps
        APP_2: {},
        APP_3: {},
        APP_4: {},
        APP_5: {},
        APP_6: {},
        APP_7: {},
        APP_8: {},
    }
};
