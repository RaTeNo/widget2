import { getElement, createElement } from '../utils/dom.js';
import { ChatMessage } from './ChatMessage.js';
import { InputArea } from './InputArea.js';

// Константы для тестовых аудио (должны существовать в папке assets/audio/)
const AI_TEST_AUDIO_URL = 'assets/audio/ai-sample.mp3';
const USER_TEST_AUDIO_URL = 'assets/audio/user-sample.mp3';


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

        this.inputArea = new InputArea('.chat-input-area', this.handleSendMessage.bind(this));

        this.initEventListeners();
        this.updateNewMessagesCount();
    }

    initEventListeners() {
        this.toggleButton.addEventListener('click', () => this.toggleChat());
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
            this.chatWindow.focus();
            this.newMessageCounter = 0;
            this.updateNewMessagesCount();
            this.scrollToBottom();
            this.toggleButton.style.opacity = '0';
            this.toggleButton.style.transform = 'scale(0.5)';
            this.toggleButton.style.pointerEvents = 'none';
        } else {
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

    addMessage(type, content = null, avatar, showFeedback = false, audioUrl = null, audioDuration = null) {
        const timestamp = new Date();
        const message = new ChatMessage(type, content, timestamp, avatar, showFeedback, audioUrl, audioDuration);
        this.messages.push(message);
        this.chatMessagesContainer.appendChild(message.element);

        if (this.messages.length > 0 && this.emptyState) {
            this.emptyState.style.display = 'none';
        }

        this.scrollToBottom();

        if (!this.isChatOpen && type === 'ai') {
            this.newMessageCounter++;
            this.updateNewMessagesCount();
        }
    }

    handleSendMessage(messageData) {
        let isUserAudioMessage = false;

        if (typeof messageData === 'string') {
            this.addMessage('user', messageData, this.userAvatar);
        } else if (messageData && messageData.audioUrl) {
            this.addMessage('user', null, this.userAvatar, false, messageData.audioUrl, messageData.audioDuration);
            isUserAudioMessage = true;
        }

        const typingPlaceholder = this.addTypingIndicator();

        const responseDelay = Math.random() * (5000 - 3000) + 3000; // От 3 до 5 секунд
        setTimeout(() => {
            this.removeTypingIndicator(typingPlaceholder);
            
            // Если пользователь отправил аудио, AI всегда отвечает текстом (пока что)
            // Иначе, AI чередует ответы
            if (isUserAudioMessage) {
                const aiResponse = this.generateAiResponse("На ваше аудиосообщение"); 
                this.addMessage('ai', aiResponse, this.aiAvatar, true);
            } else {
                const totalAiTextMessages = this.messages.filter(msg => msg.type === 'ai' && msg.content).length;
                // Чередуем: текстовый ответ, аудио ответ
                if (totalAiTextMessages % 2 === 0) { 
                    const aiResponse = this.generateAiResponse(typeof messageData === 'string' ? messageData : '');
                    this.addMessage('ai', aiResponse, this.aiAvatar, true);
                } else {
                    this.addMessage('ai', null, this.aiAvatar, false, AI_TEST_AUDIO_URL, null); // null для audioDuration
                    console.log(`AI ответил реальным аудио.`);
                }
            }
        }, responseDelay);
    }

    addTypingIndicator() {
        const typingMessage = createElement('div', ['chat-message', 'chat-message--ai']);
        const avatarDiv = createElement('div', ['chat-message__avatar']);
        const avatarImg = createElement('img', [], { src: this.aiAvatar, alt: 'Аватар AI' });
        avatarDiv.appendChild(avatarImg);

        const bubbleContainer = createElement('div');
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
        } else if (userMessage.length < 5 && userMessage.length > 0) {
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
        if (this.newMessageCounter > 0 && !this.isChatOpen) {
            this.toggleButton.classList.add('has-new-messages');
        } else {
            this.toggleButton.classList.remove('has-new-messages');
        }
    }
}