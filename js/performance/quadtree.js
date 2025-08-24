/**
 * QuadTree implementation for spatial partitioning
 * Optimizes collision detection by reducing O(n²) to O(n log n)
 */
class QuadTree {
    constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
        this.bounds = bounds; // {x, y, width, height}
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        this.objects = [];
        this.nodes = [];
    }

    /**
     * Clear the quadtree
     */
    clear() {
        this.objects = [];
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i]) {
                this.nodes[i].clear();
                this.nodes[i] = null;
            }
        }
        this.nodes = [];
    }

    /**
     * Split the node into 4 subnodes
     */
    split() {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;

        // Top right
        this.nodes[0] = new QuadTree({
            x: x + subWidth,
            y: y,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, this.level + 1);

        // Top left
        this.nodes[1] = new QuadTree({
            x: x,
            y: y,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, this.level + 1);

        // Bottom left
        this.nodes[2] = new QuadTree({
            x: x,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, this.level + 1);

        // Bottom right
        this.nodes[3] = new QuadTree({
            x: x + subWidth,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, this.level + 1);
    }

    /**
     * Determine which node the object belongs to
     */
    getIndex(entity) {
        let index = -1;
        const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
        const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

        // Object can completely fit within the top quadrants
        const topQuadrant = (entity.y - entity.radius < horizontalMidpoint && 
                           entity.y + entity.radius < horizontalMidpoint);
        
        // Object can completely fit within the bottom quadrants
        const bottomQuadrant = (entity.y - entity.radius > horizontalMidpoint);

        // Object can completely fit within the left quadrants
        if (entity.x - entity.radius < verticalMidpoint && 
            entity.x + entity.radius < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            } else if (bottomQuadrant) {
                index = 2;
            }
        }
        // Object can completely fit within the right quadrants
        else if (entity.x - entity.radius > verticalMidpoint) {
            if (topQuadrant) {
                index = 0;
            } else if (bottomQuadrant) {
                index = 3;
            }
        }

        return index;
    }

    /**
     * Insert the object into the quadtree
     */
    insert(entity) {
        if (this.nodes.length > 0) {
            const index = this.getIndex(entity);
            if (index !== -1) {
                this.nodes[index].insert(entity);
                return;
            }
        }

        this.objects.push(entity);

        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes.length === 0) {
                this.split();
            }

            let i = 0;
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i]);
                if (index !== -1) {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0]);
                } else {
                    i++;
                }
            }
        }
    }

    /**
     * Return all objects that could collide with the given object
     */
    retrieve(entity) {
        const returnObjects = [];
        const index = this.getIndex(entity);
        
        if (this.nodes.length > 0) {
            if (index !== -1) {
                returnObjects.push(...this.nodes[index].retrieve(entity));
            } else {
                // Object spans multiple quadrants, check all
                for (let i = 0; i < this.nodes.length; i++) {
                    returnObjects.push(...this.nodes[i].retrieve(entity));
                }
            }
        }

        returnObjects.push(...this.objects);
        return returnObjects;
    }

    /**
     * Get all objects in the quadtree
     */
    getAllObjects() {
        let allObjects = [...this.objects];
        
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i]) {
                allObjects.push(...this.nodes[i].getAllObjects());
            }
        }
        
        return allObjects;
    }

    /**
     * Get statistics about the quadtree
     */
    getStats() {
        let stats = {
            totalNodes: 1,
            totalObjects: this.objects.length,
            maxDepth: this.level,
            leafNodes: this.nodes.length === 0 ? 1 : 0
        };

        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i]) {
                const nodeStats = this.nodes[i].getStats();
                stats.totalNodes += nodeStats.totalNodes;
                stats.totalObjects += nodeStats.totalObjects;
                stats.maxDepth = Math.max(stats.maxDepth, nodeStats.maxDepth);
                stats.leafNodes += nodeStats.leafNodes;
            }
        }

        return stats;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuadTree;
}
