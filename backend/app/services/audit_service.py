from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log(
    db: Session,
    action: str,
    entity_type: str,
    entity_value: str,
    performed_by: str,
    reason: Optional[str] = None,
    extra_data: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    entry = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_value=entity_value,
        performed_by=performed_by,
        performed_at=datetime.utcnow(),
        reason=reason,
        extra_data=extra_data,
    )
    db.add(entry)
    db.commit()
    return entry
