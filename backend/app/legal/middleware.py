"""Legal compliance middleware.

Adds legal headers to every API response and enforces the
human-in-the-loop requirement.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class LegalHeadersMiddleware(BaseHTTPMiddleware):
    """Adds legal disclaimer headers to every API response.

    These headers make it machine-readable that:
    1. AI outputs require human review
    2. Tax calculations are not tax advice
    3. The service is a tool, not a professional firm
    """

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Legal headers on all API responses
        if request.url.path.startswith("/api/"):
            response.headers["X-MarcoReid-Disclaimer"] = (
                "Outputs are for informational purposes only. "
                "Not professional advice. Human review required."
            )
            response.headers["X-MarcoReid-AI-Disclosure"] = (
                "This service uses AI. See /legal/ai-disclosure for details."
            )
            response.headers["X-MarcoReid-Liability"] = "See Terms of Service"

            # Specific headers for AI endpoints
            if "/ai/" in request.url.path:
                response.headers["X-MarcoReid-AI-Generated"] = "true"
                response.headers["X-MarcoReid-Requires-Review"] = "true"

            # Specific headers for forensic endpoints
            if "/forensic/" in request.url.path:
                response.headers["X-MarcoReid-Forensic-Disclaimer"] = (
                    "Investigative aid only. Not legal evidence. "
                    "Verify with qualified forensic accountants."
                )

            # Specific headers for tax endpoints
            if "/tax/" in request.url.path:
                response.headers["X-MarcoReid-Tax-Disclaimer"] = (
                    "Not tax advice. Based on published legislation. "
                    "Consult qualified tax professional."
                )

        return response
