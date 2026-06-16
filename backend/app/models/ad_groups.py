from sqlalchemy import Column, Integer, String, DateTime
from app.models.base import Base
from datetime import datetime


class AdGroupRole(Base):
    """App-owned table. Maps AD groups to portal roles."""
    __tablename__ = "ad_group_roles"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    group_name = Column(String(255), unique=True, nullable=False)
    role       = Column(String(20), nullable=False)   # admin | helpdesk
    added_by   = Column(String(255), nullable=True)
    added_at   = Column(DateTime, default=datetime.utcnow)
