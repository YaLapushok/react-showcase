import express, { Request, Response, Router } from 'express';
import { sendCommandToDevice } from '../services/deviceService';

const router: Router = express.Router();

// POST /api/device/command
router.post('/command', async (req: Request, res: Response) => {
    const { command } = req.body;

    if (!command || typeof command !== 'string') {
        return res.status(400).json({ message: "Необходимо передать 'command' в теле запроса" });
    }

    try {
        console.log(`[API /device/command] Получена команда от фронта: '${command}'`);
        const result = await sendCommandToDevice(command);
        console.log(`[API /device/command] Ответ от устройства получен: '${result}'`);
        res.status(200).json({ success: true, response: result });
    } catch (error: any) {
        console.error('[API /device/command] Ошибка при отправке команды устройству:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Ошибка взаимодействия с устройством' });
    }
});

export default router;
