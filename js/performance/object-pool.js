/**
 * Object Pool implementation for efficient memory management
 * Reduces garbage collection by reusing objects
 */
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        this.totalCreated = 0;
        this.totalReused = 0;
        
        // Pre-populate the pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
            this.totalCreated++;
        }
    }

    /**
     * Get an object from the pool
     */
    get() {
        let obj;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop();
            this.totalReused++;
        } else {
            obj = this.createFn();
            this.totalCreated++;
        }
        
        this.active.push(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     */
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    /**
     * Release multiple objects at once
     */
    releaseAll(objects) {
        objects.forEach(obj => this.release(obj));
    }

    /**
     * Expand the pool size
     */
    expand(size) {
        for (let i = 0; i < size; i++) {
            this.pool.push(this.createFn());
            this.totalCreated++;
        }
    }

    /**
     * Get pool statistics
     */
    getStats() {
        return {
            poolSize: this.pool.length,
            activeObjects: this.active.length,
            totalCreated: this.totalCreated,
            totalReused: this.totalReused,
            reuseRatio: this.totalReused / (this.totalCreated + this.totalReused)
        };
    }

    /**
     * Clear the pool (for cleanup)
     */
    clear() {
        this.pool = [];
        this.active = [];
    }
}

/**
 * Bullet Pool Manager
 */
class BulletPool extends ObjectPool {
    constructor(initialSize = 500) {
        super(
            // Create function
            () => ({
                x: 0, y: 0, vx: 0, vy: 0,
                radius: 4, damage: 10,
                isPlayer: false, isAlly: false,
                color: '#fff', lifetime: undefined,
                explosive: false, flame: false,
                active: false
            }),
            // Reset function
            (bullet) => {
                bullet.x = 0;
                bullet.y = 0;
                bullet.vx = 0;
                bullet.vy = 0;
                bullet.radius = 4;
                bullet.damage = 10;
                bullet.isPlayer = false;
                bullet.isAlly = false;
                bullet.color = '#fff';
                bullet.lifetime = undefined;
                bullet.explosive = false;
                bullet.flame = false;
                bullet.active = false;
            },
            initialSize
        );
    }

    /**
     * Create a bullet with specific properties
     */
    createBullet(properties) {
        const bullet = this.get();
        Object.assign(bullet, properties);
        bullet.active = true;
        return bullet;
    }

    /**
     * Release a bullet back to the pool
     */
    releaseBullet(bullet) {
        bullet.active = false;
        this.release(bullet);
    }
}

/**
 * Particle Pool Manager
 */
class ParticlePool extends ObjectPool {
    constructor(initialSize = 1000) {
        super(
            // Create function
            () => ({
                x: 0, y: 0, vx: 0, vy: 0,
                life: 0, maxLife: 30,
                color: '#fff', size: 2,
                active: false
            }),
            // Reset function
            (particle) => {
                particle.x = 0;
                particle.y = 0;
                particle.vx = 0;
                particle.vy = 0;
                particle.life = 0;
                particle.maxLife = 30;
                particle.color = '#fff';
                particle.size = 2;
                particle.active = false;
            },
            initialSize
        );
    }

    /**
     * Create a particle with specific properties
     */
    createParticle(x, y, color = '#fff', count = 1) {
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const particle = this.get();
            particle.x = x + (Math.random() - 0.5) * 10;
            particle.y = y + (Math.random() - 0.5) * 10;
            particle.vx = (Math.random() - 0.5) * 4;
            particle.vy = (Math.random() - 0.5) * 4;
            particle.color = color;
            particle.life = 0;
            particle.maxLife = 20 + Math.random() * 20;
            particle.size = 1 + Math.random() * 3;
            particle.active = true;
            
            particles.push(particle);
        }
        
        return particles;
    }

    /**
     * Release a particle back to the pool
     */
    releaseParticle(particle) {
        particle.active = false;
        this.release(particle);
    }
}

/**
 * Effect Pool Manager for temporary effects
 */
class EffectPool extends ObjectPool {
    constructor(initialSize = 200) {
        super(
            // Create function
            () => ({
                x: 0, y: 0, radius: 0,
                type: 'explosion', duration: 0,
                maxDuration: 30, color: '#ff0',
                active: false
            }),
            // Reset function
            (effect) => {
                effect.x = 0;
                effect.y = 0;
                effect.radius = 0;
                effect.type = 'explosion';
                effect.duration = 0;
                effect.maxDuration = 30;
                effect.color = '#ff0';
                effect.active = false;
            },
            initialSize
        );
    }

    /**
     * Create an effect with specific properties
     */
    createEffect(properties) {
        const effect = this.get();
        Object.assign(effect, properties);
        effect.active = true;
        effect.duration = 0;
        return effect;
    }

    /**
     * Release an effect back to the pool
     */
    releaseEffect(effect) {
        effect.active = false;
        this.release(effect);
    }
}

/**
 * Global Pool Manager
 */
class PoolManager {
    constructor() {
        this.bulletPool = new BulletPool(500);
        this.particlePool = new ParticlePool(1000);
        this.effectPool = new EffectPool(200);
    }

    /**
     * Get all pool statistics
     */
    getAllStats() {
        return {
            bullets: this.bulletPool.getStats(),
            particles: this.particlePool.getStats(),
            effects: this.effectPool.getStats()
        };
    }

    /**
     * Auto-expand pools if needed
     */
    autoExpand() {
        const bulletStats = this.bulletPool.getStats();
        const particleStats = this.particlePool.getStats();
        const effectStats = this.effectPool.getStats();

        // Expand if pool is running low
        if (bulletStats.poolSize < 50) {
            this.bulletPool.expand(100);
        }
        if (particleStats.poolSize < 100) {
            this.particlePool.expand(200);
        }
        if (effectStats.poolSize < 20) {
            this.effectPool.expand(50);
        }
    }

    /**
     * Clear all pools
     */
    clearAll() {
        this.bulletPool.clear();
        this.particlePool.clear();
        this.effectPool.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ObjectPool, BulletPool, ParticlePool, EffectPool, PoolManager };
}
