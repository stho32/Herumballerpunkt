# Anforderung 002: Environmental Hazards - Dynamische Umgebungsgefahren

## Übersicht
**Priorität:** Mittel  
**Komplexität:** Niedrig-Mittel  
**Geschätzter Aufwand:** 1-2 Wochen  
**Kategorie:** Gameplay Enhancement - Environmental Interaction

## Feature-Beschreibung

### Gameplay-Konzept
Dynamische Umgebungsgefahren, die das Schlachtfeld in unvorhersehbare Weise verändern. Diese Hazards spawnen periodisch und zwingen Spieler zu taktischen Anpassungen, während sie sowohl Bedrohung als auch strategische Möglichkeiten bieten.

### Gameplay-Impact
- **Taktische Komplexität:** Spieler müssen Positioning und Bewegung anpassen
- **Dynamisches Schlachtfeld:** Statische Strategien werden aufgebrochen
- **Risk-Reward-Mechanik:** Gefahren bieten auch strategische Vorteile
- **Erhöhte Spannung:** Unvorhersehbare Ereignisse steigern Adrenalin
- **Skill-Ceiling:** Erfahrene Spieler können Hazards zu ihrem Vorteil nutzen

### Hazard-Typen

#### Offensive Hazards
1. **"Laser-Grid"** (8 Sekunden aktiv, 15 Sekunden Cooldown)
   - Rote Laser-Linien durchkreuzen das Spielfeld
   - 3 Sekunden Vorwarnung mit blinkenden Linien
   - Sofortiger Tod bei Berührung für alle Einheiten
   - Spieler und Feinde müssen Lücken finden

2. **"Meteor-Schauer"** (12 Sekunden)
   - Zufällige Meteore fallen vom Himmel
   - 2 Sekunden Vorwarnung durch rote Zielkreise
   - Explosionsschaden in 50px Radius
   - 5-8 Meteore pro Schauer

3. **"Giftgas-Wolken"** (20 Sekunden)
   - Grüne Gaswolken breiten sich langsam aus
   - Kontinuierlicher Schaden für alle in der Wolke
   - Reduzierte Sichtweite in der Wolke
   - Wolken bewegen sich mit Windrichtung

#### Defensive/Utility Hazards
4. **"Elektro-Sturm"** (10 Sekunden)
   - Blitze schlagen zufällig ein
   - Temporäre Lähmung getroffener Einheiten (2 Sekunden)
   - Kann Elektronik (Turrets) deaktivieren
   - Blaue Elektro-Aura um betroffene Bereiche

5. **"Schwerkraft-Anomalie"** (15 Sekunden)
   - Bereiche mit veränderten Bewegungsregeln
   - Langsame Bewegung oder erhöhte Sprungkraft
   - Projektile werden abgelenkt
   - Violette Energie-Wirbel markieren Bereiche

6. **"Temporale Risse"** (6 Sekunden)
   - Bereiche mit verlangsamter Zeit
   - Alles in der Nähe bewegt sich 30% langsamer
   - Kann strategisch für Deckung genutzt werden
   - Goldene, schimmernde Verzerrungseffekte

## Funktionale Anforderungen

### FR-002.1: Hazard-Spawn-System
- **Beschreibung:** Intelligentes Spawning von Umgebungsgefahren
- **Akzeptanzkriterien:**
  - Hazards spawnen alle 45-90 Sekunden (schwierigkeitsabhängig)
  - Niemals mehr als 2 aktive Hazards gleichzeitig
  - Spawn-Positionen vermeiden Spieler-Nähe (100px Mindestabstand)
  - Höhere Wellen = häufigere und gefährlichere Hazards
  - Boss-Wellen haben garantierte Hazards für zusätzliche Herausforderung

### FR-002.2: Vorwarn-System
- **Beschreibung:** Klare Kommunikation bevorstehender Gefahren
- **Akzeptanzkriterien:**
  - 2-3 Sekunden Vorwarnzeit für alle Hazards
  - Visuelle Indikatoren (blinkende Bereiche, Zielkreise)
  - Audio-Warnsignale für verschiedene Hazard-Typen
  - Farbkodierung: Rot (tödlich), Orange (Schaden), Gelb (Behinderung)
  - Countdown-Timer für Hazard-Aktivierung

### FR-002.3: Kollisions- und Schadenssystem
- **Beschreibung:** Präzise Interaktion zwischen Hazards und Spielelementen
- **Akzeptanzkriterien:**
  - Pixel-genaue Kollisionserkennung für Laser und Projektile
  - Bereichsschaden für Explosionen und Gas
  - Unterschiedliche Schadenstypen (Sofort, DoT, Lähmung)
  - Hazards betreffen Spieler, Feinde und Strukturen gleichermaßen
  - Immunität während Respawn/Invincibility-Frames

### FR-002.4: Strategische Interaktion
- **Beschreibung:** Hazards als taktische Elemente nutzbar
- **Akzeptanzkriterien:**
  - Feinde können durch Hazards eliminiert werden
  - Spieler kann Feinde in Hazards locken
  - Temporäre Deckung durch bestimmte Hazards
  - Hazards können Projektile blockieren oder ablenken
  - Kombinationseffekte zwischen verschiedenen Hazards

## Technische Anforderungen

### TR-002.1: Hazard-Basis-Klasse
```javascript
class EnvironmentalHazard {
    constructor(type, x, y, config) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.config = config;
        this.state = 'warning'; // warning, active, fading
        this.timer = 0;
        this.warningDuration = config.warningTime;
        this.activeDuration = config.activeTime;
        this.affectedEntities = new Set();
    }
    
    update(entities) {
        this.timer += 16; // Assuming 60 FPS
        
        switch(this.state) {
            case 'warning':
                if (this.timer >= this.warningDuration) {
                    this.state = 'active';
                    this.timer = 0;
                    this.onActivate();
                }
                break;
            case 'active':
                this.updateActiveEffects(entities);
                if (this.timer >= this.activeDuration) {
                    this.state = 'fading';
                    this.onDeactivate();
                }
                break;
        }
    }
    
    checkCollision(entity) {
        // Override in subclasses
    }
    
    applyEffect(entity) {
        // Override in subclasses
    }
}
```

### TR-002.2: Spezifische Hazard-Implementierungen
```javascript
class LaserGrid extends EnvironmentalHazard {
    constructor(x, y) {
        super('laser_grid', x, y, HAZARD_CONFIGS.LASER_GRID);
        this.laserLines = this.generateLaserPattern();
    }
    
    generateLaserPattern() {
        // Generate random but fair laser pattern
        const lines = [];
        const spacing = 80;
        const offset = Math.random() * spacing;
        
        // Vertical lines
        for (let x = offset; x < canvas.width; x += spacing) {
            lines.push({
                x1: x, y1: 0,
                x2: x, y2: canvas.height,
                type: 'vertical'
            });
        }
        
        return lines;
    }
    
    checkCollision(entity) {
        if (this.state !== 'active') return false;
        
        return this.laserLines.some(line => {
            return this.lineCircleIntersection(line, entity);
        });
    }
}

class MeteorShower extends EnvironmentalHazard {
    constructor() {
        super('meteor_shower', 0, 0, HAZARD_CONFIGS.METEOR_SHOWER);
        this.meteors = [];
        this.generateMeteors();
    }
    
    generateMeteors() {
        const count = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            this.meteors.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                impactTime: 1000 + Math.random() * 2000,
                radius: 50,
                warned: false
            });
        }
    }
}
```

### TR-002.3: Hazard-Manager
```javascript
class HazardManager {
    constructor() {
        this.activeHazards = [];
        this.lastSpawn = 0;
        this.spawnInterval = 60000; // 1 minute base
        this.maxActiveHazards = 2;
    }
    
    update(gameState) {
        // Update existing hazards
        this.activeHazards = this.activeHazards.filter(hazard => {
            hazard.update(gameState.entities);
            return hazard.state !== 'finished';
        });
        
        // Spawn new hazards
        if (this.shouldSpawnHazard(gameState)) {
            this.spawnRandomHazard(gameState);
        }
    }
    
    shouldSpawnHazard(gameState) {
        const timeSinceLastSpawn = Date.now() - this.lastSpawn;
        const difficultyMultiplier = gameState.difficulty === 'hard' ? 0.7 : 
                                   gameState.difficulty === 'easy' ? 1.3 : 1.0;
        const adjustedInterval = this.spawnInterval * difficultyMultiplier;
        
        return timeSinceLastSpawn >= adjustedInterval && 
               this.activeHazards.length < this.maxActiveHazards;
    }
    
    spawnRandomHazard(gameState) {
        const hazardTypes = this.getAvailableHazards(gameState.wave);
        const selectedType = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
        
        const hazard = this.createHazard(selectedType);
        this.activeHazards.push(hazard);
        this.lastSpawn = Date.now();
        
        // Play warning sound
        playSound('hazard_warning', 0.3);
    }
}
```

## User Experience Considerations

### UX-002.1: Klare Kommunikation
- **Visuelle Klarheit:** Eindeutige Symbole und Farben für jeden Hazard-Typ
- **Audio-Design:** Charakteristische Sounds für Warnung und Aktivierung
- **Animation-Timing:** Smooth Übergänge zwischen Warn- und Aktivierungsphase
- **Kontrast:** Hazards sind auch bei intensivem Kampfgeschehen gut sichtbar

### UX-002.2: Fairness und Vorhersagbarkeit
- **Ausreichende Vorwarnzeit:** Mindestens 2 Sekunden für Reaktion
- **Sichere Bereiche:** Immer mindestens 30% des Spielfelds bleiben sicher
- **Konsistente Regeln:** Hazards verhalten sich immer gleich
- **Escape-Möglichkeiten:** Spieler ist nie komplett gefangen

### UX-002.3: Strategische Tiefe
- **Lernkurve:** Einfache Hazards zuerst, komplexere in höheren Wellen
- **Kombinationsmöglichkeiten:** Hazards können miteinander interagieren
- **Skill-Expression:** Erfahrene Spieler können Hazards zu ihrem Vorteil nutzen
- **Anpassungsfähigkeit:** Verschiedene Strategien für verschiedene Hazards

## Testkriterien

### Funktionale Tests
- **Spawn-Timing:** Hazards spawnen gemäß Zeitintervallen
- **Kollisionspräzision:** Exakte Schadenserkennung
- **Performance:** Keine FPS-Einbrüche durch komplexe Hazards
- **Fairness:** Spieler hat immer Überlebenschance
- **Interaktion:** Hazards beeinflussen alle Entitäten korrekt

### Balance-Tests
- **Schwierigkeitskurve:** Angemessene Herausforderung pro Welle
- **Überlebbarkeit:** Durchschnittliche Überlebensrate bleibt stabil
- **Strategische Vielfalt:** Verschiedene Hazards erfordern verschiedene Taktiken
- **Frustrationslevel:** Hazards fühlen sich fair und vermeidbar an

### Usability-Tests
- **Erkennbarkeit:** Spieler verstehen Hazard-Typen sofort
- **Reaktionszeit:** Ausreichend Zeit für angemessene Reaktion
- **Lernkurve:** Neue Spieler verstehen System schnell
- **Accessibility:** Hazards sind auch für Spieler mit Einschränkungen erkennbar

## Erfolgsmessung

### Quantitative Metriken
- **Hazard-Interaktion:** 80%+ der Hazards werden erfolgreich vermieden
- **Strategische Nutzung:** 30%+ der Spieler nutzen Hazards gegen Feinde
- **Performance:** Keine FPS-Reduktion >5% durch Hazard-System
- **Balance:** Durchschnittliche Überlebenszeit bleibt stabil (±10%)

### Qualitative Metriken
- **Spannung:** Erhöhte Aufregung und Engagement
- **Strategische Tiefe:** Spieler entwickeln Hazard-spezifische Taktiken
- **Fairness:** Hazards fühlen sich herausfordernd aber fair an
- **Wiederspielwert:** Verschiedene Hazard-Kombinationen sorgen für Abwechslung

## Implementierungsplan

### Woche 1: Grundsystem und einfache Hazards
- [ ] Hazard-Basis-Klasse und Manager implementieren
- [ ] Laser-Grid und Meteor-Schauer erstellen
- [ ] Grundlegende Vorwarn- und Aktivierungssysteme
- [ ] Basis-Kollisionserkennung und Schadenssystem

### Woche 2: Erweiterte Hazards und Polish
- [ ] Giftgas, Elektro-Sturm und weitere Hazards
- [ ] Erweiterte visuelle Effekte und Animationen
- [ ] Audio-Integration und Sound-Design
- [ ] Balance-Testing und Feintuning
- [ ] Integration mit bestehendem Gameplay

## Risiken und Mitigationen

### Risiko 1: Frustration durch unfaire Hazards
- **Wahrscheinlichkeit:** Mittel
- **Auswirkung:** Hoch
- **Mitigation:** Extensive Playtests und großzügige Vorwarnzeiten

### Risiko 2: Performance-Impact durch komplexe Effekte
- **Wahrscheinlichkeit:** Niedrig
- **Auswirkung:** Mittel
- **Mitigation:** Optimierte Rendering-Algorithmen und LOD-System

### Risiko 3: Gameplay-Unterbrechung
- **Wahrscheinlichkeit:** Mittel
- **Auswirkung:** Mittel
- **Mitigation:** Hazards ergänzen statt ersetzen bestehende Mechaniken

## Abhängigkeiten
- Bestehende Kollisionssysteme (js/utils.js)
- Partikel-System für visuelle Effekte
- Audio-System für Warnungen und Effekte
- Renderer für Hazard-Darstellung

## Dokumentation
- [ ] Hazard-Design-Dokument mit allen Typen und Effekten
- [ ] Balance-Guide für Hazard-Tuning
- [ ] Integration-Guide für neue Hazard-Typen
- [ ] Player-Guide für Hazard-Strategien
