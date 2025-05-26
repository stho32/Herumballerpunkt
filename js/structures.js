// Structure Classes

class Turret {
    constructor(x, y, type = 'mg', isAlly = false) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.isAlly = isAlly;
        this.lastShot = 0;
        this.angle = 0;
        this.type = type;
        
        switch(type) {
            case 'rocket':
                this.health = 150;
                this.maxHealth = 150;
                this.fireRate = 1500;
                this.damage = 80;
                this.range = 400;
                this.bulletSpeed = 12;
                this.explosive = true;
                break;
            case 'heal':
                this.health = 100;
                this.maxHealth = 100;
                this.fireRate = 0;
                this.healRadius = 150;
                this.healRate = 3;
                this.range = 0;
                break;
            default: // mg
                this.health = 120;
                this.maxHealth = 120;
                this.fireRate = 200;
                this.damage = 15;
                this.range = 300;
                this.bulletSpeed = 15;
        }
    }
    
    update(enemies, allies) {
        if (this.type === 'heal') {
            this.heal(this.isAlly ? allies : enemies);
            return [];
        }
        
        const targets = this.isAlly ? enemies : [...allies, gameManager.player];
        let closestTarget = null;
        let closestDistance = this.range;
        
        targets.forEach(target => {
            const distance = getDistance(this.x, this.y, target.x, target.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = target;
            }
        });
        
        if (closestTarget) {
            this.angle = getAngle(this.x, this.y, closestTarget.x, closestTarget.y);
            
            if (Date.now() - this.lastShot > this.fireRate) {
                this.lastShot = Date.now();
                return this.shoot(closestTarget.x, closestTarget.y);
            }
        }
        
        return [];
    }
    
    shoot(targetX, targetY) {
        const angle = this.angle;
        playSound('shoot', 0.2);
        
        return [{
            x: this.x + Math.cos(angle) * 30,
            y: this.y + Math.sin(angle) * 30,
            vx: Math.cos(angle) * this.bulletSpeed,
            vy: Math.sin(angle) * this.bulletSpeed,
            radius: this.explosive ? 6 : 4,
            damage: this.damage,
            isPlayer: false,
            isAlly: this.isAlly,
            color: this.isAlly ? '#4f4' : '#f00',
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
                }
            }
        });
        
        // Heal player if ally
        if (this.isAlly && gameManager.player) {
            const distance = getDistance(this.x, this.y, gameManager.player.x, gameManager.player.y);
            if (distance < this.healRadius && gameManager.player.health < gameManager.player.maxHealth) {
                gameManager.player.health = Math.min(gameManager.player.maxHealth, gameManager.player.health + this.healRate);
                if (Math.random() < 0.05) playSound('heal', 0.1);
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            createParticles(this.x, this.y, this.isAlly ? '#44f' : '#f44', 20);
            playSound('explosion', 0.3);
            
            // Chance for conversion
            if (!this.isAlly && Math.random() < 0.3) {
                gameManager.spawnTurret(this.x, this.y, this.type, true);
                createParticles(this.x, this.y, '#4f4', 15);
            } else if (this.isAlly && Math.random() < 0.2) {
                gameManager.spawnTurret(this.x, this.y, this.type, false);
                createParticles(this.x, this.y, '#f44', 15);
            }
        }
    }
}

class Factory {
    constructor(x, y, type = 'infantry') {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.radius = 40; // For collision
        this.type = type;
        this.isAlly = false;
        this.health = 500;
        this.maxHealth = 500;
        this.soldiers = 0;
        this.maxSoldiers = 10;
        this.lastSpawn = Date.now();
        this.spawnRate = 5000;
        this.captureProgress = 0;
        this.captureRequired = 100;
        this.capturingEntity = null;
        this.lastBuild = Date.now();
        this.buildRate = 30000;
        this.buildProgress = 0;
        this.patrolRadius = 200; // Radius within which soldiers stay
        
        // Type-specific properties
        switch(type) {
            case 'heavy':
                this.soldierType = 'mg';
                this.turretType = 'rocket';
                break;
            case 'assault':
                this.soldierType = 'shotgun';
                this.turretType = 'heal';
                break;
            default: // infantry
                this.soldierType = 'pistol';
                this.turretType = 'mg';
        }
    }
    
    update(player, enemies) {
        // Check capture
        const captureDistance = 60;
        let capturing = false;
        
        // Player capture
        if (!this.isAlly && getDistance(this.x, this.y, player.x, player.y) < captureDistance) {
            if (gameManager.keys['e']) {
                this.captureProgress += 2;
                capturing = true;
                this.capturingEntity = 'player';
                
                if (this.captureProgress >= this.captureRequired) {
                    this.capture(true);
                }
            }
        }
        
        // Enemy capture
        if (this.isAlly) {
            enemies.forEach(enemy => {
                if (getDistance(this.x, this.y, enemy.x, enemy.y) < captureDistance) {
                    this.captureProgress += 1;
                    capturing = true;
                    this.capturingEntity = 'enemy';
                    
                    if (this.captureProgress >= this.captureRequired) {
                        this.capture(false);
                    }
                }
            });
        }
        
        if (!capturing && this.captureProgress > 0) {
            this.captureProgress = Math.max(0, this.captureProgress - 1);
        }
        
        // Spawn soldiers
        if (this.soldiers < this.maxSoldiers && Date.now() - this.lastSpawn > this.spawnRate) {
            this.spawnSoldier();
        }
        
        // Build turrets when at max capacity
        if (this.soldiers >= this.maxSoldiers) {
            this.buildProgress += 1;
            
            if (this.buildProgress >= 100 && Date.now() - this.lastBuild > this.buildRate) {
                this.buildTurret();
            }
        } else {
            this.buildProgress = 0;
        }
    }
    
    capture(byPlayer) {
        this.isAlly = byPlayer;
        this.captureProgress = 0;
        this.soldiers = Math.floor(this.soldiers / 2); // Lose half soldiers on capture
        createParticles(this.x, this.y, byPlayer ? '#4f4' : '#f44', 30);
        playSound('capture');
    }
    
    spawnSoldier() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 60;
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;
        
        const soldier = new Ally(x, y, this.soldierType, this.isAlly, this);
        
        if (this.isAlly) {
            gameManager.allies.push(soldier);
        } else {
            gameManager.enemies.push(soldier);
        }
        
        this.soldiers++;
        this.lastSpawn = Date.now();
        createParticles(x, y, this.isAlly ? '#44f' : '#f44', 5);
    }
    
    buildTurret() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100;
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;
        
        // Check if space is clear
        let spaceClear = true;
        gameManager.turrets.forEach(turret => {
            if (getDistance(x, y, turret.x, turret.y) < 50) {
                spaceClear = false;
            }
        });
        
        if (spaceClear) {
            // 30% chance to build tank instead
            if (Math.random() < 0.3) {
                const tankTypes = ['light', 'heavy', 'support'];
                const tankType = tankTypes[Math.floor(Math.random() * tankTypes.length)];
                const tank = new Tank(x, y, tankType, this.isAlly);
                
                if (this.isAlly) {
                    gameManager.allies.push(tank);
                } else {
                    gameManager.enemies.push(tank);
                }
            } else {
                gameManager.spawnTurret(x, y, this.turretType, this.isAlly);
            }
            
            this.lastBuild = Date.now();
            this.buildProgress = 0;
            playSound('build');
            createParticles(x, y, '#ff0', 20);
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            // Lose all soldiers
            this.soldiers = 0;
            createParticles(this.x, this.y, this.isAlly ? '#44f' : '#f44', 40);
            playSound('explosion', 0.5);
        }
    }
}

class Wall {
    constructor(x, y, width, height, temporary = true) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.health = 200;
        this.maxHealth = 200;
        this.temporary = temporary;
        this.lifetime = temporary ? 15000 + Math.random() * 15000 : 0;
        this.created = Date.now();
    }
    
    update() {
        if (this.temporary && Date.now() - this.created > this.lifetime) {
            this.health = 0; // Mark for removal
            createParticles(this.x + this.width/2, this.y + this.height/2, '#888', 15);
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            createParticles(this.x + this.width/2, this.y + this.height/2, '#666', 20);
        }
    }
}