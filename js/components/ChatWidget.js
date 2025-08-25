import { getElement, createElement } from '../utils/dom.js';
import { ChatMessage } from './ChatMessage.js';
import { InputArea } from './InputArea.js';

export class ChatWidget {
    constructor() {
        this.toggleButton = getElement('#aiAssistantToggle');
        this.chatWindow = getElement('#aiAssistantChat');
        this.chatMessagesContainer = getElement('.chat-messages', this.chatWindow);
        this.closeButton = getElement('.chat-header__close-btn', this.chatWindow);
        this.emptyState = getElement('.chat-messages__empty-state', this.chatMessagesContainer);
        this.newMessagesCountSpan = getElement('.new-messages-count', this.chatWindow);

        this.aiAvatar = 'assets/avatar.png'; // Путь к аватару AI. Будет обновлен в main.js
        this.userAvatar = 'assets/user-avatar.png'; // Путь к аватару пользователя. Будет обновлен в main.js

        this.messages = [];
        this.isChatOpen = false;
        this.newMessageCounter = 0;

        // Передаем handleSendMessage в InputArea
        this.inputArea = new InputArea('.chat-input-area', this.handleSendMessage.bind(this));

        this.initEventListeners();
        this.updateNewMessagesCount();
    }

    initEventListeners() {
        this.toggleButton.addEventListener('click', () => this.toggleChat());
        // Добавляем обработчик для возможности закрытия по Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isChatOpen) {
                this.closeChat();
            }
        });
        this.closeButton.addEventListener('click', () => this.closeChat());
    }

    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        this.chatWindow.setAttribute('aria-hidden', !this.isChatOpen);
        this.toggleButton.setAttribute('aria-expanded', this.isChatOpen);

        if (this.isChatOpen) {
            this.chatWindow.focus(); // Передаем фокус на окно чата для доступности
            this.newMessageCounter = 0; // Сбрасываем счетчик при открытии
            this.updateNewMessagesCount();
            this.scrollToBottom();
            // Плавное скрытие кнопки при открытии чата
            this.toggleButton.style.opacity = '0';
            this.toggleButton.style.transform = 'scale(0.5)';
            this.toggleButton.style.pointerEvents = 'none';
        } else {
            // Плавное появление кнопки при закрытии чата
            this.toggleButton.style.opacity = '1';
            this.toggleButton.style.transform = 'scale(1)';
            this.toggleButton.style.pointerEvents = 'all';
        }
    }

    openChat() {
        if (!this.isChatOpen) {
             this.toggleChat();
        }
    }

    closeChat() {
        if (this.isChatOpen) {
            this.toggleChat();
        }
    }

    /**
     * Добавляет новое сообщение в чат.
     * @param {string} type - Тип сообщения ('user' или 'ai').
     * @param {string} content - Текстовое содержимое сообщения (опционально, для текстовых сообщений).
     * @param {string} avatar - URL аватара отправителя.
     * @param {boolean} showFeedback - Показывать ли кнопки фидбека (только для AI текстовых сообщений).
     * @param {string} audioUrl - URL аудиофайла (опционально, для аудиосообщений).
     * @param {number} audioDuration - Длительность аудио в секундах (опционально, для аудиосообщений).
     */
    addMessage(type, content = null, avatar, showFeedback = false, audioUrl = null, audioDuration = null) {
        const timestamp = new Date();
        const message = new ChatMessage(type, content, timestamp, avatar, showFeedback, audioUrl, audioDuration);
        this.messages.push(message);
        this.chatMessagesContainer.appendChild(message.element);

        // Скрываем "Сообщений пока нет" если есть сообщения
        if (this.messages.length > 0 && this.emptyState) {
            this.emptyState.style.display = 'none';
        }

        this.scrollToBottom();

        // Увеличиваем счетчик новых сообщений, если чат закрыт и это сообщение от AI
        if (!this.isChatOpen && type === 'ai') {
            this.newMessageCounter++;
            this.updateNewMessagesCount();
        }
    }

    handleSendMessage(messageData) {
        // messageData может быть строкой (текстовое сообщение) или объектом (аудиосообщение)
        if (typeof messageData === 'string') {
            // Текстовое сообщение от пользователя
            this.addMessage('user', messageData, this.userAvatar);
        } else if (messageData && messageData.audioUrl) {
            // Аудио сообщение от пользователя
            this.addMessage('user', null, this.userAvatar, false, messageData.audioUrl, messageData.audioDuration);
        }

        // Добавляем индикатор "ИИ думает..."
        const typingPlaceholder = this.addTypingIndicator();

        // Имитируем задержку ответа от ИИ (например, 3-5 секунд)
        const responseDelay = Math.random() * (5000 - 3000) + 3000; // От 3 до 5 секунд
        setTimeout(() => {
            this.removeTypingIndicator(typingPlaceholder);
            // Определяем, должен ли ИИ ответить текстом или аудио.
            // Для примера, AI будет чередовать ответы (текст, затем аудио, затем текст...)
            const totalAiMessages = this.messages.filter(msg => msg.type === 'ai').length;
            if (totalAiMessages % 2 === 0) { // Каждое второе сообщение AI будет аудио
                 // Ответ от AI в виде аудио
                 const mockAudioUrl = 'mock'; // Используем "mock" для отсутствия реального файла
                 const mockAudioDuration = Math.floor(Math.random() * (90 - 20 + 1)) + 20; // Случайная длительность от 20 до 90 секунд
                 this.addMessage('ai', null, this.aiAvatar, false, mockAudioUrl, mockAudioDuration);
                 console.log(`AI ответил аудио длительностью ${mockAudioDuration}с.`);
            } else {
                 // Ответ от AI в виде текста
                 const userMessageContent = typeof messageData === 'string' ? messageData : '';
                 const aiResponse = this.generateAiResponse(userMessageContent);
                 this.addMessage('ai', aiResponse, this.aiAvatar, true);
            }
        }, responseDelay);
    }

    addTypingIndicator() {
        const typingMessage = createElement('div', ['chat-message', 'chat-message--ai']);
        const avatarDiv = createElement('div', ['chat-message__avatar']);
        const avatarImg = createElement('img', [], { src: this.aiAvatar, alt: 'Аватар AI' });
        avatarDiv.appendChild(avatarImg);

        const bubbleContainer = createElement('div'); // Для размещения пузыря относительно аватара
        const bubble = createElement('div', ['chat-message__bubble']);
        bubble.innerHTML = `
            <div class="typing-indicator">
                <span class="material-icons">webhook</span>
                <span>ИИ думает...</span>
            </div>
        `;
        bubbleContainer.appendChild(bubble);

        typingMessage.appendChild(avatarDiv);
        typingMessage.appendChild(bubbleContainer);

        this.chatMessagesContainer.appendChild(typingMessage);
        this.scrollToBottom();
        return typingMessage;
    }

    removeTypingIndicator(indicatorElement) {
        if (indicatorElement && indicatorElement.parentNode) {
            indicatorElement.parentNode.removeChild(indicatorElement);
        }
    }

    generateAiResponse(userMessage) {
        // Более разнообразная логика для примера
        userMessage = userMessage.toLowerCase();
        if (userMessage.includes('привет') || userMessage.includes('здравствуй')) {
            return `Привет! Я ваш AI-помощник по продажам. Готов помочь! 🚀`;
        } else if (userMessage.includes('звонок') || userMessage.includes('позвонить')) {
            return `Конечно, я могу помочь с советами по проведению звонков. Что конкретно вам нужно уточнить?`;
        } else if (userMessage.includes('письмо') || userMessage.includes('написать')) {
            return `Да, могу сгенерировать текст письма. Укажите, пожалуйста, тему, получателя и ключевые пункты.`;
        } else if (userMessage.includes('отчёт') || userMessage.includes('отчет')) {
            return `Для какого типа отчета вам нужна помощь? По продажам, аналитике, или что-то другое?`;
        } else if (userMessage.includes('спасибо')) {
            return `Всегда к вашим услугам! Обращайтесь, если что-то еще понадобится.`;
        } else if (userMessage.length < 5) {
             return `Я тут, слушаю внимательно! Что еще могу для вас сделать?`;
        }
        else {
            return `К сожалению, я не совсем понял ваш запрос. Можете переформулировать или выбрать подсказку?`;
        }
    }

    scrollToBottom() {
        this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
    }

    updateNewMessagesCount() {
        this.newMessagesCountSpan.textContent = this.newMessageCounter.toString();
        // Можно добавить класс на кнопку-переключатель, если есть новые сообщения и чат закрыт
        if (this.newMessageCounter > 0 && !this.isChatOpen) {
            this.toggleButton.classList.add('has-new-messages'); // Для стилизации
        } else {
            this.toggleButton.classList.remove('has-new-messages');
        }
    }
}