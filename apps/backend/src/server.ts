import 'reflect-metadata'; // Обязательно для TypeORM, библиотеки для работы с базами данных
import express, { Request, Response } from 'express'; // Фреймворк для создания веб-сервера
import cors from 'cors'; // Middleware для разрешения кросс-доменных запросов (CORS)
import dotenv from 'dotenv'; // Библиотека для загрузки переменных окружения из .env файла
import { createClient } from 'redis'; // Клиент для подключения к Redis (хранилище ключ-значение в памяти)
import cron from 'node-cron'; // Библиотека для запуска задач по расписанию (cron jobs)
import { initializeDatabase } from './data-source'; // Функция для инициализации подключения к базе данных
import authRoutes from './routes/auth'; // Роуты (маршруты) для аутентификации пользователей
import messageRoutes from './routes/messages'; // Роуты для обработки сообщений
import { processPendingMessages } from './services/messageService'; // Функция для обработки ожидающих сообщений

// Загрузка переменных окружения из файла .env
// dotenv.config(); // Закомментировано, т.к. Render предоставляет переменные окружения напрямую

// Создание экземпляра Express-приложения
const app = express();
// Определение порта для сервера. Берется из переменной окружения PORT или используется 5000 по умолчанию.
const port = process.env.PORT || 5000;

// Логгируем переменную PORT для проверки переменных окружения
console.log(`Используемый PORT: ${port}`);

// Если REDIS_URL не задана, пытаемся собрать URL из REDIS_HOST и REDIS_PORT (с дефолтными значениями).
const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`;

// Выводим используемый URL Redis в лог для отладки
console.log(`Используемый Redis URL: ${redisUrl}`);

export const redisClient = createClient({
    url: redisUrl
    // Если ваш Redis на Render требует пароль, он должен быть частью REDIS_URL.
    // Альтернативно, можно задать пароль отдельно, если библиотека это поддерживает:
    // password: process.env.REDIS_PASSWORD
});

// Обработчик ошибок Redis клиента
redisClient.on('error', (err: Error) => console.error('Ошибка Redis клиента:', err));
// Обработчик успешного подключения к Redis
redisClient.on('connect', () => console.log('Подключено к Redis'));

// Асинхронная функция для запуска сервера
const startServer = async () => {
    // Подключаемся к Redis
    await redisClient.connect();

    // Инициализируем подключение к базе данных
    await initializeDatabase();

    // Подключение Middleware (промежуточного ПО)
    // Настройка CORS: разрешаем запросы с фронтенда (URL берется из переменной окружения)
    app.use(cors({
        origin: process.env.CLIENT_URL, // Разрешить запросы с этого URL
        credentials: true // Разрешить передачу cookies/заголовков авторизации
    }));
    // Middleware для парсинга JSON-тела запросов
    app.use(express.json());

    // Определение Роутов (маршрутов)
    // Роут для проверки "здоровья" бэкенда
    app.get('/health', (req: Request, res: Response) => {
        res.status(200).send('Бэкенд работает! БД и Redis подключены.');
    });

    // Подключаем роуты для аутентификации по префиксу /api/auth
    app.use('/api/auth', authRoutes);
    // Подключаем роуты для сообщений по префиксу /api/messages
    app.use('/api/messages', messageRoutes);

    // Запускаем периодическую проверку базы данных для обработки ожидающих сообщений
    const pollingInterval = 60000; // Интервал: 60000 мс = 60 секунд = 1 минута
    setInterval(() => {
        console.log(`Запуск цикла обработки сообщений (Интервал: ${pollingInterval / 1000}с)`);
        // Вызываем функцию обработки, ловим возможные ошибки
        processPendingMessages().catch(err => {
             console.error('[ОШИБКА] Неперехваченная ошибка в интервале processPendingMessages:', err);
        });
    }, pollingInterval);
    console.log(`Запущена проверка БД на ожидающие сообщения каждые ${pollingInterval / 1000} секунд.`);

    // Запуск сервера на прослушивание указанного порта
    app.listen(port, () => {
        console.log(`Сервер бэкенда запущен на порту ${port}`);

        // --- Демонстрационная Cron Задача ---
        // Пример задачи, выполняющейся по расписанию (каждые 5 минут)
        try {
            // Проверяем, валиден ли шаблон расписания '*/5 * * * *'
            if (cron.validate('*/5 * * * *')) {
                 // Создаем задачу: выводить сообщение в консоль каждые 5 минут
                 cron.schedule('*/5 * * * *', () => {
                     console.log(`[ДЕМО CRON] Проверка работоспособности запущена в ${new Date().toISOString()}`);
                 });
                 console.log('[ДЕМО CRON] Запланирована проверка работоспособности каждые 5 минут.');
            } else {
                 console.error('[ДЕМО CRON] Неверный шаблон cron для проверки работоспособности.');
            }
        } catch (cronError) {
             console.error('[ДЕМО CRON] Не удалось запланировать проверку работоспособности:', cronError);
        }
        // --- Конец Демонстрационной Cron Задачи ---
    });
}

// Запускаем функцию старта сервера и ловим ошибки при запуске
startServer().catch(error => {
    console.error("Не удалось запустить сервер:", error);
    process.exit(1); // Выход из процесса с кодом ошибки
}); 