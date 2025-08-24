/**
 * Audio Manager - Handles all audio operations
 * Manages sound effects, music, and audio context with Web Audio API
 */
export class AudioManager {
    constructor(gameConfig, eventBus) {
        this.gameConfig = gameConfig;
        this.eventBus = eventBus;
        
        this.isInitialized = false;
        this.audioContext = null;
        this.masterGain = null;
        
        // Audio categories with individual gain nodes
        this.categories = new Map();
        
        // Sound pools for efficient audio management
        this.soundPools = new Map();
        
        // Currently playing sounds
        this.playingSounds = new Set();
        
        // Audio buffers cache
        this.audioBuffers = new Map();
        
        // Music system
        this.currentMusic = null;
        this.musicGain = null;
        
        // Audio settings
        this.enabled = true;
        this.masterVolume = 1.0;
        
        this.setupEventListeners();
    }

    /**
     * Initialize the audio manager
     */
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.gameConfig.get('audio.audioContext.sampleRate', 44100),
                latencyHint: this.gameConfig.get('audio.audioContext.latencyHint', 'interactive')
            });

            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            // Setup audio categories
            this.setupAudioCategories();
            
            // Setup sound pools
            this.setupSoundPools();
            
            // Load audio settings from config
            this.loadAudioSettings();
            
            this.isInitialized = true;
            this.eventBus.emit('audioManager:initialized');
            
            console.log('AudioManager initialized');
            
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
            this.enabled = false;
            throw error;
        }
    }

    /**
     * Update audio manager
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.enabled) return;

        // Resume audio context if suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Clean up finished sounds
        this.cleanupFinishedSounds();
        
        // Update music if needed
        this.updateMusic(deltaTime);
    }

    /**
     * Setup audio categories with gain nodes
     */
    setupAudioCategories() {
        const categoryConfigs = this.gameConfig.get('audio.soundCategories', {});
        
        for (const [categoryName, config] of Object.entries(categoryConfigs)) {
            const gainNode = this.audioContext.createGain();
            gainNode.connect(this.masterGain);
            gainNode.gain.value = config.volume || 1.0;
            
            this.categories.set(categoryName, {
                gainNode,
                volume: config.volume || 1.0,
                muted: config.muted || false,
                originalVolume: config.volume || 1.0
            });
        }
    }

    /**
     * Setup sound pools for efficient audio management
     */
    setupSoundPools() {
        const poolConfigs = this.gameConfig.get('audio.soundPools', {});
        
        for (const [soundName, config] of Object.entries(poolConfigs)) {
            this.soundPools.set(soundName, {
                maxInstances: config.maxInstances || 5,
                category: config.category || 'sfx',
                instances: [],
                activeCount: 0
            });
        }
    }

    /**
     * Load audio settings from configuration
     */
    loadAudioSettings() {
        this.enabled = this.gameConfig.get('audio.enableAudio', true);
        this.masterVolume = this.gameConfig.get('audio.masterVolume', 1.0);
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound
     * @param {number} volume - Volume (0-1)
     * @param {number} pitch - Pitch multiplier (default 1.0)
     * @param {boolean} loop - Whether to loop the sound
     * @returns {Object|null} Sound instance or null if failed
     */
    playSound(soundName, volume = 1.0, pitch = 1.0, loop = false) {
        if (!this.isInitialized || !this.enabled) return null;

        try {
            // Get or create sound pool
            let pool = this.soundPools.get(soundName);
            if (!pool) {
                pool = {
                    maxInstances: 5,
                    category: 'sfx',
                    instances: [],
                    activeCount: 0
                };
                this.soundPools.set(soundName, pool);
            }

            // Check if we can play another instance
            if (pool.activeCount >= pool.maxInstances) {
                // Stop oldest instance
                const oldestInstance = pool.instances.shift();
                if (oldestInstance && oldestInstance.source) {
                    oldestInstance.source.stop();
                    pool.activeCount--;
                }
            }

            // Create audio buffer source
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            // Get audio buffer (would be loaded from file in real implementation)
            const buffer = this.getAudioBuffer(soundName);
            if (!buffer) {
                console.warn(`Audio buffer not found for sound: ${soundName}`);
                return null;
            }

            source.buffer = buffer;
            source.loop = loop;
            source.playbackRate.value = pitch;

            // Connect audio graph
            source.connect(gainNode);
            
            // Connect to category gain node
            const category = this.categories.get(pool.category);
            if (category) {
                gainNode.connect(category.gainNode);
            } else {
                gainNode.connect(this.masterGain);
            }

            // Set volume
            gainNode.gain.value = volume;

            // Create sound instance
            const soundInstance = {
                source,
                gainNode,
                soundName,
                startTime: this.audioContext.currentTime,
                volume,
                pitch,
                loop,
                category: pool.category,
                finished: false
            };

            // Handle sound end
            source.onended = () => {
                this.handleSoundEnd(soundInstance, pool);
            };

            // Start playing
            source.start();
            
            // Add to tracking
            pool.instances.push(soundInstance);
            pool.activeCount++;
            this.playingSounds.add(soundInstance);

            this.eventBus.emit('audio:soundPlayed', { soundName, volume, pitch, loop });
            
            return soundInstance;

        } catch (error) {
            console.error(`Failed to play sound ${soundName}:`, error);
            return null;
        }
    }

    /**
     * Stop a sound instance
     * @param {Object} soundInstance - Sound instance to stop
     */
    stopSound(soundInstance) {
        if (!soundInstance || soundInstance.finished) return;

        try {
            if (soundInstance.source) {
                soundInstance.source.stop();
            }
        } catch (error) {
            console.error('Error stopping sound:', error);
        }
    }

    /**
     * Stop all sounds in a category
     * @param {string} category - Category name
     */
    stopCategory(category) {
        for (const soundInstance of this.playingSounds) {
            if (soundInstance.category === category) {
                this.stopSound(soundInstance);
            }
        }
    }

    /**
     * Stop all sounds
     */
    stopAllSounds() {
        for (const soundInstance of this.playingSounds) {
            this.stopSound(soundInstance);
        }
    }

    /**
     * Set volume for a category
     * @param {string} category - Category name
     * @param {number} volume - Volume (0-1)
     */
    setCategoryVolume(category, volume) {
        const categoryData = this.categories.get(category);
        if (categoryData) {
            categoryData.volume = volume;
            categoryData.gainNode.gain.value = categoryData.muted ? 0 : volume;
            
            this.eventBus.emit('audio:categoryVolumeChanged', { category, volume });
        }
    }

    /**
     * Mute/unmute a category
     * @param {string} category - Category name
     * @param {boolean} muted - Whether to mute
     */
    setCategoryMuted(category, muted) {
        const categoryData = this.categories.get(category);
        if (categoryData) {
            categoryData.muted = muted;
            categoryData.gainNode.gain.value = muted ? 0 : categoryData.volume;
            
            this.eventBus.emit('audio:categoryMutedChanged', { category, muted });
        }
    }

    /**
     * Set master volume
     * @param {number} volume - Master volume (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
        
        this.eventBus.emit('audio:masterVolumeChanged', { volume: this.masterVolume });
    }

    /**
     * Enable/disable audio
     * @param {boolean} enabled - Whether audio is enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            this.stopAllSounds();
        }
        
        this.eventBus.emit('audio:enabledChanged', { enabled });
    }

    /**
     * Get audio buffer for a sound (placeholder - would load from files)
     * @param {string} soundName - Sound name
     * @returns {AudioBuffer|null} Audio buffer
     */
    getAudioBuffer(soundName) {
        // In a real implementation, this would load audio files
        // For now, return a cached buffer or create a simple tone
        let buffer = this.audioBuffers.get(soundName);
        
        if (!buffer) {
            // Create a simple tone as placeholder
            buffer = this.createToneBuffer(soundName);
            this.audioBuffers.set(soundName, buffer);
        }
        
        return buffer;
    }

    /**
     * Create a simple tone buffer for testing (placeholder)
     * @param {string} soundName - Sound name
     * @returns {AudioBuffer} Generated audio buffer
     */
    createToneBuffer(soundName) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.2; // 200ms
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate different tones for different sounds
        let frequency = 440; // A4
        switch (soundName) {
            case 'shoot': frequency = 800; break;
            case 'explosion': frequency = 200; break;
            case 'pickup': frequency = 600; break;
            case 'hit': frequency = 300; break;
            case 'reload': frequency = 400; break;
            default: frequency = 440;
        }
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 5);
        }
        
        return buffer;
    }

    /**
     * Handle sound end
     * @param {Object} soundInstance - Sound instance
     * @param {Object} pool - Sound pool
     */
    handleSoundEnd(soundInstance, pool) {
        soundInstance.finished = true;
        
        // Remove from pool
        const index = pool.instances.indexOf(soundInstance);
        if (index > -1) {
            pool.instances.splice(index, 1);
            pool.activeCount--;
        }
        
        // Remove from playing sounds
        this.playingSounds.delete(soundInstance);
        
        this.eventBus.emit('audio:soundEnded', { soundName: soundInstance.soundName });
    }

    /**
     * Clean up finished sounds
     */
    cleanupFinishedSounds() {
        const finishedSounds = Array.from(this.playingSounds).filter(sound => sound.finished);
        
        for (const sound of finishedSounds) {
            this.playingSounds.delete(sound);
        }
    }

    /**
     * Update music system
     * @param {number} deltaTime - Time since last frame
     */
    updateMusic(deltaTime) {
        // Music system updates would go here
        // For now, this is a placeholder
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for configuration changes
        this.gameConfig.onChange('audio.masterVolume', (volume) => {
            this.setMasterVolume(volume);
        });

        this.gameConfig.onChange('audio.enableAudio', (enabled) => {
            this.setEnabled(enabled);
        });

        // Listen for user interaction to resume audio context
        const resumeAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        };

        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
    }

    /**
     * Get audio statistics
     * @returns {Object} Audio statistics
     */
    getAudioStats() {
        return {
            enabled: this.enabled,
            masterVolume: this.masterVolume,
            playingSounds: this.playingSounds.size,
            audioContextState: this.audioContext ? this.audioContext.state : 'not initialized',
            categories: Array.from(this.categories.entries()).map(([name, data]) => ({
                name,
                volume: data.volume,
                muted: data.muted
            }))
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Stop all sounds
        this.stopAllSounds();
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Clear data
        this.categories.clear();
        this.soundPools.clear();
        this.playingSounds.clear();
        this.audioBuffers.clear();
        
        this.isInitialized = false;
        this.eventBus.emit('audioManager:destroyed');
        console.log('AudioManager destroyed');
    }
}
