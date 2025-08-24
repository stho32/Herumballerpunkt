/**
 * Performance Manager for monitoring and optimizing game performance
 */
class PerformanceManager {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.frameTime = 0;
        this.fps = 60;
        this.averageFPS = 60;
        this.frameHistory = [];
        this.maxFrameHistory = 60; // Keep last 60 frames
        
        // Performance thresholds
        this.targetFPS = 60;
        this.warningFPS = 45;
        this.criticalFPS = 30;
        
        // Quality settings
        this.qualityLevel = 'high'; // high, medium, low
        this.autoAdjustQuality = true;
        
        // Entity counting
        this.entityCounts = {
            bullets: 0,
            enemies: 0,
            allies: 0,
            particles: 0,
            effects: 0,
            total: 0
        };
        
        // Performance warnings
        this.warnings = [];
        this.lastWarningTime = 0;
        this.warningCooldown = 5000; // 5 seconds
        
        // Update frequency tracking
        this.updateFrequencies = {
            critical: 60,    // Player, bullets
            standard: 30,    // Enemies, allies
            background: 10   // Factories, walls
        };
        
        this.frameCounters = {
            critical: 0,
            standard: 0,
            background: 0
        };
    }

    /**
     * Start frame timing
     */
    startFrame() {
        this.frameStartTime = performance.now();
    }

    /**
     * End frame timing and calculate FPS
     */
    endFrame() {
        const currentTime = performance.now();
        this.frameTime = currentTime - this.frameStartTime;
        
        // Calculate FPS
        const deltaTime = currentTime - this.lastTime;
        this.fps = 1000 / deltaTime;
        this.lastTime = currentTime;
        
        // Update frame history
        this.frameHistory.push(this.fps);
        if (this.frameHistory.length > this.maxFrameHistory) {
            this.frameHistory.shift();
        }
        
        // Calculate average FPS
        this.averageFPS = this.frameHistory.reduce((sum, fps) => sum + fps, 0) / this.frameHistory.length;
        
        this.frameCount++;
        
        // Update frame counters for different update frequencies
        this.updateFrameCounters();
        
        // Check for performance issues
        this.checkPerformance();
        
        // Auto-adjust quality if enabled
        if (this.autoAdjustQuality) {
            this.adjustQuality();
        }
    }

    /**
     * Update frame counters for different update frequencies
     */
    updateFrameCounters() {
        this.frameCounters.critical++;
        this.frameCounters.standard++;
        this.frameCounters.background++;
        
        // Reset counters based on target frequencies
        if (this.frameCounters.critical >= 60 / this.updateFrequencies.critical) {
            this.frameCounters.critical = 0;
        }
        if (this.frameCounters.standard >= 60 / this.updateFrequencies.standard) {
            this.frameCounters.standard = 0;
        }
        if (this.frameCounters.background >= 60 / this.updateFrequencies.background) {
            this.frameCounters.background = 0;
        }
    }

    /**
     * Check if entity type should update this frame
     */
    shouldUpdate(entityType) {
        switch (entityType) {
            case 'critical':
                return this.frameCounters.critical === 0;
            case 'standard':
                return this.frameCounters.standard === 0;
            case 'background':
                return this.frameCounters.background === 0;
            default:
                return true;
        }
    }

    /**
     * Update entity counts
     */
    updateEntityCounts(counts) {
        this.entityCounts = { ...counts };
        this.entityCounts.total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Get current FPS
     */
    getFPS() {
        return Math.round(this.fps);
    }

    /**
     * Get average FPS
     */
    getAverageFPS() {
        return Math.round(this.averageFPS);
    }

    /**
     * Get frame time in milliseconds
     */
    getFrameTime() {
        return Math.round(this.frameTime * 100) / 100;
    }

    /**
     * Get entity count by type
     */
    getEntityCount(type = 'total') {
        return this.entityCounts[type] || 0;
    }

    /**
     * Check for performance issues
     */
    checkPerformance() {
        const currentTime = performance.now();
        
        // Skip if in warning cooldown
        if (currentTime - this.lastWarningTime < this.warningCooldown) {
            return;
        }
        
        // Check for low FPS
        if (this.averageFPS < this.criticalFPS) {
            this.addWarning('Critical FPS detected', 'critical');
        } else if (this.averageFPS < this.warningFPS) {
            this.addWarning('Low FPS detected', 'warning');
        }
        
        // Check for high entity count
        if (this.entityCounts.total > 500) {
            this.addWarning('High entity count', 'warning');
        }
        
        // Check for long frame times
        if (this.frameTime > 20) { // > 20ms = < 50 FPS
            this.addWarning('Long frame time detected', 'warning');
        }
    }

    /**
     * Add a performance warning
     */
    addWarning(message, severity = 'info') {
        const warning = {
            message,
            severity,
            timestamp: performance.now(),
            fps: this.averageFPS,
            entityCount: this.entityCounts.total
        };
        
        this.warnings.push(warning);
        this.lastWarningTime = warning.timestamp;
        
        // Keep only last 10 warnings
        if (this.warnings.length > 10) {
            this.warnings.shift();
        }
        
        // Log to console in development
        if (typeof console !== 'undefined') {
            console.warn(`Performance Warning: ${message}`, warning);
        }
    }

    /**
     * Automatically adjust quality based on performance
     */
    adjustQuality() {
        const currentQuality = this.qualityLevel;
        
        if (this.averageFPS < this.criticalFPS && this.qualityLevel !== 'low') {
            this.setQualityLevel('low');
        } else if (this.averageFPS < this.warningFPS && this.qualityLevel === 'high') {
            this.setQualityLevel('medium');
        } else if (this.averageFPS > this.targetFPS && this.qualityLevel !== 'high') {
            // Only upgrade quality if performance has been good for a while
            if (this.frameHistory.length >= 30 && 
                this.frameHistory.slice(-30).every(fps => fps > this.targetFPS)) {
                if (this.qualityLevel === 'low') {
                    this.setQualityLevel('medium');
                } else if (this.qualityLevel === 'medium') {
                    this.setQualityLevel('high');
                }
            }
        }
    }

    /**
     * Set quality level
     */
    setQualityLevel(level) {
        const oldLevel = this.qualityLevel;
        this.qualityLevel = level;
        
        // Adjust update frequencies based on quality
        switch (level) {
            case 'low':
                this.updateFrequencies.critical = 60;
                this.updateFrequencies.standard = 20;
                this.updateFrequencies.background = 5;
                break;
            case 'medium':
                this.updateFrequencies.critical = 60;
                this.updateFrequencies.standard = 30;
                this.updateFrequencies.background = 10;
                break;
            case 'high':
                this.updateFrequencies.critical = 60;
                this.updateFrequencies.standard = 45;
                this.updateFrequencies.background = 15;
                break;
        }
        
        if (oldLevel !== level) {
            this.addWarning(`Quality adjusted from ${oldLevel} to ${level}`, 'info');
        }
    }

    /**
     * Get performance statistics
     */
    getStats() {
        return {
            fps: this.getFPS(),
            averageFPS: this.getAverageFPS(),
            frameTime: this.getFrameTime(),
            qualityLevel: this.qualityLevel,
            entityCounts: { ...this.entityCounts },
            updateFrequencies: { ...this.updateFrequencies },
            warnings: this.warnings.length,
            lastWarning: this.warnings[this.warnings.length - 1] || null
        };
    }

    /**
     * Get detailed performance report
     */
    getDetailedReport() {
        return {
            ...this.getStats(),
            frameHistory: [...this.frameHistory],
            allWarnings: [...this.warnings],
            frameCount: this.frameCount,
            autoAdjustQuality: this.autoAdjustQuality
        };
    }

    /**
     * Reset performance tracking
     */
    reset() {
        this.frameCount = 0;
        this.frameHistory = [];
        this.warnings = [];
        this.lastWarningTime = 0;
        this.frameCounters = { critical: 0, standard: 0, background: 0 };
    }

    /**
     * Enable/disable auto quality adjustment
     */
    setAutoAdjustQuality(enabled) {
        this.autoAdjustQuality = enabled;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
}
