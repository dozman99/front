from sqlalchemy import Column, Integer, String, DateTime, Index
from app.models.base import Base
from datetime import datetime


class MessageLog(Base):
    """App-owned table. Created by Alembic migration."""
    __tablename__ = "message_log"

    id                   = Column(Integer, primary_key=True, autoincrement=True)
    app_email            = Column(String(255), nullable=True)
    phone_number         = Column(String(20), nullable=True)
    attempted_at         = Column(DateTime, default=datetime.utcnow, nullable=False)
    status               = Column(String(30), nullable=True)
    block_reason         = Column(String(50), nullable=True)

    __table_args__ = (
        Index("idx_msg_log_phone", "phone_number", "attempted_at"),
        Index("idx_msg_log_email", "app_email", "attempted_at"),
    )
