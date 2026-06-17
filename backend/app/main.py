from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.api import auth, phones, emails, dashboard, check, groups, messages

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="SAS Relay API",
    version="1.0.0",
    description="SMS Gateway Ban Management System",
    # Disable interactive docs in production
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — only allow configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# All routers
app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(phones.router,    prefix="/phones",    tags=["Phones"])
app.include_router(emails.router,    prefix="/emails",    tags=["Emails"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(check.router,     prefix="/check",     tags=["Public"])
app.include_router(groups.router,    prefix="/groups",    tags=["Groups"])
app.include_router(messages.router,  prefix="/messages",  tags=["Messages"])


@app.get("/")
def health():
    """Health check endpoint. Called by NSSM service monitor."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }
