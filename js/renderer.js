// Rendering System

class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }
    
    clear() {
        this.ctx.fillStyle = '#4a5d3a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawPlayer(player) {
        this.ctx.save();
        this.ctx.translate(player.x, player.y);
        this.ctx.rotate(player.angle);
        
        // Body
        this.ctx.fillStyle = '#44f';
        this.ctx.strokeStyle = '#226';
        this.ctx.lineWidth = 2 + player.upgradeCount;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Weapon
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(10, -3, 20, 6);
        
        // Simple weapon upgrade visual - show if has MG
        if (player.weaponSystem.hasMG) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillRect(-15, -2, 4, 4); // Small yellow square to indicate MG upgrade
        }
        
        this.ctx.restore();
        
        // Reload indicator
        if (player.isReloading) {
            const progress = (Date.now() - player.reloadStartTime) / player.reloadDuration;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(player.x - 30, player.y + 20, 60, 10);
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillRect(player.x - 30, player.y + 20, 60 * progress, 10);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('AUTO-RELOAD', player.x, player.y + 28);
        }
        
        // Laser upgrade
        const laser = player.weaponSystem.updateLaser(player.x, player.y);
        if (laser) {
            this.ctx.save();
            this.ctx.translate(laser.x, laser.y);
            this.ctx.rotate(laser.angle);
            
            const gradient = this.ctx.createLinearGradient(0, 0, laser.length, 0);
            const color1 = laser.level === 3 ? 'rgba(255, 255, 255, 0.9)' : 
                          laser.level === 2 ? 'rgba(255, 0, 255, 0.8)' : 
                          'rgba(255, 0, 128, 0.7)';
            const color2 = laser.level === 3 ? 'rgba(255, 255, 255, 0.1)' : 
                          laser.level === 2 ? 'rgba(255, 0, 255, 0)' : 
                          'rgba(255, 0, 128, 0)';
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 3 + laser.level;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(laser.length, 0);
            this.ctx.stroke();
            
            // Add glow effect for higher levels
            if (laser.level >= 2) {
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 8 + laser.level * 2;
                this.ctx.globalAlpha = 0.3;
                this.ctx.stroke();
                this.ctx.globalAlpha = 1.0;
            }
            
            this.ctx.restore();
            
            // Laser damage is handled in game logic
        }
    }
    
    drawSuperboss(boss) {
        const pulseScale = 1 + Math.sin(boss.pulseTimer) * 0.1;
        
        // Shield effect
        if (boss.shieldActive && boss.shieldHealth > 0) {
            this.ctx.fillStyle = 'rgba(0, 136, 255, 0.2)';
            this.ctx.strokeStyle = 'rgba(0, 136, 255, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(boss.x, boss.y, boss.radius * 1.5 * pulseScale, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
        
        // Boss body
        this.ctx.save();
        this.ctx.translate(boss.x, boss.y);
        
        // Outer ring (phase indicator)
        this.ctx.strokeStyle = boss.phase === 3 ? '#f0f' : boss.phase === 2 ? '#ff0' : '#f00';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, boss.radius * pulseScale, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Inner body
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, boss.radius);
        gradient.addColorStop(0, boss.phase === 3 ? '#f0f' : '#f00');
        gradient.addColorStop(0.5, '#800');
        gradient.addColorStop(1, '#400');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, boss.radius * 0.9 * pulseScale, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye/core
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, boss.radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = boss.phase === 3 ? '#f0f' : '#f00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, boss.radius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Phase indicators
        for (let i = 0; i < boss.phase; i++) {
            const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * boss.radius * 0.7;
            const y = Math.sin(angle) * boss.radius * 0.7;
            
            this.ctx.fillStyle = '#ff0';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        // Health bar
        const barWidth = 100;
        const barHeight = 8;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(boss.x - barWidth/2, boss.y - boss.radius - 20, barWidth, barHeight);
        
        const healthPercent = boss.health / boss.maxHealth;
        const healthColor = healthPercent > 0.66 ? '#0f0' : healthPercent > 0.33 ? '#ff0' : '#f00';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(boss.x - barWidth/2, boss.y - boss.radius - 20, barWidth * healthPercent, barHeight);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(boss.x - barWidth/2, boss.y - boss.radius - 20, barWidth, barHeight);
        
        // Name
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SUPERBOSS', boss.x, boss.y - boss.radius - 25);
    }
    
    drawEnemy(enemy) {
        this.ctx.fillStyle = '#d44';
        this.ctx.strokeStyle = '#922';
        this.ctx.lineWidth = 2 + enemy.upgradeCount;
        
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Health bar
        if (enemy.health < enemy.maxHealth) {
            this.drawHealthBar(enemy.x, enemy.y - 20, 30, 4, enemy.health / enemy.maxHealth);
        }
        
        // Upgrade indicators
        if (enemy.upgradeCount > 0) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('+' + enemy.upgradeCount, enemy.x, enemy.y);
        }
    }
    
    drawAlly(ally) {
        this.ctx.fillStyle = ally.color;
        this.ctx.strokeStyle = ally.isAlly ? '#226' : '#622';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(ally.x, ally.y, ally.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Health bar
        if (ally.health < ally.maxHealth) {
            this.drawHealthBar(ally.x, ally.y - 15, 20, 3, ally.health / ally.maxHealth);
        }
    }
    
    drawTank(tank) {
        this.ctx.save();
        this.ctx.translate(tank.x, tank.y);
        
        // Tracks
        this.ctx.rotate(tank.angle);
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(-25, -15, 50, 5);
        this.ctx.fillRect(-25, 10, 50, 5);
        
        // Body
        this.ctx.fillStyle = tank.color;
        this.ctx.fillRect(-20, -10, 40, 20);
        
        // Turret
        this.ctx.rotate(tank.turretAngle - tank.angle);
        this.ctx.fillStyle = tank.isAlly ? '#363' : '#633';
        this.ctx.fillRect(0, -4, 30, 8);
        
        this.ctx.restore();
        
        // Type indicator
        this.ctx.fillStyle = tank.isAlly ? '#4f4' : '#f44';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(tank.fireRate ? 'T' : 'H', tank.x, tank.y + 3);
        
        // Health bar
        if (tank.health < tank.maxHealth) {
            this.drawHealthBar(tank.x, tank.y - 30, 40, 5, tank.health / tank.maxHealth);
        }
    }
    
    drawTurret(turret) {
        // Base
        this.ctx.fillStyle = turret.isAlly ? '#4a4' : '#666';
        this.ctx.strokeStyle = turret.isAlly ? '#2a2' : '#333';
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.arc(turret.x, turret.y, turret.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Cannon
        this.ctx.save();
        this.ctx.translate(turret.x, turret.y);
        this.ctx.rotate(turret.angle);
        this.ctx.fillStyle = turret.isAlly ? '#363' : '#444';
        this.ctx.fillRect(0, -5, 30, 10);
        this.ctx.restore();
        
        // Type indicator
        let typeSymbol = 'MG';
        if (turret.type === 'rocket') typeSymbol = 'R';
        if (turret.type === 'heal') typeSymbol = 'H';
        
        this.ctx.fillStyle = turret.isAlly ? '#4f4' : '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(typeSymbol, turret.x, turret.y);
        
        // Health bar
        if (turret.health < turret.maxHealth) {
            this.drawHealthBar(turret.x, turret.y - 35, 50, 5, turret.health / turret.maxHealth, turret.isAlly);
        }
    }
    
    drawFactory(factory) {
        // Draw patrol radius with fill for overlapping visibility
        const radius = 180;
        
        // Filled circle for better overlap visualization
        this.ctx.fillStyle = factory.isAlly ? 'rgba(68, 255, 68, 0.08)' : 'rgba(255, 68, 68, 0.08)';
        this.ctx.beginPath();
        this.ctx.arc(factory.x, factory.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Dashed outline
        this.ctx.strokeStyle = factory.isAlly ? 'rgba(68, 255, 68, 0.3)' : 'rgba(255, 68, 68, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(factory.x, factory.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Building
        this.ctx.fillStyle = factory.isAlly ? '#484' : '#844';
        this.ctx.fillRect(factory.x - factory.width/2, factory.y - factory.height/2, factory.width, factory.height);
        this.ctx.strokeStyle = factory.isAlly ? '#262' : '#422';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(factory.x - factory.width/2, factory.y - factory.height/2, factory.width, factory.height);
        
        // Type label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(factory.type.toUpperCase(), factory.x, factory.y - 10);
        
        // Soldier count
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`${factory.soldiers}/${factory.maxSoldiers}`, factory.x, factory.y + 10);
        
        // Capture progress
        if (factory.captureProgress > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(factory.x - 40, factory.y + 30, 80, 10);
            this.ctx.fillStyle = factory.capturingEntity === 'player' ? '#4f4' : '#f44';
            this.ctx.fillRect(factory.x - 40, factory.y + 30, 80 * (factory.captureProgress / factory.captureRequired), 10);
        }
        
        // Build progress
        if (factory.buildProgress > 0) {
            this.ctx.strokeStyle = '#ff0';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(factory.x, factory.y - 30, 15, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * factory.buildProgress / 100));
            this.ctx.stroke();
        }
        
        // Health bar
        if (factory.health < factory.maxHealth) {
            this.drawHealthBar(factory.x, factory.y - factory.height/2 - 10, 80, 6, factory.health / factory.maxHealth, factory.isAlly);
        }
    }
    
    drawWall(wall) {
        // Wall body
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        
        // Health bar for damaged walls
        if (wall.health < wall.maxHealth) {
            this.drawHealthBar(wall.x + wall.width/2, wall.y - 10, wall.width, 4, wall.health / wall.maxHealth, false, '#888');
        }
        
        // Fade effect for temporary walls
        if (wall.temporary) {
            const age = Date.now() - wall.created;
            const fadeStart = wall.lifetime * 0.7;
            if (age > fadeStart) {
                const opacity = 1 - ((age - fadeStart) / (wall.lifetime - fadeStart));
                this.ctx.globalAlpha = opacity;
                this.ctx.fillStyle = '#666';
                this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
                this.ctx.globalAlpha = 1;
            }
        }
    }
    
    drawBullet(bullet) {
        this.ctx.fillStyle = bullet.color || (bullet.isPlayer ? '#ff0' : '#f00');
        
        if (bullet.flame) {
            this.ctx.globalAlpha = Math.max(0.3, bullet.lifetime / 30);
        }
        
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (bullet.flame) {
            this.ctx.globalAlpha = 1;
        }
    }
    
    drawPickup(pickup) {
        let color = '#ff4';
        let symbol = 'A';
        
        if (pickup.type === 'health') {
            color = '#4f4';
            symbol = 'H';
        } else if (pickup.type === 'weapon') {
            color = '#f4f';
            symbol = 'W';
        } else if (pickup.type === 'upgrade') {
            color = '#4ff';
            symbol = '★';
        } else if (pickup.type === 'allyBoost') {
            color = '#fff';
            symbol = '⚡';
        }
        
        // Special glow for player-only pickups
        if (pickup.forPlayer) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = pickup.glowColor || color;
        }
        
        pickup.rotation = (pickup.rotation || 0) + 0.05;
        
        this.ctx.save();
        this.ctx.translate(pickup.x, pickup.y);
        this.ctx.rotate(pickup.rotation);
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Symbol
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, pickup.x, pickup.y);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    drawParticle(particle) {
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = particle.lifetime / 30;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }
    
    drawBunker(bunker) {
        if (!bunker) return;
        
        // Main bunker structure
        this.ctx.fillStyle = bunker.isConstructing ? '#666' : '#484';
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 4;
        
        this.ctx.beginPath();
        this.ctx.arc(bunker.x, bunker.y, bunker.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Construction progress
        if (bunker.isConstructing) {
            // Animated progress ring
            const progress = bunker.constructionProgress / 100;
            const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
            
            this.ctx.strokeStyle = `rgba(255, 255, 0, ${pulseIntensity})`;
            this.ctx.lineWidth = 8;
            this.ctx.beginPath();
            this.ctx.arc(bunker.x, bunker.y, bunker.radius + 15, -Math.PI/2, 
                        -Math.PI/2 + (Math.PI * 2 * progress));
            this.ctx.stroke();
            
            // Construction sparks
            if (Math.random() < 0.3) {
                const sparkAngle = Math.random() * Math.PI * 2;
                const sparkX = bunker.x + Math.cos(sparkAngle) * bunker.radius;
                const sparkY = bunker.y + Math.sin(sparkAngle) * bunker.radius;
                this.ctx.fillStyle = '#ff0';
                this.ctx.beginPath();
                this.ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Progress text with glow
            this.ctx.shadowColor = '#ff0';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${Math.floor(bunker.constructionProgress)}%`, bunker.x, bunker.y);
            this.ctx.fillText('CONSTRUCTING...', bunker.x, bunker.y + 20);
            this.ctx.shadowBlur = 0;
        } else {
            // Draw modules
            bunker.modules.forEach((module, index) => {
                const modulePos = bunker.getModulePosition(index);
                
                if (module.health <= 0) {
                    // Draw destroyed module debris
                    this.ctx.fillStyle = '#333';
                    this.ctx.strokeStyle = '#666';
                    this.ctx.lineWidth = 1;
                    
                    // Small debris pieces
                    for (let i = 0; i < 3; i++) {
                        const debrisX = modulePos.x + (Math.random() - 0.5) * 30;
                        const debrisY = modulePos.y + (Math.random() - 0.5) * 30;
                        this.ctx.beginPath();
                        this.ctx.arc(debrisX, debrisY, 3 + Math.random() * 3, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    
                    // Smoke effect
                    this.ctx.fillStyle = 'rgba(50, 50, 50, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(modulePos.x, modulePos.y, 20 + Math.sin(Date.now() * 0.01) * 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    return;
                }
                
                // Module base - flashing effect when damaged
                const damageRatio = module.health / module.maxHealth;
                let baseColor = module.color;
                if (damageRatio < 0.3) {
                    // Critical health - red flashing
                    baseColor = Math.sin(Date.now() * 0.02) > 0 ? '#f44' : '#844';
                } else if (damageRatio < 0.6) {
                    // Damaged - orange
                    baseColor = '#f84';
                }
                this.ctx.fillStyle = baseColor;
                this.ctx.beginPath();
                this.ctx.arc(modulePos.x, modulePos.y, 25, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#222';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Shield effect
                if (module.shieldStrength > 0) {
                    const shieldPulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005);
                    this.ctx.strokeStyle = `rgba(68, 170, 255, ${shieldPulse})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.beginPath();
                    this.ctx.arc(modulePos.x, modulePos.y, 30 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                    
                    // Shield shimmer effect
                    if (Math.random() < 0.1) {
                        this.ctx.fillStyle = `rgba(68, 170, 255, 0.3)`;
                        this.ctx.beginPath();
                        this.ctx.arc(modulePos.x + (Math.random() - 0.5) * 50, 
                                   modulePos.y + (Math.random() - 0.5) * 50, 5, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
                
                // Module type indicator
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(module.name.split(' ')[0], modulePos.x, modulePos.y - 5);
                this.ctx.fillText(`L${module.level}`, modulePos.x, modulePos.y + 8);
                
                // Health bar
                if (module.health < module.maxHealth) {
                    this.drawHealthBar(modulePos.x, modulePos.y - 35, 40, 4, module.health / module.maxHealth, true);
                }
                
                // Shield bar
                if (module.shieldStrength > 0) {
                    this.ctx.fillStyle = '#4af';
                    this.ctx.fillRect(modulePos.x - 20, modulePos.y - 40, 40 * (module.shieldStrength / 100), 2);
                }
            });
            
            // Central bunker label
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BUNKER', bunker.x, bunker.y - 5);
            this.ctx.fillText(`L${bunker.level}`, bunker.x, bunker.y + 10);
        }
        
        // Main health bar
        if (bunker.health < bunker.maxHealth) {
            this.drawHealthBar(bunker.x, bunker.y - bunker.radius - 20, bunker.radius * 2, 8, 
                             bunker.health / bunker.maxHealth, true);
        }
    }
    
    drawEnemySquad(squad) {
        // Draw formation indicator
        if (squad.members.length > 1) {
            const centerX = squad.members.reduce((sum, m) => sum + m.x, 0) / squad.members.length;
            const centerY = squad.members.reduce((sum, m) => sum + m.y, 0) / squad.members.length;
            
            this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([3, 3]);
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, squad.cohesion, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Draw squad members
        squad.members.forEach(member => {
            this.drawEnhancedEnemy(member);
        });
    }
    
    drawEnhancedEnemy(enemy) {
        // Enhanced enemy with armor/shields
        this.ctx.fillStyle = enemy.isLeader ? '#c22' : '#d44';
        this.ctx.strokeStyle = enemy.armorLevel > 0 ? '#666' : '#922';
        this.ctx.lineWidth = 2 + enemy.armorLevel;
        
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Shield effect
        if (enemy.hasShield && enemy.shieldStrength > 0) {
            this.ctx.strokeStyle = '#4af';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Leader crown
        if (enemy.isLeader) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('★', enemy.x, enemy.y - enemy.radius - 5);
        }
        
        // Weapon indicator
        if (enemy.weaponType !== 'rifle') {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '8px Arial';
            this.ctx.textAlign = 'center';
            const symbol = enemy.weaponType === 'heavy' ? 'H' : 'B';
            this.ctx.fillText(symbol, enemy.x, enemy.y + 3);
        }
        
        // Health bar
        if (enemy.health < enemy.maxHealth) {
            this.drawHealthBar(enemy.x, enemy.y - 20, 30, 4, enemy.health / enemy.maxHealth);
        }
        
        // Shield bar
        if (enemy.hasShield && enemy.maxShield > 0) {
            this.ctx.fillStyle = '#4af';
            this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * (enemy.shieldStrength / enemy.maxShield), 2);
        }
    }
    
    drawHealthBar(x, y, width, height, percentage, isAlly = false, color = null) {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - width/2, y, width, height);
        this.ctx.fillStyle = color || (isAlly ? '#4f4' : '#f44');
        this.ctx.fillRect(x - width/2, y, width * percentage, height);
    }
    
    drawPickup(pickup) {
        pickup.rotation = (pickup.rotation || 0) + 0.05;
        
        this.ctx.save();
        this.ctx.translate(pickup.x, pickup.y);
        this.ctx.rotate(pickup.rotation);
        
        if (pickup.type === 'ammo') {
            this.ctx.fillStyle = '#ffa';
            this.ctx.fillRect(-8, -4, 16, 8);
            this.ctx.fillStyle = '#ff7';
            this.ctx.fillRect(-6, -3, 12, 6);
        } else if (pickup.type === 'health') {
            this.ctx.fillStyle = '#f44';
            this.ctx.fillRect(-10, -3, 20, 6);
            this.ctx.fillRect(-3, -10, 6, 20);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(-6, -1, 12, 2);
            this.ctx.fillRect(-1, -6, 2, 12);
        } else if (pickup.type === 'weapon') {
            const weapon = ['P', 'M', 'S', 'F', 'R'][pickup.weaponIndex];
            this.ctx.fillStyle = '#4ff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(weapon, 0, 0);
        } else if (pickup.type === 'upgrade') {
            // Draw upgrade icon with glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#ff0';
            this.ctx.strokeStyle = '#ff0';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -10);
            this.ctx.lineTo(-8, 5);
            this.ctx.lineTo(8, 5);
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.fillStyle = '#ff0';
            this.ctx.fill();
            
            // Show upgrade type symbol
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 10px Arial';
            const symbols = {
                'mg': 'MG'
            };
            if (pickup.upgrade && symbols[pickup.upgrade.type]) {
                this.ctx.fillText(symbols[pickup.upgrade.type], 0, 0);
            }
        } else if (pickup.type === 'allyBoost') {
            // Draw ally boost icon
            this.ctx.fillStyle = '#4f4';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('A+', 0, 0);
        }
        
        this.ctx.restore();
    }
    
    drawUI(score, wave, ammo, maxAmmo, weaponName, health, maxHealth, bunker = null) {
        // Update UI elements
        document.getElementById('score').textContent = score;
        document.getElementById('wave').textContent = wave;
        document.getElementById('ammo').textContent = `${ammo}/${maxAmmo} (${weaponName})`;
        document.getElementById('healthText').textContent = `${Math.floor(health)}/${Math.floor(maxHealth)}`;
        
        // Update bunker health display
        const bunkerHealthDiv = document.getElementById('bunkerHealth');
        if (bunker) {
            bunkerHealthDiv.style.display = 'block';
            document.getElementById('bunkerHealthText').textContent = `${Math.floor(bunker.health)}/${Math.floor(bunker.maxHealth)}`;
            const bunkerHealthFill = document.getElementById('bunkerHealthFill');
            bunkerHealthFill.style.width = (bunker.health / bunker.maxHealth * 100) + '%';
        } else {
            bunkerHealthDiv.style.display = 'none';
        }
    }
}