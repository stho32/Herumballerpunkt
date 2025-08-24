// Environmental Hazards System for Herumballerpunkt
// Implements all 6 hazard types with warning systems and strategic interaction

// Hazard Configuration
const HAZARD_CONFIGS = {
    LASER_GRID: {
        name: 'Laser-Grid',
        warningTime: 3000,
        activeTime: 8000,
        cooldown: 15000,
        color: '#ff0000',
        warningColor: '#ff4444',
        spawnWeight: 20,
        effects: {
            instantKill: true,
            affectsAll: true
        }
    },
    METEOR_SHOWER: {
        name: 'Meteor-Schauer',
        warningTime: 2000,
        activeTime: 12000,
        cooldown: 20000,
        color: '#ff8800',
        warningColor: '#ffaa44',
        spawnWeight: 25,
        effects: {
            explosionRadius: 50,
            explosionDamage: 80,
            meteorCount: 8
        }
    },
    POISON_GAS: {
        name: 'Giftgas-Wolken',
        warningTime: 2000,
        activeTime: 20000,
        cooldown: 25000,
        color: '#44ff44',
        warningColor: '#88ff88',
        spawnWeight: 15,
        effects: {
            dotDamage: 5,
            dotInterval: 500,
            visionReduction: 0.5,
            windSpeed: 1
        }
    },
    ELECTRIC_STORM: {
        name: 'Elektro-Sturm',
        warningTime: 2000,
        activeTime: 10000,
        cooldown: 18000,
        color: '#4444ff',
        warningColor: '#8888ff',
        spawnWeight: 20,
        effects: {
            stunDuration: 2000,
            stunDamage: 30,
            disableElectronics: true
        }
    },
    GRAVITY_ANOMALY: {
        name: 'Schwerkraft-Anomalie',
        warningTime: 2000,
        activeTime: 15000,
        cooldown: 22000,
        color: '#ff44ff',
        warningColor: '#ff88ff',
        spawnWeight: 10,
        effects: {
            speedMultiplier: 0.3,
            projectileDeflection: true,
            jumpBoost: 2.0
        }
    },
    TEMPORAL_RIFT: {
        name: 'Temporale Risse',
        warningTime: 1500,
        activeTime: 6000,
        cooldown: 15000,
        color: '#ffff44',
        warningColor: '#ffff88',
        spawnWeight: 8,
        effects: {
            timeSlowdown: 0.3,
            radius: 120
        }
    }
};

// Base Environmental Hazard Class
class EnvironmentalHazard {
    constructor(type, x, y, config) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.config = config || HAZARD_CONFIGS[type];
        this.state = 'warning'; // warning, active, fading
        this.timer = 0;
        this.warningDuration = this.config.warningTime;
        this.activeDuration = this.config.activeTime;
        this.affectedEntities = new Set();
        this.created = Date.now();
        this.pulseTimer = 0;
        this.radius = 100; // Base radius
        this.warningShown = false;
    }
    
    update(entities) {
        this.timer += 16; // Assuming 60 FPS
        this.pulseTimer += 0.1;
        
        switch(this.state) {
            case 'warning':
                if (!this.warningShown) {
                    this.showWarning();
                    this.warningShown = true;
                }
                
                if (this.timer >= this.warningDuration) {
                    this.state = 'active';
                    this.timer = 0;
                    this.onActivate();
                }
                break;
                
            case 'active':
                this.updateActiveEffects(entities);
                if (this.timer >= this.activeDuration) {
                    this.state = 'fading';
                    this.onDeactivate();
                }
                break;
                
            case 'fading':
                return false; // Mark for removal
        }
        
        return true;
    }
    
    showWarning() {
        // Play warning sound
        playSound('hazard_warning', 0.4);
        
        // Create warning particles
        createParticles(this.x, this.y, this.config.warningColor, 15);
    }
    
    onActivate() {
        // Play activation sound
        playSound('hazard_activate', 0.5);
        
        // Create activation effect
        createParticles(this.x, this.y, this.config.color, 25);
    }
    
    onDeactivate() {
        // Create deactivation effect
        createParticles(this.x, this.y, '#888888', 10);
    }
    
    updateActiveEffects(entities) {
        // Override in subclasses
    }
    
    checkCollision(entity) {
        // Override in subclasses
        const distance = getDistance(this.x, this.y, entity.x, entity.y);
        return distance <= this.radius;
    }
    
    applyEffect(entity) {
        // Override in subclasses
    }
    
    render(ctx) {
        const alpha = this.state === 'warning' ? 0.5 + Math.sin(this.pulseTimer) * 0.3 : 0.8;
        const color = this.state === 'warning' ? this.config.warningColor : this.config.color;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Draw hazard area
        ctx.strokeStyle = color;
        ctx.lineWidth = this.state === 'warning' ? 3 : 5;
        ctx.setLineDash(this.state === 'warning' ? [10, 10] : []);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw warning countdown
        if (this.state === 'warning') {
            const timeLeft = Math.ceil((this.warningDuration - this.timer) / 1000);
            ctx.fillStyle = color;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(timeLeft.toString(), this.x, this.y);
        }
        
        ctx.restore();
        
        // Type-specific rendering
        this.renderSpecific(ctx);
    }
    
    renderSpecific(ctx) {
        // Override in subclasses
    }
}

// Laser Grid Hazard
class LaserGrid extends EnvironmentalHazard {
    constructor(x, y) {
        super('LASER_GRID', x, y);
        this.laserLines = this.generateLaserPattern();
        this.radius = 0; // Covers entire screen
    }
    
    generateLaserPattern() {
        const lines = [];
        const spacing = 80;
        const offset = Math.random() * spacing;
        const isVertical = Math.random() < 0.5;
        
        if (isVertical) {
            // Vertical lines
            for (let x = offset; x < canvas.width; x += spacing) {
                lines.push({
                    x1: x, y1: 0,
                    x2: x, y2: canvas.height,
                    type: 'vertical'
                });
            }
        } else {
            // Horizontal lines
            for (let y = offset; y < canvas.height; y += spacing) {
                lines.push({
                    x1: 0, y1: y,
                    x2: canvas.width, y2: y,
                    type: 'horizontal'
                });
            }
        }
        
        return lines;
    }
    
    updateActiveEffects(entities) {
        if (this.state !== 'active') return;
        
        entities.forEach(entity => {
            if (this.checkLaserCollision(entity)) {
                this.applyEffect(entity);
            }
        });
    }
    
    checkLaserCollision(entity) {
        return this.laserLines.some(line => {
            return this.lineCircleIntersection(line, entity);
        });
    }
    
    lineCircleIntersection(line, entity) {
        const dx = line.x2 - line.x1;
        const dy = line.y2 - line.y1;
        const fx = line.x1 - entity.x;
        const fy = line.y1 - entity.y;
        
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = (fx * fx + fy * fy) - entity.radius * entity.radius;
        
        const discriminant = b * b - 4 * a * c;
        return discriminant >= 0;
    }
    
    applyEffect(entity) {
        // Instant kill for laser grid
        entity.takeDamage(9999);
        createParticles(entity.x, entity.y, '#ff0000', 20);
        playSound('laser_hit', 0.6);
    }
    
    renderSpecific(ctx) {
        if (this.state === 'active') {
            ctx.save();
            ctx.strokeStyle = this.config.color;
            ctx.lineWidth = 4;
            ctx.shadowColor = this.config.color;
            ctx.shadowBlur = 10;
            
            this.laserLines.forEach(line => {
                ctx.beginPath();
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
                ctx.stroke();
            });
            
            ctx.restore();
        }
    }
}

// Meteor Shower Hazard
class MeteorShower extends EnvironmentalHazard {
    constructor(x, y) {
        super('METEOR_SHOWER', x, y);
        this.meteors = [];
        this.generateMeteors();
        this.radius = 0; // Covers entire screen
    }
    
    generateMeteors() {
        const count = this.config.effects.meteorCount;
        for (let i = 0; i < count; i++) {
            this.meteors.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                impactTime: 1000 + Math.random() * (this.activeDuration - 1000),
                radius: this.config.effects.explosionRadius,
                warned: false,
                impacted: false
            });
        }
    }
    
    updateActiveEffects(entities) {
        const currentTime = this.timer;
        
        this.meteors.forEach(meteor => {
            // Show warning 2 seconds before impact
            if (!meteor.warned && currentTime >= meteor.impactTime - 2000) {
                meteor.warned = true;
                createParticles(meteor.x, meteor.y, this.config.warningColor, 10);
                playSound('meteor_warning', 0.3);
            }
            
            // Impact
            if (!meteor.impacted && currentTime >= meteor.impactTime) {
                meteor.impacted = true;
                this.meteorImpact(meteor, entities);
            }
        });
    }
    
    meteorImpact(meteor, entities) {
        // Visual and audio effects
        createParticles(meteor.x, meteor.y, this.config.color, 30);
        createParticles(meteor.x, meteor.y, '#ffff00', 20);
        playSound('explosion', 0.7);
        
        // Damage entities in radius
        entities.forEach(entity => {
            const distance = getDistance(meteor.x, meteor.y, entity.x, entity.y);
            if (distance <= meteor.radius) {
                const damageMultiplier = 1 - (distance / meteor.radius);
                const damage = this.config.effects.explosionDamage * damageMultiplier;
                entity.takeDamage(damage);
                
                // Knockback effect
                const angle = getAngle(meteor.x, meteor.y, entity.x, entity.y);
                const knockback = (1 - damageMultiplier) * 20;
                entity.x += Math.cos(angle) * knockback;
                entity.y += Math.sin(angle) * knockback;
            }
        });
    }
    
    renderSpecific(ctx) {
        this.meteors.forEach(meteor => {
            if (meteor.warned && !meteor.impacted) {
                // Draw target circle
                const timeToImpact = meteor.impactTime - this.timer;
                const alpha = Math.max(0.3, Math.sin(Date.now() * 0.01) * 0.5 + 0.5);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.config.warningColor;
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Countdown
                const countdown = Math.ceil(timeToImpact / 1000);
                if (countdown > 0) {
                    ctx.fillStyle = this.config.warningColor;
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(countdown.toString(), meteor.x, meteor.y);
                }
                
                ctx.restore();
            }
        });
    }
}

// Poison Gas Hazard
class PoisonGas extends EnvironmentalHazard {
    constructor(x, y) {
        super('POISON_GAS', x, y);
        this.radius = 120;
        this.lastDotTime = 0;
        this.windDirection = Math.random() * Math.PI * 2;
        this.windSpeed = this.config.effects.windSpeed;
    }

    updateActiveEffects(entities) {
        // Move gas cloud with wind
        this.x += Math.cos(this.windDirection) * this.windSpeed;
        this.y += Math.sin(this.windDirection) * this.windSpeed;

        // Keep within bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

        // Apply DoT damage
        const now = Date.now();
        if (now - this.lastDotTime >= this.config.effects.dotInterval) {
            this.lastDotTime = now;

            entities.forEach(entity => {
                if (this.checkCollision(entity)) {
                    this.applyEffect(entity);
                }
            });
        }

        // Create poison particles
        if (Math.random() < 0.3) {
            createParticles(
                this.x + (Math.random() - 0.5) * this.radius * 2,
                this.y + (Math.random() - 0.5) * this.radius * 2,
                this.config.color, 1
            );
        }
    }

    applyEffect(entity) {
        entity.takeDamage(this.config.effects.dotDamage);

        // Visual poison effect
        if (Math.random() < 0.1) {
            createParticles(entity.x, entity.y, '#44ff44', 3);
        }

        // Apply vision reduction (if player)
        if (typeof gameManager !== 'undefined' && gameManager && entity === gameManager.player) {
            entity.visionReduced = true;
        }
    }

    renderSpecific(ctx) {
        if (this.state === 'active') {
            // Draw gas cloud
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, this.config.color + '60');
            gradient.addColorStop(0.7, this.config.color + '30');
            gradient.addColorStop(1, this.config.color + '00');

            ctx.save();
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// Electric Storm Hazard
class ElectricStorm extends EnvironmentalHazard {
    constructor(x, y) {
        super('ELECTRIC_STORM', x, y);
        this.radius = 150;
        this.lightningBolts = [];
        this.lastLightning = 0;
        this.stunned = new Set();
    }

    updateActiveEffects(entities) {
        const now = Date.now();

        // Generate lightning bolts
        if (now - this.lastLightning >= 800) {
            this.lastLightning = now;
            this.generateLightning(entities);
        }

        // Update lightning bolts
        this.lightningBolts = this.lightningBolts.filter(bolt => {
            bolt.lifetime -= 16;
            return bolt.lifetime > 0;
        });

        // Remove stun effects
        this.stunned.forEach(entity => {
            if (now - entity.stunTime >= this.config.effects.stunDuration) {
                entity.stunned = false;
                this.stunned.delete(entity);
            }
        });
    }

    generateLightning(entities) {
        // Find entities in range
        const targets = entities.filter(entity => this.checkCollision(entity));

        if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];

            // Create lightning bolt
            this.lightningBolts.push({
                x1: this.x + (Math.random() - 0.5) * 40,
                y1: this.y + (Math.random() - 0.5) * 40,
                x2: target.x,
                y2: target.y,
                lifetime: 200,
                segments: this.generateLightningSegments(this.x, this.y, target.x, target.y)
            });

            // Apply stun effect
            this.applyEffect(target);

            // Visual and audio
            createParticles(target.x, target.y, '#4444ff', 15);
            playSound('lightning', 0.5);
        }
    }

    generateLightningSegments(x1, y1, x2, y2) {
        const segments = [];
        const numSegments = 8;
        const dx = (x2 - x1) / numSegments;
        const dy = (y2 - y1) / numSegments;

        let currentX = x1;
        let currentY = y1;

        for (let i = 0; i < numSegments; i++) {
            const nextX = x1 + dx * (i + 1) + (Math.random() - 0.5) * 20;
            const nextY = y1 + dy * (i + 1) + (Math.random() - 0.5) * 20;

            segments.push({
                x1: currentX, y1: currentY,
                x2: nextX, y2: nextY
            });

            currentX = nextX;
            currentY = nextY;
        }

        return segments;
    }

    applyEffect(entity) {
        entity.takeDamage(this.config.effects.stunDamage);
        entity.stunned = true;
        entity.stunTime = Date.now();
        this.stunned.add(entity);

        // Disable electronics (turrets, etc.)
        if (entity.type === 'turret') {
            entity.disabled = true;
            entity.disableTime = Date.now();
        }
    }

    renderSpecific(ctx) {
        if (this.state === 'active') {
            // Draw storm cloud
            ctx.save();
            ctx.fillStyle = this.config.color + '40';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw lightning bolts
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#4444ff';
            ctx.shadowBlur = 10;

            this.lightningBolts.forEach(bolt => {
                bolt.segments.forEach(segment => {
                    ctx.beginPath();
                    ctx.moveTo(segment.x1, segment.y1);
                    ctx.lineTo(segment.x2, segment.y2);
                    ctx.stroke();
                });
            });

            ctx.restore();
        }
    }
}

// Gravity Anomaly Hazard
class GravityAnomaly extends EnvironmentalHazard {
    constructor(x, y) {
        super('GRAVITY_ANOMALY', x, y);
        this.radius = 140;
        this.affectedProjectiles = new Set();
    }

    updateActiveEffects(entities) {
        entities.forEach(entity => {
            if (this.checkCollision(entity)) {
                this.applyEffect(entity);
            }
        });

        // Affect projectiles
        if (typeof gameManager !== 'undefined' && gameManager && gameManager.bullets) {
            gameManager.bullets.forEach(bullet => {
                if (this.checkCollision(bullet)) {
                    this.affectProjectile(bullet);
                }
            });
        }
    }

    applyEffect(entity) {
        // Slow down movement
        if (!entity.originalSpeed) {
            entity.originalSpeed = entity.speed;
        }
        entity.speed = entity.originalSpeed * this.config.effects.speedMultiplier;

        // Visual effect
        if (Math.random() < 0.05) {
            createParticles(entity.x, entity.y, this.config.color, 2);
        }
    }

    affectProjectile(bullet) {
        if (!this.affectedProjectiles.has(bullet)) {
            this.affectedProjectiles.add(bullet);

            // Deflect projectile
            const angle = getAngle(this.x, this.y, bullet.x, bullet.y);
            const deflectionAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;

            bullet.dx = Math.cos(deflectionAngle) * bullet.speed;
            bullet.dy = Math.sin(deflectionAngle) * bullet.speed;

            createParticles(bullet.x, bullet.y, this.config.color, 5);
        }
    }

    renderSpecific(ctx) {
        if (this.state === 'active') {
            // Draw gravity field
            ctx.save();

            // Pulsing gravity rings
            const time = Date.now() * 0.003;
            for (let i = 0; i < 3; i++) {
                const ringRadius = this.radius * (0.3 + i * 0.3) + Math.sin(time + i) * 10;
                ctx.strokeStyle = this.config.color + Math.floor(80 - i * 20).toString(16);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }
}

// Temporal Rift Hazard
class TemporalRift extends EnvironmentalHazard {
    constructor(x, y) {
        super('TEMPORAL_RIFT', x, y);
        this.radius = this.config.effects.radius;
        this.timeField = [];
        this.generateTimeField();
    }

    generateTimeField() {
        // Create swirling time distortion pattern
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = Math.random() * this.radius;
            this.timeField.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                angle: angle,
                distance: distance,
                speed: 0.02 + Math.random() * 0.03
            });
        }
    }

    updateActiveEffects(entities) {
        // Update time field animation
        this.timeField.forEach(point => {
            point.angle += point.speed;
            point.x = this.x + Math.cos(point.angle) * point.distance;
            point.y = this.y + Math.sin(point.angle) * point.distance;
        });

        // Apply time slowdown to entities
        entities.forEach(entity => {
            if (this.checkCollision(entity)) {
                this.applyEffect(entity);
            }
        });
    }

    applyEffect(entity) {
        // Apply time slowdown
        if (!entity.timeSlowed) {
            entity.timeSlowed = true;
            entity.originalUpdateRate = entity.updateRate || 1;
            entity.updateRate = entity.originalUpdateRate * this.config.effects.timeSlowdown;
        }

        // Visual time distortion effect
        if (Math.random() < 0.1) {
            createParticles(entity.x, entity.y, this.config.color, 3);
        }
    }

    renderSpecific(ctx) {
        if (this.state === 'active') {
            ctx.save();

            // Draw temporal rift
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, this.config.color + '80');
            gradient.addColorStop(0.5, this.config.color + '40');
            gradient.addColorStop(1, this.config.color + '00');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw time field particles
            ctx.fillStyle = this.config.color;
            this.timeField.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
        }
    }
}

// Hazard Manager Class
class HazardManager {
    constructor() {
        this.activeHazards = [];
        this.lastSpawn = 0;
        this.spawnCooldown = 8000; // 8 seconds base cooldown
        this.maxActiveHazards = 2;
        this.difficultyMultiplier = 1;
        this.wavesSinceLastHazard = 0;
    }

    update(gameManager) {
        const now = Date.now();

        // Update existing hazards
        this.activeHazards = this.activeHazards.filter(hazard => {
            const stillActive = hazard.update(this.getAllEntities(gameManager));
            if (!stillActive) {
                this.onHazardEnd(hazard, gameManager);
            }
            return stillActive;
        });

        // Check for new hazard spawn
        this.checkSpawnConditions(gameManager, now);

        // Update difficulty
        this.updateDifficulty(gameManager);
    }

    getAllEntities(gameManager) {
        const entities = [];

        if (gameManager.player) entities.push(gameManager.player);
        entities.push(...gameManager.enemies);
        entities.push(...gameManager.allies);
        entities.push(...gameManager.turrets);

        // Add squad members
        gameManager.enemySquads.forEach(squad => {
            entities.push(...squad.members);
        });

        return entities;
    }

    checkSpawnConditions(gameManager, now) {
        // Don't spawn if at max capacity
        if (this.activeHazards.length >= this.maxActiveHazards) return;

        // Check cooldown
        if (now - this.lastSpawn < this.spawnCooldown / this.difficultyMultiplier) return;

        // Guaranteed spawn after 4 waves without hazard
        if (this.wavesSinceLastHazard >= 4) {
            this.spawnRandomHazard(gameManager);
            this.wavesSinceLastHazard = 0;
            return;
        }

        // Random spawn chance based on game state
        const spawnChance = this.calculateSpawnChance(gameManager);
        if (Math.random() < spawnChance) {
            this.spawnRandomHazard(gameManager);
        }
    }

    calculateSpawnChance(gameManager) {
        let baseChance = 0.02; // 2% per update cycle

        // Increase chance based on wave number
        baseChance += gameManager.wave * 0.001;

        // Increase chance if many enemies are present
        const enemyCount = gameManager.enemies.length +
                          gameManager.enemySquads.reduce((sum, squad) => sum + squad.members.length, 0);
        baseChance += enemyCount * 0.0005;

        // Increase chance based on difficulty
        baseChance *= this.difficultyMultiplier;

        return Math.min(baseChance, 0.1); // Cap at 10%
    }

    spawnRandomHazard(gameManager) {
        const hazardType = this.selectRandomHazardType();
        const position = this.selectSpawnPosition(gameManager, hazardType);

        if (position) {
            this.spawnHazard(hazardType, position.x, position.y);
            this.lastSpawn = Date.now();
            this.wavesSinceLastHazard = 0;
        }
    }

    selectRandomHazardType() {
        const totalWeight = Object.values(HAZARD_CONFIGS).reduce((sum, config) => sum + config.spawnWeight, 0);
        let random = Math.random() * totalWeight;

        for (const [type, config] of Object.entries(HAZARD_CONFIGS)) {
            random -= config.spawnWeight;
            if (random <= 0) return type;
        }

        return 'LASER_GRID'; // Fallback
    }

    selectSpawnPosition(gameManager, hazardType) {
        // Different positioning strategies for different hazards
        switch(hazardType) {
            case 'LASER_GRID':
                return { x: canvas.width / 2, y: canvas.height / 2 }; // Center for screen-wide effect

            case 'METEOR_SHOWER':
                return { x: canvas.width / 2, y: canvas.height / 2 }; // Center for screen-wide effect

            default:
                // Find position away from player but near enemies
                return this.findStrategicPosition(gameManager);
        }
    }

    findStrategicPosition(gameManager) {
        const attempts = 10;
        let bestPosition = null;
        let bestScore = -1;

        for (let i = 0; i < attempts; i++) {
            const x = 100 + Math.random() * (canvas.width - 200);
            const y = 100 + Math.random() * (canvas.height - 200);

            const score = this.evaluatePosition(x, y, gameManager);
            if (score > bestScore) {
                bestScore = score;
                bestPosition = { x, y };
            }
        }

        return bestPosition;
    }

    evaluatePosition(x, y, gameManager) {
        let score = 0;

        // Distance from player (prefer some distance)
        const playerDistance = getDistance(x, y, gameManager.player.x, gameManager.player.y);
        if (playerDistance > 150 && playerDistance < 300) {
            score += 50;
        }

        // Proximity to enemies (prefer near enemies)
        gameManager.enemies.forEach(enemy => {
            const distance = getDistance(x, y, enemy.x, enemy.y);
            if (distance < 200) {
                score += 20;
            }
        });

        // Avoid existing hazards
        this.activeHazards.forEach(hazard => {
            const distance = getDistance(x, y, hazard.x, hazard.y);
            if (distance < 200) {
                score -= 100;
            }
        });

        return score;
    }

    spawnHazard(type, x, y) {
        let hazard;

        switch(type) {
            case 'LASER_GRID':
                hazard = new LaserGrid(x, y);
                break;
            case 'METEOR_SHOWER':
                hazard = new MeteorShower(x, y);
                break;
            case 'POISON_GAS':
                hazard = new PoisonGas(x, y);
                break;
            case 'ELECTRIC_STORM':
                hazard = new ElectricStorm(x, y);
                break;
            case 'GRAVITY_ANOMALY':
                hazard = new GravityAnomaly(x, y);
                break;
            case 'TEMPORAL_RIFT':
                hazard = new TemporalRift(x, y);
                break;
            default:
                console.warn('Unknown hazard type:', type);
                return;
        }

        this.activeHazards.push(hazard);

        // Global warning message
        this.showHazardWarning(hazard);

        console.log(`Spawned ${hazard.config.name} at (${x}, ${y})`);
    }

    showHazardWarning(hazard) {
        // Show warning message to player
        const msg = document.getElementById('waveMessage');
        if (msg) {
            msg.textContent = `⚠️ ${hazard.config.name} erkannt!`;
            msg.style.display = 'block';
            msg.style.color = hazard.config.warningColor;
            setTimeout(() => {
                msg.style.display = 'none';
                msg.style.color = '';
            }, 3000);
        }
    }

    onHazardEnd(hazard, gameManager) {
        // Clean up effects when hazard ends
        const entities = this.getAllEntities(gameManager);

        entities.forEach(entity => {
            // Remove temporary effects
            if (entity.visionReduced) entity.visionReduced = false;
            if (entity.timeSlowed) {
                entity.timeSlowed = false;
                entity.updateRate = entity.originalUpdateRate || 1;
            }
            if (entity.originalSpeed) {
                entity.speed = entity.originalSpeed;
                delete entity.originalSpeed;
            }
            if (entity.stunned) entity.stunned = false;
        });

        console.log(`${hazard.config.name} ended`);
    }

    updateDifficulty(gameManager) {
        // Increase difficulty based on wave and time
        this.difficultyMultiplier = 1 + (gameManager.wave * 0.1) + (Date.now() - gameManager.gameStartTime) / 300000; // +1 every 5 minutes

        // Adjust max hazards based on difficulty
        if (gameManager.wave >= 10) {
            this.maxActiveHazards = 3;
        }
        if (gameManager.wave >= 20) {
            this.maxActiveHazards = 4;
        }
    }

    onWaveComplete() {
        this.wavesSinceLastHazard++;
    }

    render(ctx) {
        this.activeHazards.forEach(hazard => hazard.render(ctx));
    }

    // Force spawn hazard for testing
    forceSpawnHazard(type, x, y) {
        if (x === undefined) x = canvas.width / 2;
        if (y === undefined) y = canvas.height / 2;
        this.spawnHazard(type, x, y);
    }

    // Clear all hazards
    clearAllHazards() {
        this.activeHazards.forEach(hazard => {
            if (typeof gameManager !== 'undefined' && gameManager) {
                this.onHazardEnd(hazard, gameManager);
            }
        });
        this.activeHazards = [];
    }
}
