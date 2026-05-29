import time
from dataclasses import dataclass
from typing import Annotated, Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt

from app.core.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)

_jwks_cache: dict[str, Any] | None = None
_jwks_cached_at: float = 0.0
_JWKS_TTL_SECONDS = 600


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str | None
    role: str | None


def _jwks_url() -> str:
    settings = get_settings()
    return f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _get_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_cached_at

    now = time.time()
    if _jwks_cache and (now - _jwks_cached_at) < _JWKS_TTL_SECONDS:
        return _jwks_cache

    with httpx.Client(timeout=10.0) as client:
        response = client.get(_jwks_url())
        response.raise_for_status()
        data = response.json()

    _jwks_cache = data
    _jwks_cached_at = now
    return data


def _decode_hs256(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(
        token,
        settings.supabase_jwt_secret,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )


def _decode_jwks(token: str, header: dict[str, Any]) -> dict[str, Any]:
    kid = header.get("kid")
    if not kid:
        raise JWTError("Token sem kid no header")

    jwks = _get_jwks()
    keys = jwks.get("keys") or []
    if not keys:
        raise JWTError("JWKS vazio — projeto pode usar apenas HS256")

    signing_key = None
    for key in keys:
        if key.get("kid") == kid:
            signing_key = key
            break

    if signing_key is None:
        raise JWTError(f"Chave JWKS não encontrada para kid={kid}")

    alg = header.get("alg") or signing_key.get("alg")
    if not alg:
        raise JWTError("Algoritmo JWT não identificado")

    return jwt.decode(
        token,
        signing_key,
        algorithms=[alg],
        options={"verify_aud": False},
    )


def decode_supabase_jwt(token: str) -> dict[str, Any]:
    """Valida access token Supabase: JWKS (ES256/RS256) ou legacy HS256."""
    header = jwt.get_unverified_header(token)
    alg = (header.get("alg") or "").upper()
    errors: list[str] = []

    if alg == "HS256":
        try:
            return _decode_hs256(token)
        except JWTError as exc:
            errors.append(f"HS256: {exc}")

    try:
        return _decode_jwks(token, header)
    except JWTError as exc:
        errors.append(f"JWKS: {exc}")

    if alg != "HS256":
        try:
            return _decode_hs256(token)
        except JWTError as exc:
            errors.append(f"HS256 fallback: {exc}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> AuthUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária",
        )

    payload = decode_supabase_jwt(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem identificador de usuário",
        )

    return AuthUser(
        id=user_id,
        email=payload.get("email"),
        role=payload.get("role"),
    )
