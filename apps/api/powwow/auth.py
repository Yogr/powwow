from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

bearer = HTTPBearer(auto_error=False)


@lru_cache
def jwks_client(url: str):
    return jwt.PyJWKClient(url, cache_keys=True, lifespan=300, timeout=5)


def owner_id(request: Request, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    cfg = settings()
    if cfg.local_auth and cfg.app_env == "development":
        allowed_hosts = {x.strip() for x in cfg.local_auth_allowed_hosts.split(",")}
        if not request.client or request.client.host not in allowed_hosts:
            raise HTTPException(403, detail={"code": "local_only", "message": "Local development authentication is restricted to configured loopback peers."})
        origin = request.headers.get("origin")
        if origin and origin not in cfg.cors_origins.split(","):
            raise HTTPException(403, detail={"code": "origin_denied", "message": "This origin is not permitted for local access."})
        return cfg.local_owner_id
    if not credentials:
        raise HTTPException(401, detail={"code": "auth_required", "message": "Sign in to access your workspace."})
    try:
        token = credentials.credentials
        issuer = cfg.supabase_url.rstrip("/") + "/auth/v1"
        algorithm = jwt.get_unverified_header(token).get("alg")
        if algorithm == "HS256" and cfg.supabase_jwt_secret:
            key = cfg.supabase_jwt_secret
            algorithms = ["HS256"]
        else:
            if algorithm not in ["ES256", "RS256"]:
                raise jwt.InvalidAlgorithmError("Unsupported token algorithm")
            key = jwks_client(issuer + "/.well-known/jwks.json").get_signing_key_from_jwt(token).key
            algorithms = ["ES256", "RS256"]
        claims = jwt.decode(token, key, algorithms=algorithms, audience="authenticated", issuer=issuer, options={"require": ["exp", "sub", "iss", "aud"]})
        if claims.get("role") != "authenticated" or not claims.get("sub"):
            raise jwt.InvalidTokenError("Authenticated user token required")
        # Retain only in request memory. Targeted invitations check the auth
        # server's confirmed email, never editable user_metadata claims.
        request.state.auth_token = token
        return str(claims["sub"])
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(401, detail={"code": "invalid_token", "message": "Your session is invalid or expired. Sign in again."}) from None

