import { createElement } from '../utils/dom.js';

export class ChatMessage {
    constructor(type, content, timestamp, avatar = null, showFeedback = false, audioUrl = null, audioDuration = null) {
        this.type = type; // 'user' or 'ai'
        this.content = content; // Текстовое сообщение
        this.timestamp = timestamp;
        this.avatar = avatar;
        this.showFeedback = showFeedback;
        this.audioUrl = audioUrl; // URL аудиофайла
        this.audioDuration = audioDuration; // Длительность аудио в секундах (например, 53)
        this.audioPlaying = false; // Состояние воспроизведения

        this.element = this.render();
        this.audioElement = null; // Для реального <audio> элемента
        this.progressBarInterval = null;
    }

    render() {
        const messageContainer = createElement('div', ['chat-message', `chat-message--${this.type}`, 'fade-in']);

        // Аватар добавляем только если он есть и если это сообщение ИИ (как на скринах)
        // Для пользователя аватара нет в этом интерфейсе
        if (this.type === 'ai' && this.avatar) {
            const avatarDiv = createElement('div', ['chat-message__avatar']);
            const avatarImg = createElement('img', [], { src: this.avatar, alt: 'Аватар' });
            avatarDiv.appendChild(avatarImg);
            messageContainer.appendChild(avatarDiv);
        }

        const bubbleContainer = createElement('div'); // Внешний контейнер для пузыря/плеера и времени
        // Для сообщений пользователя, если они текстовые, этот контейнер по сути будет лишним,
        // но для согласованности структуры, оставим его.

        const time = createElement('span', ['chat-message__time']);
        time.textContent = this.formatTime(this.timestamp);

        if (this.audioUrl) {
            // Если это аудиосообщение
            const audioPlayer = createElement('div', ['chat-message__audio-player']);
            // Для аудиосообщений пользователя делаем уголок
            if (this.type === 'user') {
                audioPlayer.classList.add('chat-message--user');
            } else if (this.type === 'ai') {
                audioPlayer.classList.add('chat-message--ai');
            }


            const playButton = createElement('button', ['chat-message__play-button'], { 'aria-label': 'Воспроизвести аудио' });
            playButton.innerHTML = `<span class="material-icons">${this.audioPlaying ? 'stop_circle' : 'play_circle_filled'}</span>`;
            playButton.addEventListener('click', () => this.toggleAudioPlay(playButton, audioPlayer)); // Передаем audioPlayer для доступа к waveform

            const waveform = createElement('div', ['chat-message__waveform']);
            const duration = createElement('span', ['chat-message__duration']);
            duration.textContent = this.formatDuration(this.audioDuration);

            audioPlayer.appendChild(playButton);
            audioPlayer.appendChild(waveform);
            audioPlayer.appendChild(duration);

            bubbleContainer.appendChild(audioPlayer);

            // Если есть реальный URL, создаем аудио-элемент
            if (this.audioUrl !== 'mock') {
                this.audioElement = new Audio(this.audioUrl);
                this.audioElement.addEventListener('timeupdate', () => this.updateAudioProgress(waveform));
                this.audioElement.addEventListener('ended', () => this.resetAudioPlayer(playButton, waveform));
            } else {
                // Для моковых данных, имитация прогресса
                 waveform.style.setProperty('--audio-progress', '0%'); // Изначально прогресс 0
            }

        } else {
            // Если это текстовое сообщение
            const bubble = createElement('div', ['chat-message__bubble']);
            bubble.innerHTML = this.content;
            bubbleContainer.appendChild(bubble);

            // Добавляем кнопки обратной связи только для AI-сообщений
            if (this.type === 'ai' && this.showFeedback && this.content) { // Убедиться, что это текстовое AI сообщение
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

        bubbleContainer.appendChild(time); // Время всегда в конце bubbleContainer
        messageContainer.appendChild(bubbleContainer);

        return messageContainer;
    }

    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    formatDuration(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.round(seconds % 60); // Округляем секунды
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    toggleAudioPlay(playButton, audioPlayer) {
        const waveform = audioPlayer.querySelector('.chat-message__waveform');

        if (!this.audioElement) {
            // Обработка для моковых данных
            console.log('Кнопка воспроизведения аудио нажата (моделирование)');
            this.audioPlaying = !this.audioPlaying;
            playButton.innerHTML = `<span class="material-icons">${this.audioPlaying ? 'pause_circle' : 'play_circle_filled'}</span>`;

            if (this.audioPlaying && this.audioDuration) {
                // Имитация прогресса для мока
                let currentMockTime = 0;
                const intervalTime = 50; // Обновляем каждые 50 мс
                const totalSteps = (this.audioDuration * 1000) / intervalTime;
                let step = 0;

                this.progressBarInterval = setInterval(() => {
                    step++;
                    currentMockTime = (step * intervalTime) / 1000;
                    if (currentMockTime >= this.audioDuration) {
                        currentMockTime = this.audioDuration;
                        this.resetAudioPlayer(playButton, waveform);
                        return;
                    }
                    const progress = (currentMockTime / this.audioDuration) * 100;
                    waveform.style.setProperty('--audio-progress', `${progress}%`);
                }, intervalTime);
            } else {
                clearInterval(this.progressBarInterval);
                this.progressBarInterval = null;
                waveform.style.setProperty('--audio-progress', '0%');
            }
            return;
        }

        // Логика для реального audioElement
        if (this.audioPlaying) {
            this.audioElement.pause();
            playButton.innerHTML = '<span class="material-icons">play_circle_filled</span>';
        } else {
            this.audioElement.play();
            playButton.innerHTML = '<span class="material-icons">pause_circle</span>';
        }
        this.audioPlaying = !this.audioPlaying;
    }

    updateAudioProgress(waveform) {
        if (this.audioElement) {
            const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
            waveform.style.setProperty('--audio-progress', `${progress}%`);
        }
    }

    resetAudioPlayer(playButton, waveform) {
        this.audioPlaying = false;
        playButton.innerHTML = '<span class="material-icons">play_circle_filled</span>';
        if (this.audioElement) {
            this.audioElement.currentTime = 0; // Сброс на начало
        }
        if (this.progressBarInterval) {
            clearInterval(this.progressBarInterval);
            this.progressBarInterval = null;
        }
        waveform.style.setProperty('--audio-progress', '0%');
    }

    handleFeedback(event, feedbackType) {
        const buttons = event.currentTarget.closest('.chat-message__feedback').querySelectorAll('button');
        buttons.forEach(button => {
            button.classList.remove('active');
            button.disabled = true; // Отключаем все кнопки после выбора
        });
        event.currentTarget.classList.add('active');
        console.log(`Feedback submitted: ${this.content} - ${feedbackType}`);
        // Здесь можно отправить фидбек на сервер
    }
}