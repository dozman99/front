from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.deps import require_any, require_admin
from app.models.throttle_config import ThrottleConfig
from app.services import audit_service

router = APIRouter()

GLOBAL_DEFAULT_KEY = "__global__"


class ThrottleUpdate(BaseModel):
    cap_per_hour: Optional[int] = None
    enabled: Optional[bool] = None


def _get_or_create(db: Session, email: str) -> ThrottleConfig:
    config = db.query(ThrottleConfig).filter_by(app_email=email).first()
    if not config:
        config = ThrottleConfig(app_email=email)
        db.add(config)
    return config


@router.get("")
def list_throttle(user=Depends(require_any), db: Session = Depends(get_db)):
    configs = db.query(ThrottleConfig).filter(
        ThrottleConfig.app_email != GLOBAL_DEFAULT_KEY
    ).all()
    return [
        {
            "app_email": c.app_email,
            "cap_per_hour": c.cap_per_hour,
            "enabled": c.enabled,
            "updated_by": c.updated_by,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in configs
    ]


@router.get("/global")
def get_global(user=Depends(require_any), db: Session = Depends(get_db)):
    config = db.query(ThrottleConfig).filter_by(app_email=GLOBAL_DEFAULT_KEY).first()
    return {"cap_per_hour": config.cap_per_hour if config else 1000}


@router.patch("/global")
def update_global(
    data: ThrottleUpdate,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    config = _get_or_create(db, GLOBAL_DEFAULT_KEY)
    if data.cap_per_hour is not None:
        config.cap_per_hour = data.cap_per_hour
    config.updated_by = user.username
    db.commit()

    audit_service.log(
        db=db, action="CAP_UPDATED", entity_type="email",
        entity_value="global_default", performed_by=user.username,
        extra_data={"cap_per_hour": data.cap_per_hour},
    )
    return {"cap_per_hour": config.cap_per_hour}


@router.patch("/{email}")
def update_app_throttle(
    email: str,
    data: ThrottleUpdate,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    config = _get_or_create(db, email)
    if data.cap_per_hour is not None:
        config.cap_per_hour = data.cap_per_hour
    if data.enabled is not None:
        config.enabled = data.enabled
    config.updated_by = user.username
    db.commit()

    audit_service.log(
        db=db, action="CAP_UPDATED", entity_type="email",
        entity_value=email, performed_by=user.username,
        extra_data={"cap_per_hour": data.cap_per_hour, "enabled": data.enabled},
    )
    return {"app_email": email, "cap_per_hour": config.cap_per_hour, "enabled": config.enabled}
