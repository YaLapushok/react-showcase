from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
import asyncpg
import secrets
import smtplib
from email.mime.text import MIMEText
from typing import Optional
import os

app = FastAPI(root_path="/v0")

# SMTP configuration
SMTP_USER = os.getenv("SMTP_USER")  # Укажите ваш email (например, xxx@gmail.com)
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # Укажите пароль от email
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

DATABASE_URL = "postgresql://postgres:postgres@db:5432/postgres"

# Функция для создания подключения к базе данных
async def get_db_connection():
    return await asyncpg.connect(DATABASE_URL)

# Модель данных для регистрации пользователя
class UserRegistration(BaseModel):
    username: str
    email: str
    password: str

# Функция для отправки email
def send_confirmation_email(email: str, token: str):
    confirmation_link = f"http://localhost:3000/confirm?token={token}"  # Ссылка на подтверждение
    msg = MIMEText(f"Для подтверждения регистрации перейдите по ссылке: {confirmation_link}")
    msg["Subject"] = "Подтверждение регистрации"
    msg["From"] = SMTP_USER
    msg["To"] = email

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, [email], msg.as_string())

# Эндпоинт для регистрации пользователя
@app.post("/register")
async def register_user(user: UserRegistration, background_tasks: BackgroundTasks):
    conn = await get_db_connection()

    try:
        # Проверяем, существует ли пользователь с таким email
        query_check_email = "SELECT id FROM users WHERE email = $1"
        existing_user = await conn.fetchrow(query_check_email, user.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Генерируем уникальный токен
        confirmation_token = secrets.token_urlsafe(32)

        # Вставляем нового пользователя в базу данных
        query_insert_user = """
        INSERT INTO users (username, email, password, confirmation_token, is_active)
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING id
        """
        new_user = await conn.fetchrow(query_insert_user, user.username, user.email, user.password, confirmation_token)

        # Отправляем письмо с подтверждением (в фоне)
        background_tasks.add_task(send_confirmation_email, user.email, confirmation_token)

        return {"message": "Confirmation email sent", "user_id": new_user["id"]}

    finally:
        await conn.close()

# Эндпоинт для подтверждения регистрации
@app.get("/confirm")
async def confirm_registration(token: str):
    conn = await get_db_connection()

    try:
        # Ищем пользователя с таким токеном
        query_confirm_user = """
        UPDATE users
        SET is_active = TRUE, confirmation_token = NULL
        WHERE confirmation_token = $1 AND is_active = FALSE
        RETURNING id
        """
        confirmed_user = await conn.fetchrow(query_confirm_user, token)

        if not confirmed_user:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        return {"message": "Account confirmed successfully"}

    finally:
        await conn.close()