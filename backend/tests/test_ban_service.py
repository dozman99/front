import pytest
from datetime import datetime, timedelta
from app.services import ban_service, unban_service
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


class FakeUnbanData:
    def __init__(self, reason="Resolved"):
        self.reason = reason


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


def test_unban_writes_banned_false(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    result = unban_service.unban_phone(db, "+15550001234", FakeUnbanData(), make_user())
    assert result.banned == False


def test_unban_writes_temp_ban_false(db):
    expiry = datetime.utcnow() + timedelta(hours=2)
    ban_service.ban_phone(db, "+15550001234", FakeBanData(True, expiry), make_user())
    result = unban_service.unban_phone(db, "+15550001234", FakeUnbanData(), make_user())
    assert result.temp_ban == False


def test_unban_writes_date_unbanned(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    result = unban_service.unban_phone(db, "+15550001234", FakeUnbanData(), make_user())
    assert result.date_unbanned is not None


def test_unban_resets_date_banned(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    result = unban_service.unban_phone(db, "+15550001234", FakeUnbanData(), make_user())
    assert result.date_banned is None


def test_unban_resets_ban_reason(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(reason="Spam"), make_user())
    result = unban_service.unban_phone(db, "+15550001234", FakeUnbanData(), make_user())
    assert result.ban_reason is None


def test_unban_resets_banned_by(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    result = unban_service.unban_phone(db, "+15550001234", FakeUnbanData(), make_user())
    assert result.banned_by is None


def test_audit_written_on_ban(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    entries = db.query(AuditLog).all()
    assert len(entries) == 1
    assert entries[0].action in ("BAN", "TEMP_BAN")
    assert entries[0].entity_value == "+15550001234"
    assert entries[0].performed_by == "jsmith"


def test_audit_written_on_unban(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(), make_user())
    unban_service.unban_phone(db, "+15550001234", FakeUnbanData(), make_user())
    entries = db.query(AuditLog).all()
    assert len(entries) == 2
    actions = [e.action for e in entries]
    assert "UNBAN" in actions


def test_audit_action_is_temp_ban(db):
    expiry = datetime.utcnow() + timedelta(hours=2)
    ban_service.ban_phone(db, "+15550001234", FakeBanData(True, expiry), make_user())
    entry = db.query(AuditLog).first()
    assert entry.action == "TEMP_BAN"


def test_audit_action_is_ban_when_permanent(db):
    ban_service.ban_phone(db, "+15550001234", FakeBanData(False), make_user())
    entry = db.query(AuditLog).first()
    assert entry.action == "BAN"
