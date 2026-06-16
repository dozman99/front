from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text
from app.models.base import Base


class BannedApp(Base):
    """
    Maps to banned_apps_sms_gateway table (existing, read/write).
    Represents email addresses (apps/scripts) in the SMS gateway ban system.
    Note: Apps cannot opt out — opt_out column does not exist here.
    """
    __tablename__ = "banned_apps_sms_gateway"

    email_address   = Column(String(255), primary_key=True, index=True)
    banned          = Column(Boolean, default=False, nullable=False)
    temp_ban        = Column(Boolean, default=False, nullable=False)
    date_banned     = Column(DateTime, nullable=True)
    date_ban_expire = Column(DateTime, nullable=True)
    ban_reason      = Column(Text, nullable=True)
    banned_by       = Column(String(255), nullable=True)
    date_unbanned   = Column(DateTime, nullable=True)
    unbanned_by     = Column(String(255), nullable=True)
    unbanned_reason = Column(Text, nullable=True)
    msg_attempts    = Column(Integer, default=0, nullable=False)
    last_msg_attempt= Column(DateTime, nullable=True)
