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
        this.shopPosition = { x: 50, y: 50 };
        this.shopSize = { width: 300, height: 400 };
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
        
        // Shop background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(this.shopPosition.x, this.shopPosition.y, this.shopSize.width, this.shopSize.height);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.shopPosition.x, this.shopPosition.y, this.shopSize.width, this.shopSize.height);
        
        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Defense Shop', this.shopPosition.x + this.shopSize.width / 2, this.shopPosition.y + 25);
        
        // Category tabs
        this.renderCategoryTabs(ctx);
        
        // Items
        this.renderItems(ctx);
        
        // Money display
        this.renderMoneyDisplay(ctx);
    }
    
    renderCategoryTabs(ctx) {
        const tabHeight = 40;
        const tabWidth = this.shopSize.width / Object.keys(this.categories).length;
        const tabY = this.shopPosition.y + 30;
        
        Object.keys(this.categories).forEach((category, index) => {
            const tabX = this.shopPosition.x + index * tabWidth;
            const isSelected = category === this.selectedCategory;
            
            // Tab background
            ctx.fillStyle = isSelected ? '#444444' : '#222222';
            ctx.fillRect(tabX, tabY, tabWidth, tabHeight);
            
            // Tab border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(tabX, tabY, tabWidth, tabHeight);
            
            // Tab text
            ctx.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(category, tabX + tabWidth / 2, tabY + 25);
        });
    }
    
    renderItems(ctx) {
        const items = this.categories[this.selectedCategory];
        const itemStartY = this.shopPosition.y + 80;
        const itemHeight = 60;
        const itemWidth = this.shopSize.width - 20;
        
        items.forEach((structureType, index) => {
            const config = DEFENSE_CONFIGS[structureType];
            const itemY = itemStartY + index * (itemHeight + 10);
            const itemX = this.shopPosition.x + 10;
            
            const canAfford = this.economyManager.canAfford(config.cost);
            const isHovered = this.hoveredItem === structureType;
            
            // Item background
            ctx.fillStyle = isHovered ? '#333333' : '#222222';
            if (!canAfford) ctx.fillStyle = '#441111';
            ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
            
            // Item border
            ctx.strokeStyle = isHovered ? '#ffffff' : '#666666';
            if (!canAfford) ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 1;
            ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);
            
            // Structure icon (simplified)
            ctx.fillStyle = config.color;
            ctx.beginPath();
            ctx.arc(itemX + 30, itemY + 30, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Structure name
            ctx.fillStyle = canAfford ? '#ffffff' : '#888888';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(config.name, itemX + 60, itemY + 20);
            
            // Cost
            ctx.fillStyle = canAfford ? '#00ff00' : '#ff4444';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`$${config.cost}`, itemX + itemWidth - 10, itemY + 20);
            
            // Stats
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            
            let statsText = '';
            if (config.damage) statsText += `DMG: ${config.damage} `;
            if (config.range) statsText += `RNG: ${config.range} `;
            if (config.fireRate) statsText += `ROF: ${Math.round(60000/config.fireRate)}/s`;
            
            ctx.fillText(statsText, itemX + 60, itemY + 40);
            
            // Special abilities text
            if (structureType === 'REPAIR_STATION') {
                ctx.fillText('Repairs nearby structures', itemX + 60, itemY + 52);
            } else if (structureType === 'SHIELD_GENERATOR') {
                ctx.fillText('Provides energy shields', itemX + 60, itemY + 52);
            } else if (structureType === 'RADAR_STATION') {
                ctx.fillText('Improves turret accuracy', itemX + 60, itemY + 52);
            } else if (structureType === 'TESLA_COIL') {
                ctx.fillText('Chain lightning attacks', itemX + 60, itemY + 52);
            } else if (structureType === 'LASER_FENCE') {
                ctx.fillText('Continuous damage barrier', itemX + 60, itemY + 52);
            }
        });
    }
    
    renderMoneyDisplay(ctx) {
        const moneyY = this.shopPosition.y + this.shopSize.height - 30;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.shopPosition.x + 10, moneyY - 5, this.shopSize.width - 20, 25);
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.shopPosition.x + 10, moneyY - 5, this.shopSize.width - 20, 25);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Money: $${this.economyManager.money}`, 
                    this.shopPosition.x + this.shopSize.width / 2, moneyY + 10);
        
        // Combo multiplier
        if (this.economyManager.comboMultiplier > 1.0) {
            ctx.fillStyle = '#ff8800';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`${this.economyManager.comboMultiplier.toFixed(1)}x COMBO!`, 
                        this.shopPosition.x + this.shopSize.width / 2, moneyY - 15);
        }
    }
}

// HUD Integration for Economy System
class EconomyHUD {
    constructor(economyManager) {
        this.economyManager = economyManager;
        this.position = { x: 10, y: 10 };
        this.showDetails = false;
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
        }
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
