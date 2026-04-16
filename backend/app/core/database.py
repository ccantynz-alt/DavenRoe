"""Async database engine and session management.

Uses Neon PostgreSQL (serverless) with asyncpg driver.
Lazy initialization so the app starts on Vercel serverless
even when PostgreSQL is not yet configured.
"""

import logging
import re
import ssl
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Lazy engine — only created when a DB route is actually called
_engine = None
_async_session = None


def _clean_neon_url(url: str) -> str:
    """Clean a Neon connection string for use with asyncpg.

    Handles:
    - Converting postgresql:// to postgresql+asyncpg://
    - Removing sslmode parameter (asyncpg uses ssl context instead)
    - Removing any other query params asyncpg doesn't understand
    """
    # Auto-convert driver prefix
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        logger.info("Auto-converted connection string to asyncpg format")

    # Strip sslmode from query string (all variations)
    url = re.sub(r'[?&]sslmode=[^&]*', '', url)

    # Clean up orphaned ? or & at end of URL
    url = url.rstrip('?').rstrip('&')

    # If we removed the first param, fix ?& to just ?
    url = url.replace('?&', '?')

    return url


def _init_db():
    """Initialize the database engine on first use."""
    global _engine, _async_session
    if _engine is None:
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

        settings = get_settings()
        db_url = settings.database_url

        # Neon-specific handling
        connect_args = {}
        is_neon = "neon" in db_url or "neon.tech" in db_url

        if is_neon:
            db_url = _clean_neon_url(db_url)
            ssl_context = ssl.create_default_context()
            connect_args["ssl"] = ssl_context
            logger.info("Neon detected — SSL enabled, URL cleaned")
        elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            logger.info("Auto-converted connection string to asyncpg format")

        # Timeout args so Vercel serverless doesn't hang on slow/missing DB
        connect_args.setdefault("timeout", 5)  # asyncpg connect timeout (seconds)

        _engine = create_async_engine(
            db_url,
            echo=settings.debug,
            pool_size=5,
            max_overflow=5,
            pool_pre_ping=True,
            pool_timeout=5,           # max wait for a connection from pool
            pool_recycle=300,          # recycle connections every 5 min (serverless)
            connect_args=connect_args,
        )
        _async_session = async_sessionmaker(
            _engine, class_=AsyncSession, expire_on_commit=False
        )
        logger.info("Database engine initialized")


class Base(DeclarativeBase):
    pass


async def create_tables():
    """Create all tables. Call once on startup or in a migration script."""
    _init_db()
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("All database tables created/verified")


async def get_db():
    _init_db()
    async with _async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
