import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Простая валидация (можно использовать Joi, class-validator и т.д. для более сложной)
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    if (password.length < 6) { // Пример: минимальная длина пароля
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    // Проверка формата email (очень простая)
    if (!/\S+@\S+\.\S+/.test(email)) {
         return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const user = await authService.registerUser(email, password);
        // Отправляем ответ об успехе, но без данных пользователя (или только id/email)
        // Это более безопасно, чем возвращать все данные после регистрации
        res.status(201).json({ message: 'User registered successfully. Please check your email for verification.', userId: user.id });
    } catch (error: any) {
        // Ловим ошибки из сервиса (например, пользователь уже существует)
        if (error.message === 'User with this email already exists') {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }

    try {
        await authService.verifyEmail(token);
        // В реальном приложении лучше сделать редирект на страницу успеха/логина фронтенда
        // res.redirect(`${process.env.CLIENT_URL}/login?verified=true`); 
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error: any) {
        // Определяем статус в зависимости от ошибки
        let statusCode = 500;
        if (error.message === 'Invalid verification token') {
            statusCode = 400; // Bad Request
        } else if (error.message === 'Verification token expired') {
            statusCode = 410; // Gone
        }
        console.error('Email verification error:', error);
        // В реальном приложении лучше редирект на страницу ошибки фронтенда
        // res.redirect(`${process.env.CLIENT_URL}/verification-error?message=${encodeURIComponent(error.message)}`);
        res.status(statusCode).json({ message: error.message || 'Internal server error during email verification' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const { user, token } = await authService.loginUser(email, password);

        // Отправляем JWT клиенту
        // Вариант 1: В cookie (HttpOnly, Secure в production)
        // res.cookie('jwt', token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production', // Включать secure только для HTTPS
        //     maxAge: 24 * 60 * 60 * 1000, // 1 день (в миллисекундах)
        //     sameSite: 'strict' // или 'lax'
        // });
        // res.status(200).json({ user });

        // Вариант 2: В теле ответа (фронтенд должен сохранить его в localStorage/sessionStorage)
        res.status(200).json({ user, token });

    } catch (error: any) {
        let statusCode = 500;
        if (error.message === 'Invalid email or password' || error.message === 'Please verify your email before logging in') {
            statusCode = 401; // Unauthorized
        }
        console.error('Login error:', error);
        res.status(statusCode).json({ message: error.message || 'Internal server error during login' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        await authService.forgotPassword(email);
        // Всегда возвращаем успешный ответ, независимо от того, существует ли email
        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        // Скрываем внутреннюю ошибку от пользователя
        res.status(500).json({ message: 'Internal server error during password reset request' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Reset token is required' });
    }
    if (!password || !confirmPassword) {
        return res.status(400).json({ message: 'Password and confirmation are required' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        await authService.resetPassword(token, password);
        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message === 'Invalid or expired password reset token') {
            statusCode = 400; // Bad Request (токен невалиден или истек)
        }
        console.error('Reset password error:', error);
        res.status(statusCode).json({ message: error.message || 'Internal server error during password reset' });
    }
};

// TODO: Добавить контроллеры для forgotPassword, resetPassword 