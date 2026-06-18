from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import require_any
from app.models.message_log import MessageLog
from app.schemas.message_schemas import MessageRecord

router = APIRouter()


@router.get("/phone/{number}", response_model=List[MessageRecord])
def get_phone_messages(
    number: str,
    limit: int = Query(20, ge=1, le=100),
    user=Depends(require_any),
    db: Session = Depends(get_db),
):
    messages = db.query(MessageLog).filter_by(
        phone_number=number
    ).order_by(
        MessageLog.attempted_at.desc()
    ).limit(limit).all()

    return [
        {
            "attempted_at":        m.attempted_at.isoformat() if m.attempted_at else None,
            "status":              m.status,
            "app_email":           m.app_email,
            "block_reason":        m.block_reason,
            "twilio_response_code": m.twilio_response_code,
        }
        for m in messages
    ]


@router.get("/email/{address}", response_model=List[MessageRecord])
def get_email_messages(
    address: str,
    limit: int = Query(20, ge=1, le=100),
    user=Depends(require_any),
    db: Session = Depends(get_db),
):
    messages = db.query(MessageLog).filter_by(
        app_email=address
    ).order_by(
        MessageLog.attempted_at.desc()
    ).limit(limit).all()

    return [
        {
            "attempted_at":        m.attempted_at.isoformat() if m.attempted_at else None,
            "status":              m.status,
            "phone_number":        m.phone_number,
            "block_reason":        m.block_reason,
            "twilio_response_code": m.twilio_response_code,
        }
        for m in messages
    ]
