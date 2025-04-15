import os
import logging
from fastapi import FastAPI, HTTPException, APIRouter, BackgroundTasks
from .db import (
    UserRegistration,
    does_user_exist,
    create_user,
    login_user,
    confirm_user,
    create_confirmation_token,
    clear_database,
    save_password_reset_token,
    validate_password_reset_token,
    update_user_password,
    get_user_by_email,
    get_user_confirmation_token,
    update_confirmation_token
)
from .email import send_confirmation_email, send_password_reset_email
import redis.asyncio as redis
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)

# Конфигурация
HOST = os.getenv("APP_HOST", "http://localhost")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Создание приложения
app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение к Redis
redis_client = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

@app.on_event("startup")
async def startup_event():
    await redis_client.ping()
    logger.info("Успешное подключение к Redis")

@app.on_event("shutdown")
async def shutdown_event():
    await redis_client.close()
    logger.info("Соединение с Redis закрыто")

# Роутеры
api = APIRouter()

# Функция для кэширования данных пользователя
async def cache_user_data(user_id: int, data: dict, expire_time: int = 3600):
    await redis_client.setex(f"user:{user_id}", expire_time, str(data))

# Функция для получения кэшированных данных пользователя
async def get_cached_user_data(user_id: int):
    data = await redis_client.get(f"user:{user_id}")
    return eval(data) if data else None

# Очистка базы данных (GET метод для простого доступа через браузер)
@api.get("/clear_db")
async def clear_db_get():
    try:
        await clear_database()
        return {"message": "База данных очищена"}
    except Exception as e:
        logger.error(f"Ошибка при очистке базы данных: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при очистке базы данных")


# Очистка базы данных (POST метод остается для совместимости)
@api.post("/clear_db")
async def clear_db_post():
    try:
        await clear_database()
        return {"message": "База данных очищена"}
    except Exception as e:
        logger.error(f"Ошибка при очистке базы данных: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при очистке базы данных")


# Регистрация пользователя
@api.post("/users")
async def post_users(user: UserRegistration, background_tasks: BackgroundTasks):
    logger.info(f"Попытка регистрации: {user.email}")

    # Если email пустой, очищаем базу данных
    if not user.email:
        await clear_database()
        return {
            "status": "success",
            "message": "База данных очищена"
        }

    # Проверяем существование пользователя
    existing_user = await does_user_exist(user.email)
    if existing_user:
        return {
            "status": "error",
            "message": "Пользователь с таким email уже зарегистрирован"
        }

    # Создаем токен подтверждения
    confirmation_token = create_confirmation_token()
    confirmation_link = f"{HOST}/api/v0/confirm_email?token={confirmation_token}"

    # Создаем пользователя
    user_id = await create_user(user, confirmation_token)
    if user_id is None:
        raise HTTPException(status_code=500, detail="Не удалось создать пользователя")

    # Отправляем письмо с подтверждением
    background_tasks.add_task(send_confirmation_email, user.email, confirmation_link)
    logger.info(f"Отправлено письмо с подтверждением на {user.email}")

    return {
        "status": "success",
        "message": "Сообщение с подтверждением отправлено на вашу почту",
        "user_id": user_id
    }


# Подтверждение email
@api.get("/confirm_email")
async def get_confirm_email(token: str):
    logger.info(f"Получен запрос на подтверждение с токеном: {token}")

    if not token:
        raise HTTPException(status_code=400, detail="Неверный формат токена")

    if await confirm_user(token):
        return {"message": "Аккаунт успешно подтвержден"}
    else:
        raise HTTPException(status_code=400, detail="Неверный или просроченный токен")


# Повторная отправка письма с подтверждением
@api.post("/resend_confirmation")
async def resend_confirmation(email: str, background_tasks: BackgroundTasks):
    logger.info(f"Запрос на повторную отправку письма: {email}")

    # Проверяем, есть ли у пользователя токен
    token = await get_user_confirmation_token(email)
    if not token:
        # Если токена нет, создаем новый
        token = await update_confirmation_token(email)
        if not token:
            raise HTTPException(status_code=400, detail="Пользователь не найден или уже активирован")

    # Формируем ссылку для подтверждения
    confirmation_link = f"{HOST}/api/v0/confirm_email?token={token}"

    # Отправляем письмо
    background_tasks.add_task(send_confirmation_email, email, confirmation_link)
    logger.info(f"Повторно отправлено письмо с подтверждением на {email}")

    return {"message": "Письмо с подтверждением отправлено повторно"}


# Вход пользователя
@api.post("/login")
async def login(email: str, password: str):
    logger.info(f"Попытка входа: {email}")

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    if not user["is_active"]:
        raise HTTPException(
            status_code=401,
            detail="Аккаунт не активирован. Пожалуйста, подтвердите email. Если письмо не пришло, запросите повторную отправку."
        )

    if user["password"] != password:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    # Кэшируем данные пользователя
    await cache_user_data(user["id"], {
        "email": email,
        "is_active": user["is_active"],
        "last_login": str(datetime.now())
    })

    logger.info(f"Успешный вход: {email}")
    return {
        "message": "Успешный вход",
        "user_id": user["id"]
    }


# Запрос на сброс пароля
@api.post("/reset_password/request")
async def request_password_reset(email: str, background_tasks: BackgroundTasks):
    logger.info(f"Запрос на сброс пароля: {email}")

    user = await get_user_by_email(email)
    if not user:
        # Не сообщаем, что пользователь не найден, чтобы не раскрывать информацию
        return {"message": "Если email зарегистрирован, на него будет отправлено письмо"}

    # Создаем токен для сброса пароля
    reset_token = create_confirmation_token()
    reset_link = f"{HOST}/api/v0/reset_password?token={reset_token}"

    # Сохраняем токен
    await save_password_reset_token(user["id"], reset_token)

    # Отправляем письмо
    background_tasks.add_task(send_password_reset_email, email, reset_link)
    logger.info(f"Отправлено письмо для сброса пароля на {email}")

    return {"message": "Если email зарегистрирован, на него будет отправлено письмо"}


# Сброс пароля
@api.post("/reset_password")
async def reset_password(token: str, new_password: str):
    logger.info(f"Попытка сброса пароля с токеном: {token}")

    user_id = await validate_password_reset_token(token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Неверный или просроченный токен")

    await update_user_password(user_id, new_password)
    logger.info(f"Пароль успешно сброшен для пользователя {user_id}")

    return {"message": "Пароль успешно изменен"}


# Новый эндпоинт для получения информации о пользователе
@api.get("/users/{user_id}")
async def get_user_info(user_id: int):
    # Сначала проверяем кэш
    cached_data = await get_cached_user_data(user_id)
    if cached_data:
        return cached_data
    
    # Если данных нет в кэше, получаем из базы данных
    user = await get_user_by_email(email)  # Предполагается, что у вас есть функция для получения пользователя по ID
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Кэшируем полученные данные
    user_data = {
        "email": user["email"],
        "is_active": user["is_active"]
    }
    await cache_user_data(user_id, user_data)
    
    return user_data


app.include_router(
    api,
    prefix="/api/v0",
    tags=["users"],
)