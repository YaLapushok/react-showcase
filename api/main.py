import os
import secrets
import logging
from typing import Annotated

from fastapi import FastAPI, HTTPException, BackgroundTasks, APIRouter
from .db import (
    UserRegistration,
    does_user_exist,
    create_user,
    update_user_to_active,
    save_password_reset_token,
    validate_password_reset_token,
    update_user_password,
    get_connection,
)
from .email import send_confirmation_email, send_password_reset_email

# Конфигурация
HOST = os.getenv("APP_HOST", "http://localhost")
logger = logging.getLogger(__name__)

# Генерация токена
def create_user_confirmation_token() -> str:
    return secrets.token_urlsafe(32)

def create_password_reset_token() -> str:
    return secrets.token_urlsafe(32)

# Создание приложения
app = FastAPI()

# Роутеры
api = APIRouter()

# Подтверждение email
@api.get("/confirm_email")
async def get_confirm_email(token: str):
    if not token or len(token) != 43:
        raise HTTPException(status_code=400, detail="Invalid token format")

    if await update_user_to_active(token) is None:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    return {"message": "Account confirmed successfully"}

# Регистрация пользователя
@api.post("/users")
async def post_users(user: UserRegistration, background_tasks: BackgroundTasks):
    logger.info(f"Received user registration request: {user}")

    if await does_user_exist(user.email):
        logger.warning(f"User with email {user.email} already exists")
        raise HTTPException(status_code=400, detail="Email already registered")

    confirmation_token = create_user_confirmation_token()
    confirmation_link = f"{HOST}/confirm_email?token={confirmation_token}"

    user_id = await create_user(user, confirmation_token)
    if user_id is None:
        logger.error("Failed to create a new user")
        raise HTTPException(status_code=500, detail="Failed to create a new user")

    background_tasks.add_task(send_confirmation_email, user.email, confirmation_link)
    logger.info(f"Confirmation email sent to {user.email}")
    return {"message": "Confirmation email sent", "user_id": user_id}

# Запрос на сброс пароля
@api.post("/reset_password/request")
async def request_password_reset(email: str, background_tasks: BackgroundTasks):
    logger.info(f"Received password reset request for email: {email}")

    # Проверяем, существует ли пользователь с таким email
    async with get_connection() as connection:
        user_id = await connection.fetchval(
            "SELECT id FROM users WHERE email = $1", email
        )
        if not user_id:
            logger.warning(f"User with email {email} not found")
            raise HTTPException(status_code=404, detail="User not found")

    # Генерация токена и ссылки для сброса пароля
    reset_token = create_password_reset_token()
    reset_link = f"{HOST}/reset_password?token={reset_token}"

    # Сохраняем токен в базе данных
    try:
        await save_password_reset_token(user_id, reset_token)
    except Exception as e:
        logger.error(f"Failed to save password reset token: {e}")
        raise HTTPException(status_code=500, detail="Failed to save reset token")

    # Отправляем письмо через background_tasks
    try:
        background_tasks.add_task(send_password_reset_email, email, reset_link)
        logger.info(f"Password reset email task added for email: {email}")
    except Exception as e:
        logger.error(f"Failed to add email task: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset email")

    return {"message": "Password reset email sent"}

# Сброс пароля
@api.post("/reset_password")
async def reset_password(token: str, new_password: str):
    logger.info(f"Received password reset attempt with token: {token}")
    user_id = await validate_password_reset_token(token)
    if not user_id:
        logger.warning(f"Invalid or expired token: {token}")
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    await update_user_password(user_id, new_password)

    logger.info(f"Password successfully reset for user_id: {user_id}")
    return {"message": "Password reset successfully"}

app.include_router(
    api,
    prefix="/api/v0",
    tags=["users"],
)