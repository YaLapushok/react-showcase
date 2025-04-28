import 'dotenv/config'; // Убедимся, что .env загружен
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/User'; // Раскомментируем
import { MessageHistory } from './entities/MessageHistory'; // Раскомментируем
import { ScheduledMessage } from './entities/ScheduledMessage'; // Добавлен импорт

// Импортируем сущности (путь будет создан позже)
// import { User } from './entities/User';
// import { MessageHistory } from './entities/MessageHistory';

// Логгируем DATABASE_URL для отладки
console.log(`DATABASE_URL из окружения: ${process.env.DATABASE_URL}`);

const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    // Приоритет отдаем DATABASE_URL, если он задан (стандарт для Heroku, Render и др.)
    url: process.env.DATABASE_URL,
    // Остальные параметры будут использоваться, только если DATABASE_URL не предоставлен
    host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'db'),
    port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
    password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
    database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined, // Включаем SSL для удаленных БД (Render обычно требует)
    synchronize: true, // В разработке можно true, для production лучше использовать миграции (false)
    logging: false, // Можно включить для отладки SQL запросов
    entities: [User, MessageHistory, ScheduledMessage], // Явно перечисляем сущности
    migrations: [], // Путь к миграциям (если будут)
    subscribers: [], // Путь к подписчикам (если будут)
};

export const AppDataSource = new DataSource(dataSourceOptions);

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
    } catch (err) {
        console.error("Error during Data Source initialization:", err);
        process.exit(1); // Выход, если БД недоступна
    }
}; 