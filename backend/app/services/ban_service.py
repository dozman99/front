from datetime import datetime
from sqlalchemy.orm import Session
from app.models.banned_users import BannedUser
from app.models.banned_apps import BannedApp
from app.services import audit_service


def ban_phone(db: Session, phone_number: str, ban_data, current_user) -> BannedUser:
    """
    Ban a phone number.
    Creates the record if it does not exist.
    Writes ban columns and resets all unban columns to None.
    """
    record = db.query(BannedUser).filter_by(phone_number=phone_number).first()
    if not record:
        record = BannedUser(phone_number=phone_number)
        db.add(record)

    # Write ban columns
    record.banned          = True
    record.temp_ban        = ban_data.is_temporary
    record.date_banned     = datetime.utcnow()
    record.date_ban_expire = ban_data.expiry_date if ban_data.is_temporary else None
    record.ban_reason      = ban_data.reason
    record.banned_by       = current_user.username

    # Reset unban columns — no stale data left behind
    record.date_unbanned   = None
    record.unbanned_by     = None
    record.unban_reason    = None

    db.commit()
    db.refresh(record)

    action = "TEMP_BAN" if ban_data.is_temporary else "BAN"
    audit_service.log(
        db=db,
        action=action,
        entity_type="phone",
        entity_value=phone_number,
        performed_by=current_user.username,
        reason=ban_data.reason,
        extra_data={
            "is_temporary": ban_data.is_temporary,
            "expiry_date": ban_data.expiry_date.isoformat() if ban_data.expiry_date else None,
        },
    )
    return record


def ban_email(db: Session, email_address: str, ban_data, current_user) -> BannedApp:
    """
    Ban an email address (app).
    Same logic as ban_phone but for banned_apps_sms_gateway.
    """
    record = db.query(BannedApp).filter_by(email_address=email_address).first()
    if not record:
        record = BannedApp(email_address=email_address)
        db.add(record)

    record.banned           = True
    record.temp_ban         = ban_data.is_temporary
    record.date_banned      = datetime.utcnow()
    record.date_ban_expire  = ban_data.expiry_date if ban_data.is_temporary else None
    record.ban_reason       = ban_data.reason
    record.banned_by        = current_user.username
    record.date_unbanned    = None
    record.unbanned_by      = None
    record.unbanned_reason  = None

    db.commit()
    db.refresh(record)

    action = "TEMP_BAN" if ban_data.is_temporary else "BAN"
    audit_service.log(
        db=db,
        action=action,
        entity_type="email",
        entity_value=email_address,
        performed_by=current_user.username,
        reason=ban_data.reason,
        extra_data={
            "is_temporary": ban_data.is_temporary,
            "expiry_date": ban_data.expiry_date.isoformat() if ban_data.expiry_date else None,
        },
    )
    return record
