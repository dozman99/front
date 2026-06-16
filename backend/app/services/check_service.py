from sqlalchemy.orm import Session
from app.models.banned_users import BannedUser
from app.models.banned_apps import BannedApp


def _resolve_ban_status(record) -> dict:
    if record.banned and record.temp_ban:
        return {
            "status": "temp_banned",
            "expires": record.date_ban_expire.isoformat() if record.date_ban_expire else None,
        }
    if record.banned:
        return {"status": "permanently_banned", "expires": None}
    return {"status": "active", "expires": None}


def check_phone(db: Session, phone_number: str) -> dict:
    """
    Public status check for a phone number.
    Returns only status and optional expiry.
    Never returns ban_reason, banned_by, or any admin data.
    """
    record = db.query(BannedUser).filter_by(phone_number=phone_number).first()
    if not record:
        return {"status": "not_found", "expires": None}
    # Opt-out takes precedence — check before ban status
    if record.opt_out:
        return {"status": "opted_out", "expires": None}
    return _resolve_ban_status(record)


def check_email(db: Session, email_address: str) -> dict:
    """
    Public status check for an email address (app).
    Returns only status and optional expiry.
    Never returns ban_reason, banned_by, or any admin data.
    Apps cannot opt out — no opted_out status for emails.
    """
    record = db.query(BannedApp).filter_by(email_address=email_address).first()
    if not record:
        return {"status": "not_found", "expires": None}
    return _resolve_ban_status(record)
