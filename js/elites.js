// Elite Enemy Variants System for Herumballerpunkt
// Implements all 6 elite enemy types with specialized AI behaviors

// Elite Configuration
const ELITE_CONFIGS = {
    SNIPER: {
        name: 'Sniper Elite',
        healthMultiplier: 1.2,
        damageMultiplier: 2.5,
        speedMultiplier: 0.8,
        sizeMultiplier: 1.1,
        glowColor: '#00ff00',
        particleColor: '#44ff44',
        spawnWeight: 20,
        abilities: ['laser_sight', 'piercing_shot', 'retreat'],
        specialCooldown: 3000,
        scoreValue: 50
    },
    BERSERKER: {
        name: 'Berserker Elite',
        healthMultiplier: 1.8,
        damageMultiplier: 1.5,
        speedMultiplier: 1.3,
        sizeMultiplier: 1.2,
        glowColor: '#ff4444',
        particleColor: '#ff0000',
        spawnWeight: 25,
        abilities: ['rage_mode', 'charge_attack', 'intimidate'],
        specialCooldown: 5000,
        scoreValue: 60
    },
    GUARDIAN: {
        name: 'Guardian Elite',
        healthMultiplier: 2.5,
        damageMultiplier: 1.0,
        speedMultiplier: 0.6,
        sizeMultiplier: 1.4,
        glowColor: '#4444ff',
        particleColor: '#0088ff',
        spawnWeight: 15,
        abilities: ['energy_shield', 'shield_bash', 'protect_allies'],
        specialCooldown: 8000,
        scoreValue: 80
    },
    HEALER: {
        name: 'Healer Elite',
        healthMultiplier: 1.0,
        damageMultiplier: 0.8,
        speedMultiplier: 1.2,
        sizeMultiplier: 1.0,
        glowColor: '#ffff44',
        particleColor: '#ffff00',
        spawnWeight: 10,
        abilities: ['heal_allies', 'teleport', 'regeneration'],
        specialCooldown: 4000,
        scoreValue: 70
    },
    SUMMONER: {
        name: 'Summoner Elite',
        healthMultiplier: 1.3,
        damageMultiplier: 1.2,
        speedMultiplier: 0.9,
        sizeMultiplier: 1.1,
        glowColor: '#ff44ff',
        particleColor: '#ff00ff',
        spawnWeight: 12,
        abilities: ['summon_minions', 'dark_magic', 'minion_boost'],
        specialCooldown: 6000,
        scoreValue: 90
    },
    PHANTOM: {
        name: 'Phantom Elite',
        healthMultiplier: 0.8,
        damageMultiplier: 1.4,
        speedMultiplier: 1.5,
        sizeMultiplier: 0.9,
        glowColor: '#8844ff',
        particleColor: '#aa44ff',
        spawnWeight: 8,
        abilities: ['stealth', 'phase_through', 'surprise_attack'],
        specialCooldown: 3500,
        scoreValue: 100
    },
    JUGGERNAUT: {
        name: 'Juggernaut Elite',
        healthMultiplier: 3.0,
        damageMultiplier: 1.8,
        speedMultiplier: 0.4,
        sizeMultiplier: 1.6,
        glowColor: '#ff8800',
        particleColor: '#ffaa00',
        spawnWeight: 5,
        abilities: ['unstoppable', 'ground_slam', 'armor_plating'],
        specialCooldown: 10000,
        scoreValue: 150
    }
};

// Base Elite Enemy Class
class EliteEnemy {
    constructor(x, y, eliteType, level = 1) {
        // Initialize base enemy properties
        this.x = x;
        this.y = y;
        this.level = level;
        this.health = 100 + (level - 1) * 20;
        this.maxHealth = this.health;
        this.damage = 20 + (level - 1) * 5;
        this.speed = 2;
        this.radius = 15;
        this.angle = 0;
        this.fireRate = 1000;
        this.lastShot = 0;
        this.upgradeCount = 0;

        this.eliteType = eliteType;
        this.config = ELITE_CONFIGS[eliteType];
        this.isElite = true;

        // Apply elite modifiers
        this.health *= this.config.healthMultiplier;
        this.maxHealth = this.health;
        this.damage *= this.config.damageMultiplier;
        this.speed *= this.config.speedMultiplier;
        this.radius *= this.config.sizeMultiplier;
        
        // Elite-specific properties
        this.specialAbilities = this.config.abilities;
        this.lastSpecialAttack = 0;
        this.specialCooldown = this.config.specialCooldown;
        this.eliteState = 'normal';
        
        // Visual properties
        this.glowColor = this.config.glowColor;
        this.particleTimer = 0;
        this.pulseTimer = 0;
        
        // Elite marker
        this.eliteMarker = {
            rotation: 0,
            pulse: 0
        };
        
        console.log(`Spawned ${this.config.name} at (${x}, ${y})`);
    }
    
    update(targets, walls) {
        // Basic enemy update logic
        const bullets = [];

        // Find closest target for aiming
        let closestTarget = null;
        let closestDistance = Infinity;

        targets.forEach(target => {
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = target;
            }
        });

        // Aim at closest target
        if (closestTarget) {
            this.angle = getAngle(this.x, this.y, closestTarget.x, closestTarget.y);

            // Basic shooting
            const now = Date.now();
            if (now - this.lastShot >= this.fireRate) {
                this.lastShot = now;
                bullets.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(this.angle) * 8,
                    vy: Math.sin(this.angle) * 8,
                    radius: 3,
                    damage: this.damage,
                    isPlayer: false,
                    color: '#f44'
                });
            }
        }

        // Elite-specific behavior
        this.updateEliteBehavior(targets, walls);
        this.updateSpecialAbilities(targets);
        this.updateVisualEffects();

        return bullets;
    }
    
    updateEliteBehavior(targets, walls) {
        // Override in subclasses
        switch(this.eliteType) {
            case 'SNIPER':
                this.updateSniperBehavior(targets, walls);
                break;
            case 'BERSERKER':
                this.updateBerserkerBehavior(targets);
                break;
            case 'GUARDIAN':
                this.updateGuardianBehavior(targets, walls);
                break;
            case 'HEALER':
                this.updateHealerBehavior(targets);
                break;
            case 'SUMMONER':
                this.updateSummonerBehavior(targets);
                break;
            case 'PHANTOM':
                this.updatePhantomBehavior(targets, walls);
                break;
            case 'JUGGERNAUT':
                this.updateJuggernautBehavior(targets, walls);
                break;
        }
    }
    
    updateSpecialAbilities(targets) {
        const now = Date.now();
        if (now - this.lastSpecialAttack >= this.specialCooldown) {
            this.useSpecialAbility(targets);
            this.lastSpecialAttack = now;
        }
    }
    
    updateVisualEffects() {
        this.particleTimer += 0.1;
        this.pulseTimer += 0.05;
        this.eliteMarker.rotation += 0.02;
        this.eliteMarker.pulse = 1 + Math.sin(this.pulseTimer) * 0.3;
        
        // Elite particle trail
        if (Math.random() < 0.2) {
            createParticles(this.x, this.y, this.config.particleColor, 1);
        }
    }
    
    useSpecialAbility(targets) {
        // Override in subclasses
    }
    
    findClosestTarget(targets) {
        let closestTarget = null;
        let closestDistance = Infinity;
        
        targets.forEach(target => {
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = target;
            }
        });
        
        return closestTarget;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        createParticles(this.x, this.y, '#f44', 5);

        // Elite death effects
        if (this.health <= 0) {
            this.createEliteDeathEffect();
        }
    }
    
    createEliteDeathEffect() {
        // Epic death effect for elites
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                createParticles(
                    this.x + (Math.random() - 0.5) * 60,
                    this.y + (Math.random() - 0.5) * 60,
                    this.config.particleColor,
                    8
                );
            }, i * 30);
        }
        
        // Screen shake for powerful elites
        if (this.eliteType === 'JUGGERNAUT' || this.eliteType === 'GUARDIAN') {
            if (typeof gameManager !== 'undefined' && gameManager && gameManager.renderer && gameManager.renderer.addScreenShake) {
                gameManager.renderer.addScreenShake(15, 500);
            }
        }
        
        playSound('elite_death', 0.6);
    }
    
    render(ctx) {
        // Elite glow effect
        ctx.save();
        
        // Outer glow
        const glowRadius = this.radius * this.eliteMarker.pulse * 2;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        gradient.addColorStop(0, this.glowColor + '40');
        gradient.addColorStop(0.5, this.glowColor + '20');
        gradient.addColorStop(1, this.glowColor + '00');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - glowRadius, this.y - glowRadius, glowRadius * 2, glowRadius * 2);
        
        // Elite marker above enemy
        ctx.translate(this.x, this.y - this.radius - 20);
        ctx.rotate(this.eliteMarker.rotation);
        
        // Elite crown/marker
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(0, -8);
        ctx.lineTo(8, 0);
        ctx.lineTo(4, 4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }
}

// Sniper Elite Implementation
class SniperElite extends EliteEnemy {
    constructor(x, y, level) {
        super(x, y, 'SNIPER', level);
        this.aimingTarget = null;
        this.aimingTime = 0;
        this.requiredAimTime = 2000; // 2 seconds
        this.preferredDistance = 300;
        this.laserSight = null;
        this.isAiming = false;
        this.retreatCooldown = 0;
    }
    
    updateSniperBehavior(targets, walls) {
        const closestTarget = this.findClosestTarget(targets);
        if (!closestTarget) return;
        
        const distance = getDistance(this.x, this.y, closestTarget.x, closestTarget.y);
        const now = Date.now();
        
        if (distance < this.preferredDistance && now - this.retreatCooldown > 3000) {
            // Too close, retreat to elevated position
            this.retreatFrom(closestTarget, walls);
            this.retreatCooldown = now;
        } else if (distance >= this.preferredDistance) {
            // Good distance, aim and shoot
            this.aimAt(closestTarget);
        }
    }
    
    retreatFrom(target, walls) {
        // Find retreat position away from target
        const angle = getAngle(target.x, target.y, this.x, this.y); // Away from target
        const retreatDistance = 100;
        
        let newX = this.x + Math.cos(angle) * retreatDistance;
        let newY = this.y + Math.sin(angle) * retreatDistance;
        
        // Keep within bounds
        newX = Math.max(50, Math.min(canvas.width - 50, newX));
        newY = Math.max(50, Math.min(canvas.height - 50, newY));
        
        // Move towards retreat position
        const moveAngle = getAngle(this.x, this.y, newX, newY);
        this.x += Math.cos(moveAngle) * this.speed * 1.5; // Faster retreat
        this.y += Math.sin(moveAngle) * this.speed * 1.5;
        
        this.isAiming = false;
        this.aimingTime = 0;
    }
    
    aimAt(target) {
        if (!this.isAiming) {
            this.isAiming = true;
            this.aimingTarget = target;
            this.aimingTime = 0;
            this.laserSight = {
                x1: this.x, y1: this.y,
                x2: target.x, y2: target.y
            };
        }
        
        this.aimingTime += 16; // Assuming 60 FPS
        
        // Update laser sight
        if (this.aimingTarget) {
            this.laserSight.x1 = this.x;
            this.laserSight.y1 = this.y;
            this.laserSight.x2 = this.aimingTarget.x;
            this.laserSight.y2 = this.aimingTarget.y;
        }
        
        // Fire when aim time is complete
        if (this.aimingTime >= this.requiredAimTime) {
            this.firePiercingShot();
            this.isAiming = false;
            this.aimingTime = 0;
            this.laserSight = null;
        }
    }
    
    firePiercingShot() {
        if (!this.aimingTarget) return;
        
        const angle = getAngle(this.x, this.y, this.aimingTarget.x, this.aimingTarget.y);
        
        // Create piercing bullet
        const bullet = {
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 15, // Faster bullet
            vy: Math.sin(angle) * 15,
            radius: 6,
            damage: this.damage,
            isPlayer: false,
            color: '#00ff00',
            piercing: true, // Special property
            maxPierces: 3,
            currentPierces: 0
        };
        
        createParticles(this.x, this.y, '#00ff00', 10);
        playSound('sniper_shot', 0.4);
        
        return [bullet];
    }
    
    useSpecialAbility(targets) {
        // Enhanced aim - next shot is guaranteed critical
        this.nextShotCritical = true;
        createParticles(this.x, this.y, '#00ff00', 15);
    }
    
    render(ctx) {
        super.render(ctx);
        
        // Draw laser sight
        if (this.laserSight && this.isAiming) {
            ctx.save();
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.7;
            
            ctx.beginPath();
            ctx.moveTo(this.laserSight.x1, this.laserSight.y1);
            ctx.lineTo(this.laserSight.x2, this.laserSight.y2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.restore();
        }
    }
}

// Berserker Elite Implementation
class BerserkerElite extends EliteEnemy {
    constructor(x, y, level) {
        super(x, y, 'BERSERKER', level);
        this.rageThreshold = 0.5; // Rage at 50% health
        this.isRaging = false;
        this.chargeTarget = null;
        this.chargeCooldown = 0;
        this.chargeSpeed = 8;
        this.isCharging = false;
        this.chargeDistance = 0;
        this.maxChargeDistance = 200;
    }

    updateBerserkerBehavior(targets) {
        // Check for rage mode
        if (!this.isRaging && this.health / this.maxHealth <= this.rageThreshold) {
            this.enterRageMode();
        }

        // Aggressive pursuit
        const closestTarget = this.findClosestTarget(targets);
        if (closestTarget) {
            const distance = getDistance(this.x, this.y, closestTarget.x, closestTarget.y);

            if (this.isCharging) {
                this.updateCharge();
            } else if (distance > 50 && Date.now() - this.chargeCooldown > 3000) {
                this.startCharge(closestTarget);
            } else {
                // Normal aggressive movement
                const angle = getAngle(this.x, this.y, closestTarget.x, closestTarget.y);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
            }
        }
    }

    enterRageMode() {
        this.isRaging = true;
        this.speed *= 1.5;
        this.damage *= 1.3;
        this.glowColor = '#ff0000';
        this.fireRate *= 0.7; // Faster shooting

        createParticles(this.x, this.y, '#ff0000', 25);
        playSound('berserker_rage', 0.5);

        // Screen shake
        if (typeof gameManager !== 'undefined' && gameManager && gameManager.renderer && gameManager.renderer.addScreenShake) {
            gameManager.renderer.addScreenShake(8, 300);
        }
    }

    startCharge(target) {
        this.isCharging = true;
        this.chargeTarget = target;
        this.chargeDistance = 0;
        this.chargeAngle = getAngle(this.x, this.y, target.x, target.y);

        createParticles(this.x, this.y, '#ff4444', 15);
        playSound('charge_start', 0.4);
    }

    updateCharge() {
        if (!this.isCharging) return;

        // Move in charge direction
        this.x += Math.cos(this.chargeAngle) * this.chargeSpeed;
        this.y += Math.sin(this.chargeAngle) * this.chargeSpeed;
        this.chargeDistance += this.chargeSpeed;

        // Create charge trail
        if (Math.random() < 0.5) {
            createParticles(this.x, this.y, '#ff4444', 3);
        }

        // End charge
        if (this.chargeDistance >= this.maxChargeDistance) {
            this.endCharge();
        }
    }

    endCharge() {
        this.isCharging = false;
        this.chargeCooldown = Date.now();
        createParticles(this.x, this.y, '#ff0000', 20);
    }

    useSpecialAbility(targets) {
        // Intimidate - slows nearby enemies and allies
        const intimidateRadius = 150;

        targets.forEach(target => {
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance <= intimidateRadius) {
                target.intimidated = true;
                target.intimidateTime = Date.now();
                if (!target.originalSpeed) target.originalSpeed = target.speed;
                target.speed = target.originalSpeed * 0.5;
            }
        });

        createParticles(this.x, this.y, '#ff0000', 30);
        playSound('intimidate', 0.5);
    }
}

// Guardian Elite Implementation
class GuardianElite extends EliteEnemy {
    constructor(x, y, level) {
        super(x, y, 'GUARDIAN', level);
        this.shieldActive = false;
        this.shieldHealth = 200;
        this.maxShieldHealth = 200;
        this.shieldRegenRate = 2; // HP per second
        this.lastShieldRegen = 0;
        this.protectedAllies = new Set();
        this.shieldBashCooldown = 0;
    }

    updateGuardianBehavior(targets, walls) {
        // Regenerate shield
        const now = Date.now();
        if (now - this.lastShieldRegen >= 1000 && this.shieldHealth < this.maxShieldHealth) {
            this.shieldHealth = Math.min(this.maxShieldHealth, this.shieldHealth + this.shieldRegenRate);
            this.lastShieldRegen = now;
        }

        // Activate shield if damaged
        if (this.health < this.maxHealth && !this.shieldActive && this.shieldHealth > 0) {
            this.activateShield();
        }

        // Protect nearby allies
        this.protectNearbyAllies();

        // Shield bash if enemy is close
        const closestTarget = this.findClosestTarget(targets);
        if (closestTarget) {
            const distance = getDistance(this.x, this.y, closestTarget.x, closestTarget.y);
            if (distance < 80 && now - this.shieldBashCooldown > 5000) {
                this.shieldBash(closestTarget);
                this.shieldBashCooldown = now;
            }
        }
    }

    activateShield() {
        this.shieldActive = true;
        createParticles(this.x, this.y, '#4444ff', 20);
        playSound('shield_activate', 0.4);
    }

    protectNearbyAllies() {
        // Find nearby allies and give them damage reduction
        if (typeof gameManager !== 'undefined' && gameManager && gameManager.enemies) {
            gameManager.enemies.forEach(ally => {
                if (ally.isAlly && ally !== this) {
                    const distance = getDistance(this.x, this.y, ally.x, ally.y);
                    if (distance <= 120) {
                        if (!this.protectedAllies.has(ally)) {
                            this.protectedAllies.add(ally);
                            ally.damageReduction = (ally.damageReduction || 0) + 0.3;
                            createParticles(ally.x, ally.y, '#4444ff', 5);
                        }
                    } else if (this.protectedAllies.has(ally)) {
                        this.protectedAllies.delete(ally);
                        ally.damageReduction = Math.max(0, (ally.damageReduction || 0) - 0.3);
                    }
                }
            });
        }
    }

    shieldBash(target) {
        // Knockback and stun target
        const angle = getAngle(this.x, this.y, target.x, target.y);
        const knockbackForce = 50;

        target.x += Math.cos(angle) * knockbackForce;
        target.y += Math.sin(angle) * knockbackForce;
        target.takeDamage(this.damage * 1.5);
        target.stunned = true;
        target.stunTime = Date.now();

        createParticles(target.x, target.y, '#4444ff', 15);
        playSound('shield_bash', 0.6);
    }

    takeDamage(amount) {
        if (this.shieldActive && this.shieldHealth > 0) {
            this.shieldHealth -= amount;
            if (this.shieldHealth <= 0) {
                this.shieldActive = false;
                createParticles(this.x, this.y, '#ff4444', 15);
                playSound('shield_break', 0.5);
            } else {
                createParticles(this.x, this.y, '#4444ff', 5);
            }
        } else {
            super.takeDamage(amount);
        }
    }

    useSpecialAbility(targets) {
        // Energy shield pulse - damages nearby enemies
        const pulseRadius = 100;

        targets.forEach(target => {
            if (!target.isAlly) {
                const distance = getDistance(this.x, this.y, target.x, target.y);
                if (distance <= pulseRadius) {
                    target.takeDamage(this.damage * 0.8);
                    createParticles(target.x, target.y, '#4444ff', 8);
                }
            }
        });

        createParticles(this.x, this.y, '#4444ff', 25);
        playSound('energy_pulse', 0.5);
    }

    render(ctx) {
        super.render(ctx);

        // Draw shield
        if (this.shieldActive) {
            ctx.save();
            ctx.strokeStyle = '#4444ff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw protection aura
        if (this.protectedAllies.size > 0) {
            ctx.save();
            ctx.strokeStyle = '#4444ff40';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 120, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

// Healer Elite Implementation
class HealerElite extends EliteEnemy {
    constructor(x, y, level) {
        super(x, y, 'HEALER', level);
        this.healCooldown = 0;
        this.teleportCooldown = 0;
        this.regenerationActive = false;
        this.lastHeal = 0;
        this.healRadius = 100;
        this.teleportRange = 200;
    }

    updateHealerBehavior(targets) {
        const now = Date.now();

        // Heal nearby allies
        if (now - this.healCooldown > 3000) {
            this.healNearbyAllies();
            this.healCooldown = now;
        }

        // Teleport away from danger
        const closestThreat = this.findClosestTarget(targets.filter(t => !t.isAlly));
        if (closestThreat) {
            const distance = getDistance(this.x, this.y, closestThreat.x, closestThreat.y);
            if (distance < 100 && now - this.teleportCooldown > 5000) {
                this.teleportAway(closestThreat);
                this.teleportCooldown = now;
            }
        }

        // Self regeneration
        if (this.health < this.maxHealth && now - this.lastHeal > 2000) {
            this.health = Math.min(this.maxHealth, this.health + 5);
            this.lastHeal = now;
            createParticles(this.x, this.y, '#ffff44', 3);
        }
    }

    healNearbyAllies() {
        let healed = false;

        if (typeof gameManager !== 'undefined' && gameManager && gameManager.enemies) {
            gameManager.enemies.forEach(ally => {
                if (ally.isAlly && ally !== this) {
                    const distance = getDistance(this.x, this.y, ally.x, ally.y);
                    if (distance <= this.healRadius && ally.health < ally.maxHealth) {
                        const healAmount = 30;
                        ally.health = Math.min(ally.maxHealth, ally.health + healAmount);
                        createParticles(ally.x, ally.y, '#ffff44', 10);
                        healed = true;
                    }
                }
            });
        }

        if (healed) {
            createParticles(this.x, this.y, '#ffff44', 15);
            playSound('heal', 0.4);
        }
    }

    teleportAway(threat) {
        // Find safe teleport position
        const angle = getAngle(threat.x, threat.y, this.x, this.y); // Away from threat
        let newX = this.x + Math.cos(angle) * this.teleportRange;
        let newY = this.y + Math.sin(angle) * this.teleportRange;

        // Keep within bounds
        newX = Math.max(50, Math.min(canvas.width - 50, newX));
        newY = Math.max(50, Math.min(canvas.height - 50, newY));

        // Teleport effect
        createParticles(this.x, this.y, '#ffff44', 20);
        this.x = newX;
        this.y = newY;
        createParticles(this.x, this.y, '#ffff44', 20);

        playSound('teleport', 0.5);
    }

    useSpecialAbility(targets) {
        // Mass heal - heal all allies on screen
        let healed = false;

        if (typeof gameManager !== 'undefined' && gameManager && gameManager.enemies) {
            gameManager.enemies.forEach(ally => {
                if (ally.isAlly && ally !== this && ally.health < ally.maxHealth) {
                    ally.health = Math.min(ally.maxHealth, ally.health + 50);
                    createParticles(ally.x, ally.y, '#ffff44', 15);
                    healed = true;
                }
            });
        }

        if (healed) {
            createParticles(this.x, this.y, '#ffff44', 30);
            playSound('mass_heal', 0.6);
        }
    }

    render(ctx) {
        super.render(ctx);

        // Draw heal aura
        ctx.save();
        ctx.strokeStyle = '#ffff4440';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.healRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Summoner Elite Implementation
class SummonerElite extends EliteEnemy {
    constructor(x, y, level) {
        super(x, y, 'SUMMONER', level);
        this.minions = [];
        this.maxMinions = 3;
        this.summonCooldown = 0;
        this.minionBoostCooldown = 0;
        this.darkMagicCooldown = 0;
    }

    updateSummonerBehavior(targets) {
        const now = Date.now();

        // Summon minions if below max
        if (this.minions.length < this.maxMinions && now - this.summonCooldown > 4000) {
            this.summonMinion();
            this.summonCooldown = now;
        }

        // Update minions
        this.minions = this.minions.filter(minion => {
            if (minion.health <= 0) {
                createParticles(minion.x, minion.y, '#ff44ff', 10);
                return false;
            }

            // Simple minion AI - follow summoner and attack nearby targets
            const distanceToSummoner = getDistance(minion.x, minion.y, this.x, this.y);
            if (distanceToSummoner > 150) {
                // Return to summoner
                const angle = getAngle(minion.x, minion.y, this.x, this.y);
                minion.x += Math.cos(angle) * minion.speed;
                minion.y += Math.sin(angle) * minion.speed;
            } else {
                // Attack nearby targets
                const closestTarget = this.findClosestTarget(targets);
                if (closestTarget) {
                    const distance = getDistance(minion.x, minion.y, closestTarget.x, closestTarget.y);
                    if (distance < 200) {
                        const angle = getAngle(minion.x, minion.y, closestTarget.x, closestTarget.y);
                        minion.x += Math.cos(angle) * minion.speed;
                        minion.y += Math.sin(angle) * minion.speed;

                        // Attack if close enough
                        if (distance < 30 && now - minion.lastAttack > 1000) {
                            closestTarget.takeDamage(minion.damage);
                            createParticles(closestTarget.x, closestTarget.y, '#ff44ff', 5);
                            minion.lastAttack = now;
                        }
                    }
                }
            }

            return true;
        });

        // Dark magic attack
        if (now - this.darkMagicCooldown > 6000) {
            this.castDarkMagic(targets);
            this.darkMagicCooldown = now;
        }
    }

    summonMinion() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50;
        const minion = {
            x: this.x + Math.cos(angle) * distance,
            y: this.y + Math.sin(angle) * distance,
            radius: 8,
            health: 30,
            maxHealth: 30,
            damage: 15,
            speed: 2,
            lastAttack: 0
        };

        this.minions.push(minion);
        createParticles(minion.x, minion.y, '#ff44ff', 15);
        playSound('summon', 0.4);
    }

    castDarkMagic(targets) {
        // Dark magic projectiles
        const projectileCount = 5;
        const bullets = [];

        for (let i = 0; i < projectileCount; i++) {
            const angle = (i / projectileCount) * Math.PI * 2;
            bullets.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 8,
                vy: Math.sin(angle) * 8,
                radius: 5,
                damage: this.damage * 0.8,
                isPlayer: false,
                color: '#ff44ff',
                darkMagic: true
            });
        }

        createParticles(this.x, this.y, '#ff44ff', 20);
        playSound('dark_magic', 0.5);

        return bullets;
    }

    useSpecialAbility(targets) {
        // Boost all minions
        this.minions.forEach(minion => {
            minion.damage *= 1.5;
            minion.speed *= 1.3;
            minion.boosted = true;
            createParticles(minion.x, minion.y, '#ff44ff', 8);
        });

        createParticles(this.x, this.y, '#ff44ff', 25);
        playSound('minion_boost', 0.5);
    }

    render(ctx) {
        super.render(ctx);

        // Draw minions
        this.minions.forEach(minion => {
            ctx.save();
            ctx.fillStyle = '#ff44ff';
            ctx.beginPath();
            ctx.arc(minion.x, minion.y, minion.radius, 0, Math.PI * 2);
            ctx.fill();

            // Minion health bar
            const barWidth = 16;
            const barHeight = 3;
            const healthPercent = minion.health / minion.maxHealth;

            ctx.fillStyle = '#ff0000';
            ctx.fillRect(minion.x - barWidth/2, minion.y - minion.radius - 8, barWidth, barHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(minion.x - barWidth/2, minion.y - minion.radius - 8, barWidth * healthPercent, barHeight);

            ctx.restore();
        });

        // Draw connection lines to minions
        ctx.save();
        ctx.strokeStyle = '#ff44ff40';
        ctx.lineWidth = 1;
        this.minions.forEach(minion => {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(minion.x, minion.y);
            ctx.stroke();
        });
        ctx.restore();
    }
}

// Phantom Elite Implementation
class PhantomElite extends EliteEnemy {
    constructor(x, y, level) {
        super(x, y, 'PHANTOM', level);
        this.stealthActive = false;
        this.stealthDuration = 3000;
        this.stealthCooldown = 0;
        this.phaseActive = false;
        this.phaseDuration = 2000;
        this.phaseCooldown = 0;
        this.surpriseAttackReady = false;
        this.alpha = 1.0;
    }

    updatePhantomBehavior(targets, walls) {
        const now = Date.now();
        const closestTarget = this.findClosestTarget(targets);

        // Stealth when damaged or threatened
        if (!this.stealthActive && this.health < this.maxHealth * 0.8 && now - this.stealthCooldown > 8000) {
            this.activateStealth();
            this.stealthCooldown = now;
        }

        // Phase through walls when cornered
        if (!this.phaseActive && closestTarget && now - this.phaseCooldown > 6000) {
            const distance = getDistance(this.x, this.y, closestTarget.x, closestTarget.y);
            if (distance < 100) {
                this.activatePhase();
                this.phaseCooldown = now;
            }
        }

        // Update stealth
        if (this.stealthActive) {
            this.stealthDuration -= 16;
            this.alpha = 0.3;
            if (this.stealthDuration <= 0) {
                this.deactivateStealth();
            }
        } else {
            this.alpha = Math.min(1.0, this.alpha + 0.05);
        }

        // Update phase
        if (this.phaseActive) {
            this.phaseDuration -= 16;
            if (this.phaseDuration <= 0) {
                this.deactivatePhase();
            }
        }

        // Surprise attack from stealth
        if (this.surpriseAttackReady && closestTarget) {
            const distance = getDistance(this.x, this.y, closestTarget.x, closestTarget.y);
            if (distance < 50) {
                this.surpriseAttack(closestTarget);
            }
        }
    }

    activateStealth() {
        this.stealthActive = true;
        this.stealthDuration = 3000;
        this.surpriseAttackReady = true;
        this.speed *= 1.5; // Faster while stealthed

        createParticles(this.x, this.y, '#8844ff', 15);
        playSound('stealth', 0.3);
    }

    deactivateStealth() {
        this.stealthActive = false;
        this.surpriseAttackReady = false;
        this.speed /= 1.5; // Restore normal speed

        createParticles(this.x, this.y, '#8844ff', 10);
    }

    activatePhase() {
        this.phaseActive = true;
        this.phaseDuration = 2000;
        this.ghostMode = true; // Can pass through walls

        createParticles(this.x, this.y, '#8844ff', 20);
        playSound('phase', 0.4);
    }

    deactivatePhase() {
        this.phaseActive = false;
        this.ghostMode = false;

        createParticles(this.x, this.y, '#8844ff', 15);
    }

    surpriseAttack(target) {
        // Massive damage from stealth
        const surpriseDamage = this.damage * 2.5;
        target.takeDamage(surpriseDamage);

        this.surpriseAttackReady = false;
        this.deactivateStealth();

        createParticles(target.x, target.y, '#8844ff', 25);
        playSound('surprise_attack', 0.6);
    }

    useSpecialAbility(targets) {
        // Shadow clone - create temporary duplicate
        const clone = {
            x: this.x + (Math.random() - 0.5) * 100,
            y: this.y + (Math.random() - 0.5) * 100,
            radius: this.radius * 0.8,
            health: this.health * 0.3,
            damage: this.damage * 0.5,
            speed: this.speed,
            lifetime: 5000,
            created: Date.now(),
            isClone: true
        };

        // Add clone to game (would need integration with game manager)
        createParticles(clone.x, clone.y, '#8844ff', 20);
        playSound('shadow_clone', 0.5);
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        super.render(ctx);

        // Phase effect
        if (this.phaseActive) {
            ctx.strokeStyle = '#8844ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }
}

// Juggernaut Elite Implementation
class JuggernautElite extends EliteEnemy {
    constructor(x, y, level) {
        super(x, y, 'JUGGERNAUT', level);
        this.unstoppable = false;
        this.unstoppableDuration = 0;
        this.groundSlamCooldown = 0;
        this.armorPlating = 0.4; // 40% damage reduction
        this.chargeTarget = null;
        this.isCharging = false;
        this.chargeSpeed = 6;
        this.chargeDamage = this.damage * 2;
    }

    updateJuggernautBehavior(targets, walls) {
        const now = Date.now();
        const closestTarget = this.findClosestTarget(targets);

        // Update unstoppable mode
        if (this.unstoppable) {
            this.unstoppableDuration -= 16;
            if (this.unstoppableDuration <= 0) {
                this.unstoppable = false;
            }
        }

        // Ground slam when enemies are close
        if (closestTarget && now - this.groundSlamCooldown > 8000) {
            const distance = getDistance(this.x, this.y, closestTarget.x, closestTarget.y);
            if (distance < 120) {
                this.groundSlam(targets);
                this.groundSlamCooldown = now;
            }
        }

        // Slow but relentless pursuit
        if (closestTarget && !this.isCharging) {
            const angle = getAngle(this.x, this.y, closestTarget.x, closestTarget.y);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;

            // Create heavy footstep particles
            if (Math.random() < 0.3) {
                createParticles(this.x, this.y, '#ff8800', 2);
            }
        }
    }

    groundSlam(targets) {
        const slamRadius = 150;
        const slamDamage = this.damage * 1.5;

        // Damage all entities in radius
        targets.forEach(target => {
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance <= slamRadius) {
                const damageMultiplier = 1 - (distance / slamRadius);
                target.takeDamage(slamDamage * damageMultiplier);

                // Knockback
                const angle = getAngle(this.x, this.y, target.x, target.y);
                const knockback = (1 - damageMultiplier) * 30;
                target.x += Math.cos(angle) * knockback;
                target.y += Math.sin(angle) * knockback;

                createParticles(target.x, target.y, '#ff8800', 10);
            }
        });

        // Visual effect
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = Math.random() * slamRadius;
            createParticles(
                this.x + Math.cos(angle) * distance,
                this.y + Math.sin(angle) * distance,
                '#ff8800', 5
            );
        }

        playSound('ground_slam', 0.8);

        // Screen shake
        if (typeof gameManager !== 'undefined' && gameManager && gameManager.renderer && gameManager.renderer.addScreenShake) {
            gameManager.renderer.addScreenShake(20, 800);
        }
    }

    takeDamage(amount) {
        // Apply armor plating
        amount *= (1 - this.armorPlating);

        super.takeDamage(amount);

        // Activate unstoppable when heavily damaged
        if (!this.unstoppable && this.health < this.maxHealth * 0.3) {
            this.activateUnstoppable();
        }
    }

    activateUnstoppable() {
        this.unstoppable = true;
        this.unstoppableDuration = 5000;
        this.speed *= 1.5;
        this.armorPlating = 0.7; // Increased armor

        createParticles(this.x, this.y, '#ff8800', 30);
        playSound('unstoppable', 0.7);
    }

    useSpecialAbility(targets) {
        // Armor repair - restore some health and increase armor
        this.health = Math.min(this.maxHealth, this.health + 100);
        this.armorPlating = Math.min(0.8, this.armorPlating + 0.1);

        createParticles(this.x, this.y, '#ff8800', 25);
        playSound('armor_repair', 0.5);
    }

    render(ctx) {
        super.render(ctx);

        // Draw armor plating effect
        ctx.save();
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 4;
        ctx.globalAlpha = this.armorPlating;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Unstoppable effect
        if (this.unstoppable) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 6;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }
}

// Elite Manager Class
class EliteManager {
    constructor() {
        this.eliteSpawnChance = 0.15; // 15% base chance
        this.maxElitesPerWave = 2;
        this.eliteSpawnCooldown = 0;
        this.lastEliteSpawn = 0;
        this.wavesSinceLastElite = 0;
    }

    shouldSpawnElite(wave, enemyCount) {
        // Don't spawn elites in first 3 waves
        if (wave < 4) return false;

        // Guaranteed elite after 5 waves without one
        if (this.wavesSinceLastElite >= 5) {
            this.wavesSinceLastElite = 0;
            return true;
        }

        // Increase chance based on wave number
        const waveMultiplier = 1 + (wave - 3) * 0.05;
        const adjustedChance = this.eliteSpawnChance * waveMultiplier;

        // Limit elite density (max 30% of enemies can be elite)
        const maxElites = Math.floor(enemyCount * 0.3);

        return Math.random() < adjustedChance && maxElites > 0;
    }

    selectEliteType(wave) {
        // Weight selection based on wave difficulty
        const weights = {};

        Object.entries(ELITE_CONFIGS).forEach(([type, config]) => {
            let weight = config.spawnWeight;

            // Adjust weights based on wave
            if (wave < 8) {
                // Early waves: prefer simpler elites
                if (type === 'SNIPER' || type === 'BERSERKER') weight *= 1.5;
                if (type === 'JUGGERNAUT' || type === 'PHANTOM') weight *= 0.3;
            } else if (wave < 15) {
                // Mid waves: balanced
                if (type === 'GUARDIAN' || type === 'HEALER') weight *= 1.2;
            } else {
                // Late waves: prefer powerful elites
                if (type === 'JUGGERNAUT' || type === 'PHANTOM') weight *= 1.5;
                if (type === 'SUMMONER') weight *= 1.3;
            }

            weights[type] = weight;
        });

        // Select based on weights
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (const [type, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return type;
        }

        return 'BERSERKER'; // Fallback
    }

    createElite(x, y, type, level) {
        switch(type) {
            case 'SNIPER': return new SniperElite(x, y, level);
            case 'BERSERKER': return new BerserkerElite(x, y, level);
            case 'GUARDIAN': return new GuardianElite(x, y, level);
            case 'HEALER': return new HealerElite(x, y, level);
            case 'SUMMONER': return new SummonerElite(x, y, level);
            case 'PHANTOM': return new PhantomElite(x, y, level);
            case 'JUGGERNAUT': return new JuggernautElite(x, y, level);
            default: return new BerserkerElite(x, y, level);
        }
    }

    onWaveComplete() {
        this.wavesSinceLastElite++;
    }

    onEliteSpawned() {
        this.wavesSinceLastElite = 0;
        this.lastEliteSpawn = Date.now();
    }
}
