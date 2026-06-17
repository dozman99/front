import pytest
from datetime import datetime, timedelta
from app.services import ban_service
from app.models.banned_users import BannedUser
from app.models.audit_log import AuditLog
from app.core.deps import CurrentUser


def make_user(role="admin"):
    return CurrentUser(username="jsmith", name="John Smith", role=role)


class FakeBanData:
    def __init__(self, is_temporary=False, expiry=None, reason="Test reason"):
        self.is_temporary = is_temporary
        self.expiry_date = expiry
        self.reason = reason


# ── Ban service tests ──────────────────────────────────────────────────────────

def test_ban_writes_banned_true(db):
    result = ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    assert result.banned == True


def test_ban_writes_date_banned(db):
    result = ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    assert result.date_banned is not None


def test_ban_writes_ban_reason(db):
    result = ban_service.ban_phone(db, "+15550001234", FakeBanData(reason="Spam"), make_user())
    assert result.ban_reason == "Spam"


def test_ban_writes_banned_by(db):
    result = ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    assert result.banned_by == "jsmith"


def test_ban_resets_date_unbanned(db):
    record = BannedUser(
        phone_number="+15550001234",
        date_unbanned=datetime.utcnow(),
        unbanned_by="someone",
        unban_reason="previous unban",
    )
    db.add(record)
    db.commit()
    result = ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    assert result.date_unbanned is None


def test_ban_resets_unbanned_by(db):
    record = BannedUser(phone_number="+15550001234", unbanned_by="someone")
    db.add(record)
    db.commit()
    result = ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    assert result.unbanned_by is None


def test_ban_resets_unban_reason(db):
    record = BannedUser(phone_number="+15550001234", unban_reason="old reason")
    db.add(record)
    db.commit()
    result = ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    assert result.unban_reason is None


def test_audit_written_on_ban(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    entries = db.query(AuditLog).all()
    assert len(entries) == 1
    assert entries[0].action in ("BAN", "TEMP_BAN")
    assert entries[0].entity_value == "+15550001234"
    assert entries[0].performed_by == "jsmith"


def test_audit_action_is_temp_ban(db):
    expiry = datetime.utcnow() + timedelta(hours=2)
    ban_service.ban_phone(db, "+15550001234", FakeBanData(True, expiry), make_user())
    entry = db.query(AuditLog).first()
    assert entry.action == "TEMP_BAN"


def test_audit_action_is_ban_when_permanent(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(False), make_user())
    entry = db.query(AuditLog).first()
    assert entry.action == "BAN"


# ── Activate endpoint tests (replaces phone unban) ────────────────────────────

def _seed_banned_phone(db, number="+15550001234", temp=False, expiry=None):
    record = BannedUser(
        phone_number=number,
        banned=True,
        temp_ban=temp,
        date_banned=datetime.utcnow(),
        date_ban_expire=expiry,
        ban_reason="Test ban",
        banned_by="jsmith",
    )
    db.add(record)
    db.commit()


def test_activate_clears_banned(client_admin, db):
    _seed_banned_phone(db)
    res = client_admin.post("/phones/%2B15550001234/activate", json={"reason": "Resolved"})
    assert res.status_code == 200
    assert res.json()["banned"] == False


def test_activate_clears_temp_ban(client_admin, db):
    expiry = datetime.utcnow() + timedelta(hours=2)
    _seed_banned_phone(db, temp=True, expiry=expiry)
    res = client_admin.post("/phones/%2B15550001234/activate", json={"reason": "Resolved"})
    assert res.status_code == 200
    assert res.json()["temp_ban"] == False


def test_activate_clears_ban_reason(client_admin, db):
    _seed_banned_phone(db)
    res = client_admin.post("/phones/%2B15550001234/activate", json={"reason": "Resolved"})
    assert res.json()["ban_reason"] is None


def test_activate_clears_banned_by(client_admin, db):
    _seed_banned_phone(db)
    res = client_admin.post("/phones/%2B15550001234/activate", json={"reason": "Resolved"})
    assert res.json()["banned_by"] is None


def test_activate_writes_audit_log(client_admin, db):
    _seed_banned_phone(db)
    client_admin.post("/phones/%2B15550001234/activate", json={"reason": "Resolved"})
    entries = db.query(AuditLog).filter(AuditLog.action == "UNBAN").all()
    assert len(entries) == 1
    assert entries[0].entity_value == "+15550001234"


def test_activate_404_for_unknown_number(client_admin):
    res = client_admin.post("/phones/%2B19999999999/activate", json={"reason": "test"})
    assert res.status_code == 404
