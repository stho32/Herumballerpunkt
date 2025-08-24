// Main Game Manager

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

class GameManager {
    constructor() {
        this.canvas = canvas;
        this.ctx = ctx;
        this.renderer = new Renderer(canvas, ctx);
        
        // Game state
        this.gameActive = false;
        this.score = 0;
        this.wave = 1;
        this.waveActive = false;
        this.waveEnemies = [];
        this.animationId = null;
        this.difficulty = 'normal'; // easy, normal, hard
        
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

        // Power-Up System
        this.powerUpManager = new PowerUpManager();
        this.spawnedPowerUps = [];
        this.activePowerUps = new Map();

        // Environmental Hazards System
        this.hazardManager = new HazardManager();
        this.gameStartTime = Date.now();
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        this.setupEventListeners();
    }
    
    init() {
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
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
        this.spawnedPowerUps = [];
        this.activePowerUps.clear();
        this.hazardManager.clearAllHazards();
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

            // Notify hazard manager of wave completion
            this.hazardManager.onWaveComplete();

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
    
    spawnPickup(x, y, fromAlly = false, isElite = false, isBoss = false) {
        const rand = Math.random();
        const diffMult = this.difficultyMultipliers[this.difficulty];

        // Check for power-up spawn first
        let eventType = 'enemy_kill';
        if (isBoss) eventType = 'boss_kill';
        else if (isElite) eventType = 'elite_kill';

        if (this.powerUpManager.shouldSpawnPowerUp(eventType, this)) {
            this.powerUpManager.spawnPowerUp(x, y);
        }

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
        
        // Player shooting
        if (this.player.isFiring) {
            const bullets = this.player.shoot(this.mouse.x, this.mouse.y);
            this.bullets.push(...bullets);
        }
        
        // Player weapon upgrades
        const upgradeBullets = this.player.weaponSystem.updateUpgrades(
            this.player.x, this.player.y, this.mouse.x, this.mouse.y
        );
        this.bullets.push(...upgradeBullets);
        
        // Fire shield
        const shieldFlames = this.player.weaponSystem.updateShield(this.player.x, this.player.y);
        this.bullets.push(...shieldFlames);
        
        // Update enemies
        const allTargets = [this.player, ...this.allies];
        this.enemies = this.enemies.filter(enemy => {
            if (enemy instanceof Superboss) {
                const bullets = enemy.update(allTargets, this.walls, this);
                this.bullets.push(...bullets);
            } else if (enemy instanceof Tank) {
                const bullets = enemy.update(this.enemies.filter(e => e.isAlly !== enemy.isAlly), 
                                           this.allies.filter(a => a.isAlly !== enemy.isAlly), this.walls);
                this.bullets.push(...bullets);
            } else if (enemy instanceof Ally) {
                const bullets = enemy.update(
                    enemy.isAlly ? this.enemies.filter(e => !e.isAlly) : allTargets,
                    enemy.isAlly ? this.allies : [],
                    this.walls
                );
                this.bullets.push(...bullets);
            } else {
                const bullets = enemy.update(allTargets, this.walls);
                this.bullets.push(...bullets);
            }
            return enemy.health > 0;
        });
        
        // Update allies
        this.allies = this.allies.filter(ally => {
            if (ally instanceof Tank) {
                const bullets = ally.update(this.enemies.filter(e => !e.isAlly), this.allies, this.walls);
                this.bullets.push(...bullets);
            } else {
                const bullets = ally.update(this.enemies.filter(e => !e.isAlly), this.allies, this.walls);
                this.bullets.push(...bullets);
            }
            return ally.health > 0;
        });
        
        // Update bunker
        if (this.bunker) {
            const allEnemies = [...this.enemies.filter(e => !e.isAlly)];
            this.enemySquads.forEach(squad => {
                allEnemies.push(...squad.members);
            });
            
            const bunkerBullets = this.bunker.update(allEnemies);
            this.bullets.push(...bunkerBullets);
            
            if (this.bunker.health <= 0) {
                createParticles(this.bunker.x, this.bunker.y, '#f44', 50);
                playSound('explosion', 1.0);
                this.bunker = null;
            }
        }
        
        // Update enemy squads
        this.enemySquads = this.enemySquads.filter(squad => {
            const allTargets = [this.player, ...this.allies];
            if (this.bunker) allTargets.push(this.bunker);
            
            const result = squad.update(allTargets, this.walls);
            this.bullets.push(...result.bullets);
            
            return !result.destroyed;
        });
        
        // Update turrets
        this.turrets = this.turrets.filter(turret => {
            const allEnemies = [...this.enemies.filter(e => !e.isAlly), 
                               ...this.turrets.filter(t => t.isAlly !== turret.isAlly)];
            const allAllies = [...this.allies, ...this.turrets.filter(t => t.isAlly === turret.isAlly)];
            
            const bullets = turret.update(
                turret.isAlly ? allEnemies : allTargets,
                turret.isAlly ? allAllies : this.enemies.filter(e => e.isAlly)
            );
            this.bullets.push(...bullets);
            
            return turret.health > 0;
        });
        
        // Update factories
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
        
        // Update walls
        this.walls = this.walls.filter(wall => {
            wall.update();
            return wall.health > 0;
        });
        
        // Update bullets
        this.updateBullets();
        
        // Update pickups
        this.updatePickups();

        // Update power-ups
        this.powerUpManager.update(this);

        // Update environmental hazards
        this.hazardManager.update(this);

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
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            // Update bullet properties
            if (bullet.lifetime !== undefined) {
                bullet.lifetime--;
                if (bullet.lifetime <= 0) return false;
            }
            
            if (bullet.flame) {
                bullet.radius = Math.min(bullet.radius + 0.5, 20);
                bullet.vx *= 0.95;
                bullet.vy *= 0.95;
            }
            
            // Homing missiles
            if (bullet.homing) {
                let closestEnemy = null;
                let closestDist = 200;
                
                this.enemies.forEach(enemy => {
                    const dist = getDistance(bullet.x, bullet.y, enemy.x, enemy.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestEnemy = enemy;
                    }
                });
                
                if (closestEnemy) {
                    const angle = getAngle(bullet.x, bullet.y, closestEnemy.x, closestEnemy.y);
                    bullet.vx = lerp(bullet.vx, Math.cos(angle) * 10, 0.1);
                    bullet.vy = lerp(bullet.vy, Math.sin(angle) * 10, 0.1);
                }
            }
            
            // Out of bounds
            if (bullet.x < -50 || bullet.x > this.canvas.width + 50 || 
                bullet.y < -50 || bullet.y > this.canvas.height + 50) {
                return false;
            }
            
            // Wall collision
            let hitWall = false;
            this.walls.forEach(wall => {
                if (bullet.x > wall.x && bullet.x < wall.x + wall.width &&
                    bullet.y > wall.y && bullet.y < wall.y + wall.height) {
                    wall.takeDamage(10);
                    createParticles(bullet.x, bullet.y, '#888', 5);
                    hitWall = true;
                }
            });
            if (hitWall) return false;
            
            // Handle collisions
            if (bullet.isPlayer) {
                // Check enemy hits
                this.enemies.forEach(enemy => {
                    if (checkCollision(bullet, enemy)) {
                        enemy.takeDamage(bullet.damage);
                        createParticles(bullet.x, bullet.y, '#ff4');
                        playSound('hit', 0.1);
                        
                        if (enemy.health <= 0) {
                            // Check for explosion aura power-up
                            if (this.activePowerUps.has('EXPLOSION_AURA')) {
                                this.createExplosionAura(enemy.x, enemy.y);
                            }

                            // Superboss rewards
                            if (enemy instanceof Superboss) {
                                this.lastBossWave = this.wave; // Track boss defeat for reorganization
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
                                            x, y,
                                            type: 'allyBoost',
                                            radius: 15,
                                            lifetime: 15000,
                                            created: Date.now()
                                        });
                                    } else {
                                        this.pickups.push({
                                            x, y,
                                            type: 'health',
                                            radius: 10,
                                            lifetime: 10000,
                                            created: Date.now()
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
                        
                        hitWall = true;
                    }
                });
                
                // Check enemy squad member hits
                this.enemySquads.forEach(squad => {
                    squad.members.forEach(member => {
                        if (checkCollision(bullet, member)) {
                            member.takeDamage(bullet.damage);
                            createParticles(bullet.x, bullet.y, '#ff4');
                            playSound('hit', 0.1);
                            
                            if (member.health <= 0) {
                                // Check for explosion aura power-up
                                if (this.activePowerUps.has('EXPLOSION_AURA')) {
                                    this.createExplosionAura(member.x, member.y);
                                }

                                this.score += 15; // Squad members worth more points
                                if (Math.random() < 0.4) { // Higher drop chance
                                    this.spawnPickup(member.x, member.y);
                                }
                            }
                            
                            hitWall = true;
                        }
                    });
                });
                
                // Check enemy turret hits
                this.turrets.forEach(turret => {
                    if (!turret.isAlly && checkCollision(bullet, turret)) {
                        turret.takeDamage(bullet.damage);
                        createParticles(bullet.x, bullet.y, '#ff4');
                        
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
                        
                        hitWall = true;
                    }
                });
            } else if (bullet.isAlly) {
                // Allied bullets hit enemies
                this.enemies.forEach(enemy => {
                    if (!enemy.isAlly && checkCollision(bullet, enemy)) {
                        enemy.takeDamage(bullet.damage);
                        createParticles(bullet.x, bullet.y, '#ff4');
                        
                        // When allies kill enemies, higher chance for upgrade drops
                        if (enemy.health <= 0) {
                            this.score += enemy instanceof Tank ? 25 : 5; // Half points for ally kills
                            if (Math.random() < 0.5) { // Higher drop chance from ally kills
                                this.spawnPickup(enemy.x, enemy.y, true);
                            }
                        }
                        
                        hitWall = true;
                    }
                });
                
                // Allied bullets hit enemy squad members  
                this.enemySquads.forEach(squad => {
                    squad.members.forEach(member => {
                        if (checkCollision(bullet, member)) {
                            member.takeDamage(bullet.damage);
                            createParticles(bullet.x, bullet.y, '#ff4');
                            
                            if (member.health <= 0) {
                                this.score += 8; // Less points for ally kills
                                if (Math.random() < 0.5) {
                                    this.spawnPickup(member.x, member.y, true);
                                }
                            }
                            
                            hitWall = true;
                        }
                    });
                });
                
                // Hit enemy turrets
                this.turrets.forEach(turret => {
                    if (!turret.isAlly && checkCollision(bullet, turret)) {
                        turret.takeDamage(bullet.damage);
                        createParticles(bullet.x, bullet.y, '#ff4');
                        hitWall = true;
                    }
                });
            } else {
                // Enemy bullets hit player and allies
                if (checkCollision(bullet, this.player)) {
                    this.player.takeDamage(bullet.damage);
                    hitWall = true;
                }
                
                this.allies.forEach(ally => {
                    if (checkCollision(bullet, ally)) {
                        ally.takeDamage(bullet.damage);
                        createParticles(bullet.x, bullet.y, '#f44');
                        hitWall = true;
                    }
                });
                
                // Check bunker collisions
                if (this.bunker && !this.bunker.isConstructing) {
                    let bunkerHit = false;
                    
                    // First check individual turrets
                    this.bunker.modules.forEach((module, moduleIndex) => {
                        if (bunkerHit) return;
                        
                        module.turrets.forEach((turret, turretIndex) => {
                            if (bunkerHit || turret.health <= 0) return;
                            
                            const turretPos = this.bunker.getTurretPosition(moduleIndex, turretIndex);
                            const turretDist = getDistance(bullet.x, bullet.y, turretPos.x, turretPos.y);
                            
                            if (turretDist < 25) { // Turret hit radius
                                this.bunker.takeDamage(bullet.damage, moduleIndex, turretIndex);
                                createParticles(bullet.x, bullet.y, '#f44');
                                hitWall = true;
                                bunkerHit = true;
                            }
                        });
                    });
                    
                    // If no turret hit, check modules and main bunker
                    if (!bunkerHit) {
                        const bunkerDist = getDistance(bullet.x, bullet.y, this.bunker.x, this.bunker.y);
                        if (bunkerDist < this.bunker.radius) {
                            // Find closest module
                            let closestModuleIndex = -1;
                            let closestDistance = this.bunker.radius;
                            
                            this.bunker.modules.forEach((module, index) => {
                                if (module.health > 0) {
                                    const modulePos = this.bunker.getModulePosition(index);
                                    const dist = getDistance(bullet.x, bullet.y, modulePos.x, modulePos.y);
                                    if (dist < 30 && dist < closestDistance) {
                                        closestDistance = dist;
                                        closestModuleIndex = index;
                                    }
                                }
                            });
                            
                            this.bunker.takeDamage(bullet.damage, closestModuleIndex);
                            createParticles(bullet.x, bullet.y, '#f44');
                            hitWall = true;
                        }
                    }
                }
            }
            
            return !hitWall;
        });
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

        // Draw power-ups
        this.powerUpManager.render(this.ctx);

        // Draw environmental hazards
        this.hazardManager.render(this.ctx);

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
        
        this.updateGame();
        this.render();
        this.updateDisplay();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
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

    createExplosionAura(x, y) {
        const config = POWER_UP_CONFIGS.EXPLOSION_AURA;
        const explosionRadius = config.effects.explosionRadius;
        const explosionDamage = config.effects.explosionDamage;

        // Create visual explosion effect
        createParticles(x, y, '#ff8844', 20);
        createParticles(x, y, '#ffaa00', 15);
        playSound('explosion', 0.3);

        // Apply damage to nearby enemies
        [...this.enemies, ...this.enemySquads.flatMap(squad => squad.members)].forEach(enemy => {
            const distance = getDistance(x, y, enemy.x, enemy.y);
            if (distance <= explosionRadius && enemy.health > 0) {
                const damageMultiplier = 1 - (distance / explosionRadius);
                const finalDamage = explosionDamage * damageMultiplier;
                enemy.takeDamage(finalDamage);

                // Create chain reaction if enemy dies
                if (enemy.health <= 0) {
                    setTimeout(() => {
                        if (this.activePowerUps.has('EXPLOSION_AURA')) {
                            this.createExplosionAura(enemy.x, enemy.y);
                        }
                    }, 100);
                }
            }
        });
    }
}

// Create global game manager
const gameManager = new GameManager();