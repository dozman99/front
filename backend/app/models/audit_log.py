from sqlalchemy import Column, Integer, String, DateTime, Text, Index, JSON
from app.models.base import Base
from datetime import datetime


class AuditLog(Base):
    """App-owned management table. Tracks all portal actions."""
    __tablename__ = "sms_gateway_portal_log"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    action       = Column(String(50),  nullable=False)
    entity_type  = Column(String(10),  nullable=False)   # phone | app
    entity_value = Column(String(255), nullable=False)
    performed_by = Column(String(255), nullable=False)
    performed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reason       = Column(Text, nullable=True)
    extra_data   = Column(JSON, nullable=True)

    __table_args__ = (
        Index("idx_portal_log_entity", "entity_value", "performed_at"),
        Index("idx_portal_log_actor",  "performed_by", "performed_at"),
    )
