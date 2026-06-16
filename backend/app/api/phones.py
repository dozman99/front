from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import require_admin, require_any
from app.models.banned_users import BannedUser
from app.schemas.ban_schemas import BanRequest, UnbanRequest
from app.schemas.phone_schemas import PhoneRecord, PhoneListResponse, PhoneCreate, PhoneOptOutUpdate, ActivateRequest
from app.services import ban_service, unban_service, audit_service

router = APIRouter()


@router.get("", response_model=PhoneListResponse)
def list_phones(
    status: Optional[str] = Query(None, description="banned|temp|active|optout"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user=Depends(require_any),
    db: Session = Depends(get_db),
):
    """List all phone numbers with optional filtering and search."""
    q = db.query(BannedUser)

    if status == "banned":
        q = q.filter(BannedUser.banned == True, BannedUser.temp_ban == False)
    elif status == "temp":
        q = q.filter(BannedUser.banned == True, BannedUser.temp_ban == True)
    elif status == "active":
        q = q.filter(BannedUser.banned == False, BannedUser.opt_out == False)
    elif status == "optout":
        q = q.filter(BannedUser.opt_out == True)

    if search:
        q = q.filter(BannedUser.phone_number.ilike(f"%{search}%"))

    total = q.count()
    offset = (page - 1) * limit
    results = q.offset(offset).limit(limit).all()
    return {"total": total, "page": page, "limit": limit, "results": results}


@router.get("/{number}", response_model=PhoneRecord)
def get_phone(
    number: str,
    user=Depends(require_any),
    db: Session = Depends(get_db),
):
    """Get a single phone number record."""
    record = db.query(BannedUser).filter_by(phone_number=number).first()
    if not record:
        raise HTTPException(404, "Phone number not found")
    return record


@router.post("", response_model=PhoneRecord)
def add_phone(
    data: PhoneCreate,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Add a phone number to the list with default (active) status."""
    existing = db.query(BannedUser).filter_by(
        phone_number=data.phone_number
    ).first()
    if existing:
        raise HTTPException(409, "Phone number already in list")

    record = BannedUser(phone_number=data.phone_number)
    db.add(record)
    db.commit()
    db.refresh(record)

    audit_service.log(
        db=db, action="ADDED", entity_type="phone",
        entity_value=data.phone_number, performed_by=user.username,
    )
    return record


@router.post("/{number}/ban", response_model=PhoneRecord)
def ban_phone(
    number: str,
    data: BanRequest,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Ban a phone number (temporary or permanent).
    Admin only.
    Resets all unban columns to None.
    """
    return ban_service.ban_phone(db, number, data, user)


@router.post("/{number}/unban", response_model=PhoneRecord)
def unban_phone(
    number: str,
    data: UnbanRequest,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Unban a phone number.
    Helpdesk and Admin.
    Resets all ban columns to None.
    """
    return unban_service.unban_phone(db, number, data, user)


@router.post("/{number}/activate", response_model=PhoneRecord)
def activate_phone(
    number: str,
    data: ActivateRequest,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    record = db.query(BannedUser).filter_by(phone_number=number).first()
    if not record:
        raise HTTPException(404, "Phone number not found")

    was_banned   = record.banned or record.temp_ban
    was_opted_out = record.opt_out

    record.opt_out         = False
    record.banned          = False
    record.temp_ban        = False
    record.date_banned     = None
    record.date_ban_expire = None
    record.ban_reason      = None
    record.banned_by       = None

    db.commit()
    db.refresh(record)

    if was_banned:
        audit_service.log(
            db=db, action="UNBAN", entity_type="phone",
            entity_value=number, performed_by=user.username,
            reason=data.reason,
        )
    if was_opted_out:
        audit_service.log(
            db=db, action="ACTIVATE", entity_type="phone",
            entity_value=number, performed_by=user.username,
            reason=data.reason,
        )

    return record


@router.patch("/{number}", response_model=PhoneRecord)
def update_phone(
    number: str,
    data: PhoneOptOutUpdate,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Toggle opt-out status for a phone number. Admin only."""
    record = db.query(BannedUser).filter_by(phone_number=number).first()
    if not record:
        raise HTTPException(404, "Phone number not found")

    old_value = record.opt_out
    record.opt_out = data.opt_out
    db.commit()
    db.refresh(record)

    action = "OPT_OUT" if data.opt_out else "OPT_IN"
    audit_service.log(
        db=db, action=action, entity_type="phone",
        entity_value=number, performed_by=user.username,
        extra_data={"previous": old_value, "new": data.opt_out},
    )
    return record


@router.delete("/{number}")
def delete_phone(
    number: str,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Remove a phone number from the list. Admin only."""
    record = db.query(BannedUser).filter_by(phone_number=number).first()
    if not record:
        raise HTTPException(404, "Phone number not found")

    db.delete(record)
    db.commit()

    audit_service.log(
        db=db, action="REMOVED", entity_type="phone",
        entity_value=number, performed_by=user.username,
    )
    return {"message": f"{number} removed"}
