import { getElement, createElement, getAllElements } from '../utils/dom.js';

// Константы для тестовых аудио (если нужно имитировать отправку реального аудио пользователем)
const USER_RECORDED_AUDIO_URL = 'assets/audio/user-recorded.mp3'; // Реальный путь к аудио
const USER_RECORDED_AUDIO_DURATION = 15; // Примерная длительность в секундах, если файл короткий


export class InputArea {
    constructor(containerSelector, onSendMessage) {
        this.container = getElement(containerSelector);
        this.textarea = getElement('.chat-input-area__textarea', this.container);
        this.sendButton = getElement('.chat-input-area__send-button', this.container);
        this.suggestionsContainer = getElement('.chat-input-area__suggestions', this.container);
        this.tabs = getAllElements('.chat-input-area__tab', this.container);

        this.textInputSection = getElement('.text-input-section', this.container);
        this.audioInputSection = getElement('.audio-input-section', this.container);
        this.micButton = getElement('.audio-input-section__microphone-button', this.audioInputSection);
        this.micPlaceholderText = getElement('.audio-input-section__placeholder-text', this.audioInputSection);

        this.onSendMessage = onSendMessage;
        this.suggestions = [
            'помоги со звонком',
            'дай возражения',
            'дай аргументы',
            'дай техники',
            'напиши текст письма', // Добавил обратно, чтобы было больше
            'создай отчёт'
        ];

        this.activeTab = 'text';
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingTimerInterval = null;


        this.initEventListeners();
        this.updateSendButtonState();
        this.renderSuggestions();
        this.setActiveSection(this.activeTab);
    }

    initEventListeners() {
        this.textarea.addEventListener('input', () => {
            this.adjustTextareaHeight();
            this.updateSendButtonState();
        });

        this.textarea.addEventListener('focus', () => {
            if (this.activeTab === 'text') {
                this.suggestionsContainer.classList.add('active');
            }
        });

        this.textarea.addEventListener('blur', () => {
            setTimeout(() => {
                this.suggestionsContainer.classList.remove('active');
            }, 150);
        });

        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabClick(e));
        });

        this.micButton.addEventListener('mousedown', () => this.startRecording());
        this.micButton.addEventListener('mouseup', () => this.stopRecording());
        this.micButton.addEventListener('touchstart', (e) => { e.preventDefault(); this.startRecording(); }, { passive: false });
        this.micButton.addEventListener('touchend', (e) => { e.preventDefault(); this.stopRecording(); }, { passive: false });
    }

    adjustTextareaHeight() {
        this.textarea.style.height = 'auto';
        this.textarea.style.height = this.textarea.scrollHeight + 'px';
    }

    updateSendButtonState() {
        if (this.activeTab === 'text') {
            this.sendButton.disabled = this.textarea.value.trim() === '';
        } else {
            this.sendButton.disabled = true;
        }
    }

    sendMessage() {
        const message = this.textarea.value.trim();
        if (message && this.activeTab === 'text') {
            this.onSendMessage(message);
            this.textarea.value = '';
            this.adjustTextareaHeight();
            this.updateSendButtonState();
        }
    }

    renderSuggestions() {
        this.suggestionsContainer.innerHTML = '';
        this.suggestions.forEach(suggestionText => {
            const button = createElement('button', ['chat-input-area__suggestion-button']);
            button.textContent = suggestionText;
            button.addEventListener('click', () => {
                this.textarea.value = suggestionText;
                this.adjustTextareaHeight();
                this.updateSendButtonState();
                this.suggestionsContainer.classList.remove('active');
                this.textarea.focus();
            });
            this.suggestionsContainer.appendChild(button);
        });
    }

    handleTabClick(event) {
        this.tabs.forEach(tab => tab.classList.remove('active'));
        event.currentTarget.classList.add('active');

        this.activeTab = event.currentTarget.dataset.tab;
        this.setActiveSection(this.activeTab);

        this.updateSendButtonState();

        if (this.activeTab === 'audio') {
            this.suggestionsContainer.classList.remove('active');
            if (this.isRecording) {
                this.stopRecording(true); // Останавливаем без отправки
            }
        } else {
            this.micButton.classList.remove('recording');
            this.micButton.innerHTML = '<span class="material-icons">mic</span>';
            this.micPlaceholderText.textContent = 'Нажмите и отпустите, чтобы начать запись';
        }
        console.log(`Switched to tab: ${this.activeTab}`);
    }

    setActiveSection(tabName) {
        if (tabName === 'text') {
            this.textInputSection.classList.add('active');
            this.audioInputSection.classList.remove('active');
            this.textarea.focus();
        } else if (tabName === 'audio') {
            this.textInputSection.classList.remove('active');
            this.audioInputSection.classList.add('active');
            this.micButton.focus();
        }
    }

    startRecording() {
        if (this.isRecording) return;
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        this.micButton.classList.add('recording');
        this.micButton.innerHTML = '<span class="material-icons">stop</span>';
        this.micPlaceholderText.textContent = 'Идет запись... 00:00';

        let seconds = 0;
        this.recordingTimerInterval = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            this.micPlaceholderText.textContent = `Идет запись... ${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);

        console.log('Начата запись...');
    }

    stopRecording(cancel = false) {
        if (!this.isRecording) return;
        this.isRecording = false;
        clearInterval(this.recordingTimerInterval);
        this.recordingTimerInterval = null;

        this.micButton.classList.remove('recording');
        this.micButton.innerHTML = '<span class="material-icons">mic</span>';

        // Вычисляем длительность записи, округляем до 1 секунды, минимум 1 секунда для отправки
        const recordingDurationMs = Date.now() - this.recordingStartTime;
        const recordingDurationSeconds = Math.max(1, Math.round(recordingDurationMs / 1000));

        if (!cancel && recordingDurationSeconds > 0) {
            this.micPlaceholderText.textContent = 'Аудио отправлено. Нажмите, чтобы начать новую запись.';
            console.log(`Запись остановлена. Длительность: ${recordingDurationSeconds} сек.`);
            // Используем реальный путь к файлу для отправляемого аудио от пользователя
            this.onSendMessage({
                audioUrl: USER_RECORDED_AUDIO_URL,
                // Для демо, если не указана длительность, возьмем из константы
                // В реальном проекте, длительность будет известна после обработки записи
                audioDuration: USER_RECORDED_AUDIO_DURATION || recordingDurationSeconds
            });
        } else {
            this.micPlaceholderText.textContent = 'Нажмите и отпустите, чтобы начать запись';
            console.log('Запись отменена или слишком короткая.');
        }
    }
}