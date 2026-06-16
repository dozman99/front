from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.models.base import Base
from datetime import datetime


class ThrottleConfig(Base):
    """App-owned table. Per-app throttle cap configuration."""
    __tablename__ = "throttle_config"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    app_email    = Column(String(255), unique=True, nullable=False, index=True)
    cap_per_hour = Column(Integer, default=1000, nullable=False)
    enabled      = Column(Boolean, default=True, nullable=False)
    updated_by   = Column(String(255), nullable=True)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
