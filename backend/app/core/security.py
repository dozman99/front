from typing import Optional, Dict, Any
from itsdangerous import TimestampSigner, BadSignature, SignatureExpired
import json
import base64
from app.core.config import settings

signer = TimestampSigner(settings.SECRET_KEY)


def create_session_token(payload: Dict[str, Any]) -> str:
    """Create a signed session token from a payload dict."""
    data = json.dumps(payload)
    encoded = base64.urlsafe_b64encode(data.encode()).decode()
    return signer.sign(encoded).decode()


def decode_session_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a session token. Returns None if invalid or expired."""
    try:
        max_age = settings.SESSION_EXPIRE_HOURS * 3600
        unsigned = signer.unsign(token, max_age=max_age)
        data = base64.urlsafe_b64decode(unsigned).decode()
        return json.loads(data)
    except (BadSignature, SignatureExpired, Exception):
        return None
