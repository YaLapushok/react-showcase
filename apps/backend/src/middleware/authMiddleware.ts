import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Получаем секрет из .env или используем дефолтный (должен совпадать с тем, что в authService)
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

// Расширяем интерфейс Request из Express, чтобы добавить свойство user
// Можно вынести в отдельный файл types/express/index.d.ts для глобального использования
declare global {
    namespace Express {
        interface Request {
            user?: any; // Тип any пока для простоты, лучше определить интерфейс для payload
        }
    }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;

    if (authHeader) {
        // Токен обычно передается в формате "Bearer TOKEN"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access token is missing or invalid' });
        }

        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (err) {
                // Если ошибка верификации (например, токен истек или невалиден)
                console.error('JWT Verification Error:', err.message);
                // Не отправляем детали ошибки клиенту из соображений безопасности
                return res.status(403).json({ message: 'Forbidden: Invalid or expired token' }); // 403 Forbidden
            }

            // Если токен валиден, добавляем payload (данные пользователя) к объекту запроса
            req.user = user;
            next(); // Передаем управление следующему middleware или обработчику роута
        });
    } else {
        // Если заголовок Authorization отсутствует
        res.status(401).json({ message: 'Authorization header is missing' }); // 401 Unauthorized
    }
}; 