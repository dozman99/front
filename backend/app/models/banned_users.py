from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text
from app.models.base import Base


class BannedUser(Base):
    """
    Maps to banned_users_sms_gateway table (existing, read/write).
    Represents phone numbers in the SMS gateway ban system.
    """
    __tablename__ = "banned_users_sms_gateway"

    phone_number        = Column(String(20), primary_key=True, index=True)
    banned              = Column(Boolean, default=False, nullable=False)
    temp_ban            = Column(Boolean, default=False, nullable=False)
    date_banned         = Column(DateTime, nullable=True)
    date_ban_expire     = Column(DateTime, nullable=True)
    ban_reason          = Column(Text, nullable=True)
    banned_by           = Column(String(255), nullable=True)
    date_unbanned       = Column(DateTime, nullable=True)
    unbanned_by         = Column(String(255), nullable=True)
    unban_reason        = Column(Text, nullable=True)
    msg_attempts        = Column(Integer, default=0, nullable=False)
    last_msg_attempt    = Column(DateTime, nullable=True)
    opt_out             = Column(Boolean, default=False, nullable=False)
    auto_temp_ban_count = Column(Integer, default=0, nullable=False)
