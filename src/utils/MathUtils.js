/**
 * Math Utilities
 * Common mathematical functions and calculations for game development
 */
export class MathUtils {
    /**
     * Calculate distance between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Distance between points
     */
    static getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate squared distance (faster than getDistance when you only need comparison)
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Squared distance between points
     */
    static getDistanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    /**
     * Calculate angle between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Angle in radians
     */
    static getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * Normalize an angle to be between -PI and PI
     * @param {number} angle - Angle in radians
     * @returns {number} Normalized angle
     */
    static normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Convert radians to degrees
     * @param {number} radians - Angle in radians
     * @returns {number} Angle in degrees
     */
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Linear interpolation between two values
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Smooth step interpolation (ease in/out)
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Smoothly interpolated value
     */
    static smoothStep(start, end, t) {
        t = this.clamp(t, 0, 1);
        t = t * t * (3 - 2 * t);
        return this.lerp(start, end, t);
    }

    /**
     * Generate random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Generate random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Check if a point is inside a circle
     * @param {number} px - Point X
     * @param {number} py - Point Y
     * @param {number} cx - Circle center X
     * @param {number} cy - Circle center Y
     * @param {number} radius - Circle radius
     * @returns {boolean} True if point is inside circle
     */
    static pointInCircle(px, py, cx, cy, radius) {
        return this.getDistanceSquared(px, py, cx, cy) <= radius * radius;
    }

    /**
     * Check if a point is inside a rectangle
     * @param {number} px - Point X
     * @param {number} py - Point Y
     * @param {number} rx - Rectangle X
     * @param {number} ry - Rectangle Y
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @returns {boolean} True if point is inside rectangle
     */
    static pointInRect(px, py, rx, ry, width, height) {
        return px >= rx && px <= rx + width && py >= ry && py <= ry + height;
    }

    /**
     * Check collision between two circles
     * @param {number} x1 - First circle X
     * @param {number} y1 - First circle Y
     * @param {number} r1 - First circle radius
     * @param {number} x2 - Second circle X
     * @param {number} y2 - Second circle Y
     * @param {number} r2 - Second circle radius
     * @returns {boolean} True if circles collide
     */
    static circleCollision(x1, y1, r1, x2, y2, r2) {
        const distance = this.getDistance(x1, y1, x2, y2);
        return distance < (r1 + r2);
    }

    /**
     * Check collision between two rectangles
     * @param {number} x1 - First rect X
     * @param {number} y1 - First rect Y
     * @param {number} w1 - First rect width
     * @param {number} h1 - First rect height
     * @param {number} x2 - Second rect X
     * @param {number} y2 - Second rect Y
     * @param {number} w2 - Second rect width
     * @param {number} h2 - Second rect height
     * @returns {boolean} True if rectangles collide
     */
    static rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    /**
     * Get random point on circle circumference
     * @param {number} centerX - Circle center X
     * @param {number} centerY - Circle center Y
     * @param {number} radius - Circle radius
     * @returns {Object} Point {x, y}
     */
    static randomPointOnCircle(centerX, centerY, radius) {
        const angle = Math.random() * 2 * Math.PI;
        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    }

    /**
     * Get random point inside circle
     * @param {number} centerX - Circle center X
     * @param {number} centerY - Circle center Y
     * @param {number} radius - Circle radius
     * @returns {Object} Point {x, y}
     */
    static randomPointInCircle(centerX, centerY, radius) {
        const angle = Math.random() * 2 * Math.PI;
        const r = Math.sqrt(Math.random()) * radius;
        return {
            x: centerX + Math.cos(angle) * r,
            y: centerY + Math.sin(angle) * r
        };
    }

    /**
     * Calculate velocity components from angle and speed
     * @param {number} angle - Angle in radians
     * @param {number} speed - Speed magnitude
     * @returns {Object} Velocity {vx, vy}
     */
    static velocityFromAngle(angle, speed) {
        return {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
    }

    /**
     * Calculate angle from velocity components
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @returns {number} Angle in radians
     */
    static angleFromVelocity(vx, vy) {
        return Math.atan2(vy, vx);
    }

    /**
     * Calculate speed from velocity components
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @returns {number} Speed magnitude
     */
    static speedFromVelocity(vx, vy) {
        return Math.sqrt(vx * vx + vy * vy);
    }

    /**
     * Rotate a point around another point
     * @param {number} px - Point X
     * @param {number} py - Point Y
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} angle - Rotation angle in radians
     * @returns {Object} Rotated point {x, y}
     */
    static rotatePoint(px, py, cx, cy, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = px - cx;
        const dy = py - cy;
        
        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos
        };
    }

    /**
     * Calculate the shortest angle between two angles
     * @param {number} angle1 - First angle in radians
     * @param {number} angle2 - Second angle in radians
     * @returns {number} Shortest angle difference
     */
    static angleDifference(angle1, angle2) {
        let diff = angle2 - angle1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
    }

    /**
     * Move a value towards a target by a maximum step
     * @param {number} current - Current value
     * @param {number} target - Target value
     * @param {number} maxStep - Maximum step size
     * @returns {number} New value
     */
    static moveTowards(current, target, maxStep) {
        const diff = target - current;
        if (Math.abs(diff) <= maxStep) {
            return target;
        }
        return current + Math.sign(diff) * maxStep;
    }

    /**
     * Check if a value is approximately equal to another (within epsilon)
     * @param {number} a - First value
     * @param {number} b - Second value
     * @param {number} epsilon - Tolerance (default: 0.001)
     * @returns {boolean} True if approximately equal
     */
    static approximately(a, b, epsilon = 0.001) {
        return Math.abs(a - b) < epsilon;
    }

    /**
     * Wrap a value between 0 and max
     * @param {number} value - Value to wrap
     * @param {number} max - Maximum value
     * @returns {number} Wrapped value
     */
    static wrap(value, max) {
        return ((value % max) + max) % max;
    }

    /**
     * Calculate bounce angle for collision
     * @param {number} incomingAngle - Incoming angle in radians
     * @param {number} surfaceAngle - Surface normal angle in radians
     * @returns {number} Bounce angle in radians
     */
    static bounceAngle(incomingAngle, surfaceAngle) {
        return 2 * surfaceAngle - incomingAngle;
    }

    /**
     * Calculate 2D vector dot product
     * @param {number} x1 - First vector X
     * @param {number} y1 - First vector Y
     * @param {number} x2 - Second vector X
     * @param {number} y2 - Second vector Y
     * @returns {number} Dot product
     */
    static dotProduct(x1, y1, x2, y2) {
        return x1 * x2 + y1 * y2;
    }

    /**
     * Calculate 2D vector cross product (returns scalar)
     * @param {number} x1 - First vector X
     * @param {number} y1 - First vector Y
     * @param {number} x2 - Second vector X
     * @param {number} y2 - Second vector Y
     * @returns {number} Cross product
     */
    static crossProduct(x1, y1, x2, y2) {
        return x1 * y2 - y1 * x2;
    }

    /**
     * Normalize a 2D vector
     * @param {number} x - Vector X
     * @param {number} y - Vector Y
     * @returns {Object} Normalized vector {x, y}
     */
    static normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    }

    /**
     * Calculate vector magnitude
     * @param {number} x - Vector X
     * @param {number} y - Vector Y
     * @returns {number} Vector magnitude
     */
    static magnitude(x, y) {
        return Math.sqrt(x * x + y * y);
    }
}
