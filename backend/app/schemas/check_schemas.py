from pydantic import BaseModel
from typing import Optional


class CheckResponse(BaseModel):
    """
    Public status check response.
    ban_reason is intentionally absent — never exposed publicly.
    banned_by is intentionally absent — never exposed publicly.
    date_banned is intentionally absent — never exposed publicly.
    """
    status: str  # not_found|active|opted_out|temp_banned|permanently_banned
    expires: Optional[str] = None
