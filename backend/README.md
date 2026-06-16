# SAS Relay — Backend

FastAPI backend for the SAS Relay SMS Gateway ban management portal.

## Requirements

- Python 3.11
- PostgreSQL on a remote server (not localhost)
- All packages from `sas-relay-local-libs` — no internet install

## Quick Start

```bash
# 1. Clone repos
git clone https://your-gitlab.com/wvt/sas-relay-backend.git
git clone https://your-gitlab.com/wvt/sas-relay-local-libs.git

# 2. Create venv
cd sas-relay-backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# 3. Extract and install packages from local-libs
mkdir -p ../sas-wheels
unzip ../sas-relay-local-libs/python-packages.zip -d ../sas-wheels/
pip install --no-index --find-links ../sas-wheels -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your DB connection string and secrets

# 5. Run migrations
alembic upgrade head

# 6. Start dev server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs available at: http://127.0.0.1:8000/docs (dev only)

## Run Tests

```bash
pytest tests/ -v --tb=short
```

Tests use SQLite in-memory — no remote DB connection needed.

## Connection String Format

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Example:
```
DATABASE_URL=postgresql://sas_relay_user:mypassword@10.0.1.20:5432/sas_relay
```

## Key Rules

- `ban_reason` is never returned from `/check/*` endpoints
- All ban/unban actions write to `audit_log`
- Ban resets all unban columns to NULL
- Unban resets all ban columns to NULL
- Phone numbers can opt-out — apps cannot
- Throttle caps are per-app only — not per phone number
