from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_session_token, decode_session_token
from app.core.deps import get_current_user
from app.services.ad_service import resolve_role
from app.core.config import settings

router = APIRouter()


@router.post("/saml/login")
def saml_login(request: Request):
    """
    Initiate SAML SSO login.
    Returns redirect URL to SECDS IDP.
    In production, use python3-saml to build the auth request.
    """
    try:
        from onelogin.saml2.auth import OneLogin_Saml2_Auth
        req = _prepare_saml_request(request)
        auth = OneLogin_Saml2_Auth(req, _get_saml_settings())
        redirect_url = auth.login()
        return {"redirect_url": redirect_url}
    except ImportError:
        # python3-saml not available in test environment
        raise HTTPException(503, "SAML not configured")
    except Exception as e:
        raise HTTPException(500, f"SAML login error: {str(e)}")


@router.post("/saml/callback")
async def saml_callback(request: Request, db: Session = Depends(get_db)):
    """
    Receive SAML assertion from IDP.
    Validates assertion, resolves role, sets session cookie.
    Redirects to /dashboard on success.
    """
    try:
        from onelogin.saml2.auth import OneLogin_Saml2_Auth
        req = _prepare_saml_request(request)
        auth = OneLogin_Saml2_Auth(req, _get_saml_settings())
        auth.process_response()
        errors = auth.get_errors()

        if errors:
            raise HTTPException(401, f"SAML error: {', '.join(errors)}")

        if not auth.is_authenticated():
            raise HTTPException(401, "SAML authentication failed")

        # Extract user info from assertion
        attributes = auth.get_attributes()
        username = auth.get_nameid()
        name = _extract_attr(attributes, ["displayName", "cn", "name"], username)
        ad_groups = _extract_attr(attributes, ["memberOf", "groups"], [], is_list=True)

        # Resolve role from AD groups
        role = resolve_role(db, ad_groups)
        if not role:
            raise HTTPException(
                403,
                "Not authorized — your account is not in an authorized AD group. "
                "Contact your administrator."
            )

        # Create session token
        token = create_session_token({
            "sub": username,
            "name": name,
            "role": role,
        })

        response = RedirectResponse(url="/dashboard", status_code=302)
        response.set_cookie(
            key="sas_session",
            value=token,
            httponly=True,
            secure=settings.ENVIRONMENT == "production",
            samesite="lax",
            max_age=settings.SESSION_EXPIRE_HOURS * 3600,
        )
        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"SAML callback error: {str(e)}")


@router.get("/me")
def get_me(user=Depends(get_current_user)):
    """Return current authenticated user info."""
    return {
        "username": user.username,
        "name": user.name,
        "role": user.role,
    }


@router.post("/dev-login")
def dev_login(
    response: Response,
    username: str = "dev-admin",
    role: str = "admin",
):
    """
    Development-only login. Creates a session cookie without SAML.
    Disabled in production.
    """
    if settings.ENVIRONMENT == "production":
        raise HTTPException(404, "Not found")
    if role not in ("admin", "helpdesk"):
        raise HTTPException(400, "role must be admin or helpdesk")

    token = create_session_token({"sub": username, "name": username, "role": role})
    response.set_cookie(
        key="sas_session",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=settings.SESSION_EXPIRE_HOURS * 3600,
    )
    return {"username": username, "name": username, "role": role}


@router.get("/debug-session")
def debug_session(request: Request):
    """Dev-only: shows the raw cookie and decoded role the server sees."""
    if settings.ENVIRONMENT == "production":
        raise HTTPException(404, "Not found")
    raw = request.cookies.get("sas_session", "")
    payload = decode_session_token(raw) if raw else None
    return {
        "cookie_present": bool(raw),
        "cookie_preview": raw[:40] + "..." if len(raw) > 40 else raw,
        "decoded_role": payload.get("role") if payload else None,
        "decoded_sub": payload.get("sub") if payload else None,
    }


@router.post("/logout")
def logout(response: Response):
    """Clear session cookie."""
    response.delete_cookie("sas_session", httponly=True, samesite="lax", path="/")
    return {"message": "Logged out"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _prepare_saml_request(request: Request) -> dict:
    """Prepare request dict for python3-saml."""
    return {
        "https": "on" if settings.ENVIRONMENT == "production" else "off",
        "http_host": request.headers.get("host", "localhost"),
        "script_name": request.url.path,
        "server_port": str(request.url.port or 443),
        "get_data": dict(request.query_params),
        "post_data": {},
    }


def _get_saml_settings() -> dict:
    """Build python3-saml settings dict from environment config."""
    with open(settings.SAML_SP_PRIVATE_KEY_FILE, "r") as f:
        private_key = f.read()
    with open(settings.SAML_SP_CERT_FILE, "r") as f:
        cert = f.read()

    return {
        "strict": True,
        "debug": settings.ENVIRONMENT == "development",
        "sp": {
            "entityId": settings.SAML_SP_ENTITY_ID,
            "assertionConsumerService": {
                "url": f"{settings.SAML_SP_ENTITY_ID}/auth/saml/callback",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
            },
            "x509cert": cert,
            "privateKey": private_key,
        },
        "idp": {
            "entityId": settings.SAML_IDP_METADATA_URL,
            "singleSignOnService": {
                "url": settings.SAML_IDP_METADATA_URL,
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
            },
            "x509cert": "",
        },
    }


def _extract_attr(attributes: dict, keys: list, default, is_list=False):
    """Extract first matching attribute from SAML attributes dict."""
    for key in keys:
        if key in attributes:
            val = attributes[key]
            if is_list:
                return val if isinstance(val, list) else [val]
            return val[0] if isinstance(val, list) else val
    return default
