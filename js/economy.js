// Economy & Defense System for Herumballerpunkt
// Implements comprehensive money system and 8 defense structure types

// Defense Structure Configuration
const DEFENSE_CONFIGS = {
    GATLING_TURRET: {
        name: 'Gatling-Turret',
        cost: 150,
        health: 100,
        damage: 15,
        fireRate: 200,
        range: 180,
        projectileSpeed: 12,
        color: '#666666',
        glowColor: '#888888',
        upgrades: [
            { cost: 100, healthBonus: 50, damageBonus: 10, fireRateBonus: -50 },
            { cost: 200, healthBonus: 100, damageBonus: 20, fireRateBonus: -50 },
            { cost: 400, healthBonus: 150, damageBonus: 30, fireRateBonus: -50 }
        ]
    },
    SNIPER_TURRET: {
        name: 'Sniper-Turret',
        cost: 300,
        health: 80,
        damage: 80,
        fireRate: 2000,
        range: 350,
        projectileSpeed: 20,
        color: '#004400',
        glowColor: '#008800',
        upgrades: [
            { cost: 150, healthBonus: 40, damageBonus: 40, rangeBonus: 50 },
            { cost: 300, healthBonus: 80, damageBonus: 80, rangeBonus: 100 },
            { cost: 600, healthBonus: 120, damageBonus: 120, rangeBonus: 150 }
        ]
    },
    ROCKET_TURRET: {
        name: 'Rocket-Turret',
        cost: 500,
        health: 120,
        damage: 120,
        fireRate: 3000,
        range: 250,
        projectileSpeed: 8,
        explosionRadius: 60,
        color: '#440000',
        glowColor: '#880000',
        upgrades: [
            { cost: 250, healthBonus: 60, damageBonus: 60, explosionRadiusBonus: 20 },
            { cost: 500, healthBonus: 120, damageBonus: 120, explosionRadiusBonus: 40 },
            { cost: 1000, healthBonus: 180, damageBonus: 180, explosionRadiusBonus: 60 }
        ]
    },
    REPAIR_STATION: {
        name: 'Repair-Station',
        cost: 200,
        health: 150,
        repairRate: 5,
        repairRange: 120,
        repairInterval: 1000,
        color: '#444400',
        glowColor: '#888800',
        upgrades: [
            { cost: 100, healthBonus: 75, repairRateBonus: 3, repairRangeBonus: 30 },
            { cost: 200, healthBonus: 150, repairRateBonus: 6, repairRangeBonus: 60 },
            { cost: 400, healthBonus: 225, repairRateBonus: 9, repairRangeBonus: 90 }
        ]
    },
    SHIELD_GENERATOR: {
        name: 'Shield-Generator',
        cost: 400,
        health: 200,
        shieldStrength: 100,
        shieldRange: 100,
        shieldRegenRate: 2,
        color: '#000044',
        glowColor: '#000088',
        upgrades: [
            { cost: 200, healthBonus: 100, shieldStrengthBonus: 50, shieldRangeBonus: 25 },
            { cost: 400, healthBonus: 200, shieldStrengthBonus: 100, shieldRangeBonus: 50 },
            { cost: 800, healthBonus: 300, shieldStrengthBonus: 150, shieldRangeBonus: 75 }
        ]
    },
    RADAR_STATION: {
        name: 'Radar-Station',
        cost: 250,
        health: 100,
        detectionRange: 300,
        accuracyBonus: 0.25,
        minimapRange: 400,
        color: '#004444',
        glowColor: '#008888',
        upgrades: [
            { cost: 125, healthBonus: 50, detectionRangeBonus: 100, accuracyBonusBonus: 0.15 },
            { cost: 250, healthBonus: 100, detectionRangeBonus: 200, accuracyBonusBonus: 0.30 },
            { cost: 500, healthBonus: 150, detectionRangeBonus: 300, accuracyBonusBonus: 0.45 }
        ]
    },
    TESLA_COIL: {
        name: 'Tesla-Coil',
        cost: 600,
        health: 150,
        damage: 40,
        chainRange: 80,
        maxChains: 3,
        fireRate: 1500,
        color: '#440044',
        glowColor: '#880088',
        upgrades: [
            { cost: 300, healthBonus: 75, damageBonus: 20, maxChainsBonus: 1 },
            { cost: 600, healthBonus: 150, damageBonus: 40, maxChainsBonus: 2 },
            { cost: 1200, healthBonus: 225, damageBonus: 60, maxChainsBonus: 3 }
        ]
    },
    LASER_FENCE: {
        name: 'Laser-Fence',
        cost: 100,
        health: 50,
        damage: 25,
        length: 80,
        color: '#444444',
        glowColor: '#ff0000',
        upgrades: [
            { cost: 50, healthBonus: 25, damageBonus: 15, lengthBonus: 20 },
            { cost: 100, healthBonus: 50, damageBonus: 30, lengthBonus: 40 },
            { cost: 200, healthBonus: 75, damageBonus: 45, lengthBonus: 60 }
        ]
    }
};

// Economy Manager Class
class EconomyManager {
    constructor() {
        this.money = 500; // Starting money
        this.totalEarned = 0;
        this.totalSpent = 0;
        this.comboMultiplier = 1.0;
        this.comboTimer = 0;
        this.comboDuration = 3000; // 3 seconds
        this.lastKillTime = 0;
        this.killStreak = 0;
        
        // Income sources
        this.baseIncome = {
            enemyKill: 10,
            eliteKill: 50,
            bossKill: 200,
            waveComplete: 100,
            allyKill: 5 // When ally kills enemy
        };
        
        // Bonus multipliers
        this.bonusMultipliers = {
            headshot: 1.5,
            multiKill: 2.0,
            longRange: 1.3,
            quickKill: 1.2
        };
    }
    
    update() {
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= 16; // Assuming 60 FPS
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
    }
    
    addMoney(amount, source = 'unknown', bonusType = null) {
        let finalAmount = amount;
        
        // Apply combo multiplier
        finalAmount *= this.comboMultiplier;
        
        // Apply bonus multipliers
        if (bonusType && this.bonusMultipliers[bonusType]) {
            finalAmount *= this.bonusMultipliers[bonusType];
        }
        
        finalAmount = Math.floor(finalAmount);
        
        this.money += finalAmount;
        this.totalEarned += finalAmount;
        
        // Update combo for kills
        if (source.includes('kill')) {
            this.updateCombo();
        }
        
        // Show money gain effect
        this.showMoneyGain(finalAmount, bonusType);
        
        return finalAmount;
    }
    
    spendMoney(amount, item = 'unknown') {
        if (this.money >= amount) {
            this.money -= amount;
            this.totalSpent += amount;
            this.showMoneySpent(amount, item);
            return true;
        }
        return false;
    }
    
    updateCombo() {
        const now = Date.now();
        
        // Check if this kill extends the combo
        if (now - this.lastKillTime <= this.comboDuration) {
            this.killStreak++;
            this.comboMultiplier = Math.min(3.0, 1.0 + (this.killStreak * 0.1)); // Max 3x multiplier
        } else {
            this.killStreak = 1;
            this.comboMultiplier = 1.0;
        }
        
        this.comboTimer = this.comboDuration;
        this.lastKillTime = now;
    }
    
    resetCombo() {
        this.killStreak = 0;
        this.comboMultiplier = 1.0;
        this.comboTimer = 0;
    }
    
    showMoneyGain(amount, bonusType) {
        // Create floating text effect
        const color = bonusType ? '#00ff00' : '#ffff00';
        const text = bonusType ? `+$${amount} (${bonusType.toUpperCase()})` : `+$${amount}`;
        
        // This would need integration with the game's text effect system
        console.log(`Money gained: ${text}`);
    }
    
    showMoneySpent(amount, item) {
        console.log(`Money spent: -$${amount} on ${item}`);
    }
    
    canAfford(amount) {
        return this.money >= amount;
    }
    
    getStats() {
        return {
            current: this.money,
            totalEarned: this.totalEarned,
            totalSpent: this.totalSpent,
            comboMultiplier: this.comboMultiplier,
            killStreak: this.killStreak
        };
    }
}

// Base Defense Structure Class
class DefenseStructure {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.config = DEFENSE_CONFIGS[type];
        this.level = 1;
        this.maxLevel = 4;
        
        // Base stats
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.damage = this.config.damage;
        this.fireRate = this.config.fireRate;
        this.range = this.config.range;
        this.radius = 20;
        
        // State
        this.lastShot = 0;
        this.target = null;
        this.angle = 0;
        this.isActive = true;
        this.lastRepair = 0;
        
        // Visual
        this.pulseTimer = 0;
        this.muzzleFlash = 0;
        
        console.log(`Built ${this.config.name} at (${x}, ${y})`);
    }
    
    update(targets, defenseStructures) {
        this.pulseTimer += 0.05;
        
        if (this.muzzleFlash > 0) {
            this.muzzleFlash -= 0.1;
        }
        
        if (!this.isActive || this.health <= 0) return [];
        
        // Type-specific updates
        switch(this.type) {
            case 'GATLING_TURRET':
            case 'SNIPER_TURRET':
            case 'ROCKET_TURRET':
                return this.updateCombatTurret(targets);
            case 'REPAIR_STATION':
                return this.updateRepairStation(defenseStructures);
            case 'SHIELD_GENERATOR':
                return this.updateShieldGenerator(targets, defenseStructures);
            case 'RADAR_STATION':
                return this.updateRadarStation(targets);
            case 'TESLA_COIL':
                return this.updateTeslaCoil(targets);
            case 'LASER_FENCE':
                return this.updateLaserFence(targets);
        }
        
        return [];
    }
    
    updateCombatTurret(targets) {
        // Find target
        this.target = this.findBestTarget(targets);
        
        if (!this.target) return [];
        
        // Aim at target
        this.angle = getAngle(this.x, this.y, this.target.x, this.target.y);
        
        // Shoot
        const now = Date.now();
        if (now - this.lastShot >= this.fireRate) {
            this.lastShot = now;
            this.muzzleFlash = 1.0;
            return this.createProjectile();
        }
        
        return [];
    }
    
    findBestTarget(targets) {
        let bestTarget = null;
        let bestScore = -1;
        
        targets.forEach(target => {
            if (target.health <= 0) return;
            
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance > this.range) return;
            
            // Scoring: closer targets and elites get priority
            let score = (this.range - distance) / this.range;
            if (target.isElite) score += 0.5;
            if (target instanceof Superboss) score += 1.0;
            
            if (score > bestScore) {
                bestScore = score;
                bestTarget = target;
            }
        });
        
        return bestTarget;
    }
    
    createProjectile() {
        const projectile = {
            x: this.x + Math.cos(this.angle) * 25,
            y: this.y + Math.sin(this.angle) * 25,
            vx: Math.cos(this.angle) * (this.config.projectileSpeed || 10),
            vy: Math.sin(this.angle) * (this.config.projectileSpeed || 10),
            radius: this.type === 'ROCKET_TURRET' ? 6 : 4,
            damage: this.damage,
            isPlayer: false,
            isDefense: true,
            color: this.type === 'SNIPER_TURRET' ? '#00ff00' : 
                   this.type === 'ROCKET_TURRET' ? '#ff4400' : '#ffff00',
            structureType: this.type
        };
        
        // Special projectile properties
        if (this.type === 'ROCKET_TURRET') {
            projectile.explosive = true;
            projectile.explosionRadius = this.config.explosionRadius;
        }
        
        playSound('turret_shoot', 0.3);
        createParticles(projectile.x, projectile.y, projectile.color, 5);
        
        return [projectile];
    }
    
    takeDamage(amount) {
        this.health -= amount;
        createParticles(this.x, this.y, '#ff4444', 8);
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        createParticles(this.x, this.y, '#ff4444', 25);
        playSound('structure_destroyed', 0.5);
        console.log(`${this.config.name} destroyed!`);
    }
    
    upgrade() {
        if (this.level >= this.maxLevel) return false;
        
        const upgradeData = this.config.upgrades[this.level - 1];
        if (!upgradeData) return false;
        
        // Apply upgrades
        if (upgradeData.healthBonus) {
            this.maxHealth += upgradeData.healthBonus;
            this.health += upgradeData.healthBonus;
        }
        if (upgradeData.damageBonus) this.damage += upgradeData.damageBonus;
        if (upgradeData.fireRateBonus) this.fireRate += upgradeData.fireRateBonus;
        if (upgradeData.rangeBonus) this.range += upgradeData.rangeBonus;
        
        this.level++;
        
        createParticles(this.x, this.y, '#00ff00', 20);
        playSound('upgrade', 0.4);
        
        return true;
    }
    
    getUpgradeCost() {
        if (this.level >= this.maxLevel) return null;
        return this.config.upgrades[this.level - 1]?.cost;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Range indicator (when selected)
        if (this.showRange) {
            ctx.strokeStyle = this.config.glowColor + '40';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Base
        ctx.fillStyle = this.config.color;
        ctx.strokeStyle = this.config.glowColor;
        ctx.lineWidth = 2 + this.level;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Type-specific rendering
        this.renderSpecific(ctx);
        
        // Level indicators
        for (let i = 0; i < this.level; i++) {
            const angle = (i / this.maxLevel) * Math.PI * 2;
            const x = Math.cos(angle) * (this.radius + 8);
            const y = Math.sin(angle) * (this.radius + 8);
            
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Health bar
        if (this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }
    }
    
    renderSpecific(ctx) {
        // Override in subclasses or handle by type
        switch(this.type) {
            case 'GATLING_TURRET':
            case 'SNIPER_TURRET':
            case 'ROCKET_TURRET':
                this.renderTurret(ctx);
                break;
            case 'REPAIR_STATION':
                this.renderRepairStation(ctx);
                break;
            // Add other types...
        }
    }
    
    renderTurret(ctx) {
        // Cannon
        ctx.rotate(this.angle);
        ctx.fillStyle = this.config.glowColor;
        ctx.fillRect(0, -4, 30, 8);
        
        // Muzzle flash
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 0, ${this.muzzleFlash})`;
            ctx.fillRect(25, -6, 10, 12);
        }
    }
    
    renderRepairStation(ctx) {
        // Repair beam visual
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(10, 10);
        ctx.moveTo(10, -10);
        ctx.lineTo(-10, 10);
        ctx.stroke();
    }
    
    drawHealthBar(ctx) {
        const barWidth = 40;
        const barHeight = 6;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 15, barWidth, barHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 15, barWidth * healthPercent, barHeight);
    }

    // Specialized update methods
    updateRepairStation(defenseStructures) {
        const now = Date.now();
        if (now - this.lastRepair < this.config.repairInterval) return [];

        this.lastRepair = now;
        let repaired = false;

        defenseStructures.forEach(structure => {
            if (structure === this || structure.health >= structure.maxHealth) return;

            const distance = getDistance(this.x, this.y, structure.x, structure.y);
            if (distance <= this.config.repairRange) {
                structure.health = Math.min(structure.maxHealth, structure.health + this.config.repairRate);
                createParticles(structure.x, structure.y, '#ffff00', 5);
                repaired = true;
            }
        });

        if (repaired) {
            createParticles(this.x, this.y, '#ffff00', 10);
            playSound('repair', 0.3);
        }

        return [];
    }

    updateShieldGenerator(targets, defenseStructures) {
        // Generate shields for nearby structures and allies
        const shieldTargets = [...defenseStructures];
        if (typeof gameManager !== 'undefined' && gameManager && gameManager.allies) {
            shieldTargets.push(...gameManager.allies);
        }
        if (typeof gameManager !== 'undefined' && gameManager && gameManager.player) {
            shieldTargets.push(gameManager.player);
        }

        shieldTargets.forEach(target => {
            if (target === this) return;

            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance <= this.config.shieldRange) {
                if (!target.hasEnergyShield) {
                    target.hasEnergyShield = true;
                    target.energyShieldStrength = this.config.shieldStrength;
                    target.maxEnergyShield = this.config.shieldStrength;
                }

                // Regenerate shield
                if (target.energyShieldStrength < target.maxEnergyShield) {
                    target.energyShieldStrength = Math.min(
                        target.maxEnergyShield,
                        target.energyShieldStrength + this.config.shieldRegenRate
                    );
                }
            }
        });

        return [];
    }

    updateRadarStation(targets) {
        // Provide accuracy bonus to nearby turrets
        if (typeof gameManager !== 'undefined' && gameManager && gameManager.defenseStructures) {
            gameManager.defenseStructures.forEach(structure => {
                if (structure.type.includes('TURRET')) {
                    const distance = getDistance(this.x, this.y, structure.x, structure.y);
                    if (distance <= this.config.detectionRange) {
                        structure.accuracyBonus = this.config.accuracyBonus;
                    }
                }
            });
        }

        // Reveal enemies on minimap (would need minimap integration)
        targets.forEach(target => {
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance <= this.config.minimapRange) {
                target.revealedOnRadar = true;
            }
        });

        return [];
    }

    updateTeslaCoil(targets) {
        const now = Date.now();
        if (now - this.lastShot < this.fireRate) return [];

        // Find primary target
        const primaryTarget = this.findBestTarget(targets);
        if (!primaryTarget) return [];

        this.lastShot = now;

        // Create chain lightning
        const chainTargets = [primaryTarget];
        let currentTarget = primaryTarget;

        for (let i = 0; i < this.config.maxChains; i++) {
            const nextTarget = this.findChainTarget(targets, currentTarget, chainTargets);
            if (nextTarget) {
                chainTargets.push(nextTarget);
                currentTarget = nextTarget;
            } else {
                break;
            }
        }

        // Apply damage to all targets in chain
        chainTargets.forEach((target, index) => {
            const damage = this.damage * Math.pow(0.8, index); // Diminishing damage
            target.takeDamage(damage);
            createParticles(target.x, target.y, '#ff44ff', 10);
        });

        // Create visual lightning effect
        this.createLightningEffect(chainTargets);
        playSound('tesla', 0.4);

        return [];
    }

    findChainTarget(targets, fromTarget, excludeTargets) {
        let bestTarget = null;
        let bestDistance = Infinity;

        targets.forEach(target => {
            if (excludeTargets.includes(target) || target.health <= 0) return;

            const distance = getDistance(fromTarget.x, fromTarget.y, target.x, target.y);
            if (distance <= this.config.chainRange && distance < bestDistance) {
                bestDistance = distance;
                bestTarget = target;
            }
        });

        return bestTarget;
    }

    createLightningEffect(targets) {
        // Store lightning effect for rendering
        this.lightningChain = {
            targets: targets,
            lifetime: 200,
            created: Date.now()
        };
    }

    updateLaserFence(targets) {
        // Check for collisions with the laser fence
        const fenceStart = {
            x: this.x - this.config.length / 2,
            y: this.y
        };
        const fenceEnd = {
            x: this.x + this.config.length / 2,
            y: this.y
        };

        targets.forEach(target => {
            if (this.lineCircleIntersection(fenceStart, fenceEnd, target)) {
                target.takeDamage(this.damage * 0.1); // Continuous damage
                createParticles(target.x, target.y, '#ff0000', 3);
            }
        });

        return [];
    }

    lineCircleIntersection(lineStart, lineEnd, circle) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const fx = lineStart.x - circle.x;
        const fy = lineStart.y - circle.y;

        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = (fx * fx + fy * fy) - circle.radius * circle.radius;

        const discriminant = b * b - 4 * a * c;
        return discriminant >= 0;
    }
}

// Defense Manager Class
class DefenseManager {
    constructor(economyManager) {
        this.economyManager = economyManager;
        this.structures = [];
        this.buildMode = false;
        this.selectedStructureType = null;
        this.selectedStructure = null;
        this.previewPosition = { x: 0, y: 0 };
        this.minDistance = 50; // Minimum distance between structures
    }

    update(targets) {
        // Update all structures
        this.structures = this.structures.filter(structure => {
            if (structure.health <= 0) {
                structure.destroy();
                return false;
            }

            const projectiles = structure.update(targets, this.structures);
            if (typeof gameManager !== 'undefined' && gameManager && projectiles.length > 0) {
                gameManager.bullets.push(...projectiles);
            }

            return true;
        });
    }

    enterBuildMode(structureType) {
        this.buildMode = true;
        this.selectedStructureType = structureType;
        console.log(`Entered build mode for ${structureType}`);
    }

    exitBuildMode() {
        this.buildMode = false;
        this.selectedStructureType = null;
        this.selectedStructure = null;
    }

    updatePreview(mouseX, mouseY) {
        if (!this.buildMode) return;

        this.previewPosition.x = mouseX;
        this.previewPosition.y = mouseY;
    }

    canBuildAt(x, y) {
        // Check minimum distance from other structures
        return !this.structures.some(structure => {
            const distance = getDistance(x, y, structure.x, structure.y);
            return distance < this.minDistance;
        });
    }

    buildStructure(x, y, structureType) {
        if (!structureType) structureType = this.selectedStructureType;
        if (!structureType) return false;

        const config = DEFENSE_CONFIGS[structureType];
        if (!config) return false;

        // Check if can afford
        if (!this.economyManager.canAfford(config.cost)) {
            console.log(`Cannot afford ${config.name} (costs $${config.cost})`);
            return false;
        }

        // Check if can build at location
        if (!this.canBuildAt(x, y)) {
            console.log(`Cannot build at (${x}, ${y}) - too close to other structures`);
            return false;
        }

        // Build the structure
        if (this.economyManager.spendMoney(config.cost, config.name)) {
            const structure = new DefenseStructure(structureType, x, y);
            this.structures.push(structure);

            createParticles(x, y, '#00ff00', 20);
            playSound('build', 0.5);

            this.exitBuildMode();
            return true;
        }

        return false;
    }

    selectStructure(x, y) {
        // Find structure at position
        const structure = this.structures.find(s => {
            const distance = getDistance(x, y, s.x, s.y);
            return distance <= s.radius;
        });

        if (structure) {
            this.selectedStructure = structure;
            structure.showRange = true;

            // Hide range for other structures
            this.structures.forEach(s => {
                if (s !== structure) s.showRange = false;
            });

            return structure;
        }

        return null;
    }

    upgradeSelectedStructure() {
        if (!this.selectedStructure) return false;

        const upgradeCost = this.selectedStructure.getUpgradeCost();
        if (!upgradeCost) {
            console.log('Structure is already at max level');
            return false;
        }

        if (!this.economyManager.canAfford(upgradeCost)) {
            console.log(`Cannot afford upgrade (costs $${upgradeCost})`);
            return false;
        }

        if (this.economyManager.spendMoney(upgradeCost, `${this.selectedStructure.config.name} Upgrade`)) {
            return this.selectedStructure.upgrade();
        }

        return false;
    }

    sellSelectedStructure() {
        if (!this.selectedStructure) return false;

        const sellPrice = Math.floor(this.selectedStructure.config.cost * 0.7); // 70% refund
        this.economyManager.addMoney(sellPrice, 'structure_sale');

        // Remove structure
        const index = this.structures.indexOf(this.selectedStructure);
        if (index !== -1) {
            this.structures.splice(index, 1);
        }

        createParticles(this.selectedStructure.x, this.selectedStructure.y, '#ffff00', 15);
        playSound('sell', 0.4);

        this.selectedStructure = null;
        return true;
    }

    render(ctx) {
        // Render all structures
        this.structures.forEach(structure => structure.render(ctx));

        // Render build preview
        if (this.buildMode && this.selectedStructureType) {
            this.renderBuildPreview(ctx);
        }

        // Render selection UI
        if (this.selectedStructure) {
            this.renderSelectionUI(ctx);
        }
    }

    renderBuildPreview(ctx) {
        const config = DEFENSE_CONFIGS[this.selectedStructureType];
        const canBuild = this.canBuildAt(this.previewPosition.x, this.previewPosition.y);

        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.translate(this.previewPosition.x, this.previewPosition.y);

        // Preview circle
        ctx.fillStyle = canBuild ? '#00ff0040' : '#ff000040';
        ctx.strokeStyle = canBuild ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Range indicator
        if (config.range) {
            ctx.strokeStyle = canBuild ? '#00ff0020' : '#ff000020';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, config.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();

        // Cost display
        ctx.fillStyle = this.economyManager.canAfford(config.cost) ? '#ffffff' : '#ff0000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`$${config.cost}`, this.previewPosition.x, this.previewPosition.y - 30);
    }

    renderSelectionUI(ctx) {
        const structure = this.selectedStructure;

        // Selection circle
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(structure.x, structure.y, structure.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Info panel (simplified)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(structure.x + 30, structure.y - 40, 150, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${structure.config.name} Lv.${structure.level}`, structure.x + 35, structure.y - 25);
        ctx.fillText(`Health: ${structure.health}/${structure.maxHealth}`, structure.x + 35, structure.y - 10);

        const upgradeCost = structure.getUpgradeCost();
        if (upgradeCost) {
            ctx.fillText(`Upgrade: $${upgradeCost}`, structure.x + 35, structure.y + 5);
        } else {
            ctx.fillText('Max Level', structure.x + 35, structure.y + 5);
        }

        ctx.fillText('Right-click: Upgrade', structure.x + 35, structure.y + 20);
    }
}
