// Bunker System - Consolidates soldiers into a central fortress

class BunkerComplex {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.modules = [];
        this.level = 1;
        this.health = 2000;
        this.maxHealth = 2000;
        this.radius = 80;
        this.constructionProgress = 0;
        this.isConstructing = true;
        this.lastShot = 0;
        this.lastHeal = 0;
        this.healRate = 20; // HP per second
        this.healInterval = 1000; // Heal every 1 second
    }
    
    addModule(type, soldierCount) {
        // Check if we already have a module of this type
        let existingModule = this.modules.find(module => 
            module.soldierWeapon === this.getWeaponProperties(type === 'infantry' ? 'pistol' : 
                                     type === 'heavy' ? 'mg' : 'shotgun').name ||
            (type === 'infantry' && module.name === 'Infantry Bunker') ||
            (type === 'heavy' && module.name === 'Heavy Weapons Bunker') ||
            (type === 'assault' && module.name === 'Assault Bunker')
        );
        
        if (existingModule) {
            // Expand existing module
            this.expandModule(existingModule, soldierCount);
            return;
        }
        
        // Real weapon systems based on actual factory types
        const moduleTypes = {
            infantry: {
                name: 'Infantry Bunker',
                soldierWeapon: 'pistol',      // What soldiers carried
                turretWeapon: 'mg',          // What turrets they built
                color: '#4a4',
                specialAbility: 'overwatch'
            },
            heavy: {
                name: 'Heavy Weapons Bunker', 
                soldierWeapon: 'mg',         // Heavy soldiers used MGs
                turretWeapon: 'rocket',      // Heavy turrets fire rockets
                color: '#a44',
                specialAbility: 'barrage'
            },
            assault: {
                name: 'Assault Bunker',
                soldierWeapon: 'shotgun',    // Assault soldiers used shotguns
                turretWeapon: 'heal',        // Assault turrets heal/support
                color: '#44a',
                specialAbility: 'shield'
            }
        };
        
        // Get real weapon properties from weapon system
        const soldierWeaponProps = this.getWeaponProperties(moduleTypes[type].soldierWeapon);
        const turretWeaponProps = this.getTurretProperties(moduleTypes[type].turretWeapon);
        
        // Create multiple turret positions for this module type
        const turretCount = Math.max(1, Math.min(6, Math.floor(soldierCount / 5))); // 1-6 turrets per module
        const baseAngle = this.modules.length * (Math.PI * 2 / 3); // Base position
        
        const module = {
            ...moduleTypes[type],
            soldierCount: soldierCount,
            level: Math.floor(soldierCount / 5) + 1, // 5 soldiers = level 1
            health: 200 + soldierCount * 20,
            maxHealth: 200 + soldierCount * 20,
            angle: baseAngle,
            distance: 100, // Base distance
            lastShot: 0,
            lastSpecial: 0,
            shieldStrength: type === 'assault' ? 100 + soldierCount * 10 : 0,
            
            // Individual turret positions around the bunker
            turrets: [],
            
            // Combined weapon systems: soldiers + turrets
            soldierWeapon: {
                ...soldierWeaponProps,
                count: Math.min(soldierCount, 6), // Limit soldier weapons to max 6
                fireRate: Math.max(200, soldierWeaponProps.fireRate + soldierCount * 5), // Slower fire rate
                damage: Math.max(5, soldierWeaponProps.damage - 5) // Reduced damage
            },
            turretWeapon: {
                ...turretWeaponProps,
                count: Math.max(1, Math.min(4, Math.floor(soldierCount / 8))), // 1 turret per 8 soldiers, max 4
                damage: Math.max(10, turretWeaponProps.damage * 0.6), // 40% damage reduction
                fireRate: turretWeaponProps.fireRate * 1.5 // Slower fire rate
            },
            
            // Overall module stats (reduced range)
            range: Math.min(200, Math.max(soldierWeaponProps.range || 180, turretWeaponProps.range || 220)),
            gunCount: Math.max(1, Math.min(8, Math.floor(soldierCount / 4))) // Visual gun positions, max 8 for clarity
        };
        
        // Create individual turrets around the bunker (avoiding existing turrets)
        const newTurretPositions = this.findFreeTurretPositions(turretCount, module);
        
        newTurretPositions.forEach(position => {
            module.turrets.push({
                angle: position.angle,
                distance: position.distance,
                health: 100 + soldierCount * 10,
                maxHealth: 100 + soldierCount * 10,
                lastShot: 0,
                weapon: { ...turretWeaponProps }
            });
        });
        
        this.modules.push(module);
        this.updateBunkerStats();
    }
    
    expandModule(existingModule, additionalSoldiers) {
        console.log(`Expanding ${existingModule.name} with ${additionalSoldiers} additional soldiers`);
        
        // Add soldiers to existing count
        existingModule.soldierCount += additionalSoldiers * 5;
        existingModule.level = Math.floor(existingModule.soldierCount / 5) + 1;
        
        // Increase health based on new soldiers
        const additionalHealth = additionalSoldiers * 20;
        existingModule.health += additionalHealth;
        existingModule.maxHealth += additionalHealth;
        
        // Update weapon counts
        existingModule.soldierWeapon.count = Math.min(existingModule.soldierCount, 6);
        existingModule.soldierWeapon.fireRate = Math.max(200, existingModule.soldierWeapon.fireRate - additionalSoldiers * 2);
        
        // Add more turrets if we have enough soldiers
        const newTurretCount = Math.max(1, Math.min(6, Math.floor(existingModule.soldierCount / 5))) - existingModule.turrets.length;
        
        if (newTurretCount > 0) {
            console.log(`Need to add ${newTurretCount} new turrets to ${existingModule.name}`);
            
            // Find free positions for new turrets
            const newTurretPositions = this.findFreeTurretPositions(newTurretCount, existingModule);
            
            // Get turret weapon properties once
            const turretWeaponProps = this.getTurretProperties(existingModule.turretWeapon);
            
            newTurretPositions.forEach(position => {
                existingModule.turrets.push({
                    angle: position.angle,
                    distance: position.distance,
                    health: 100 + existingModule.soldierCount * 10,
                    maxHealth: 100 + existingModule.soldierCount * 10,
                    lastShot: 0,
                    weapon: { ...turretWeaponProps }
                });
                
                console.log(`Added new turret at angle ${position.angle.toFixed(2)} distance ${position.distance.toFixed(0)}`);
            });
            
            console.log(`${existingModule.name} now has ${existingModule.turrets.length} turrets total`);
        }
        
        // Update shield strength for assault modules
        if (existingModule.specialAbility === 'shield') {
            existingModule.shieldStrength += additionalSoldiers * 10;
        }
        
        // Update bunker stats
        this.updateBunkerStats();
        
        // Visual effect for expansion
        const modulePos = this.getModulePosition(this.modules.indexOf(existingModule));
        createParticles(modulePos.x, modulePos.y, '#ff0', 20);
        playSound('build', 0.3);
    }
    
    findFreeTurretPositions(count, targetModule) {
        const positions = [];
        const minDistance = 60; // Minimum distance between turrets
        const maxAttempts = 50; // Maximum attempts per turret to find free position
        
        // Get all existing turret positions from ALL modules (not just target module)
        const existingPositions = [];
        this.modules.forEach(module => {
            module.turrets.forEach(turret => {
                existingPositions.push({
                    x: this.x + Math.cos(turret.angle) * turret.distance,
                    y: this.y + Math.sin(turret.angle) * turret.distance
                });
            });
        });
        
        console.log(`Finding ${count} free positions. ${existingPositions.length} existing turrets to avoid.`);
        
        for (let i = 0; i < count; i++) {
            let foundPosition = false;
            let attempts = 0;
            
            while (!foundPosition && attempts < maxAttempts) {
                attempts++;
                
                // Generate random position around bunker
                const angle = Math.random() * Math.PI * 2;
                const distance = 90 + Math.random() * 50; // 90-140 distance
                
                const newX = this.x + Math.cos(angle) * distance;
                const newY = this.y + Math.sin(angle) * distance;
                
                // Check if this position conflicts with existing turrets
                let conflicts = false;
                for (const existing of existingPositions) {
                    const dist = getDistance(newX, newY, existing.x, existing.y);
                    if (dist < minDistance) {
                        conflicts = true;
                        break;
                    }
                }
                
                // Check if this position conflicts with other new positions we've already found
                if (!conflicts) {
                    for (const newPos of positions) {
                        const newPosX = this.x + Math.cos(newPos.angle) * newPos.distance;
                        const newPosY = this.y + Math.sin(newPos.angle) * newPos.distance;
                        const dist = getDistance(newX, newY, newPosX, newPosY);
                        if (dist < minDistance) {
                            conflicts = true;
                            break;
                        }
                    }
                }
                
                if (!conflicts) {
                    positions.push({ angle, distance });
                    existingPositions.push({ x: newX, y: newY }); // Add to existing list for next iteration
                    foundPosition = true;
                    console.log(`Found free position ${i + 1}/${count} after ${attempts} attempts`);
                }
            }
            
            if (!foundPosition) {
                console.warn(`Could not find free position for turret ${i + 1} after ${maxAttempts} attempts`);
                // Fallback: place it anyway with some offset
                const fallbackAngle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
                const fallbackDistance = 120 + Math.random() * 20;
                positions.push({ angle: fallbackAngle, distance: fallbackDistance });
            }
        }
        
        return positions;
    }
    
    getWeaponProperties(weaponType) {
        // Map weapon names to WEAPON_TYPES with custom ranges
        const weaponMap = {
            'pistol': { ...WEAPON_TYPES.PISTOL, range: 500 }, // Pistol: short range
            'mg': { ...WEAPON_TYPES.MG, range: 800 }, // MG: medium range
            'shotgun': { ...WEAPON_TYPES.SHOTGUN, range: 350 } // Shotgun: very short range
        };
        
        return weaponMap[weaponType] || weaponMap['pistol'];
    }
    
    getTurretProperties(turretType) {
        // Get canvas dimensions for screen-wide range
        const screenWidth = gameManager ? gameManager.canvas.width : 1200;
        const screenHeight = gameManager ? gameManager.canvas.height : 800;
        const screenRange = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
        
        // Turret properties with realistic ranges
        const turretMap = {
            'mg': {
                fireRate: 100,
                damage: 15,
                range: 850, // MG: good range
                bulletSpeed: 15,
                explosive: false,
                healing: false
            },
            'rocket': {
                fireRate: 1000,
                damage: 80,
                range: screenRange, // Rockets: screen-wide range
                bulletSpeed: 12,
                explosive: true,
                healing: false
            },
            'heal': {
                fireRate: 0,
                damage: 0,
                range: 380, // Heal: medium range
                bulletSpeed: 0,
                explosive: false,
                healing: true,
                healRate: 3
            }
        };
        
        return turretMap[turretType] || turretMap['mg'];
    }
    
    updateBunkerStats() {
        this.maxHealth = 1000 + this.modules.length * 300;
        this.health = Math.min(this.health, this.maxHealth);
        this.level = this.modules.length;
    }
    
    update(enemies) {
        if (this.isConstructing) {
            this.constructionProgress += 2;
            if (this.constructionProgress >= 100) {
                this.isConstructing = false;
                createParticles(this.x, this.y, '#ff0', 30);
                playSound('build', 0.5);
            }
            return [];
        }
        
        const bullets = [];
        const now = Date.now();
        
        // Automatic healing
        if (now - this.lastHeal > this.healInterval) {
            this.lastHeal = now;
            
            // Heal main bunker
            if (this.health < this.maxHealth) {
                this.health = Math.min(this.maxHealth, this.health + this.healRate);
                if (Math.random() < 0.3) {
                    createParticles(this.x, this.y, '#4f4', 3);
                }
            }
            
            // Heal damaged modules and their turrets
            this.modules.forEach(module => {
                if (module.health > 0 && module.health < module.maxHealth) {
                    module.health = Math.min(module.maxHealth, module.health + this.healRate);
                    if (Math.random() < 0.2) {
                        const modulePos = this.getModulePosition(this.modules.indexOf(module));
                        createParticles(modulePos.x, modulePos.y, '#4f4', 2);
                    }
                }
                
                // Heal turrets belonging to this module
                module.turrets.forEach(turret => {
                    if (turret.health > 0 && turret.health < turret.maxHealth) {
                        turret.health = Math.min(turret.maxHealth, turret.health + this.healRate);
                        if (Math.random() < 0.1) {
                            const turretPos = this.getTurretPosition(this.modules.indexOf(module), module.turrets.indexOf(turret));
                            createParticles(turretPos.x, turretPos.y, '#4f4', 1);
                        }
                    }
                });
            });
        }
        
        // Each module can fire
        this.modules.forEach((module, index) => {
            if (module.health <= 0) return;
            
            // Find target for this module
            let closestEnemy = null;
            let closestDistance = module.range;
            
            enemies.forEach(enemy => {
                const distance = getDistance(this.x, this.y, enemy.x, enemy.y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });
            
            // Fire soldier weapons (more frequent, lighter damage)
            if (closestEnemy && now - module.lastShot > module.soldierWeapon.fireRate) {
                module.lastShot = now;
                
                const moduleX = this.x + Math.cos(module.angle) * module.distance;
                const moduleY = this.y + Math.sin(module.angle) * module.distance;
                const angle = getAngle(moduleX, moduleY, closestEnemy.x, closestEnemy.y);
                
                // Fire soldier weapons from multiple positions
                this.fireSoldierWeapons(bullets, module, moduleX, moduleY, angle, closestEnemy);
                
                playSound('shoot', 0.15);
            }
            
            // Fire individual turrets
            module.turrets.forEach(turret => {
                if (turret.health <= 0) return;
                
                // Find target for this turret
                let turretTarget = null;
                let turretDistance = turret.weapon.range;
                
                const turretX = this.x + Math.cos(turret.angle) * turret.distance;
                const turretY = this.y + Math.sin(turret.angle) * turret.distance;
                
                enemies.forEach(enemy => {
                    const distance = getDistance(turretX, turretY, enemy.x, enemy.y);
                    if (distance < turretDistance) {
                        turretDistance = distance;
                        turretTarget = enemy;
                    }
                });
                
                if (turretTarget && now - turret.lastShot > turret.weapon.fireRate) {
                    turret.lastShot = now;
                    
                    if (turret.weapon.healing) {
                        // Healing turret
                        this.healNearbyUnits(turretX, turretY, turret.weapon.range, turret.weapon.healRate);
                    } else {
                        // Combat turret
                        const angle = getAngle(turretX, turretY, turretTarget.x, turretTarget.y);
                        bullets.push({
                            x: turretX,
                            y: turretY,
                            vx: Math.cos(angle) * turret.weapon.bulletSpeed,
                            vy: Math.sin(angle) * turret.weapon.bulletSpeed,
                            radius: turret.weapon.explosive ? 8 : 6,
                            damage: turret.weapon.damage,
                            isPlayer: false,
                            isAlly: true,
                            color: turret.weapon.explosive ? '#f84' : '#4f4',
                            explosive: turret.weapon.explosive || false
                        });
                        
                        playSound('shoot', 0.2);
                    }
                }
            });
            
            // Special abilities
            if (now - module.lastSpecial > 5000) {
                module.lastSpecial = now;
                
                switch(module.specialAbility) {
                    case 'overwatch':
                        // Mark enemies for extra damage
                        enemies.forEach(enemy => {
                            if (getDistance(this.x, this.y, enemy.x, enemy.y) < module.range) {
                                enemy.marked = true;
                                setTimeout(() => enemy.marked = false, 3000);
                                createParticles(enemy.x, enemy.y, '#ff0', 5);
                            }
                        });
                        break;
                        
                    case 'barrage':
                        // Area bombardment
                        if (closestEnemy) {
                            for (let i = 0; i < 5; i++) {
                                setTimeout(() => {
                                    const spread = 50;
                                    const targetX = closestEnemy.x + (Math.random() - 0.5) * spread;
                                    const targetY = closestEnemy.y + (Math.random() - 0.5) * spread;
                                    
                                    bullets.push({
                                        x: this.x,
                                        y: this.y - 200,
                                        vx: (targetX - this.x) * 0.02,
                                        vy: (targetY - this.y + 200) * 0.02,
                                        radius: 10,
                                        damage: 60,
                                        isPlayer: false,
                                        isAlly: true,
                                        color: '#f40',
                                        explosive: true,
                                        artillery: true
                                    });
                                }, i * 200);
                            }
                        }
                        break;
                        
                    case 'shield':
                        // Regenerate shield strength
                        module.shieldStrength = Math.min(100, module.shieldStrength + 20);
                        createParticles(this.x, this.y, '#4af', 10);
                        break;
                }
            }
        });
        
        return bullets;
    }
    
    fireSoldierWeapons(bullets, module, moduleX, moduleY, angle, target) {
        const weapon = module.soldierWeapon;
        
        // Fire from multiple soldier positions around the module (reduced)
        for (let soldier = 0; soldier < Math.min(weapon.count, 4); soldier++) { // Limit to max 4 soldiers firing
            const soldierAngle = module.angle + (soldier - (weapon.count - 1) / 2) * 0.2;
            const soldierX = moduleX + Math.cos(soldierAngle) * 15;
            const soldierY = moduleY + Math.sin(soldierAngle) * 15;
            
            // Different weapons fire differently
            if (weapon.pellets) {
                // Shotgun - multiple pellets
                for (let pellet = 0; pellet < weapon.pellets; pellet++) {
                    const spread = (Math.random() - 0.5) * weapon.spread;
                    bullets.push({
                        x: soldierX,
                        y: soldierY,
                        vx: Math.cos(angle + spread) * weapon.bulletSpeed,
                        vy: Math.sin(angle + spread) * weapon.bulletSpeed,
                        radius: 3,
                        damage: weapon.damage,
                        isPlayer: false,
                        isAlly: true,
                        color: weapon.color || '#4f4'
                    });
                }
            } else {
                // Regular weapon - single bullet
                const spread = (Math.random() - 0.5) * (weapon.spread || 0);
                bullets.push({
                    x: soldierX,
                    y: soldierY,
                    vx: Math.cos(angle + spread) * weapon.bulletSpeed,
                    vy: Math.sin(angle + spread) * weapon.bulletSpeed,
                    radius: 4,
                    damage: weapon.damage,
                    isPlayer: false,
                    isAlly: true,
                    color: weapon.color || '#4f4',
                    flame: weapon.flame || false
                });
            }
        }
    }
    
    fireTurretWeapons(bullets, module, moduleX, moduleY, angle, target) {
        const weapon = module.turretWeapon;
        
        if (weapon.healing) {
            // Healing turret - heal nearby allies and player
            this.healNearbyUnits(moduleX, moduleY, weapon.range, weapon.healRate);
            return;
        }
        
        // Fire from turret positions
        for (let turret = 0; turret < weapon.count; turret++) {
            const turretAngle = module.angle + (turret - (weapon.count - 1) / 2) * 0.5;
            const turretX = moduleX + Math.cos(turretAngle) * 20;
            const turretY = moduleY + Math.sin(turretAngle) * 20;
            
            bullets.push({
                x: turretX,
                y: turretY,
                vx: Math.cos(angle) * weapon.bulletSpeed,
                vy: Math.sin(angle) * weapon.bulletSpeed,
                radius: weapon.explosive ? 8 : 6,
                damage: weapon.damage,
                isPlayer: false,
                isAlly: true,
                color: weapon.explosive ? '#f84' : '#4f4',
                explosive: weapon.explosive || false
            });
        }
    }
    
    healNearbyUnits(x, y, range, healRate) {
        // Heal player
        if (gameManager && gameManager.player) {
            const playerDist = getDistance(x, y, gameManager.player.x, gameManager.player.y);
            if (playerDist < range && gameManager.player.health < gameManager.player.maxHealth) {
                gameManager.player.health = Math.min(gameManager.player.maxHealth, 
                                                   gameManager.player.health + healRate);
                if (Math.random() < 0.1) {
                    createParticles(gameManager.player.x, gameManager.player.y, '#4f4', 3);
                    playSound('heal', 0.1);
                }
            }
        }
        
        // Heal allies
        if (gameManager && gameManager.allies) {
            gameManager.allies.forEach(ally => {
                const allyDist = getDistance(x, y, ally.x, ally.y);
                if (allyDist < range && ally.health < ally.maxHealth) {
                    ally.health = Math.min(ally.maxHealth, ally.health + healRate);
                    if (Math.random() < 0.1) {
                        createParticles(ally.x, ally.y, '#4f4', 3);
                    }
                }
            });
        }
    }
    
    takeDamage(amount, moduleIndex = -1, turretIndex = -1) {
        if (moduleIndex >= 0 && moduleIndex < this.modules.length) {
            const module = this.modules[moduleIndex];
            
            if (turretIndex >= 0 && turretIndex < module.turrets.length) {
                // Damage to specific turret
                const turret = module.turrets[turretIndex];
                turret.health -= amount;
                
                const turretPos = this.getTurretPosition(moduleIndex, turretIndex);
                createParticles(turretPos.x, turretPos.y, '#f44', 15);
                
                if (turret.health <= 0) {
                    createParticles(turretPos.x, turretPos.y, '#f44', 25);
                    playSound('explosion', 0.3);
                    turret.health = 0; // Mark as destroyed
                }
            } else {
                // Damage to module
                if (module.shieldStrength > 0) {
                    const absorbed = Math.min(amount, module.shieldStrength);
                    module.shieldStrength -= absorbed;
                    amount -= absorbed;
                    createParticles(this.x, this.y, '#4af', 10);
                }
                
                module.health -= amount;
                
                if (module.health <= 0) {
                    // Module destroyed - destroy all its turrets
                    module.turrets.forEach(turret => turret.health = 0);
                    createParticles(this.x, this.y, '#f44', 25);
                    playSound('explosion', 0.4);
                    module.health = 0;
                    
                    // Check if bunker is destroyed
                    const activeModules = this.modules.filter(m => m.health > 0);
                    if (activeModules.length === 0) {
                        this.health = 0;
                    }
                }
            }
        } else {
            // Damage to main bunker
            this.health -= amount;
            createParticles(this.x, this.y, '#f44', 15);
        }
    }
    
    getTurretPosition(moduleIndex, turretIndex) {
        if (moduleIndex < 0 || moduleIndex >= this.modules.length) return { x: this.x, y: this.y };
        
        const module = this.modules[moduleIndex];
        if (turretIndex < 0 || turretIndex >= module.turrets.length) return { x: this.x, y: this.y };
        
        const turret = module.turrets[turretIndex];
        return {
            x: this.x + Math.cos(turret.angle) * turret.distance,
            y: this.y + Math.sin(turret.angle) * turret.distance
        };
    }
    
    getModulePosition(index) {
        if (index < 0 || index >= this.modules.length) return { x: this.x, y: this.y };
        
        const module = this.modules[index];
        return {
            x: this.x + Math.cos(module.angle) * module.distance,
            y: this.y + Math.sin(module.angle) * module.distance
        };
    }
}

class EnemySquad {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.members = [];
        this.formation = 'line'; // line, circle, wedge
        this.leader = null;
        this.cohesion = 50; // How close they stay together
        
        this.createSquad();
    }
    
    createSquad() {
        const squadSize = 3 + this.level;
        const formations = ['line', 'circle', 'wedge'];
        this.formation = formations[Math.floor(Math.random() * formations.length)];
        
        for (let i = 0; i < squadSize; i++) {
            let memberX, memberY;
            
            switch(this.formation) {
                case 'line':
                    memberX = this.x + (i - squadSize/2) * 30;
                    memberY = this.y;
                    break;
                case 'circle':
                    const angle = (i / squadSize) * Math.PI * 2;
                    memberX = this.x + Math.cos(angle) * 40;
                    memberY = this.y + Math.sin(angle) * 40;
                    break;
                case 'wedge':
                    memberX = this.x + (i - squadSize/2) * 25;
                    memberY = this.y + Math.abs(i - squadSize/2) * 20;
                    break;
            }
            
            const member = new EnhancedEnemy(memberX, memberY, this.level, i === 0);
            if (i === 0) this.leader = member;
            this.members.push(member);
        }
    }
    
    update(targets, walls) {
        const bullets = [];
        
        // Update all members
        this.members = this.members.filter(member => {
            if (member.health <= 0) return false;
            
            const memberBullets = member.update(targets, walls, this);
            bullets.push(...memberBullets);
            return true;
        });
        
        // If no members left, squad is destroyed
        if (this.members.length === 0) {
            return { bullets, destroyed: true };
        }
        
        // Update leader if current leader is dead
        if (!this.leader || this.leader.health <= 0) {
            this.leader = this.members[0];
            this.leader.isLeader = true;
        }
        
        return { bullets, destroyed: false };
    }
}

class EnhancedEnemy extends Enemy {
    constructor(x, y, level, isLeader = false) {
        super(x, y, level);
        
        this.isLeader = isLeader;
        this.hasShield = Math.random() < 0.3 + level * 0.1;
        this.weaponType = this.getRandomWeapon();
        this.squadRole = this.getRandomRole();
        
        // Enhanced stats based on level
        this.health *= (1 + level * 0.3);
        this.maxHealth = this.health;
        
        if (this.isLeader) {
            this.health *= 1.5;
            this.maxHealth = this.health;
            this.radius += 3;
            this.hasShield = true;
        }
        
        if (this.hasShield) {
            this.shieldStrength = 50 + level * 10;
            this.maxShield = this.shieldStrength;
        }
        
        // Visual enhancements
        this.armorLevel = Math.floor(level / 2);
    }
    
    getRandomWeapon() {
        const weapons = ['rifle', 'heavy', 'burst'];
        return weapons[Math.floor(Math.random() * weapons.length)];
    }
    
    getRandomRole() {
        const roles = ['assault', 'support', 'heavy'];
        return roles[Math.floor(Math.random() * roles.length)];
    }
    
    update(targets, walls, squad = null) {
        // Maintain formation with squad
        if (squad && squad.leader && squad.leader !== this) {
            const leaderDist = getDistance(this.x, this.y, squad.leader.x, squad.leader.y);
            if (leaderDist > squad.cohesion) {
                const angle = getAngle(this.x, this.y, squad.leader.x, squad.leader.y);
                this.x += Math.cos(angle) * this.speed * 0.3;
                this.y += Math.sin(angle) * this.speed * 0.3;
            }
        }
        
        // Enhanced AI targeting based on role
        const prioritizedTargets = this.prioritizeTargets(targets);
        
        // Use enhanced targeting instead of parent update
        const bullets = this.enhancedUpdate(prioritizedTargets, walls);
        
        // Enhanced weapon effects
        bullets.forEach(bullet => {
            switch(this.weaponType) {
                case 'heavy':
                    bullet.damage *= 1.5;
                    bullet.radius += 2;
                    bullet.color = '#f84';
                    break;
                case 'burst':
                    // Add two more bullets for burst fire
                    if (Math.random() < 0.3) {
                        const spread = 0.3;
                        bullets.push({
                            ...bullet,
                            vx: bullet.vx + (Math.random() - 0.5) * spread,
                            vy: bullet.vy + (Math.random() - 0.5) * spread
                        });
                    }
                    break;
            }
        });
        
        return bullets;
    }
    
    takeDamage(amount) {
        // Shield absorption
        if (this.hasShield && this.shieldStrength > 0) {
            const absorbed = Math.min(amount, this.shieldStrength);
            this.shieldStrength -= absorbed;
            amount -= absorbed;
            createParticles(this.x, this.y, '#4af', 5);
        }
        
        super.takeDamage(amount);
    }
    
    prioritizeTargets(targets) {
        const targetPriorities = [];
        
        targets.forEach(target => {
            let priority = 0;
            const distance = getDistance(this.x, this.y, target.x, target.y);
            
            // Base priority: closer = higher priority
            priority += Math.max(0, 400 - distance) / 100;
            
            // Role-based targeting priorities
            switch(this.squadRole) {
                case 'assault':
                    // Assault units prefer player and close targets
                    if (target.isPlayer) priority += 50;
                    if (distance < 150) priority += 20;
                    break;
                    
                case 'support':
                    // Support units prefer bunker modules and structures
                    if (target.modules) { // Bunker
                        priority += 40;
                        // Prefer damaged modules for finishing off
                        target.modules.forEach(module => {
                            if (module.health < module.maxHealth * 0.3) {
                                priority += 15;
                            }
                        });
                    }
                    break;
                    
                case 'heavy':
                    // Heavy units prefer high-value targets and structures
                    if (target.modules) priority += 35; // Bunker
                    if (target.maxHealth > 100) priority += 25; // High health targets
                    if (target.isPlayer && target.upgradeCount > 3) priority += 30; // Upgraded player
                    break;
            }
            
            // Leader bonus - leaders focus on the most dangerous targets
            if (this.isLeader) {
                if (target.isPlayer) priority += 25;
                if (target.modules) priority += 20; // Bunker priority for leaders
            }
            
            // Avoid targeting at extreme range for accuracy
            if (distance > 250) priority *= 0.5;
            
            targetPriorities.push({ target, priority, distance });
        });
        
        // Sort by priority (highest first)
        return targetPriorities.sort((a, b) => b.priority - a.priority);
    }
    
    enhancedUpdate(prioritizedTargets, walls) {
        if (prioritizedTargets.length === 0) return [];
        
        const primaryTarget = prioritizedTargets[0].target;
        const targetDistance = prioritizedTargets[0].distance;
        
        if (primaryTarget) {
            const targetAngle = getAngle(this.x, this.y, primaryTarget.x, primaryTarget.y);
            
            // Enhanced movement based on role
            let moveSpeed = this.speed;
            let moveAngle = targetAngle;
            
            switch(this.squadRole) {
                case 'assault':
                    // Aggressive, direct movement
                    moveSpeed *= 1.2;
                    break;
                    
                case 'support':
                    // Cautious movement, prefer flanking
                    moveSpeed *= 0.8;
                    if (targetDistance < 200) {
                        // Try to flank by adding perpendicular component
                        moveAngle += Math.PI / 3 * (Math.random() > 0.5 ? 1 : -1);
                    }
                    break;
                    
                case 'heavy':
                    // Slower but persistent movement
                    moveSpeed *= 0.7;
                    break;
            }
            
            // Movement pattern based on distance
            if (this.movementPattern === 'wander' && targetDistance > 100) {
                // Use wander pattern for distant targets
                this.wanderTimer++;
                if (this.wanderTimer > 60 + Math.random() * 60) {
                    this.wanderAngle = moveAngle + (Math.random() - 0.5) * Math.PI * 0.5;
                    this.wanderTimer = 0;
                }
                const blendedAngle = this.wanderAngle * 0.6 + moveAngle * 0.4;
                this.x += Math.cos(blendedAngle) * moveSpeed;
                this.y += Math.sin(blendedAngle) * moveSpeed;
            } else {
                // Direct movement for close targets
                this.x += Math.cos(moveAngle) * moveSpeed;
                this.y += Math.sin(moveAngle) * moveSpeed;
            }
            
            // Wall collision handling
            walls.forEach(wall => {
                if (checkWallCollision(this, wall)) {
                    resolveWallCollision(this, wall);
                    if (this.movementPattern === 'wander') {
                        this.wanderAngle += Math.PI / 2 + Math.random() * Math.PI / 2;
                    }
                }
            });
            
            // Enhanced shooting logic
            const maxRange = this.squadRole === 'heavy' ? 350 : 
                           this.squadRole === 'support' ? 280 : 220;
            
            if (Date.now() - this.lastShot > this.fireRate && targetDistance < maxRange) {
                this.lastShot = Date.now();
                
                // Different firing patterns by role
                if (this.squadRole === 'heavy' && Math.random() < 0.3) {
                    // Heavy units sometimes do burst fire
                    const bullets = [];
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            bullets.push(...this.shoot(primaryTarget.x, primaryTarget.y));
                        }, i * 100);
                    }
                    return bullets;
                } else {
                    return this.shoot(primaryTarget.x, primaryTarget.y);
                }
            }
        }
        
        return [];
    }
}