from pydantic import BaseModel
from typing import Optional


class MessageRecord(BaseModel):
    attempted_at: Optional[str] = None
    status: Optional[str] = None
    app_email: Optional[str] = None
    phone_number: Optional[str] = None
    block_reason: Optional[str] = None
    twilio_response_code: Optional[str] = None
