/**
 * Event Bus System for decoupled communication between modules
 * Implements publish-subscribe pattern for loose coupling
 */
export class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.maxListeners = 100;
        this.debug = false;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     * @param {Object} context - Optional context for handler
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, handler, context = null) {
        if (typeof handler !== 'function') {
            throw new Error('Event handler must be a function');
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const listeners = this.listeners.get(event);
        
        // Check max listeners limit
        if (listeners.length >= this.maxListeners) {
            console.warn(`Maximum listeners (${this.maxListeners}) reached for event '${event}'`);
        }

        const listenerObj = { handler, context };
        listeners.push(listenerObj);

        if (this.debug) {
            console.log(`Subscribed to event '${event}', total listeners: ${listeners.length}`);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(event, handler);
    }

    /**
     * Subscribe to an event that will only fire once
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     * @param {Object} context - Optional context for handler
     * @returns {Function} Unsubscribe function
     */
    once(event, handler, context = null) {
        if (typeof handler !== 'function') {
            throw new Error('Event handler must be a function');
        }

        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }

        const onceListeners = this.onceListeners.get(event);
        const listenerObj = { handler, context };
        onceListeners.push(listenerObj);

        if (this.debug) {
            console.log(`Subscribed once to event '${event}'`);
        }

        // Return unsubscribe function
        return () => {
            const index = onceListeners.indexOf(listenerObj);
            if (index > -1) {
                onceListeners.splice(index, 1);
            }
        };
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function to remove
     */
    unsubscribe(event, handler) {
        // Remove from regular listeners
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const index = listeners.findIndex(l => l.handler === handler);
            if (index > -1) {
                listeners.splice(index, 1);
                if (this.debug) {
                    console.log(`Unsubscribed from event '${event}', remaining listeners: ${listeners.length}`);
                }
                
                // Clean up empty listener arrays
                if (listeners.length === 0) {
                    this.listeners.delete(event);
                }
            }
        }

        // Remove from once listeners
        if (this.onceListeners.has(event)) {
            const onceListeners = this.onceListeners.get(event);
            const index = onceListeners.findIndex(l => l.handler === handler);
            if (index > -1) {
                onceListeners.splice(index, 1);
                
                // Clean up empty listener arrays
                if (onceListeners.length === 0) {
                    this.onceListeners.delete(event);
                }
            }
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {*} data - Event data
     * @returns {boolean} True if event had listeners
     */
    emit(event, data = null) {
        let hasListeners = false;

        if (this.debug) {
            console.log(`Emitting event '${event}' with data:`, data);
        }

        // Handle regular listeners
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            hasListeners = listeners.length > 0;

            // Create a copy to avoid issues if listeners are modified during emission
            const listenersCopy = [...listeners];
            
            for (const { handler, context } of listenersCopy) {
                try {
                    if (context) {
                        handler.call(context, data, event);
                    } else {
                        handler(data, event);
                    }
                } catch (error) {
                    console.error(`Error in event handler for '${event}':`, error);
                }
            }
        }

        // Handle once listeners
        if (this.onceListeners.has(event)) {
            const onceListeners = this.onceListeners.get(event);
            hasListeners = hasListeners || onceListeners.length > 0;

            // Create a copy and clear the original array
            const onceListenersCopy = [...onceListeners];
            this.onceListeners.delete(event);

            for (const { handler, context } of onceListenersCopy) {
                try {
                    if (context) {
                        handler.call(context, data, event);
                    } else {
                        handler(data, event);
                    }
                } catch (error) {
                    console.error(`Error in once event handler for '${event}':`, error);
                }
            }
        }

        return hasListeners;
    }

    /**
     * Remove all listeners for a specific event
     * @param {string} event - Event name
     */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
            this.onceListeners.delete(event);
            if (this.debug) {
                console.log(`Removed all listeners for event '${event}'`);
            }
        } else {
            // Remove all listeners for all events
            this.listeners.clear();
            this.onceListeners.clear();
            if (this.debug) {
                console.log('Removed all event listeners');
            }
        }
    }

    /**
     * Get the number of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        const regularCount = this.listeners.has(event) ? this.listeners.get(event).length : 0;
        const onceCount = this.onceListeners.has(event) ? this.onceListeners.get(event).length : 0;
        return regularCount + onceCount;
    }

    /**
     * Get all event names that have listeners
     * @returns {Array<string>} Array of event names
     */
    eventNames() {
        const regularEvents = Array.from(this.listeners.keys());
        const onceEvents = Array.from(this.onceListeners.keys());
        return [...new Set([...regularEvents, ...onceEvents])];
    }

    /**
     * Enable or disable debug logging
     * @param {boolean} enabled - Whether to enable debug logging
     */
    setDebug(enabled) {
        this.debug = enabled;
    }

    /**
     * Set maximum number of listeners per event
     * @param {number} max - Maximum number of listeners
     */
    setMaxListeners(max) {
        this.maxListeners = max;
    }
}
