// Audio System - Simplified and more reliable
let audioContext = null;
let soundEnabled = true;

// Initialize audio context on first user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created, state:', audioContext.state);
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed');
        });
    }
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('soundToggle');
    icon.textContent = soundEnabled ? '🔊' : '🔇';
    
    // Initialize audio on toggle if needed
    if (soundEnabled && !audioContext) {
        initAudio();
    }
}

// Simple sound generator using oscillator
function playSound(type, volume = 0.3) {
    if (!soundEnabled || !audioContext) return;
    
    try {
        // Make sure audio context is running
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Add a compressor to prevent clipping
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
        compressor.knee.setValueAtTime(40, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(audioContext.destination);
        
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        
        // Start oscillator FIRST
        oscillator.start(now);
        
        // Then schedule parameters and stop
        switch(type) {
            case 'shoot':
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.stop(now + 0.1);
                break;
                
            case 'explosion':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(100, now);
                oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.stop(now + 0.3);
                break;
                
            case 'hit':
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                oscillator.stop(now + 0.05);
                break;
                
            case 'pickup':
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.stop(now + 0.1);
                break;
                
            case 'heal':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.stop(now + 0.2);
                break;
                
            case 'capture':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.linearRampToValueAtTime(400, now + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.stop(now + 0.3);
                break;
                
            case 'build':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.linearRampToValueAtTime(250, now + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.stop(now + 0.2);
                break;
                
            case 'laser':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(1000, now);
                oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.1);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.stop(now + 0.1);
                break;
                
            case 'wave':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.5);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.stop(now + 0.5);
                break;
                
            default:
                // Default sound for unknown types
                oscillator.frequency.setValueAtTime(440, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.stop(now + 0.1);
        }
        
        // Log for debugging
        console.log(`Playing sound: ${type} at volume ${volume}`);
    } catch (e) {
        console.error('Audio error:', e);
    }
}

// Hintergrund-Musik Generator
let musicOscillators = [];
let musicPlaying = false;
let musicInterval = null;

function startMusic() {
    if (musicPlaying || !soundEnabled) return;
    musicPlaying = true;
    
    try {
        // Bass-Linie
        const bassOsc = audioContext.createOscillator();
        const bassGain = audioContext.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(55, audioContext.currentTime);
        bassGain.gain.setValueAtTime(0.05, audioContext.currentTime);
        bassOsc.connect(bassGain);
        bassGain.connect(audioContext.destination);
        bassOsc.start();
        musicOscillators.push({osc: bassOsc, gain: bassGain});
        
        // Melodie
        const melodyOsc = audioContext.createOscillator();
        const melodyGain = audioContext.createGain();
        melodyOsc.type = 'square';
        melodyGain.gain.setValueAtTime(0.02, audioContext.currentTime);
        melodyOsc.connect(melodyGain);
        melodyGain.connect(audioContext.destination);
        melodyOsc.start();
        musicOscillators.push({osc: melodyOsc, gain: melodyGain});
        
        // Melodie-Sequenz
        const notes = [110, 138.59, 164.81, 138.59];
        let noteIndex = 0;
        
        musicInterval = setInterval(() => {
            if (musicPlaying) {
                melodyOsc.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
                noteIndex = (noteIndex + 1) % notes.length;
            }
        }, 500);
    } catch (e) {
        console.warn('Music error:', e);
    }
}

function stopMusic() {
    musicPlaying = false;
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
    musicOscillators.forEach(({osc, gain}) => {
        try {
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            osc.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.warn('Stop music error:', e);
        }
    });
    musicOscillators = [];
}