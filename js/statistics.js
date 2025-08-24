// Statistics Tracker - Tracks player progress and game statistics
class StatisticsTracker {
    constructor() {
        this.statistics = this.initializeStatistics();
        this.sessionStats = this.initializeSessionStats();
        this.gameStartTime = null;
        this.waveStartTime = null;
        this.lastSaveTime = Date.now();
        this.saveInterval = 30000; // Save every 30 seconds
        
        this.loadStatistics();
        this.startTracking();
    }
    
    initializeStatistics() {
        return {
            // Combat Statistics
            totalKills: 0,
            playerKills: 0,
            allyKills: 0,
            sniperKills: 0,
            shotgunKills: 0,
            mgKills: 0,
            grenadeKills: 0,
            laserKills: 0,
            
            // Game Progress
            totalPlayTime: 0,
            bestWave: 0,
            totalGamesPlayed: 0,
            gamesWon: 0,
            totalScore: 0,
            bestScore: 0,
            
            // Strategy Statistics
            factoriesCaptured: 0,
            bunkersBuilt: 0,
            upgradesCollected: 0,
            alliesRecruited: 0,
            turretsBuilt: 0,
            wallsBuilt: 0,
            
            // Survival Statistics
            totalDamageTaken: 0,
            totalDamageDealt: 0,
            timesRevived: 0,
            lowHealthSurvivalTime: 0,
            fullHealthRecoveries: 0,
            wavesWithoutBunkerDamage: 0,
            
            // Achievement Statistics
            achievementPoints: 0,
            achievementsUnlocked: 0,
            
            // Weapon Statistics
            shotsFired: 0,
            shotsHit: 0,
            accuracy: 0,
            weaponsUsed: 0,
            
            // Difficulty Statistics
            easyGames: 0,
            normalGames: 0,
            hardGames: 0,
            
            // Session Statistics
            sessionsPlayed: 0,
            averageSessionTime: 0,
            longestSession: 0
        };
    }
    
    initializeSessionStats() {
        return {
            kills: 0,
            score: 0,
            waveKills: 0,
            waveDamageTaken: 0,
            weaponsUsedThisGame: new Set(),
            startTime: Date.now()
        };
    }
    
    loadStatistics() {
        try {
            const saved = localStorage.getItem('herumballerpunkt_statistics');
            if (saved) {
                const loadedStats = JSON.parse(saved);
                this.statistics = { ...this.statistics, ...loadedStats };
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }
    
    saveStatistics() {
        try {
            localStorage.setItem('herumballerpunkt_statistics', JSON.stringify(this.statistics));
            this.lastSaveTime = Date.now();
        } catch (error) {
            console.error('Failed to save statistics:', error);
        }
    }
    
    startTracking() {
        // Auto-save statistics periodically
        setInterval(() => {
            if (Date.now() - this.lastSaveTime >= this.saveInterval) {
                this.saveStatistics();
            }
        }, 5000);
        
        // Track session time
        setInterval(() => {
            if (this.gameStartTime) {
                this.updateStatistic('totalPlayTime', Date.now() - this.gameStartTime);
            }
        }, 1000);
    }
    
    trackEvent(event, data = {}) {
        switch (event) {
            case 'gameStart':
                this.onGameStart(data);
                break;
            case 'gameEnd':
                this.onGameEnd(data);
                break;
            case 'waveStart':
                this.onWaveStart(data);
                break;
            case 'waveEnd':
                this.onWaveEnd(data);
                break;
            case 'kill':
                this.onKill(data);
                break;
            case 'damage':
                this.onDamage(data);
                break;
            case 'upgrade':
                this.onUpgrade(data);
                break;
            case 'factoryCapture':
                this.onFactoryCapture(data);
                break;
            case 'bunkerBuild':
                this.onBunkerBuild(data);
                break;
            case 'weaponSwitch':
                this.onWeaponSwitch(data);
                break;
            case 'shot':
                this.onShot(data);
                break;
            case 'achievement':
                this.onAchievement(data);
                break;
            default:
                console.warn('Unknown event:', event);
        }
    }
    
    onGameStart(data) {
        this.gameStartTime = Date.now();
        this.sessionStats = this.initializeSessionStats();
        this.waveStartTime = Date.now();
        
        this.updateStatistic('totalGamesPlayed', this.statistics.totalGamesPlayed + 1);
        this.updateStatistic('sessionsPlayed', this.statistics.sessionsPlayed + 1);
        
        // Track difficulty
        if (data.difficulty) {
            const difficultyKey = data.difficulty + 'Games';
            this.updateStatistic(difficultyKey, (this.statistics[difficultyKey] || 0) + 1);
        }
    }
    
    onGameEnd(data) {
        if (!this.gameStartTime) return;
        
        const sessionTime = Date.now() - this.gameStartTime;
        this.updateStatistic('totalPlayTime', this.statistics.totalPlayTime + sessionTime);
        
        // Update session statistics
        this.updateStatistic('averageSessionTime', 
            (this.statistics.averageSessionTime * (this.statistics.sessionsPlayed - 1) + sessionTime) / this.statistics.sessionsPlayed);
        
        if (sessionTime > this.statistics.longestSession) {
            this.updateStatistic('longestSession', sessionTime);
        }
        
        // Update best scores
        if (data.score > this.statistics.bestScore) {
            this.updateStatistic('bestScore', data.score);
        }
        
        if (data.wave > this.statistics.bestWave) {
            this.updateStatistic('bestWave', data.wave);
        }
        
        this.updateStatistic('totalScore', this.statistics.totalScore + data.score);
        
        // Track if game was won (survived certain number of waves)
        if (data.wave >= 50) {
            this.updateStatistic('gamesWon', this.statistics.gamesWon + 1);
        }
        
        this.gameStartTime = null;
        this.saveStatistics();
    }
    
    onWaveStart(data) {
        this.waveStartTime = Date.now();
        this.sessionStats.waveKills = 0;
        this.sessionStats.waveDamageTaken = 0;
    }
    
    onWaveEnd(data) {
        // Track wave completion statistics
        if (this.sessionStats.waveDamageTaken === 0 && data.wave > 1) {
            // Perfect wave (no damage taken)
            this.trackEvent('perfectWave', data);
        }
    }
    
    onKill(data) {
        this.updateStatistic('totalKills', this.statistics.totalKills + 1);
        this.sessionStats.kills++;
        this.sessionStats.waveKills++;
        
        // Track kills by source
        if (data.source === 'player') {
            this.updateStatistic('playerKills', this.statistics.playerKills + 1);
        } else if (data.source === 'ally') {
            this.updateStatistic('allyKills', this.statistics.allyKills + 1);
        }
        
        // Track kills by weapon
        if (data.weapon) {
            const weaponKey = data.weapon.toLowerCase() + 'Kills';
            this.updateStatistic(weaponKey, (this.statistics[weaponKey] || 0) + 1);
        }
        
        // Update accuracy
        this.updateAccuracy();
    }
    
    onDamage(data) {
        if (data.target === 'player') {
            this.updateStatistic('totalDamageTaken', this.statistics.totalDamageTaken + data.amount);
            this.sessionStats.waveDamageTaken += data.amount;
        } else {
            this.updateStatistic('totalDamageDealt', this.statistics.totalDamageDealt + data.amount);
        }
    }
    
    onUpgrade(data) {
        this.updateStatistic('upgradesCollected', this.statistics.upgradesCollected + 1);
    }
    
    onFactoryCapture(data) {
        this.updateStatistic('factoriesCaptured', this.statistics.factoriesCaptured + 1);
    }
    
    onBunkerBuild(data) {
        this.updateStatistic('bunkersBuilt', this.statistics.bunkersBuilt + 1);
    }
    
    onWeaponSwitch(data) {
        if (data.weapon && !this.sessionStats.weaponsUsedThisGame.has(data.weapon)) {
            this.sessionStats.weaponsUsedThisGame.add(data.weapon);
            this.updateStatistic('weaponsUsed', this.sessionStats.weaponsUsedThisGame.size);
        }
    }
    
    onShot(data) {
        this.updateStatistic('shotsFired', this.statistics.shotsFired + 1);
        
        if (data.hit) {
            this.updateStatistic('shotsHit', this.statistics.shotsHit + 1);
        }
        
        this.updateAccuracy();
    }
    
    onAchievement(data) {
        this.updateStatistic('achievementsUnlocked', this.statistics.achievementsUnlocked + 1);
        if (data.points) {
            this.updateStatistic('achievementPoints', this.statistics.achievementPoints + data.points);
        }
    }
    
    updateAccuracy() {
        if (this.statistics.shotsFired > 0) {
            this.statistics.accuracy = (this.statistics.shotsHit / this.statistics.shotsFired) * 100;
        }
    }
    
    updateStatistic(key, value) {
        if (typeof value === 'number' && !isNaN(value)) {
            this.statistics[key] = value;
        }
    }
    
    getStatistic(key) {
        return this.statistics[key] || 0;
    }
    
    getAllStatistics() {
        return { ...this.statistics };
    }
    
    getSessionStatistics() {
        return {
            ...this.sessionStats,
            weaponsUsedThisGame: Array.from(this.sessionStats.weaponsUsedThisGame),
            sessionTime: this.gameStartTime ? Date.now() - this.gameStartTime : 0
        };
    }
    
    getFormattedStatistics() {
        const stats = this.getAllStatistics();
        
        return {
            combat: {
                'Gesamte Kills': stats.totalKills.toLocaleString(),
                'Spieler Kills': stats.playerKills.toLocaleString(),
                'Verbündete Kills': stats.allyKills.toLocaleString(),
                'Genauigkeit': stats.accuracy.toFixed(1) + '%',
                'Schüsse abgefeuert': stats.shotsFired.toLocaleString(),
                'Schüsse getroffen': stats.shotsHit.toLocaleString()
            },
            progress: {
                'Beste Welle': stats.bestWave,
                'Beste Punktzahl': stats.bestScore.toLocaleString(),
                'Gesamte Punktzahl': stats.totalScore.toLocaleString(),
                'Spiele gespielt': stats.totalGamesPlayed,
                'Spiele gewonnen': stats.gamesWon,
                'Gewinnrate': stats.totalGamesPlayed > 0 ? ((stats.gamesWon / stats.totalGamesPlayed) * 100).toFixed(1) + '%' : '0%'
            },
            strategy: {
                'Fabriken erobert': stats.factoriesCaptured,
                'Bunker gebaut': stats.bunkersBuilt,
                'Upgrades gesammelt': stats.upgradesCollected,
                'Verbündete rekrutiert': stats.alliesRecruited,
                'Geschütze gebaut': stats.turretsBuilt
            },
            time: {
                'Gesamte Spielzeit': this.formatTime(stats.totalPlayTime),
                'Durchschnittliche Session': this.formatTime(stats.averageSessionTime),
                'Längste Session': this.formatTime(stats.longestSession),
                'Sessions gespielt': stats.sessionsPlayed
            },
            achievements: {
                'Achievements freigeschaltet': stats.achievementsUnlocked,
                'Achievement Punkte': stats.achievementPoints,
                'Fortschritt': window.achievementManager ? 
                    `${window.achievementManager.getUnlockedCount()}/${window.achievementManager.getTotalCount()}` : 'N/A'
            }
        };
    }
    
    formatTime(milliseconds) {
        if (!milliseconds || milliseconds < 0) return '0s';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    resetStatistics() {
        this.statistics = this.initializeStatistics();
        this.saveStatistics();
    }
    
    exportStatistics() {
        const exportData = {
            statistics: this.getAllStatistics(),
            formatted: this.getFormattedStatistics(),
            exported: new Date().toISOString(),
            game: 'Herumballerpunkt'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `herumballerpunkt_statistics_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    // Get current game state for achievement checking
    getCurrentGameState() {
        return {
            wave: window.gameManager ? window.gameManager.wave : 0,
            score: window.gameManager ? window.gameManager.score : 0,
            player: window.gameManager ? window.gameManager.player : null,
            bunker: window.gameManager ? window.gameManager.bunker : null,
            allyCount: window.gameManager ? window.gameManager.allies.length : 0,
            waveKills: this.sessionStats.waveKills,
            waveDamageTaken: this.sessionStats.waveDamageTaken,
            weaponsUsed: this.sessionStats.weaponsUsedThisGame.size,
            gameTime: this.gameStartTime ? Date.now() - this.gameStartTime : 0
        };
    }
}

// Global statistics tracker instance
window.statisticsTracker = new StatisticsTracker();
