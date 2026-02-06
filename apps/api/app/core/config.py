"""Application configuration using pydantic-settings."""

import json
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
    debug: bool = False

    # CORS — stored as string, parsed via get_allowed_origins()
    allowed_origins: str = "http://localhost:3000,chrome-extension://*"

    def get_allowed_origins(self) -> List[str]:
        """Parse allowed_origins from JSON array or comma-separated string."""
        try:
            parsed = json.loads(self.allowed_origins)
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
        return [s.strip() for s in self.allowed_origins.split(",") if s.strip()]

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
