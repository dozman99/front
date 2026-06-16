import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db
from app.core.deps import get_current_user, CurrentUser
from app.models.base import Base

# Use SQLite in-memory for tests
# Tests do NOT connect to the remote PostgreSQL server
SQLITE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_user():
    return CurrentUser(username="jsmith", name="John Smith", role="admin")


@pytest.fixture
def helpdesk_user():
    return CurrentUser(username="hduser", name="HD User", role="helpdesk")


@pytest.fixture
def client_admin(admin_user):
    """Test client with admin role injected."""
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: admin_user
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def client_helpdesk(helpdesk_user):
    """Test client with helpdesk role injected."""
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: helpdesk_user
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def client_unauth():
    """Test client with no auth — for testing 401 responses."""
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
