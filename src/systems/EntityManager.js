/**
 * Entity Manager - Manages all game entities
 * Handles entity lifecycle, updates, and spatial organization
 */
export class EntityManager {
    constructor(gameConfig, eventBus) {
        this.gameConfig = gameConfig;
        this.eventBus = eventBus;
        
        this.isInitialized = false;
        
        // Entity storage
        this.entities = new Map();
        this.entitiesByType = new Map();
        this.nextEntityId = 1;
        
        // Entity pools for performance
        this.entityPools = new Map();
        
        // Spatial partitioning for collision detection
        this.spatialGrid = null;
        this.spatialGridEnabled = false;
        this.gridCellSize = 100;
        
        // Update groups for different update frequencies
        this.updateGroups = new Map([
            ['high', { entities: new Set(), frequency: 1 }],      // Every frame
            ['medium', { entities: new Set(), frequency: 2 }],    // Every 2 frames
            ['low', { entities: new Set(), frequency: 4 }]        // Every 4 frames
        ]);
        this.frameCounter = 0;
        
        // Performance tracking
        this.stats = {
            totalEntities: 0,
            entitiesUpdated: 0,
            entitiesRendered: 0,
            collisionChecks: 0,
            updateTime: 0
        };
        
        this.setupEventListeners();
    }

    /**
     * Initialize the entity manager
     */
    async initialize() {
        try {
            // Setup entity pools
            this.setupEntityPools();
            
            // Setup spatial partitioning
            this.setupSpatialPartitioning();
            
            this.isInitialized = true;
            this.eventBus.emit('entityManager:initialized');
            
            console.log('EntityManager initialized');
            
        } catch (error) {
            console.error('Failed to initialize EntityManager:', error);
            throw error;
        }
    }

    /**
     * Update all entities
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.isInitialized) return;

        const startTime = performance.now();
        this.stats.entitiesUpdated = 0;
        this.stats.collisionChecks = 0;
        this.frameCounter++;

        // Update entities based on their update group frequency
        for (const [groupName, group] of this.updateGroups) {
            if (this.frameCounter % group.frequency === 0) {
                this.updateEntityGroup(group.entities, deltaTime);
            }
        }

        // Update spatial grid if enabled
        if (this.spatialGridEnabled) {
            this.updateSpatialGrid();
        }

        // Process collisions
        this.processCollisions(deltaTime);

        // Clean up destroyed entities
        this.cleanupDestroyedEntities();

        // Update statistics
        this.stats.totalEntities = this.entities.size;
        this.stats.updateTime = performance.now() - startTime;

        this.eventBus.emit('entityManager:updated', {
            deltaTime,
            stats: this.stats
        });
    }

    /**
     * Create a new entity
     * @param {string} type - Entity type
     * @param {Object} data - Entity initialization data
     * @returns {Object} Created entity
     */
    createEntity(type, data = {}) {
        const entityId = this.nextEntityId++;
        
        // Try to get entity from pool first
        let entity = this.getFromPool(type);
        
        if (!entity) {
            // Create new entity if pool is empty
            entity = this.createNewEntity(type, data);
        } else {
            // Reset pooled entity
            this.resetEntity(entity, data);
        }

        // Set common properties
        entity.id = entityId;
        entity.type = type;
        entity.active = true;
        entity.destroyed = false;
        entity.updateGroup = data.updateGroup || 'high';

        // Add to storage
        this.entities.set(entityId, entity);
        
        // Add to type collection
        if (!this.entitiesByType.has(type)) {
            this.entitiesByType.set(type, new Set());
        }
        this.entitiesByType.get(type).add(entity);

        // Add to update group
        const updateGroup = this.updateGroups.get(entity.updateGroup);
        if (updateGroup) {
            updateGroup.entities.add(entity);
        }

        this.eventBus.emit('entity:created', { entity, type, data });
        
        return entity;
    }

    /**
     * Destroy an entity
     * @param {number|Object} entityOrId - Entity or entity ID
     */
    destroyEntity(entityOrId) {
        const entity = typeof entityOrId === 'number' 
            ? this.entities.get(entityOrId) 
            : entityOrId;

        if (!entity || entity.destroyed) return;

        entity.destroyed = true;
        entity.active = false;

        this.eventBus.emit('entity:destroyed', { entity });
    }

    /**
     * Get entity by ID
     * @param {number} id - Entity ID
     * @returns {Object|null} Entity or null if not found
     */
    getEntity(id) {
        return this.entities.get(id) || null;
    }

    /**
     * Get all entities of a specific type
     * @param {string} type - Entity type
     * @returns {Set} Set of entities
     */
    getEntitiesByType(type) {
        return this.entitiesByType.get(type) || new Set();
    }

    /**
     * Get entities in a specific area
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Search radius
     * @returns {Array} Array of entities in area
     */
    getEntitiesInArea(x, y, radius) {
        if (this.spatialGridEnabled) {
            return this.getEntitiesInAreaSpatial(x, y, radius);
        } else {
            return this.getEntitiesInAreaBruteForce(x, y, radius);
        }
    }

    /**
     * Setup entity pools for performance
     */
    setupEntityPools() {
        const poolConfigs = this.gameConfig.get('entities.entityPools', {});
        
        for (const [type, config] of Object.entries(poolConfigs)) {
            this.entityPools.set(type, {
                pool: [],
                maxSize: config.maxSize || 100,
                initialSize: config.initialSize || 10
            });

            // Pre-populate pool
            const poolData = this.entityPools.get(type);
            for (let i = 0; i < poolData.initialSize; i++) {
                const entity = this.createNewEntity(type, {});
                entity.pooled = true;
                poolData.pool.push(entity);
            }
        }
    }

    /**
     * Setup spatial partitioning system
     */
    setupSpatialPartitioning() {
        const config = this.gameConfig.get('entities.spatialPartitioning', {});
        this.spatialGridEnabled = config.enabled || false;
        this.gridCellSize = config.cellSize || 100;

        if (this.spatialGridEnabled) {
            this.spatialGrid = new Map();
        }
    }

    /**
     * Create a new entity instance
     * @param {string} type - Entity type
     * @param {Object} data - Entity data
     * @returns {Object} New entity
     */
    createNewEntity(type, data) {
        // This would be replaced with actual entity classes
        const entity = {
            type,
            x: data.x || 0,
            y: data.y || 0,
            vx: data.vx || 0,
            vy: data.vy || 0,
            radius: data.radius || 10,
            health: data.health || 100,
            maxHealth: data.maxHealth || 100,
            active: true,
            destroyed: false,
            pooled: false,
            
            // Methods
            update: function(deltaTime) {
                if (!this.active) return;
                
                // Basic movement
                this.x += this.vx * deltaTime / 16.67; // Normalize to 60 FPS
                this.y += this.vy * deltaTime / 16.67;
                
                // Custom update logic would go here
                if (this.customUpdate) {
                    this.customUpdate(deltaTime);
                }
            },
            
            render: function(ctx, deltaTime) {
                if (!this.active) return;
                
                ctx.save();
                ctx.fillStyle = this.color || '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            },
            
            takeDamage: function(amount) {
                this.health -= amount;
                if (this.health <= 0) {
                    this.destroyed = true;
                }
            },
            
            getDistance: function(other) {
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                return Math.sqrt(dx * dx + dy * dy);
            },
            
            checkCollision: function(other) {
                const distance = this.getDistance(other);
                return distance < (this.radius + other.radius);
            }
        };

        // Add type-specific properties
        this.applyTypeSpecificProperties(entity, type, data);
        
        return entity;
    }

    /**
     * Apply type-specific properties to entity
     * @param {Object} entity - Entity to modify
     * @param {string} type - Entity type
     * @param {Object} data - Entity data
     */
    applyTypeSpecificProperties(entity, type, data) {
        const typeConfigs = {
            player: {
                color: '#4f4',
                health: this.gameConfig.get('entities.player.health', 100),
                speed: this.gameConfig.get('entities.player.speed', 5),
                radius: this.gameConfig.get('entities.player.radius', 15)
            },
            enemy: {
                color: '#f44',
                health: this.gameConfig.get('entities.enemy.baseHealth', 30),
                speed: this.gameConfig.get('entities.enemy.baseSpeed', 0.8),
                damage: this.gameConfig.get('entities.enemy.baseDamage', 8)
            },
            bullet: {
                color: '#ff0',
                radius: 3,
                speed: this.gameConfig.get('entities.projectile.defaultSpeed', 15),
                lifetime: this.gameConfig.get('entities.projectile.maxLifetime', 5000),
                updateGroup: 'high'
            },
            particle: {
                color: '#fff',
                radius: 2,
                lifetime: 1000,
                updateGroup: 'medium'
            }
        };

        const config = typeConfigs[type];
        if (config) {
            Object.assign(entity, config, data);
        }
    }

    /**
     * Reset a pooled entity
     * @param {Object} entity - Entity to reset
     * @param {Object} data - New entity data
     */
    resetEntity(entity, data) {
        // Reset to default state
        entity.active = true;
        entity.destroyed = false;
        entity.health = entity.maxHealth;
        
        // Apply new data
        Object.assign(entity, data);
    }

    /**
     * Get entity from pool
     * @param {string} type - Entity type
     * @returns {Object|null} Pooled entity or null
     */
    getFromPool(type) {
        const poolData = this.entityPools.get(type);
        if (poolData && poolData.pool.length > 0) {
            return poolData.pool.pop();
        }
        return null;
    }

    /**
     * Return entity to pool
     * @param {Object} entity - Entity to return to pool
     */
    returnToPool(entity) {
        const poolData = this.entityPools.get(entity.type);
        if (poolData && poolData.pool.length < poolData.maxSize) {
            entity.pooled = true;
            poolData.pool.push(entity);
            return true;
        }
        return false;
    }

    /**
     * Update a group of entities
     * @param {Set} entities - Set of entities to update
     * @param {number} deltaTime - Time since last frame
     */
    updateEntityGroup(entities, deltaTime) {
        for (const entity of entities) {
            if (entity.active && !entity.destroyed) {
                entity.update(deltaTime);
                this.stats.entitiesUpdated++;
            }
        }
    }

    /**
     * Update spatial grid for collision detection
     */
    updateSpatialGrid() {
        this.spatialGrid.clear();
        
        for (const entity of this.entities.values()) {
            if (!entity.active || entity.destroyed) continue;
            
            const gridX = Math.floor(entity.x / this.gridCellSize);
            const gridY = Math.floor(entity.y / this.gridCellSize);
            const key = `${gridX},${gridY}`;
            
            if (!this.spatialGrid.has(key)) {
                this.spatialGrid.set(key, []);
            }
            this.spatialGrid.get(key).push(entity);
        }
    }

    /**
     * Get entities in area using spatial partitioning
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Search radius
     * @returns {Array} Array of entities
     */
    getEntitiesInAreaSpatial(x, y, radius) {
        const entities = [];
        const minGridX = Math.floor((x - radius) / this.gridCellSize);
        const maxGridX = Math.floor((x + radius) / this.gridCellSize);
        const minGridY = Math.floor((y - radius) / this.gridCellSize);
        const maxGridY = Math.floor((y + radius) / this.gridCellSize);
        
        for (let gx = minGridX; gx <= maxGridX; gx++) {
            for (let gy = minGridY; gy <= maxGridY; gy++) {
                const key = `${gx},${gy}`;
                const cellEntities = this.spatialGrid.get(key) || [];
                
                for (const entity of cellEntities) {
                    const dx = entity.x - x;
                    const dy = entity.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= radius) {
                        entities.push(entity);
                    }
                }
            }
        }
        
        return entities;
    }

    /**
     * Get entities in area using brute force
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Search radius
     * @returns {Array} Array of entities
     */
    getEntitiesInAreaBruteForce(x, y, radius) {
        const entities = [];
        
        for (const entity of this.entities.values()) {
            if (!entity.active || entity.destroyed) continue;
            
            const dx = entity.x - x;
            const dy = entity.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
                entities.push(entity);
            }
        }
        
        return entities;
    }

    /**
     * Process collision detection
     * @param {number} deltaTime - Time since last frame
     */
    processCollisions(deltaTime) {
        // Simple collision detection between bullets and enemies
        const bullets = this.getEntitiesByType('bullet');
        const enemies = this.getEntitiesByType('enemy');
        
        for (const bullet of bullets) {
            if (!bullet.active || bullet.destroyed) continue;
            
            for (const enemy of enemies) {
                if (!enemy.active || enemy.destroyed) continue;
                
                this.stats.collisionChecks++;
                
                if (bullet.checkCollision(enemy)) {
                    // Handle collision
                    enemy.takeDamage(bullet.damage || 25);
                    bullet.destroyed = true;
                    
                    this.eventBus.emit('collision:detected', {
                        entityA: bullet,
                        entityB: enemy,
                        type: 'bullet-enemy'
                    });
                }
            }
        }
    }

    /**
     * Clean up destroyed entities
     */
    cleanupDestroyedEntities() {
        const destroyedEntities = [];
        
        for (const [id, entity] of this.entities) {
            if (entity.destroyed) {
                destroyedEntities.push({ id, entity });
            }
        }
        
        for (const { id, entity } of destroyedEntities) {
            // Remove from main storage
            this.entities.delete(id);
            
            // Remove from type collection
            const typeSet = this.entitiesByType.get(entity.type);
            if (typeSet) {
                typeSet.delete(entity);
            }
            
            // Remove from update group
            const updateGroup = this.updateGroups.get(entity.updateGroup);
            if (updateGroup) {
                updateGroup.entities.delete(entity);
            }
            
            // Try to return to pool
            if (!this.returnToPool(entity)) {
                // Entity couldn't be pooled, let it be garbage collected
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for render system requests
        this.eventBus.subscribe('renderSystem:frameComplete', () => {
            // Add entities to render layers
            this.addEntitiesToRenderLayers();
        });
    }

    /**
     * Add entities to render layers
     */
    addEntitiesToRenderLayers() {
        const renderSystem = this.gameConfig.get('renderSystem');
        if (!renderSystem) return;

        for (const entity of this.entities.values()) {
            if (entity.active && !entity.destroyed && entity.render) {
                renderSystem.addToLayer('entities', entity);
                this.stats.entitiesRendered++;
            }
        }
    }

    /**
     * Get entity statistics
     * @returns {Object} Entity statistics
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Clear all entities
        this.entities.clear();
        this.entitiesByType.clear();
        
        // Clear update groups
        for (const group of this.updateGroups.values()) {
            group.entities.clear();
        }
        
        // Clear pools
        this.entityPools.clear();
        
        // Clear spatial grid
        if (this.spatialGrid) {
            this.spatialGrid.clear();
        }
        
        this.isInitialized = false;
        this.eventBus.emit('entityManager:destroyed');
        console.log('EntityManager destroyed');
    }
}
