"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    environment: str = "development"
    port: int = 3001
    debug: bool = True

    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",  # Dashboard dev
        "chrome-extension://*",  # Extension (any extension ID)
    ]

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # AI Providers (for later stories)
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # Stripe (subscription billing)
    stripe_mock_mode: bool = True  # MVP default
    stripe_secret_key: str | None = None  # For future real integration
    stripe_webhook_secret: str | None = None  # For future webhooks


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
