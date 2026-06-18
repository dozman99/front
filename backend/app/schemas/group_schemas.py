from pydantic import BaseModel
from typing import List, Literal, Optional


class GroupCreate(BaseModel):
    group_name: str
    role: str


class GroupRecord(BaseModel):
    group_name: str
    role: Literal['admin', 'helpdesk']
    added_by: Optional[str] = None
    added_at: Optional[str] = None


class GroupSyncEntry(BaseModel):
    group_name: str
    role: str
    member_count: int


class SyncResult(BaseModel):
    message: str
    synced: int
    groups: List[GroupSyncEntry]
    not_found: List[str]


class MessageResponse(BaseModel):
    message: str
