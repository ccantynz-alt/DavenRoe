"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "DavenRoe"
    app_version: str = "0.1.0"
    debug: bool = False
    secret_key: str = "change-me-in-production"

    # Database (Neon PostgreSQL)
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/astra"

    # AI
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"

    # Banking — Plaid (US/Canada)
    plaid_client_id: str = ""
    plaid_secret: str = ""
    plaid_env: str = "sandbox"

    # Banking — Basiq (AU/NZ)
    basiq_api_key: str = ""

    # Banking — TrueLayer (UK/EU)
    truelayer_client_id: str = ""
    truelayer_client_secret: str = ""
    truelayer_redirect_uri: str = "http://localhost:3000/callback/truelayer"

    # Email
    mailgun_api_key: str = ""
    mailgun_domain: str = ""

    # Payments
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Auth
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:3001"

    # Rate limiting
    rate_limit_per_minute: int = 60

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.secret_key == "change-me-in-production":
        import warnings
        warnings.warn(
            "SECRET_KEY is still the default value. "
            "Set a strong SECRET_KEY environment variable before deploying to production.",
            stacklevel=2,
        )
    return s
