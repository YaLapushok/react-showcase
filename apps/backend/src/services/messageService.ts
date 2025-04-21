import { LessThanOrEqual } from 'typeorm'; // Импортируем для запроса
import { AppDataSource } from '../data-source';
import { MessageHistory } from '../entities/MessageHistory';
import { ScheduledMessage, ScheduleStatus } from '../entities/ScheduledMessage';
import { User } from '../entities/User';
import cronParser from 'cron-parser';
// Убираем импорт scheduleSingleJob
// import { scheduleSingleJob } from './cronService'; 
import { sendEmail } from './emailService'; // Импортируем sendEmail для polling

const historyRepository = AppDataSource.getRepository(MessageHistory);
const scheduledRepository = AppDataSource.getRepository(ScheduledMessage);
const userRepository = AppDataSource.getRepository(User); // Нужен для поиска юзера

// Функция валидации cron остается для совместимости или будущих нужд,
// но главная логика будет использовать nextRunAt
const validateCronAndGetNext = (cronExpression: string): Date | null => {
    try {
        const interval = cronParser.parseExpression(cronExpression);
        return interval.next().toDate(); // Просто возвращаем дату, не кидаем ошибку сразу
    } catch (err: any) {
        console.error('Invalid cron expression:', cronExpression, err.message);
        // throw new Error(`Invalid cron format: ${err.message}`);
        return null; // Возвращаем null при ошибке парсинга
    }
};

export const scheduleMessage = async (userId: string, messageText: string, cronFrequency: string, scheduleDateTime: Date): Promise<ScheduledMessage> => {
    // Используем переданное scheduleDateTime для nextRunAt
    // Валидация cronFrequency опциональна, но поле сохраняем для истории
    if (!scheduleDateTime || isNaN(scheduleDateTime.getTime())) {
        throw new Error('Invalid schedule date/time provided.');
    }

    // Проверяем, что дата не в прошлом
    if (scheduleDateTime <= new Date()) {
        throw new Error('Schedule date/time must be in the future.');
    }

    // Создаем запись о запланированном сообщении со статусом Pending
    const newScheduledMessage = scheduledRepository.create({
        userId,
        messageText,
        cronFrequency, // Сохраняем для истории
        status: ScheduleStatus.Pending, // Новый статус по умолчанию
        nextRunAt: scheduleDateTime, // Время выполнения из DatePicker
    });

    // Сохраняем в БД
    await scheduledRepository.save(newScheduledMessage);
    
    console.log(`Message saved as Pending for user ${userId} to run at ${scheduleDateTime.toISOString()} (Cron for history: ${cronFrequency})`);
    return newScheduledMessage;
};

// --- Новая функция для обработки запланированных задач --- 

let isProcessing = false; // Флаг для предотвращения параллельного запуска

export const processPendingMessages = async (): Promise<void> => {
    if (isProcessing) {
        console.log('Polling cycle skipped: previous cycle still running.');
        return;
    }
    isProcessing = true;
    console.log(`Polling DB for pending messages at ${new Date().toISOString()}...`);

    try {
        const now = new Date();
        // Ищем задачи, которые ожидают и время которых (< или =) текущему
        const pendingTasks = await scheduledRepository.find({
            where: {
                status: ScheduleStatus.Pending,
                nextRunAt: LessThanOrEqual(now)
            },
            take: 10 // Обрабатываем пачками для предотвращения перегрузки
        });

        if (pendingTasks.length === 0) {
            console.log('No pending messages found to process.');
            isProcessing = false;
            return;
        }

        console.log(`Found ${pendingTasks.length} pending messages to process.`);

        // Используем Promise.allSettled для параллельной обработки (с осторожностью)
        // или последовательный loop для большей предсказуемости
        for (const task of pendingTasks) {
            console.log(`Processing task ${task.id}...`);
            let success = false;
            let errorMessage: string | undefined = undefined;
            let userEmail: string | undefined = undefined;

            try {
                // 1. Помечаем задачу как Processing
                task.status = ScheduleStatus.Processing;
                task.lastRunAt = new Date();
                await scheduledRepository.save(task);
                console.log(`Task ${task.id} marked as Processing.`);

                // 2. Получаем пользователя
                const user = await userRepository.findOneBy({ id: task.userId });
                if (!user) {
                    throw new Error(`User ${task.userId} not found for task ${task.id}`);
                }
                userEmail = user.email;

                // 3. Отправляем email
                console.log(`Attempting to send email for task ${task.id} to ${userEmail}...`);
                await sendEmail({
                    to: userEmail,
                    subject: 'Ваше запланированное сообщение',
                    html: `<p>Это ваше запланированное сообщение:</p><p>${task.messageText}</p>`,
                });
                success = true;
                console.log(`Email sent successfully for task ${task.id}`);
                task.status = ScheduleStatus.Completed; // Помечаем как выполненную

            } catch (error: any) {
                console.error(`[ERROR] Failed processing task ${task.id}:`, error);
                errorMessage = error.message?.substring(0, 255) || 'Unknown error during processing';
                success = false;
                task.status = ScheduleStatus.Error; // Помечаем как ошибочную
                task.errorMessage = errorMessage;
            } 

            // 4. Записываем историю
            try {
                await recordMessageSent(task.id, userEmail || 'user_not_found', success, errorMessage);
            } catch (historyError) {
                console.error(`[ERROR] Failed to record history for task ${task.id} after processing:`, historyError);
            }

            // 5. Сохраняем финальный статус (Completed/Error)
            try {
                 await scheduledRepository.save(task);
                 console.log(`Task ${task.id} final status saved: ${task.status}`);
            } catch (finalSaveError) {
                console.error(`[ERROR] Failed to save final status for task ${task.id}:`, finalSaveError);
            }
        }

    } catch (error) {
        console.error('[ERROR] Unhandled error during message polling:', error);
    } finally {
        isProcessing = false; // Снимаем флаг блокировки
    }
};

// --- getUserMessageHistory и recordMessageSent остаются без изменений --- 

export const getMessageHistory = async (userId: string): Promise<MessageHistory[]> => {
    const history = await historyRepository.find({
        where: { userId },
        order: { sentAt: 'DESC' }, // Сортируем по дате отправки (сначала новые)
        take: 100, // Ограничиваем количество записей для производительности
    });
    return history;
};

export const recordMessageSent = async (scheduleId: string, recipientEmail: string, success: boolean, errorMessage?: string): Promise<void> => {
    const schedule = await scheduledRepository.findOneBy({ id: scheduleId });
    if (!schedule) {
        console.error(`Scheduled message with id ${scheduleId} not found for recording history.`);
        return; 
    }

    const historyEntry = historyRepository.create({
        userId: schedule.userId,
        messageText: schedule.messageText,
        cronFrequency: schedule.cronFrequency, // Используем сохраненную строку cron
        recipientEmail,
        isSuccess: success,
        errorMessage: errorMessage,
    });
    await historyRepository.save(historyEntry);
    console.log(`Recorded message history for schedule ${scheduleId}, success: ${success}`);
}; 