import os
import secrets
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file at the top
load_dotenv()


def _require_secret(env_var, default_insecure=None):
    """Get secret from env. Generate a random one if not set (with warning)."""
    value = os.getenv(env_var)
    if value:
        return value
    if default_insecure:
        import logging
        logging.warning(f"⚠️  {env_var} not set! Using auto-generated secret. Set it in .env for production.")
    return secrets.token_urlsafe(64)


class Config:
    SECRET_KEY = _require_secret("SECRET_KEY", default_insecure=True)

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        os.getenv("DATABASE_URL", "sqlite:///doc_ai.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT — short-lived access tokens + long-lived refresh tokens
    JWT_SECRET_KEY = _require_secret("JWT_SECRET_KEY", default_insecure=True)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ["headers"]

    # File uploads
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "app/static/uploads")
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8 MB

    # External APIs
    GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
    LOCATION_DEFAULT_RADIUS = int(os.getenv("LOCATION_DEFAULT_RADIUS", 5000))

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR = os.getenv("LOG_DIR", "logs")

    # Rate limiting
    RATELIMIT_ENABLED = os.getenv("RATELIMIT_ENABLED", "true").lower() == "true"
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "100/60")

    # Input validation
    MAX_STRING_LENGTH = int(os.getenv("MAX_STRING_LENGTH", 1000))
    MAX_PASSWORD_LENGTH = int(os.getenv("MAX_PASSWORD_LENGTH", 128))
    MIN_PASSWORD_LENGTH = int(os.getenv("MIN_PASSWORD_LENGTH", 8))

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")

    # Account security
    MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", 5))
    ACCOUNT_LOCKOUT_MINUTES = int(os.getenv("ACCOUNT_LOCKOUT_MINUTES", 15))


class DevelopmentConfig(Config):
    ENV = "development"
    DEBUG = True
    LOG_LEVEL = "DEBUG"


class ProductionConfig(Config):
    ENV = "production"
    DEBUG = False
    LOG_LEVEL = "INFO"
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PREFERRED_URL_SCHEME = "https"