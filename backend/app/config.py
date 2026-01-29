import os

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Settings(BaseModel):
    redis_url: str = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
    ai_builder_api_url: str = os.getenv(
        "AI_BUILDER_API_URL", "https://space.ai-builders.com/backend/v1/chat/completions"
    )
    ai_builder_api_key: str | None = os.getenv("AI_BUILDER_API_KEY")
    ai_builder_model: str = os.getenv("AI_BUILDER_MODEL", "grok-4-fast")
    preload_secret: str | None = os.getenv("PRELOAD_SECRET")
    allow_debug_users: bool = os.getenv("ALLOW_DEBUG_USERS", "false").lower() == "true"
    session_ttl_days: int = int(os.getenv("SESSION_TTL_DAYS", "7"))
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")


settings = Settings()
