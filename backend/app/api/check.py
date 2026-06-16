from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.database import get_db
from app.core.config import settings
from app.services.check_service import check_phone, check_email
from app.schemas.check_schemas import CheckResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/phone/{number}", response_model=CheckResponse)
@limiter.limit(settings.RATE_LIMIT_CHECK)
def check_phone_status(
    number: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public endpoint — no authentication required.
    Rate limited to 100 requests per hour per IP.
    Returns only status and optional expiry date.
    ban_reason is NEVER included in this response.
    """
    return check_phone(db, number)


@router.get("/email/{address}", response_model=CheckResponse)
@limiter.limit(settings.RATE_LIMIT_CHECK)
def check_email_status(
    address: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public endpoint — no authentication required.
    Rate limited to 100 requests per hour per IP.
    Returns only status and optional expiry date.
    ban_reason is NEVER included in this response.
    """
    return check_email(db, address)
