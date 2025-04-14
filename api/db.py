import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import asyncpg
from pydantic import BaseModel
import secrets
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)


async def connect_to_database():
    DATABASE_URL = "postgresql://postgres:postgres@db:5432/postgres"
    connection = await asyncpg.connect(DATABASE_URL)

    # Создаем таблицы только если они не существуют
    await connection.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            confirmation_token VARCHAR(255) UNIQUE,
            is_active BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    return connection


@asynccontextmanager
async def get_connection():
    connection = await connect_to_database()
    try:
        yield connection
    finally:
        await connection.close()


class UserRegistration(BaseModel):
    username: str
    email: str
    password: str


def create_confirmation_token() -> str:
    return secrets.token_urlsafe(32)


async def does_user_exist(email: str) -> dict | None:
    async with get_connection() as connection:
        user = await connection.fetchrow(
            """
            SELECT id, email, is_active, confirmation_token 
            FROM users 
            WHERE email = $1
            """,
            email
        )
        if user:
            logger.info(f"Пользователь найден: {user}")
        else:
            logger.info(f"Пользователь не найден: {email}")
        return user


async def create_user(user: UserRegistration, confirmation_token: str) -> int | None:
    async with get_connection() as connection:
        try:
            # Проверяем существование пользователя перед созданием
            existing_user = await connection.fetchrow(
                "SELECT id FROM users WHERE email = $1",
                user.email
            )
            if existing_user:
                logger.warning(f"Пользователь уже существует: {user.email}")
                return None

            # Создаем нового пользователя
            logger.info(f"Создаю пользователя с токеном: {confirmation_token}")
            user_id = await connection.fetchrow(
                """
                INSERT INTO users (username, email, password, confirmation_token, is_active)
                VALUES ($1, $2, $3, $4, FALSE)
                RETURNING id, confirmation_token
                """,
                user.username,
                user.email,
                user.password,
                confirmation_token
            )
            logger.info(f"Создан новый пользователь: id={user_id['id']}, token={user_id['confirmation_token']}")
            return user_id["id"]
        except Exception as e:
            logger.error(f"Ошибка при создании пользователя: {e}")
            return None


async def confirm_user(token: str) -> bool:
    async with get_connection() as connection:
        try:
            result = await connection.execute(
                """
                UPDATE users 
                SET is_active = TRUE, confirmation_token = NULL
                WHERE confirmation_token = $1 AND is_active = FALSE
                """,
                token
            )
            if result == "UPDATE 1":
                logger.info(f"Пользователь подтвержден с токеном: {token}")
                return True
            else:
                logger.warning(f"Не удалось подтвердить пользователя с токеном: {token}")
                return False
        except Exception as e:
            logger.error(f"Ошибка при подтверждении пользователя: {e}")
            return False


async def login_user(email: str, password: str) -> dict | None:
    async with get_connection() as connection:
        user = await connection.fetchrow(
            """
            SELECT id, email, password, is_active 
            FROM users 
            WHERE email = $1 AND password = $2
            """,
            email, password
        )
        if user:
            if not user["is_active"]:
                logger.info(f"Попытка входа в неактивированный аккаунт: {email}")
                return None
            logger.info(f"Успешный вход: {user['email']}")
        else:
            logger.info(f"Неудачная попытка входа: {email}")
        return user


# Функция для ручной очистки базы данных
async def clear_database():
    async with get_connection() as connection:
        try:
            # Очищаем все таблицы
            await connection.execute("DROP TABLE IF EXISTS password_reset_tokens CASCADE")
            await connection.execute("DROP TABLE IF EXISTS users CASCADE")
            logger.info("База данных очищена")

            # Пересоздаем таблицы
            await connection.execute(
                """
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    confirmation_token VARCHAR(255) UNIQUE,
                    is_active BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            await connection.execute(
                """
                CREATE TABLE password_reset_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            logger.info("Таблицы пересозданы")
        except Exception as e:
            logger.error(f"Ошибка при очистке базы данных: {e}")
            raise


async def save_password_reset_token(user_id: int, token: str):
    async with get_connection() as connection:
        expires_at = datetime.utcnow() + timedelta(hours=1)
        await connection.execute(
            """
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES ($1, $2, $3)
            """,
            user_id, token, expires_at
        )


async def validate_password_reset_token(token: str) -> int | None:
    async with get_connection() as connection:
        record = await connection.fetchrow(
            """
            SELECT user_id FROM password_reset_tokens
            WHERE token = $1 AND expires_at > NOW()
            """,
            token
        )
        if record:
            return record["user_id"]
        return None


async def update_user_password(user_id: int, new_password: str):
    async with get_connection() as connection:
        await connection.execute(
            """
            UPDATE users
            SET password = $1
            WHERE id = $2
            """,
            new_password, user_id
        )


async def get_user_by_email(email: str) -> dict | None:
    async with get_connection() as connection:
        user = await connection.fetchrow(
            """
            SELECT id, email, password, is_active 
            FROM users 
            WHERE email = $1
            """,
            email
        )
        return user


async def get_user_confirmation_token(email: str) -> str | None:
    async with get_connection() as connection:
        user = await connection.fetchrow(
            """
            SELECT confirmation_token 
            FROM users 
            WHERE email = $1 AND is_active = FALSE
            """,
            email
        )
        if user:
            return user["confirmation_token"]
        return None


async def update_confirmation_token(email: str) -> str | None:
    async with get_connection() as connection:
        new_token = create_confirmation_token()
        result = await connection.execute(
            """
            UPDATE users 
            SET confirmation_token = $1
            WHERE email = $2 AND is_active = FALSE
            """,
            new_token, email
        )
        if result == "UPDATE 1":
            return new_token
        return None
