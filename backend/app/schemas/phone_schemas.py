from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List
from app.schemas.ban_schemas import _validate_reason


class PhoneRecord(BaseModel):
    phone_number: str
    banned: bool
    temp_ban: bool
    date_banned: Optional[datetime] = None
    date_ban_expire: Optional[datetime] = None
    ban_reason: Optional[str] = None
    banned_by: Optional[str] = None
    date_unbanned: Optional[datetime] = None
    unbanned_by: Optional[str] = None
    unban_reason: Optional[str] = None
    msg_attempts: int
    last_msg_attempt: Optional[datetime] = None
    opt_out: bool
    auto_temp_ban_count: int

    class Config:
        from_attributes = True


class PhoneListResponse(BaseModel):
    total: int
    page: int
    limit: int
    results: List[PhoneRecord]


class PhoneCreate(BaseModel):
    phone_number: str


class PhoneOptOutUpdate(BaseModel):
    opt_out: bool


class ActivateRequest(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        return _validate_reason(v)
