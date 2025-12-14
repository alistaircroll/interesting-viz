/**
 * Audio feedback utility for UI interactions.
 * Uses Web Audio API for low-latency sound generation.
 */

/** @type {AudioContext|null} */
let audioContext = null;

/**
 * Lazily initializes the AudioContext (must be triggered by user interaction).
 * @returns {AudioContext}
 */
const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
};

/**
 * Plays a short "success" beep sound.
 * Uses oscillator synthesis for instant playback without audio file loading.
 * @param {number} [frequency=880] - Frequency in Hz (default A5)
 * @param {number} [duration=0.15] - Duration in seconds
 */
export const playSuccessBeep = (frequency = 880, duration = 0.15) => {
    try {
        const ctx = getAudioContext();

        // Create oscillator
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Create gain envelope for smooth attack/release
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02); // Attack
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration); // Release

        // Connect and play
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    } catch (err) {
        console.warn('Audio playback failed:', err);
    }
};

/**
 * Plays a two-tone "confirm" sound (rising).
 */
export const playConfirmSound = () => {
    try {
        const ctx = getAudioContext();

        // First tone
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4

        const gain1 = ctx.createGain();
        gain1.gain.setValueAtTime(0.2, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.1);

        // Second tone (higher, delayed)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.1); // E5

        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
        gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.25);
    } catch (err) {
        console.warn('Audio playback failed:', err);
    }
};

/**
 * Triggers haptic feedback if available (mobile devices).
 * @param {number} [duration=50] - Vibration duration in ms
 */
export const triggerHaptic = (duration = 50) => {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
};
