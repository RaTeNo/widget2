import { AudioPlayerBase } from './AudioPlayerBase.js';

export class MockAudioPlayer extends AudioPlayerBase {
    constructor(mockDuration, playButtonElement, waveformElement, durationElement) {
        super(waveformElement, durationElement);
        this.totalDuration = mockDuration;
        this.playButtonElement = playButtonElement;
        this.currentMockPlaybackTime = 0;
        this.progressBarInterval = null;

        this.durationElement.textContent = AudioPlayerBase.formatDuration(this.totalDuration);
        this._updateWaveformProgress(0); // Initial state
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.playButtonElement.innerHTML = '<span class="material-icons">pause_circle</span>';

        const startTime = performance.now();
        const startPlaybackTime = this.currentMockPlaybackTime;

        this.progressBarInterval = setInterval(() => {
            const elapsedTime = performance.now() - startTime;
            this.currentMockPlaybackTime = startPlaybackTime + (elapsedTime / 1000);

            if (this.currentMockPlaybackTime >= this.totalDuration) {
                this._stopMockPlayback(true); // Signal completion
                return;
            }
            const progress = (this.currentMockPlaybackTime / this.totalDuration) * 100;
            this._updateWaveformProgress(progress);
            this._updateCurrentTimeDisplay(this.currentMockPlaybackTime);
        }, 50); // Update every 50ms
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.playButtonElement.innerHTML = '<span class="material-icons">play_circle_filled</span>';
        clearInterval(this.progressBarInterval);
        this.progressBarInterval = null;
    }

    seek(newTime) {
        this.currentMockPlaybackTime = Math.min(Math.max(0, newTime), this.totalDuration);
        const progress = (this.currentMockPlaybackTime / this.totalDuration) * 100;
        this._updateWaveformProgress(progress);
        this._updateCurrentTimeDisplay(this.currentMockPlaybackTime);

        // If playing, restart the interval from new position
        if (this.isPlaying) {
            this.pause(); // Stop current interval
            this.play(); // Start new interval from new currentMockPlaybackTime
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    _stopMockPlayback(completed = false) {
        clearInterval(this.progressBarInterval);
        this.progressBarInterval = null;
        this.isPlaying = false;
        this.playButtonElement.innerHTML = '<span class="material-icons">play_circle_filled</span>';

        if (completed) {
            this.currentMockPlaybackTime = 0; // Reset to start on completion
            this._updateWaveformProgress(0);
            this._updateCurrentTimeDisplay(this.totalDuration); // Show total duration when done
        }
    }

    // Method to get current time for UI or seek calculations
    getCurrentTime() {
        return this.currentMockPlaybackTime;
    }

    getTotalDuration() {
        return this.totalDuration;
    }
}