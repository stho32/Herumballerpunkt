// Pause System - Handles game pausing and resume functionality
class PauseManager {
    constructor() {
        this.isPaused = false;
        this.pauseStartTime = null;
        this.totalPausedTime = 0;
        this.resumeCountdown = 0;
        this.resumeCountdownInterval = null;
        this.autoSaveOnPause = true;
        this.pauseOnTabSwitch = true;
        
        this.setupEventListeners();
        this.createPauseUI();
    }
    
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
                if (window.gameManager && window.gameManager.gameActive) {
                    this.togglePause();
                }
            }
        });
        
        // Tab visibility change
        if (this.pauseOnTabSwitch) {
            document.addEventListener('visibilitychange', () => {
                if (window.gameManager && window.gameManager.gameActive) {
                    if (document.hidden && !this.isPaused) {
                        this.pause('Tab switched');
                    }
                }
            });
            
            window.addEventListener('blur', () => {
                if (window.gameManager && window.gameManager.gameActive && !this.isPaused) {
                    this.pause('Window lost focus');
                }
            });
        }
    }
    
    createPauseUI() {
        // Create pause menu
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pauseMenu';
        pauseMenu.className = 'pause-menu';
        pauseMenu.style.display = 'none';
        pauseMenu.innerHTML = `
            <div class="pause-content">
                <h2>Spiel pausiert</h2>
                <div class="pause-reason" id="pauseReason"></div>
                
                <div class="pause-buttons">
                    <button id="resumeBtn" class="pause-btn primary">Fortsetzen</button>
                    <button id="saveBtn" class="pause-btn">Speichern</button>
                    <button id="loadBtn" class="pause-btn">Laden</button>
                    <button id="settingsBtn" class="pause-btn">Einstellungen</button>
                    <button id="statisticsBtn" class="pause-btn">Statistiken</button>
                    <button id="achievementsBtn" class="pause-btn">Achievements</button>
                    <button id="mainMenuBtn" class="pause-btn danger">Hauptmenü</button>
                </div>
                
                <div class="pause-info">
                    <div>Aktuelle Welle: <span id="pauseWave">1</span></div>
                    <div>Punktzahl: <span id="pauseScore">0</span></div>
                    <div>Spielzeit: <span id="pauseGameTime">0:00</span></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(pauseMenu);
        
        // Create resume countdown overlay
        const countdownOverlay = document.createElement('div');
        countdownOverlay.id = 'resumeCountdown';
        countdownOverlay.className = 'resume-countdown';
        countdownOverlay.style.display = 'none';
        countdownOverlay.innerHTML = `
            <div class="countdown-content">
                <div class="countdown-text">Spiel wird fortgesetzt in</div>
                <div class="countdown-number" id="countdownNumber">3</div>
            </div>
        `;
        
        document.body.appendChild(countdownOverlay);
        
        this.setupPauseMenuEvents();
    }
    
    setupPauseMenuEvents() {
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resume();
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.showSaveMenu();
        });
        
        document.getElementById('loadBtn').addEventListener('click', () => {
            this.showLoadMenu();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsMenu();
        });
        
        document.getElementById('statisticsBtn').addEventListener('click', () => {
            this.showStatisticsMenu();
        });
        
        document.getElementById('achievementsBtn').addEventListener('click', () => {
            this.showAchievementsMenu();
        });
        
        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.returnToMainMenu();
        });
    }
    
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause('Manual pause');
        }
    }
    
    pause(reason = 'Game paused') {
        if (this.isPaused || !window.gameManager || !window.gameManager.gameActive) {
            return;
        }
        
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        
        // Stop game loop
        if (window.gameManager.animationId) {
            cancelAnimationFrame(window.gameManager.animationId);
        }
        
        // Auto-save if enabled
        if (this.autoSaveOnPause && window.storageManager) {
            this.autoSave();
        }
        
        // Show pause menu
        this.showPauseMenu(reason);
        
        // Update pause info
        this.updatePauseInfo();
        
        // Play pause sound
        if (window.playSound) {
            window.playSound('pause', 0.5);
        }
    }
    
    resume() {
        if (!this.isPaused) {
            return;
        }
        
        // Hide pause menu
        document.getElementById('pauseMenu').style.display = 'none';
        
        // Start countdown
        this.startResumeCountdown(() => {
            this.isPaused = false;
            
            // Calculate paused time
            if (this.pauseStartTime) {
                this.totalPausedTime += Date.now() - this.pauseStartTime;
                this.pauseStartTime = null;
            }
            
            // Resume game loop
            if (window.gameManager) {
                window.gameManager.gameLoop();
            }
            
            // Play resume sound
            if (window.playSound) {
                window.playSound('resume', 0.5);
            }
        });
    }
    
    startResumeCountdown(callback) {
        this.resumeCountdown = 3;
        const countdownOverlay = document.getElementById('resumeCountdown');
        const countdownNumber = document.getElementById('countdownNumber');
        
        countdownOverlay.style.display = 'flex';
        countdownNumber.textContent = this.resumeCountdown;
        
        this.resumeCountdownInterval = setInterval(() => {
            this.resumeCountdown--;
            
            if (this.resumeCountdown > 0) {
                countdownNumber.textContent = this.resumeCountdown;
                if (window.playSound) {
                    window.playSound('countdown', 0.3);
                }
            } else {
                clearInterval(this.resumeCountdownInterval);
                countdownOverlay.style.display = 'none';
                
                if (window.playSound) {
                    window.playSound('resume', 0.5);
                }
                
                callback();
            }
        }, 1000);
    }
    
    showPauseMenu(reason) {
        const pauseMenu = document.getElementById('pauseMenu');
        const pauseReason = document.getElementById('pauseReason');
        
        pauseReason.textContent = reason;
        pauseMenu.style.display = 'flex';
    }
    
    updatePauseInfo() {
        if (!window.gameManager) return;
        
        document.getElementById('pauseWave').textContent = window.gameManager.wave || 1;
        document.getElementById('pauseScore').textContent = (window.gameManager.score || 0).toLocaleString();
        
        // Calculate game time
        const gameTime = window.statisticsTracker ? 
            window.statisticsTracker.gameStartTime ? 
                Date.now() - window.statisticsTracker.gameStartTime - this.totalPausedTime : 0 : 0;
        
        document.getElementById('pauseGameTime').textContent = this.formatTime(gameTime);
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    }
    
    autoSave() {
        if (!window.storageManager || !window.gameManager) return;
        
        try {
            const gameData = {
                wave: window.gameManager.wave,
                score: window.gameManager.score,
                difficulty: window.gameManager.difficulty,
                player: window.gameManager.player,
                allies: window.gameManager.allies,
                enemies: window.gameManager.enemies,
                factories: window.gameManager.factories,
                turrets: window.gameManager.turrets,
                walls: window.gameManager.walls,
                bunker: window.gameManager.bunker,
                startTime: window.statisticsTracker ? window.statisticsTracker.gameStartTime : Date.now()
            };
            
            const result = window.storageManager.saveGame('auto', gameData);
            
            if (result.success) {
                this.showMessage('Auto-Save erfolgreich', 'success');
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    
    showSaveMenu() {
        // Create save menu modal
        this.showModal('save-menu', 'Spiel speichern', this.createSaveMenuContent());
    }
    
    showLoadMenu() {
        this.showModal('load-menu', 'Spiel laden', this.createLoadMenuContent());
    }
    
    showSettingsMenu() {
        this.showModal('settings-menu', 'Einstellungen', this.createSettingsMenuContent());
    }
    
    showStatisticsMenu() {
        this.showModal('statistics-menu', 'Statistiken', this.createStatisticsMenuContent());
    }
    
    showAchievementsMenu() {
        this.showModal('achievements-menu', 'Achievements', this.createAchievementsMenuContent());
    }
    
    createSaveMenuContent() {
        if (!window.storageManager) {
            return '<p>Storage Manager nicht verfügbar</p>';
        }
        
        const slots = window.storageManager.getSaveSlots();
        let content = '<div class="save-slots">';
        
        slots.forEach(slot => {
            const isEmpty = !slot.exists;
            const preview = slot.preview;
            
            content += `
                <div class="save-slot ${isEmpty ? 'empty' : 'occupied'}" data-slot="${slot.slot}">
                    <div class="slot-header">
                        <span class="slot-number">Slot ${slot.slot}</span>
                        ${!isEmpty ? '<button class="delete-save" data-slot="' + slot.slot + '">×</button>' : ''}
                    </div>
                    ${isEmpty ? 
                        '<div class="slot-content empty-slot">Leer</div>' :
                        `<div class="slot-content">
                            <div>Welle: ${preview.wave}</div>
                            <div>Punkte: ${preview.score.toLocaleString()}</div>
                            <div>Schwierigkeit: ${preview.difficulty}</div>
                            <div class="save-date">${new Date(slot.metadata.timestamp).toLocaleString()}</div>
                        </div>`
                    }
                    <button class="save-to-slot" data-slot="${slot.slot}">
                        ${isEmpty ? 'Speichern' : 'Überschreiben'}
                    </button>
                </div>
            `;
        });
        
        content += '</div>';
        return content;
    }
    
    createLoadMenuContent() {
        if (!window.storageManager) {
            return '<p>Storage Manager nicht verfügbar</p>';
        }
        
        const slots = window.storageManager.getSaveSlots();
        let content = '<div class="save-slots">';
        
        slots.forEach(slot => {
            if (slot.exists) {
                const preview = slot.preview;
                content += `
                    <div class="save-slot occupied" data-slot="${slot.slot}">
                        <div class="slot-header">
                            <span class="slot-number">Slot ${slot.slot}</span>
                        </div>
                        <div class="slot-content">
                            <div>Welle: ${preview.wave}</div>
                            <div>Punkte: ${preview.score.toLocaleString()}</div>
                            <div>Schwierigkeit: ${preview.difficulty}</div>
                            <div class="save-date">${new Date(slot.metadata.timestamp).toLocaleString()}</div>
                        </div>
                        <button class="load-from-slot" data-slot="${slot.slot}">Laden</button>
                    </div>
                `;
            }
        });
        
        if (content === '<div class="save-slots">') {
            content += '<p>Keine Spielstände gefunden</p>';
        }
        
        content += '</div>';
        return content;
    }
    
    createSettingsMenuContent() {
        const settings = window.storageManager ? window.storageManager.loadSettings().data : {};
        
        return `
            <div class="settings-content">
                <div class="setting-group">
                    <label>Sound</label>
                    <input type="checkbox" id="soundEnabled" ${settings.soundEnabled !== false ? 'checked' : ''}>
                </div>
                <div class="setting-group">
                    <label>Sound Lautstärke</label>
                    <input type="range" id="soundVolume" min="0" max="1" step="0.1" value="${settings.soundVolume || 1}">
                </div>
                <div class="setting-group">
                    <label>Auto-Pause bei Tab-Wechsel</label>
                    <input type="checkbox" id="pauseOnTabSwitch" ${this.pauseOnTabSwitch ? 'checked' : ''}>
                </div>
                <div class="setting-group">
                    <label>Auto-Save beim Pausieren</label>
                    <input type="checkbox" id="autoSaveOnPause" ${this.autoSaveOnPause ? 'checked' : ''}>
                </div>
                <button id="saveSettings" class="pause-btn primary">Einstellungen speichern</button>
            </div>
        `;
    }
    
    createStatisticsMenuContent() {
        if (!window.statisticsTracker) {
            return '<p>Statistics Tracker nicht verfügbar</p>';
        }
        
        const stats = window.statisticsTracker.getFormattedStatistics();
        let content = '<div class="statistics-content">';
        
        Object.entries(stats).forEach(([category, categoryStats]) => {
            content += `<div class="stat-category">
                <h3>${this.getCategoryName(category)}</h3>
                <div class="stat-list">`;
            
            Object.entries(categoryStats).forEach(([key, value]) => {
                content += `<div class="stat-item">
                    <span class="stat-name">${key}:</span>
                    <span class="stat-value">${value}</span>
                </div>`;
            });
            
            content += '</div></div>';
        });
        
        content += '</div>';
        return content;
    }
    
    createAchievementsMenuContent() {
        if (!window.achievementManager) {
            return '<p>Achievement Manager nicht verfügbar</p>';
        }
        
        const achievements = window.achievementManager.getAllAchievements();
        const categories = window.achievementManager.getCategories();
        
        let content = '<div class="achievements-content">';
        
        categories.forEach(category => {
            const categoryAchievements = achievements.filter(a => a.category === category);
            content += `<div class="achievement-category">
                <h3>${this.getCategoryName(category)}</h3>
                <div class="achievement-list">`;
            
            categoryAchievements.forEach(achievement => {
                content += `<div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        <div class="achievement-points">${achievement.points} Punkte</div>
                    </div>
                    ${achievement.unlocked ? '<div class="achievement-status">✓</div>' : ''}
                </div>`;
            });
            
            content += '</div></div>';
        });
        
        content += '</div>';
        return content;
    }
    
    getCategoryName(category) {
        const names = {
            combat: 'Kampf',
            progress: 'Fortschritt',
            strategy: 'Strategie',
            time: 'Zeit',
            achievements: 'Achievements',
            special: 'Spezial',
            survival: 'Überleben'
        };
        return names[category] || category;
    }
    
    showModal(id, title, content) {
        // Remove existing modal
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'pause-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup close event
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Setup modal-specific events
        this.setupModalEvents(modal, id);
    }
    
    setupModalEvents(modal, modalId) {
        // Save menu events
        if (modalId === 'save-menu') {
            modal.querySelectorAll('.save-to-slot').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const slot = e.target.dataset.slot;
                    this.saveToSlot(slot);
                    modal.remove();
                });
            });
            
            modal.querySelectorAll('.delete-save').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const slot = e.target.dataset.slot;
                    this.deleteSave(slot);
                    // Refresh modal content
                    modal.querySelector('.modal-body').innerHTML = this.createSaveMenuContent();
                    this.setupModalEvents(modal, modalId);
                });
            });
        }
        
        // Load menu events
        if (modalId === 'load-menu') {
            modal.querySelectorAll('.load-from-slot').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const slot = e.target.dataset.slot;
                    this.loadFromSlot(slot);
                    modal.remove();
                });
            });
        }
        
        // Settings menu events
        if (modalId === 'settings-menu') {
            const saveBtn = modal.querySelector('#saveSettings');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.saveSettings(modal);
                    modal.remove();
                });
            }
        }
    }
    
    saveToSlot(slot) {
        if (!window.storageManager || !window.gameManager) return;
        
        const gameData = {
            wave: window.gameManager.wave,
            score: window.gameManager.score,
            difficulty: window.gameManager.difficulty,
            player: window.gameManager.player,
            allies: window.gameManager.allies,
            enemies: window.gameManager.enemies,
            factories: window.gameManager.factories,
            turrets: window.gameManager.turrets,
            walls: window.gameManager.walls,
            bunker: window.gameManager.bunker,
            startTime: window.statisticsTracker ? window.statisticsTracker.gameStartTime : Date.now()
        };
        
        const result = window.storageManager.saveGame(slot, gameData);
        this.showMessage(result.message, result.success ? 'success' : 'error');
    }
    
    loadFromSlot(slot) {
        if (!window.storageManager) return;
        
        const result = window.storageManager.loadGame(slot);
        if (result.success) {
            // Load the game state
            this.loadGameState(result.data);
            this.showMessage('Spiel geladen!', 'success');
            this.resume();
        } else {
            this.showMessage(result.message, 'error');
        }
    }
    
    deleteSave(slot) {
        if (!window.storageManager) return;
        
        const result = window.storageManager.deleteGame(slot);
        this.showMessage(result.message, result.success ? 'success' : 'error');
    }
    
    saveSettings(modal) {
        const settings = {
            soundEnabled: modal.querySelector('#soundEnabled').checked,
            soundVolume: parseFloat(modal.querySelector('#soundVolume').value),
            pauseOnTabSwitch: modal.querySelector('#pauseOnTabSwitch').checked,
            autoSaveOnPause: modal.querySelector('#autoSaveOnPause').checked
        };
        
        this.pauseOnTabSwitch = settings.pauseOnTabSwitch;
        this.autoSaveOnPause = settings.autoSaveOnPause;
        
        if (window.storageManager) {
            window.storageManager.saveSettings(settings);
        }
        
        this.showMessage('Einstellungen gespeichert!', 'success');
    }
    
    loadGameState(gameState) {
        // This would need to be implemented to actually restore the game state
        // For now, just log the loaded state
        console.log('Loading game state:', gameState);
    }
    
    returnToMainMenu() {
        if (confirm('Möchten Sie wirklich zum Hauptmenü zurückkehren? Ungespeicherter Fortschritt geht verloren.')) {
            this.isPaused = false;
            
            if (window.gameManager) {
                window.gameManager.endGame();
            }
            
            // Show start screen
            const startScreen = document.getElementById('startScreen');
            if (startScreen) {
                startScreen.style.display = 'block';
            }
            
            // Hide pause menu
            document.getElementById('pauseMenu').style.display = 'none';
        }
    }
    
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `pause-message ${type}`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
    
    getTotalPausedTime() {
        let total = this.totalPausedTime;
        if (this.isPaused && this.pauseStartTime) {
            total += Date.now() - this.pauseStartTime;
        }
        return total;
    }
}

// Global pause manager instance
window.pauseManager = new PauseManager();
