import os

def get_env_var(key: str, default: str | None = None) -> str:
    value = os.getenv(key, default)
    if value is None:
        raise ValueError(f"Environment variable '{key}' is not set.")
    return value
