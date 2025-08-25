import { createElement } from '../utils/dom.js';
import { HTMLMediaAudioPlayer } from './audio/HTMLMediaAudioPlayer.js';
import { MockAudioPlayer } from './audio/MockAudioPlayer.js';

export class ChatMessage {
    constructor(type, content, timestamp, avatar = null, showFeedback = false, audioUrl = null, audioDuration = null) {
        this.type = type; // 'user' or 'ai'
        this.content = content; // Текстовое сообщение
        this.timestamp = timestamp;
        this.avatar = avatar;
        this.showFeedback = showFeedback;
        this.audioUrl = audioUrl; // URL аудиофайла
        this.audioDuration = audioDuration; // Длительность аудио в секундах (для мока)
        
        this.audioPlayer = null; // Будет хранить экземпляр плеера (HTMLMediaAudioPlayer или MockAudioPlayer)

        this.element = this.render();
    }

    render() {
        const messageContainer = createElement('div', ['chat-message', `chat-message--${this.type}`, 'fade-in']);

        if (this.type === 'ai' && this.avatar) {
            const avatarDiv = createElement('div', ['chat-message__avatar']);
            const avatarImg = createElement('img', [], { src: this.avatar, alt: 'Аватар' });
            avatarDiv.appendChild(avatarImg);
            messageContainer.appendChild(avatarDiv);
        }

        const bubbleContainer = createElement('div');

        const time = createElement('span', ['chat-message__time']);
        time.textContent = this.formatTime(this.timestamp);

        if (this.audioUrl) {
            const audioPlayerContainer = createElement('div', ['chat-message__audio-player']);
            if (this.type === 'user') {
                audioPlayerContainer.classList.add('chat-message--user');
            } else if (this.type === 'ai') {
                audioPlayerContainer.classList.add('chat-message--ai');
            }

            const playButton = createElement('button', ['chat-message__play-button'], { 'aria-label': 'Воспроизвести аудио' });
            playButton.innerHTML = '<span class="material-icons">play_circle_filled</span>'; // Initial icon

            const waveform = createElement('div', ['chat-message__waveform']);
            const durationSpan = createElement('span', ['chat-message__duration']);
            
            audioPlayerContainer.appendChild(playButton);
            audioPlayerContainer.appendChild(waveform);
            audioPlayerContainer.appendChild(durationSpan);

            bubbleContainer.appendChild(audioPlayerContainer);

            // Instantiate the correct player type
            if (this.audioUrl === 'mock') {
                this.audioPlayer = new MockAudioPlayer(this.audioDuration, playButton, waveform, durationSpan);
            } else {
                this.audioPlayer = new HTMLMediaAudioPlayer(this.audioUrl, playButton, waveform, durationSpan);
            }

            // Set up event listeners for the UI elements, delegating to the player
            playButton.addEventListener('click', () => this.audioPlayer.togglePlay());
            waveform.addEventListener('click', (e) => {
                const rect = waveform.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                const newTime = this.audioPlayer.getTotalDuration() * percentage;
                this.audioPlayer.seek(newTime);
            });

        } else {
            const bubble = createElement('div', ['chat-message__bubble']);
            bubble.innerHTML = this.content;
            bubbleContainer.appendChild(bubble);

            if (this.type === 'ai' && this.showFeedback && this.content) {
                const feedbackDiv = createElement('div', ['chat-message__feedback']);

                const usefulBtn = createElement('button', [], { 'aria-label': 'Полезно' });
                usefulBtn.innerHTML = '<span class="material-icons" style="font-size: 1.1em;">thumb_up_alt</span> Полезно';
                usefulBtn.addEventListener('click', (e) => this.handleFeedback(e, 'useful'));

                const notUsefulBtn = createElement('button', [], { 'aria-label': 'Не подходит' });
                notUsefulBtn.innerHTML = '<span class="material-icons" style="font-size: 1.1em;">thumb_down_alt</span> Не подходит';
                notUsefulBtn.addEventListener('click', (e) => this.handleFeedback(e, 'not-useful'));

                feedbackDiv.appendChild(usefulBtn);
                feedbackDiv.appendChild(notUsefulBtn);
                bubbleContainer.appendChild(feedbackDiv);
            }
        }

        bubbleContainer.appendChild(time);
        messageContainer.appendChild(bubbleContainer);

        return messageContainer;
    }

    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    handleFeedback(event, feedbackType) {
        const buttons = event.currentTarget.closest('.chat-message__feedback').querySelectorAll('button');
        buttons.forEach(button => {
            button.classList.remove('active');
            button.disabled = true;
        });
        event.currentTarget.classList.add('active');
        console.log(`Feedback submitted: ${this.content} - ${feedbackType}`);
    }
}