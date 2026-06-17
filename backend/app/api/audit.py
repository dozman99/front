from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.audit_log import AuditLog

router = APIRouter()


def _apply_filters(q, action, from_date, to_date, entity=None):
    if action:
        q = q.filter(AuditLog.action == action.upper())
    if entity:
        q = q.filter(AuditLog.entity_value.ilike(f"%{entity}%"))
    if from_date:
        q = q.filter(AuditLog.performed_at >= datetime.fromisoformat(from_date))
    if to_date:
        q = q.filter(AuditLog.performed_at <= datetime.fromisoformat(to_date))
    return q


@router.get("")
def list_audit(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    entity: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = _apply_filters(
        db.query(AuditLog).order_by(AuditLog.performed_at.desc()),
        action, from_date, to_date, entity,
    )

    total = q.count()
    offset = (page - 1) * limit
    items = q.offset(offset).limit(limit).all()

    return {
        "results": [
            {
                "id": e.id,
                "action": e.action,
                "entity_type": e.entity_type,
                "entity_value": e.entity_value,
                "performed_by": e.performed_by,
                "performed_at": e.performed_at.isoformat(),
                "reason": e.reason,
            }
            for e in items
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


