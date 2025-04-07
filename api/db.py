import os
from contextlib import asynccontextmanager

import asyncpg
from pydantic import BaseModel


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