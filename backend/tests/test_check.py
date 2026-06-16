import pytest
from datetime import datetime, timedelta


def test_check_phone_not_found(client_unauth):
    r = client_unauth.get("/check/phone/+19990001234")
    assert r.status_code == 200
    assert r.json()["status"] == "not_found"


def test_check_phone_active(client_admin, client_unauth):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    r = client_unauth.get("/check/phone/+15550001234")
    assert r.json()["status"] == "active"


def test_check_phone_permanently_banned(client_admin, client_unauth):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "Spam",
    })
    r = client_unauth.get("/check/phone/+15550001234")
    assert r.json()["status"] == "permanently_banned"


def test_check_phone_temp_banned_returns_expiry(client_admin, client_unauth):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    expiry = (datetime.utcnow() + timedelta(hours=3)).isoformat()
    client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": True,
        "expiry_date": expiry,
        "reason": "Temp ban",
    })
    r = client_unauth.get("/check/phone/+15550001234")
    data = r.json()
    assert data["status"] == "temp_banned"
    assert data["expires"] is not None


def test_check_phone_opted_out(client_admin, client_unauth):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    client_admin.patch("/phones/+15550001234", json={"opt_out": True})
    r = client_unauth.get("/check/phone/+15550001234")
    assert r.json()["status"] == "opted_out"


def test_check_opted_out_before_ban(client_admin, client_unauth):
    """Opt-out is checked before ban status."""
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "Banned",
    })
    client_admin.patch("/phones/+15550001234", json={"opt_out": True})
    r = client_unauth.get("/check/phone/+15550001234")
    # opted_out takes precedence over banned
    assert r.json()["status"] == "opted_out"


def test_check_never_returns_ban_reason(client_admin, client_unauth):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "SENSITIVE REASON — never expose",
    })
    r = client_unauth.get("/check/phone/+15550001234")
    data = r.json()
    assert "ban_reason" not in data
    assert "reason" not in data
    assert "banned_by" not in data
    assert "date_banned" not in data
    # Confirm the sensitive data is definitely not anywhere in the response
    assert "SENSITIVE" not in str(data)


def test_check_email_not_found(client_unauth):
    r = client_unauth.get("/check/email/unknown@corp.com")
    assert r.json()["status"] == "not_found"


def test_check_email_active(client_admin, client_unauth):
    client_admin.post("/emails", json={"email_address": "app@corp.com"})
    r = client_unauth.get("/check/email/app@corp.com")
    assert r.json()["status"] == "active"


def test_check_email_permanently_banned(client_admin, client_unauth):
    client_admin.post("/emails", json={"email_address": "app@corp.com"})
    client_admin.post("/emails/app@corp.com/ban", json={
        "is_temporary": False,
        "reason": "Spam",
    })
    r = client_unauth.get("/check/email/app@corp.com")
    assert r.json()["status"] == "permanently_banned"
