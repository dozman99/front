from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import require_admin, require_any
from app.models.banned_users import BannedUser
from app.schemas.ban_schemas import BanRequest
from app.schemas.phone_schemas import PhoneRecord, PhoneListResponse, ActivateRequest
from app.services import ban_service, audit_service

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


@router.post("/{number}/ban", response_model=PhoneRecord)
def ban_phone(
    number: str,
    data: BanRequest,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ban_service.ban_phone(db, number, data, user)


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

    was_banned    = record.banned or record.temp_ban
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
