require('dotenv').config();
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASSWORD
    }
});

const sendVerificationEmail = (recipient, verificationLink) => {
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipient, 
        subject: 'Верификация вашего аккаунта',
        text: `Пожалуйста, подтвердите вашу электронную почту, перейдя по следующей ссылке: ${verificationLink}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Ошибка при отправке: ' + error);
        }
        console.log('Письмо отправлено: ' + info.response);
    });
};

const recipient = 'recipient@example.com'; 
const verificationLink = 'https://localhost/verify?token=[token]'; 

cron.schedule('0 * * * *', () => {
    console.log('Отправка письма с верификацией...');
    sendVerificationEmail(recipient, verificationLink);
});

console.log('Cron запущен. Письма с верификацией будут отправляться каждый час.');
