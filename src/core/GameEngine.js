/**
 * Game Engine - Central coordination and game loop management
 * Orchestrates all game systems and manages the main game loop
 */
export class GameEngine {
    constructor(serviceContainer, eventBus) {
        this.serviceContainer = serviceContainer;
        this.eventBus = eventBus;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        this.animationId = null;
        
        // Performance tracking
        this.frameCount = 0;
        this.fpsCounter = 0;
        this.lastFPSUpdate = 0;
        this.performanceMetrics = {
            fps: 0,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0
        };

        // Systems (will be injected)
        this.renderSystem = null;
        this.inputManager = null;
        this.audioManager = null;
        this.entityManager = null;
        
        // Game configuration
        this.config = null;
        
        this.setupEventListeners();
    }

    /**
     * Initialize the game engine with all systems
     */
    async initialize() {
        try {
            // Resolve all required systems from service container
            this.renderSystem = this.serviceContainer.resolve('renderSystem');
            this.inputManager = this.serviceContainer.resolve('inputManager');
            this.audioManager = this.serviceContainer.resolve('audioManager');
            this.entityManager = this.serviceContainer.resolve('entityManager');
            this.config = this.serviceContainer.resolve('gameConfig');

            // Initialize all systems
            await this.renderSystem.initialize();
            await this.inputManager.initialize();
            await this.audioManager.initialize();
            await this.entityManager.initialize();

            // Setup canvas and context
            this.setupCanvas();

            this.eventBus.emit('engine:initialized');
            console.log('Game Engine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Game Engine:', error);
            this.eventBus.emit('engine:error', { error, phase: 'initialization' });
            throw error;
        }
    }

    /**
     * Start the game engine
     */
    start() {
        if (this.isRunning) {
            console.warn('Game Engine is already running');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        
        this.eventBus.emit('engine:started');
        this.gameLoop();
        
        console.log('Game Engine started');
    }

    /**
     * Stop the game engine
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.eventBus.emit('engine:stopped');
        console.log('Game Engine stopped');
    }

    /**
     * Pause the game engine
     */
    pause() {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        this.isPaused = true;
        this.eventBus.emit('engine:paused');
        console.log('Game Engine paused');
    }

    /**
     * Resume the game engine
     */
    resume() {
        if (!this.isRunning || !this.isPaused) {
            return;
        }

        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.eventBus.emit('engine:resumed');
        console.log('Game Engine resumed');
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) {
            return;
        }

        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Update performance metrics
        this.updatePerformanceMetrics(currentTime);

        if (!this.isPaused) {
            // Update phase
            const updateStart = performance.now();
            this.update(this.deltaTime);
            this.performanceMetrics.updateTime = performance.now() - updateStart;

            // Render phase
            const renderStart = performance.now();
            this.render(this.deltaTime);
            this.performanceMetrics.renderTime = performance.now() - renderStart;
        }

        // Schedule next frame
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Update all game systems
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(deltaTime) {
        try {
            // Emit update event for systems to hook into
            this.eventBus.emit('engine:beforeUpdate', { deltaTime });

            // Update input first
            this.inputManager.update(deltaTime);

            // Update entities
            this.entityManager.update(deltaTime);

            // Update audio
            this.audioManager.update(deltaTime);

            // Emit after update event
            this.eventBus.emit('engine:afterUpdate', { deltaTime });

        } catch (error) {
            console.error('Error during update phase:', error);
            this.eventBus.emit('engine:error', { error, phase: 'update' });
        }
    }

    /**
     * Render the game
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    render(deltaTime) {
        try {
            // Emit render event
            this.eventBus.emit('engine:beforeRender', { deltaTime });

            // Clear and render
            this.renderSystem.clear();
            this.renderSystem.render(deltaTime);

            // Emit after render event
            this.eventBus.emit('engine:afterRender', { deltaTime });

        } catch (error) {
            console.error('Error during render phase:', error);
            this.eventBus.emit('engine:error', { error, phase: 'render' });
        }
    }

    /**
     * Setup canvas and handle resize
     */
    setupCanvas() {
        const canvas = this.renderSystem.getCanvas();
        
        // Set initial size
        this.resizeCanvas();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }

    /**
     * Resize canvas to window size
     */
    resizeCanvas() {
        const canvas = this.renderSystem.getCanvas();
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.eventBus.emit('engine:canvasResized', {
            width: canvas.width,
            height: canvas.height
        });
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.performanceMetrics.fps = this.frameCount;
            this.performanceMetrics.frameTime = this.deltaTime;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
            
            // Emit performance metrics
            this.eventBus.emit('engine:performanceUpdate', this.performanceMetrics);
        }
    }

    /**
     * Setup event listeners for engine events
     */
    setupEventListeners() {
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Handle window focus/blur
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Get engine state
     * @returns {Object} Engine state
     */
    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            fps: this.performanceMetrics.fps,
            frameTime: this.performanceMetrics.frameTime
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();
        
        // Cleanup systems
        if (this.renderSystem) this.renderSystem.destroy();
        if (this.inputManager) this.inputManager.destroy();
        if (this.audioManager) this.audioManager.destroy();
        if (this.entityManager) this.entityManager.destroy();

        this.eventBus.emit('engine:destroyed');
        console.log('Game Engine destroyed');
    }
}
