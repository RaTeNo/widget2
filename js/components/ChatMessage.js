import { createElement } from '../utils/dom.js';

export class ChatMessage {
    constructor(type, content, timestamp, avatar = null, showFeedback = false, audioUrl = null, audioDuration = null) {
        this.type = type; // 'user' or 'ai'
        this.content = content; // Текстовое сообщение
        this.timestamp = timestamp;
        this.avatar = avatar;
        this.showFeedback = showFeedback;
        this.audioUrl = audioUrl; // URL аудиофайла
        this.audioDuration = audioDuration; // Длительность аудио в секундах (может быть null для реального аудио)
        this.audioPlaying = false; // Состояние воспроизведения

        this.element = this.render();
        this.audioElement = null; // Для реального <audio> элемента
        this.progressBarInterval = null; // Для моковой имитации прогресса
        this.currentMockPlaybackTime = 0; // Текущее время воспроизведения для мока
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
            const audioPlayer = createElement('div', ['chat-message__audio-player']);
            if (this.type === 'user') {
                audioPlayer.classList.add('chat-message--user');
            } else if (this.type === 'ai') {
                audioPlayer.classList.add('chat-message--ai');
            }

            const playButton = createElement('button', ['chat-message__play-button'], { 'aria-label': 'Воспроизвести аудио' });
            playButton.innerHTML = `<span class="material-icons">${this.audioPlaying ? 'pause_circle' : 'play_circle_filled'}</span>`;
            playButton.addEventListener('click', () => this.toggleAudioPlay(playButton, audioPlayer));

            const waveform = createElement('div', ['chat-message__waveform']);
            const durationSpan = createElement('span', ['chat-message__duration']);
            durationSpan.textContent = this.formatDuration(this.audioDuration); // Начальное отображение длительности

            // Обработчик клика по waveform для перемотки
            waveform.addEventListener('click', (e) => this.seekAudio(e, waveform, durationSpan)); 

            audioPlayer.appendChild(playButton);
            audioPlayer.appendChild(waveform);
            audioPlayer.appendChild(durationSpan);

            bubbleContainer.appendChild(audioPlayer);

            // Если audioUrl не 'mock', создаем реальный Audio элемент
            if (this.audioUrl !== 'mock') {
                this.audioElement = new Audio(this.audioUrl);
                this.audioElement.addEventListener('timeupdate', () => this.updateAudioProgress(waveform, durationSpan));
                this.audioElement.addEventListener('ended', () => this.resetAudioPlayer(playButton, waveform, durationSpan));
                
                // Это очень важный обработчик для реальных аудиофайлов
                this.audioElement.addEventListener('loadedmetadata', () => {
                    console.log('loadedmetadata сработал для:', this.audioUrl);
                    console.log('this.audioElement.duration:', this.audioElement.duration); // <-- Добавьте эту строку
                    this.audioDuration = this.audioElement.duration;
                    durationSpan.textContent = this.formatDuration(this.audioDuration);
                    waveform.style.setProperty('--audio-progress', `0%`);
                });
                
                this.audioElement.addEventListener('error', (e) => {
                    console.error('Ошибка загрузки аудио:', e);
                    audioPlayer.innerHTML = '<span style="color: red;">Ошибка загрузки аудио</span>';
                });
            } else {
                // Инициализация прогресса для моковых данных
                waveform.style.setProperty('--audio-progress', `0%`);
            }

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

    formatDuration(seconds) {
        // Проверяем, что seconds - это число и не NaN, Infinity
        if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds)) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.round(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    toggleAudioPlay(playButton, audioPlayer) {
        const waveform = audioPlayer.querySelector('.chat-message__waveform');
        const durationSpan = audioPlayer.querySelector('.chat-message__duration');

        // Логика для реального audioElement
        // Проверяем, существует ли audioElement и доступны ли его метаданные (duration)
        if (this.audioElement && !isNaN(this.audioElement.duration) && isFinite(this.audioElement.duration) && this.audioElement.duration > 0) {
            if (this.audioPlaying) {
                this.audioElement.pause();
                playButton.innerHTML = '<span class="material-icons">play_circle_filled</span>';
            } else {
                this.audioElement.play();
                playButton.innerHTML = '<span class="material-icons">pause_circle</span>';
            }
            this.audioPlaying = !this.audioPlaying;
            return; // Завершаем выполнение функции, если это реальное аудио
        }

        // --- Логика для моковых данных (ТОЛЬКО ЕСЛИ НЕ РЕАЛЬНОЕ АУДИО) ---
        // Убедимся, что у мокового аудио есть длительность для имитации
        if (!this.audioDuration || this.audioDuration <= 0) {
            console.warn("Моковое аудио не имеет длительности или она равна 0. Невозможно воспроизвести.");
            return;
        }

        console.log('Кнопка воспроизведения аудио нажата (моделирование)');
        this.audioPlaying = !this.audioPlaying;
        playButton.innerHTML = `<span class="material-icons">${this.audioPlaying ? 'pause_circle' : 'play_circle_filled'}</span>`;

        if (this.audioPlaying) {
            // Если уже есть интервал, очищаем его перед запуском нового
            if (this.progressBarInterval) {
                clearInterval(this.progressBarInterval);
            }
            const intervalTime = 50; // Обновляем каждые 50 мс
            const startTime = performance.now();
            const startPlaybackTime = this.currentMockPlaybackTime; // Продолжаем с текущей позиции

            this.progressBarInterval = setInterval(() => {
                const elapsedTime = performance.now() - startTime;
                this.currentMockPlaybackTime = startPlaybackTime + (elapsedTime / 1000);

                if (this.currentMockPlaybackTime >= this.audioDuration) {
                    this.currentMockPlaybackTime = this.audioDuration;
                    this.resetAudioPlayer(playButton, waveform, durationSpan);
                    return;
                }
                const progress = (this.currentMockPlaybackTime / this.audioDuration) * 100;
                waveform.style.setProperty('--audio-progress', `${progress}%`);
                durationSpan.textContent = this.formatDuration(this.currentMockPlaybackTime);
            }, intervalTime);
        } else { // Если ставим на паузу
            clearInterval(this.progressBarInterval);
            this.progressBarInterval = null;
        }
    }

    updateAudioProgress(waveform, durationSpan) {
        // Проверяем, что это реальный audioElement и что его duration доступна и является числом
        if (this.audioElement && !isNaN(this.audioElement.duration) && isFinite(this.audioElement.duration)) {
            const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
            waveform.style.setProperty('--audio-progress', `${progress}%`);
            durationSpan.textContent = this.formatDuration(this.audioElement.currentTime);
        }
        // Для моковых данных обновление прогресса происходит в setInterval функции toggleAudioPlay
    }

    resetAudioPlayer(playButton, waveform, durationSpan) {
        this.audioPlaying = false;
        playButton.innerHTML = '<span class="material-icons">play_circle_filled</span>';
        
        // Только если это реальный audioElement
        if (this.audioElement) {
            this.audioElement.currentTime = 0; // Сброс на начало
        }
        
        // Для моковых данных
        if (this.progressBarInterval) {
            clearInterval(this.progressBarInterval);
            this.progressBarInterval = null;
        }
        this.currentMockPlaybackTime = 0; // Сбрасываем текущее время для мока
        
        waveform.style.setProperty('--audio-progress', '0%');
        // Обновляем длительность на полную, если она известна
        durationSpan.textContent = this.formatDuration(this.audioDuration); 
    }

    seekAudio(event, waveform, durationSpan) {
        // Получаем общую длительность: реального аудио или мокового
        const totalDuration = (this.audioElement && !isNaN(this.audioElement.duration) && isFinite(this.audioElement.duration) && this.audioElement.duration > 0)
                             ? this.audioElement.duration // Если реальный, берем из него
                             : this.audioDuration; // Если мок, берем из this.audioDuration

        if (!totalDuration || totalDuration <= 0) {
            console.warn('Невозможно перемотать: длительность аудио неизвестна или <= 0.');
            return;
        }

        const rect = waveform.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width)); // Ограничиваем от 0 до 1

        const newTime = totalDuration * percentage;

        if (this.audioElement) { // Если это реальное аудио
            this.audioElement.currentTime = newTime;
            // updateAudioProgress будет вызван через timeupdate слушатель и обновит UI
        } else { // Если это моковое аудио
            this.currentMockPlaybackTime = newTime; // Устанавливаем новое текущее время для мока
            const progress = (this.currentMockPlaybackTime / totalDuration) * 100;
            waveform.style.setProperty('--audio-progress', `${progress}%`);
            // Немедленно обновляем отображение текущего времени
            durationSpan.textContent = this.formatDuration(this.currentMockPlaybackTime);

            // Если аудио играло, перезапускаем имитацию воспроизведения с новой точки
            if (this.audioPlaying) {
                 const playButton = this.element.querySelector('.chat-message__play-button');
                 // Очищаем существующий интервал перед запуском нового, чтобы избежать дублирования
                 clearInterval(this.progressBarInterval);
                 this.progressBarInterval = null;
                 // Имитируем повторный вызов toggleAudioPlay, чтобы запустить интервал с новой позиции
                 // Передаем весь audioPlayer, чтобы waveform и durationSpan были найдены корректно
                 this.toggleAudioPlay(playButton, playButton.closest('.chat-message__audio-player'));
            }
        }
        console.log(`Перемотка аудио на: ${this.formatDuration(newTime)}`);
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