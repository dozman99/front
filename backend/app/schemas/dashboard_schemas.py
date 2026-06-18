from pydantic import BaseModel
from typing import List, Literal, Optional


class DashboardStats(BaseModel):
    banned_phones: int
    banned_apps: int
    temp_expiring_today: int
    opt_outs: int
    banned_phones_today: int
    banned_apps_today: int
    temp_bans_today: int


class IncidentItem(BaseModel):
    type: str
    entity: str
    detail: str
    severity: Literal['info', 'warning', 'critical']


class ActivityItem(BaseModel):
    id: int
    action: str
    entity: str
    entity_type: str
    actor: str
    performed_at: str
    reason: Optional[str] = None
