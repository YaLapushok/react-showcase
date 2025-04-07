import os
import smtplib
from email.mime.text import MIMEText
import logging

# Настройки SMTP
SMTP_USER: str = os.getenv("SMTP_USER")
SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

logger = logging.getLogger(__name__)

def send_confirmation_email(email: str, link: str):
    """
    Отправляет email с ссылкой для подтверждения регистрации.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP credentials are not set. Check SMTP_USER and SMTP_PASSWORD environment variables.")

    # HTML-шаблон письма
    html_content = f"""
    <html>
      <body>
        <h1>Подтверждение регистрации</h1>
        <p>Для завершения регистрации перейдите по ссылке:</p>
        <p><a href="{link}">Подтвердить email</a></p>
        <p>Если вы не регистрировались, проигнорируйте это письмо.</p>
      </body>
    </html>
    """

    # Создаем сообщение
    message = MIMEText(html_content, "html")
    message["Subject"] = "Подтверждение регистрации"
    message["From"] = SMTP_USER
    message["To"] = email

    # Отправляем письмо
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SM_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [email], message.as_string())
        logger.info(f"Confirmation email successfully sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {e}")
        raise RuntimeError(f"Failed to send email: {e}")


def send_password_reset_email(email: str, reset_link: str):
    """
    Отправляет email с ссылкой для сброса пароля.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP credentials are not set. Check SMTP_USER and SMTP_PASSWORD environment variables.")

    # HTML-шаблон письма
    html_content = f"""
    <html>
      <body>
        <h1>Сброс пароля</h1>
        <p>Для сброса пароля перейдите по ссылке:</p>
        <p><a href="{reset_link}">Сбросить пароль</a></p>
        <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
      </body>
    </html>
    """

    # Создаем сообщение
    message = MIMEText(html_content, "html")
    message["Subject"] = "Сброс пароля"
    message["From"] = SMTP_USER
    message["To"] = email

    # Отправляем письмо
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [email], message.as_string())
        logger.info(f"Password reset email successfully sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        raise RuntimeError(f"Failed to send email: {e}")