// Power-Up System for Herumballerpunkt
// Implements all 6 power-up types with visual effects and gameplay mechanics

// Power-Up Configuration
const POWER_UP_CONFIGS = {
    BERSERKER: {
        name: 'Berserker',
        duration: 15000,
        rarity: 'common',
        color: '#ff4444',
        glowColor: '#ff8888',
        spawnWeight: 25,
        effects: {
            fireRateMultiplier: 3.0,
            damageMultiplier: 1.5,
            infiniteAmmo: true
        }
    },
    BULLET_TIME: {
        name: 'Zeitlupe',
        duration: 10000,
        rarity: 'rare',
        color: '#44ffff',
        glowColor: '#88ffff',
        spawnWeight: 15,
        effects: {
            enemySpeedMultiplier: 0.5,
            bulletSpeedMultiplier: 0.5
        }
    },
    SHIELD: {
        name: 'Schild',
        duration: 20000,
        rarity: 'common',
        color: '#4444ff',
        glowColor: '#8888ff',
        spawnWeight: 25,
        effects: {
            hitAbsorption: 5,
            shieldAura: true
        }
    },
    MAGNET: {
        name: 'Magnetfeld',
        duration: 12000,
        rarity: 'common',
        color: '#ffff44',
        glowColor: '#ffff88',
        spawnWeight: 20,
        effects: {
            magnetRadius: 150,
            pickupSpeedMultiplier: 2.0
        }
    },
    GHOST: {
        name: 'Geister-Modus',
        duration: 8000,
        rarity: 'rare',
        color: '#ff44ff',
        glowColor: '#ff88ff',
        spawnWeight: 10,
        effects: {
            phaseThrough: true,
            transparency: 0.5
        }
    },
    EXPLOSION_AURA: {
        name: 'Explosions-Aura',
        duration: 15000,
        rarity: 'rare',
        color: '#ff8844',
        glowColor: '#ffaa88',
        spawnWeight: 15,
        effects: {
            explosionOnKill: true,
            explosionRadius: 80,
            explosionDamage: 40
        }
    }
};

// PowerUp Class
class PowerUp {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.lifetime = 15000; // 15 seconds until despawn
        this.created = Date.now();
        this.rotation = 0;
        this.pulseTimer = 0;
        this.config = POWER_UP_CONFIGS[type];
        this.bobOffset = Math.random() * Math.PI * 2;
        this.originalY = y;
    }
    
    update() {
        this.rotation += 0.05;
        this.pulseTimer += 0.1;
        
        // Floating animation
        this.y = this.originalY + Math.sin(Date.now() * 0.003 + this.bobOffset) * 5;
        
        return Date.now() - this.created < this.lifetime;
    }
    
    render(ctx) {
        const pulse = 1 + Math.sin(this.pulseTimer) * 0.3;
        const alpha = Math.min(1, (this.lifetime - (Date.now() - this.created)) / 3000);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = alpha;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * pulse * 2);
        gradient.addColorStop(0, this.config.glowColor + '80');
        gradient.addColorStop(0.5, this.config.glowColor + '40');
        gradient.addColorStop(1, this.config.glowColor + '00');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.radius * pulse * 2, -this.radius * pulse * 2, 
                    this.radius * pulse * 4, this.radius * pulse * 4);
        
        // Main power-up circle
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = '#ffffff80';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Type-specific icon
        this.renderIcon(ctx, pulse);
        
        ctx.restore();
        
        // Particle trail
        if (Math.random() < 0.3) {
            createParticles(this.x, this.y, this.config.color, 1);
        }
    }
    
    renderIcon(ctx, pulse) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.floor(this.radius * pulse)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '';
        switch(this.type) {
            case 'BERSERKER': icon = '⚔'; break;
            case 'BULLET_TIME': icon = '⏱'; break;
            case 'SHIELD': icon = '🛡'; break;
            case 'MAGNET': icon = '🧲'; break;
            case 'GHOST': icon = '👻'; break;
            case 'EXPLOSION_AURA': icon = '💥'; break;
        }
        
        ctx.fillText(icon, 0, 0);
    }
}

// PowerUpManager Class
class PowerUpManager {
    constructor() {
        this.activePowerUps = new Map();
        this.spawnedPowerUps = [];
        this.lastSpawn = 0;
        this.spawnCooldown = 5000;
        this.wavesWithoutPowerUp = 0;
    }
    
    update(gameManager) {
        // Update spawned power-ups
        this.spawnedPowerUps = this.spawnedPowerUps.filter(powerUp => {
            const stillAlive = powerUp.update();
            if (!stillAlive) {
                createParticles(powerUp.x, powerUp.y, powerUp.config.color, 10);
            }
            return stillAlive;
        });
        
        // Update active power-ups
        this.updateActivePowerUps(gameManager);
        
        // Check for pickup collisions
        this.checkPickupCollisions(gameManager);
    }
    
    updateActivePowerUps(gameManager) {
        const now = Date.now();
        const toRemove = [];
        
        this.activePowerUps.forEach((powerUp, type) => {
            if (now - powerUp.startTime >= powerUp.duration) {
                this.deactivatePowerUp(type, gameManager);
                toRemove.push(type);
            } else {
                // Apply continuous effects
                this.applyContinuousEffects(type, powerUp, gameManager);
            }
        });
        
        toRemove.forEach(type => this.activePowerUps.delete(type));
    }
    
    checkPickupCollisions(gameManager) {
        this.spawnedPowerUps = this.spawnedPowerUps.filter(powerUp => {
            if (checkCollision(powerUp, gameManager.player)) {
                this.activatePowerUp(powerUp.type, gameManager);
                createParticles(powerUp.x, powerUp.y, powerUp.config.color, 20);
                playSound('powerup', 0.5);
                return false;
            }
            return true;
        });
    }
    
    spawnPowerUp(x, y, forceType = null) {
        if (this.spawnedPowerUps.length >= 2) return; // Max 2 on screen
        
        const type = forceType || this.selectRandomType();
        const powerUp = new PowerUp(type, x, y);
        this.spawnedPowerUps.push(powerUp);
        
        createParticles(x, y, POWER_UP_CONFIGS[type].color, 15);
        playSound('spawn', 0.3);
    }
    
    selectRandomType() {
        const totalWeight = Object.values(POWER_UP_CONFIGS).reduce((sum, config) => sum + config.spawnWeight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, config] of Object.entries(POWER_UP_CONFIGS)) {
            random -= config.spawnWeight;
            if (random <= 0) return type;
        }
        
        return 'BERSERKER'; // Fallback
    }
    
    activatePowerUp(type, gameManager) {
        const config = POWER_UP_CONFIGS[type];
        
        // If same type is already active, extend duration
        if (this.activePowerUps.has(type)) {
            const existing = this.activePowerUps.get(type);
            existing.startTime = Date.now();
        } else {
            this.activePowerUps.set(type, {
                startTime: Date.now(),
                duration: config.duration,
                config: config,
                originalValues: {}
            });
        }
        
        this.applyPowerUpEffects(type, gameManager);
        
        // Visual and audio feedback
        this.createActivationEffect(type, gameManager);
    }
    
    applyPowerUpEffects(type, gameManager) {
        const powerUp = this.activePowerUps.get(type);
        const config = powerUp.config;
        
        switch(type) {
            case 'BERSERKER':
                // Store original values
                if (!powerUp.originalValues.fireRate) {
                    powerUp.originalValues.fireRate = gameManager.player.weaponSystem.weapons.map(w => w.fireRate);
                }
                // Apply berserker effects
                gameManager.player.weaponSystem.weapons.forEach(weapon => {
                    weapon.fireRate = Math.floor(weapon.fireRate / config.effects.fireRateMultiplier);
                });
                gameManager.player.berserkerMode = true;
                break;
                
            case 'SHIELD':
                gameManager.player.shieldHits = config.effects.hitAbsorption;
                gameManager.player.hasShield = true;
                break;
                
            case 'GHOST':
                gameManager.player.ghostMode = true;
                break;
                
            case 'MAGNET':
                gameManager.player.magnetMode = true;
                gameManager.player.magnetRadius = config.effects.magnetRadius;
                break;
        }
    }
    
    applyContinuousEffects(type, powerUp, gameManager) {
        const config = powerUp.config;
        
        switch(type) {
            case 'BULLET_TIME':
                // Apply slow motion to enemies and bullets
                gameManager.enemies.forEach(enemy => {
                    if (!enemy.originalSpeed) enemy.originalSpeed = enemy.speed;
                    enemy.speed = enemy.originalSpeed * config.effects.enemySpeedMultiplier;
                });
                break;
                
            case 'MAGNET':
                // Attract pickups
                gameManager.pickups.forEach(pickup => {
                    const distance = getDistance(pickup.x, pickup.y, gameManager.player.x, gameManager.player.y);
                    if (distance < gameManager.player.magnetRadius) {
                        const angle = getAngle(pickup.x, pickup.y, gameManager.player.x, gameManager.player.y);
                        const force = (gameManager.player.magnetRadius - distance) / gameManager.player.magnetRadius * 5;
                        pickup.x += Math.cos(angle) * force;
                        pickup.y += Math.sin(angle) * force;
                    }
                });
                break;
        }
    }
    
    deactivatePowerUp(type, gameManager) {
        const powerUp = this.activePowerUps.get(type);
        if (!powerUp) return;
        
        switch(type) {
            case 'BERSERKER':
                // Restore original fire rates
                if (powerUp.originalValues.fireRate) {
                    gameManager.player.weaponSystem.weapons.forEach((weapon, index) => {
                        weapon.fireRate = powerUp.originalValues.fireRate[index];
                    });
                }
                gameManager.player.berserkerMode = false;
                break;
                
            case 'BULLET_TIME':
                // Restore enemy speeds
                gameManager.enemies.forEach(enemy => {
                    if (enemy.originalSpeed) {
                        enemy.speed = enemy.originalSpeed;
                        delete enemy.originalSpeed;
                    }
                });
                break;
                
            case 'SHIELD':
                gameManager.player.hasShield = false;
                gameManager.player.shieldHits = 0;
                break;
                
            case 'GHOST':
                gameManager.player.ghostMode = false;
                break;
                
            case 'MAGNET':
                gameManager.player.magnetMode = false;
                break;
        }
        
        // Warning effect before deactivation
        createParticles(gameManager.player.x, gameManager.player.y, powerUp.config.color, 10);
        playSound('powerup_end', 0.3);
    }
    
    createActivationEffect(type, gameManager) {
        const config = POWER_UP_CONFIGS[type];
        
        // Screen flash effect
        if (gameManager.renderer && gameManager.renderer.addScreenEffect) {
            gameManager.renderer.addScreenEffect('flash', config.color, 500);
        }
        
        // Particle burst
        createParticles(gameManager.player.x, gameManager.player.y, config.color, 30);
        
        // Screen shake for powerful power-ups
        if (type === 'BERSERKER' || type === 'EXPLOSION_AURA') {
            if (gameManager.renderer && gameManager.renderer.addScreenShake) {
                gameManager.renderer.addScreenShake(10, 300);
            }
        }
    }
    
    render(ctx) {
        this.spawnedPowerUps.forEach(powerUp => powerUp.render(ctx));
    }
    
    // Check if power-up should spawn based on game events
    shouldSpawnPowerUp(eventType, gameManager) {
        const now = Date.now();
        
        switch(eventType) {
            case 'enemy_kill':
                return Math.random() < 0.15; // 15% chance
            case 'elite_kill':
                return Math.random() < 0.50; // 50% chance
            case 'boss_kill':
                return true; // 100% chance
            case 'wave_complete':
                this.wavesWithoutPowerUp++;
                if (this.wavesWithoutPowerUp >= 3) {
                    this.wavesWithoutPowerUp = 0;
                    return true; // Guaranteed after 3 waves
                }
                return false;
        }
        
        return false;
    }
}
