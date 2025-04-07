import os
import smtplib
from email.mime.text import MIMEText

SMTP_USER: str = os.getenv("SMTP_USER")
SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def send_confirmation_email(email: str, link: str):
    message = MIMEText(f"Для подтверждения регистрации перейдите по ссылке: {link}")
    message["Subject"] = "Подтверждение регистрации"
    message["From"] = SMTP_USER
    message["To"] = email

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, [email], message.as_string())

