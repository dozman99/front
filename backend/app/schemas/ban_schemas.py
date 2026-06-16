from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime, timedelta
from typing import Optional


def _validate_reason(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("Reason is required")
    if len(v) < 3:
        raise ValueError("Reason must be at least 3 characters")
    return v


class BanRequest(BaseModel):
    is_temporary: bool
    expiry_date: Optional[datetime] = None
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        return _validate_reason(v)

    @model_validator(mode="after")
    def validate_expiry(self):
        if self.is_temporary:
            if not self.expiry_date:
                raise ValueError("Expiry date is required for temporary bans")
            if self.expiry_date < datetime.utcnow() + timedelta(hours=1):
                raise ValueError("Expiry must be at least 1 hour from now")
        return self


class UnbanRequest(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        return _validate_reason(v)
