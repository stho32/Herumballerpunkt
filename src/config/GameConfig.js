/**
 * Game Configuration Management
 * Centralized configuration with environment-specific settings
 */
export class GameConfig {
    constructor(environment = 'development') {
        this.environment = environment;
        this.config = {};
        this.validators = new Map();
        this.changeListeners = new Map();
        
        this.loadDefaultConfig();
        this.loadEnvironmentConfig();
    }

    /**
     * Load default configuration
     */
    loadDefaultConfig() {
        this.config = {
            // Game settings
            game: {
                targetFPS: 60,
                maxEntities: 1000,
                difficulty: 'normal',
                autoSave: true,
                autoSaveInterval: 30000, // 30 seconds
                debugMode: false
            },

            // Rendering settings
            rendering: {
                enableVSync: true,
                enableParticles: true,
                maxParticles: 500,
                enableShadows: false,
                enablePostProcessing: false,
                canvasWidth: 1920,
                canvasHeight: 1080
            },

            // Audio settings
            audio: {
                masterVolume: 1.0,
                musicVolume: 0.7,
                sfxVolume: 0.8,
                enableAudio: true,
                enableMusic: true,
                enableSFX: true,
                audioContext: {
                    sampleRate: 44100,
                    latencyHint: 'interactive'
                }
            },

            // Input settings
            input: {
                mouseSensitivity: 1.0,
                keyRepeatDelay: 250,
                keyRepeatRate: 50,
                enableGamepad: true,
                deadZone: 0.1
            },

            // Performance settings
            performance: {
                enablePerformanceMonitoring: true,
                maxFrameSkip: 5,
                adaptiveQuality: true,
                lowPerformanceThreshold: 30, // FPS
                highPerformanceThreshold: 55 // FPS
            },

            // Entity settings
            entities: {
                player: {
                    health: 100,
                    speed: 5,
                    radius: 15
                },
                enemy: {
                    baseHealth: 30,
                    baseSpeed: 0.8,
                    baseDamage: 8,
                    spawnRate: 1.0
                },
                projectile: {
                    maxLifetime: 5000,
                    defaultSpeed: 15
                }
            },

            // Difficulty multipliers
            difficulty: {
                easy: {
                    enemyHealth: 0.7,
                    enemyDamage: 0.7,
                    enemySpeed: 0.8,
                    spawnRate: 0.7,
                    waveSize: 0.8
                },
                normal: {
                    enemyHealth: 1.0,
                    enemyDamage: 1.0,
                    enemySpeed: 1.0,
                    spawnRate: 1.0,
                    waveSize: 1.0
                },
                hard: {
                    enemyHealth: 1.5,
                    enemyDamage: 1.5,
                    enemySpeed: 1.2,
                    spawnRate: 1.3,
                    waveSize: 1.5
                }
            },

            // UI settings
            ui: {
                showFPS: false,
                showDebugInfo: false,
                enableTooltips: true,
                animationSpeed: 1.0,
                theme: 'dark'
            }
        };
    }

    /**
     * Load environment-specific configuration
     */
    loadEnvironmentConfig() {
        const envConfigs = {
            development: {
                game: {
                    debugMode: true
                },
                ui: {
                    showFPS: true,
                    showDebugInfo: true
                },
                performance: {
                    enablePerformanceMonitoring: true
                }
            },
            production: {
                game: {
                    debugMode: false
                },
                ui: {
                    showFPS: false,
                    showDebugInfo: false
                },
                performance: {
                    enablePerformanceMonitoring: false
                }
            },
            testing: {
                game: {
                    debugMode: true,
                    autoSave: false
                },
                audio: {
                    enableAudio: false,
                    enableMusic: false,
                    enableSFX: false
                }
            }
        };

        const envConfig = envConfigs[this.environment];
        if (envConfig) {
            this.mergeConfig(envConfig);
        }
    }

    /**
     * Get a configuration value by path
     * @param {string} path - Dot-separated path (e.g., 'game.difficulty')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = this.config;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }

        return current;
    }

    /**
     * Set a configuration value by path
     * @param {string} path - Dot-separated path
     * @param {*} value - Value to set
     * @param {boolean} validate - Whether to validate the value
     */
    set(path, value, validate = true) {
        if (validate && !this.validateValue(path, value)) {
            throw new Error(`Invalid value for configuration path '${path}': ${value}`);
        }

        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.config;

        // Navigate to parent object
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        const oldValue = current[lastKey];
        current[lastKey] = value;

        // Notify listeners
        this.notifyChange(path, value, oldValue);
    }

    /**
     * Merge configuration object
     * @param {Object} config - Configuration to merge
     */
    mergeConfig(config) {
        this.config = this.deepMerge(this.config, config);
    }

    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Register a validator for a configuration path
     * @param {string} path - Configuration path
     * @param {Function} validator - Validator function
     */
    registerValidator(path, validator) {
        this.validators.set(path, validator);
    }

    /**
     * Validate a configuration value
     * @param {string} path - Configuration path
     * @param {*} value - Value to validate
     * @returns {boolean} Whether value is valid
     */
    validateValue(path, value) {
        const validator = this.validators.get(path);
        if (validator) {
            return validator(value);
        }

        // Default validation based on path
        if (path.includes('volume') || path.includes('Volume')) {
            return typeof value === 'number' && value >= 0 && value <= 1;
        }
        if (path.includes('FPS') || path.includes('fps')) {
            return typeof value === 'number' && value > 0 && value <= 240;
        }

        return true; // No validation by default
    }

    /**
     * Listen for configuration changes
     * @param {string} path - Configuration path to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    onChange(path, callback) {
        if (!this.changeListeners.has(path)) {
            this.changeListeners.set(path, []);
        }

        const listeners = this.changeListeners.get(path);
        listeners.push(callback);

        // Return unsubscribe function
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify listeners of configuration changes
     * @param {string} path - Configuration path
     * @param {*} newValue - New value
     * @param {*} oldValue - Old value
     */
    notifyChange(path, newValue, oldValue) {
        const listeners = this.changeListeners.get(path);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error(`Error in config change listener for '${path}':`, error);
                }
            });
        }
    }

    /**
     * Get the entire configuration object
     * @returns {Object} Configuration object
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.config));
    }

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.loadDefaultConfig();
        this.loadEnvironmentConfig();
    }

    /**
     * Export configuration as JSON
     * @returns {string} JSON string
     */
    export() {
        return JSON.stringify(this.config, null, 2);
    }

    /**
     * Import configuration from JSON
     * @param {string} jsonString - JSON configuration string
     */
    import(jsonString) {
        try {
            const importedConfig = JSON.parse(jsonString);
            this.mergeConfig(importedConfig);
        } catch (error) {
            throw new Error(`Failed to import configuration: ${error.message}`);
        }
    }
}
