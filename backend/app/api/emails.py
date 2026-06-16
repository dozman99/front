from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import require_admin, require_any
from app.models.banned_apps import BannedApp
from app.schemas.ban_schemas import BanRequest, UnbanRequest
from app.schemas.email_schemas import EmailRecord, EmailListResponse, EmailCreate
from app.services import ban_service, unban_service, audit_service

router = APIRouter()


@router.get("", response_model=EmailListResponse)
def list_emails(
    status: Optional[str] = Query(None, description="banned|temp|active"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user=Depends(require_any),
    db: Session = Depends(get_db),
):
    q = db.query(BannedApp)

    if status == "banned":
        q = q.filter(BannedApp.banned == True, BannedApp.temp_ban == False)
    elif status == "temp":
        q = q.filter(BannedApp.banned == True, BannedApp.temp_ban == True)
    elif status == "active":
        q = q.filter(BannedApp.banned == False)

    if search:
        q = q.filter(BannedApp.email_address.ilike(f"%{search}%"))

    total = q.count()
    offset = (page - 1) * limit
    results = q.offset(offset).limit(limit).all()
    return {"total": total, "page": page, "limit": limit, "results": results}


@router.get("/{address}", response_model=EmailRecord)
def get_email(
    address: str,
    user=Depends(require_any),
    db: Session = Depends(get_db),
):
    record = db.query(BannedApp).filter_by(email_address=address).first()
    if not record:
        raise HTTPException(404, "Email address not found")
    return record


@router.post("", response_model=EmailRecord)
def add_email(
    data: EmailCreate,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(BannedApp).filter_by(email_address=data.email_address).first()
    if existing:
        raise HTTPException(409, "Email address already in list")

    record = BannedApp(email_address=data.email_address)
    db.add(record)
    db.commit()
    db.refresh(record)

    audit_service.log(
        db=db, action="ADDED", entity_type="email",
        entity_value=data.email_address, performed_by=user.username,
    )
    return record


@router.post("/{address}/ban", response_model=EmailRecord)
def ban_email(
    address: str,
    data: BanRequest,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    return ban_service.ban_email(db, address, data, user)


@router.post("/{address}/unban", response_model=EmailRecord)
def unban_email(
    address: str,
    data: UnbanRequest,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    return unban_service.unban_email(db, address, data, user)


@router.delete("/{address}")
def delete_email(
    address: str,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    record = db.query(BannedApp).filter_by(email_address=address).first()
    if not record:
        raise HTTPException(404, "Email address not found")

    db.delete(record)
    db.commit()

    audit_service.log(
        db=db, action="REMOVED", entity_type="email",
        entity_value=address, performed_by=user.username,
    )
    return {"message": f"{address} removed"}
