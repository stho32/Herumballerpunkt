// Main Game Manager

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

class GameManager {
    constructor() {
        this.canvas = canvas;
        this.ctx = ctx;
        this.renderer = new Renderer(canvas, ctx);

        // Performance systems
        this.performanceManager = new PerformanceManager();
        this.poolManager = new PoolManager();
        this.spatialManager = null; // Will be initialized when canvas size is known

        // Game state
        this.gameActive = false;
        this.score = 0;
        this.wave = 1;
        this.waveActive = false;
        this.waveEnemies = [];
        this.animationId = null;
        this.difficulty = 'normal'; // easy, normal, hard

        // Performance UI toggle
        this.showPerformanceInfo = false;
        
        // Difficulty multipliers
        this.difficultyMultipliers = {
            easy: {
                enemyHealth: 0.7,
                enemyDamage: 0.7,
                enemySpeed: 0.8,
                spawnRate: 0.7,
                waveSize: 0.8
            },
            normal: {
                enemyHealth: 1.0,
                enemyDamage: 1.0,
                enemySpeed: 1.0,
                spawnRate: 1.0,
                waveSize: 1.0
            },
            hard: {
                enemyHealth: 1.5,
                enemyDamage: 1.5,
                enemySpeed: 1.2,
                spawnRate: 1.3,
                waveSize: 1.5
            }
        };
        
        // Game entities
        this.player = null;
        this.enemies = [];
        this.allies = [];
        this.turrets = [];
        this.factories = [];
        this.walls = [];
        this.bullets = [];
        this.pickups = [];
        this.bunker = null;
        this.enemySquads = [];
        this.lastBossWave = 0;
        this.enhanceEnemyLevel = 0;
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        this.setupEventListeners();
    }
    
    init() {
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Initialize spatial manager with canvas bounds
        this.spatialManager = new SpatialManager({
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            // Reinitialize spatial manager with new bounds
            this.spatialManager = new SpatialManager({
                x: 0,
                y: 0,
                width: this.canvas.width,
                height: this.canvas.height
            });
        });

        // Add performance info toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                this.togglePerformanceInfo();
            }
        });
    }
    
    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        this.canvas.addEventListener('mousedown', () => {
            if (this.player) {
                this.player.isFiring = true;
            }
            // Initialize audio on first interaction
            initAudio();
        });
        
        this.canvas.addEventListener('mouseup', () => {
            if (this.player) {
                this.player.isFiring = false;
            }
        });
        
        // Weapon switching
        document.addEventListener('keypress', (e) => {
            if (!this.player) return;
            const weaponIndex = parseInt(e.key) - 1;
            if (weaponIndex >= 0 && weaponIndex < 5) {
                this.player.weaponSystem.switchWeapon(weaponIndex);
                this.updateDisplay();
            }
        });
    }
    
    startGame(difficulty = 'normal') {
        this.gameActive = true;
        this.score = 0;
        this.wave = 1;
        this.waveActive = false;
        this.difficulty = difficulty;
        
        // Create player
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        
        // Clear all entities
        this.enemies = [];
        this.allies = [];
        this.turrets = [];
        this.factories = [];
        this.walls = [];
        this.bullets = [];
        this.pickups = [];
        particles = [];
        
        // Hide game over
        document.getElementById('gameOver').style.display = 'none';
        
        // Start first wave
        setTimeout(() => this.startWave(), 1000);
        
        this.updateDisplay();
        this.gameLoop();
    }
    
    startWave() {
        this.waveActive = true;
        
        // Check for superboss wave
        const isSuperbossWave = this.wave % 12 === 0 && this.wave > 0;
        
        // Show wave message
        const waveMsg = document.getElementById('waveMessage');
        if (isSuperbossWave) {
            waveMsg.textContent = `SUPERBOSS - Welle ${this.wave}`;
            waveMsg.style.color = '#f00';
        } else {
            waveMsg.textContent = `Welle ${this.wave}`;
            waveMsg.style.color = '#fff';
        }
        waveMsg.style.display = 'block';
        playSound('wave');
        
        setTimeout(() => {
            waveMsg.style.display = 'none';
        }, 2000);
        
        if (isSuperbossWave) {
            // Spawn superboss
            setTimeout(() => {
                const x = this.canvas.width / 2;
                const y = 100;
                const superboss = new Superboss(x, y, this.wave);
                this.enemies.push(superboss);
                createParticles(x, y, '#f00', 50);
                playSound('explosion', 0.8);
            }, 1000);
            
            // Spawn fewer regular enemies with superboss
            const enemyCount = Math.floor((3 + this.wave) * 0.5);
            const enemyLevel = Math.floor(1 + this.wave / 3);
            const spawnDelay = 500;
            
            for (let i = 0; i < enemyCount; i++) {
                setTimeout(() => {
                    const pos = getRandomEdgePosition(this.canvas);
                    const enemy = new Enemy(pos.x, pos.y, enemyLevel, this.difficulty);
                    this.enemies.push(enemy);
                }, 2000 + i * spawnDelay);
            }
        } else {
            // Normal wave spawning
            const diffMult = this.difficultyMultipliers[this.difficulty];
            const baseEnemyCount = 3 + this.wave * 2;
            const enemyCount = Math.floor(baseEnemyCount * (this.difficulty === 'easy' ? 0.7 : this.difficulty === 'hard' ? 1.3 : 1));
            const enemyLevel = Math.floor(1 + this.wave / 3);
            
            // Spawn enemies - mix of individuals and squads
            const spawnDelay = 300 * diffMult.spawnRate;
            const squadCount = Math.floor(enemyCount / 4);
            const individualCount = enemyCount - squadCount * 3;
            
            // Spawn individual enemies
            for (let i = 0; i < individualCount; i++) {
                setTimeout(() => {
                    const pos = getRandomEdgePosition(this.canvas);
                    const enemy = new Enemy(pos.x, pos.y, enemyLevel);
                    this.enemies.push(enemy);
                }, i * spawnDelay);
            }
            
            // Spawn enemy squads (after wave 5 and if enhanced)
            if (this.wave > 5 && this.enhanceEnemyLevel > 0) {
                for (let i = 0; i < squadCount; i++) {
                    setTimeout(() => {
                        const pos = getRandomEdgePosition(this.canvas);
                        const squad = new EnemySquad(pos.x, pos.y, this.enhanceEnemyLevel);
                        this.enemySquads.push(squad);
                    }, (individualCount + i) * spawnDelay);
                }
            }
        }
        
        // Spawn factory every 3 waves
        if (this.wave % 3 === 0) {
            const factoryTypes = ['infantry', 'heavy', 'assault'];
            const type = factoryTypes[Math.floor(Math.random() * factoryTypes.length)];
            const x = 200 + Math.random() * (this.canvas.width - 400);
            const y = 200 + Math.random() * (this.canvas.height - 400);
            this.factories.push(new Factory(x, y, type));
        }
        
        // Add some walls
        for (let i = 0; i < 2; i++) {
            this.spawnWall();
        }
    }
    
    checkWaveComplete() {
        const enemiesLeft = this.enemies.filter(e => !(e instanceof Ally)).length + this.enemySquads.length;
        
        if (this.waveActive && enemiesLeft === 0) {
            this.waveActive = false;
            this.wave++;
            
            // Give bonus points
            this.score += 100 * this.wave;
            this.updateDisplay();
            
            // Always reorganize forces if there are factories with soldiers
            const hasFactoriesWithSoldiers = this.factories.some(f => f.isAlly && f.soldiers > 0);
            if (hasFactoriesWithSoldiers) {
                this.reorganizeAfterBoss();
            } else {
                // Start next wave after delay
                setTimeout(() => this.startWave(), 3000);
            }
        }
    }
    
    reorganizeAfterBoss() {
        const msg = document.getElementById('waveMessage');
        msg.textContent = 'Reorganisation der Truppen...';
        msg.style.display = 'block';
        
        setTimeout(() => {
            this.consolidateForces();
            msg.style.display = 'none';
            setTimeout(() => this.startWave(), 2000);
        }, 3000);
    }
    
    consolidateForces() {
        // Count soldiers by factory type
        const factoryStats = {};
        
        this.factories.forEach(factory => {
            if (factory.isAlly && factory.soldiers > 0) {
                if (!factoryStats[factory.type]) {
                    factoryStats[factory.type] = 0;
                }
                factoryStats[factory.type] += factory.soldiers;
            }
        });
        
        // Remove all allies and factories
        this.allies = [];
        this.factories = [];
        this.turrets = this.turrets.filter(t => !t.isAlly);
        
        // Create or expand existing bunker
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        if (!this.bunker) {
            // First bunker creation
            this.bunker = new BunkerComplex(centerX, centerY);
        } else {
            // Bunker already exists - we'll add to it
            console.log('Expanding existing bunker with new forces');
        }
        
        // Add new modules based on factory types
        Object.keys(factoryStats).forEach(type => {
            this.bunker.addModule(type, factoryStats[type]);
        });
        
        createParticles(centerX, centerY, '#ff0', 50);
        playSound('build', 0.8);
        
        // Enhance enemy squads for next waves
        this.enhanceEnemyLevel++;
    }
    
    spawnWall() {
        const isVertical = Math.random() < 0.5;
        const x = 100 + Math.random() * (this.canvas.width - 200);
        const y = 100 + Math.random() * (this.canvas.height - 200);
        const width = isVertical ? 20 : 100 + Math.random() * 100;
        const height = isVertical ? 100 + Math.random() * 100 : 20;
        
        this.walls.push(new Wall(x, y, width, height));
    }
    
    spawnTurret(x, y, type = 'mg', isAlly = false) {
        this.turrets.push(new Turret(x, y, type, isAlly));
    }
    
    spawnPickup(x, y, fromAlly = false) {
        const rand = Math.random();
        const diffMult = this.difficultyMultipliers[this.difficulty];
        
        // Higher chance of upgrades when allies kill enemies
        if (fromAlly) {
            if (rand < 0.7) {
                this.pickups.push(createUpgradePickup(x, y));
            } else if (rand < 0.85) {
                this.pickups.push(createWeaponPickup(x, y));
            } else {
                this.pickups.push({
                    x, y,
                    type: 'health',
                    radius: 10,
                    lifetime: 10000,
                    created: Date.now()
                });
            }
        } else {
            if (rand < 0.4) {
                this.pickups.push({
                    x, y,
                    type: 'ammo',
                    radius: 10,
                    lifetime: 10000,
                    created: Date.now()
                });
            } else if (rand < 0.7) {
                this.pickups.push({
                    x, y,
                    type: 'health',
                    radius: 10,
                    lifetime: 10000,
                    created: Date.now()
                });
            } else if (rand < 0.9) {
                this.pickups.push(createWeaponPickup(x, y));
            } else {
                this.pickups.push(createUpgradePickup(x, y));
            }
        }
    }
    
    updateGame() {
        if (!this.gameActive) return;
        
        // Update player
        this.player.update(this.keys, this.mouse, this.walls);
        
        // Player shooting - use optimized bullet creation
        if (this.player.isFiring) {
            const bullets = this.player.shoot(this.mouse.x, this.mouse.y);
            const optimizedBullets = this.convertBulletsToPooled(bullets);
            this.bullets.push(...optimizedBullets);
        }

        // Player weapon upgrades
        const upgradeBullets = this.player.weaponSystem.updateUpgrades(
            this.player.x, this.player.y, this.mouse.x, this.mouse.y
        );
        if (upgradeBullets.length > 0) {
            const optimizedUpgradeBullets = this.convertBulletsToPooled(upgradeBullets);
            this.bullets.push(...optimizedUpgradeBullets);
        }

        // Fire shield
        const shieldFlames = this.player.weaponSystem.updateShield(this.player.x, this.player.y);
        if (shieldFlames.length > 0) {
            const optimizedShieldFlames = this.convertBulletsToPooled(shieldFlames);
            this.bullets.push(...optimizedShieldFlames);
        }
        
        // Update enemies - with optimized bullet creation and update frequencies
        const allTargets = [this.player, ...this.allies];
        this.enemies = this.enemies.filter(enemy => {
            let bullets = [];

            // Determine update frequency based on entity type
            let shouldUpdate = true;
            if (enemy instanceof Superboss) {
                // Superboss always updates (critical)
                shouldUpdate = this.performanceManager.shouldUpdate('critical');
            } else if (enemy instanceof Tank) {
                // Tanks update at standard frequency
                shouldUpdate = this.performanceManager.shouldUpdate('standard');
            } else {
                // Regular enemies update at standard frequency
                shouldUpdate = this.performanceManager.shouldUpdate('standard');
            }

            if (shouldUpdate) {
                if (enemy instanceof Superboss) {
                    bullets = enemy.update(allTargets, this.walls, this);
                } else if (enemy instanceof Tank) {
                    bullets = enemy.update(this.enemies.filter(e => e.isAlly !== enemy.isAlly),
                                         this.allies.filter(a => a.isAlly !== enemy.isAlly), this.walls);
                } else if (enemy instanceof Ally) {
                    bullets = enemy.update(
                        enemy.isAlly ? this.enemies.filter(e => !e.isAlly) : allTargets,
                        enemy.isAlly ? this.allies : [],
                        this.walls
                    );
                } else {
                    bullets = enemy.update(allTargets, this.walls);
                }

                if (bullets.length > 0) {
                    const optimizedBullets = this.convertBulletsToPooled(bullets);
                    this.bullets.push(...optimizedBullets);
                }
            }

            return enemy.health > 0;
        });

        // Update allies - with optimized bullet creation and update frequencies
        this.allies = this.allies.filter(ally => {
            let bullets = [];

            // Allies update at standard frequency
            const shouldUpdate = this.performanceManager.shouldUpdate('standard');

            if (shouldUpdate) {
                if (ally instanceof Tank) {
                    bullets = ally.update(this.enemies.filter(e => !e.isAlly), this.allies, this.walls);
                } else {
                    bullets = ally.update(this.enemies.filter(e => !e.isAlly), this.allies, this.walls);
                }

                if (bullets.length > 0) {
                    const optimizedBullets = this.convertBulletsToPooled(bullets);
                    this.bullets.push(...optimizedBullets);
                }
            }

            return ally.health > 0;
        });
        
        // Update bunker - with optimized bullet creation
        if (this.bunker) {
            const allEnemies = [...this.enemies.filter(e => !e.isAlly)];
            this.enemySquads.forEach(squad => {
                allEnemies.push(...squad.members);
            });

            const bunkerBullets = this.bunker.update(allEnemies);
            if (bunkerBullets.length > 0) {
                const optimizedBunkerBullets = this.convertBulletsToPooled(bunkerBullets);
                this.bullets.push(...optimizedBunkerBullets);
            }

            if (this.bunker.health <= 0) {
                this.createOptimizedParticles(this.bunker.x, this.bunker.y, '#f44', 50);
                playSound('explosion', 1.0);
                this.bunker = null;
            }
        }

        // Update enemy squads - with optimized bullet creation
        this.enemySquads = this.enemySquads.filter(squad => {
            const allTargets = [this.player, ...this.allies];
            if (this.bunker) allTargets.push(this.bunker);

            const result = squad.update(allTargets, this.walls);
            if (result.bullets && result.bullets.length > 0) {
                const optimizedSquadBullets = this.convertBulletsToPooled(result.bullets);
                this.bullets.push(...optimizedSquadBullets);
            }

            return !result.destroyed;
        });
        
        // Update turrets - with optimized bullet creation
        this.turrets = this.turrets.filter(turret => {
            const allEnemies = [...this.enemies.filter(e => !e.isAlly),
                               ...this.turrets.filter(t => t.isAlly !== turret.isAlly)];
            const allAllies = [...this.allies, ...this.turrets.filter(t => t.isAlly === turret.isAlly)];

            const bullets = turret.update(
                turret.isAlly ? allEnemies : allTargets,
                turret.isAlly ? allAllies : this.enemies.filter(e => e.isAlly)
            );

            if (bullets.length > 0) {
                const optimizedTurretBullets = this.convertBulletsToPooled(bullets);
                this.bullets.push(...optimizedTurretBullets);
            }

            return turret.health > 0;
        });
        
        // Update factories - background frequency
        if (this.performanceManager.shouldUpdate('background')) {
            this.factories = this.factories.filter(factory => {
                factory.update(this.player, this.enemies.filter(e => !e.isAlly));

                // Count soldiers for this factory
                factory.soldiers = 0;
                [...this.allies, ...this.enemies].forEach(unit => {
                    if (unit instanceof Ally && unit.factory === factory) {
                        factory.soldiers++;
                    }
                });

                return factory.health > 0;
            });
        }

        // Update walls - background frequency
        if (this.performanceManager.shouldUpdate('background')) {
            this.walls = this.walls.filter(wall => {
                wall.update();
                return wall.health > 0;
            });
        }
        
        // Update bullets
        this.updateBullets();
        
        // Update pickups
        this.updatePickups();
        
        // Update particles
        updateParticles();
        
        // Laser damage
        const laser = this.player.weaponSystem.updateLaser(this.player.x, this.player.y);
        if (laser) {
            this.applyLaserDamage(laser);
        }
        
        // Check wave completion
        this.checkWaveComplete();
        
        // Check game over
        if (this.player.health <= 0) {
            this.endGame();
        }
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            // Update bullet position
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            // Update bullet properties
            if (bullet.lifetime !== undefined) {
                bullet.lifetime--;
                if (bullet.lifetime <= 0) {
                    this.poolManager.bulletPool.releaseBullet(bullet);
                    return false;
                }
            }

            if (bullet.flame) {
                bullet.radius = Math.min(bullet.radius + 0.5, 20);
                bullet.vx *= 0.95;
                bullet.vy *= 0.95;
            }

            // Homing missiles - use spatial manager for efficient enemy finding
            if (bullet.homing) {
                const nearbyEnemies = this.spatialManager.getEntitiesInRadius(
                    bullet.x, bullet.y, 200, 'enemies'
                );

                if (nearbyEnemies.length > 0) {
                    let closestEnemy = nearbyEnemies[0];
                    let closestDist = getDistance(bullet.x, bullet.y, closestEnemy.x, closestEnemy.y);

                    for (let i = 1; i < nearbyEnemies.length; i++) {
                        const dist = getDistance(bullet.x, bullet.y, nearbyEnemies[i].x, nearbyEnemies[i].y);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestEnemy = nearbyEnemies[i];
                        }
                    }

                    const angle = getAngle(bullet.x, bullet.y, closestEnemy.x, closestEnemy.y);
                    bullet.vx = lerp(bullet.vx, Math.cos(angle) * 10, 0.1);
                    bullet.vy = lerp(bullet.vy, Math.sin(angle) * 10, 0.1);
                }
            }

            // Out of bounds check
            if (bullet.x < -50 || bullet.x > this.canvas.width + 50 ||
                bullet.y < -50 || bullet.y > this.canvas.height + 50) {
                this.poolManager.bulletPool.releaseBullet(bullet);
                return false;
            }

            // Use spatial manager for wall collision detection
            const nearbyWalls = this.spatialManager.getPotentialCollisions(bullet);
            let hitWall = false;

            for (const wall of nearbyWalls) {
                if (this.spatialManager.entityCategories.walls.includes(wall)) {
                    if (this.spatialManager.checkWallCollision(bullet, wall)) {
                        wall.takeDamage(10);
                        this.createOptimizedParticles(bullet.x, bullet.y, '#888', 5);
                        hitWall = true;
                        break;
                    }
                }
            }

            if (hitWall) {
                this.poolManager.bulletPool.releaseBullet(bullet);
                return false;
            }
            
            // Optimized collision detection using spatial partitioning
            return this.handleBulletCollisions(bullet);
        });
    }

    handleBulletCollisions(bullet) {
        // Get potential collision targets using spatial manager
        const potentialTargets = this.spatialManager.getPotentialCollisions(bullet);

        if (bullet.isPlayer) {
            // Player bullets hit enemies
            for (const target of potentialTargets) {
                if (this.spatialManager.entityCategories.enemies.includes(target)) {
                    if (this.spatialManager.checkCollision(bullet, target)) {
                        target.takeDamage(bullet.damage);
                        this.createOptimizedParticles(bullet.x, bullet.y, '#ff4');
                        playSound('hit', 0.1);

                        if (target.health <= 0) {
                            this.handleEnemyDeath(target, bullet);
                        }

                        this.poolManager.bulletPool.releaseBullet(bullet);
                        return false; // Remove bullet
                    }
                }
            }

            // Check enemy squad members
            for (const squad of this.enemySquads) {
                for (const member of squad.members) {
                    if (this.spatialManager.checkCollision(bullet, member)) {
                        member.takeDamage(bullet.damage);
                        this.createOptimizedParticles(bullet.x, bullet.y, '#ff4');
                        playSound('hit', 0.1);

                        if (member.health <= 0) {
                            this.score += 15;
                            if (Math.random() < 0.4) {
                                this.spawnPickup(member.x, member.y);
                            }
                        }

                        this.poolManager.bulletPool.releaseBullet(bullet);
                        return false;
                    }
                }
            }

            // Check enemy turrets
            for (const turret of this.turrets) {
                if (!turret.isAlly && this.spatialManager.checkCollision(bullet, turret)) {
                    turret.takeDamage(bullet.damage);
                    this.createOptimizedParticles(bullet.x, bullet.y, '#ff4');

                    if (turret.health <= 0) {
                        this.score += 50;
                        if (Math.random() < 0.5) {
                            this.spawnPickup(turret.x, turret.y);
                        }

                        if (bullet.explosive) {
                            const explosion = createExplosion(turret.x, turret.y);
                            this.applyExplosionDamage(explosion);
                        }
                    }

                    this.poolManager.bulletPool.releaseBullet(bullet);
                    return false;
                }
            }
        } else if (bullet.isAlly) {
            // Allied bullets hit enemies
            for (const target of potentialTargets) {
                if (this.spatialManager.entityCategories.enemies.includes(target) && !target.isAlly) {
                    if (this.spatialManager.checkCollision(bullet, target)) {
                        target.takeDamage(bullet.damage);
                        this.createOptimizedParticles(bullet.x, bullet.y, '#ff4');

                        if (target.health <= 0) {
                            this.score += target instanceof Tank ? 25 : 5;
                            if (Math.random() < 0.5) {
                                this.spawnPickup(target.x, target.y, true);
                            }
                        }

                        this.poolManager.bulletPool.releaseBullet(bullet);
                        return false;
                    }
                }
            }

            // Check enemy squad members
            for (const squad of this.enemySquads) {
                for (const member of squad.members) {
                    if (this.spatialManager.checkCollision(bullet, member)) {
                        member.takeDamage(bullet.damage);
                        this.createOptimizedParticles(bullet.x, bullet.y, '#ff4');

                        if (member.health <= 0) {
                            this.score += 8;
                            if (Math.random() < 0.5) {
                                this.spawnPickup(member.x, member.y, true);
                            }
                        }

                        this.poolManager.bulletPool.releaseBullet(bullet);
                        return false;
                    }
                }
            }

            // Hit enemy turrets
            for (const turret of this.turrets) {
                if (!turret.isAlly && this.spatialManager.checkCollision(bullet, turret)) {
                    turret.takeDamage(bullet.damage);
                    this.createOptimizedParticles(bullet.x, bullet.y, '#ff4');
                    this.poolManager.bulletPool.releaseBullet(bullet);
                    return false;
                }
            }
        } else {
            // Enemy bullets hit player and allies
            if (this.spatialManager.checkCollision(bullet, this.player)) {
                this.player.takeDamage(bullet.damage);
                this.poolManager.bulletPool.releaseBullet(bullet);
                return false;
            }

            for (const target of potentialTargets) {
                if (this.spatialManager.entityCategories.allies.includes(target)) {
                    if (this.spatialManager.checkCollision(bullet, target)) {
                        target.takeDamage(bullet.damage);
                        this.createOptimizedParticles(bullet.x, bullet.y, '#f44');
                        this.poolManager.bulletPool.releaseBullet(bullet);
                        return false;
                    }
                }
            }

            // Check bunker collisions (simplified for now)
            if (this.bunker && !this.bunker.isConstructing) {
                const bunkerDist = getDistance(bullet.x, bullet.y, this.bunker.x, this.bunker.y);
                if (bunkerDist < this.bunker.radius) {
                    this.bunker.takeDamage(bullet.damage);
                    this.createOptimizedParticles(bullet.x, bullet.y, '#f44');
                    this.poolManager.bulletPool.releaseBullet(bullet);
                    return false;
                }
            }
        }

        return true; // Keep bullet
    }

    handleEnemyDeath(enemy, bullet) {
        if (enemy instanceof Superboss) {
            this.lastBossWave = this.wave;
            this.score += 1000 * this.wave;

            // Guaranteed multiple drops
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const dist = 50;
                const x = enemy.x + Math.cos(angle) * dist;
                const y = enemy.y + Math.sin(angle) * dist;

                if (i < 2) {
                    this.pickups.push(createUpgradePickup(x, y));
                } else if (i === 2) {
                    this.pickups.push({
                        x, y, type: 'allyBoost', radius: 15,
                        lifetime: 15000, created: Date.now()
                    });
                } else {
                    this.pickups.push({
                        x, y, type: 'health', radius: 10,
                        lifetime: 10000, created: Date.now()
                    });
                }
            }
        } else {
            this.score += enemy instanceof Tank ? 50 : 10;
            const pickupChance = this.difficultyMultipliers[this.difficulty].pickupChance || 0.3;
            if (Math.random() < pickupChance) {
                this.spawnPickup(enemy.x, enemy.y);
            }
        }

        if (bullet.explosive) {
            const explosion = createExplosion(enemy.x, enemy.y);
            this.applyExplosionDamage(explosion);
        }
    }

    createOptimizedParticles(x, y, color, count = 5) {
        // Use particle pool for better performance
        const newParticles = this.poolManager.particlePool.createParticle(x, y, color, count);
        // Add to global particles array
        particles.push(...newParticles);
    }

    createOptimizedBullet(properties) {
        // Use bullet pool for better performance
        return this.poolManager.bulletPool.createBullet(properties);
    }

    // Helper method to convert old bullet arrays to pooled bullets
    convertBulletsToPooled(bulletArray) {
        return bulletArray.map(bulletProps => this.createOptimizedBullet(bulletProps));
    }
    
    updatePickups() {
        const now = Date.now();
        
        this.pickups = this.pickups.filter(pickup => {
            // Expire old pickups
            if (now - pickup.created > pickup.lifetime) {
                return false;
            }
            
            // Check player collision
            if (checkCollision(pickup, this.player)) {
                if (pickup.type === 'ammo') {
                    const weapon = this.player.weaponSystem.weapons[this.player.weaponSystem.currentWeapon];
                    weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + Math.floor(weapon.maxAmmo * 0.5));
                } else if (pickup.type === 'health') {
                    if (this.player.health >= this.player.maxHealth) {
                        // At full health, increase max health
                        this.player.maxHealth += 20;
                        this.player.health = this.player.maxHealth;
                        this.player.updateSizeFromHealth();
                        createParticles(this.player.x, this.player.y, '#0f0', 20);
                    } else {
                        // Heal up to max health
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
                    }
                } else if (pickup.type === 'weapon') {
                    this.player.weaponSystem.switchWeapon(pickup.weaponIndex);
                    const weapon = this.player.weaponSystem.weapons[pickup.weaponIndex];
                    weapon.ammo = Math.max(weapon.ammo, Math.floor(weapon.maxAmmo * 0.5));
                } else if (pickup.type === 'upgrade') {
                    this.player.addUpgrade(pickup.upgrade);
                } else if (pickup.type === 'allyBoost') {
                    // Upgrade all allies on screen
                    this.allies.forEach(ally => {
                        if (ally.health < ally.maxHealth) {
                            ally.health = ally.maxHealth; // Heal all allies
                        }
                        ally.speed *= 1.2; // Speed boost
                        ally.damage = (ally.damage || 10) * 1.3; // Damage boost
                        createParticles(ally.x, ally.y, '#4f4', 15);
                    });
                    createParticles(this.player.x, this.player.y, '#ff0', 30);
                    playSound('heal', 0.5);
                }
                
                createParticles(pickup.x, pickup.y, '#4ff');
                playSound('pickup');
                this.updateDisplay();
                return false;
            }
            
            // Check enemy/ally collision with weapon upgrades
            if (pickup.type === 'upgrade') {
                let collected = false;
                
                [...this.enemies, ...this.allies].forEach(unit => {
                    if (!collected && checkCollision(pickup, unit)) {
                        if (unit.upgradeCount !== undefined) {
                            unit.weaponSystem.addUpgrade(pickup.upgrade);
                            unit.upgradeCount++;
                            unit.radius = unit.radius + 2;
                            unit.speed *= 0.9;
                        }
                        createParticles(pickup.x, pickup.y, '#f44');
                        collected = true;
                        
                        // Apply global upgrades to all allies
                        if (pickup.upgrade.isGlobal && unit.isAlly) {
                            this.applyGlobalUpgrade(pickup.upgrade);
                        }
                    }
                });
                
                if (collected) return false;
            }
            
            return true;
        });
    }
    
    applyExplosionDamage(explosion) {
        // Damage all entities in explosion radius
        [...this.enemies, ...this.allies].forEach(entity => {
            const distance = getDistance(entity.x, entity.y, explosion.x, explosion.y);
            if (distance < explosion.radius) {
                const damage = explosion.damage * (1 - distance / explosion.radius);
                entity.takeDamage(damage);
            }
        });
        
        this.turrets.forEach(turret => {
            const distance = getDistance(turret.x, turret.y, explosion.x, explosion.y);
            if (distance < explosion.radius) {
                const damage = explosion.damage * (1 - distance / explosion.radius);
                turret.takeDamage(damage);
            }
        });
    }
    
    applyLaserDamage(laser) {
        const laserEndX = laser.x + Math.cos(laser.angle) * laser.length;
        const laserEndY = laser.y + Math.sin(laser.angle) * laser.length;
        
        // Check enemies
        this.enemies.forEach(enemy => {
            const dist = this.pointToLineDistance(enemy.x, enemy.y, laser.x, laser.y, laserEndX, laserEndY);
            if (dist < enemy.radius + 5) {
                enemy.takeDamage(laser.damage || 2);
                if (Math.random() < 0.1) {
                    createParticles(enemy.x, enemy.y, '#f0f', 3);
                    playSound('laser', 0.05);
                }
            }
        });
    }
    
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    render() {
        this.renderer.clear();
        this.renderer.drawGrid();
        
        // Draw pickups
        this.pickups.forEach(pickup => this.renderer.drawPickup(pickup));
        
        // Draw particles
        particles.forEach(particle => this.renderer.drawParticle(particle));
        
        // Draw walls
        this.walls.forEach(wall => this.renderer.drawWall(wall));
        
        // Draw factories
        this.factories.forEach(factory => this.renderer.drawFactory(factory));
        
        // Draw turrets
        this.turrets.forEach(turret => this.renderer.drawTurret(turret));
        
        // Draw bunker
        this.renderer.drawBunker(this.bunker);
        
        // Draw enemy squads
        this.enemySquads.forEach(squad => this.renderer.drawEnemySquad(squad));
        
        // Draw tanks and soldiers
        [...this.enemies, ...this.allies].forEach(entity => {
            if (entity instanceof Superboss) {
                this.renderer.drawSuperboss(entity);
            } else if (entity instanceof Tank) {
                this.renderer.drawTank(entity);
            } else if (entity instanceof Ally) {
                this.renderer.drawAlly(entity);
            } else {
                this.renderer.drawEnemy(entity);
            }
        });
        
        // Draw player
        this.renderer.drawPlayer(this.player);
        
        // Draw bullets
        this.bullets.forEach(bullet => this.renderer.drawBullet(bullet));
    }
    
    updateDisplay() {
        const weapon = this.player.weaponSystem.weapons[this.player.weaponSystem.currentWeapon];
        this.renderer.drawUI(this.score, this.wave, weapon.ammo, weapon.maxAmmo, weapon.name, 
                           this.player.health, this.player.maxHealth, this.bunker);
        
        // Update health bar
        const healthFill = document.getElementById('healthFill');
        healthFill.style.width = (this.player.health / this.player.maxHealth * 100) + '%';
    }
    
    gameLoop() {
        if (!this.gameActive) return;

        // Start performance tracking
        this.performanceManager.startFrame();

        // Update spatial manager with current game state
        this.spatialManager.update({
            bullets: this.bullets,
            enemies: this.enemies,
            allies: this.allies,
            walls: this.walls,
            pickups: this.pickups,
            player: this.player,
            enemySquads: this.enemySquads,
            turrets: this.turrets
        });

        // Update entity counts for performance monitoring
        this.performanceManager.updateEntityCounts({
            bullets: this.bullets.length,
            enemies: this.enemies.length,
            allies: this.allies.length,
            particles: particles.length,
            effects: 0, // Will be updated when effects are implemented
            walls: this.walls.length,
            pickups: this.pickups.length
        });

        this.updateGame();
        this.render();
        this.updateDisplay();

        // End performance tracking
        this.performanceManager.endFrame();

        // Update performance UI if enabled
        if (this.showPerformanceInfo) {
            this.updatePerformanceUI();
        }

        // Auto-expand pools if needed
        this.poolManager.autoExpand();

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    togglePerformanceInfo() {
        this.showPerformanceInfo = !this.showPerformanceInfo;
        const perfInfo = document.getElementById('performanceInfo');
        if (perfInfo) {
            perfInfo.style.display = this.showPerformanceInfo ? 'block' : 'none';
        }
    }

    updatePerformanceUI() {
        const stats = this.performanceManager.getStats();
        const spatialStats = this.spatialManager.getStats();

        const fpsElement = document.getElementById('fps');
        const entityCountElement = document.getElementById('entityCount');
        const qualityElement = document.getElementById('qualityLevel');
        const collisionElement = document.getElementById('collisionChecks');

        if (fpsElement) fpsElement.textContent = stats.fps;
        if (entityCountElement) entityCountElement.textContent = stats.entityCounts.total;
        if (qualityElement) qualityElement.textContent = stats.qualityLevel;
        if (collisionElement) collisionElement.textContent = spatialStats.collisionChecksLastFrame;
    }

    endGame() {
        this.gameActive = false;
        cancelAnimationFrame(this.animationId);
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.wave;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    applyGlobalUpgrade(upgrade) {
        // Apply upgrade effects to all allied units
        [...this.allies, this.player].forEach(unit => {
            switch(upgrade.type) {
                case 'rally':
                    // Boost damage - implemented in shooting logic
                    if (unit.globalDamageBoost === undefined) unit.globalDamageBoost = 0;
                    unit.globalDamageBoost += 5;
                    createParticles(unit.x, unit.y, '#ff0', 5);
                    break;
                case 'armor':
                    // Reduce incoming damage - implemented in takeDamage
                    if (unit.damageReduction === undefined) unit.damageReduction = 0;
                    unit.damageReduction = Math.min(0.5, unit.damageReduction + 0.1);
                    createParticles(unit.x, unit.y, '#08f', 5);
                    break;
                case 'speed':
                    // Increase movement speed
                    if (unit.speed && unit.baseSpeed) {
                        unit.speed = unit.baseSpeed * (1.2 + (unit.speedBoosts || 0) * 0.1);
                        if (unit.speedBoosts === undefined) unit.speedBoosts = 0;
                        unit.speedBoosts++;
                    }
                    createParticles(unit.x, unit.y, '#0ff', 5);
                    break;
            }
        });
        
        // Show global effect message
        const msg = document.getElementById('waveMessage');
        msg.textContent = `${upgrade.name} aktiviert!`;
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; }, 2000);
    }
}

// Create global game manager
const gameManager = new GameManager();

// Make it available globally
if (typeof window !== 'undefined') {
    window.gameManager = gameManager;
}