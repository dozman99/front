from sqlalchemy.orm import Session
from app.models.ad_groups import AdGroupRole
from app.core.config import settings


def resolve_role(db: Session, ad_groups: list) -> str | None:
    """
    Given a list of AD group names from the SAML assertion,
    return the highest role found in ad_group_roles table.
    Returns 'admin' > 'helpdesk' > None.
    """
    role = None
    for group in ad_groups:
        record = db.query(AdGroupRole).filter_by(group_name=group).first()
        if record:
            if record.role == "admin":
                return "admin"
            if record.role == "helpdesk":
                role = "helpdesk"
    return role


def sync_groups(db: Session) -> dict:
    """
    Connect to AD via LDAP and verify each mapped group still exists.
    Returns counts of found/missing groups and member counts for each.
    Raises ValueError if LDAP is not configured.
    """
    if not settings.LDAP_SERVER or not settings.LDAP_BIND_DN:
        raise ValueError("LDAP not configured — set LDAP_SERVER, LDAP_BIND_DN, LDAP_BIND_PASSWORD, LDAP_BASE_DN in .env")

    try:
        from ldap3 import Server, Connection, ALL, SUBTREE
    except ImportError:
        raise ValueError("ldap3 package not installed")

    mapped_groups = db.query(AdGroupRole).all()
    if not mapped_groups:
        return {"synced": 0, "groups": [], "not_found": []}

    server = Server(settings.LDAP_SERVER, get_info=ALL)
    conn = Connection(
        server,
        user=settings.LDAP_BIND_DN,
        password=settings.LDAP_BIND_PASSWORD,
        auto_bind=True,
    )

    results = []
    not_found = []

    for group in mapped_groups:
        dn = group.group_name
        # Try exact DN lookup first, fall back to cn= search
        conn.search(
            search_base=dn if "=" in dn else settings.LDAP_BASE_DN,
            search_filter=f"(distinguishedName={dn})" if "=" in dn else f"(cn={dn})",
            search_scope=SUBTREE,
            attributes=["member", "cn"],
        )
        if conn.entries:
            entry = conn.entries[0]
            members = entry.member.values if hasattr(entry, "member") else []
            results.append({
                "group_name": dn,
                "role": group.role,
                "member_count": len(members),
            })
        else:
            not_found.append(dn)

    conn.unbind()

    return {
        "synced": len(results),
        "groups": results,
        "not_found": not_found,
    }
