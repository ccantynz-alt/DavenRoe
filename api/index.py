"""Vercel Serverless Function — FastAPI ASGI adapter.

Vercel's Python runtime picks up this file and serves the FastAPI app
as a serverless function. All /api/* requests route here.

No Render, no Railway, no separate backend — everything on Vercel.
"""

import sys
from pathlib import Path

# Add backend directory to Python path so imports work
backend_dir = str(Path(__file__).resolve().parent.parent / "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the FastAPI app — Vercel's Python runtime detects the ASGI app
from main import app  # noqa: E402
