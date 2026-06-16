from fastapi import Request, Depends, HTTPException
from app.core.security import decode_session_token


class CurrentUser:
    def __init__(self, username: str, name: str, role: str):
        self.username = username
        self.name = name
        self.role = role


def get_current_user(
    request: Request,
) -> CurrentUser:
    token = request.cookies.get("sas_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_session_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired")
    return CurrentUser(
        username=payload["sub"],
        name=payload.get("name", payload["sub"]),
        role=payload["role"],
    )


def require_admin(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_any(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    if user.role not in ["admin", "helpdesk"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return user
