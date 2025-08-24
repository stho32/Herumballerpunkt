// Advanced Bunker System for Herumballerpunkt
// Modular base building with central command center and expandable modules

// Bunker Module Configuration
const BUNKER_MODULE_CONFIGS = {
    COMMAND_CENTER: {
        name: 'Command Center',
        cost: 0, // Free starting structure
        health: 500,
        maxHealth: 500,
        size: { width: 80, height: 80 },
        color: '#004488',
        glowColor: '#0066cc',
        isCore: true,
        provides: ['command', 'basic_defense'],
        powerGeneration: 100,
        description: 'Central command hub - heart of your base'
    },
    POWER_GENERATOR: {
        name: 'Power Generator',
        cost: 200,
        health: 150,
        maxHealth: 150,
        size: { width: 50, height: 50 },
        color: '#ffaa00',
        glowColor: '#ffcc44',
        provides: ['power'],
        powerGeneration: 50,
        description: 'Generates power for advanced modules'
    },
    BARRACKS: {
        name: 'Barracks',
        cost: 300,
        health: 200,
        maxHealth: 200,
        size: { width: 60, height: 40 },
        color: '#448800',
        glowColor: '#66aa22',
        provides: ['units'],
        powerConsumption: 20,
        unitSpawnRate: 30000, // 30 seconds
        description: 'Spawns allied soldiers to defend the base'
    },
    RESEARCH_LAB: {
        name: 'Research Lab',
        cost: 400,
        health: 120,
        maxHealth: 120,
        size: { width: 55, height: 55 },
        color: '#8800aa',
        glowColor: '#aa44cc',
        provides: ['research'],
        powerConsumption: 30,
        description: 'Unlocks advanced technologies and upgrades'
    },
    SHIELD_ARRAY: {
        name: 'Shield Array',
        cost: 500,
        health: 180,
        maxHealth: 180,
        size: { width: 45, height: 45 },
        color: '#0088aa',
        glowColor: '#44aacc',
        provides: ['shield'],
        powerConsumption: 40,
        shieldRadius: 150,
        shieldStrength: 200,
        description: 'Projects protective energy shields'
    },
    WEAPON_FACTORY: {
        name: 'Weapon Factory',
        cost: 350,
        health: 160,
        maxHealth: 160,
        size: { width: 65, height: 45 },
        color: '#aa4400',
        glowColor: '#cc6622',
        provides: ['weapons'],
        powerConsumption: 25,
        description: 'Produces advanced weapons and ammunition'
    },
    SENSOR_ARRAY: {
        name: 'Sensor Array',
        cost: 250,
        health: 100,
        maxHealth: 100,
        size: { width: 40, height: 60 },
        color: '#00aa88',
        glowColor: '#22cc99',
        provides: ['sensors'],
        powerConsumption: 15,
        detectionRadius: 300,
        description: 'Advanced enemy detection and early warning'
    }
};

// Bunker Connection Types
const CONNECTION_TYPES = {
    POWER_LINE: { color: '#ffff00', width: 3, pattern: [5, 5] },
    DATA_LINK: { color: '#00ffff', width: 2, pattern: [3, 3] },
    SUPPLY_LINE: { color: '#ff8800', width: 4, pattern: [8, 4] }
};

class BunkerModule {
    constructor(type, x, y) {
        this.type = type;
        this.config = BUNKER_MODULE_CONFIGS[type];
        this.x = x;
        this.y = y;
        this.health = this.config.health;
        this.maxHealth = this.config.maxHealth;
        this.level = 1;
        this.maxLevel = 3;
        this.isActive = true;
        this.powerLevel = 0;
        this.connections = new Set();
        this.lastActivity = 0;
        
        // Visual effects
        this.pulseTimer = 0;
        this.glowIntensity = 0.5;
        this.constructionProgress = 0;
        this.isConstructing = true;
        this.constructionTime = 3000; // 3 seconds build time
        this.constructionStart = Date.now();
        
        console.log(`Building ${this.config.name} at (${x}, ${y})`);
    }
    
    update() {
        this.pulseTimer += 0.05;
        
        // Handle construction
        if (this.isConstructing) {
            const elapsed = Date.now() - this.constructionStart;
            this.constructionProgress = Math.min(1, elapsed / this.constructionTime);
            
            if (this.constructionProgress >= 1) {
                this.isConstructing = false;
                this.isActive = true;
                createParticles(this.x, this.y, this.config.glowColor, 20);
                playSound('build', 0.6);
            }
            return;
        }
        
        // Module-specific updates
        this.updateModuleSpecific();
        
        // Update glow based on activity
        this.glowIntensity = this.isActive ? 0.5 + Math.sin(this.pulseTimer) * 0.3 : 0.2;
    }
    
    updateModuleSpecific() {
        const now = Date.now();
        
        switch(this.type) {
            case 'BARRACKS':
                if (this.powerLevel >= this.config.powerConsumption && 
                    now - this.lastActivity >= this.config.unitSpawnRate) {
                    this.spawnUnit();
                    this.lastActivity = now;
                }
                break;
                
            case 'SHIELD_ARRAY':
                if (this.powerLevel >= this.config.powerConsumption) {
                    this.updateShieldProjection();
                }
                break;
                
            case 'SENSOR_ARRAY':
                if (this.powerLevel >= this.config.powerConsumption) {
                    this.updateSensorSweep();
                }
                break;
        }
    }
    
    spawnUnit() {
        if (typeof gameManager !== 'undefined' && gameManager) {
            // Spawn allied unit near barracks
            const spawnX = this.x + (Math.random() - 0.5) * 100;
            const spawnY = this.y + (Math.random() - 0.5) * 100;
            
            // Create ally (simplified - would need proper Ally class integration)
            console.log(`Barracks spawning ally at (${spawnX}, ${spawnY})`);
            createParticles(spawnX, spawnY, '#44ff44', 15);
            playSound('spawn', 0.4);
        }
    }
    
    updateShieldProjection() {
        // Project shield effects (visual only for now)
        if (Math.random() < 0.1) { // 10% chance per frame
            createParticles(
                this.x + (Math.random() - 0.5) * this.config.shieldRadius,
                this.y + (Math.random() - 0.5) * this.config.shieldRadius,
                this.config.glowColor, 3
            );
        }
    }
    
    updateSensorSweep() {
        // Sensor sweep effects
        if (Math.random() < 0.05) { // 5% chance per frame
            createParticles(this.x, this.y, '#00ffff', 5);
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        createParticles(this.x, this.y, '#ff4444', 10);
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        this.isActive = false;
        createParticles(this.x, this.y, '#ff4444', 30);
        playSound('structure_destroyed', 0.7);
        console.log(`${this.config.name} destroyed!`);
    }
    
    upgrade() {
        if (this.level >= this.maxLevel) return false;
        
        const upgradeCost = this.getUpgradeCost();
        if (!upgradeCost) return false;
        
        this.level++;
        this.maxHealth += 50;
        this.health = this.maxHealth;
        
        // Improve module capabilities
        if (this.config.powerGeneration) {
            this.config.powerGeneration += 25;
        }
        if (this.config.shieldStrength) {
            this.config.shieldStrength += 50;
        }
        
        createParticles(this.x, this.y, '#00ff00', 25);
        playSound('upgrade', 0.5);
        
        return true;
    }
    
    getUpgradeCost() {
        if (this.level >= this.maxLevel) return null;
        return Math.floor(this.config.cost * 0.5 * this.level);
    }
    
    render(ctx) {
        ctx.save();
        
        // Construction animation
        if (this.isConstructing) {
            this.renderConstruction(ctx);
            ctx.restore();
            return;
        }
        
        // Module base
        ctx.translate(this.x, this.y);
        
        // Glow effect
        if (this.isActive) {
            ctx.shadowColor = this.config.glowColor;
            ctx.shadowBlur = 15 * this.glowIntensity;
        }
        
        // Main structure
        ctx.fillStyle = this.config.color;
        ctx.strokeStyle = this.config.glowColor;
        ctx.lineWidth = 2 + this.level;
        
        ctx.fillRect(-this.config.size.width/2, -this.config.size.height/2, 
                    this.config.size.width, this.config.size.height);
        ctx.strokeRect(-this.config.size.width/2, -this.config.size.height/2, 
                      this.config.size.width, this.config.size.height);
        
        // Module-specific details
        this.renderModuleDetails(ctx);
        
        // Level indicators
        for (let i = 0; i < this.level; i++) {
            const angle = (i / this.maxLevel) * Math.PI * 2;
            const radius = Math.max(this.config.size.width, this.config.size.height) / 2 + 10;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Health bar
        if (this.health < this.maxHealth) {
            this.renderHealthBar(ctx);
        }
    }
    
    renderConstruction(ctx) {
        const progress = this.constructionProgress;
        const size = this.config.size;
        
        // Construction frame
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.x - size.width/2, this.y - size.height/2, size.width, size.height);
        ctx.setLineDash([]);
        
        // Progress fill
        ctx.fillStyle = this.config.color + '60'; // Semi-transparent
        const progressHeight = size.height * progress;
        ctx.fillRect(this.x - size.width/2, this.y + size.height/2 - progressHeight, 
                    size.width, progressHeight);
        
        // Construction particles
        if (Math.random() < 0.3) {
            createParticles(this.x + (Math.random() - 0.5) * size.width,
                          this.y + (Math.random() - 0.5) * size.height,
                          '#ffaa00', 2);
        }
    }
    
    renderModuleDetails(ctx) {
        switch(this.type) {
            case 'COMMAND_CENTER':
                // Command center antenna
                ctx.strokeStyle = this.config.glowColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, -this.config.size.height/2);
                ctx.lineTo(0, -this.config.size.height/2 - 20);
                ctx.stroke();
                break;
                
            case 'POWER_GENERATOR':
                // Power core
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'SHIELD_ARRAY':
                // Shield projectors
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    const x = Math.cos(angle) * 15;
                    const y = Math.sin(angle) * 15;
                    
                    ctx.fillStyle = this.config.glowColor;
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }
    
    renderHealthBar(ctx) {
        const barWidth = Math.max(this.config.size.width, 50);
        const barHeight = 6;
        const healthPercent = this.health / this.maxHealth;
        const barY = this.y - this.config.size.height/2 - 15;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
    }
}

// Bunker Connection Class
class BunkerConnection {
    constructor(moduleA, moduleB, type = 'POWER_LINE') {
        this.moduleA = moduleA;
        this.moduleB = moduleB;
        this.type = type;
        this.config = CONNECTION_TYPES[type];
        this.isActive = true;
        this.flowDirection = 1; // 1 = A to B, -1 = B to A
        this.flowSpeed = 0.05;
        this.flowOffset = 0;

        // Add connection to both modules
        moduleA.connections.add(this);
        moduleB.connections.add(this);
    }

    update() {
        this.flowOffset += this.flowSpeed * this.flowDirection;
        if (this.flowOffset > 1) this.flowOffset = 0;
        if (this.flowOffset < 0) this.flowOffset = 1;

        // Check if both modules are active
        this.isActive = this.moduleA.isActive && this.moduleB.isActive;
    }

    render(ctx) {
        if (!this.isActive) return;

        ctx.save();
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = this.config.width;
        ctx.setLineDash(this.config.pattern);
        ctx.lineDashOffset = this.flowOffset * 20; // Animated flow

        ctx.beginPath();
        ctx.moveTo(this.moduleA.x, this.moduleA.y);
        ctx.lineTo(this.moduleB.x, this.moduleB.y);
        ctx.stroke();

        ctx.restore();
    }
}

// Advanced Bunker Manager
class BunkerManager {
    constructor(economyManager) {
        this.economyManager = economyManager;
        this.modules = [];
        this.connections = [];
        this.commandCenter = null;
        this.totalPower = 0;
        this.powerConsumption = 0;
        this.buildMode = false;
        this.selectedModuleType = null;
        this.selectedModule = null;
        this.previewPosition = { x: 0, y: 0 };
        this.minDistance = 80;
        this.maxConnectionDistance = 200;

        // Initialize with command center
        this.initializeBase();
    }

    initializeBase() {
        // Place command center at center of map
        const centerX = 800; // Assuming 1600px wide canvas
        const centerY = 400; // Assuming 800px tall canvas

        this.commandCenter = new BunkerModule('COMMAND_CENTER', centerX, centerY);
        this.commandCenter.isConstructing = false; // Start ready
        this.commandCenter.isActive = true;
        this.modules.push(this.commandCenter);

        console.log('Bunker base initialized with Command Center');
    }

    update() {
        // Update all modules
        this.modules.forEach(module => module.update());

        // Update connections
        this.connections.forEach(connection => connection.update());

        // Calculate power grid
        this.updatePowerGrid();

        // Remove destroyed modules
        this.modules = this.modules.filter(module => {
            if (module.health <= 0 && module !== this.commandCenter) {
                this.removeModuleConnections(module);
                return false;
            }
            return true;
        });
    }

    updatePowerGrid() {
        // Calculate total power generation and consumption
        this.totalPower = 0;
        this.powerConsumption = 0;

        this.modules.forEach(module => {
            if (module.isActive && !module.isConstructing) {
                if (module.config.powerGeneration) {
                    this.totalPower += module.config.powerGeneration;
                }
                if (module.config.powerConsumption) {
                    this.powerConsumption += module.config.powerConsumption;
                }
            }
        });

        // Distribute power to modules
        const powerAvailable = this.totalPower >= this.powerConsumption;
        this.modules.forEach(module => {
            if (module.config.powerConsumption) {
                module.powerLevel = powerAvailable ? module.config.powerConsumption : 0;
            } else {
                module.powerLevel = this.totalPower; // Generators always have power
            }
        });
    }

    enterBuildMode(moduleType) {
        this.buildMode = true;
        this.selectedModuleType = moduleType;
        console.log(`Entered build mode for ${moduleType}`);
    }

    exitBuildMode() {
        this.buildMode = false;
        this.selectedModuleType = null;
        this.selectedModule = null;
    }

    updatePreview(mouseX, mouseY) {
        if (!this.buildMode) return;

        this.previewPosition.x = mouseX;
        this.previewPosition.y = mouseY;
    }

    canBuildAt(x, y) {
        // Check minimum distance from other modules
        const tooClose = this.modules.some(module => {
            const distance = getDistance(x, y, module.x, module.y);
            return distance < this.minDistance;
        });

        if (tooClose) return false;

        // Check if within connection range of existing modules
        const inRange = this.modules.some(module => {
            const distance = getDistance(x, y, module.x, module.y);
            return distance <= this.maxConnectionDistance;
        });

        return inRange;
    }

    buildModule(x, y, moduleType) {
        if (!moduleType) moduleType = this.selectedModuleType;
        if (!moduleType) return false;

        const config = BUNKER_MODULE_CONFIGS[moduleType];
        if (!config) return false;

        // Check if can afford
        if (!this.economyManager.canAfford(config.cost)) {
            console.log(`Cannot afford ${config.name} (costs $${config.cost})`);
            return false;
        }

        // Check if can build at location
        if (!this.canBuildAt(x, y)) {
            console.log(`Cannot build at (${x}, ${y}) - invalid location`);
            return false;
        }

        // Build the module
        if (this.economyManager.spendMoney(config.cost, config.name)) {
            const module = new BunkerModule(moduleType, x, y);
            this.modules.push(module);

            // Auto-connect to nearest module
            this.autoConnectModule(module);

            createParticles(x, y, '#00ff00', 25);
            playSound('build', 0.6);

            this.exitBuildMode();
            return true;
        }

        return false;
    }

    autoConnectModule(newModule) {
        // Find nearest module within connection range
        let nearestModule = null;
        let nearestDistance = Infinity;

        this.modules.forEach(module => {
            if (module === newModule) return;

            const distance = getDistance(newModule.x, newModule.y, module.x, module.y);
            if (distance <= this.maxConnectionDistance && distance < nearestDistance) {
                nearestDistance = distance;
                nearestModule = module;
            }
        });

        if (nearestModule) {
            const connection = new BunkerConnection(newModule, nearestModule, 'POWER_LINE');
            this.connections.push(connection);
            console.log(`Connected ${newModule.config.name} to ${nearestModule.config.name}`);
        }
    }

    removeModuleConnections(module) {
        this.connections = this.connections.filter(connection => {
            if (connection.moduleA === module || connection.moduleB === module) {
                // Remove connection from remaining module
                if (connection.moduleA !== module) {
                    connection.moduleA.connections.delete(connection);
                }
                if (connection.moduleB !== module) {
                    connection.moduleB.connections.delete(connection);
                }
                return false;
            }
            return true;
        });
    }

    selectModule(x, y) {
        const module = this.modules.find(m => {
            const distance = getDistance(x, y, m.x, m.y);
            const maxSize = Math.max(m.config.size.width, m.config.size.height);
            return distance <= maxSize / 2;
        });

        if (module) {
            this.selectedModule = module;
            return module;
        }

        return null;
    }

    upgradeSelectedModule() {
        if (!this.selectedModule) return false;

        const upgradeCost = this.selectedModule.getUpgradeCost();
        if (!upgradeCost) {
            console.log('Module is already at max level');
            return false;
        }

        if (!this.economyManager.canAfford(upgradeCost)) {
            console.log(`Cannot afford upgrade (costs $${upgradeCost})`);
            return false;
        }

        if (this.economyManager.spendMoney(upgradeCost, `${this.selectedModule.config.name} Upgrade`)) {
            return this.selectedModule.upgrade();
        }

        return false;
    }

    render(ctx) {
        // Render connections first (behind modules)
        this.connections.forEach(connection => connection.render(ctx));

        // Render all modules
        this.modules.forEach(module => module.render(ctx));

        // Render build preview
        if (this.buildMode && this.selectedModuleType) {
            this.renderBuildPreview(ctx);
        }

        // Render selection UI
        if (this.selectedModule) {
            this.renderSelectionUI(ctx);
        }
    }

    renderBuildPreview(ctx) {
        const config = BUNKER_MODULE_CONFIGS[this.selectedModuleType];
        const canBuild = this.canBuildAt(this.previewPosition.x, this.previewPosition.y);

        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.translate(this.previewPosition.x, this.previewPosition.y);

        // Preview module
        ctx.fillStyle = canBuild ? config.color + '80' : '#ff000080';
        ctx.strokeStyle = canBuild ? config.glowColor : '#ff0000';
        ctx.lineWidth = 2;
        ctx.fillRect(-config.size.width/2, -config.size.height/2,
                    config.size.width, config.size.height);
        ctx.strokeRect(-config.size.width/2, -config.size.height/2,
                      config.size.width, config.size.height);

        ctx.restore();

        // Cost display
        ctx.fillStyle = this.economyManager.canAfford(config.cost) ? '#ffffff' : '#ff0000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${config.name} - $${config.cost}`,
                    this.previewPosition.x, this.previewPosition.y - config.size.height/2 - 20);
    }

    renderSelectionUI(ctx) {
        const module = this.selectedModule;

        // Selection highlight
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(module.x - module.config.size.width/2 - 5,
                      module.y - module.config.size.height/2 - 5,
                      module.config.size.width + 10,
                      module.config.size.height + 10);
        ctx.setLineDash([]);

        // Info panel
        const panelX = module.x + module.config.size.width/2 + 20;
        const panelY = module.y - 60;
        const panelWidth = 200;
        const panelHeight = 120;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Module info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${module.config.name} Lv.${module.level}`, panelX + 10, panelY + 20);

        ctx.font = '12px Arial';
        ctx.fillText(`Health: ${module.health}/${module.maxHealth}`, panelX + 10, panelY + 40);
        ctx.fillText(`Power: ${module.powerLevel}`, panelX + 10, panelY + 55);

        const upgradeCost = module.getUpgradeCost();
        if (upgradeCost) {
            ctx.fillText(`Upgrade: $${upgradeCost}`, panelX + 10, panelY + 75);
        } else {
            ctx.fillText('Max Level', panelX + 10, panelY + 75);
        }

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '10px Arial';
        ctx.fillText('Right-click: Upgrade', panelX + 10, panelY + 95);
        ctx.fillText(module.config.description, panelX + 10, panelY + 110);
    }

    getPowerStatus() {
        return {
            generation: this.totalPower,
            consumption: this.powerConsumption,
            efficiency: this.totalPower > 0 ? (this.powerConsumption / this.totalPower) : 0
        };
    }
}

// Bunker Input Handler
class BunkerInputHandler {
    constructor(bunkerManager, economyManager) {
        this.bunkerManager = bunkerManager;
        this.economyManager = economyManager;
        this.mousePosition = { x: 0, y: 0 };
        this.bunkerHotkeys = {
            'q': 'POWER_GENERATOR',
            'w': 'BARRACKS',
            'e': 'RESEARCH_LAB',
            'r': 'SHIELD_ARRAY',
            't': 'WEAPON_FACTORY',
            'y': 'SENSOR_ARRAY'
        };
    }

    handleKeyPress(key) {
        const moduleType = this.bunkerHotkeys[key.toLowerCase()];
        if (moduleType) {
            const config = BUNKER_MODULE_CONFIGS[moduleType];

            if (this.economyManager.canAfford(config.cost)) {
                this.bunkerManager.enterBuildMode(moduleType);
                console.log(`Bunker hotkey ${key.toUpperCase()}: Entering build mode for ${config.name}`);
            } else {
                console.log(`Bunker hotkey ${key.toUpperCase()}: Cannot afford ${config.name} (costs $${config.cost})`);
            }
            return true;
        }
        return false;
    }

    handleMouseMove(x, y) {
        this.mousePosition.x = x;
        this.mousePosition.y = y;
        this.bunkerManager.updatePreview(x, y);
    }

    handleMouseClick(x, y, button) {
        // Left click
        if (button === 0) {
            // Build mode
            if (this.bunkerManager.buildMode) {
                return this.bunkerManager.buildModule(x, y);
            }

            // Select module
            const selectedModule = this.bunkerManager.selectModule(x, y);
            return selectedModule !== null;
        }

        // Right click
        if (button === 2) {
            // Upgrade selected module
            if (this.bunkerManager.selectedModule) {
                return this.bunkerManager.upgradeSelectedModule();
            }
        }

        return false;
    }
}
