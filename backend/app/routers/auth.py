"""Auth 路由：注册 / 登录 / 刷新。"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import update_streak
from app.models.user import User
from app.schemas.auth import (
    ErrorResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.config import settings

router = APIRouter()


def _set_refresh_cookie(response: Response, token: str) -> None:
    """将 refresh token 写入 HttpOnly cookie。"""
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=False,  # 开发期 HTTP，生产期需置 True
        samesite="lax",
        max_age=settings.jwt_refresh_expire_days * 86400,
        path="/api/auth",
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"model": ErrorResponse, "description": "邮箱已被注册"},
        422: {"model": ErrorResponse, "description": "输入校验失败"},
    },
)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """注册新用户。"""
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        streak_days=0,
        level=1,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "EMAIL_ALREADY_EXISTS"},
        ) from e

    db.refresh(user)

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    _set_refresh_cookie(response, refresh)

    return TokenResponse(access_token=access)


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={
        401: {"model": ErrorResponse, "description": "凭据无效"},
    },
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """登录并签发 token 对。"""
    user = db.query(User).filter(User.email == payload.email).first()
    # 不区分"用户不存在"与"密码错误"，防止用户枚举
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "INVALID_CREDENTIALS"},
        )

    # 登录时派生 streak_days
    update_streak(user)
    db.commit()

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    _set_refresh_cookie(response, refresh)

    return TokenResponse(access_token=access)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Token 过期或无效"},
    },
)
def refresh(
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """凭 refresh token 签发新的 access token。"""
    token = request.cookies.get("refresh_token")
    if not token:
        # 备用：从 body 读取
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "MISSING_TOKEN"},
        )

    try:
        payload = decode_token(token, expected_type="refresh")
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": e.error_code},
        ) from e

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "TOKEN_INVALID"},
        )

    # 校验用户仍存在
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "USER_NOT_FOUND"},
        )

    access = create_access_token(user.id)
    # 不轮换 refresh token
    return TokenResponse(access_token=access)
