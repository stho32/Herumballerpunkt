/**
 * Render System - Handles all rendering operations
 * Responsible for drawing game entities, UI, and effects
 */
export class RenderSystem {
    constructor(gameConfig, eventBus) {
        this.gameConfig = gameConfig;
        this.eventBus = eventBus;
        
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        
        // Rendering state
        this.clearColor = '#000000';
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        
        // Camera system
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            rotation: 0,
            shake: { x: 0, y: 0, intensity: 0, duration: 0 }
        };
        
        // Render layers
        this.layers = new Map([
            ['background', []],
            ['entities', []],
            ['effects', []],
            ['ui', []],
            ['debug', []]
        ]);
        
        // Performance tracking
        this.renderStats = {
            drawCalls: 0,
            entitiesRendered: 0,
            frameTime: 0
        };
        
        this.setupEventListeners();
    }

    /**
     * Initialize the render system
     */
    async initialize() {
        try {
            // Get or create canvas
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.canvas.id = 'gameCanvas';
                document.body.appendChild(this.canvas);
            }

            // Get 2D context
            this.ctx = this.canvas.getContext('2d', {
                alpha: this.gameConfig.get('rendering.enableAlpha', true),
                antialias: this.gameConfig.get('rendering.enableAntialiasing', true),
                preserveDrawingBuffer: this.gameConfig.get('rendering.preserveDrawingBuffer', false)
            });

            if (!this.ctx) {
                throw new Error('Failed to get 2D rendering context');
            }

            // Set initial canvas size
            this.resize(
                this.gameConfig.get('rendering.canvasWidth', window.innerWidth),
                this.gameConfig.get('rendering.canvasHeight', window.innerHeight)
            );

            // Configure rendering settings
            this.clearColor = this.gameConfig.get('rendering.clearColor', '#000000');
            
            this.isInitialized = true;
            this.eventBus.emit('renderSystem:initialized');
            
            console.log('RenderSystem initialized');
            
        } catch (error) {
            console.error('Failed to initialize RenderSystem:', error);
            throw error;
        }
    }

    /**
     * Main render method
     * @param {number} deltaTime - Time since last frame
     */
    render(deltaTime) {
        if (!this.isInitialized) return;

        const startTime = performance.now();
        this.renderStats.drawCalls = 0;
        this.renderStats.entitiesRendered = 0;

        // Update camera shake
        this.updateCameraShake(deltaTime);

        // Save context state
        this.ctx.save();

        // Apply camera transformations
        this.applyCameraTransform();

        // Render all layers in order
        for (const [layerName, renderables] of this.layers) {
            this.renderLayer(layerName, renderables, deltaTime);
        }

        // Restore context state
        this.ctx.restore();

        // Clear render queues
        this.clearRenderQueues();

        // Update performance stats
        this.renderStats.frameTime = performance.now() - startTime;
        
        // Emit render complete event
        this.eventBus.emit('renderSystem:frameComplete', {
            deltaTime,
            stats: this.renderStats
        });
    }

    /**
     * Clear the canvas
     */
    clear() {
        if (!this.isInitialized) return;

        this.ctx.fillStyle = this.clearColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Add a renderable object to a specific layer
     * @param {string} layer - Layer name
     * @param {Object} renderable - Renderable object
     */
    addToLayer(layer, renderable) {
        if (!this.layers.has(layer)) {
            console.warn(`Unknown render layer: ${layer}`);
            return;
        }

        this.layers.get(layer).push(renderable);
    }

    /**
     * Render a specific layer
     * @param {string} layerName - Name of the layer
     * @param {Array} renderables - Array of renderable objects
     * @param {number} deltaTime - Time since last frame
     */
    renderLayer(layerName, renderables, deltaTime) {
        for (const renderable of renderables) {
            try {
                this.renderObject(renderable, deltaTime);
                this.renderStats.entitiesRendered++;
            } catch (error) {
                console.error(`Error rendering object in layer ${layerName}:`, error);
            }
        }
    }

    /**
     * Render a single object
     * @param {Object} renderable - Renderable object
     * @param {number} deltaTime - Time since last frame
     */
    renderObject(renderable, deltaTime) {
        if (!renderable || !renderable.render) {
            return;
        }

        this.ctx.save();
        
        // Apply object transformations if present
        if (renderable.x !== undefined && renderable.y !== undefined) {
            this.ctx.translate(renderable.x, renderable.y);
        }
        
        if (renderable.rotation !== undefined) {
            this.ctx.rotate(renderable.rotation);
        }
        
        if (renderable.scale !== undefined) {
            this.ctx.scale(renderable.scale, renderable.scale);
        }

        // Call the object's render method
        renderable.render(this.ctx, deltaTime);
        
        this.ctx.restore();
        this.renderStats.drawCalls++;
    }

    /**
     * Apply camera transformations
     */
    applyCameraTransform() {
        // Apply camera shake
        const shakeX = this.camera.shake.x;
        const shakeY = this.camera.shake.y;

        // Translate to center, apply transformations, then translate back
        this.ctx.translate(this.viewportWidth / 2 + shakeX, this.viewportHeight / 2 + shakeY);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.rotate(this.camera.rotation);
        this.ctx.translate(-this.camera.x, -this.camera.y);
    }

    /**
     * Update camera shake effect
     * @param {number} deltaTime - Time since last frame
     */
    updateCameraShake(deltaTime) {
        if (this.camera.shake.duration > 0) {
            this.camera.shake.duration -= deltaTime;
            
            const intensity = this.camera.shake.intensity * (this.camera.shake.duration / 1000);
            this.camera.shake.x = (Math.random() - 0.5) * intensity;
            this.camera.shake.y = (Math.random() - 0.5) * intensity;
            
            if (this.camera.shake.duration <= 0) {
                this.camera.shake.x = 0;
                this.camera.shake.y = 0;
                this.camera.shake.intensity = 0;
            }
        }
    }

    /**
     * Set camera position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setCameraPosition(x, y) {
        this.camera.x = x;
        this.camera.y = y;
    }

    /**
     * Set camera zoom
     * @param {number} zoom - Zoom level
     */
    setCameraZoom(zoom) {
        this.camera.zoom = Math.max(0.1, Math.min(5, zoom));
    }

    /**
     * Add camera shake effect
     * @param {number} intensity - Shake intensity
     * @param {number} duration - Shake duration in milliseconds
     */
    addCameraShake(intensity, duration) {
        this.camera.shake.intensity = Math.max(this.camera.shake.intensity, intensity);
        this.camera.shake.duration = Math.max(this.camera.shake.duration, duration);
    }

    /**
     * Resize the canvas
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        if (!this.canvas) return;

        this.canvas.width = width;
        this.canvas.height = height;
        this.viewportWidth = width;
        this.viewportHeight = height;

        // Update canvas style for proper scaling
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.eventBus.emit('renderSystem:resized', { width, height });
    }

    /**
     * Clear all render queues
     */
    clearRenderQueues() {
        for (const renderables of this.layers.values()) {
            renderables.length = 0;
        }
    }

    /**
     * Get the canvas element
     * @returns {HTMLCanvasElement} Canvas element
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Get the rendering context
     * @returns {CanvasRenderingContext2D} 2D rendering context
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Get current render statistics
     * @returns {Object} Render statistics
     */
    getRenderStats() {
        return { ...this.renderStats };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for configuration changes
        this.gameConfig.onChange('rendering.clearColor', (newColor) => {
            this.clearColor = newColor;
        });

        // Listen for window resize
        this.eventBus.subscribe('engine:canvasResized', ({ width, height }) => {
            this.resize(width, height);
        });
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.clearRenderQueues();
        this.isInitialized = false;
        this.eventBus.emit('renderSystem:destroyed');
        console.log('RenderSystem destroyed');
    }
}
