"""安全模块：密码哈希与 JWT 签发/校验。"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# bcrypt cost factor 由 passlib 默认值（12）控制
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """对明文密码做 bcrypt 哈希。"""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """校验明文密码与哈希是否匹配。"""
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str | int) -> str:
    """签发短时 access token。"""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_expire_minutes
    )
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str | int) -> str:
    """签发长时 refresh token。"""
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.jwt_refresh_expire_days
    )
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


class TokenError(Exception):
    """Token 校验失败的基类。"""

    error_code: str = "TOKEN_INVALID"

    def __init__(self, error_code: str | None = None) -> None:
        if error_code:
            self.error_code = error_code
        super().__init__(self.error_code)


class TokenExpiredError(TokenError):
    """Token 已过期。"""

    error_code = "TOKEN_EXPIRED"


class TokenInvalidError(TokenError):
    """Token 签名无效或格式错误。"""

    error_code = "TOKEN_INVALID"


def decode_token(token: str, expected_type: str = "access") -> dict[str, Any]:
    """校验并解码 JWT。

    Args:
        token: JWT 字符串
        expected_type: 期望的 token 类型（access / refresh）

    Returns:
        JWT payload dict

    Raises:
        TokenExpiredError: token 已过期
        TokenInvalidError: 签名无效或类型不匹配
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError as e:
        raise TokenExpiredError() from e
    except JWTError as e:
        raise TokenInvalidError() from e

    if payload.get("type") != expected_type:
        raise TokenInvalidError()

    return payload
