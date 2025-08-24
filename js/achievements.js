// Achievement System
class AchievementManager {
    constructor() {
        this.achievements = this.initializeAchievements();
        this.unlockedAchievements = new Set();
        this.loadUnlockedAchievements();
        this.notificationQueue = [];
        this.showingNotification = false;
    }
    
    initializeAchievements() {
        return {
            // Kampf-Achievements
            'first_steps': {
                id: 'first_steps',
                name: 'Erste Schritte',
                description: 'Erreiche Welle 5',
                icon: '🎯',
                category: 'combat',
                condition: (stats, gameState) => gameState.wave >= 5,
                points: 10
            },
            'survivor': {
                id: 'survivor',
                name: 'Überlebenskünstler',
                description: 'Erreiche Welle 20',
                icon: '🛡️',
                category: 'combat',
                condition: (stats, gameState) => gameState.wave >= 20,
                points: 25
            },
            'unstoppable': {
                id: 'unstoppable',
                name: 'Unaufhaltsam',
                description: 'Erreiche Welle 50',
                icon: '⚡',
                category: 'combat',
                condition: (stats, gameState) => gameState.wave >= 50,
                points: 100
            },
            'sniper': {
                id: 'sniper',
                name: 'Scharfschütze',
                description: '1000 Kills mit Sniper-Rifle',
                icon: '🎯',
                category: 'combat',
                condition: (stats) => stats.sniperKills >= 1000,
                points: 50
            },
            'demolition': {
                id: 'demolition',
                name: 'Sprengmeister',
                description: '500 Kills mit Granaten',
                icon: '💥',
                category: 'combat',
                condition: (stats) => stats.grenadeKills >= 500,
                points: 40
            },
            'rampage': {
                id: 'rampage',
                name: 'Blutrausch',
                description: '100 Kills in einer Welle',
                icon: '🔥',
                category: 'combat',
                condition: (stats, gameState) => gameState.waveKills >= 100,
                points: 30
            },
            
            // Strategie-Achievements
            'factory_owner': {
                id: 'factory_owner',
                name: 'Fabrikant',
                description: 'Erobere 10 Fabriken',
                icon: '🏭',
                category: 'strategy',
                condition: (stats) => stats.factoriesCaptured >= 10,
                points: 25
            },
            'builder': {
                id: 'builder',
                name: 'Baumeister',
                description: 'Baue deinen ersten Bunker',
                icon: '🏰',
                category: 'strategy',
                condition: (stats) => stats.bunkersBuilt >= 1,
                points: 15
            },
            'commander': {
                id: 'commander',
                name: 'Kommandeur',
                description: 'Habe 50 Verbündete gleichzeitig',
                icon: '👑',
                category: 'strategy',
                condition: (stats, gameState) => gameState.allyCount >= 50,
                points: 35
            },
            'defender': {
                id: 'defender',
                name: 'Verteidiger',
                description: 'Überlebe 10 Wellen ohne Bunker-Schaden',
                icon: '🛡️',
                category: 'strategy',
                condition: (stats) => stats.wavesWithoutBunkerDamage >= 10,
                points: 40
            },
            'fortress': {
                id: 'fortress',
                name: 'Festung',
                description: 'Baue einen Level 5 Bunker',
                icon: '🏯',
                category: 'strategy',
                condition: (stats, gameState) => gameState.bunker && gameState.bunker.level >= 5,
                points: 60
            },
            
            // Spezial-Achievements
            'perfectionist': {
                id: 'perfectionist',
                name: 'Perfektionist',
                description: 'Beende eine Welle ohne Schaden',
                icon: '✨',
                category: 'special',
                condition: (stats, gameState) => gameState.waveDamageTaken === 0 && gameState.wave > 1,
                points: 50
            },
            'speedrunner': {
                id: 'speedrunner',
                name: 'Speedrunner',
                description: 'Erreiche Welle 10 in unter 5 Minuten',
                icon: '⚡',
                category: 'special',
                condition: (stats, gameState) => gameState.wave >= 10 && gameState.gameTime < 300000,
                points: 45
            },
            'collector': {
                id: 'collector',
                name: 'Sammler',
                description: 'Sammle 100 Upgrades',
                icon: '📦',
                category: 'special',
                condition: (stats) => stats.upgradesCollected >= 100,
                points: 30
            },
            'veteran': {
                id: 'veteran',
                name: 'Veteran',
                description: 'Spiele 10 Stunden insgesamt',
                icon: '🎖️',
                category: 'special',
                condition: (stats) => stats.totalPlayTime >= 36000000, // 10 hours in ms
                points: 75
            },
            'pacifist': {
                id: 'pacifist',
                name: 'Pazifist',
                description: 'Erreiche Welle 5 nur mit Verbündeten',
                icon: '☮️',
                category: 'special',
                condition: (stats, gameState) => gameState.wave >= 5 && stats.playerKills === 0,
                points: 80
            },
            'arsenal': {
                id: 'arsenal',
                name: 'Arsenal',
                description: 'Verwende alle 5 Waffen in einem Spiel',
                icon: '🔫',
                category: 'special',
                condition: (stats, gameState) => gameState.weaponsUsed >= 5,
                points: 20
            },
            
            // Survival-Achievements
            'last_stand': {
                id: 'last_stand',
                name: 'Letztes Gefecht',
                description: 'Überlebe mit weniger als 10 HP für 2 Minuten',
                icon: '💀',
                category: 'survival',
                condition: (stats) => stats.lowHealthSurvivalTime >= 120000,
                points: 35
            },
            'comeback': {
                id: 'comeback',
                name: 'Comeback',
                description: 'Heile von 1 HP auf volle Gesundheit',
                icon: '❤️',
                category: 'survival',
                condition: (stats) => stats.fullHealthRecoveries >= 1,
                points: 25
            },
            'tank': {
                id: 'tank',
                name: 'Panzer',
                description: 'Erreiche 500 maximale Lebenspunkte',
                icon: '🛡️',
                category: 'survival',
                condition: (stats, gameState) => gameState.player && gameState.player.maxHealth >= 500,
                points: 40
            }
        };
    }
    
    loadUnlockedAchievements() {
        try {
            const saved = localStorage.getItem('herumballerpunkt_achievements');
            if (saved) {
                const unlocked = JSON.parse(saved);
                this.unlockedAchievements = new Set(unlocked);
            }
        } catch (error) {
            console.error('Failed to load achievements:', error);
        }
    }
    
    saveUnlockedAchievements() {
        try {
            const unlocked = Array.from(this.unlockedAchievements);
            localStorage.setItem('herumballerpunkt_achievements', JSON.stringify(unlocked));
        } catch (error) {
            console.error('Failed to save achievements:', error);
        }
    }
    
    checkAchievements(gameState, statistics) {
        const newlyUnlocked = [];
        
        for (const [id, achievement] of Object.entries(this.achievements)) {
            if (!this.unlockedAchievements.has(id)) {
                if (achievement.condition(statistics, gameState)) {
                    this.unlockAchievement(id);
                    newlyUnlocked.push(achievement);
                }
            }
        }
        
        return newlyUnlocked;
    }
    
    unlockAchievement(id) {
        if (this.unlockedAchievements.has(id)) {
            return false;
        }
        
        this.unlockedAchievements.add(id);
        this.saveUnlockedAchievements();
        
        const achievement = this.achievements[id];
        if (achievement) {
            this.queueNotification(achievement);
            
            // Update statistics with achievement points
            if (window.statisticsTracker) {
                window.statisticsTracker.updateStatistic('achievementPoints', 
                    this.getTotalPoints());
            }
            
            return true;
        }
        
        return false;
    }
    
    queueNotification(achievement) {
        this.notificationQueue.push(achievement);
        if (!this.showingNotification) {
            this.showNextNotification();
        }
    }
    
    showNextNotification() {
        if (this.notificationQueue.length === 0) {
            this.showingNotification = false;
            return;
        }
        
        this.showingNotification = true;
        const achievement = this.notificationQueue.shift();
        
        this.displayNotification(achievement, () => {
            setTimeout(() => {
                this.showNextNotification();
            }, 500);
        });
    }
    
    displayNotification(achievement, callback) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">Achievement freigeschaltet!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-points">+${achievement.points} Punkte</div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Play sound
        if (window.playSound) {
            window.playSound('achievement', 0.7);
        }
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                callback();
            }, 500);
        }, 4000);
    }
    
    getProgress(id) {
        const achievement = this.achievements[id];
        if (!achievement) return null;
        
        return {
            id: id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            points: achievement.points,
            unlocked: this.unlockedAchievements.has(id)
        };
    }
    
    getAllAchievements() {
        return Object.keys(this.achievements).map(id => this.getProgress(id));
    }
    
    getUnlockedCount() {
        return this.unlockedAchievements.size;
    }
    
    getTotalCount() {
        return Object.keys(this.achievements).length;
    }
    
    getTotalPoints() {
        let total = 0;
        for (const id of this.unlockedAchievements) {
            const achievement = this.achievements[id];
            if (achievement) {
                total += achievement.points;
            }
        }
        return total;
    }
    
    getMaxPoints() {
        return Object.values(this.achievements).reduce((sum, achievement) => sum + achievement.points, 0);
    }
    
    getAchievementsByCategory(category) {
        return Object.values(this.achievements)
            .filter(achievement => achievement.category === category)
            .map(achievement => this.getProgress(achievement.id));
    }
    
    getCategories() {
        const categories = new Set();
        Object.values(this.achievements).forEach(achievement => {
            categories.add(achievement.category);
        });
        return Array.from(categories);
    }
    
    resetAchievements() {
        this.unlockedAchievements.clear();
        this.saveUnlockedAchievements();
    }
    
    // Helper method to check specific achievement conditions during gameplay
    checkSpecificConditions(gameState, statistics) {
        const checks = [];
        
        // Check for low health survival
        if (gameState.player && gameState.player.health < 10) {
            if (!gameState.lowHealthStartTime) {
                gameState.lowHealthStartTime = Date.now();
            }
        } else {
            if (gameState.lowHealthStartTime) {
                const survivalTime = Date.now() - gameState.lowHealthStartTime;
                if (survivalTime >= 120000) { // 2 minutes
                    statistics.lowHealthSurvivalTime = Math.max(
                        statistics.lowHealthSurvivalTime || 0, 
                        survivalTime
                    );
                }
                gameState.lowHealthStartTime = null;
            }
        }
        
        // Check for full health recovery
        if (gameState.player && gameState.previousHealth === 1 && gameState.player.health === gameState.player.maxHealth) {
            statistics.fullHealthRecoveries = (statistics.fullHealthRecoveries || 0) + 1;
        }
        
        // Track previous health for recovery detection
        if (gameState.player) {
            gameState.previousHealth = gameState.player.health;
        }
        
        return checks;
    }
}

// Global achievement manager instance
window.achievementManager = new AchievementManager();
