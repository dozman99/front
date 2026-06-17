from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_any
from app.models.message_log import MessageLog

router = APIRouter()


@router.get("/phone/{number}")
def get_phone_messages(
    number: str,
    limit: int = Query(20, ge=1, le=100),
    user=Depends(require_any),
    db: Session = Depends(get_db),
):
    """Return last N messages for a phone number."""
    messages = db.query(MessageLog).filter_by(
        phone_number=number
    ).order_by(
        MessageLog.attempted_at.desc()
    ).limit(limit).all()

    return [
        {
            "attempted_at": m.attempted_at.isoformat() if m.attempted_at else None,
            "status": m.status,
            "app_email": m.app_email,
            "block_reason": m.block_reason,
            "twilio_response_code": m.twilio_response_code,
        }
        for m in messages
    ]


@router.get("/email/{address}")
def get_email_messages(
    address: str,
    limit: int = Query(20, ge=1, le=100),
    user=Depends(require_any),
    db: Session = Depends(get_db),
):
    """Return last N messages from an email address (app)."""
    messages = db.query(MessageLog).filter_by(
        app_email=address
    ).order_by(
        MessageLog.attempted_at.desc()
    ).limit(limit).all()

    return [
        {
            "attempted_at": m.attempted_at.isoformat() if m.attempted_at else None,
            "status": m.status,
            "phone_number": m.phone_number,
            "block_reason": m.block_reason,
            "twilio_response_code": m.twilio_response_code,
        }
        for m in messages
    ]
