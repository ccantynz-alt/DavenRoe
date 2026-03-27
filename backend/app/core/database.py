"""Async database engine and session management.

Uses Neon PostgreSQL (serverless) with asyncpg driver.
Lazy initialization so the app starts on Vercel serverless
even when PostgreSQL is not yet configured.
"""

import logging
import ssl
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Lazy engine — only created when a DB route is actually called
_engine = None
_async_session = None


def _init_db():
    """Initialize the database engine on first use."""
    global _engine, _async_session
    if _engine is None:
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

        settings = get_settings()
        db_url = settings.database_url

        # Auto-fix common Neon connection string issues:
        # Neon gives you postgresql:// but asyncpg needs postgresql+asyncpg://
        if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            logger.info("Auto-converted connection string to asyncpg format")

        # Neon requires SSL for all connections
        connect_args = {}
        if "neon" in db_url or "neon.tech" in db_url:
            ssl_context = ssl.create_default_context()
            connect_args["ssl"] = ssl_context
            # Remove sslmode from URL — asyncpg doesn't accept it as a keyword
            # when an SSL context is already provided via connect_args
            if "?sslmode=" in db_url:
                db_url = db_url.split("?sslmode=")[0]
            elif "&sslmode=" in db_url:
                db_url = db_url.replace("&sslmode=require", "")
            logger.info("Neon detected — SSL enabled")

        _engine = create_async_engine(
            db_url,
            echo=settings.debug,
            pool_size=5,
            max_overflow=5,
            pool_pre_ping=True,
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
