# Anforderung 004: Economy & Defense System - Währung und Verteidigungsanlagen

## Übersicht
**Priorität:** Hoch  
**Komplexität:** Niedrig-Mittel  
**Geschätzter Aufwand:** 1-2 Wochen  
**Kategorie:** Gameplay Enhancement - Strategic Economy

## Feature-Beschreibung

### Gameplay-Konzept
Ein Währungssystem, bei dem Spieler für eliminierte Feinde Geld ($) erhalten und dieses für den Kauf von Verteidigungsanlagen ausgeben können. Dies fügt eine strategische Ressourcen-Management-Ebene hinzu und ermöglicht es Spielern, ihre eigene Verteidigungsstrategie zu entwickeln.

### Gameplay-Impact
- **Strategische Planung:** Spieler müssen Geld-Ausgaben priorisieren
- **Langfristige Progression:** Investitionen zahlen sich über mehrere Wellen aus
- **Taktische Vielfalt:** Verschiedene Verteidigungsstrategien möglich
- **Risk-Reward:** Teure Anlagen bieten bessere Verteidigung
- **Aktive Entscheidungen:** Kontinuierliche strategische Entscheidungen während des Spiels

### Währungssystem

#### Geld-Quellen
- **Standard-Feinde:** $10-15 pro Eliminierung
- **Elite-Feinde:** $50-100 pro Eliminierung (je nach Typ)
- **Boss-Feinde:** $200-500 pro Eliminierung
- **Wellen-Bonus:** $100 × Wellennummer bei Abschluss
- **Effizienz-Bonus:** +50% Geld für Headshots/kritische Treffer
- **Combo-Bonus:** +10% pro Feind in schneller Folge (max +100%)

#### Geld-Ausgaben
- **Verteidigungsanlagen:** $100-1000 je nach Typ
- **Upgrades:** $50-300 pro Upgrade-Stufe
- **Reparaturen:** $25-100 je nach Schadensstufe
- **Spezial-Munition:** $20-50 pro Magazin
- **Notfall-Heilung:** $75 für 50 HP

### Verteidigungsanlagen

#### Basis-Türme
1. **"Gatling-Turret"** ($150)
   - Schnelle Feuerrate, mittlerer Schaden
   - 360° Rotation, 200px Reichweite
   - Upgrades: Schaden (+$75), Reichweite (+$50), Feuerrate (+$100)

2. **"Sniper-Turret"** ($300)
   - Hoher Schaden, langsame Feuerrate
   - Lange Reichweite (400px), Laser-Zielhilfe
   - Upgrades: Durchschlag (+$150), Schaden (+$100), Zielhilfe (+$75)

3. **"Rocket-Turret"** ($500)
   - Explosionsschaden, mittlere Feuerrate
   - Flächenschaden, mittlere Reichweite (250px)
   - Upgrades: Explosionsradius (+$200), Schaden (+$150), Zielhilfe (+$100)

#### Spezial-Anlagen
4. **"Repair-Station"** ($200)
   - Repariert nahegelegene Anlagen automatisch
   - Heilt Spieler bei Annäherung (langsam)
   - Upgrades: Reparatur-Geschwindigkeit (+$100), Heilung (+$150)

5. **"Shield-Generator"** ($400)
   - Erzeugt Energieschild um nahegelegene Anlagen
   - Schild absorbiert Schäden bis zur Überlastung
   - Upgrades: Schild-Stärke (+$200), Reichweite (+$150), Regeneration (+$250)

6. **"Radar-Station"** ($250)
   - Zeigt Feinde auf Minimap an
   - Erhöht Trefferchance aller Türme in Reichweite
   - Upgrades: Reichweite (+$100), Trefferbonus (+$150), Feind-Markierung (+$100)

#### Erweiterte Systeme
7. **"Tesla-Coil"** ($750)
   - Kettenblitze zwischen nahegelegenen Feinden
   - Hoher Schaden, aber kurze Reichweite (150px)
   - Upgrades: Kettenlänge (+$300), Schaden (+$200), Ladezeit (+$250)

8. **"Laser-Fence"** ($300 pro Segment)
   - Kontinuierlicher Laser-Strahl zwischen zwei Punkten
   - Blockiert Feinde und verursacht Schaden
   - Upgrades: Schaden (+$150), Durchdringung (+$200)

## Funktionale Anforderungen

### FR-004.1: Währungssystem
- **Beschreibung:** Vollständiges Geld-Management mit Einnahmen und Ausgaben
- **Akzeptanzkriterien:**
  - Geld wird für jede Feind-Eliminierung vergeben
  - Bonus-Multiplikatoren für spezielle Aktionen
  - Persistente Geld-Anzeige im HUD
  - Geld bleibt zwischen Wellen erhalten
  - Schwierigkeitsgrad beeinflusst Geld-Raten

### FR-004.2: Shop-System
- **Beschreibung:** Intuitive Kaufoberfläche für Verteidigungsanlagen
- **Akzeptanzkriterien:**
  - Shop öffnet sich mit Taste 'B' (Build-Modus)
  - Kategorisierte Anlagen-Auswahl
  - Vorschau der Platzierung mit Reichweiten-Anzeige
  - Kosten-Anzeige und Verfügbarkeits-Check
  - Bestätigung vor teueren Käufen

### FR-004.3: Platzierungssystem
- **Beschreibung:** Flexibles System zur Platzierung von Verteidigungsanlagen
- **Akzeptanzkriterien:**
  - Maus-basierte Platzierung mit Vorschau
  - Kollisionserkennung verhindert ungültige Platzierung
  - Mindestabstand zwischen Anlagen
  - Platzierung nur in sicheren Bereichen (nicht in Spawn-Zonen)
  - Visuelle Feedback für gültige/ungültige Positionen

### FR-004.4: Upgrade-System
- **Beschreibung:** Verbesserung bestehender Anlagen
- **Akzeptanzkriterien:**
  - Rechtsklick auf Anlage öffnet Upgrade-Menü
  - Mehrstufige Upgrades mit steigenden Kosten
  - Visuelle Änderungen bei Upgrades
  - Upgrade-Fortschritt wird gespeichert
  - Maximale Upgrade-Stufen pro Anlagen-Typ

## Technische Anforderungen

### TR-004.1: Economy-Manager
```javascript
class EconomyManager {
    constructor() {
        this.money = 500; // Startgeld
        this.totalEarned = 0;
        this.totalSpent = 0;
        this.comboMultiplier = 1.0;
        this.lastKillTime = 0;
        this.comboCount = 0;
    }
    
    addMoney(amount, source = 'kill') {
        const finalAmount = Math.floor(amount * this.comboMultiplier);
        this.money += finalAmount;
        this.totalEarned += finalAmount;
        
        // Update combo for kills
        if (source === 'kill') {
            this.updateCombo();
        }
        
        // Visual feedback
        this.showMoneyGain(finalAmount);
        playSound('money', 0.3);
    }
    
    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            this.totalSpent += amount;
            return true;
        }
        return false;
    }
    
    updateCombo() {
        const now = Date.now();
        if (now - this.lastKillTime < 2000) { // 2 seconds combo window
            this.comboCount++;
            this.comboMultiplier = Math.min(2.0, 1.0 + (this.comboCount * 0.1));
        } else {
            this.comboCount = 0;
            this.comboMultiplier = 1.0;
        }
        this.lastKillTime = now;
    }
}
```

### TR-004.2: Defense-Structure-Klasse
```javascript
class DefenseStructure {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.config = DEFENSE_CONFIGS[type];
        this.health = this.config.maxHealth;
        this.maxHealth = this.config.maxHealth;
        this.range = this.config.range;
        this.damage = this.config.damage;
        this.fireRate = this.config.fireRate;
        this.lastShot = 0;
        this.target = null;
        this.angle = 0;
        this.upgradeLevel = 0;
        this.maxUpgrades = this.config.maxUpgrades;
        this.isActive = true;
    }
    
    update(enemies) {
        if (!this.isActive || this.health <= 0) return [];
        
        // Find target
        this.target = this.findTarget(enemies);
        
        // Rotate towards target
        if (this.target) {
            this.angle = getAngle(this.x, this.y, this.target.x, this.target.y);
        }
        
        // Shoot if possible
        return this.tryShoot();
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = this.range;
        
        enemies.forEach(enemy => {
            const distance = getDistance(this.x, this.y, enemy.x, enemy.y);
            if (distance <= this.range && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }
    
    tryShoot() {
        if (!this.target || Date.now() - this.lastShot < this.fireRate) {
            return [];
        }
        
        this.lastShot = Date.now();
        playSound('turret_shoot', 0.2);
        
        return this.createProjectile();
    }
    
    upgrade(upgradeType) {
        if (this.upgradeLevel >= this.maxUpgrades) return false;
        
        const cost = this.getUpgradeCost(upgradeType);
        if (!economyManager.spendMoney(cost)) return false;
        
        this.applyUpgrade(upgradeType);
        this.upgradeLevel++;
        
        // Visual upgrade effect
        createParticles(this.x, this.y, '#4af', 15);
        playSound('upgrade', 0.4);
        
        return true;
    }
}
```

### TR-004.3: Shop-Interface
```javascript
class ShopInterface {
    constructor() {
        this.isOpen = false;
        this.selectedItem = null;
        this.previewMode = false;
        this.previewX = 0;
        this.previewY = 0;
        this.categories = ['turrets', 'special', 'utilities'];
        this.currentCategory = 'turrets';
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            gameManager.pauseGame();
        } else {
            gameManager.resumeGame();
            this.cancelPreview();
        }
    }
    
    selectItem(itemType) {
        this.selectedItem = itemType;
        this.previewMode = true;
        this.isOpen = false;
        gameManager.resumeGame();
    }
    
    updatePreview(mouseX, mouseY) {
        if (!this.previewMode) return;
        
        this.previewX = mouseX;
        this.previewY = mouseY;
        
        // Check if placement is valid
        const isValid = this.isValidPlacement(mouseX, mouseY);
        this.previewValid = isValid;
    }
    
    confirmPurchase() {
        if (!this.previewMode || !this.previewValid) return false;
        
        const cost = DEFENSE_CONFIGS[this.selectedItem].cost;
        if (!economyManager.spendMoney(cost)) {
            this.showInsufficientFunds();
            return false;
        }
        
        // Create defense structure
        const structure = new DefenseStructure(
            this.selectedItem, 
            this.previewX, 
            this.previewY
        );
        
        gameManager.defenseStructures.push(structure);
        this.cancelPreview();
        
        playSound('build', 0.5);
        return true;
    }
}
```

### TR-004.4: Defense-Konfiguration
```javascript
const DEFENSE_CONFIGS = {
    GATLING_TURRET: {
        name: 'Gatling-Turret',
        cost: 150,
        maxHealth: 200,
        range: 200,
        damage: 15,
        fireRate: 200,
        maxUpgrades: 3,
        upgrades: {
            damage: { cost: 75, effect: 1.5 },
            range: { cost: 50, effect: 1.3 },
            fireRate: { cost: 100, effect: 0.7 }
        }
    },
    SNIPER_TURRET: {
        name: 'Sniper-Turret',
        cost: 300,
        maxHealth: 150,
        range: 400,
        damage: 80,
        fireRate: 1500,
        maxUpgrades: 3,
        upgrades: {
            piercing: { cost: 150, effect: 'piercing' },
            damage: { cost: 100, effect: 2.0 },
            targeting: { cost: 75, effect: 'laser_sight' }
        }
    },
    ROCKET_TURRET: {
        name: 'Rocket-Turret',
        cost: 500,
        maxHealth: 250,
        range: 250,
        damage: 120,
        fireRate: 2000,
        explosionRadius: 50,
        maxUpgrades: 3,
        upgrades: {
            explosionRadius: { cost: 200, effect: 1.5 },
            damage: { cost: 150, effect: 1.8 },
            targeting: { cost: 100, effect: 'smart_targeting' }
        }
    },
    REPAIR_STATION: {
        name: 'Repair-Station',
        cost: 200,
        maxHealth: 300,
        range: 100,
        repairRate: 5, // HP per second
        healRate: 2, // Player HP per second
        maxUpgrades: 2,
        upgrades: {
            repairSpeed: { cost: 100, effect: 2.0 },
            healing: { cost: 150, effect: 2.5 }
        }
    }
    // ... weitere Konfigurationen
};
```

## User Experience Considerations

### UX-004.1: Intuitive Wirtschaft
- **Geld-Feedback:** Sofortige visuelle Anzeige bei Geld-Gewinn/Verlust
- **Kosten-Transparenz:** Klare Preisanzeigen für alle Käufe
- **Budget-Planung:** Spieler können zukünftige Käufe planen
- **Combo-Visualisierung:** Combo-Multiplikator wird deutlich angezeigt

### UX-004.2: Einfache Platzierung
- **Drag-and-Drop:** Intuitive Maus-Steuerung für Platzierung
- **Reichweiten-Vorschau:** Sichtbare Reichweiten-Kreise bei Platzierung
- **Kollisions-Feedback:** Rote/grüne Markierung für gültige Platzierung
- **Raster-Snapping:** Optionales Einrasten an unsichtbarem Raster

### UX-004.3: Strategische Übersicht
- **Minimap-Integration:** Verteidigungsanlagen auf Minimap sichtbar
- **Upgrade-Indikatoren:** Visuelle Markierung upgradbarer Anlagen
- **Effizienz-Anzeige:** Kill-Count und Effizienz pro Anlage
- **Wartungs-Alerts:** Warnung bei beschädigten Anlagen

## Testkriterien

### Funktionale Tests
- **Geld-System:** Korrekte Berechnung von Einnahmen und Ausgaben
- **Platzierung:** Alle Anlagen können korrekt platziert werden
- **Kampf-Verhalten:** Türme zielen und schießen korrekt
- **Upgrades:** Alle Upgrade-Effekte funktionieren
- **Balance:** Angemessenes Risk-Reward-Verhältnis

### Performance-Tests
- **Turret-Performance:** Keine FPS-Einbrüche bei vielen Anlagen
- **Pathfinding:** Anlagen blockieren Feind-Bewegung korrekt
- **Memory-Management:** Keine Speicherlecks durch Anlagen-System
- **UI-Responsivität:** Shop und Upgrade-Menüs reagieren flüssig

### Balance-Tests
- **Wirtschafts-Balance:** Angemessene Geld-Raten für alle Schwierigkeiten
- **Anlagen-Effizienz:** Alle Anlagen-Typen sind situativ nützlich
- **Upgrade-Wert:** Upgrades bieten spürbaren Nutzen
- **Progression:** Natürliche Progression von billig zu teuer

## Erfolgsmessung

### Quantitative Metriken
- **Shop-Nutzung:** 90%+ der Spieler nutzen das Shop-System
- **Anlagen-Vielfalt:** Durchschnittlich 3+ verschiedene Anlagen-Typen pro Spiel
- **Upgrade-Rate:** 60%+ der Anlagen werden mindestens einmal upgraded
- **Wirtschafts-Engagement:** Spieler geben 80%+ ihres Geldes aus

### Qualitative Metriken
- **Strategische Tiefe:** Verschiedene Verteidigungsstrategien entstehen
- **Langzeit-Planung:** Spieler planen mehrere Wellen im Voraus
- **Entscheidungs-Spannung:** Schwierige Entscheidungen zwischen Optionen
- **Progression-Gefühl:** Sichtbarer Fortschritt durch Anlagen-Aufbau

## Implementierungsplan

### Woche 1: Grundsystem
- [ ] EconomyManager und Geld-System implementieren
- [ ] Basis DefenseStructure-Klasse erstellen
- [ ] Einfache Turret-Typen (Gatling, Sniper)
- [ ] Grundlegendes Shop-Interface

### Woche 2: Erweiterung und Polish
- [ ] Erweiterte Anlagen-Typen und Spezial-Strukturen
- [ ] Upgrade-System implementieren
- [ ] Platzierungs-Vorschau und Validierung
- [ ] UI-Polish und Audio-Integration
- [ ] Balance-Testing und Feintuning

## Risiken und Mitigationen

### Risiko 1: Wirtschafts-Balance zu schwierig
- **Wahrscheinlichkeit:** Hoch
- **Auswirkung:** Mittel
- **Mitigation:** Extensive Playtests mit verschiedenen Strategien

### Risiko 2: UI-Komplexität überfordert Spieler
- **Wahrscheinlichkeit:** Mittel
- **Auswirkung:** Mittel
- **Mitigation:** Schrittweise Tutorial-Integration und intuitive Icons

### Risiko 3: Performance-Probleme bei vielen Anlagen
- **Wahrscheinlichkeit:** Niedrig
- **Auswirkung:** Hoch
- **Mitigation:** Effiziente Update-Algorithmen und Anlagen-Limits

## Abhängigkeiten
- Bestehende Entity-Systeme für Projektile
- UI-System für Shop-Interface
- Audio-System für Feedback-Sounds
- Collision-System für Platzierungs-Validierung

## Dokumentation
- [ ] Wirtschafts-Balance-Guide
- [ ] Anlagen-Design-Spezifikation
- [ ] Shop-UI-Dokumentation
- [ ] Player-Strategy-Guide für Verteidigungsaufbau
