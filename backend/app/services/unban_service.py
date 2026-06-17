from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.banned_apps import BannedApp
from app.services import audit_service


def unban_email(db: Session, email_address: str, unban_data, current_user) -> BannedApp:
    """
    Unban an email address (app).
    Same logic as unban_phone but for banned_apps_sms_gateway.
    """
    record = db.query(BannedApp).filter_by(email_address=email_address).first()
    if not record:
        raise HTTPException(status_code=404, detail="Email address not found")

    record.banned           = False
    record.temp_ban         = False
    record.date_unbanned    = datetime.utcnow()
    record.unbanned_by      = current_user.username
    record.unbanned_reason  = unban_data.reason
    record.date_banned      = None
    record.date_ban_expire  = None
    record.ban_reason       = None
    record.banned_by        = None

    db.commit()
    db.refresh(record)

    audit_service.log(
        db=db,
        action="UNBAN",
        entity_type="email",
        entity_value=email_address,
        performed_by=current_user.username,
        reason=unban_data.reason,
    )
    return record
