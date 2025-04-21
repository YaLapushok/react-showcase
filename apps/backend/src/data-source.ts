import 'dotenv/config'; // Убедимся, что .env загружен
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/User'; // Раскомментируем
import { MessageHistory } from './entities/MessageHistory'; // Раскомментируем
import { ScheduledMessage } from './entities/ScheduledMessage'; // Добавлен импорт

// Импортируем сущности (путь будет создан позже)
// import { User } from './entities/User';
// import { MessageHistory } from './entities/MessageHistory';

const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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