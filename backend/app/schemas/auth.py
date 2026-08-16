"""Auth 相关 Pydantic schema。"""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """注册请求。"""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    """登录请求。"""

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    """刷新请求（备用，主路径从 cookie 读取）。"""

    refresh_token: str | None = None


class TokenResponse(BaseModel):
    """Token 响应。"""

    access_token: str
    token_type: str = "bearer"


class ErrorResponse(BaseModel):
    """统一错误响应。"""

    error_code: str
    message: str | None = None
