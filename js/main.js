import { ChatWidget } from './components/ChatWidget.js';

document.addEventListener('DOMContentLoaded', () => {
    // Убедимся, что аватары существуют
    const aiAvatarSrc = 'assets/avatar.png'; // Укажите реальный путь к вашему аватару AI
    const userAvatarSrc = 'assets/user-avatar.png'; // Укажите реальный путь к аватару пользователя

    // Создадим экземпляры изображений, чтобы убедиться, что они загружены или обработать ошибки
    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            if (!src) { // Если путь пуст, сразу возвращаем нулл
                resolve(null);
                return;
            }
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(src);
            img.onerror = () => {
                console.warn(`Failed to load avatar: ${src}. Using fallback or empty.`);
                resolve(null); // Return null or a fallback image path
            };
        });
    };

    Promise.all([loadImage(aiAvatarSrc), loadImage(userAvatarSrc)])
        .then(([aiSrc, userSrc]) => {
            const chatWidget = new ChatWidget();
            chatWidget.aiAvatar = aiSrc || 'https://via.placeholder.com/48/007bff/ffffff?text=AI'; // fallback
            chatWidget.userAvatar = userSrc || 'https://via.placeholder.com/48/cccccc/ffffff?text=User'; // fallback
            console.log('AI Assistant Widget initialized.');

            // Демонстрация: Добавляем первое сообщение от AI при загрузке, чтобы показать уведомление
            //chatWidget.addMessage('ai', 'Привет! Я ваш AI-помощник. Чем могу помочь?', chatWidget.aiAvatar);
        })
        .catch(err => {
            console.error('Error loading avatars:', err);
            // Если аватары не загрузились, все равно инициализируем виджет с дефолтными
            const chatWidget = new ChatWidget();
             chatWidget.aiAvatar = 'https://via.placeholder.com/48/007bff/ffffff?text=AI';
             chatWidget.userAvatar = 'https://via.placeholder.com/48/cccccc/ffffff?text=User'; // fallback
             console.log('AI Assistant Widget initialized with placeholder avatars due to errors.');
        });
});