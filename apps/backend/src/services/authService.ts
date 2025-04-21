import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'; // Импорт JWT
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';

const userRepository = AppDataSource.getRepository(User);
const SALT_ROUNDS = 10; // Количество раундов для bcrypt
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24; // Время жизни токена верификации
const RESET_TOKEN_EXPIRY_MINUTES = 60; // Время жизни токена сброса (60 минут)
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret'; // Секрет для JWT
const JWT_EXPIRES_IN = '1d'; // Время жизни JWT (например, 1 день)

export const registerUser = async (email: string, password: string): Promise<User> => {
    // 1. Проверка, существует ли пользователь
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
        // Можно уточнить ошибку: если пользователь есть, но не верифицирован, 
        // возможно, стоит переотправить письмо верификации?
        // Пока просто кидаем ошибку.
        throw new Error('User with this email already exists');
    }

    // 2. Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Генерация токена верификации
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

    // 4. Создание и сохранение пользователя
    const newUser = userRepository.create({
        email,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpires,
        isVerified: false, // По умолчанию false
    });

    await userRepository.save(newUser);

    // 5. Отправка письма верификации (без ожидания завершения для быстрого ответа API)
    sendVerificationEmail(newUser.email, verificationToken)
        .catch(err => {
            // Важно логировать ошибки отправки email
            console.error(`Failed to send verification email to ${newUser.email}:`, err);
            // Можно добавить механизм повторной отправки или уведомление администратора
        });

    // Возвращаем пользователя без пароля и токенов (или с ними, в зависимости от логики)
    // Для безопасности лучше не возвращать токены и пароль
    // Создаем новый объект только с необходимыми полями
    const userResponse: Partial<User> = {
        id: newUser.id,
        email: newUser.email,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
        // Другие безопасные поля, если они есть
    };

    return userResponse as User; // Возвращаем объект с частичным набором полей
};

export const verifyEmail = async (token: string): Promise<boolean> => {
    // 1. Найти пользователя по токену
    const user = await userRepository.findOne({
        where: {
            verificationToken: token,
        }
    });

    // 2. Проверить, найден ли пользователь и валиден ли токен
    if (!user) {
        throw new Error('Invalid verification token');
    }

    // 3. Проверить срок действия токена
    if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
        // Можно добавить логику переотправки токена, если он истек
        await userRepository.remove(user); // Удаляем пользователя с истекшим токеном, чтобы он мог зарегистрироваться снова
        throw new Error('Verification token expired');
    }

    // 4. Обновить пользователя: подтвердить email и очистить поля токена
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;

    await userRepository.save(user);

    return true; // Успешная верификация
};

export const loginUser = async (email: string, password: string): Promise<{ user: Partial<User>, token: string }> => {
    // 1. Найти пользователя по email
    const user = await userRepository.findOneBy({ email });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // 2. Проверить, верифицирован ли пользователь
    if (!user.isVerified) {
        throw new Error('Please verify your email before logging in');
    }

    // 3. Сравнить пароль
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error('Invalid email or password');
    }

    // 4. Генерация JWT
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 5. Возвращаем пользователя (без секретных данных) и токен
    const userResponse: Partial<User> = {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };

    return { user: userResponse, token };
};

export const forgotPassword = async (email: string): Promise<void> => {
    const user = await userRepository.findOneBy({ email });

    // Если пользователь найден и верифицирован
    if (user && user.isVerified) {
        // Генерация токена сброса
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordTokenExpires = new Date();
        resetPasswordTokenExpires.setMinutes(resetPasswordTokenExpires.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

        // Сохранение токена и времени жизни в БД
        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpires = resetPasswordTokenExpires;
        await userRepository.save(user);

        // Отправка email (без ожидания)
        sendPasswordResetEmail(user.email, resetToken)
            .catch(err => {
                console.error(`Failed to send password reset email to ${user.email}:`, err);
            });
    }
    // Важно: Не сообщаем пользователю, найден ли email или нет, из соображений безопасности.
    // Просто говорим, что если email есть, письмо отправлено.
};

export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    // 1. Найти пользователя по токену сброса
    const user = await userRepository.findOne({
        where: {
            resetPasswordToken: token,
        }
    });

    // 2. Проверить токен и срок его действия
    if (!user || !user.resetPasswordTokenExpires || user.resetPasswordTokenExpires < new Date()) {
        throw new Error('Invalid or expired password reset token');
    }

    // 3. Хеширование нового пароля
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 4. Обновление пароля и очистка полей токена
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpires = null;

    await userRepository.save(user);

    return true; // Успешный сброс
};

// TODO: Добавить функции forgotPassword, resetPassword 