// Base class or interface for audio players
export class AudioPlayerBase {
    constructor(waveformElement, durationElement) {
        this.waveformElement = waveformElement;
        this.durationElement = durationElement;
        this.isPlaying = false; // Internal state
    }

    // Common methods, to be implemented by subclasses
    play() { throw new Error("Method 'play()' must be implemented."); }
    pause() { throw new Error("Method 'pause()' must be implemented."); }
    seek(newTime) { throw new Error("Method 'seek()' must be implemented."); }
    togglePlay() { throw new Error("Method 'togglePlay()' must be implemented."); }

    // Helper method to format time (can be static or part of base)
    static formatDuration(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds)) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.round(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    // Abstract methods to update UI elements
    _updateWaveformProgress(progressPercent) {
        this.waveformElement.style.setProperty('--audio-progress', `${progressPercent}%`);
    }

    _updateCurrentTimeDisplay(timeInSeconds) {
        this.durationElement.textContent = AudioPlayerBase.formatDuration(timeInSeconds);
    }
}