from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.ad_groups import AdGroupRole
from app.services import audit_service, ad_service

router = APIRouter()


class GroupCreate(BaseModel):
    group_name: str
    role: str   # admin | helpdesk


@router.get("")
def list_groups(user=Depends(require_admin), db: Session = Depends(get_db)):
    groups = db.query(AdGroupRole).all()
    return [
        {
            "group_name": g.group_name,
            "role": g.role,
            "added_by": g.added_by,
            "added_at": g.added_at.isoformat() if g.added_at else None,
        }
        for g in groups
    ]


@router.post("")
def add_group(
    data: GroupCreate,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if data.role not in ("admin", "helpdesk"):
        raise HTTPException(400, "Role must be admin or helpdesk")

    existing = db.query(AdGroupRole).filter_by(group_name=data.group_name).first()
    if existing:
        raise HTTPException(409, "Group already mapped")

    record = AdGroupRole(
        group_name=data.group_name,
        role=data.role,
        added_by=user.username,
    )
    db.add(record)
    db.commit()

    audit_service.log(
        db=db, action="GROUP_ADDED", entity_type="group",
        entity_value=data.group_name, performed_by=user.username,
        extra_data={"role": data.role},
    )
    return {"group_name": record.group_name, "role": record.role}


@router.delete("/{group_name}")
def remove_group(
    group_name: str,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    record = db.query(AdGroupRole).filter_by(group_name=group_name).first()
    if not record:
        raise HTTPException(404, "Group not found")

    db.delete(record)
    db.commit()

    audit_service.log(
        db=db, action="GROUP_REMOVED", entity_type="group",
        entity_value=group_name, performed_by=user.username,
    )
    return {"message": f"{group_name} removed"}


@router.post("/sync")
def sync_groups(user=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        result = ad_service.sync_groups(db)
    except ValueError as e:
        raise HTTPException(503, str(e))
    return {"message": "Sync complete", **result}
