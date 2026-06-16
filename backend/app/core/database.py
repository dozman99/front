from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Remote PostgreSQL — conservative pool settings for network reliability
engine = create_engine(
    settings.DATABASE_URL,
    # Test connection before using from pool
    # Critical for remote DB — detects stale connections from network drops
    pool_pre_ping=True,
    # Conservative pool for remote DB over internal network
    pool_size=5,
    max_overflow=10,
    # Fail fast if DB server is unreachable
    connect_args={"connect_timeout": 10},
    # Recycle connections every 30 minutes
    pool_recycle=1800,
    # Max wait for connection from pool
    pool_timeout=30,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
