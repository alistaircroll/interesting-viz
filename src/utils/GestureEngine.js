import { THRESHOLDS } from '../config/thresholds';

/**
 * @typedef {Object} ProcessedHand
 * @property {number} id - Hand index
 * @property {string} gesture - Detected gesture ("Fist", "Pointing", "Open Palm", "Unknown")
 * @property {{x: string, y: string}} coords - Normalized position (0-1, as strings)
 * @property {{angle: number, distance: number}} polar - Polar coordinates from center
 * @property {{dx: string, dy: string}} vector - Movement delta since last frame
 */

/**
 * @typedef {Object} InteractionResult
 * @property {number} pointingDirection - -1 (Left), 1 (Right), 0 (None)
 * @property {number} densityChange - Rate of density change (-0.01 to 0.01)
 */

/**
 * @typedef {Object} HandStats
 * @property {number} handHeight - Average Y position (0=top, 1=bottom)
 * @property {number} handSpan - Distance between two hands (0-1)
 * @property {number} handTilt - Angle between hands in radians
 */

/**
 * @typedef {Object} FaceExpressions
 * @property {boolean} smile - Whether user is smiling
 * @property {number} leftEyeOpen - Left eye openness (0-1)
 * @property {number} rightEyeOpen - Right eye openness (0-1)
 * @property {number} mouthOpen - Mouth openness (0-1)
 * @property {number} headTurnVal - Head turn value (-1 left to 1 right)
 */

/**
 * @typedef {Object} ProcessResult
 * @property {ProcessedHand[]} hands - Array of processed hand data
 * @property {InteractionResult} interaction - Current interaction state
 * @property {HandStats} stats - Aggregate hand statistics
 */

/**
 * Gesture detection engine for hand and face tracking.
 * Processes raw MediaPipe landmarks into actionable gesture data.
 */
class GestureEngine {
    constructor() {
        /** @type {Object<number, {x: number, y: number}>} */
        this.prevHands = {};
    }

    /**
     * Process hand landmarks from MediaPipe Hands.
     * @param {Array<Array<{x: number, y: number, z: number}>>} landmarks - Array of hand landmark arrays
     * @returns {ProcessResult} Processed gesture data
     */
    process(landmarks) {
        if (!landmarks || landmarks.length === 0) {
            return {
                hands: [],
                interaction: { pointingDirection: 0, densityChange: 0 },
                stats: { handHeight: 0.5, handSpan: 0, handTilt: 0 }
            };
        }

        const processedHands = landmarks.map((hand, index) => this.processSingleHand(hand, index));
        const interaction = this.calculateInteraction(processedHands, landmarks);
        const stats = this.calculateStats(landmarks);

        return { hands: processedHands, interaction, stats };
    }

    /**
     * Process a single hand's landmarks.
     * @param {Array<{x: number, y: number, z: number}>} hand - 21 hand landmarks
     * @param {number} index - Hand index
     * @returns {ProcessedHand} Processed hand data
     */
    processSingleHand(hand, index) {
        const wrist = hand[0];
        const x = wrist.x;
        const y = wrist.y;

        // Polar coordinates from center
        const cx = 0.5;
        const cy = 0.5;
        const dx = x - cx;
        const dy = y - cy;
        const distance = Math.min(100, Math.round((Math.sqrt(dx * dx + dy * dy) / 0.5) * 100));
        let angle = Math.round((Math.atan2(dy, dx) * 180 / Math.PI) + 90);
        if (angle < 0) angle += 360;

        // Gesture recognition
        const gesture = this.detectGesture(hand);

        // Movement vector
        const prev = this.prevHands[index] || { x, y };
        const vx = x - prev.x;
        const vy = y - prev.y;
        this.prevHands[index] = { x, y };

        return {
            id: index,
            gesture,
            coords: { x: x.toFixed(3), y: y.toFixed(3) },
            polar: { angle, distance },
            vector: { dx: vx.toFixed(4), dy: vy.toFixed(4) }
        };
    }

    /**
     * Detect gesture from hand landmarks.
     * @param {Array<{x: number, y: number, z: number}>} hand - 21 hand landmarks
     * @returns {'Fist'|'Pointing'|'Open Palm'|'Unknown'} Detected gesture
     */
    detectGesture(hand) {
        const wrist = hand[0];
        const middleMCP = hand[9];
        const tips = [hand[8], hand[12], hand[16], hand[20]];

        // Scale reference based on hand size
        const scale = Math.sqrt(Math.pow(middleMCP.x - wrist.x, 2) + Math.pow(middleMCP.y - wrist.y, 2));
        const refScale = scale > 0 ? scale : 0.1;

        const dist = (pt) => Math.sqrt(Math.pow(pt.x - wrist.x, 2) + Math.pow(pt.y - wrist.y, 2));
        const dIndex = dist(tips[0]);
        const avgCurl = (dist(tips[1]) + dist(tips[2]) + dist(tips[3])) / 3;

        if (dIndex < 1.4 * refScale && avgCurl < 1.4 * refScale) {
            return "Fist";
        } else if (dIndex > 1.6 * refScale && avgCurl < 1.4 * refScale) {
            return "Pointing";
        } else if (avgCurl > 1.5 * refScale) {
            return "Open Palm";
        }
        return "Unknown";
    }

    /**
     * Calculate interaction state from processed hands.
     * @param {ProcessedHand[]} processedHands - Processed hand data
     * @param {Array<Array<{x: number, y: number, z: number}>>} landmarks - Raw landmarks
     * @returns {InteractionResult} Interaction state
     */
    calculateInteraction(processedHands, landmarks) {
        let pointingDirection = 0;
        let densityChange = 0;

        processedHands.forEach(hand => {
            if (hand.gesture === "Pointing") {
                const rawHand = landmarks[hand.id];
                const wrist = rawHand[0];
                const indexTip = rawHand[8];
                pointingDirection = indexTip.x < wrist.x ? 1 : -1;
            } else if (hand.gesture === "Fist") {
                densityChange = 0.01;
            } else if (hand.gesture === "Open Palm") {
                densityChange = -0.01;
            }
        });

        return { pointingDirection, densityChange };
    }

    /**
     * Calculate aggregate hand statistics.
     * @param {Array<Array<{x: number, y: number, z: number}>>} landmarks - Raw landmarks
     * @returns {HandStats} Aggregate statistics
     */
    calculateStats(landmarks) {
        let avgY = 0;
        landmarks.forEach(hand => avgY += hand[0].y);
        avgY /= landmarks.length;

        let handSpan = 0;
        let handTilt = 0;

        if (landmarks.length === 2) {
            const sortedHands = [...landmarks].sort((a, b) => a[0].x - b[0].x);
            const h1 = sortedHands[0][0];
            const h2 = sortedHands[1][0];
            const dx = h2.x - h1.x;
            const dy = h2.y - h1.y;
            handSpan = Math.sqrt(dx * dx + dy * dy);
            handTilt = Math.atan2(dy, dx);
        }

        return { handHeight: avgY, handSpan, handTilt };
    }

    /**
     * Process face landmarks from MediaPipe FaceMesh.
     * @param {Array<Array<{x: number, y: number, z: number}>>} landmarks - Array of face landmark arrays
     * @returns {FaceExpressions|null} Face expression data or null if no faces
     */
    processFace(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;

        const face = landmarks[0];

        return {
            smile: this.detectSmile(face),
            leftEyeOpen: this.calculateEyeOpenness(face, 'left'),
            rightEyeOpen: this.calculateEyeOpenness(face, 'right'),
            mouthOpen: this.calculateMouthOpenness(face),
            headTurnVal: this.calculateHeadTurn(face)
        };
    }

    /**
     * Calculate head turn angle from face landmarks.
     * @param {Array<{x: number, y: number, z: number}>} face - 468 face landmarks
     * @returns {number} Head turn value (-1 left to 1 right)
     */
    calculateHeadTurn(face) {
        const nose = face[1];
        const leftCheek = face[234];
        const rightCheek = face[454];

        const distLeft = nose.x - leftCheek.x;
        const distRight = rightCheek.x - nose.x;

        if ((distLeft + distRight) === 0) return 0;

        return (distLeft - distRight) / (distLeft + distRight);
    }

    /**
     * Calculate 3D distance between two points.
     * @param {{x: number, y: number, z: number}} p1 - First point
     * @param {{x: number, y: number, z: number}} p2 - Second point
     * @returns {number} Euclidean distance
     */
    dist3D(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }

    /**
     * Calculate eye openness using Eye Aspect Ratio.
     * @param {Array<{x: number, y: number, z: number}>} face - Face landmarks
     * @param {'left'|'right'} side - Which eye to measure
     * @returns {number} Openness value (0 closed to 1 open)
     */
    calculateEyeOpenness(face, side) {
        let up, down, left, right;
        if (side === 'left') {
            up = face[159];
            down = face[145];
            left = face[33];
            right = face[133];
        } else {
            up = face[386];
            down = face[374];
            left = face[362];
            right = face[263];
        }

        const vertical = this.dist3D(up, down);
        const horizontal = this.dist3D(left, right);

        return Math.min(1.0, Math.max(0, (vertical / horizontal) * 3.0));
    }

    /**
     * Calculate mouth openness.
     * @param {Array<{x: number, y: number, z: number}>} face - Face landmarks
     * @returns {number} Openness value (0 closed to 1 open)
     */
    calculateMouthOpenness(face) {
        const top = face[13];
        const bottom = face[14];
        const left = face[61];
        const right = face[291];

        const vertical = this.dist3D(top, bottom);
        const horizontal = this.dist3D(left, right);

        return Math.min(1.0, Math.max(0, (vertical / horizontal) * 2.0));
    }

    /**
     * Detect if user is smiling based on mouth width ratio.
     * @param {Array<{x: number, y: number, z: number}>} face - Face landmarks
     * @returns {boolean} True if smiling
     */
    detectSmile(face) {
        const faceWidth = this.dist3D(face[234], face[454]);
        const mouthWidth = this.dist3D(face[61], face[291]);
        const ratio = mouthWidth / faceWidth;

        return ratio > THRESHOLDS.GLOBAL.TRACKING.SMILE_RATIO_THRESHOLD;
    }
}

export default GestureEngine;
