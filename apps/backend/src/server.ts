import 'reflect-metadata'; // Required for TypeORM
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import cron from 'node-cron'; // <--- Импортируем node-cron для демо-задачи
import { initializeDatabase } from './data-source'; // Импорт инициализатора БД
import authRoutes from './routes/auth'; // Импорт роутов аутентификации
import messageRoutes from './routes/messages'; // Импорт роутов сообщений
// Импортируем новый обработчик для polling
import { processPendingMessages } from './services/messageService'; 

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Инициализация Redis клиента
export const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`
    // password: process.env.REDIS_PASSWORD // Раскомментировать, если есть пароль
});

redisClient.on('error', (err: Error) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

const startServer = async () => {
    // Подключаемся к Redis
    await redisClient.connect();

    // Подключаемся к БД
    await initializeDatabase(); 

    // Middleware
    app.use(cors({ 
        origin: process.env.CLIENT_URL, // Allow requests from frontend
        credentials: true // If you need to handle cookies/sessions
    }));
    app.use(express.json()); // Parse JSON bodies

    // Routes
    app.get('/health', (req: Request, res: Response) => {
        res.status(200).send('Backend is healthy! DB and Redis connected.');
    });

    // Подключаем роуты аутентификации
    app.use('/api/auth', authRoutes);
    // Подключаем роуты сообщений
    app.use('/api/messages', messageRoutes);

    // Запускаем периодический опрос БД для обработки сообщений
    const pollingInterval = 60000; // Раз в 60 секунд (1 минута)
    setInterval(() => {
        console.log(`Triggering message processing cycle (Interval: ${pollingInterval / 1000}s)`);
        processPendingMessages().catch(err => {
             console.error('[ERROR] Uncaught error in processPendingMessages interval:', err);
        });
    }, pollingInterval);
    console.log(`Started DB polling for pending messages every ${pollingInterval / 1000} seconds.`);

    app.listen(port, () => {
        console.log(`Backend server listening on port ${port}`);
        
        // --- Демонстрационная Cron Задача --- 
        try {
            if (cron.validate('*/5 * * * *')) { // Проверяем валидность строки
                 cron.schedule('*/5 * * * *', () => {
                     console.log(`[DUMMY CRON JOB] Heartbeat check running at ${new Date().toISOString()}`);
                 });
                 console.log('[DUMMY CRON JOB] Scheduled heartbeat check to run every 5 minutes.');
            } else {
                 console.error('[DUMMY CRON JOB] Invalid cron pattern for heartbeat check.');
            }
        } catch (cronError) {
             console.error('[DUMMY CRON JOB] Failed to schedule heartbeat check:', cronError);
        }
        // --- Конец Демонстрационной Cron Задачи ---
    });
}

startServer().catch(error => {
    console.error("Failed to start the server:", error);
    process.exit(1);
}); 