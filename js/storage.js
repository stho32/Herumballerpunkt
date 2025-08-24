// Storage Manager - Handles all save/load operations
class StorageManager {
    constructor() {
        this.storageKey = 'herumballerpunkt_saves';
        this.settingsKey = 'herumballerpunkt_settings';
        this.statisticsKey = 'herumballerpunkt_statistics';
        this.achievementsKey = 'herumballerpunkt_achievements';
        this.maxSaveSlots = 3;
        this.maxStorageSize = 5 * 1024 * 1024; // 5MB
        
        this.initializeStorage();
    }
    
    initializeStorage() {
        // Initialize storage if not exists
        if (!localStorage.getItem(this.storageKey)) {
            const emptySaves = {};
            for (let i = 1; i <= this.maxSaveSlots; i++) {
                emptySaves[`slot${i}`] = null;
            }
            localStorage.setItem(this.storageKey, JSON.stringify(emptySaves));
        }
        
        // Initialize settings
        if (!localStorage.getItem(this.settingsKey)) {
            const defaultSettings = {
                soundEnabled: true,
                soundVolume: 1.0,
                difficulty: 'normal',
                language: 'de',
                graphics: 'high'
            };
            localStorage.setItem(this.settingsKey, JSON.stringify(defaultSettings));
        }
        
        // Initialize statistics
        if (!localStorage.getItem(this.statisticsKey)) {
            const defaultStats = {
                totalKills: 0,
                totalPlayTime: 0,
                bestWave: 0,
                totalGamesPlayed: 0,
                factoriesCaptured: 0,
                bunkersBuilt: 0,
                upgradesCollected: 0
            };
            localStorage.setItem(this.statisticsKey, JSON.stringify(defaultStats));
        }
        
        // Initialize achievements
        if (!localStorage.getItem(this.achievementsKey)) {
            const defaultAchievements = {};
            localStorage.setItem(this.achievementsKey, JSON.stringify(defaultAchievements));
        }
    }
    
    saveGame(slot, gameData) {
        try {
            const saveData = this.serializeGameState(gameData);
            const saves = JSON.parse(localStorage.getItem(this.storageKey));
            
            // Add metadata
            saveData.metadata = {
                version: "1.0.0",
                timestamp: Date.now(),
                checksum: this.calculateChecksum(saveData.gameState)
            };
            
            saves[`slot${slot}`] = saveData;
            
            // Check storage size
            const serialized = JSON.stringify(saves);
            if (serialized.length > this.maxStorageSize) {
                throw new Error('Save data too large');
            }
            
            localStorage.setItem(this.storageKey, serialized);
            
            // Create backup
            localStorage.setItem(`${this.storageKey}_backup`, serialized);
            
            return { success: true, message: 'Spiel gespeichert!' };
        } catch (error) {
            console.error('Save failed:', error);
            return { success: false, message: 'Speichern fehlgeschlagen: ' + error.message };
        }
    }
    
    loadGame(slot) {
        try {
            const saves = JSON.parse(localStorage.getItem(this.storageKey));
            const saveData = saves[`slot${slot}`];
            
            if (!saveData) {
                return { success: false, message: 'Kein Spielstand gefunden' };
            }
            
            // Validate checksum
            const calculatedChecksum = this.calculateChecksum(saveData.gameState);
            if (saveData.metadata.checksum !== calculatedChecksum) {
                throw new Error('Save data corrupted');
            }
            
            const gameState = this.deserializeGameState(saveData.gameState);
            return { success: true, data: gameState, metadata: saveData.metadata };
        } catch (error) {
            console.error('Load failed:', error);
            
            // Try backup
            try {
                const backupSaves = JSON.parse(localStorage.getItem(`${this.storageKey}_backup`));
                const backupData = backupSaves[`slot${slot}`];
                if (backupData) {
                    const gameState = this.deserializeGameState(backupData.gameState);
                    return { success: true, data: gameState, metadata: backupData.metadata, fromBackup: true };
                }
            } catch (backupError) {
                console.error('Backup load failed:', backupError);
            }
            
            return { success: false, message: 'Laden fehlgeschlagen: ' + error.message };
        }
    }
    
    deleteGame(slot) {
        try {
            const saves = JSON.parse(localStorage.getItem(this.storageKey));
            saves[`slot${slot}`] = null;
            localStorage.setItem(this.storageKey, JSON.stringify(saves));
            return { success: true, message: 'Spielstand gelöscht' };
        } catch (error) {
            return { success: false, message: 'Löschen fehlgeschlagen: ' + error.message };
        }
    }
    
    getSaveSlots() {
        try {
            const saves = JSON.parse(localStorage.getItem(this.storageKey));
            const slots = [];
            
            for (let i = 1; i <= this.maxSaveSlots; i++) {
                const saveData = saves[`slot${i}`];
                slots.push({
                    slot: i,
                    exists: !!saveData,
                    metadata: saveData ? saveData.metadata : null,
                    preview: saveData ? this.generateSavePreview(saveData.gameState) : null
                });
            }
            
            return slots;
        } catch (error) {
            console.error('Failed to get save slots:', error);
            return [];
        }
    }
    
    exportSave(slot) {
        try {
            const saves = JSON.parse(localStorage.getItem(this.storageKey));
            const saveData = saves[`slot${slot}`];
            
            if (!saveData) {
                return { success: false, message: 'Kein Spielstand gefunden' };
            }
            
            const exportData = {
                game: 'Herumballerpunkt',
                version: saveData.metadata.version,
                exported: Date.now(),
                data: saveData
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `herumballerpunkt_save_slot${slot}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            return { success: true, message: 'Spielstand exportiert' };
        } catch (error) {
            return { success: false, message: 'Export fehlgeschlagen: ' + error.message };
        }
    }
    
    importSave(fileData, targetSlot) {
        try {
            const importData = JSON.parse(fileData);
            
            // Validate import data
            if (!importData.game || importData.game !== 'Herumballerpunkt') {
                throw new Error('Invalid save file format');
            }
            
            if (!importData.data || !importData.data.gameState) {
                throw new Error('Invalid save data structure');
            }
            
            // Validate checksum
            const calculatedChecksum = this.calculateChecksum(importData.data.gameState);
            if (importData.data.metadata.checksum !== calculatedChecksum) {
                throw new Error('Save data corrupted');
            }
            
            const saves = JSON.parse(localStorage.getItem(this.storageKey));
            saves[`slot${targetSlot}`] = importData.data;
            localStorage.setItem(this.storageKey, JSON.stringify(saves));
            
            return { success: true, message: 'Spielstand importiert' };
        } catch (error) {
            return { success: false, message: 'Import fehlgeschlagen: ' + error.message };
        }
    }
    
    serializeGameState(gameData) {
        return {
            gameState: {
                wave: gameData.wave,
                score: gameData.score,
                difficulty: gameData.difficulty,
                player: this.serializePlayer(gameData.player),
                entities: this.serializeEntities(gameData),
                bunker: gameData.bunker ? this.serializeBunker(gameData.bunker) : null,
                gameTime: Date.now() - (gameData.startTime || Date.now())
            }
        };
    }
    
    deserializeGameState(gameState) {
        return {
            wave: gameState.wave,
            score: gameState.score,
            difficulty: gameState.difficulty,
            player: this.deserializePlayer(gameState.player),
            entities: this.deserializeEntities(gameState.entities),
            bunker: gameState.bunker ? this.deserializeBunker(gameState.bunker) : null,
            gameTime: gameState.gameTime
        };
    }
    
    serializePlayer(player) {
        return {
            x: player.x,
            y: player.y,
            health: player.health,
            maxHealth: player.maxHealth,
            upgradeCount: player.upgradeCount,
            weaponSystem: this.serializeWeaponSystem(player.weaponSystem)
        };
    }
    
    deserializePlayer(playerData) {
        return {
            x: playerData.x,
            y: playerData.y,
            health: playerData.health,
            maxHealth: playerData.maxHealth,
            upgradeCount: playerData.upgradeCount,
            weaponSystem: playerData.weaponSystem
        };
    }
    
    serializeWeaponSystem(weaponSystem) {
        return {
            currentWeapon: weaponSystem.currentWeapon,
            weapons: weaponSystem.weapons.map(weapon => ({
                name: weapon.name,
                ammo: weapon.ammo,
                maxAmmo: weapon.maxAmmo
            })),
            upgrades: weaponSystem.upgrades || []
        };
    }
    
    serializeEntities(gameData) {
        return {
            allies: gameData.allies.map(ally => this.serializeEntity(ally)),
            enemies: gameData.enemies.filter(e => !(e instanceof Ally)).map(enemy => this.serializeEntity(enemy)),
            factories: gameData.factories.map(factory => this.serializeFactory(factory)),
            turrets: gameData.turrets.map(turret => this.serializeTurret(turret)),
            walls: gameData.walls.map(wall => this.serializeWall(wall))
        };
    }
    
    deserializeEntities(entitiesData) {
        return entitiesData;
    }
    
    serializeEntity(entity) {
        return {
            type: entity.constructor.name,
            x: entity.x,
            y: entity.y,
            health: entity.health,
            maxHealth: entity.maxHealth,
            isAlly: entity.isAlly
        };
    }
    
    serializeFactory(factory) {
        return {
            x: factory.x,
            y: factory.y,
            type: factory.type,
            isAlly: factory.isAlly,
            health: factory.health,
            maxHealth: factory.maxHealth,
            soldiers: factory.soldiers
        };
    }
    
    serializeTurret(turret) {
        return {
            x: turret.x,
            y: turret.y,
            type: turret.type,
            isAlly: turret.isAlly,
            health: turret.health,
            maxHealth: turret.maxHealth
        };
    }
    
    serializeWall(wall) {
        return {
            x: wall.x,
            y: wall.y,
            width: wall.width,
            height: wall.height,
            health: wall.health,
            maxHealth: wall.maxHealth
        };
    }
    
    serializeBunker(bunker) {
        return {
            x: bunker.x,
            y: bunker.y,
            level: bunker.level,
            health: bunker.health,
            maxHealth: bunker.maxHealth,
            modules: bunker.modules.map(module => ({
                type: module.type,
                level: module.level,
                health: module.health,
                maxHealth: module.maxHealth
            }))
        };
    }
    
    deserializeBunker(bunkerData) {
        return bunkerData;
    }
    
    calculateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    generateSavePreview(gameState) {
        return {
            wave: gameState.wave,
            score: gameState.score,
            difficulty: gameState.difficulty,
            hasPlayer: !!gameState.player,
            hasBunker: !!gameState.bunker
        };
    }
    
    getStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (key.startsWith('herumballerpunkt_')) {
                totalSize += localStorage[key].length;
            }
        }
        return {
            used: totalSize,
            max: this.maxStorageSize,
            percentage: (totalSize / this.maxStorageSize) * 100
        };
    }
    
    // Settings management
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem(this.settingsKey));
            return { success: true, data: settings };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    // Statistics management
    updateStatistics(stats) {
        try {
            const current = JSON.parse(localStorage.getItem(this.statisticsKey));
            const updated = { ...current, ...stats };
            localStorage.setItem(this.statisticsKey, JSON.stringify(updated));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    getStatistics() {
        try {
            const stats = JSON.parse(localStorage.getItem(this.statisticsKey));
            return { success: true, data: stats };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}
