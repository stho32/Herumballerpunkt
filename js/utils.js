// Utility functions

// Particle system - now optimized with object pooling
let particles = [];
let particlePool = null; // Will be set by game manager

function createParticles(x, y, color, count = 10) {
    // Use optimized particle creation if pool is available
    if (particlePool && typeof gameManager !== 'undefined' && gameManager.poolManager) {
        const newParticles = gameManager.poolManager.particlePool.createParticle(x, y, color, count);
        particles.push(...newParticles);
        return;
    }

    // Fallback to old system
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 3 + 1,
            color: color,
            lifetime: 30,
            active: true
        });
    }
}

function updateParticles() {
    // Optimized particle update with object pooling
    particles = particles.filter((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.95;
        particle.vy *= 0.95;

        // Handle pooled particles
        if (particle.life !== undefined) {
            particle.life++;
            if (particle.life >= particle.maxLife) {
                if (particlePool && typeof gameManager !== 'undefined' && gameManager.poolManager) {
                    gameManager.poolManager.particlePool.releaseParticle(particle);
                }
                return false;
            }
        } else {
            // Handle old-style particles
            particle.lifetime--;
            if (particle.lifetime <= 0) {
                return false;
            }
        }

        return true;
    });
}

// Collision detection
function checkCollision(entity1, entity2) {
    const dx = entity1.x - entity2.x;
    const dy = entity1.y - entity2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < entity1.radius + entity2.radius;
}

function checkWallCollision(entity, wall) {
    return entity.x + entity.radius > wall.x && 
           entity.x - entity.radius < wall.x + wall.width &&
           entity.y + entity.radius > wall.y && 
           entity.y - entity.radius < wall.y + wall.height;
}

function resolveWallCollision(entity, wall) {
    // Calculate overlap on each axis
    const overlapLeft = (entity.x + entity.radius) - wall.x;
    const overlapRight = (wall.x + wall.width) - (entity.x - entity.radius);
    const overlapTop = (entity.y + entity.radius) - wall.y;
    const overlapBottom = (wall.y + wall.height) - (entity.y - entity.radius);
    
    // Find the smallest overlap
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);
    
    // Push the entity out by the smallest overlap
    if (minOverlapX < minOverlapY) {
        if (overlapLeft < overlapRight) {
            entity.x = wall.x - entity.radius;
        } else {
            entity.x = wall.x + wall.width + entity.radius;
        }
    } else {
        if (overlapTop < overlapBottom) {
            entity.y = wall.y - entity.radius;
        } else {
            entity.y = wall.y + wall.height + entity.radius;
        }
    }
}

// Distance calculation
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Angle calculation
function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Create explosion effect
function createExplosion(x, y, radius = 100, damage = 50) {
    // Visual effect
    createParticles(x, y, '#f80', 30);
    createParticles(x, y, '#ff0', 20);
    playSound('explosion', 0.4);
    
    // Damage nearby entities
    // This will be handled by the game logic
    return { x, y, radius, damage };
}

// Random spawn position at edge of screen
function getRandomEdgePosition(canvas) {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: x = Math.random() * canvas.width; y = -30; break;
        case 1: x = canvas.width + 30; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + 30; break;
        case 3: x = -30; y = Math.random() * canvas.height; break;
    }
    
    return { x, y };
}

// Format time display
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}