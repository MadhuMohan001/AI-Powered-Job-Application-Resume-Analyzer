"""Application settings, loaded from environment variables / .env file."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://resume:resume@localhost:5432/resume_analyzer"
    secret_key: str = "dev-only-insecure-key-change-me"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    max_upload_mb: int = 5

    llm_provider: str = "anthropic"  # "anthropic" or "mock"
    llm_model: str = "claude-sonnet-5-5"
    anthropic_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
