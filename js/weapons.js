// Weapon Systems

const WEAPON_TYPES = {
    PISTOL: { name: 'Pistole', ammo: 30, maxAmmo: 30, fireRate: 300, damage: 25, bulletSpeed: 15, spread: 0, color: '#ff0' },
    MG: { name: 'MG', ammo: 100, maxAmmo: 100, fireRate: 100, damage: 15, bulletSpeed: 20, spread: 0.1, color: '#ff0' },
    SHOTGUN: { name: 'Schrotflinte', ammo: 20, maxAmmo: 20, fireRate: 600, damage: 20, bulletSpeed: 12, spread: 0.3, pellets: 5, color: '#ffa' },
    FLAMETHROWER: { name: 'Flammenwerfer', ammo: 200, maxAmmo: 200, fireRate: 50, damage: 5, bulletSpeed: 8, spread: 0.2, flame: true, color: '#f80' },
    ROCKET: { name: 'Raketenwerfer', ammo: 10, maxAmmo: 10, fireRate: 1000, damage: 100, bulletSpeed: 10, spread: 0, explosive: true, color: '#f0f' }
};

const WEAPON_UPGRADES = [
    { name: 'Side Cannons', type: 'side', description: 'Fires at 45° angles', maxLevel: 3 },
    { name: 'Rear Guard', type: 'rear', description: 'Fires backwards', maxLevel: 3 },
    { name: 'Orbital Missiles', type: 'orbital', description: 'Periodic homing rockets', maxLevel: 3 },
    { name: 'Fire Shield', type: 'shield', description: 'Rotating flame barrier', maxLevel: 3 },
    { name: 'Laser Sweep', type: 'laser', description: 'Rotating laser beam', maxLevel: 3 }
];

class WeaponSystem {
    constructor() {
        this.weapons = [
            { ...WEAPON_TYPES.PISTOL },
            { ...WEAPON_TYPES.MG }
        ];
        this.currentWeapon = 0;
        this.lastShot = 0;
        this.hasMG = false; // Simple flag: false = pistol only, true = has MG
    }
    
    reset() {
        this.weapons.forEach(weapon => {
            weapon.ammo = weapon.maxAmmo;
        });
        this.currentWeapon = 0;
        this.hasMG = false; // Reset to pistol only
    }
    
    addUpgrade(upgrade) {
        // Only one upgrade possible: pistol -> MG
        if (!this.hasMG) {
            this.hasMG = true;
            this.currentWeapon = 1; // Switch to MG
            return true; // Successfully upgraded to MG
        }
        return false; // Already has MG
    }
    
    getUpgradeCount() {
        // Simple: 0 if pistol only, 1 if has MG
        return this.hasMG ? 1 : 0;
    }
    
    switchWeapon(index) {
        // Simple weapon switching: 0 = pistol, 1 = MG (if available)
        if (index === 0) {
            this.currentWeapon = 0; // Always can switch to pistol
        } else if (index === 1 && this.hasMG) {
            this.currentWeapon = 1; // Only switch to MG if available
        }
    }
    
    canShoot() {
        const weapon = this.weapons[this.currentWeapon];
        const now = Date.now();
        return now - this.lastShot >= weapon.fireRate && weapon.ammo > 0;
    }
    
    shoot(x, y, targetX, targetY) {
        if (!this.canShoot()) return [];
        
        const weapon = this.weapons[this.currentWeapon];
        const bullets = [];
        const baseAngle = Math.atan2(targetY - y, targetX - x);
        
        // Main weapon fire
        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread;
            const angle = baseAngle + spread;
            
            bullets.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * weapon.bulletSpeed,
                vy: Math.sin(angle) * weapon.bulletSpeed,
                radius: weapon.flame ? 8 : 5,
                damage: weapon.damage,
                isPlayer: true,
                color: weapon.color,
                flame: weapon.flame || false,
                explosive: weapon.explosive || false,
                lifetime: weapon.flame ? 30 : 100
            });
        }
        
        weapon.ammo--;
        this.lastShot = Date.now();
        playSound('shoot', 0.2);
        
        return bullets;
    }
    
    updateUpgrades(x, y, targetX, targetY) {
        // No upgrades anymore, just return empty array
        return [];
    }
    
    updateShield(x, y) {
        // No shield upgrade anymore
        return [];
    }
    
    updateLaser(x, y) {
        // No laser upgrade anymore
        return null;
    }
}

// Weapon pickup generator
function createWeaponPickup(x, y, weaponIndex = null) {
    if (weaponIndex === null) {
        weaponIndex = Math.floor(Math.random() * 2); // Only pistol (0) or MG (1)
    }
    
    return {
        x: x,
        y: y,
        type: 'weapon',
        radius: 10,
        lifetime: 10000,
        created: Date.now(),
        weaponIndex: weaponIndex,
        rotation: 0
    };
}

function createUpgradePickup(x, y) {
    return {
        x: x,
        y: y,
        type: 'upgrade',
        radius: 12,
        lifetime: 10000,
        created: Date.now(),
        upgrade: { name: 'MG Upgrade', type: 'mg', description: 'Upgrade to Machine Gun' },
        rotation: 0
    };
}