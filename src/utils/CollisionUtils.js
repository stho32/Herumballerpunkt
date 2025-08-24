/**
 * Collision Utilities
 * Advanced collision detection and resolution functions
 */
import { MathUtils } from './MathUtils.js';

export class CollisionUtils {
    /**
     * Check collision between two circles
     * @param {Object} circle1 - First circle {x, y, radius}
     * @param {Object} circle2 - Second circle {x, y, radius}
     * @returns {boolean} True if collision detected
     */
    static circleToCircle(circle1, circle2) {
        return MathUtils.circleCollision(
            circle1.x, circle1.y, circle1.radius,
            circle2.x, circle2.y, circle2.radius
        );
    }

    /**
     * Check collision between circle and rectangle
     * @param {Object} circle - Circle {x, y, radius}
     * @param {Object} rect - Rectangle {x, y, width, height}
     * @returns {boolean} True if collision detected
     */
    static circleToRect(circle, rect) {
        // Find the closest point on the rectangle to the circle center
        const closestX = MathUtils.clamp(circle.x, rect.x, rect.x + rect.width);
        const closestY = MathUtils.clamp(circle.y, rect.y, rect.y + rect.height);
        
        // Calculate distance from circle center to closest point
        const distance = MathUtils.getDistance(circle.x, circle.y, closestX, closestY);
        
        return distance < circle.radius;
    }

    /**
     * Check collision between two rectangles
     * @param {Object} rect1 - First rectangle {x, y, width, height}
     * @param {Object} rect2 - Second rectangle {x, y, width, height}
     * @returns {boolean} True if collision detected
     */
    static rectToRect(rect1, rect2) {
        return MathUtils.rectCollision(
            rect1.x, rect1.y, rect1.width, rect1.height,
            rect2.x, rect2.y, rect2.width, rect2.height
        );
    }

    /**
     * Check if point is inside circle
     * @param {Object} point - Point {x, y}
     * @param {Object} circle - Circle {x, y, radius}
     * @returns {boolean} True if point is inside circle
     */
    static pointInCircle(point, circle) {
        return MathUtils.pointInCircle(point.x, point.y, circle.x, circle.y, circle.radius);
    }

    /**
     * Check if point is inside rectangle
     * @param {Object} point - Point {x, y}
     * @param {Object} rect - Rectangle {x, y, width, height}
     * @returns {boolean} True if point is inside rectangle
     */
    static pointInRect(point, rect) {
        return MathUtils.pointInRect(point.x, point.y, rect.x, rect.y, rect.width, rect.height);
    }

    /**
     * Get collision information between two circles
     * @param {Object} circle1 - First circle {x, y, radius}
     * @param {Object} circle2 - Second circle {x, y, radius}
     * @returns {Object|null} Collision info or null if no collision
     */
    static getCircleCollisionInfo(circle1, circle2) {
        const dx = circle2.x - circle1.x;
        const dy = circle2.y - circle1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = circle1.radius + circle2.radius;
        
        if (distance >= minDistance) {
            return null; // No collision
        }
        
        const overlap = minDistance - distance;
        const normalX = distance > 0 ? dx / distance : 1;
        const normalY = distance > 0 ? dy / distance : 0;
        
        return {
            overlap,
            normalX,
            normalY,
            contactX: circle1.x + normalX * circle1.radius,
            contactY: circle1.y + normalY * circle1.radius
        };
    }

    /**
     * Resolve collision between two circles with physics
     * @param {Object} circle1 - First circle {x, y, vx, vy, mass, radius}
     * @param {Object} circle2 - Second circle {x, y, vx, vy, mass, radius}
     * @param {number} restitution - Bounce factor (0-1)
     */
    static resolveCircleCollision(circle1, circle2, restitution = 0.8) {
        const collisionInfo = this.getCircleCollisionInfo(circle1, circle2);
        if (!collisionInfo) return;
        
        const { overlap, normalX, normalY } = collisionInfo;
        
        // Separate circles
        const totalMass = circle1.mass + circle2.mass;
        const separation1 = overlap * (circle2.mass / totalMass);
        const separation2 = overlap * (circle1.mass / totalMass);
        
        circle1.x -= normalX * separation1;
        circle1.y -= normalY * separation1;
        circle2.x += normalX * separation2;
        circle2.y += normalY * separation2;
        
        // Calculate relative velocity
        const relativeVx = circle2.vx - circle1.vx;
        const relativeVy = circle2.vy - circle1.vy;
        
        // Calculate relative velocity along normal
        const velocityAlongNormal = relativeVx * normalX + relativeVy * normalY;
        
        // Don't resolve if velocities are separating
        if (velocityAlongNormal > 0) return;
        
        // Calculate impulse scalar
        const impulse = -(1 + restitution) * velocityAlongNormal / totalMass;
        
        // Apply impulse
        const impulseX = impulse * normalX;
        const impulseY = impulse * normalY;
        
        circle1.vx -= impulseX * circle2.mass;
        circle1.vy -= impulseY * circle2.mass;
        circle2.vx += impulseX * circle1.mass;
        circle2.vy += impulseY * circle1.mass;
    }

    /**
     * Check collision between circle and wall (rectangle)
     * @param {Object} circle - Circle {x, y, radius}
     * @param {Object} wall - Wall {x, y, width, height}
     * @returns {Object|null} Collision info or null
     */
    static getCircleWallCollision(circle, wall) {
        // Find closest point on wall to circle center
        const closestX = MathUtils.clamp(circle.x, wall.x, wall.x + wall.width);
        const closestY = MathUtils.clamp(circle.y, wall.y, wall.y + wall.height);
        
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= circle.radius) {
            return null; // No collision
        }
        
        const overlap = circle.radius - distance;
        let normalX = 0;
        let normalY = 0;
        
        if (distance > 0) {
            normalX = dx / distance;
            normalY = dy / distance;
        } else {
            // Circle center is inside wall, determine best normal
            const leftDist = circle.x - wall.x;
            const rightDist = (wall.x + wall.width) - circle.x;
            const topDist = circle.y - wall.y;
            const bottomDist = (wall.y + wall.height) - circle.y;
            
            const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
            
            if (minDist === leftDist) {
                normalX = -1;
            } else if (minDist === rightDist) {
                normalX = 1;
            } else if (minDist === topDist) {
                normalY = -1;
            } else {
                normalY = 1;
            }
        }
        
        return {
            overlap,
            normalX,
            normalY,
            contactX: closestX,
            contactY: closestY
        };
    }

    /**
     * Resolve collision between circle and wall
     * @param {Object} circle - Circle {x, y, vx, vy, radius}
     * @param {Object} wall - Wall {x, y, width, height}
     * @param {number} restitution - Bounce factor (0-1)
     */
    static resolveCircleWallCollision(circle, wall, restitution = 0.8) {
        const collisionInfo = this.getCircleWallCollision(circle, wall);
        if (!collisionInfo) return;
        
        const { overlap, normalX, normalY } = collisionInfo;
        
        // Move circle out of wall
        circle.x += normalX * overlap;
        circle.y += normalY * overlap;
        
        // Calculate velocity component along normal
        const velocityAlongNormal = circle.vx * normalX + circle.vy * normalY;
        
        // Don't resolve if moving away from wall
        if (velocityAlongNormal > 0) return;
        
        // Reflect velocity
        circle.vx -= velocityAlongNormal * normalX * (1 + restitution);
        circle.vy -= velocityAlongNormal * normalY * (1 + restitution);
    }

    /**
     * Check line-circle intersection
     * @param {Object} line - Line {x1, y1, x2, y2}
     * @param {Object} circle - Circle {x, y, radius}
     * @returns {boolean} True if intersection exists
     */
    static lineCircleIntersection(line, circle) {
        const { x1, y1, x2, y2 } = line;
        const { x: cx, y: cy, radius } = circle;
        
        // Vector from line start to circle center
        const dx = cx - x1;
        const dy = cy - y1;
        
        // Line direction vector
        const lx = x2 - x1;
        const ly = y2 - y1;
        
        // Project circle center onto line
        const lineLength = Math.sqrt(lx * lx + ly * ly);
        if (lineLength === 0) return false;
        
        const t = MathUtils.clamp((dx * lx + dy * ly) / (lineLength * lineLength), 0, 1);
        
        // Closest point on line to circle center
        const closestX = x1 + t * lx;
        const closestY = y1 + t * ly;
        
        // Check distance
        const distance = MathUtils.getDistance(cx, cy, closestX, closestY);
        return distance <= radius;
    }

    /**
     * Get all entities within a radius of a point
     * @param {Array} entities - Array of entities to check
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Search radius
     * @returns {Array} Array of entities within radius
     */
    static getEntitiesInRadius(entities, x, y, radius) {
        return entities.filter(entity => {
            if (!entity.x || !entity.y) return false;
            return MathUtils.getDistance(x, y, entity.x, entity.y) <= radius;
        });
    }

    /**
     * Check if entity is within screen bounds
     * @param {Object} entity - Entity {x, y, radius}
     * @param {number} screenWidth - Screen width
     * @param {number} screenHeight - Screen height
     * @param {number} margin - Margin around screen (default: 0)
     * @returns {boolean} True if entity is within bounds
     */
    static isWithinScreenBounds(entity, screenWidth, screenHeight, margin = 0) {
        const radius = entity.radius || 0;
        return entity.x + radius >= -margin &&
               entity.x - radius <= screenWidth + margin &&
               entity.y + radius >= -margin &&
               entity.y - radius <= screenHeight + margin;
    }

    /**
     * Clamp entity position to screen bounds
     * @param {Object} entity - Entity {x, y, radius}
     * @param {number} screenWidth - Screen width
     * @param {number} screenHeight - Screen height
     */
    static clampToScreenBounds(entity, screenWidth, screenHeight) {
        const radius = entity.radius || 0;
        entity.x = MathUtils.clamp(entity.x, radius, screenWidth - radius);
        entity.y = MathUtils.clamp(entity.y, radius, screenHeight - radius);
    }

    /**
     * Wrap entity position around screen bounds
     * @param {Object} entity - Entity {x, y, radius}
     * @param {number} screenWidth - Screen width
     * @param {number} screenHeight - Screen height
     */
    static wrapAroundScreen(entity, screenWidth, screenHeight) {
        const radius = entity.radius || 0;
        
        if (entity.x + radius < 0) {
            entity.x = screenWidth + radius;
        } else if (entity.x - radius > screenWidth) {
            entity.x = -radius;
        }
        
        if (entity.y + radius < 0) {
            entity.y = screenHeight + radius;
        } else if (entity.y - radius > screenHeight) {
            entity.y = -radius;
        }
    }

    /**
     * Check collision between moving circle and static circle
     * @param {Object} movingCircle - Moving circle {x, y, vx, vy, radius}
     * @param {Object} staticCircle - Static circle {x, y, radius}
     * @param {number} deltaTime - Time step
     * @returns {Object|null} Collision info with time of impact
     */
    static getMovingCircleCollision(movingCircle, staticCircle, deltaTime) {
        const dx = staticCircle.x - movingCircle.x;
        const dy = staticCircle.y - movingCircle.y;
        const dvx = -movingCircle.vx;
        const dvy = -movingCircle.vy;
        
        const a = dvx * dvx + dvy * dvy;
        const b = 2 * (dx * dvx + dy * dvy);
        const c = dx * dx + dy * dy - Math.pow(movingCircle.radius + staticCircle.radius, 2);
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0 || a === 0) {
            return null; // No collision
        }
        
        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
        
        const t = Math.min(t1, t2);
        
        if (t < 0 || t > deltaTime) {
            return null; // Collision outside time step
        }
        
        return {
            time: t,
            x: movingCircle.x + movingCircle.vx * t,
            y: movingCircle.y + movingCircle.vy * t
        };
    }

    /**
     * Broad phase collision detection using spatial hashing
     * @param {Array} entities - Array of entities
     * @param {number} cellSize - Size of spatial grid cells
     * @returns {Array} Array of potential collision pairs
     */
    static broadPhaseCollision(entities, cellSize = 100) {
        const spatialHash = new Map();
        const pairs = [];
        
        // Hash entities into spatial grid
        for (const entity of entities) {
            if (!entity.x || !entity.y || !entity.radius) continue;
            
            const minX = Math.floor((entity.x - entity.radius) / cellSize);
            const maxX = Math.floor((entity.x + entity.radius) / cellSize);
            const minY = Math.floor((entity.y - entity.radius) / cellSize);
            const maxY = Math.floor((entity.y + entity.radius) / cellSize);
            
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    const key = `${x},${y}`;
                    if (!spatialHash.has(key)) {
                        spatialHash.set(key, []);
                    }
                    spatialHash.get(key).push(entity);
                }
            }
        }
        
        // Find potential collision pairs
        const checkedPairs = new Set();
        
        for (const cellEntities of spatialHash.values()) {
            for (let i = 0; i < cellEntities.length; i++) {
                for (let j = i + 1; j < cellEntities.length; j++) {
                    const entity1 = cellEntities[i];
                    const entity2 = cellEntities[j];
                    
                    const pairKey = entity1.id < entity2.id 
                        ? `${entity1.id}-${entity2.id}` 
                        : `${entity2.id}-${entity1.id}`;
                    
                    if (!checkedPairs.has(pairKey)) {
                        checkedPairs.add(pairKey);
                        pairs.push([entity1, entity2]);
                    }
                }
            }
        }
        
        return pairs;
    }
}
