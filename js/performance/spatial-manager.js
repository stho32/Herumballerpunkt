/**
 * Spatial Manager for optimized collision detection using QuadTree
 */
class SpatialManager {
    constructor(bounds, maxObjects = 10, maxLevels = 5) {
        this.bounds = bounds;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.quadTree = new QuadTree(bounds, maxObjects, maxLevels);
        
        // Entity categories for optimized collision checking
        this.entityCategories = {
            bullets: [],
            enemies: [],
            allies: [],
            walls: [],
            pickups: [],
            effects: []
        };
        
        // Collision pairs to check
        this.collisionPairs = [
            { category1: 'bullets', category2: 'enemies' },
            { category1: 'bullets', category2: 'allies' },
            { category1: 'bullets', category2: 'walls' },
            { category1: 'enemies', category2: 'allies' },
            { category1: 'enemies', category2: 'walls' },
            { category1: 'allies', category2: 'walls' }
        ];
        
        // Performance tracking
        this.collisionChecks = 0;
        this.lastFrameChecks = 0;
        this.totalEntities = 0;
    }

    /**
     * Clear all entities and rebuild the quadtree
     */
    clear() {
        this.quadTree.clear();
        Object.keys(this.entityCategories).forEach(category => {
            this.entityCategories[category] = [];
        });
        this.collisionChecks = 0;
        this.totalEntities = 0;
    }

    /**
     * Add entity to spatial manager
     */
    addEntity(entity, category) {
        if (!this.entityCategories[category]) {
            this.entityCategories[category] = [];
        }
        
        // Ensure entity has required properties for spatial partitioning
        if (typeof entity.x !== 'number' || typeof entity.y !== 'number') {
            console.warn('Entity missing position properties:', entity);
            return;
        }
        
        if (typeof entity.radius !== 'number') {
            entity.radius = entity.radius || 10; // Default radius
        }
        
        this.entityCategories[category].push(entity);
        this.quadTree.insert(entity);
        this.totalEntities++;
    }

    /**
     * Remove entity from spatial manager
     */
    removeEntity(entity, category) {
        if (this.entityCategories[category]) {
            const index = this.entityCategories[category].indexOf(entity);
            if (index !== -1) {
                this.entityCategories[category].splice(index, 1);
                this.totalEntities--;
            }
        }
    }

    /**
     * Update spatial manager with current entities
     */
    update(gameState) {
        this.clear();
        
        // Add all entities to spatial manager
        if (gameState.bullets) {
            gameState.bullets.forEach(bullet => this.addEntity(bullet, 'bullets'));
        }
        
        if (gameState.enemies) {
            gameState.enemies.forEach(enemy => this.addEntity(enemy, 'enemies'));
        }
        
        if (gameState.allies) {
            gameState.allies.forEach(ally => this.addEntity(ally, 'allies'));
        }
        
        if (gameState.walls) {
            gameState.walls.forEach(wall => this.addEntity(wall, 'walls'));
        }
        
        if (gameState.pickups) {
            gameState.pickups.forEach(pickup => this.addEntity(pickup, 'pickups'));
        }
        
        if (gameState.player) {
            this.addEntity(gameState.player, 'allies');
        }
        
        // Add enemy squad members
        if (gameState.enemySquads) {
            gameState.enemySquads.forEach(squad => {
                if (squad.members) {
                    squad.members.forEach(member => this.addEntity(member, 'enemies'));
                }
            });
        }
        
        // Add turrets
        if (gameState.turrets) {
            gameState.turrets.forEach(turret => {
                this.addEntity(turret, turret.isAlly ? 'allies' : 'enemies');
            });
        }
        
        this.lastFrameChecks = this.collisionChecks;
        this.collisionChecks = 0;
    }

    /**
     * Get potential collision candidates for an entity
     */
    getPotentialCollisions(entity) {
        return this.quadTree.retrieve(entity);
    }

    /**
     * Check collisions between two entity categories
     */
    checkCategoryCollisions(category1, category2, collisionCallback) {
        const entities1 = this.entityCategories[category1] || [];
        const collisions = [];
        
        entities1.forEach(entity1 => {
            const potentialCollisions = this.getPotentialCollisions(entity1);
            
            potentialCollisions.forEach(entity2 => {
                // Check if entity2 belongs to category2
                const belongsToCategory2 = this.entityCategories[category2] && 
                                         this.entityCategories[category2].includes(entity2);
                
                if (belongsToCategory2 && entity1 !== entity2) {
                    this.collisionChecks++;
                    
                    if (this.checkCollision(entity1, entity2)) {
                        collisions.push({ entity1, entity2 });
                        
                        if (collisionCallback) {
                            collisionCallback(entity1, entity2);
                        }
                    }
                }
            });
        });
        
        return collisions;
    }

    /**
     * Check collision between two entities
     */
    checkCollision(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (entity1.radius + entity2.radius);
    }

    /**
     * Check wall collision for an entity
     */
    checkWallCollision(entity, wall) {
        return entity.x + entity.radius > wall.x && 
               entity.x - entity.radius < wall.x + wall.width &&
               entity.y + entity.radius > wall.y && 
               entity.y - entity.radius < wall.y + wall.height;
    }

    /**
     * Process all collision pairs
     */
    processAllCollisions(collisionHandlers = {}) {
        const allCollisions = [];
        
        this.collisionPairs.forEach(pair => {
            const collisions = this.checkCategoryCollisions(
                pair.category1, 
                pair.category2,
                collisionHandlers[`${pair.category1}_${pair.category2}`]
            );
            allCollisions.push(...collisions);
        });
        
        return allCollisions;
    }

    /**
     * Get entities within a radius of a point
     */
    getEntitiesInRadius(x, y, radius, category = null) {
        const searchEntity = { x, y, radius };
        const potentialEntities = this.getPotentialCollisions(searchEntity);
        const entitiesInRadius = [];
        
        potentialEntities.forEach(entity => {
            if (category && !this.entityCategories[category].includes(entity)) {
                return;
            }
            
            const distance = Math.sqrt((entity.x - x) ** 2 + (entity.y - y) ** 2);
            if (distance <= radius + entity.radius) {
                entitiesInRadius.push(entity);
            }
        });
        
        return entitiesInRadius;
    }

    /**
     * Get nearest entity to a point
     */
    getNearestEntity(x, y, category = null, maxDistance = Infinity) {
        const entities = category ? this.entityCategories[category] : this.getAllEntities();
        let nearest = null;
        let nearestDistance = maxDistance;
        
        entities.forEach(entity => {
            const distance = Math.sqrt((entity.x - x) ** 2 + (entity.y - y) ** 2);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = entity;
            }
        });
        
        return { entity: nearest, distance: nearestDistance };
    }

    /**
     * Get all entities from all categories
     */
    getAllEntities() {
        const allEntities = [];
        Object.values(this.entityCategories).forEach(category => {
            allEntities.push(...category);
        });
        return allEntities;
    }

    /**
     * Get performance statistics
     */
    getStats() {
        const quadTreeStats = this.quadTree.getStats();
        
        return {
            totalEntities: this.totalEntities,
            collisionChecksThisFrame: this.collisionChecks,
            collisionChecksLastFrame: this.lastFrameChecks,
            quadTree: quadTreeStats,
            entityCounts: Object.keys(this.entityCategories).reduce((counts, category) => {
                counts[category] = this.entityCategories[category].length;
                return counts;
            }, {}),
            efficiency: this.totalEntities > 0 ? 
                       (this.lastFrameChecks / (this.totalEntities * this.totalEntities)) : 0
        };
    }

    /**
     * Optimize quadtree parameters based on current entity distribution
     */
    optimizeParameters() {
        const stats = this.getStats();
        
        // Adjust maxObjects based on entity density
        if (stats.totalEntities > 200) {
            this.maxObjects = Math.max(5, Math.min(15, Math.floor(stats.totalEntities / 20)));
        }
        
        // Adjust maxLevels based on area size and entity count
        const area = this.bounds.width * this.bounds.height;
        const density = stats.totalEntities / area;
        
        if (density > 0.001) {
            this.maxLevels = Math.min(6, Math.max(3, Math.floor(Math.log2(stats.totalEntities))));
        }
        
        // Recreate quadtree with new parameters
        this.quadTree = new QuadTree(this.bounds, this.maxObjects, this.maxLevels);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpatialManager;
}
