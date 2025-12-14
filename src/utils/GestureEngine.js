
class GestureEngine {
    constructor() {
        this.prevHands = {}; // Stores previous positions for vector calc
    }

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

        return {
            hands: processedHands,
            interaction,
            stats
        };
    }

    processSingleHand(hand, index) {
        const wrist = hand[0];
        const indexTip = hand[8];
        const middleTip = hand[12];
        const ringTip = hand[16];
        const pinkyTip = hand[20];

        // 1. Coordinates
        const x = wrist.x;
        const y = wrist.y;

        // 2. Polar Coords
        const cx = 0.5;
        const cy = 0.5;
        const dx = x - cx;
        const dy = y - cy;
        const distance = Math.min(100, Math.round((Math.sqrt(dx * dx + dy * dy) / 0.5) * 100));
        let angle = Math.round((Math.atan2(dy, dx) * 180 / Math.PI) + 90);
        if (angle < 0) angle += 360;

        // 3. Gesture Recognition
        const gesture = this.detectGesture(hand);

        // 4. Vector
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

    detectGesture(hand) {
        const wrist = hand[0];
        const middleMCP = hand[9];
        const tips = [hand[8], hand[12], hand[16], hand[20]]; // Index, Middle, Ring, Pinky

        // Scale reference based on hand size (wrist to middle knuckle)
        const scale = Math.sqrt(Math.pow(middleMCP.x - wrist.x, 2) + Math.pow(middleMCP.y - wrist.y, 2));
        const refScale = scale > 0 ? scale : 0.1;

        const dist = (pt) => Math.sqrt(Math.pow(pt.x - wrist.x, 2) + Math.pow(pt.y - wrist.y, 2));
        const dIndex = dist(tips[0]);

        // Average curl of other 3 fingers
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

    calculateInteraction(processedHands, landmarks) {
        let pointingDirection = 0;
        let densityChange = 0;

        processedHands.forEach(hand => {
            if (hand.gesture === "Pointing") {
                const rawHand = landmarks[hand.id];
                // Check direction: is index tip to left or right of wrist?
                const wrist = rawHand[0];
                const indexTip = rawHand[8];
                pointingDirection = indexTip.x < wrist.x ? 1 : -1; // Mirror logic? left on screen is right?
            } else if (hand.gesture === "Fist") {
                densityChange = 0.01;
            } else if (hand.gesture === "Open Palm") {
                densityChange = -0.01;
            }
        });

        return { pointingDirection, densityChange };
    }

    calculateStats(landmarks) {
        // Height
        let avgY = 0;
        landmarks.forEach(hand => avgY += hand[0].y);
        avgY /= landmarks.length;

        // Span & Tilt (Two hands)
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
}

export default GestureEngine;
