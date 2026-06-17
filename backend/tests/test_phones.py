import pytest
from datetime import datetime, timedelta


def test_list_phones_empty(client_admin):
    r = client_admin.get("/phones")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["results"] == []


def test_add_phone(client_admin):
    r = client_admin.post("/phones", json={"phone_number": "+15550001234"})
    assert r.status_code == 200
    data = r.json()
    assert data["phone_number"] == "+15550001234"
    assert data["banned"] == False
    assert data["opt_out"] == False


def test_add_phone_duplicate(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    r = client_admin.post("/phones", json={"phone_number": "+15550001234"})
    assert r.status_code == 409


def test_ban_phone_permanent(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    r = client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "Spam detected",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["banned"] == True
    assert data["temp_ban"] == False
    assert data["ban_reason"] == "Spam detected"
    assert data["date_ban_expire"] is None


def test_ban_phone_temporary(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    expiry = (datetime.utcnow() + timedelta(hours=2)).isoformat()
    r = client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": True,
        "expiry_date": expiry,
        "reason": "Temp restriction",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["banned"] == True
    assert data["temp_ban"] == True
    assert data["date_ban_expire"] is not None


def test_ban_resets_unban_columns(client_admin, db):
    from app.models.banned_users import BannedUser

    record = BannedUser(
        phone_number="+15550001234",
        date_unbanned=datetime.utcnow(),
        unbanned_by="someone",
        unban_reason="was unbanned",
    )
    db.add(record)
    db.commit()

    r = client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "Re-banning",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["date_unbanned"] is None
    assert data["unbanned_by"] is None
    assert data["unban_reason"] is None


def test_activate_phone(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "Banned",
    })
    r = client_admin.post("/phones/+15550001234/activate", json={
        "reason": "Issue resolved",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["banned"] == False
    assert data["temp_ban"] == False


def test_activate_resets_ban_columns(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "Test ban",
    })
    r = client_admin.post("/phones/+15550001234/activate", json={
        "reason": "Resolved",
    })
    data = r.json()
    assert data["date_banned"] is None
    assert data["date_ban_expire"] is None
    assert data["ban_reason"] is None
    assert data["banned_by"] is None


def test_ban_reason_required(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    r = client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "",
    })
    assert r.status_code == 422


def test_ban_reason_min_length(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    r = client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "ab",
    })
    assert r.status_code == 422


def test_temp_ban_expiry_min_1_hour(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    expiry = (datetime.utcnow() + timedelta(minutes=30)).isoformat()
    r = client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": True,
        "expiry_date": expiry,
        "reason": "Test",
    })
    assert r.status_code == 422


def test_helpdesk_cannot_ban(client_helpdesk):
    r = client_helpdesk.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "Trying to ban",
    })
    assert r.status_code == 403


def test_helpdesk_cannot_activate(client_admin, client_helpdesk):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    client_admin.post("/phones/+15550001234/ban", json={
        "is_temporary": False,
        "reason": "Admin banned",
    })
    r = client_helpdesk.post("/phones/+15550001234/activate", json={
        "reason": "Helpdesk trying to activate",
    })
    assert r.status_code == 403


def test_opt_out_toggle(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001234"})
    r = client_admin.patch("/phones/+15550001234", json={"opt_out": True})
    assert r.status_code == 200
    assert r.json()["opt_out"] == True

    r = client_admin.patch("/phones/+15550001234", json={"opt_out": False})
    assert r.status_code == 200
    assert r.json()["opt_out"] == False


def test_helpdesk_cannot_toggle_opt_out(client_helpdesk):
    r = client_helpdesk.patch("/phones/+15550001234", json={"opt_out": True})
    assert r.status_code == 403


def test_status_filter(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001111"})
    client_admin.post("/phones", json={"phone_number": "+15550002222"})
    client_admin.post("/phones/+15550001111/ban", json={
        "is_temporary": False,
        "reason": "Test ban",
    })

    r = client_admin.get("/phones?status=banned")
    results = r.json()["results"]
    assert len(results) == 1
    assert results[0]["phone_number"] == "+15550001111"

    r = client_admin.get("/phones?status=active")
    results = r.json()["results"]
    assert len(results) == 1
    assert results[0]["phone_number"] == "+15550002222"


def test_search_filter(client_admin):
    client_admin.post("/phones", json={"phone_number": "+15550001111"})
    client_admin.post("/phones", json={"phone_number": "+15559999999"})

    r = client_admin.get("/phones?search=5550001")
    results = r.json()["results"]
    assert len(results) == 1
    assert "+15550001111" in results[0]["phone_number"]
