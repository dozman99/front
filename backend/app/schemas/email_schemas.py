from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class EmailRecord(BaseModel):
    email_address: str
    banned: bool
    temp_ban: bool
    date_banned: Optional[datetime] = None
    date_ban_expire: Optional[datetime] = None
    ban_reason: Optional[str] = None
    banned_by: Optional[str] = None
    date_unbanned: Optional[datetime] = None
    unbanned_by: Optional[str] = None
    unbanned_reason: Optional[str] = None
    msg_attempts: int
    last_msg_attempt: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmailListResponse(BaseModel):
    total: int
    page: int
    limit: int
    results: List[EmailRecord]


class EmailCreate(BaseModel):
    email_address: str
