from sqlalchemy import Column, Integer, String, DateTime
from app.models.base import Base
from datetime import datetime


class UsageSummary(Base):
    """App-owned table. Pre-aggregated usage metrics."""
    __tablename__ = "usage_summary"

    id                   = Column(Integer, primary_key=True, autoincrement=True)
    period_start         = Column(DateTime, nullable=True)
    period_end           = Column(DateTime, nullable=True)
    app_email            = Column(String(255), nullable=True)
    messages_attempted   = Column(Integer, default=0)
    messages_delivered   = Column(Integer, default=0)
    messages_throttled   = Column(Integer, default=0)
    messages_blocked_ban = Column(Integer, default=0)
    messages_blocked_opt = Column(Integer, default=0)
    throttle_cap_hits    = Column(Integer, default=0)
    calculated_at        = Column(DateTime, default=datetime.utcnow)
