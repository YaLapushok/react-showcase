import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import nodeCron from 'node-cron';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Заглушки для роутов
app.get('/', (req, res) => {
  res.send('Backend работает!');
});

// TODO: app.use('/api/auth', ...)
// TODO: app.use('/api/email', ...)

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('MongoDB подключена'))
  .catch((err) => console.error('Ошибка MongoDB:', err));

// Подключение к Redis
const redisClient = createClient({
  url: process.env.REDIS_URL
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().then(() => console.log('Redis подключен'));

// Пример cron-задачи
nodeCron.schedule('* * * * *', () => {
  console.log('Cron работает каждую минуту');
});

app.listen(port, () => {
  console.log(`Backend запущен на порту ${port}`);
}); 