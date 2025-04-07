import os
from contextlib import closing

import asyncpg
from pydantic import BaseModel


POSTGRES_DB = os.getenv("POSTGRES_DB") 
POSTGRES_USER = os.getenv("POSTGRES_USER") 
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD") 
POSTGRES_PORT = os.getenv("POSTGRES_PORT") or 1221


async def connect_to_database():
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@db:{POSTGRES_PORT}/{POSTGRES_DB}"
    return await asyncpg.connect(DATABASE_URL)


class UserRegistration(BaseModel):
    username: str
    email: str
    password: str


async def does_user_exist(email: str) -> bool:
    with closing(await connect_to_database()) as connection:
        user_id = await connection.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            email
        )
        return user_id is not None


async def create_user(user: UserRegistration, confirmation_token: str) -> int | None:
    with closing(await connect_to_database()) as connection:
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
    with closing(await connect_to_database()) as connection:
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

