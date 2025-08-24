# Anforderung 001: Power-Up System - Temporäre Kampfverstärkungen

## Übersicht
**Priorität:** Hoch  
**Komplexität:** Niedrig  
**Geschätzter Aufwand:** 1-2 Wochen  
**Kategorie:** Gameplay Enhancement - Combat Mechanics

## Feature-Beschreibung

### Gameplay-Konzept
Ein temporäres Power-Up-System, das dem Spieler zeitlich begrenzte Superkräfte verleiht. Power-Ups spawnen zufällig nach dem Besiegen von Feinden oder bei besonderen Ereignissen und bieten dem Spieler strategische Entscheidungen über den optimalen Einsatzzeitpunkt.

### Gameplay-Impact
- **Strategische Tiefe:** Spieler müssen entscheiden, wann sie Power-Ups einsetzen
- **Momentum-Verstärkung:** Erfolgreiche Spieler werden mit mächtigen temporären Fähigkeiten belohnt
- **Visuelle Spektakel:** Beeindruckende Effekte steigern die Spielfreude
- **Comeback-Mechanik:** Schwächere Spieler erhalten Chancen auf mächtige Power-Ups
- **Wiederspielwert:** Verschiedene Power-Up-Kombinationen sorgen für Abwechslung

### Power-Up-Typen

#### Kampf-Power-Ups
1. **"Berserker-Modus"** (15 Sekunden)
   - Feuerrate +200%, Schaden +50%
   - Spieler wird rot und pulsiert
   - Unendliche Munition während der Dauer

2. **"Zeitlupe"** (10 Sekunden)
   - Alle Feinde und Projektile bewegen sich 50% langsamer
   - Spieler behält normale Geschwindigkeit
   - Matrix-ähnlicher visueller Effekt

3. **"Schild-Generator"** (20 Sekunden)
   - Absorbiert die nächsten 5 Treffer komplett
   - Blaue Energie-Aura um den Spieler
   - Schild-Treffer erzeugen Funken-Effekte

#### Utility-Power-Ups
4. **"Magnetfeld"** (12 Sekunden)
   - Alle Pickups werden automatisch angezogen
   - Erhöhte Pickup-Spawn-Rate
   - Goldene Partikel-Spirale um den Spieler

5. **"Geister-Modus"** (8 Sekunden)
   - Spieler kann durch Wände und Feinde gehen
   - 50% Transparenz
   - Hinterlässt Geister-Spur

6. **"Explosions-Aura"** (15 Sekunden)
   - Feinde explodieren beim Tod und verursachen Flächenschaden
   - Kettenreaktionen möglich
   - Orangene Energie-Ringe um zerstörte Feinde

## Funktionale Anforderungen

### FR-001.1: Power-Up-Spawn-System
- **Beschreibung:** Zufälliges Spawnen von Power-Ups basierend auf Spielereignissen
- **Akzeptanzkriterien:**
  - 15% Chance auf Power-Up-Drop bei Feind-Elimination
  - 50% Chance bei Elite-Feind-Elimination
  - 100% Chance bei Boss-Elimination
  - Garantiertes Power-Up alle 3 Wellen ohne Power-Up
  - Maximal 2 Power-Ups gleichzeitig auf dem Bildschirm

### FR-001.2: Power-Up-Aktivierung
- **Beschreibung:** Intuitive Aktivierung und Verwaltung von Power-Ups
- **Akzeptanzkriterien:**
  - Automatische Aktivierung beim Einsammeln
  - Sichtbare Countdown-Anzeige für aktive Power-Ups
  - Stapelbare Power-Ups (verschiedene Typen gleichzeitig)
  - Nicht-stapelbare Power-Ups (gleicher Typ verlängert Dauer)
  - Audio-visuelles Feedback bei Aktivierung und Ablauf

### FR-001.3: Visuelle Effekte
- **Beschreibung:** Beeindruckende visuelle Darstellung aller Power-Up-Effekte
- **Akzeptanzkriterien:**
  - Einzigartige Partikel-Effekte für jeden Power-Up-Typ
  - Spieler-Aura während aktiver Power-Ups
  - Screen-Shake bei mächtigen Power-Ups
  - Farbige Bildschirm-Overlays für Zeitlupe und Berserker
  - Smooth Fade-In/Fade-Out-Animationen

### FR-001.4: Balance-System
- **Beschreibung:** Ausgewogene Power-Up-Verteilung und -Stärke
- **Akzeptanzkriterien:**
  - Seltenere Power-Ups sind mächtiger
  - Cooldown-System verhindert Power-Up-Spam
  - Schwierigkeitsgrad beeinflusst Power-Up-Häufigkeit
  - Power-Up-Stärke skaliert mit Spieler-Level
  - Anti-Frustrations-Mechanik bei langen Durststrecken

## Technische Anforderungen

### TR-001.1: PowerUp-Klasse
```javascript
class PowerUp {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.lifetime = 15000; // 15 Sekunden bis Despawn
        this.created = Date.now();
        this.rotation = 0;
        this.pulseTimer = 0;
        this.config = POWER_UP_CONFIGS[type];
    }
    
    update() {
        this.rotation += 0.05;
        this.pulseTimer += 0.1;
        return Date.now() - this.created < this.lifetime;
    }
    
    render(ctx) {
        // Pulsierender Glow-Effekt
        // Rotierendes Icon
        // Partikel-Trail
    }
}
```

### TR-001.2: PowerUpManager
```javascript
class PowerUpManager {
    constructor() {
        this.activePowerUps = new Map();
        this.spawnedPowerUps = [];
        this.lastSpawn = 0;
        this.spawnCooldown = 5000;
    }
    
    spawnPowerUp(x, y, forceType = null) {
        const type = forceType || this.selectRandomType();
        const powerUp = new PowerUp(type, x, y);
        this.spawnedPowerUps.push(powerUp);
    }
    
    activatePowerUp(type, player) {
        const config = POWER_UP_CONFIGS[type];
        this.activePowerUps.set(type, {
            startTime: Date.now(),
            duration: config.duration,
            config: config
        });
        this.applyPowerUpEffects(type, player);
    }
    
    update(player) {
        this.updateActivePowerUps(player);
        this.updateSpawnedPowerUps();
    }
}
```

### TR-001.3: Power-Up-Konfiguration
```javascript
const POWER_UP_CONFIGS = {
    BERSERKER: {
        name: 'Berserker',
        duration: 15000,
        rarity: 'common',
        color: '#ff4444',
        effects: {
            fireRateMultiplier: 3.0,
            damageMultiplier: 1.5,
            infiniteAmmo: true
        }
    },
    BULLET_TIME: {
        name: 'Zeitlupe',
        duration: 10000,
        rarity: 'rare',
        color: '#44ffff',
        effects: {
            enemySpeedMultiplier: 0.5,
            bulletSpeedMultiplier: 0.5
        }
    },
    SHIELD: {
        name: 'Schild',
        duration: 20000,
        rarity: 'common',
        color: '#4444ff',
        effects: {
            hitAbsorption: 5,
            shieldAura: true
        }
    }
    // ... weitere Power-Ups
};
```

## User Experience Considerations

### UX-001: Intuitive Erkennung
- **Power-Up-Icons:** Eindeutige, leicht erkennbare Symbole
- **Farbkodierung:** Konsistente Farben für Power-Up-Kategorien
- **Größe und Animation:** Gut sichtbare, animierte Power-Ups
- **Pickup-Feedback:** Sofortiges visuelles und auditives Feedback

### UX-002: Status-Information
- **HUD-Integration:** Power-Up-Status im bestehenden Interface
- **Countdown-Timer:** Verbleibende Zeit für aktive Power-Ups
- **Stacking-Anzeige:** Mehrere aktive Power-Ups übersichtlich dargestellt
- **Ablauf-Warnung:** Warnung 3 Sekunden vor Power-Up-Ende

### UX-003: Accessibility
- **Farbblindheit:** Alternative Erkennungsmerkmale neben Farben
- **Audio-Cues:** Eindeutige Sounds für verschiedene Power-Up-Typen
- **Kontrast:** Hoher Kontrast für bessere Sichtbarkeit
- **Größenanpassung:** Skalierbare Power-Up-Icons

## Testkriterien

### Funktionale Tests
- **Spawn-Mechanik:** Power-Ups spawnen gemäß Wahrscheinlichkeiten
- **Aktivierung:** Alle Power-Up-Effekte funktionieren korrekt
- **Stacking:** Mehrere Power-Ups interagieren richtig
- **Timing:** Dauer und Cooldowns werden eingehalten
- **Balance:** Keine übermächtigen Kombinationen

### Performance-Tests
- **Partikel-Performance:** Keine FPS-Einbrüche durch Effekte
- **Memory-Management:** Keine Speicherlecks durch Power-Up-Objekte
- **Update-Effizienz:** Effiziente Verwaltung aktiver Power-Ups
- **Rendering-Optimierung:** Optimierte Darstellung von Effekten

### Usability-Tests
- **Erkennbarkeit:** Spieler erkennen Power-Up-Typen sofort
- **Verständlichkeit:** Effekte sind intuitiv verständlich
- **Feedback-Qualität:** Angemessenes Feedback für alle Aktionen
- **Interface-Integration:** Nahtlose HUD-Integration

## Erfolgsmessung

### Quantitative Metriken
- **Pickup-Rate:** 90%+ der gespawnten Power-Ups werden eingesammelt
- **Engagement:** +25% längere Spielsitzungen
- **Wiederspielwert:** +40% Spiele pro Spieler
- **Performance:** Keine FPS-Reduktion durch Power-Up-System

### Qualitative Metriken
- **Spielspaß:** Erhöhte Spielfreude durch spektakuläre Momente
- **Strategische Tiefe:** Spieler entwickeln Power-Up-Strategien
- **Momentum:** Verstärkte "Flow"-Momente im Gameplay
- **Fairness:** Ausgewogenes Risk-Reward-Verhältnis

## Implementierungsplan

### Woche 1: Grundsystem
- [ ] PowerUp und PowerUpManager Klassen implementieren
- [ ] Basis-Spawn-Mechanik erstellen
- [ ] Einfache Power-Up-Typen (Berserker, Schild)
- [ ] Grundlegende visuelle Effekte

### Woche 2: Erweiterung und Polish
- [ ] Erweiterte Power-Up-Typen (Zeitlupe, Magnetfeld, etc.)
- [ ] Komplexe Partikel-Effekte und Animationen
- [ ] HUD-Integration und Status-Anzeigen
- [ ] Audio-Integration und Sound-Design
- [ ] Balance-Testing und Feintuning

## Risiken und Mitigationen

### Risiko 1: Performance-Impact durch Effekte
- **Wahrscheinlichkeit:** Mittel
- **Auswirkung:** Mittel
- **Mitigation:** Effekt-Pooling und LOD-System für Partikel

### Risiko 2: Gameplay-Balance-Probleme
- **Wahrscheinlichkeit:** Hoch
- **Auswirkung:** Mittel
- **Mitigation:** Extensive Playtests und iterative Balance-Anpassungen

### Risiko 3: UI-Überlastung
- **Wahrscheinlichkeit:** Niedrig
- **Auswirkung:** Niedrig
- **Mitigation:** Minimalistisches Design und optionale Anzeigen

## Abhängigkeiten
- Bestehende Partikel-System (js/utils.js)
- Audio-System (js/audio.js)
- Pickup-System (js/game.js)
- Renderer-System (js/renderer.js)

## Dokumentation
- [ ] Power-Up-Design-Dokument mit allen Effekten
- [ ] Balance-Guide für Power-Up-Tuning
- [ ] Integration-Guide für neue Power-Up-Typen
- [ ] Player-Guide für Power-Up-Strategien
