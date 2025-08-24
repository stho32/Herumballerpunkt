/**
 * System Configuration
 * Configuration for individual game systems and their dependencies
 */
export class SystemConfig {
    constructor() {
        this.systemConfigs = new Map();
        this.loadSystemConfigs();
    }

    /**
     * Load all system configurations
     */
    loadSystemConfigs() {
        // Render System Configuration
        this.systemConfigs.set('renderSystem', {
            name: 'RenderSystem',
            dependencies: ['gameConfig', 'eventBus'],
            config: {
                clearColor: '#000000',
                enableAntialiasing: true,
                enableAlpha: true,
                preserveDrawingBuffer: false,
                powerPreference: 'default', // 'low-power', 'high-performance', 'default'
                failIfMajorPerformanceCaveat: false
            }
        });

        // Input Manager Configuration
        this.systemConfigs.set('inputManager', {
            name: 'InputManager',
            dependencies: ['gameConfig', 'eventBus'],
            config: {
                keyMappings: {
                    // Movement
                    moveUp: ['KeyW', 'ArrowUp'],
                    moveDown: ['KeyS', 'ArrowDown'],
                    moveLeft: ['KeyA', 'ArrowLeft'],
                    moveRight: ['KeyD', 'ArrowRight'],
                    
                    // Actions
                    fire: ['Mouse0', 'Space'],
                    reload: ['KeyR'],
                    interact: ['KeyE'],
                    
                    // Weapons
                    weapon1: ['Digit1'],
                    weapon2: ['Digit2'],
                    weapon3: ['Digit3'],
                    weapon4: ['Digit4'],
                    weapon5: ['Digit5'],
                    
                    // UI
                    pause: ['Escape'],
                    menu: ['Tab']
                },
                mouseSettings: {
                    sensitivity: 1.0,
                    invertY: false,
                    smoothing: 0.1
                },
                gamepadSettings: {
                    deadZone: 0.1,
                    sensitivity: 1.0,
                    vibrationEnabled: true
                }
            }
        });

        // Audio Manager Configuration
        this.systemConfigs.set('audioManager', {
            name: 'AudioManager',
            dependencies: ['gameConfig', 'eventBus'],
            config: {
                audioContext: {
                    sampleRate: 44100,
                    latencyHint: 'interactive'
                },
                soundCategories: {
                    master: { volume: 1.0, muted: false },
                    music: { volume: 0.7, muted: false },
                    sfx: { volume: 0.8, muted: false },
                    ui: { volume: 0.6, muted: false },
                    ambient: { volume: 0.5, muted: false }
                },
                soundPools: {
                    shoot: { maxInstances: 10, category: 'sfx' },
                    explosion: { maxInstances: 5, category: 'sfx' },
                    pickup: { maxInstances: 3, category: 'sfx' },
                    hit: { maxInstances: 8, category: 'sfx' },
                    reload: { maxInstances: 2, category: 'sfx' }
                }
            }
        });

        // Entity Manager Configuration
        this.systemConfigs.set('entityManager', {
            name: 'EntityManager',
            dependencies: ['gameConfig', 'eventBus'],
            config: {
                maxEntities: 1000,
                entityPools: {
                    bullets: { initialSize: 100, maxSize: 500 },
                    enemies: { initialSize: 50, maxSize: 200 },
                    particles: { initialSize: 200, maxSize: 1000 },
                    pickups: { initialSize: 20, maxSize: 100 }
                },
                spatialPartitioning: {
                    enabled: true,
                    cellSize: 100,
                    maxObjectsPerCell: 10
                },
                collisionDetection: {
                    enabled: true,
                    broadPhase: 'spatialHash', // 'bruteForce', 'spatialHash', 'quadTree'
                    narrowPhase: 'circle' // 'circle', 'aabb', 'sat'
                }
            }
        });

        // Game Engine Configuration
        this.systemConfigs.set('gameEngine', {
            name: 'GameEngine',
            dependencies: ['serviceContainer', 'eventBus'],
            config: {
                targetFPS: 60,
                maxFrameSkip: 5,
                timeStep: 16.67, // milliseconds (60 FPS)
                enableVSync: true,
                performanceMonitoring: {
                    enabled: true,
                    sampleSize: 60,
                    warningThreshold: 30 // FPS
                }
            }
        });

        // Service Container Configuration
        this.systemConfigs.set('serviceContainer', {
            name: 'ServiceContainer',
            dependencies: [],
            config: {
                enableCircularDependencyDetection: true,
                maxDependencyDepth: 10,
                enableLazyLoading: true,
                enableSingletonValidation: true
            }
        });

        // Event Bus Configuration
        this.systemConfigs.set('eventBus', {
            name: 'EventBus',
            dependencies: [],
            config: {
                maxListeners: 100,
                enableDebugLogging: false,
                enablePerformanceTracking: false,
                queueSize: 1000
            }
        });
    }

    /**
     * Get configuration for a specific system
     * @param {string} systemName - Name of the system
     * @returns {Object|null} System configuration
     */
    getSystemConfig(systemName) {
        return this.systemConfigs.get(systemName) || null;
    }

    /**
     * Get all system configurations
     * @returns {Map} All system configurations
     */
    getAllSystemConfigs() {
        return new Map(this.systemConfigs);
    }

    /**
     * Update system configuration
     * @param {string} systemName - Name of the system
     * @param {Object} config - Configuration updates
     */
    updateSystemConfig(systemName, config) {
        const existingConfig = this.systemConfigs.get(systemName);
        if (existingConfig) {
            existingConfig.config = { ...existingConfig.config, ...config };
        }
    }

    /**
     * Get system dependencies
     * @param {string} systemName - Name of the system
     * @returns {Array} Array of dependency names
     */
    getSystemDependencies(systemName) {
        const config = this.systemConfigs.get(systemName);
        return config ? config.dependencies : [];
    }

    /**
     * Get systems that depend on a specific system
     * @param {string} systemName - Name of the system
     * @returns {Array} Array of dependent system names
     */
    getDependentSystems(systemName) {
        const dependents = [];
        
        for (const [name, config] of this.systemConfigs) {
            if (config.dependencies.includes(systemName)) {
                dependents.push(name);
            }
        }
        
        return dependents;
    }

    /**
     * Validate system dependencies
     * @returns {Object} Validation result
     */
    validateDependencies() {
        const errors = [];
        const warnings = [];
        const visited = new Set();
        const visiting = new Set();

        // Check for circular dependencies
        const checkCircular = (systemName, path = []) => {
            if (visiting.has(systemName)) {
                errors.push(`Circular dependency detected: ${path.join(' -> ')} -> ${systemName}`);
                return;
            }
            
            if (visited.has(systemName)) {
                return;
            }

            visiting.add(systemName);
            const config = this.systemConfigs.get(systemName);
            
            if (config) {
                for (const dependency of config.dependencies) {
                    if (!this.systemConfigs.has(dependency)) {
                        errors.push(`System '${systemName}' depends on unknown system '${dependency}'`);
                    } else {
                        checkCircular(dependency, [...path, systemName]);
                    }
                }
            }

            visiting.delete(systemName);
            visited.add(systemName);
        };

        // Check all systems
        for (const systemName of this.systemConfigs.keys()) {
            checkCircular(systemName);
        }

        // Check for orphaned systems (no dependents)
        for (const systemName of this.systemConfigs.keys()) {
            const dependents = this.getDependentSystems(systemName);
            if (dependents.length === 0 && systemName !== 'gameEngine') {
                warnings.push(`System '${systemName}' has no dependents`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get initialization order based on dependencies
     * @returns {Array} Array of system names in initialization order
     */
    getInitializationOrder() {
        const order = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (systemName) => {
            if (visiting.has(systemName)) {
                throw new Error(`Circular dependency detected involving '${systemName}'`);
            }
            
            if (visited.has(systemName)) {
                return;
            }

            visiting.add(systemName);
            const config = this.systemConfigs.get(systemName);
            
            if (config) {
                // Visit dependencies first
                for (const dependency of config.dependencies) {
                    visit(dependency);
                }
            }

            visiting.delete(systemName);
            visited.add(systemName);
            order.push(systemName);
        };

        // Visit all systems
        for (const systemName of this.systemConfigs.keys()) {
            visit(systemName);
        }

        return order;
    }

    /**
     * Export system configurations as JSON
     * @returns {string} JSON string
     */
    export() {
        const configObject = {};
        for (const [name, config] of this.systemConfigs) {
            configObject[name] = config;
        }
        return JSON.stringify(configObject, null, 2);
    }

    /**
     * Import system configurations from JSON
     * @param {string} jsonString - JSON configuration string
     */
    import(jsonString) {
        try {
            const configObject = JSON.parse(jsonString);
            this.systemConfigs.clear();
            
            for (const [name, config] of Object.entries(configObject)) {
                this.systemConfigs.set(name, config);
            }
        } catch (error) {
            throw new Error(`Failed to import system configuration: ${error.message}`);
        }
    }
}
