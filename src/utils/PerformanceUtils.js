/**
 * Performance Utilities
 * Tools for monitoring and optimizing game performance
 */
export class PerformanceUtils {
    constructor() {
        this.metrics = new Map();
        this.timers = new Map();
        this.frameHistory = [];
        this.maxFrameHistory = 60;
        this.enabled = true;
    }

    /**
     * Start a performance timer
     * @param {string} name - Timer name
     */
    startTimer(name) {
        if (!this.enabled) return;
        this.timers.set(name, performance.now());
    }

    /**
     * End a performance timer and record the duration
     * @param {string} name - Timer name
     * @returns {number} Duration in milliseconds
     */
    endTimer(name) {
        if (!this.enabled) return 0;
        
        const startTime = this.timers.get(name);
        if (startTime === undefined) {
            console.warn(`Timer '${name}' was not started`);
            return 0;
        }
        
        const duration = performance.now() - startTime;
        this.timers.delete(name);
        
        // Record metric
        this.recordMetric(name, duration);
        
        return duration;
    }

    /**
     * Record a performance metric
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     */
    recordMetric(name, value) {
        if (!this.enabled) return;
        
        if (!this.metrics.has(name)) {
            this.metrics.set(name, {
                values: [],
                total: 0,
                count: 0,
                min: Infinity,
                max: -Infinity,
                average: 0
            });
        }
        
        const metric = this.metrics.get(name);
        metric.values.push(value);
        metric.total += value;
        metric.count++;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        metric.average = metric.total / metric.count;
        
        // Keep only recent values
        if (metric.values.length > this.maxFrameHistory) {
            const removed = metric.values.shift();
            metric.total -= removed;
            metric.count--;
            metric.average = metric.total / metric.count;
        }
    }

    /**
     * Get metric statistics
     * @param {string} name - Metric name
     * @returns {Object|null} Metric statistics
     */
    getMetric(name) {
        const metric = this.metrics.get(name);
        if (!metric) return null;
        
        return {
            current: metric.values[metric.values.length - 1] || 0,
            average: metric.average,
            min: metric.min,
            max: metric.max,
            count: metric.count
        };
    }

    /**
     * Get all metrics
     * @returns {Object} All metrics
     */
    getAllMetrics() {
        const result = {};
        for (const [name, metric] of this.metrics) {
            result[name] = {
                current: metric.values[metric.values.length - 1] || 0,
                average: metric.average,
                min: metric.min,
                max: metric.max,
                count: metric.count
            };
        }
        return result;
    }

    /**
     * Record frame time and calculate FPS
     * @param {number} frameTime - Frame time in milliseconds
     */
    recordFrame(frameTime) {
        if (!this.enabled) return;
        
        this.frameHistory.push({
            time: performance.now(),
            duration: frameTime
        });
        
        // Keep only recent frames
        if (this.frameHistory.length > this.maxFrameHistory) {
            this.frameHistory.shift();
        }
        
        this.recordMetric('frameTime', frameTime);
        this.recordMetric('fps', 1000 / frameTime);
    }

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getCurrentFPS() {
        if (this.frameHistory.length < 2) return 0;
        
        const recent = this.frameHistory.slice(-10);
        const avgFrameTime = recent.reduce((sum, frame) => sum + frame.duration, 0) / recent.length;
        
        return Math.round(1000 / avgFrameTime);
    }

    /**
     * Get average FPS over recent frames
     * @param {number} frameCount - Number of frames to average (default: all)
     * @returns {number} Average FPS
     */
    getAverageFPS(frameCount = this.frameHistory.length) {
        if (this.frameHistory.length === 0) return 0;
        
        const frames = this.frameHistory.slice(-frameCount);
        const avgFrameTime = frames.reduce((sum, frame) => sum + frame.duration, 0) / frames.length;
        
        return Math.round(1000 / avgFrameTime);
    }

    /**
     * Check if performance is below threshold
     * @param {number} fpsThreshold - FPS threshold
     * @returns {boolean} True if performance is low
     */
    isPerformanceLow(fpsThreshold = 30) {
        return this.getCurrentFPS() < fpsThreshold;
    }

    /**
     * Get memory usage information
     * @returns {Object} Memory usage info
     */
    getMemoryUsage() {
        if (!performance.memory) {
            return {
                supported: false,
                used: 0,
                total: 0,
                limit: 0
            };
        }
        
        return {
            supported: true,
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };
    }

    /**
     * Profile a function execution
     * @param {string} name - Profile name
     * @param {Function} fn - Function to profile
     * @returns {*} Function result
     */
    profile(name, fn) {
        if (!this.enabled) return fn();
        
        this.startTimer(name);
        const result = fn();
        this.endTimer(name);
        
        return result;
    }

    /**
     * Profile an async function execution
     * @param {string} name - Profile name
     * @param {Function} fn - Async function to profile
     * @returns {Promise<*>} Function result
     */
    async profileAsync(name, fn) {
        if (!this.enabled) return await fn();
        
        this.startTimer(name);
        const result = await fn();
        this.endTimer(name);
        
        return result;
    }

    /**
     * Create a performance monitor for a specific operation
     * @param {string} name - Monitor name
     * @returns {Object} Monitor object
     */
    createMonitor(name) {
        return {
            start: () => this.startTimer(name),
            end: () => this.endTimer(name),
            record: (value) => this.recordMetric(name, value),
            get: () => this.getMetric(name)
        };
    }

    /**
     * Get performance summary
     * @returns {Object} Performance summary
     */
    getSummary() {
        const memory = this.getMemoryUsage();
        const fps = this.getCurrentFPS();
        const avgFps = this.getAverageFPS();
        
        return {
            fps: {
                current: fps,
                average: avgFps,
                min: this.getMetric('fps')?.min || 0,
                max: this.getMetric('fps')?.max || 0
            },
            frameTime: {
                current: this.getMetric('frameTime')?.current || 0,
                average: this.getMetric('frameTime')?.average || 0,
                min: this.getMetric('frameTime')?.min || 0,
                max: this.getMetric('frameTime')?.max || 0
            },
            memory: memory,
            metrics: this.getAllMetrics()
        };
    }

    /**
     * Export performance data as JSON
     * @returns {string} JSON string
     */
    exportData() {
        return JSON.stringify({
            timestamp: Date.now(),
            summary: this.getSummary(),
            frameHistory: this.frameHistory.slice(-100), // Last 100 frames
            metrics: Object.fromEntries(this.metrics)
        }, null, 2);
    }

    /**
     * Clear all performance data
     */
    clear() {
        this.metrics.clear();
        this.timers.clear();
        this.frameHistory.length = 0;
    }

    /**
     * Enable or disable performance monitoring
     * @param {boolean} enabled - Whether to enable monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.timers.clear();
        }
    }

    /**
     * Set maximum frame history size
     * @param {number} size - Maximum number of frames to keep
     */
    setMaxFrameHistory(size) {
        this.maxFrameHistory = size;
        
        // Trim existing history if needed
        if (this.frameHistory.length > size) {
            this.frameHistory = this.frameHistory.slice(-size);
        }
    }

    /**
     * Get performance recommendations based on current metrics
     * @returns {Array} Array of recommendation strings
     */
    getRecommendations() {
        const recommendations = [];
        const fps = this.getCurrentFPS();
        const memory = this.getMemoryUsage();
        
        if (fps < 30) {
            recommendations.push('Low FPS detected. Consider reducing visual effects or entity count.');
        }
        
        if (fps < 20) {
            recommendations.push('Very low FPS. Enable performance mode or reduce game complexity.');
        }
        
        if (memory.supported && memory.used > memory.limit * 0.8) {
            recommendations.push('High memory usage detected. Consider implementing object pooling.');
        }
        
        const frameTimeMetric = this.getMetric('frameTime');
        if (frameTimeMetric && frameTimeMetric.max > 50) {
            recommendations.push('Frame time spikes detected. Check for expensive operations in game loop.');
        }
        
        const updateTimeMetric = this.getMetric('updateTime');
        if (updateTimeMetric && updateTimeMetric.average > 10) {
            recommendations.push('High update time. Consider optimizing entity updates or using spatial partitioning.');
        }
        
        const renderTimeMetric = this.getMetric('renderTime');
        if (renderTimeMetric && renderTimeMetric.average > 10) {
            recommendations.push('High render time. Consider reducing draw calls or using render batching.');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Performance looks good!');
        }
        
        return recommendations;
    }

    /**
     * Create a performance report
     * @returns {string} Formatted performance report
     */
    createReport() {
        const summary = this.getSummary();
        const recommendations = this.getRecommendations();
        
        let report = '=== Performance Report ===\n\n';
        
        report += `FPS: ${summary.fps.current} (avg: ${summary.fps.average})\n`;
        report += `Frame Time: ${summary.frameTime.current.toFixed(2)}ms (avg: ${summary.frameTime.average.toFixed(2)}ms)\n`;
        
        if (summary.memory.supported) {
            report += `Memory: ${summary.memory.used}MB / ${summary.memory.total}MB (limit: ${summary.memory.limit}MB)\n`;
        }
        
        report += '\n=== Metrics ===\n';
        for (const [name, metric] of Object.entries(summary.metrics)) {
            if (name !== 'fps' && name !== 'frameTime') {
                report += `${name}: ${metric.current.toFixed(2)} (avg: ${metric.average.toFixed(2)})\n`;
            }
        }
        
        report += '\n=== Recommendations ===\n';
        recommendations.forEach((rec, index) => {
            report += `${index + 1}. ${rec}\n`;
        });
        
        return report;
    }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceUtils();
