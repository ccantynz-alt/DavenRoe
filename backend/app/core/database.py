"""Async database engine and session management.

Uses Neon PostgreSQL (serverless) with asyncpg driver.
Lazy initialization so the app starts on Vercel serverless
even when PostgreSQL is not yet configured.
"""

import ssl
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

# Lazy engine — only created when a DB route is actually called
_engine = None
_async_session = None


def _init_db():
    """Initialize the database engine on first use."""
    global _engine, _async_session
    if _engine is None:
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

        settings = get_settings()

        # Neon requires SSL for all connections
        connect_args = {}
        if "neon" in settings.database_url or "neon.tech" in settings.database_url:
            ssl_context = ssl.create_default_context()
            connect_args["ssl"] = ssl_context

        _engine = create_async_engine(
            settings.database_url,
            echo=settings.debug,
            pool_size=5,
            max_overflow=5,
            pool_pre_ping=True,
            connect_args=connect_args,
        )
        _async_session = async_sessionmaker(
            _engine, class_=AsyncSession, expire_on_commit=False
        )


class Base(DeclarativeBase):
    pass


async def create_tables():
    """Create all tables. Call once on startup or in a migration script."""
    _init_db()
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


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
