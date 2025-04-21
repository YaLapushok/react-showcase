import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authenticateJWT } from '../middleware/authMiddleware'; // Импортируем middleware

const router = Router();

// Применяем middleware ко всем роутам в этом файле
router.use(authenticateJWT);

// POST /api/messages/schedule
router.post('/schedule', messageController.scheduleNewMessage);

// GET /api/messages/history
router.get('/history', messageController.getUserMessageHistory);

// TODO: Добавить роуты для получения запланированных, отмены, паузы задач.

export default router; 