import secrets
from typing import Annotated

from fastapi import FastAPI, HTTPException, BackgroundTasks, APIRouter

from .db import UserRegistration, does_user_exist, create_user, update_user_to_active
from .email import send_confirmation_email


HOST = "http://localhost:3000"


def create_user_confirmation_token() -> str:
    return secrets.token_urlsafe(32)


app = FastAPI()


@app.get("/confirm_email")
async def get_confirm_email(token: str):
    if await update_user_to_active(token) is None:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    return {"message": "Account confirmed successfully"}


api = APIRouter()


@api.post("/users")
async def post_users(user: UserRegistration, background_tasks: BackgroundTasks):
    if await does_user_exist(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # NOTE: `confirmation_token` is assumed to be URL-safe
    confirmation_token = create_user_confirmation_token()
    confirmation_link = f"{HOST}/confirm_email?token={confirmation_token}"

    user_id = await create_user(user, confirmation_token)
    assert user_id is not None, "Failed to create a new user"

    background_tasks.add_task(send_confirmation_email, user.email, confirmation_link)

    return {"message": "Confirmation email sent", "user_id": user_id}


app.include_router(
    api,
    prefix="/api/v0",
    tags=["users"],
)
