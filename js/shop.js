// Shop Interface System for Herumballerpunkt
// Implements comprehensive build menu and upgrade interface

class ShopInterface {
    constructor(defenseManager, economyManager) {
        this.defenseManager = defenseManager;
        this.economyManager = economyManager;
        this.isOpen = false;
        this.selectedCategory = 'TURRETS';
        this.categories = {
            TURRETS: ['GATLING_TURRET', 'SNIPER_TURRET', 'ROCKET_TURRET'],
            SUPPORT: ['REPAIR_STATION', 'SHIELD_GENERATOR', 'RADAR_STATION'],
            SPECIAL: ['TESLA_COIL', 'LASER_FENCE']
        };
        this.hoveredItem = null;
        this.shopSize = { width: 400, height: 500 };
        this.shopPosition = { x: 0, y: 0 }; // Will be calculated dynamically
        this.hotkeys = {
            'GATLING_TURRET': '1',
            'SNIPER_TURRET': '2',
            'ROCKET_TURRET': '3',
            'REPAIR_STATION': '4',
            'SHIELD_GENERATOR': '5',
            'RADAR_STATION': '6',
            'TESLA_COIL': '7',
            'LASER_FENCE': '8'
        };
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        if (!this.isOpen) {
            this.defenseManager.exitBuildMode();
        }
    }
    
    open() {
        this.isOpen = true;
    }
    
    close() {
        this.isOpen = false;
        this.defenseManager.exitBuildMode();
    }
    
    handleClick(x, y) {
        if (!this.isOpen) return false;
        
        // Check if click is within shop bounds
        if (x < this.shopPosition.x || x > this.shopPosition.x + this.shopSize.width ||
            y < this.shopPosition.y || y > this.shopPosition.y + this.shopSize.height) {
            return false;
        }
        
        // Check category tabs
        const tabHeight = 40;
        const tabWidth = this.shopSize.width / Object.keys(this.categories).length;
        
        if (y >= this.shopPosition.y && y <= this.shopPosition.y + tabHeight) {
            const tabIndex = Math.floor((x - this.shopPosition.x) / tabWidth);
            const categoryKeys = Object.keys(this.categories);
            if (tabIndex >= 0 && tabIndex < categoryKeys.length) {
                this.selectedCategory = categoryKeys[tabIndex];
                return true;
            }
        }
        
        // Check item selection
        const itemStartY = this.shopPosition.y + tabHeight + 10;
        const itemHeight = 60;
        const items = this.categories[this.selectedCategory];
        
        for (let i = 0; i < items.length; i++) {
            const itemY = itemStartY + i * (itemHeight + 10);
            if (y >= itemY && y <= itemY + itemHeight) {
                this.selectItem(items[i]);
                return true;
            }
        }
        
        return true; // Consumed click even if no specific action
    }
    
    handleMouseMove(x, y) {
        if (!this.isOpen) return;
        
        // Update hovered item
        this.hoveredItem = null;
        
        const itemStartY = this.shopPosition.y + 50;
        const itemHeight = 60;
        const items = this.categories[this.selectedCategory];
        
        for (let i = 0; i < items.length; i++) {
            const itemY = itemStartY + i * (itemHeight + 10);
            if (x >= this.shopPosition.x + 10 && x <= this.shopPosition.x + this.shopSize.width - 10 &&
                y >= itemY && y <= itemY + itemHeight) {
                this.hoveredItem = items[i];
                break;
            }
        }
    }
    
    selectItem(structureType) {
        const config = DEFENSE_CONFIGS[structureType];
        
        if (this.economyManager.canAfford(config.cost)) {
            this.defenseManager.enterBuildMode(structureType);
            this.close();
        } else {
            // Show "cannot afford" feedback
            console.log(`Cannot afford ${config.name} - costs $${config.cost}, have $${this.economyManager.money}`);
        }
    }
    
    render(ctx) {
        if (!this.isOpen) return;

        // Calculate centered position
        const canvas = ctx.canvas;
        this.shopPosition.x = (canvas.width - this.shopSize.width) / 2;
        this.shopPosition.y = (canvas.height - this.shopSize.height) / 2;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Shop background with improved styling
        const gradient = ctx.createLinearGradient(
            this.shopPosition.x, this.shopPosition.y,
            this.shopPosition.x, this.shopPosition.y + this.shopSize.height
        );
        gradient.addColorStop(0, 'rgba(20, 30, 40, 0.95)');
        gradient.addColorStop(1, 'rgba(10, 15, 20, 0.95)');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.shopPosition.x, this.shopPosition.y, this.shopSize.width, this.shopSize.height);

        // Border with glow effect
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 10;
        ctx.strokeRect(this.shopPosition.x, this.shopPosition.y, this.shopSize.width, this.shopSize.height);
        ctx.shadowBlur = 0;

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Defense Shop', this.shopPosition.x + this.shopSize.width / 2, this.shopPosition.y + 30);

        // Close instruction
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '12px Arial';
        ctx.fillText('Press B or ESC to close', this.shopPosition.x + this.shopSize.width / 2, this.shopPosition.y + 50);

        // Category tabs
        this.renderCategoryTabs(ctx);

        // Items
        this.renderItems(ctx);

        // Money display
        this.renderMoneyDisplay(ctx);

        // Hotkey legend
        this.renderHotkeyLegend(ctx);
    }
    
    renderCategoryTabs(ctx) {
        const tabHeight = 45;
        const tabWidth = this.shopSize.width / Object.keys(this.categories).length;
        const tabY = this.shopPosition.y + 60;

        Object.keys(this.categories).forEach((category, index) => {
            const tabX = this.shopPosition.x + index * tabWidth;
            const isSelected = category === this.selectedCategory;

            // Tab background with gradient
            if (isSelected) {
                const gradient = ctx.createLinearGradient(tabX, tabY, tabX, tabY + tabHeight);
                gradient.addColorStop(0, '#0066cc');
                gradient.addColorStop(1, '#004499');
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
            }
            ctx.fillRect(tabX, tabY, tabWidth, tabHeight);

            // Tab border
            ctx.strokeStyle = isSelected ? '#00aaff' : '#666666';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(tabX, tabY, tabWidth, tabHeight);

            // Tab text
            ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
            ctx.font = isSelected ? 'bold 14px Arial' : '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(category, tabX + tabWidth / 2, tabY + 28);
        });
    }
    
    renderItems(ctx) {
        const items = this.categories[this.selectedCategory];
        const itemStartY = this.shopPosition.y + 115;
        const itemHeight = 70;
        const itemWidth = this.shopSize.width - 20;

        items.forEach((structureType, index) => {
            const config = DEFENSE_CONFIGS[structureType];
            const itemY = itemStartY + index * (itemHeight + 5);
            const itemX = this.shopPosition.x + 10;

            const canAfford = this.economyManager.canAfford(config.cost);
            const isHovered = this.hoveredItem === structureType;
            const hotkey = this.hotkeys[structureType];

            // Item background with gradient
            if (isHovered) {
                const gradient = ctx.createLinearGradient(itemX, itemY, itemX, itemY + itemHeight);
                gradient.addColorStop(0, 'rgba(80, 120, 160, 0.8)');
                gradient.addColorStop(1, 'rgba(40, 80, 120, 0.8)');
                ctx.fillStyle = gradient;
            } else if (!canAfford) {
                ctx.fillStyle = 'rgba(80, 40, 40, 0.6)';
            } else {
                ctx.fillStyle = 'rgba(40, 50, 60, 0.8)';
            }
            ctx.fillRect(itemX, itemY, itemWidth, itemHeight);

            // Item border
            ctx.strokeStyle = isHovered ? '#00aaff' : (canAfford ? '#666666' : '#aa4444');
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);

            // Structure icon with glow
            ctx.save();
            if (canAfford) {
                ctx.shadowColor = config.glowColor;
                ctx.shadowBlur = 8;
            }
            ctx.fillStyle = config.color;
            ctx.beginPath();
            ctx.arc(itemX + 35, itemY + 35, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Hotkey indicator
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(hotkey, itemX + 35, itemY + 15);

            // Structure name
            ctx.fillStyle = canAfford ? '#ffffff' : '#999999';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(config.name, itemX + 65, itemY + 25);

            // Cost with currency symbol
            ctx.fillStyle = canAfford ? '#00ff00' : '#ff6666';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`$${config.cost}`, itemX + itemWidth - 15, itemY + 25);

            // Stats with better formatting
            ctx.fillStyle = '#cccccc';
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';

            let statsText = '';
            if (config.damage) statsText += `DMG: ${config.damage} `;
            if (config.range) statsText += `RNG: ${config.range} `;
            if (config.fireRate) statsText += `ROF: ${Math.round(60000/config.fireRate)}/s`;

            ctx.fillText(statsText, itemX + 65, itemY + 45);

            // Special abilities with icons
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '10px Arial';
            let abilityText = '';
            if (structureType === 'REPAIR_STATION') {
                abilityText = '🔧 Repairs nearby structures';
            } else if (structureType === 'SHIELD_GENERATOR') {
                abilityText = '🛡️ Provides energy shields';
            } else if (structureType === 'RADAR_STATION') {
                abilityText = '📡 Improves turret accuracy';
            } else if (structureType === 'TESLA_COIL') {
                abilityText = '⚡ Chain lightning attacks';
            } else if (structureType === 'LASER_FENCE') {
                abilityText = '🔴 Continuous damage barrier';
            }
            ctx.fillText(abilityText, itemX + 65, itemY + 60);
        });
    }
    
    renderMoneyDisplay(ctx) {
        const moneyY = this.shopPosition.y + this.shopSize.height - 60;

        // Money background with gradient
        const gradient = ctx.createLinearGradient(
            this.shopPosition.x + 10, moneyY - 5,
            this.shopPosition.x + 10, moneyY + 25
        );
        gradient.addColorStop(0, 'rgba(40, 40, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(60, 60, 0, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.shopPosition.x + 10, moneyY - 5, this.shopSize.width - 20, 35);

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.shopPosition.x + 10, moneyY - 5, this.shopSize.width - 20, 35);

        // Money icon and text
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`💰 $${this.economyManager.money}`,
                    this.shopPosition.x + this.shopSize.width / 2, moneyY + 15);

        // Combo multiplier
        if (this.economyManager.comboMultiplier > 1.0) {
            ctx.fillStyle = '#ff8800';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`${this.economyManager.comboMultiplier.toFixed(1)}x COMBO!`,
                        this.shopPosition.x + this.shopSize.width / 2, moneyY - 10);
        }
    }

    renderHotkeyLegend(ctx) {
        const legendY = this.shopPosition.y + this.shopSize.height - 20;

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Hotkeys: 1-8 for quick build | B: Toggle Shop | ESC: Close',
                    this.shopPosition.x + this.shopSize.width / 2, legendY);
    }
}

// HUD Integration for Economy System
class EconomyHUD {
    constructor(economyManager, bunkerManager = null) {
        this.economyManager = economyManager;
        this.bunkerManager = bunkerManager;
        this.position = { x: 10, y: 10 };
        this.showDetails = false;
        this.showBunkerInfo = false;
    }
    
    render(ctx) {
        const stats = this.economyManager.getStats();
        
        // Main money display
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.position.x, this.position.y, 200, 60);
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, 200, 60);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Money: $${stats.current}`, this.position.x + 10, this.position.y + 25);
        
        // Combo display
        if (stats.comboMultiplier > 1.0) {
            ctx.fillStyle = '#ff8800';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`${stats.comboMultiplier.toFixed(1)}x COMBO`, this.position.x + 10, this.position.y + 45);
            
            // Combo timer bar
            const comboProgress = this.economyManager.comboTimer / this.economyManager.comboDuration;
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(this.position.x + 100, this.position.y + 35, 90 * comboProgress, 8);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.position.x + 100, this.position.y + 35, 90, 8);
        }
        
        // Kill streak
        if (stats.killStreak > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText(`Streak: ${stats.killStreak}`, this.position.x + 10, this.position.y + 55);
        }
        
        // Detailed stats (toggle with key)
        if (this.showDetails) {
            this.renderDetailedStats(ctx, stats);
        }

        // Bunker info (if available)
        if (this.bunkerManager && this.showBunkerInfo) {
            this.renderBunkerInfo(ctx);
        }

        // Hotkey hints
        this.renderHotkeyHints(ctx);
    }
    
    renderDetailedStats(ctx, stats) {
        const detailsY = this.position.y + 70;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.position.x, detailsY, 250, 100);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.position.x, detailsY, 250, 100);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        ctx.fillText(`Total Earned: $${stats.totalEarned}`, this.position.x + 10, detailsY + 20);
        ctx.fillText(`Total Spent: $${stats.totalSpent}`, this.position.x + 10, detailsY + 35);
        ctx.fillText(`Net Worth: $${stats.totalEarned - stats.totalSpent}`, this.position.x + 10, detailsY + 50);
        ctx.fillText(`Efficiency: ${((stats.totalEarned / Math.max(1, stats.totalSpent)) * 100).toFixed(1)}%`, 
                    this.position.x + 10, detailsY + 65);
        
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '10px Arial';
        ctx.fillText('Press E to hide details', this.position.x + 10, detailsY + 85);
    }
    
    toggleDetails() {
        this.showDetails = !this.showDetails;
    }

    toggleBunkerInfo() {
        this.showBunkerInfo = !this.showBunkerInfo;
    }

    renderBunkerInfo(ctx) {
        if (!this.bunkerManager) return;

        const powerStatus = this.bunkerManager.getPowerStatus();
        const bunkerY = this.position.y + 180;

        ctx.fillStyle = 'rgba(0, 40, 80, 0.8)';
        ctx.fillRect(this.position.x, bunkerY, 280, 120);

        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, bunkerY, 280, 120);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Bunker Status', this.position.x + 10, bunkerY + 20);

        ctx.font = '12px Arial';
        ctx.fillText(`Modules: ${this.bunkerManager.modules.length}`, this.position.x + 10, bunkerY + 40);
        ctx.fillText(`Power Gen: ${powerStatus.generation}`, this.position.x + 10, bunkerY + 55);
        ctx.fillText(`Power Use: ${powerStatus.consumption}`, this.position.x + 10, bunkerY + 70);

        // Power efficiency bar
        const efficiency = Math.min(1, powerStatus.consumption / Math.max(1, powerStatus.generation));
        const barWidth = 100;
        const barHeight = 8;
        const barX = this.position.x + 150;
        const barY = bunkerY + 45;

        ctx.fillStyle = efficiency > 0.8 ? '#ff4444' : efficiency > 0.6 ? '#ffaa44' : '#44ff44';
        ctx.fillRect(barX, barY, barWidth * efficiency, barHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '10px Arial';
        ctx.fillText('Press F to hide bunker info', this.position.x + 10, bunkerY + 95);
        ctx.fillText('Hotkeys: Q-Y for bunker modules', this.position.x + 10, bunkerY + 110);
    }

    renderHotkeyHints(ctx) {
        const hintsY = this.position.y + 320;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.position.x, hintsY, 250, 80);

        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.position.x, hintsY, 250, 80);

        ctx.fillStyle = '#cccccc';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Hotkeys:', this.position.x + 10, hintsY + 15);
        ctx.fillText('B - Toggle Shop', this.position.x + 10, hintsY + 30);
        ctx.fillText('1-8 - Quick Build Defenses', this.position.x + 10, hintsY + 42);
        ctx.fillText('Q-Y - Quick Build Bunker', this.position.x + 10, hintsY + 54);
        ctx.fillText('E - Economy Details', this.position.x + 10, hintsY + 66);
    }
}

// Input Handler for Economy System
class EconomyInputHandler {
    constructor(shopInterface, defenseManager, economyHUD) {
        this.shopInterface = shopInterface;
        this.defenseManager = defenseManager;
        this.economyHUD = economyHUD;
        this.mousePosition = { x: 0, y: 0 };
    }
    
    handleKeyPress(key) {
        switch(key.toLowerCase()) {
            case 'b':
                this.shopInterface.toggle();
                break;
            case 'escape':
                this.shopInterface.close();
                this.defenseManager.exitBuildMode();
                break;
            case 'e':
                this.economyHUD.toggleDetails();
                break;
            case 'f':
                this.economyHUD.toggleBunkerInfo();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
                this.handleHotkeyBuild(key);
                break;
        }
    }

    handleHotkeyBuild(key) {
        // Map hotkeys to structure types
        const hotkeyMap = {
            '1': 'GATLING_TURRET',
            '2': 'SNIPER_TURRET',
            '3': 'ROCKET_TURRET',
            '4': 'REPAIR_STATION',
            '5': 'SHIELD_GENERATOR',
            '6': 'RADAR_STATION',
            '7': 'TESLA_COIL',
            '8': 'LASER_FENCE'
        };

        const structureType = hotkeyMap[key];
        if (structureType) {
            const config = DEFENSE_CONFIGS[structureType];

            if (this.economyManager.canAfford(config.cost)) {
                this.defenseManager.enterBuildMode(structureType);
                this.shopInterface.close();
                console.log(`Hotkey ${key}: Entering build mode for ${config.name}`);
            } else {
                console.log(`Hotkey ${key}: Cannot afford ${config.name} (costs $${config.cost})`);
                // Show visual feedback for insufficient funds
                this.showInsufficientFundsMessage(config.name, config.cost);
            }
        }
    }

    showInsufficientFundsMessage(structureName, cost) {
        // This could be enhanced with a visual notification system
        console.log(`⚠️ Insufficient funds for ${structureName}! Need $${cost}, have $${this.economyManager.money}`);
    }
    
    handleMouseMove(x, y) {
        this.mousePosition.x = x;
        this.mousePosition.y = y;
        
        this.shopInterface.handleMouseMove(x, y);
        this.defenseManager.updatePreview(x, y);
    }
    
    handleMouseClick(x, y, button) {
        // Left click
        if (button === 0) {
            // Check shop interface first
            if (this.shopInterface.handleClick(x, y)) {
                return true;
            }
            
            // Build mode
            if (this.defenseManager.buildMode) {
                return this.defenseManager.buildStructure(x, y);
            }
            
            // Select structure
            const selectedStructure = this.defenseManager.selectStructure(x, y);
            return selectedStructure !== null;
        }
        
        // Right click
        if (button === 2) {
            // Upgrade selected structure
            if (this.defenseManager.selectedStructure) {
                return this.defenseManager.upgradeSelectedStructure();
            }
        }
        
        return false;
    }
    
    handleContextMenu(x, y) {
        // Prevent default context menu and handle as right click
        return this.handleMouseClick(x, y, 2);
    }
}
