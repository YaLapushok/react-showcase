import os
from contextlib import asynccontextmanager
import datetime
import asyncpg
from pydantic import BaseModel
import secrets


async def connect_to_database():
    DATABASE_URL = "postgresql://postgres:postgres@db:5432/postgres"
    connection = await asyncpg.connect(DATABASE_URL)

    # Проверяем существование таблицы users
    table_exists = await connection.fetchval(
        """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'users'
        );
        """
    )

    if not table_exists:
        print("Creating table 'users'")
        await connection.execute(
            """
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                confirmation_token VARCHAR(255),
                is_active BOOLEAN DEFAULT FALSE
            );
            """
        )

    # Проверяем существование таблицы password_reset_tokens
    tokens_table_exists = await connection.fetchval(
        """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'password_reset_tokens'
        );
        """
    )

    if not tokens_table_exists:
        print("Creating table 'password_reset_tokens'")
        await connection.execute(
            """
            CREATE TABLE password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL
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


async def does_user_exist(email: str) -> bool:
    async with get_connection() as connection:
        user_id = await connection.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            email
        )
        return user_id is not None


async def create_user(user: UserRegistration, confirmation_token: str) -> int | None:
    async with get_connection() as connection:
        user_id = await connection.fetchrow(
            """
            INSERT INTO users (username, email, password, confirmation_token, is_active)
            VALUES ($1, $2, $3, $4, FALSE)
            RETURNING id
            """,
            user.username,
            user.email,
            user.password,
            confirmation_token,
        )
        return user_id


async def update_user_to_active(confirmation_token: str) -> int | None:
    async with get_connection() as connection:
        user_id = await connection.fetchrow(
            """
            UPDATE users
            SET is_active = TRUE, confirmation_token = NULL
            WHERE confirmation_token = $1 AND is_active = FALSE
            RETURNING id
            """,
            confirmation_token,
        )
        return user_id


def create_password_reset_token() -> str:
    return secrets.token_urlsafe(32)


async def save_password_reset_token(user_id: int, token: str):
    async with get_connection() as connection:
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
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