// Entity Classes

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseRadius = 15;
        this.radius = 15;
        this.baseSpeed = 5;
        this.speed = 5;
        this.health = 100;
        this.maxHealth = 100;
        this.baseMaxHealth = 100;
        this.angle = 0;
        this.weaponSystem = new WeaponSystem();
        this.isFiring = false;
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.reloadDuration = 2000;
        this.upgradeCount = 0;

        // Power-Up properties
        this.berserkerMode = false;
        this.hasShield = false;
        this.shieldHits = 0;
        this.ghostMode = false;
        this.magnetMode = false;
        this.magnetRadius = 0;
    }
    
    update(keys, mouse, walls) {
        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -this.speed;
        if (keys['s'] || keys['arrowdown']) dy = this.speed;
        if (keys['a'] || keys['arrowleft']) dx = -this.speed;
        if (keys['d'] || keys['arrowright']) dx = this.speed;
        
        // Apply movement
        this.x += dx;
        this.y += dy;

        // Wall collision (skip if in ghost mode)
        if (!this.ghostMode) {
            walls.forEach(wall => {
                if (checkWallCollision(this, wall)) {
                    resolveWallCollision(this, wall);
                }
            });
        }
        
        // Keep in bounds
        this.x = clamp(this.x, this.radius, canvas.width - this.radius);
        this.y = clamp(this.y, this.radius, canvas.height - this.radius);
        
        // Aim direction
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        
        // Auto reload when empty
        const weapon = this.weaponSystem.weapons[this.weaponSystem.currentWeapon];
        if (weapon.ammo <= 0 && !this.isReloading) {
            this.startReload();
        }
        
        // Check reload completion
        if (this.isReloading && Date.now() - this.reloadStartTime >= this.reloadDuration) {
            this.finishReload();
        }
    }
    
    startReload() {
        this.isReloading = true;
        this.reloadStartTime = Date.now();
    }
    
    finishReload() {
        this.isReloading = false;
        const weapon = this.weaponSystem.weapons[this.weaponSystem.currentWeapon];
        weapon.ammo = weapon.maxAmmo;
    }
    
    shoot(targetX, targetY) {
        if (this.isReloading) return [];
        return this.weaponSystem.shoot(this.x, this.y, targetX, targetY);
    }
    
    addUpgrade(upgrade) {
        const success = this.weaponSystem.addUpgrade(upgrade);
        if (success) {
            this.upgradeCount = this.weaponSystem.getUpgradeCount();
            createParticles(this.x, this.y, '#ff0', 20);
            playSound('pickup', 0.5);
        } else {
            // Already at max level - give health bonus instead
            this.maxHealth += 10;
            this.health = Math.min(this.maxHealth, this.health + 10);
            this.updateSizeFromHealth();
            createParticles(this.x, this.y, '#0f0', 20);
            playSound('heal', 0.3);
        }
    }
    
    updateSizeFromHealth() {
        // Validate health values
        if (isNaN(this.maxHealth) || this.maxHealth <= 0) {
            console.error('Invalid maxHealth:', this.maxHealth, 'resetting to baseMaxHealth');
            this.maxHealth = this.baseMaxHealth;
        }
        if (isNaN(this.baseMaxHealth) || this.baseMaxHealth <= 0) {
            console.error('Invalid baseMaxHealth:', this.baseMaxHealth, 'resetting to 100');
            this.baseMaxHealth = 100;
            this.maxHealth = 100;
        }
        if (isNaN(this.health)) {
            console.error('Invalid health:', this.health, 'resetting to maxHealth');
            this.health = this.maxHealth;
        }
        
        // Size scales with max health
        const healthRatio = this.maxHealth / this.baseMaxHealth;
        this.radius = this.baseRadius * Math.sqrt(healthRatio); // Square root for more balanced scaling
        this.speed = this.baseSpeed * (2 / (1 + healthRatio)); // Speed decreases as size increases
        this.speed = Math.max(2, this.speed); // Minimum speed
    }
    
    takeDamage(amount) {
        // Validate amount
        if (isNaN(amount) || amount === undefined || amount === null) {
            console.error('Invalid damage amount:', amount);
            return;
        }

        // Check shield power-up first
        if (this.hasShield && this.shieldHits > 0) {
            this.shieldHits--;
            createParticles(this.x, this.y, '#4444ff', 15);
            playSound('shield_hit', 0.4);

            if (this.shieldHits <= 0) {
                this.hasShield = false;
                createParticles(this.x, this.y, '#ff4444', 20);
                playSound('shield_break', 0.5);
            }
            return; // No damage taken
        }

        // Apply damage reduction if present
        if (this.damageReduction !== undefined && !isNaN(this.damageReduction)) {
            amount *= (1 - this.damageReduction);
        }

        // Validate health before and after
        if (isNaN(this.health)) {
            console.error('Player health is NaN, resetting to 100');
            this.health = 100;
        }

        this.health -= amount;

        if (isNaN(this.health)) {
            console.error('Player health became NaN after taking damage:', amount);
            this.health = 100;
        }

        createParticles(this.x, this.y, '#f44');
        playSound('hit');
    }
}

class Enemy {
    constructor(x, y, level = 1) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        
        // Apply difficulty scaling
        const diffMult = gameManager.difficultyMultipliers[gameManager.difficulty];
        this.speed = (0.8 + level * 0.1) * diffMult.enemySpeed; // Slower progression
        this.health = (30 + level * 5) * diffMult.enemyHealth; // Less health
        this.maxHealth = this.health;
        this.damage = 8 * diffMult.enemyDamage; // Less damage
        this.lastShot = 0;
        this.fireRate = 3000 / diffMult.enemySpeed; // Slower fire rate
        this.weaponSystem = new WeaponSystem();
        this.upgradeCount = Math.floor(Math.random() * Math.min(2, Math.floor(level/2)));
        
        // Movement pattern
        this.movementPattern = Math.random() < 0.7 ? 'wander' : 'direct';
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderTimer = 0;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        
        // Add random upgrades based on level
        for (let i = 0; i < this.upgradeCount; i++) {
            const upgrade = WEAPON_UPGRADES[Math.floor(Math.random() * WEAPON_UPGRADES.length)];
            this.weaponSystem.addUpgrade(upgrade);
        }
        
        // Scale with upgrades
        this.radius = 12 + this.upgradeCount * 2;
        this.speed *= (1 - this.upgradeCount * 0.1);
    }
    
    update(targets, walls) {
        // Find closest target
        let closestTarget = null;
        let closestDistance = Infinity;
        
        targets.forEach(target => {
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = target;
            }
        });
        
        if (closestTarget) {
            const targetAngle = getAngle(this.x, this.y, closestTarget.x, closestTarget.y);
            
            // Movement based on pattern
            if (this.movementPattern === 'wander') {
                // Wandering movement with occasional direction changes
                this.wanderTimer++;
                if (this.wanderTimer > 60 + Math.random() * 60) {
                    this.wanderAngle = targetAngle + (Math.random() - 0.5) * Math.PI;
                    this.wanderTimer = 0;
                }
                
                // Blend wander angle with target angle
                const blendedAngle = this.wanderAngle * 0.7 + targetAngle * 0.3;
                this.x += Math.cos(blendedAngle) * this.speed;
                this.y += Math.sin(blendedAngle) * this.speed;
            } else {
                // Direct movement towards target
                this.x += Math.cos(targetAngle) * this.speed;
                this.y += Math.sin(targetAngle) * this.speed;
            }
            
            // Wall collision
            walls.forEach(wall => {
                if (checkWallCollision(this, wall)) {
                    resolveWallCollision(this, wall);
                    // Change wander direction on wall hit
                    if (this.movementPattern === 'wander') {
                        this.wanderAngle += Math.PI / 2 + Math.random() * Math.PI / 2;
                    }
                }
            });
            
            // Shoot at target
            if (Date.now() - this.lastShot > this.fireRate && closestDistance < 300) {
                this.lastShot = Date.now();
                return this.shoot(closestTarget.x, closestTarget.y);
            }
        }
        
        return [];
    }
    
    shoot(targetX, targetY) {
        const angle = getAngle(this.x, this.y, targetX, targetY);
        return [{
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 10,
            vy: Math.sin(angle) * 10,
            radius: 4,
            damage: this.damage,
            isPlayer: false,
            color: '#f00'
        }];
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            createParticles(this.x, this.y, '#4f4');
            playSound('explosion', 0.2);
        }
    }
}

class Ally {
    constructor(x, y, weapon = 'pistol', isAlly = true, factory = null) {
        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;
        this.radius = 10;
        this.speed = 2; // Slower, more chill
        this.health = 75;
        this.maxHealth = 75;
        this.isAlly = isAlly;
        this.lastShot = 0;
        this.upgradeCount = 0;
        this.factory = factory; // Reference to spawning factory
        this.weaponSystem = new WeaponSystem(); // Add weapon system for upgrades
        this.roamRadius = 180; // Stay within this radius of spawn point
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderTimer = 0;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        
        // Movement pattern
        this.movementPattern = 'patrol';
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolTimer = 0;
        this.sineOffset = Math.random() * Math.PI * 2;
        
        // Set weapon based on type
        switch(weapon) {
            case 'mg':
                this.weapon = { ...WEAPON_TYPES.MG };
                this.color = '#a4f';
                this.preferredDistance = 200;
                break;
            case 'shotgun':
                this.weapon = { ...WEAPON_TYPES.SHOTGUN };
                this.color = '#fa4';
                this.preferredDistance = 50;
                break;
            default:
                this.weapon = { ...WEAPON_TYPES.PISTOL };
                this.color = '#44f';
                this.preferredDistance = 150;
        }
    }
    
    update(enemies, allies, walls) {
        // Find closest enemy
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        const targets = this.isAlly ? enemies : [...allies, gameManager.player];
        
        targets.forEach(enemy => {
            const distance = getDistance(this.x, this.y, enemy.x, enemy.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        // Check if within any allied factory radius
        let withinAnyFactory = false;
        let closestFactory = null;
        let closestFactoryDistance = Infinity;
        
        if (this.isAlly && gameManager.factories) {
            gameManager.factories.forEach(factory => {
                if (factory.isAlly === this.isAlly) {
                    const dist = getDistance(this.x, this.y, factory.x, factory.y);
                    if (dist < 180) { // Within patrol radius
                        withinAnyFactory = true;
                    }
                    if (dist < closestFactoryDistance) {
                        closestFactoryDistance = dist;
                        closestFactory = factory;
                    }
                }
            });
        }
        
        if (closestEnemy) {
            const enemyAngle = getAngle(this.x, this.y, closestEnemy.x, closestEnemy.y);
            
            // Patrol movement with sine waves when no immediate threat
            if (closestDistance > this.preferredDistance * 1.5 || !closestEnemy) {
                this.wanderTimer++;
                
                // If outside all factory areas, move back to closest factory
                if (!withinAnyFactory && closestFactory) {
                    const factoryAngle = getAngle(this.x, this.y, closestFactory.x, closestFactory.y);
                    this.x += Math.cos(factoryAngle) * this.speed * 0.8;
                    this.y += Math.sin(factoryAngle) * this.speed * 0.8;
                } else {
                    // Wandering patrol with smooth movement
                    const time = this.wanderTimer * 0.03;
                    const sineWave = Math.sin(time + this.wobbleOffset) * 0.5;
                    this.wanderAngle += 0.02 + sineWave * 0.02;
                    
                    const moveX = Math.cos(this.wanderAngle) * this.speed * 0.7;
                    const moveY = Math.sin(this.wanderAngle) * this.speed * 0.7;
                    
                    // Only apply movement if it keeps soldier within at least one factory area
                    const newX = this.x + moveX;
                    const newY = this.y + moveY;
                    let willBeInFactory = false;
                    
                    if (gameManager.factories) {
                        gameManager.factories.forEach(factory => {
                            if (factory.isAlly === this.isAlly) {
                                if (getDistance(newX, newY, factory.x, factory.y) < 180) {
                                    willBeInFactory = true;
                                }
                            }
                        });
                    }
                    
                    if (willBeInFactory || !closestFactory) {
                        this.x = newX;
                        this.y = newY;
                    } else {
                        // Change direction if hitting radius boundary
                        this.wanderAngle += Math.PI / 2 + Math.random() * Math.PI / 2;
                    }
                }
            } else {
                // Combat movement - still check factory boundaries
                let moveX = 0, moveY = 0;
                
                if (closestDistance > this.preferredDistance) {
                    moveX = Math.cos(enemyAngle) * this.speed;
                    moveY = Math.sin(enemyAngle) * this.speed;
                } else if (closestDistance < this.preferredDistance * 0.7) {
                    moveX = -Math.cos(enemyAngle) * this.speed * 0.5;
                    moveY = -Math.sin(enemyAngle) * this.speed * 0.5;
                }
                
                // Check if combat movement keeps soldier in factory area
                if (moveX !== 0 || moveY !== 0) {
                    const newX = this.x + moveX;
                    const newY = this.y + moveY;
                    let willBeInFactory = false;
                    
                    if (gameManager.factories) {
                        gameManager.factories.forEach(factory => {
                            if (factory.isAlly === this.isAlly) {
                                if (getDistance(newX, newY, factory.x, factory.y) < 180) {
                                    willBeInFactory = true;
                                }
                            }
                        });
                    }
                    
                    if (willBeInFactory || !closestFactory) {
                        this.x = newX;
                        this.y = newY;
                    }
                }
                
            }
            
            // Wall collision
            walls.forEach(wall => {
                if (checkWallCollision(this, wall)) {
                    resolveWallCollision(this, wall);
                    this.patrolAngle += Math.PI / 2; // Change patrol direction
                }
            });
            
            // Shoot at enemy
            if (closestEnemy && Date.now() - this.lastShot > this.weapon.fireRate && closestDistance < 300) {
                this.lastShot = Date.now();
                return this.shoot(closestEnemy.x, closestEnemy.y);
            }
        }
        
        return [];
    }
    
    shoot(targetX, targetY) {
        const bullets = [];
        const baseAngle = getAngle(this.x, this.y, targetX, targetY);
        const pellets = this.weapon.pellets || 1;
        
        // Apply upgrade effects (simplified)
        const extraDamage = this.weaponSystem.getUpgradeCount() * 2;
        
        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * (this.weapon.spread || 0);
            const angle = baseAngle + spread;
            
            const globalBoost = this.globalDamageBoost || 0;
            bullets.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * this.weapon.bulletSpeed,
                vy: Math.sin(angle) * this.weapon.bulletSpeed,
                radius: 4,
                damage: this.weapon.damage + extraDamage + globalBoost,
                isPlayer: false,
                isAlly: this.isAlly,
                color: this.isAlly ? '#4f4' : '#f00'
            });
        }
        
        // Add upgrade bullets
        const upgradeBullets = this.weaponSystem.updateUpgrades(this.x, this.y, targetX, targetY);
        upgradeBullets.forEach(b => {
            b.isAlly = this.isAlly;
            b.isPlayer = false;
        });
        bullets.push(...upgradeBullets);
        
        if (this.isAlly) playSound('shoot', 0.1);
        return bullets;
    }
    
    takeDamage(amount) {
        // Apply damage reduction if present
        if (this.damageReduction !== undefined) {
            amount *= (1 - this.damageReduction);
        }
        this.health -= amount;
        if (this.health <= 0) {
            createParticles(this.x, this.y, this.isAlly ? '#44f' : '#f44');
        }
    }
}

class Superboss {
    constructor(x, y, wave) {
        this.x = x;
        this.y = y;
        this.radius = 40; // Much larger than regular enemies
        this.speed = 1.5;
        this.health = 1000 + wave * 100; // Scales with wave
        this.maxHealth = this.health;
        this.damage = 50;
        this.lastShot = 0;
        this.fireRate = 500;
        this.lastSpecialAttack = 0;
        this.specialAttackCooldown = 3000;
        this.weaponSystem = new WeaponSystem();
        this.movementPattern = 'circle';
        this.circleAngle = 0;
        this.centerX = x;
        this.centerY = y;
        this.phase = 1; // Boss has multiple phases
        
        // Special abilities
        this.abilities = ['burst', 'summon', 'shield'];
        this.shieldActive = false;
        this.shieldHealth = 0;
        
        // Visual properties
        this.pulseTimer = 0;
        this.color = '#f00';
    }
    
    update(targets, walls, gameManager) {
        // Find closest target
        let closestTarget = null;
        let closestDistance = Infinity;
        
        targets.forEach(target => {
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = target;
            }
        });
        
        // Phase transitions
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent < 0.66 && this.phase === 1) {
            this.phase = 2;
            this.speed *= 1.3;
            this.fireRate *= 0.8;
            createParticles(this.x, this.y, '#ff0', 30);
            playSound('explosion', 0.5);
        } else if (healthPercent < 0.33 && this.phase === 2) {
            this.phase = 3;
            this.speed *= 1.2;
            this.fireRate *= 0.7;
            this.damage *= 1.5;
            createParticles(this.x, this.y, '#f0f', 30);
            playSound('explosion', 0.5);
        }
        
        // Movement patterns based on phase
        if (this.phase === 1) {
            // Circular movement
            this.circleAngle += 0.02;
            this.x = this.centerX + Math.cos(this.circleAngle) * 150;
            this.y = this.centerY + Math.sin(this.circleAngle) * 150;
        } else if (this.phase === 2) {
            // Figure-8 movement
            const t = this.circleAngle;
            this.circleAngle += 0.03;
            this.x = this.centerX + Math.sin(t) * 200;
            this.y = this.centerY + Math.sin(t * 2) * 100;
        } else {
            // Aggressive chase in phase 3
            if (closestTarget) {
                const angle = getAngle(this.x, this.y, closestTarget.x, closestTarget.y);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
            }
        }
        
        // Keep in bounds
        this.x = clamp(this.x, this.radius, canvas.width - this.radius);
        this.y = clamp(this.y, this.radius, canvas.height - this.radius);
        
        // Update center position for movement patterns
        if (this.phase === 3) {
            this.centerX = lerp(this.centerX, this.x, 0.05);
            this.centerY = lerp(this.centerY, this.y, 0.05);
        }
        
        // Special attacks
        if (Date.now() - this.lastSpecialAttack > this.specialAttackCooldown) {
            this.performSpecialAttack(gameManager);
            this.lastSpecialAttack = Date.now();
        }
        
        // Regular shooting
        const bullets = [];
        if (closestTarget && Date.now() - this.lastShot > this.fireRate) {
            this.lastShot = Date.now();
            bullets.push(...this.shoot(closestTarget.x, closestTarget.y));
        }
        
        // Visual effects
        this.pulseTimer += 0.1;
        
        return bullets;
    }
    
    performSpecialAttack(gameManager) {
        const ability = this.abilities[Math.floor(Math.random() * this.abilities.length)];
        
        switch(ability) {
            case 'burst':
                // Fire bullets in all directions
                const bullets = [];
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * Math.PI * 2;
                    bullets.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * 8,
                        vy: Math.sin(angle) * 8,
                        radius: 8,
                        damage: 30,
                        isPlayer: false,
                        color: '#f0f',
                        explosive: true
                    });
                }
                gameManager.bullets.push(...bullets);
                createParticles(this.x, this.y, '#f0f', 20);
                playSound('explosion', 0.3);
                break;
                
            case 'summon':
                // Summon minions
                for (let i = 0; i < 3 + this.phase; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 80;
                    const x = this.x + Math.cos(angle) * distance;
                    const y = this.y + Math.sin(angle) * distance;
                    const minion = new Enemy(x, y, Math.floor(gameManager.wave / 2));
                    minion.speed *= 1.5;
                    gameManager.enemies.push(minion);
                    createParticles(x, y, '#f44', 10);
                }
                playSound('wave', 0.3);
                break;
                
            case 'shield':
                // Activate shield
                this.shieldActive = true;
                this.shieldHealth = 200 * this.phase;
                createParticles(this.x, this.y, '#08f', 25);
                playSound('heal', 0.5);
                break;
        }
    }
    
    shoot(targetX, targetY) {
        const bullets = [];
        const baseAngle = getAngle(this.x, this.y, targetX, targetY);
        
        // Multi-shot based on phase
        const shotCount = this.phase;
        const spreadAngle = 0.2;
        
        for (let i = 0; i < shotCount; i++) {
            const offset = (i - (shotCount - 1) / 2) * spreadAngle;
            const angle = baseAngle + offset;
            
            bullets.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 12,
                vy: Math.sin(angle) * 12,
                radius: 8,
                damage: this.damage,
                isPlayer: false,
                color: this.phase === 3 ? '#f0f' : '#f00',
                explosive: this.phase >= 2
            });
        }
        
        playSound('shoot', 0.5);
        return bullets;
    }
    
    takeDamage(amount) {
        if (this.shieldActive && this.shieldHealth > 0) {
            this.shieldHealth -= amount;
            if (this.shieldHealth <= 0) {
                this.shieldActive = false;
                createParticles(this.x, this.y, '#08f', 15);
            }
            createParticles(this.x, this.y, '#08f', 3);
        } else {
            this.health -= amount;
            createParticles(this.x, this.y, '#f44', 5);
            
            if (this.health <= 0) {
                // Epic death effect
                for (let i = 0; i < 50; i++) {
                    setTimeout(() => {
                        createParticles(
                            this.x + (Math.random() - 0.5) * 80,
                            this.y + (Math.random() - 0.5) * 80,
                            ['#f44', '#ff0', '#f0f'][Math.floor(Math.random() * 3)],
                            10
                        );
                    }, i * 20);
                }
                playSound('explosion', 1.0);
            }
        }
    }
}

class Tank {
    constructor(x, y, type = 'light', isAlly = true) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.isAlly = isAlly;
        this.angle = 0;
        this.turretAngle = 0;
        this.lastShot = 0;
        
        // Movement pattern for vehicles - can roam entire screen
        this.roamTarget = { x: Math.random() * canvas.width, y: Math.random() * canvas.height };
        this.roamTimer = 0;
        
        switch(type) {
            case 'heavy':
                this.speed = 1;
                this.health = 300;
                this.maxHealth = 300;
                this.fireRate = 2000;
                this.damage = 80;
                this.bulletSpeed = 12;
                this.explosive = true;
                this.color = '#666';
                break;
            case 'support':
                this.speed = 2;
                this.health = 200;
                this.maxHealth = 200;
                this.fireRate = 0;
                this.healRadius = 100;
                this.healRate = 2;
                this.color = '#4a4';
                break;
            default: // light
                this.speed = 3;
                this.health = 150;
                this.maxHealth = 150;
                this.fireRate = 300;
                this.damage = 20;
                this.bulletSpeed = 18;
                this.color = '#888';
        }
    }
    
    update(enemies, allies, walls) {
        // Find target
        const targets = this.isAlly ? enemies : [...allies, gameManager.player];
        let closestTarget = null;
        let closestDistance = Infinity;
        
        targets.forEach(target => {
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = target;
            }
        });
        
        // Update roaming behavior
        this.roamTimer++;
        const distToRoamTarget = getDistance(this.x, this.y, this.roamTarget.x, this.roamTarget.y);
        
        if (distToRoamTarget < 50 || this.roamTimer > 300) {
            // Pick new roam target
            this.roamTarget = {
                x: 50 + Math.random() * (canvas.width - 100),
                y: 50 + Math.random() * (canvas.height - 100)
            };
            this.roamTimer = 0;
        }
        
        if (closestTarget) {
            this.turretAngle = getAngle(this.x, this.y, closestTarget.x, closestTarget.y);
            
            // Fast roaming movement when no immediate threat
            if (closestDistance > 400 && this.fireRate > 0) {
                // Roam to random positions
                this.angle = getAngle(this.x, this.y, this.roamTarget.x, this.roamTarget.y);
                this.x += Math.cos(this.angle) * this.speed * 1.5; // Faster roaming
                this.y += Math.sin(this.angle) * this.speed * 1.5;
            } else if (this.fireRate > 0 && closestDistance > 150) {
                // Combat movement
                this.angle = this.turretAngle;
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
            }
            
            // Support tanks also roam but slower
            if (this.healRadius && closestDistance > 200) {
                this.angle = getAngle(this.x, this.y, this.roamTarget.x, this.roamTarget.y);
                this.x += Math.cos(this.angle) * this.speed * 0.7;
                this.y += Math.sin(this.angle) * this.speed * 0.7;
            }
            
            // Keep in bounds
            this.x = clamp(this.x, this.radius, canvas.width - this.radius);
            this.y = clamp(this.y, this.radius, canvas.height - this.radius);
            
            // Wall collision
            walls.forEach(wall => {
                if (checkWallCollision(this, wall)) {
                    resolveWallCollision(this, wall);
                    // Pick new roam target on collision
                    this.roamTarget = {
                        x: 50 + Math.random() * (canvas.width - 100),
                        y: 50 + Math.random() * (canvas.height - 100)
                    };
                }
            });
            
            // Combat or support action
            if (this.fireRate > 0 && Date.now() - this.lastShot > this.fireRate && closestDistance < 350) {
                this.lastShot = Date.now();
                return this.shoot(closestTarget.x, closestTarget.y);
            } else if (this.healRadius) {
                this.heal(this.isAlly ? allies : enemies);
            }
        }
        
        return [];
    }
    
    shoot(targetX, targetY) {
        const angle = this.turretAngle;
        playSound('shoot', 0.3);
        
        return [{
            x: this.x + Math.cos(angle) * 25,
            y: this.y + Math.sin(angle) * 25,
            vx: Math.cos(angle) * this.bulletSpeed,
            vy: Math.sin(angle) * this.bulletSpeed,
            radius: this.explosive ? 8 : 6,
            damage: this.damage,
            isPlayer: false,
            isAlly: this.isAlly,
            color: this.isAlly ? '#4f4' : '#f44',
            explosive: this.explosive || false
        }];
    }
    
    heal(units) {
        units.forEach(unit => {
            const distance = getDistance(this.x, this.y, unit.x, unit.y);
            if (distance < this.healRadius && unit.health < unit.maxHealth) {
                unit.health = Math.min(unit.maxHealth, unit.health + this.healRate);
                if (Math.random() < 0.1) {
                    createParticles(unit.x, unit.y, '#4f4', 3);
                    playSound('heal', 0.1);
                }
            }
        });
        
        // Also heal player if ally
        if (this.isAlly && gameManager.player) {
            const distance = getDistance(this.x, this.y, gameManager.player.x, gameManager.player.y);
            if (distance < this.healRadius && gameManager.player.health < gameManager.player.maxHealth) {
                gameManager.player.health = Math.min(gameManager.player.maxHealth, gameManager.player.health + this.healRate);
            }
        }
    }
    
    takeDamage(amount) {
        // Apply damage reduction if present
        if (this.damageReduction !== undefined) {
            amount *= (1 - this.damageReduction);
        }
        this.health -= amount;
        if (this.health <= 0) {
            createParticles(this.x, this.y, this.isAlly ? '#44f' : '#f44', 25);
            playSound('explosion', 0.4);
        }
    }
}