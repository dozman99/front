from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.deps import require_any
from app.models.banned_users import BannedUser
from app.models.banned_apps import BannedApp
from app.models.audit_log import AuditLog

router = APIRouter()

BAN_SPIKE_THRESHOLD = 5   # incidents if >= this many bans in the last hour


@router.get("/stats")
def get_stats(user=Depends(require_any), db: Session = Depends(get_db)):
    now         = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow    = today_start + timedelta(days=1)

    return {
        # Permanent bans only — matches Ban List "Banned" filter (banned=True, temp_ban=False)
        "banned_phones":        db.query(BannedUser).filter(
            BannedUser.banned == True, BannedUser.temp_ban == False,
        ).count(),
        "banned_apps":          db.query(BannedApp).filter(
            BannedApp.banned == True, BannedApp.temp_ban == False,
        ).count(),
        # Temp bans expiring today — matches Ban List "Temp" filter
        "temp_expiring_today":  db.query(BannedUser).filter(
            BannedUser.temp_ban == True,
            BannedUser.date_ban_expire >= today_start,
            BannedUser.date_ban_expire < tomorrow,
        ).count(),
        # Opt-outs — matches Ban List "Opt-Out" filter
        "opt_outs":             db.query(BannedUser).filter(BannedUser.opt_out == True).count(),
        # Deltas — how many of each were added today
        "banned_phones_today":  db.query(BannedUser).filter(
            BannedUser.date_banned >= today_start,
            BannedUser.banned == True,
            BannedUser.temp_ban == False,
        ).count(),
        "banned_apps_today":    db.query(BannedApp).filter(
            BannedApp.date_banned >= today_start,
            BannedApp.banned == True,
            BannedApp.temp_ban == False,
        ).count(),
        "temp_bans_today":      db.query(BannedUser).filter(
            BannedUser.date_banned >= today_start,
            BannedUser.temp_ban == True,
        ).count(),
    }


@router.get("/incidents")
def get_incidents(user=Depends(require_any), db: Session = Depends(get_db)):
    incidents = []
    now   = datetime.utcnow()
    in24h = now + timedelta(hours=24)
    in1h  = now + timedelta(hours=1)

    # Temp bans expiring within the hour (critical)
    for r in db.query(BannedUser).filter(
        BannedUser.temp_ban == True,
        BannedUser.banned == True,
        BannedUser.date_ban_expire >= now,
        BannedUser.date_ban_expire <= in1h,
    ).all():
        mins_left = max(0, int((r.date_ban_expire - now).total_seconds() // 60))
        incidents.append({
            "type": "expiring_soon", "entity": r.phone_number,
            "detail": f"Temp ban expires in {mins_left}m — review before it lifts",
            "severity": "critical",
        })

    # Temp bans expiring within 24h (warning)
    for r in db.query(BannedUser).filter(
        BannedUser.temp_ban == True,
        BannedUser.banned == True,
        BannedUser.date_ban_expire > in1h,
        BannedUser.date_ban_expire <= in24h,
    ).all():
        hours_left = max(0, int((r.date_ban_expire - now).total_seconds() // 3600))
        incidents.append({
            "type": "expiring_ban", "entity": r.phone_number,
            "detail": f"Temp ban expires in {hours_left}h",
            "severity": "warning",
        })

    # Repeat offenders — auto-banned 3+ times, still not permanently banned
    for r in db.query(BannedUser).filter(
        BannedUser.auto_temp_ban_count >= 3,
        BannedUser.banned == True,
    ).all():
        incidents.append({
            "type": "repeat_offender", "entity": r.phone_number,
            "detail": f"Auto-banned {r.auto_temp_ban_count}× — consider permanent ban",
            "severity": "critical",
        })

    # Ban spike — if >= threshold bans in the last hour, surface a warning
    since_1h = now - timedelta(hours=1)
    recent_bans = db.query(AuditLog).filter(
        AuditLog.action.in_(["BAN", "TEMP_BAN"]),
        AuditLog.performed_at >= since_1h,
    ).count()
    if recent_bans >= BAN_SPIKE_THRESHOLD:
        incidents.append({
            "type": "ban_spike", "entity": "System",
            "detail": f"{recent_bans} bans in the last hour — unusual activity",
            "severity": "warning",
        })

    return incidents


@router.get("/activity")
def get_activity(
    hours: int | None = None,
    user=Depends(require_any),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog).order_by(AuditLog.performed_at.desc())
    if hours:
        since = datetime.utcnow() - timedelta(hours=hours)
        q = q.filter(AuditLog.performed_at >= since)
    entries = q.limit(50).all()
    return [
        {
            "id":           e.id,
            "action":       e.action,
            "entity":       e.entity_value,
            "entity_type":  e.entity_type,
            "actor":        e.performed_by,
            "performed_at": e.performed_at.isoformat(),
            "reason":       e.reason,
        }
        for e in entries
    ]
