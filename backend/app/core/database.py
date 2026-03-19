"""Async database engine and session management.

Lazy initialization so the app starts on Vercel serverless
(where PostgreSQL may not be configured yet).
"""

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
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.debug,
            pool_size=5,
            max_overflow=5,
        )
        _async_session = async_sessionmaker(
            _engine, class_=AsyncSession, expire_on_commit=False
        )


class Base(DeclarativeBase):
    pass


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
