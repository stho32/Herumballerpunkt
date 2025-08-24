/**
 * Service Container for Dependency Injection
 * Manages service registration, resolution, and lifecycle
 */
export class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.instances = new Map();
        this.config = {};
    }

    /**
     * Register a service with the container
     * @param {string} name - Service name
     * @param {Function|Object} factory - Factory function or class constructor
     * @param {boolean} singleton - Whether to create singleton instance
     * @param {Array} dependencies - Array of dependency names
     */
    register(name, factory, singleton = true, dependencies = []) {
        this.services.set(name, {
            factory,
            singleton,
            dependencies,
            instance: null
        });
    }

    /**
     * Resolve a service by name
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    resolve(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service '${name}' not found`);
        }

        // Return existing singleton instance
        if (service.singleton && service.instance) {
            return service.instance;
        }

        // Resolve dependencies
        const dependencies = service.dependencies.map(dep => this.resolve(dep));

        // Create instance
        let instance;
        if (typeof service.factory === 'function') {
            // Check if it's a class constructor or factory function
            if (service.factory.prototype && service.factory.prototype.constructor === service.factory) {
                instance = new service.factory(...dependencies);
            } else {
                instance = service.factory(...dependencies);
            }
        } else {
            instance = service.factory;
        }

        // Store singleton instance
        if (service.singleton) {
            service.instance = instance;
        }

        return instance;
    }

    /**
     * Inject dependencies into a target object
     * @param {Object} target - Target object
     * @param {Object} injections - Map of property names to service names
     */
    inject(target, injections) {
        for (const [property, serviceName] of Object.entries(injections)) {
            target[property] = this.resolve(serviceName);
        }
    }

    /**
     * Configure the container with settings
     * @param {Object} config - Configuration object
     */
    configure(config) {
        this.config = { ...this.config, ...config };
    }

    /**
     * Check if a service is registered
     * @param {string} name - Service name
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Get all registered service names
     * @returns {Array<string>}
     */
    getServiceNames() {
        return Array.from(this.services.keys());
    }

    /**
     * Clear all services and instances
     */
    clear() {
        this.services.clear();
        this.instances.clear();
        this.config = {};
    }

    /**
     * Create a child container that inherits from this one
     * @returns {ServiceContainer}
     */
    createChild() {
        const child = new ServiceContainer();
        child.parent = this;
        return child;
    }

    /**
     * Resolve from parent container if not found locally
     * @param {string} name - Service name
     * @returns {*} Service instance
     * @private
     */
    _resolveFromParent(name) {
        if (this.parent && this.parent.has(name)) {
            return this.parent.resolve(name);
        }
        return null;
    }
}
