/**
 * Main Application Bootstrap
 * Initializes and configures the modular game architecture
 */

// Core modules
import { ServiceContainer } from './core/ServiceContainer.js';
import { EventBus } from './core/EventBus.js';
import { GameEngine } from './core/GameEngine.js';

// Configuration
import { GameConfig } from './config/GameConfig.js';
import { SystemConfig } from './config/SystemConfig.js';

// Systems
import { RenderSystem } from './systems/RenderSystem.js';
import { InputManager } from './systems/InputManager.js';
import { AudioManager } from './systems/AudioManager.js';
import { EntityManager } from './systems/EntityManager.js';

// Utilities
import { performanceMonitor } from './utils/PerformanceUtils.js';

/**
 * Application class that bootstraps the entire game
 */
class Application {
    constructor() {
        this.serviceContainer = null;
        this.eventBus = null;
        this.gameEngine = null;
        this.gameConfig = null;
        this.systemConfig = null;
        this.isInitialized = false;
        this.isRunning = false;
        
        // Bind methods
        this.handleError = this.handleError.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize the application
     * @param {Object} options - Initialization options
     */
    async initialize(options = {}) {
        try {
            console.log('Initializing application...');
            
            // Determine environment
            const environment = options.environment || this.detectEnvironment();
            console.log(`Environment: ${environment}`);

            // Create core services
            this.eventBus = new EventBus();
            this.serviceContainer = new ServiceContainer();
            this.gameConfig = new GameConfig(environment);
            this.systemConfig = new SystemConfig();

            // Enable debug mode if needed
            if (this.gameConfig.get('game.debugMode')) {
                this.eventBus.setDebug(true);
                performanceMonitor.setEnabled(true);
                console.log('Debug mode enabled');
            }

            // Register core services
            this.registerCoreServices();

            // Register game systems
            this.registerGameSystems();

            // Validate system dependencies
            const validation = this.systemConfig.validateDependencies();
            if (!validation.isValid) {
                throw new Error(`Dependency validation failed: ${validation.errors.join(', ')}`);
            }

            if (validation.warnings.length > 0) {
                console.warn('Dependency warnings:', validation.warnings);
            }

            // Initialize systems in dependency order
            await this.initializeSystems();

            // Setup global error handling
            this.setupErrorHandling();

            // Setup application event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            this.eventBus.emit('application:initialized');
            
            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Start the application
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error('Application must be initialized before starting');
        }

        if (this.isRunning) {
            console.warn('Application is already running');
            return;
        }

        try {
            console.log('Starting application...');

            // Start the game engine
            this.gameEngine = this.serviceContainer.resolve('gameEngine');
            this.gameEngine.start();

            this.isRunning = true;
            this.eventBus.emit('application:started');
            
            console.log('Application started successfully');

        } catch (error) {
            console.error('Failed to start application:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Stop the application
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('Stopping application...');

        try {
            // Stop the game engine
            if (this.gameEngine) {
                this.gameEngine.stop();
            }

            this.isRunning = false;
            this.eventBus.emit('application:stopped');
            
            console.log('Application stopped');

        } catch (error) {
            console.error('Error stopping application:', error);
            this.handleError(error);
        }
    }

    /**
     * Destroy the application and cleanup resources
     */
    destroy() {
        console.log('Destroying application...');

        try {
            // Stop if running
            this.stop();

            // Destroy systems
            if (this.gameEngine) {
                this.gameEngine.destroy();
            }

            // Clear service container
            if (this.serviceContainer) {
                this.serviceContainer.clear();
            }

            // Clear event bus
            if (this.eventBus) {
                this.eventBus.removeAllListeners();
            }

            // Clear performance monitor
            performanceMonitor.clear();

            this.isInitialized = false;
            console.log('Application destroyed');

        } catch (error) {
            console.error('Error destroying application:', error);
        }
    }

    /**
     * Register core services with the service container
     */
    registerCoreServices() {
        // Register event bus (no dependencies)
        this.serviceContainer.register('eventBus', () => this.eventBus, true, []);

        // Register configurations
        this.serviceContainer.register('gameConfig', () => this.gameConfig, true, []);
        this.serviceContainer.register('systemConfig', () => this.systemConfig, true, []);

        // Register service container itself (for systems that need it)
        this.serviceContainer.register('serviceContainer', () => this.serviceContainer, true, []);
    }

    /**
     * Register game systems with the service container
     */
    registerGameSystems() {
        const systemConfigs = this.systemConfig.getAllSystemConfigs();

        for (const [systemName, config] of systemConfigs) {
            if (systemName === 'serviceContainer' || systemName === 'eventBus') {
                continue; // Already registered
            }

            // Get system class
            const SystemClass = this.getSystemClass(systemName);
            if (!SystemClass) {
                console.warn(`System class not found for: ${systemName}`);
                continue;
            }

            // Register system with dependencies
            this.serviceContainer.register(
                systemName,
                SystemClass,
                true,
                config.dependencies
            );
        }
    }

    /**
     * Get system class by name
     * @param {string} systemName - System name
     * @returns {Function|null} System class constructor
     */
    getSystemClass(systemName) {
        const systemClasses = {
            'gameEngine': GameEngine,
            'renderSystem': RenderSystem,
            'inputManager': InputManager,
            'audioManager': AudioManager,
            'entityManager': EntityManager
        };

        return systemClasses[systemName] || null;
    }

    /**
     * Initialize systems in dependency order
     */
    async initializeSystems() {
        const initOrder = this.systemConfig.getInitializationOrder();
        console.log('System initialization order:', initOrder);

        for (const systemName of initOrder) {
            if (systemName === 'serviceContainer' || systemName === 'eventBus') {
                continue; // Already initialized
            }

            try {
                console.log(`Initializing ${systemName}...`);
                const system = this.serviceContainer.resolve(systemName);
                
                if (system && typeof system.initialize === 'function') {
                    await system.initialize();
                }
                
                console.log(`${systemName} initialized`);

            } catch (error) {
                console.error(`Failed to initialize ${systemName}:`, error);
                throw error;
            }
        }
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message));
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });

        // Listen for system errors
        this.eventBus.subscribe('engine:error', ({ error, phase }) => {
            console.error(`Engine error in ${phase}:`, error);
            this.handleError(error);
        });
    }

    /**
     * Setup application event listeners
     */
    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Handle window beforeunload
        window.addEventListener('beforeunload', () => {
            this.destroy();
        });

        // Listen for performance warnings
        this.eventBus.subscribe('engine:performanceUpdate', (metrics) => {
            if (metrics.fps < 20) {
                console.warn('Low FPS detected:', metrics.fps);
                this.eventBus.emit('application:performanceWarning', { type: 'lowFPS', metrics });
            }
        });
    }

    /**
     * Handle application errors
     * @param {Error} error - Error object
     */
    handleError(error) {
        console.error('Application error:', error);
        
        // Emit error event
        this.eventBus.emit('application:error', { error });

        // In production, you might want to send errors to a logging service
        if (this.gameConfig && !this.gameConfig.get('game.debugMode')) {
            // Send to error reporting service
            this.reportError(error);
        }
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, pause the game
            if (this.gameEngine && this.isRunning) {
                this.gameEngine.pause();
            }
        } else {
            // Page is visible, resume the game
            if (this.gameEngine && this.isRunning) {
                this.gameEngine.resume();
            }
        }
    }

    /**
     * Detect the current environment
     * @returns {string} Environment name
     */
    detectEnvironment() {
        // Check for common development indicators
        if (location.hostname === 'localhost' || 
            location.hostname === '127.0.0.1' || 
            location.protocol === 'file:') {
            return 'development';
        }

        // Check for testing environment
        if (location.hostname.includes('test') || 
            location.hostname.includes('staging')) {
            return 'testing';
        }

        return 'production';
    }

    /**
     * Report error to external service (placeholder)
     * @param {Error} error - Error to report
     */
    reportError(error) {
        // Placeholder for error reporting service integration
        console.log('Would report error to service:', error.message);
    }

    /**
     * Get application status
     * @returns {Object} Application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            running: this.isRunning,
            performance: performanceMonitor.getSummary(),
            systems: this.serviceContainer ? this.serviceContainer.getServiceNames() : []
        };
    }
}

// Create global application instance
const app = new Application();

// Export for external use
export { app as Application };

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await app.initialize();
            await app.start();
        } catch (error) {
            console.error('Failed to start application:', error);
        }
    });
} else {
    // DOM is already ready
    (async () => {
        try {
            await app.initialize();
            await app.start();
        } catch (error) {
            console.error('Failed to start application:', error);
        }
    })();
}
