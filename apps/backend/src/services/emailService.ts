import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html: string;
}

export const sendEmail = async (options: MailOptions) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM, // Адрес отправителя из .env
            to: options.to,
            subject: options.subject,
            text: options.text, // Опционально: текстовая версия
            html: options.html, // HTML версия письма
        });
        console.log('Message sent: %s', info.messageId);
        // Можно вернуть info для дальнейшей обработки
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Обработка ошибок отправки
        // В реальном приложении здесь может быть логирование или другая логика
        throw new Error('Could not send email');
    }
};

export const sendVerificationEmail = async (email: string, token: string) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    const subject = 'Подтверждение регистрации';
    const html = `
        <p>Здравствуйте!</p>
        <p>Для завершения регистрации, пожалуйста, перейдите по ссылке:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
    `;

    await sendEmail({ to: email, subject, html });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const subject = 'Сброс пароля';
    const html = `
        <p>Здравствуйте!</p>
        <p>Вы (или кто-то другой) запросили сброс пароля для вашего аккаунта.</p>
        <p>Для установки нового пароля, пожалуйста, перейдите по ссылке:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Ссылка действительна в течение 1 часа.</p>
        <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
    `;

    await sendEmail({ to: email, subject, html });
};

// TODO: Добавить функцию sendPasswordResetEmail 