"""OAuth2 callback handler for Gmail/Outlook integration.

Handles the OAuth2 authorization code flow:
1. Frontend opens /oauth/authorize/{provider} → redirects to Google/Microsoft
2. Provider redirects back to /oauth/callback/{provider} with auth code
3. Backend exchanges code for access_token
4. Frontend polls /oauth/token/{state} to get the token
"""

import os
import uuid
import time
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel

router = APIRouter(prefix="/oauth", tags=["OAuth"])

# In-memory token store (production: use Redis/DB)
_pending_tokens: dict[str, dict] = {}

# OAuth2 provider configs — loaded from environment
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")

MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "")
MICROSOFT_REDIRECT_URI = os.getenv("MICROSOFT_REDIRECT_URI", "")


class TokenResponse(BaseModel):
    status: str
    access_token: str | None = None
    provider: str | None = None
    email: str | None = None
    error: str | None = None


@router.get("/authorize/{provider}")
async def authorize(provider: str):
    """Start OAuth2 flow — redirects user to Google/Microsoft login."""
    state = str(uuid.uuid4())

    if provider == "gmail":
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID env var.")
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI or f"{os.getenv('API_BASE_URL', 'http://localhost:8000')}/api/v1/oauth/callback/gmail",
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/gmail.readonly",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        _pending_tokens[state] = {"status": "pending", "provider": "gmail", "created": time.time()}
        return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}")

    elif provider == "outlook":
        if not MICROSOFT_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Microsoft OAuth not configured. Set MICROSOFT_CLIENT_ID env var.")
        params = {
            "client_id": MICROSOFT_CLIENT_ID,
            "redirect_uri": MICROSOFT_REDIRECT_URI or f"{os.getenv('API_BASE_URL', 'http://localhost:8000')}/api/v1/oauth/callback/outlook",
            "response_type": "code",
            "scope": "Mail.Read offline_access",
            "state": state,
        }
        _pending_tokens[state] = {"status": "pending", "provider": "outlook", "created": time.time()}
        return RedirectResponse(f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?{urlencode(params)}")

    raise HTTPException(status_code=400, detail="Provider must be 'gmail' or 'outlook'")


@router.get("/callback/gmail")
async def gmail_callback(code: str = Query(...), state: str = Query(...)):
    """Handle Google OAuth2 callback — exchange code for token."""
    if state not in _pending_tokens:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    import httpx

    redirect_uri = GOOGLE_REDIRECT_URI or f"{os.getenv('API_BASE_URL', 'http://localhost:8000')}/api/v1/oauth/callback/gmail"

    async with httpx.AsyncClient() as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        })

    if resp.status_code != 200:
        _pending_tokens[state] = {"status": "error", "error": "Failed to exchange code for token"}
        return _close_popup_html("Connection failed. Please try again.")

    data = resp.json()
    _pending_tokens[state] = {
        "status": "ready",
        "provider": "gmail",
        "access_token": data.get("access_token"),
        "refresh_token": data.get("refresh_token"),
    }

    return _close_popup_html("Gmail connected successfully! You can close this window.")


@router.get("/callback/outlook")
async def outlook_callback(code: str = Query(...), state: str = Query(...)):
    """Handle Microsoft OAuth2 callback — exchange code for token."""
    if state not in _pending_tokens:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    import httpx

    redirect_uri = MICROSOFT_REDIRECT_URI or f"{os.getenv('API_BASE_URL', 'http://localhost:8000')}/api/v1/oauth/callback/outlook"

    async with httpx.AsyncClient() as client:
        resp = await client.post("https://login.microsoftonline.com/common/oauth2/v2.0/token", data={
            "code": code,
            "client_id": MICROSOFT_CLIENT_ID,
            "client_secret": MICROSOFT_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
            "scope": "Mail.Read offline_access",
        })

    if resp.status_code != 200:
        _pending_tokens[state] = {"status": "error", "error": "Failed to exchange code for token"}
        return _close_popup_html("Connection failed. Please try again.")

    data = resp.json()
    _pending_tokens[state] = {
        "status": "ready",
        "provider": "outlook",
        "access_token": data.get("access_token"),
        "refresh_token": data.get("refresh_token"),
    }

    return _close_popup_html("Outlook connected successfully! You can close this window.")


@router.get("/token/{state}")
async def get_token(state: str):
    """Poll this endpoint to get the token after OAuth2 callback completes."""
    # Clean up old tokens (>10 min)
    now = time.time()
    expired = [k for k, v in _pending_tokens.items() if now - v.get("created", now) > 600]
    for k in expired:
        del _pending_tokens[k]

    entry = _pending_tokens.get(state)
    if not entry:
        return {"status": "not_found"}

    if entry["status"] == "ready":
        # Return token and remove from store
        token_data = {
            "status": "ready",
            "access_token": entry["access_token"],
            "refresh_token": entry.get("refresh_token"),
            "provider": entry["provider"],
        }
        del _pending_tokens[state]
        return token_data

    if entry["status"] == "error":
        error_data = {"status": "error", "error": entry.get("error", "Unknown error")}
        del _pending_tokens[state]
        return error_data

    return {"status": "pending"}


def _close_popup_html(message: str) -> HTMLResponse:
    """Return an HTML page that shows a message and closes the popup window."""
    return HTMLResponse(f"""<!DOCTYPE html>
<html><head><title>AlecRae — Email Connected</title>
<style>
  body {{ font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center;
         justify-content: center; height: 100vh; margin: 0; background: #f9fafb; }}
  .card {{ text-align: center; padding: 48px; background: white; border-radius: 16px;
           box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 400px; }}
  h2 {{ color: #111827; margin: 0 0 8px; }}
  p {{ color: #6b7280; margin: 0; font-size: 14px; }}
  .check {{ width: 48px; height: 48px; background: #ecfdf5; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
            color: #10b981; font-size: 24px; }}
</style></head>
<body>
  <div class="card">
    <div class="check">&#10003;</div>
    <h2>Connected</h2>
    <p>{message}</p>
  </div>
  <script>setTimeout(function() {{ window.close(); }}, 3000);</script>
</body></html>""")
