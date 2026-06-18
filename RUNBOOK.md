# SAS Relay — Windows Deployment Runbook

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|---|---|---|
| Python | 3.11+ | https://www.python.org/downloads/ |
| Node.js | 20 LTS | https://nodejs.org/ |
| PostgreSQL | 15+ | https://www.postgresql.org/download/windows/ |
| Git | Latest | https://git-scm.com/download/win |

---

## Step 1 — Clone the repo

Open PowerShell:

```powershell
git clone https://github.com/dozman99/front.git C:\sas-relay
cd C:\sas-relay
```

---

## Step 2 — Create the PostgreSQL database

Open **pgAdmin** or **psql** and run:

```sql
CREATE USER sas_relay_user WITH PASSWORD 'yourpassword';
CREATE DATABASE sas_relay OWNER sas_relay_user;
GRANT ALL PRIVILEGES ON DATABASE sas_relay TO sas_relay_user;
```

---

## Step 3 — Backend setup

```powershell
cd C:\sas-relay\backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configure environment

The `.env` file is included in the repo with dev defaults. Update these values to match your local setup:

```
DATABASE_URL=postgresql://sas_relay_user:yourpassword@localhost:5432/sas_relay
SECRET_KEY=any-64-char-random-string
ENVIRONMENT=development
```

To generate a new SECRET_KEY:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

### Create placeholder SAML files

SAML is not needed in development — dev-login is used instead. The files just need to exist:

```powershell
New-Item -ItemType Directory -Force -Path saml
"placeholder" | Out-File saml\sp_private.pem
"placeholder" | Out-File saml\sp_cert.pem
```

### Run database migrations

```powershell
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

### Load test data

```powershell
psql -U sas_relay_user -d sas_relay -f ..\test_data.sql
```

> If psql is not on your PATH, add `C:\Program Files\PostgreSQL\15\bin` to your system PATH.

### Start the backend

```powershell
uvicorn app.main:app --reload --port 8000
```

Backend is running at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

---

## Step 4 — Frontend setup

Open a **second PowerShell window**:

```powershell
cd C:\sas-relay\frontend
npm install
npm run dev
```

Frontend is running at `http://localhost:5173`

---

## Step 5 — Log in (dev mode)

Because `ENVIRONMENT=development`, SAML is bypassed and a dev login button is shown on the login page.

Go to `http://localhost:5173/login` and use:

| Role | Username |
|---|---|
| Admin | dev-admin |
| Helpdesk | dev-helpdesk |

Or call the endpoint directly from PowerShell:

```powershell
# Admin session
curl -X POST "http://localhost:8000/auth/dev-login?username=dev-admin&role=admin"

# Helpdesk session
curl -X POST "http://localhost:8000/auth/dev-login?username=dev-helpdesk&role=helpdesk"
```

---

## Step 6 — Verify

| URL | What you should see |
|---|---|
| `http://localhost:5173/dashboard` | Dashboard with test data stats |
| `http://localhost:5173/ban-list` | 12 phones, 5 emails |
| `http://localhost:5173/check` | Public status check — no login needed |
| `http://localhost:8000/docs` | FastAPI Swagger UI |

---

## SMS Gateway integration — message_log

The portal displays a **Last 20 Messages** tab inside every phone/email drawer in the Ban List. This tab reads from the `message_log` table, which the portal creates but never writes to. Your SMS gateway is responsible for inserting a row here every time it attempts to send a message.

### Table: `message_log`

| Column | Type | Required | Description |
|---|---|---|---|
| `app_email` | `VARCHAR(255)` | Yes | The sending application's email address (e.g. `sms-service@corp.com`) |
| `phone_number` | `VARCHAR(20)` | Yes | The recipient phone number in E.164 format (e.g. `+12025550101`) |
| `attempted_at` | `TIMESTAMP` | Yes | UTC timestamp of the send attempt |
| `status` | `VARCHAR(30)` | Yes | `Delivered`, `Blocked`, or `Throttled` |
| `block_reason` | `VARCHAR(50)` | No | Why the message was blocked — set when `status = Blocked`. Use one of: `phone_banned`, `temp_banned`, `email_banned`, `opt_out` |

### What your gateway should do

After calling `GET /check/phone/{number}` or `GET /check/email/{address}` and processing the result, insert a row:

```sql
INSERT INTO message_log (app_email, phone_number, attempted_at, status, block_reason)
VALUES (
  'sms-service@corp.com',   -- your application identity
  '+12025550101',           -- recipient
  NOW(),                    -- UTC
  'Blocked',                -- Delivered | Blocked | Throttled
  'phone_banned'            -- NULL if not blocked
);
```

The portal user `sas_relay_user` already has INSERT privileges on this table. No schema changes are needed — the table is created by `alembic upgrade head` during deployment.

---

## Production checklist (when moving off localhost)

- [ ] Set `ENVIRONMENT=production` in `.env`
- [ ] Replace `SECRET_KEY` with a strong random value
- [ ] Set real `DATABASE_URL` pointing at your production DB
- [ ] Configure SAML: fill in `SAML_SP_ENTITY_ID`, `SAML_IDP_METADATA_URL`, and place real PEM files in `saml/`
- [ ] Set `LDAP_SERVER`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, `LDAP_BASE_DN` for AD sync
- [ ] Build the frontend: `npm run build` — serve the `dist/` folder via IIS or nginx
- [ ] Remove `backend/.env` from git and use environment variables or a secrets manager instead
- [ ] Map AD groups to roles in the Settings page before going live
