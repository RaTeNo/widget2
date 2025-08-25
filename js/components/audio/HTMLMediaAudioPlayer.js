import { AudioPlayerBase } from './AudioPlayerBase.js';

export class HTMLMediaAudioPlayer extends AudioPlayerBase {
    constructor(audioUrl, playButtonElement, waveformElement, durationElement) {
        super(waveformElement, durationElement);
        this.audio = new Audio(audioUrl);
        this.playButtonElement = playButtonElement;
        this.totalDuration = 0; // Will be set on loadedmetadata

        this._setupEventListeners();
    }

    _setupEventListeners() {
        this.audio.addEventListener('loadedmetadata', () => {
            this.totalDuration = this.audio.duration;
            this.durationElement.textContent = AudioPlayerBase.formatDuration(this.totalDuration);
            this._updateWaveformProgress(0); // Set initial progress to 0
        });

        this.audio.addEventListener('timeupdate', () => {
            if (this.totalDuration > 0) { // Ensure duration is set
                const progress = (this.audio.currentTime / this.totalDuration) * 100;
                this._updateWaveformProgress(progress);
                this._updateCurrentTimeDisplay(this.audio.currentTime);
            }
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.audio.currentTime = 0; // Reset to start
            this.playButtonElement.innerHTML = '<span class="material-icons">play_circle_filled</span>';
            this._updateWaveformProgress(0);
            this._updateCurrentTimeDisplay(this.totalDuration); // Show total duration at end
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.playButtonElement.innerHTML = '<span class="material-icons">pause_circle</span>';
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.playButtonElement.innerHTML = '<span class="material-icons">play_circle_filled</span>';
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Audio playback error:', this.audio.error, e);
            // In a real app, you might show an error message in the UI
            this.durationElement.textContent = 'Ошибка';
        });
    }

    play() {
        if (!this.totalDuration) { // If metadata not loaded yet, try to load
             this.audio.load(); // Request to load metadata if not already
        }
        this.audio.play();
    }

    pause() {
        this.audio.pause();
    }

    seek(newTime) {
        if (this.totalDuration > 0) {
            this.audio.currentTime = Math.min(Math.max(0, newTime), this.totalDuration);
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    // Method to get current time for UI or seek calculations
    getCurrentTime() {
        return this.audio.currentTime;
    }

    getTotalDuration() {
        return this.totalDuration;
    }
}