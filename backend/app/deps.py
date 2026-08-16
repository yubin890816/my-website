"""FastAPI 依赖注入。"""

from datetime import date

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.security import TokenError, decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """从 Bearer access token 解析当前用户。

    Raises:
        HTTPException 401: MISSING_TOKEN / TOKEN_EXPIRED / TOKEN_INVALID / USER_NOT_FOUND
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "MISSING_TOKEN"},
        )

    try:
        payload = decode_token(credentials.credentials, expected_type="access")
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

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "USER_NOT_FOUND"},
        )

    return user


def update_streak(user: User, today: date | None = None) -> None:
    """根据 last_activity_date 派生 streak_days。

    规则（见 user-profile spec）：
    - 同日重复登录：streak 不变
    - 昨日有活动：streak +1
    - 中断 ≥2 天：重置为 1
    """
    if today is None:
        today = date.today()

    if user.last_activity_date == today:
        return  # 同日不累加

    if user.last_activity_date is not None:
        delta = today - user.last_activity_date
        if delta.days == 1:
            user.streak_days = (user.streak_days or 0) + 1
        else:
            user.streak_days = 1
    else:
        user.streak_days = 1

    user.last_activity_date = today


def compute_level(xp: int | None) -> int:
    """根据 XP 按固定阈值表派生 level。

    阈值：Lv1=0 / Lv2=100 / Lv3=500 / Lv4=1500 / Lv5=4000
    """
    if xp is None or xp < 0:
        return 1

    thresholds = [
        (4000, 5),
        (1500, 4),
        (500, 3),
        (100, 2),
        (0, 1),
    ]
    for threshold, level in thresholds:
        if xp >= threshold:
            return level
    return 1
