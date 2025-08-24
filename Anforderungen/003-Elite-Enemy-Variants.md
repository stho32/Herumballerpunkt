# Anforderung 003: Elite Enemy Variants - Spezialisierte Gegnertypen

## Übersicht
**Priorität:** Hoch  
**Komplexität:** Niedrig-Mittel  
**Geschätzter Aufwand:** 1-2 Wochen  
**Kategorie:** Gameplay Enhancement - Combat Variety

## Feature-Beschreibung

### Gameplay-Konzept
Spezialisierte Elite-Gegner mit einzigartigen Fähigkeiten und Verhaltensmustern, die in höheren Wellen spawnen. Diese Elites erfordern spezifische Strategien und bieten wertvolle Belohnungen, wodurch das Kampfsystem deutlich abwechslungsreicher wird.

### Gameplay-Impact
- **Taktische Vielfalt:** Verschiedene Feinde erfordern verschiedene Strategien
- **Erhöhte Herausforderung:** Elites sind deutlich gefährlicher als normale Feinde
- **Belohnungssystem:** Bessere Drops motivieren zum Bekämpfen schwieriger Gegner
- **Visuelle Abwechslung:** Einzigartige Designs sorgen für frischen Content
- **Skill-Progression:** Spieler müssen neue Taktiken erlernen und meistern

### Elite-Varianten

#### Offensive Elites
1. **"Sniper"** (Fernkampf-Spezialist)
   - Lange Reichweite, hoher Schaden, langsame Feuerrate
   - Laser-Zielhilfe 2 Sekunden vor Schuss
   - Bevorzugt erhöhte Positionen und Distanz
   - Schwach im Nahkampf, flieht bei Annäherung

2. **"Berserker"** (Nahkampf-Spezialist)
   - Sehr schnell, hohe Gesundheit, Nahkampf-Angriffe
   - Wird schneller wenn beschädigt (Rage-Modus)
   - Durchbricht Wände und Hindernisse
   - Schwach gegen Kiting und Fernkampf

3. **"Bombardier"** (Explosiv-Spezialist)
   - Wirft Granaten mit Flächenschaden
   - Hinterlässt Explosionen beim Tod
   - Mittlere Reichweite, moderate Geschwindigkeit
   - Gefährlich in Gruppen, schwach einzeln

#### Defensive Elites
4. **"Guardian"** (Schild-Spezialist)
   - Trägt Energieschild, der Projektile blockiert
   - Schild regeneriert sich nach 3 Sekunden ohne Schaden
   - Beschützt andere Feinde aktiv
   - Schild hat Schwachpunkt auf der Rückseite

5. **"Healer"** (Support-Spezialist)
   - Heilt andere Feinde in der Nähe
   - Schwache eigene Kampfkraft
   - Teleportiert sich weg bei Gefahr
   - Prioritätsziel für strategische Spieler

#### Utility Elites
6. **"Summoner"** (Beschwörer)
   - Spawnt kleine Minions alle 8 Sekunden
   - Minions sind schwach aber zahlreich
   - Summoner selbst ist relativ schwach
   - Muss schnell eliminiert werden

7. **"Phantom"** (Stealth-Spezialist)
   - Wird periodisch unsichtbar (3 Sekunden)
   - Bewegt sich schneller während Unsichtbarkeit
   - Sichtbar durch Muzzle-Flash beim Schießen
   - Schwach aber schwer zu treffen

8. **"Juggernaut"** (Tank-Spezialist)
   - Extrem hohe Gesundheit, langsam
   - Immun gegen Knockback-Effekte
   - Verursacht Bodenschäden beim Gehen
   - Schwach gegen DoT und Kiting

## Funktionale Anforderungen

### FR-003.1: Elite-Spawn-System
- **Beschreibung:** Intelligentes Spawning von Elite-Gegnern basierend auf Spielfortschritt
- **Akzeptanzkriterien:**
  - Elites spawnen ab Welle 3 mit steigender Häufigkeit
  - 1 Elite pro 8-12 normale Feinde (wellenabhängig)
  - Boss-Wellen haben garantiert 2-3 Elites als Unterstützung
  - Elite-Typen werden basierend auf aktueller Spielsituation gewählt
  - Maximale Elite-Dichte: 30% aller Feinde

### FR-003.2: Spezialisierte KI-Verhalten
- **Beschreibung:** Einzigartige Verhaltensweisen für jeden Elite-Typ
- **Akzeptanzkriterien:**
  - Sniper: Sucht erhöhte Positionen, hält Distanz
  - Berserker: Aggressive Verfolgung, Rage-Mechanik
  - Guardian: Positioniert sich zwischen Spieler und anderen Feinden
  - Healer: Flieht bei Gefahr, priorisiert verletzte Verbündete
  - Summoner: Hält Distanz, spawnt kontinuierlich Minions
  - Phantom: Nutzt Stealth taktisch für Überraschungsangriffe
  - Juggernaut: Direkte Konfrontation, ignoriert Ablenkungen

### FR-003.3: Visuelle Unterscheidung
- **Beschreibung:** Eindeutige visuelle Kennzeichnung aller Elite-Typen
- **Akzeptanzkriterien:**
  - Einzigartige Farbschemata für jeden Elite-Typ
  - Spezielle Partikel-Effekte oder Auren
  - Größenunterschiede zu normalen Feinden
  - Charakteristische Waffen oder Ausrüstung
  - Elite-Marker über dem Kopf (Stern oder Krone)

### FR-003.4: Belohnungssystem
- **Beschreibung:** Verbesserte Drops und Belohnungen für Elite-Eliminierung
- **Akzeptanzkriterien:**
  - 3x höhere Punktzahl als normale Feinde
  - 50% Chance auf Power-Up-Drop
  - 25% Chance auf seltene Waffen-Upgrades
  - Garantierte Gesundheits-Pickups
  - Spezielle Partikel-Explosion bei Eliminierung

## Technische Anforderungen

### TR-003.1: Elite-Basis-Klasse
```javascript
class EliteEnemy extends Enemy {
    constructor(x, y, eliteType, level = 1) {
        super(x, y, level);
        this.eliteType = eliteType;
        this.config = ELITE_CONFIGS[eliteType];
        this.isElite = true;
        
        // Apply elite modifiers
        this.health *= this.config.healthMultiplier;
        this.maxHealth = this.health;
        this.damage *= this.config.damageMultiplier;
        this.speed *= this.config.speedMultiplier;
        this.radius *= this.config.sizeMultiplier;
        
        // Elite-specific properties
        this.specialAbilities = this.config.abilities;
        this.lastSpecialAttack = 0;
        this.specialCooldown = this.config.specialCooldown;
        this.eliteState = 'normal';
        
        // Visual properties
        this.glowColor = this.config.glowColor;
        this.particleTimer = 0;
    }
    
    update(targets, walls) {
        // Call parent update
        const bullets = super.update(targets, walls);
        
        // Elite-specific behavior
        this.updateEliteBehavior(targets, walls);
        this.updateSpecialAbilities(targets);
        this.updateVisualEffects();
        
        return bullets;
    }
    
    updateEliteBehavior(targets, walls) {
        // Override in subclasses
        switch(this.eliteType) {
            case 'SNIPER':
                this.updateSniperBehavior(targets, walls);
                break;
            case 'BERSERKER':
                this.updateBerserkerBehavior(targets);
                break;
            // ... other types
        }
    }
    
    takeDamage(amount) {
        super.takeDamage(amount);
        
        // Elite death effects
        if (this.health <= 0) {
            this.createEliteDeathEffect();
            this.dropEliteRewards();
        }
    }
}
```

### TR-003.2: Spezifische Elite-Implementierungen
```javascript
class SniperElite extends EliteEnemy {
    constructor(x, y, level) {
        super(x, y, 'SNIPER', level);
        this.aimingTarget = null;
        this.aimingTime = 0;
        this.requiredAimTime = 2000; // 2 seconds
        this.preferredDistance = 300;
        this.laserSight = null;
    }
    
    updateSniperBehavior(targets, walls) {
        const closestTarget = this.findClosestTarget(targets);
        if (!closestTarget) return;
        
        const distance = getDistance(this.x, this.y, closestTarget.x, closestTarget.y);
        
        if (distance < this.preferredDistance) {
            // Too close, retreat
            this.retreatFrom(closestTarget, walls);
        } else {
            // Good distance, aim and shoot
            this.aimAt(closestTarget);
        }
    }
    
    aimAt(target) {
        if (this.aimingTarget !== target) {
            this.aimingTarget = target;
            this.aimingTime = 0;
            this.createLaserSight(target);
        }
        
        this.aimingTime += 16; // Assuming 60 FPS
        
        if (this.aimingTime >= this.requiredAimTime) {
            this.fireSnipeShot(target);
            this.aimingTarget = null;
            this.aimingTime = 0;
            this.removeLaserSight();
        }
    }
    
    fireSnipeShot(target) {
        const angle = getAngle(this.x, this.y, target.x, target.y);
        return [{
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 25, // Fast bullet
            vy: Math.sin(angle) * 25,
            radius: 8,
            damage: this.damage * 3, // High damage
            isPlayer: false,
            color: '#ff4444',
            piercing: true // Goes through walls
        }];
    }
}

class BerserkerElite extends EliteEnemy {
    constructor(x, y, level) {
        super(x, y, 'BERSERKER', level);
        this.rageThreshold = 0.5; // Rage at 50% health
        this.isRaging = false;
        this.chargeTarget = null;
        this.chargeCooldown = 0;
    }
    
    updateBerserkerBehavior(targets) {
        // Check for rage mode
        if (!this.isRaging && this.health / this.maxHealth <= this.rageThreshold) {
            this.enterRageMode();
        }
        
        // Aggressive pursuit
        const closestTarget = this.findClosestTarget(targets);
        if (closestTarget) {
            this.chargeAt(closestTarget);
        }
    }
    
    enterRageMode() {
        this.isRaging = true;
        this.speed *= 1.5;
        this.damage *= 1.3;
        this.glowColor = '#ff0000';
        createParticles(this.x, this.y, '#ff0000', 20);
        playSound('berserker_rage', 0.4);
    }
    
    chargeAt(target) {
        const distance = getDistance(this.x, this.y, target.x, target.y);
        
        if (distance > 50 && this.chargeCooldown <= 0) {
            // Charge attack
            const angle = getAngle(this.x, this.y, target.x, target.y);
            this.vx = Math.cos(angle) * this.speed * 3;
            this.vy = Math.sin(angle) * this.speed * 3;
            this.chargeCooldown = 3000; // 3 second cooldown
            
            // Create charge effect
            createParticles(this.x, this.y, '#ffaa00', 15);
        }
        
        if (this.chargeCooldown > 0) {
            this.chargeCooldown -= 16;
        }
    }
}
```

### TR-003.3: Elite-Konfiguration
```javascript
const ELITE_CONFIGS = {
    SNIPER: {
        healthMultiplier: 0.8,
        damageMultiplier: 2.5,
        speedMultiplier: 0.7,
        sizeMultiplier: 1.1,
        glowColor: '#ff4444',
        abilities: ['laser_sight', 'piercing_shot'],
        specialCooldown: 3000,
        dropRate: {
            powerUp: 0.6,
            weaponUpgrade: 0.3,
            health: 0.8
        }
    },
    BERSERKER: {
        healthMultiplier: 1.8,
        damageMultiplier: 1.4,
        speedMultiplier: 1.3,
        sizeMultiplier: 1.2,
        glowColor: '#ff8800',
        abilities: ['rage_mode', 'charge_attack'],
        specialCooldown: 5000,
        dropRate: {
            powerUp: 0.5,
            weaponUpgrade: 0.2,
            health: 0.9
        }
    },
    GUARDIAN: {
        healthMultiplier: 1.5,
        damageMultiplier: 0.8,
        speedMultiplier: 0.8,
        sizeMultiplier: 1.3,
        glowColor: '#4444ff',
        abilities: ['energy_shield', 'protect_allies'],
        specialCooldown: 1000,
        dropRate: {
            powerUp: 0.4,
            weaponUpgrade: 0.4,
            health: 0.7
        }
    }
    // ... weitere Elite-Konfigurationen
};
```

## User Experience Considerations

### UX-003.1: Klare Identifikation
- **Visuelle Klarheit:** Elites sind sofort als besondere Bedrohung erkennbar
- **Farbkodierung:** Konsistente Farben für Elite-Kategorien
- **Audio-Cues:** Spezielle Sounds beim Spawnen und bei speziellen Angriffen
- **UI-Integration:** Elite-Marker und Gesundheitsbalken

### UX-003.2: Faire Herausforderung
- **Telegraphing:** Alle Elite-Angriffe haben klare Vorwarnungen
- **Counterplay:** Jeder Elite-Typ hat erkennbare Schwächen
- **Lernkurve:** Elites werden schrittweise eingeführt
- **Belohnung:** Angemessene Belohnungen für erhöhte Schwierigkeit

### UX-003.3: Strategische Tiefe
- **Prioritätsziele:** Spieler müssen Elite-Bedrohungen einschätzen
- **Taktische Anpassung:** Verschiedene Elites erfordern verschiedene Strategien
- **Kombinationseffekte:** Elites verstärken sich gegenseitig
- **Skill-Expression:** Erfahrene Spieler können Elites effizient bekämpfen

## Testkriterien

### Funktionale Tests
- **KI-Verhalten:** Alle Elite-Typen verhalten sich gemäß Spezifikation
- **Balance:** Elites sind herausfordernd aber fair
- **Performance:** Keine FPS-Einbrüche durch komplexe Elite-KI
- **Spawn-System:** Elites spawnen gemäß Wahrscheinlichkeiten
- **Belohnungen:** Drop-Raten funktionieren korrekt

### Balance-Tests
- **Schwierigkeitskurve:** Elites skalieren angemessen mit Wellen
- **Überlebbarkeit:** Durchschnittliche Überlebenszeit bleibt stabil
- **Belohnungs-Balance:** Risk-Reward-Verhältnis ist ausgewogen
- **Elite-Kombinationen:** Mehrere Elites gleichzeitig sind manageable

### Usability-Tests
- **Erkennbarkeit:** Spieler identifizieren Elite-Typen schnell
- **Strategieverständnis:** Spieler entwickeln angemessene Taktiken
- **Frustrationslevel:** Elites fühlen sich herausfordernd aber fair an
- **Lernkurve:** Neue Spieler verstehen Elite-Mechaniken

## Erfolgsmessung

### Quantitative Metriken
- **Elite-Eliminierung:** 70%+ der gespawnten Elites werden besiegt
- **Strategische Anpassung:** Spieler ändern Taktiken für verschiedene Elites
- **Belohnungsnutzung:** 80%+ der Elite-Drops werden eingesammelt
- **Performance:** Keine FPS-Reduktion durch Elite-System

### Qualitative Metriken
- **Kampfvielfalt:** Erhöhte Abwechslung im Kampfsystem
- **Strategische Tiefe:** Spieler entwickeln Elite-spezifische Strategien
- **Herausforderung:** Angemessene Schwierigkeit ohne Frustration
- **Wiederspielwert:** Verschiedene Elite-Kombinationen sorgen für Abwechslung

## Implementierungsplan

### Woche 1: Grundsystem und erste Elites
- [ ] EliteEnemy-Basis-Klasse implementieren
- [ ] Sniper und Berserker Elite erstellen
- [ ] Spawn-System für Elites integrieren
- [ ] Grundlegende visuelle Unterscheidung

### Woche 2: Erweiterte Elites und Polish
- [ ] Guardian, Healer und weitere Elite-Typen
- [ ] Spezielle Effekte und Animationen
- [ ] Belohnungssystem implementieren
- [ ] Balance-Testing und Feintuning
- [ ] Audio-Integration

## Risiken und Mitigationen

### Risiko 1: Überkomplexe KI führt zu Performance-Problemen
- **Wahrscheinlichkeit:** Niedrig
- **Auswirkung:** Mittel
- **Mitigation:** Einfache aber effektive KI-Algorithmen verwenden

### Risiko 2: Elites sind zu schwer oder zu leicht
- **Wahrscheinlichkeit:** Hoch
- **Auswirkung:** Mittel
- **Mitigation:** Extensive Playtests und iterative Balance-Anpassungen

### Risiko 3: Visuelle Verwirrung durch zu viele Elite-Typen
- **Wahrscheinlichkeit:** Mittel
- **Auswirkung:** Niedrig
- **Mitigation:** Klare Farbkodierung und schrittweise Einführung

## Abhängigkeiten
- Bestehende Enemy-Klasse (js/entities.js)
- KI-System für Pathfinding und Targeting
- Partikel-System für visuelle Effekte
- Audio-System für Elite-Sounds
- Pickup-System für verbesserte Belohnungen

## Dokumentation
- [ ] Elite-Design-Dokument mit allen Typen und Fähigkeiten
- [ ] KI-Verhalten-Spezifikation für jeden Elite-Typ
- [ ] Balance-Guide für Elite-Tuning
- [ ] Player-Guide für Elite-Strategien
