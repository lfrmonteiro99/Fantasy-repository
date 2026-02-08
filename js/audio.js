// Audio System for Naruto Action RPG

const AudioManager = {
    sounds: {},
    enabled: true,
    volume: 1.0,
    initialized: false,

    init() {
        if (this.initialized) return;

        // Initialize Web Audio API for beep generation
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }

        // Define sound effects (using Web Audio API or simple Audio elements)
        this.soundDefinitions = {
            // UI sounds
            'ui_click': { src: 'assets/audio/ui_click.mp3', volume: 0.5 },
            'ui_hover': { src: 'assets/audio/ui_hover.mp3', volume: 0.3 },
            'ui_error': { src: 'assets/audio/ui_error.mp3', volume: 0.6 },

            // Character sounds
            'naruto_attack': { src: 'assets/audio/naruto_attack.mp3', volume: 0.7 },
            'naruto_hurt': { src: 'assets/audio/naruto_hurt.mp3', volume: 0.6 },
            'naruto_die': { src: 'assets/audio/naruto_die.mp3', volume: 0.7 },

            // Ability sounds
            'shadow_clone': { src: 'assets/audio/shadow_clone.mp3', volume: 0.8 },
            'rasengan': { src: 'assets/audio/rasengan.mp3', volume: 0.9 },
            'kunai_throw': { src: 'assets/audio/kunai_throw.mp3', volume: 0.6 },
            'nine_tails': { src: 'assets/audio/nine_tails.mp3', volume: 1.0 },

            // Enemy sounds
            'enemy_hit': { src: 'assets/audio/enemy_hit.mp3', volume: 0.5 },
            'enemy_die': { src: 'assets/audio/enemy_die.mp3', volume: 0.6 },
            'boss_hit': { src: 'assets/audio/boss_hit.mp3', volume: 0.7 },

            // Misc
            'level_up': { src: 'assets/audio/level_up.mp3', volume: 0.8 },
            'item_pickup': { src: 'assets/audio/item_pickup.mp3', volume: 0.5 },
            'item_equip': { src: 'assets/audio/item_equip.mp3', volume: 0.5 },
            'ability_unlock': { src: 'assets/audio/ability_unlock.mp3', volume: 0.7 },
            'chakra_low': { src: 'assets/audio/chakra_low.mp3', volume: 0.6 }
        };

        this.initialized = true;
    },

    // Preload sounds (optional, for better performance)
    async preload(soundNames = []) {
        const promises = soundNames.map(name => this.loadSound(name));
        return Promise.all(promises);
    },

    loadSound(name) {
        return new Promise((resolve, reject) => {
            const def = this.soundDefinitions[name];
            if (!def) {
                console.warn(`Sound "${name}" not defined`);
                resolve();
                return;
            }

            // For now, we'll use a simple approach with Audio elements
            // In production, you'd use actual audio files
            this.sounds[name] = {
                volume: def.volume,
                instances: [],
                loaded: true // Mark as loaded even if file doesn't exist (for demo)
            };

            resolve();
        });
    },

    // Generate beep sound (placeholder for missing audio files)
    playBeep(frequency = 440, duration = 0.1, vol = 0.3) {
        if (!this.audioContext || !this.enabled) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(vol * this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            // Silently fail
        }
    },

    play(name, options = {}) {
        if (!this.enabled) return;

        // Generate placeholder beep based on sound type
        const beepFrequencies = {
            'ui_click': 800,
            'ui_error': 200,
            'naruto_attack': 600,
            'naruto_hurt': 400,
            'shadow_clone': 700,
            'rasengan': 900,
            'kunai_throw': 1000,
            'nine_tails': 500,
            'enemy_hit': 550,
            'enemy_die': 300,
            'boss_hit': 450,
            'level_up': 1200,
            'item_pickup': 850,
            'item_equip': 750
        };

        const freq = beepFrequencies[name] || 440;
        this.playBeep(freq, 0.1, 0.2);

        const {
            volume = 1.0,
            loop = false,
            pitch = 1.0
        } = options;

        // For demo purposes, we'll just log
        // In production, you'd create and play an Audio instance
        if (this.soundDefinitions[name]) {
            // console.log(`Playing sound: ${name}`);

            // Simulate playing (would be actual audio in production)
            this.createAudioInstance(name, volume, loop, pitch);
        }
    },

    createAudioInstance(name, volume, loop, pitch) {
        // In a real implementation, this would create an Audio object
        // For now, we'll create a simple beep using Web Audio API
        try {
            const audioContext = this.getAudioContext();
            if (!audioContext) return;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different frequencies for different sounds (simple simulation)
            const frequencies = {
                'ui_click': 800,
                'ui_hover': 600,
                'shadow_clone': 400,
                'rasengan': 300,
                'kunai_throw': 1000,
                'nine_tails': 200,
                'enemy_hit': 500,
                'enemy_die': 250,
                'level_up': 1200,
                'item_pickup': 900
            };

            oscillator.frequency.value = frequencies[name] || 440;
            oscillator.type = 'sine';

            const soundVolume = (this.soundDefinitions[name]?.volume || 1.0) * volume * this.volume;
            gainNode.gain.setValueAtTime(soundVolume * 0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Silent fail for audio
        }
    },

    getAudioContext() {
        if (!this.audioContext) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            } catch (error) {
                console.warn('Web Audio API not supported');
                return null;
            }
        }
        return this.audioContext;
    },

    stop(name) {
        // Stop specific sound
        if (this.sounds[name]) {
            // Would stop all instances of this sound
        }
    },

    stopAll() {
        // Stop all sounds
        Object.keys(this.sounds).forEach(name => this.stop(name));
    },

    setVolume(volume) {
        this.volume = Utils.clamp(volume, 0, 1);
    },

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAll();
        }
    },

    toggle() {
        this.setEnabled(!this.enabled);
    },

    // Play ability sound based on ability name
    playAbilitySound(abilityName) {
        const soundMap = {
            'Shadow Clone Jutsu': 'shadow_clone',
            'Rasengan': 'rasengan',
            'Kunai Throw': 'kunai_throw',
            'Nine-Tails Chakra': 'nine_tails'
        };

        const soundName = soundMap[abilityName];
        if (soundName) {
            this.play(soundName);
        }
    },

    // Play UI sound
    playUI(action) {
        const soundMap = {
            'click': 'ui_click',
            'hover': 'ui_hover',
            'error': 'ui_error'
        };

        const soundName = soundMap[action];
        if (soundName) {
            this.play(soundName, { volume: 0.5 });
        }
    }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    AudioManager.init();

    // Resume audio context on first user interaction (required by browsers)
    const resumeAudio = () => {
        if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
            AudioManager.audioContext.resume();
        }
        document.removeEventListener('touchstart', resumeAudio);
        document.removeEventListener('click', resumeAudio);
    };

    document.addEventListener('touchstart', resumeAudio);
    document.addEventListener('click', resumeAudio);
});
