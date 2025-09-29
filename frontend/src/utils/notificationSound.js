// Notification sound utility
class NotificationSound {
    constructor() {
        this.audioContext = null;
        this.isEnabled = true;
        this.volume = 0.5;
    }

    // Initialize audio context (required for some browsers)
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Play a simple notification beep
    playBeep() {
        if (!this.isEnabled) return;

        try {
            this.init();
            
            // Create a simple beep sound using Web Audio API
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configure the beep
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800Hz
            oscillator.type = 'sine';
            
            // Set volume
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            
            // Play the beep
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }

    // Play a more pleasant notification sound
    playNotification() {
        if (!this.isEnabled) return;

        try {
            this.init();
            
            // Create a pleasant notification sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Create a two-tone notification sound
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            
            // Set volume envelope
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.7, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
            
            // Play the notification
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.4);
            
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }

    // Play a subtle message sound
    playMessageSound() {
        if (!this.isEnabled) return;

        try {
            this.init();
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Lower frequency for message sound
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            // Shorter, softer sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
            
        } catch (error) {
            console.warn('Could not play message sound:', error);
        }
    }

    // Enable/disable sound
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

// Create a singleton instance
const notificationSound = new NotificationSound();

export default notificationSound;
