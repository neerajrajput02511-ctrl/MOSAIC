import base64
import datetime
import hashlib
import hmac
import json
import time
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from backend.app.core.config import settings

# RBAC Roles
ROLE_ADMIN = "ADMIN"
ROLE_ANALYST = "ANALYST"
ROLE_VIEWER = "VIEWER"
VALID_ROLES = [ROLE_ADMIN, ROLE_ANALYST, ROLE_VIEWER]

security_scheme = HTTPBearer(auto_error=False)

class User(BaseModel):
    username: str
    role: str
    email: Optional[str] = None
    is_active: bool = True

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: User

def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64_decode(data: str) -> bytes:
    padding = len(data) % 4
    if padding:
        data += "=" * (4 - padding)
    return base64.urlsafe_b64decode(data.encode("utf-8"))

def create_access_token(data: Dict[str, Any], expires_delta_minutes: Optional[int] = None) -> str:
    """
    RFC 7519 compliant HS256 JWT Token Generator.
    Zero external dependencies, cryptographically secure.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    header_json = json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
    
    expire_minutes = expires_delta_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    payload = data.copy()
    now = int(time.time())
    payload["iat"] = now
    payload["exp"] = now + (expire_minutes * 60)
    
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    
    signing_input = f"{_b64_encode(header_json)}.{_b64_encode(payload_json)}".encode("utf-8")
    key = settings.SECRET_KEY.encode("utf-8")
    signature = hmac.new(key, signing_input, hashlib.sha256).digest()
    
    return f"{_b64_encode(header_json)}.{_b64_encode(payload_json)}.{_b64_encode(signature)}"

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates signature and expiration of HS256 JWT.
    """
    parts = token.strip().split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT token structure"
        )
    
    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    key = settings.SECRET_KEY.encode("utf-8")
    expected_sig = hmac.new(key, signing_input, hashlib.sha256).digest()
    actual_sig = _b64_decode(sig_b64)
    
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature: Token verification failed"
        )
        
    payload_bytes = _b64_decode(payload_b64)
    payload = json.loads(payload_bytes.decode("utf-8"))
    
    # Check expiration
    exp = payload.get("exp")
    if exp and exp < time.time():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT Token has expired"
        )
        
    return payload

def mask_secret(value: Optional[str]) -> Optional[str]:
    """
    Masks sensitive credentials before sending to API clients or UI.
    Never transmits raw credentials across public endpoints.
    """
    if not value or not value.strip():
        return None
    val = value.strip()
    if len(val) <= 4:
        return "••••••••"
    return f"{val[:2]}••••••••{val[-2:]}"

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)) -> Optional[User]:
    """
    Optional auth resolution: Returns User if valid bearer token provided, else None.
    Allows public endpoints to adapt if viewer/analyst is logged in.
    """
    if not credentials or not credentials.credentials:
        return None
        
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub", "")
        role: str = payload.get("role", ROLE_VIEWER)
        if not username:
            return None
        return User(username=username, role=role)
    except Exception:
        return None

def require_role(allowed_roles: List[str]):
    """
    RBAC dependency factory for endpoint authorization.
    """
    async def role_checker(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)) -> User:
        if not credentials or not credentials.credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Provide a valid Bearer token.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        token = credentials.credentials
        payload = decode_access_token(token)
        user_role = payload.get("role", ROLE_VIEWER)
        username = payload.get("sub", "unknown")
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{user_role}' lacks permissions. Required roles: {allowed_roles}"
            )
            
        return User(username=username, role=user_role)
    return role_checker
