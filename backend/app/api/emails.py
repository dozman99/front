from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import require_admin, require_any
from app.models.banned_apps import BannedApp
from app.schemas.ban_schemas import BanRequest, UnbanRequest
from app.schemas.email_schemas import EmailRecord, EmailListResponse
from app.services import ban_service, unban_service

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
