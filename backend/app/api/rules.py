from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.auto_ban_rules import AutoBanRule
from app.services import audit_service

router = APIRouter()


class RuleCreate(BaseModel):
    title: str
    condition_text: str
    action_text: str


class RuleUpdate(BaseModel):
    title: Optional[str] = None
    condition_text: Optional[str] = None
    action_text: Optional[str] = None
    enabled: Optional[bool] = None


@router.get("")
def list_rules(user=Depends(require_admin), db: Session = Depends(get_db)):
    rules = db.query(AutoBanRule).order_by(AutoBanRule.created_at.asc()).all()
    return [
        {
            "id": r.id, "title": r.title,
            "condition_text": r.condition_text, "action_text": r.action_text,
            "enabled": r.enabled, "trigger_count": r.trigger_count,
            "last_triggered": r.last_triggered.isoformat() if r.last_triggered else None,
            "created_by": r.created_by,
        }
        for r in rules
    ]


@router.post("")
def create_rule(
    data: RuleCreate,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    rule = AutoBanRule(
        title=data.title,
        condition_text=data.condition_text,
        action_text=data.action_text,
        created_by=user.username,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    audit_service.log(
        db=db, action="RULE_CREATED", entity_type="rule",
        entity_value=data.title, performed_by=user.username,
    )
    return {"id": rule.id, "title": rule.title}


@router.patch("/{rule_id}")
def update_rule(
    rule_id: int,
    data: RuleUpdate,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    rule = db.query(AutoBanRule).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(404, "Rule not found")

    was_enabled = rule.enabled

    if data.title is not None:
        rule.title = data.title
    if data.condition_text is not None:
        rule.condition_text = data.condition_text
    if data.action_text is not None:
        rule.action_text = data.action_text
    if data.enabled is not None:
        rule.enabled = data.enabled

    db.commit()

    action = "RULE_TOGGLED" if data.enabled is not None and data.enabled != was_enabled else "RULE_UPDATED"
    audit_service.log(
        db=db, action=action, entity_type="rule",
        entity_value=rule.title or str(rule_id), performed_by=user.username,
        extra_data={"enabled": rule.enabled},
    )
    return {"id": rule.id, "title": rule.title, "enabled": rule.enabled}


@router.delete("/{rule_id}")
def delete_rule(
    rule_id: int,
    user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    rule = db.query(AutoBanRule).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(404, "Rule not found")

    title = rule.title
    db.delete(rule)
    db.commit()

    audit_service.log(
        db=db, action="RULE_DELETED", entity_type="rule",
        entity_value=title or str(rule_id), performed_by=user.username,
    )
    return {"message": f"Rule {rule_id} deleted"}
