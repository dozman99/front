from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.models.base import Base
from datetime import datetime


class AutoBanRule(Base):
    """App-owned table. Configurable auto-ban rules."""
    __tablename__ = "auto_ban_rules"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    title           = Column(String(255), nullable=True)
    condition_text  = Column(Text, nullable=True)
    action_text     = Column(Text, nullable=True)
    enabled         = Column(Boolean, default=True, nullable=False)
    trigger_count   = Column(Integer, default=0, nullable=False)
    last_triggered  = Column(DateTime, nullable=True)
    created_by      = Column(String(255), nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
