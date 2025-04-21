import { Request, Response } from 'express';
import * as messageService from '../services/messageService';

export const scheduleNewMessage = async (req: Request, res: Response) => {
    // Получаем ВСЕ данные из тела запроса
    const { messageText, cronFrequency, scheduleDateTime } = req.body;
    const userId = req.user?.id; // Получаем userId из middleware (authenticateJWT)

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found in token' });
    }
    // Проверяем наличие обязательных полей
    if (!messageText || !cronFrequency || !scheduleDateTime) {
        return res.status(400).json({ message: 'messageText, cronFrequency (for history), and scheduleDateTime are required' });
    }
    
    // Пытаемся преобразовать строку даты в объект Date
    const parsedScheduleDateTime = new Date(scheduleDateTime);
    if (isNaN(parsedScheduleDateTime.getTime())) {
        return res.status(400).json({ message: 'Invalid scheduleDateTime format. Please use ISO 8601 format.' });
    }

    try {
        // Передаем все данные в сервис
        const scheduledMessage = await messageService.scheduleMessage(userId, messageText, cronFrequency, parsedScheduleDateTime);
        // Отправляем только необходимые данные обратно
        res.status(201).json({ 
            id: scheduledMessage.id,
            messageText: scheduledMessage.messageText,
            cronFrequency: scheduledMessage.cronFrequency,
            status: scheduledMessage.status,
            nextRunAt: scheduledMessage.nextRunAt 
        });
    } catch (error: any) {
        console.error('Error scheduling message:', error);
        // Возвращаем ошибку валидации cron или времени, если она есть
        if (error.message.startsWith('Invalid cron format:') || 
            error.message.startsWith('Invalid schedule date/time') ||
            error.message.startsWith('Schedule date/time must be')) {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error while scheduling message' });
    }
};

export const getUserMessageHistory = async (req: Request, res: Response) => {
    const userId = req.user?.id; // Получаем userId из middleware

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found in token' });
    }

    try {
        const history = await messageService.getMessageHistory(userId);
        res.status(200).json(history);
    } catch (error: any) {
        console.error('Error fetching message history:', error);
        res.status(500).json({ message: 'Internal server error while fetching message history' });
    }
};

// TODO: Добавить контроллеры для получения запланированных, отмены, паузы задач. 