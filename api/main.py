import os
import secrets
import logging
from typing import Annotated

from fastapi import FastAPI, HTTPException, BackgroundTasks, APIRouter
from .db import UserRegistration, does_user_exist, create_user, update_user_to_active
from .email import send_confirmation_email

# Конфигурация
HOST = os.getenv("APP_HOST", "http://localhost:3000")
logger = logging.getLogger(__name__)


# Генерация токена
def create_user_confirmation_token() -> str:
    return secrets.token_urlsafe(32)


# Создание приложения
app = FastAPI()

# Роутеры
api = APIRouter()


@api.get("/confirm_email")
async def get_confirm_email(token: str):
    if not token or len(token) != 43:
        raise HTTPException(status_code=400, detail="Invalid token format")

    if await update_user_to_active(token) is None:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    return {"message": "Account confirmed successfully"}


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


# Подключение роутера
app.include_router(
    api,
    prefix="/api/v0",
    tags=["users"],
)