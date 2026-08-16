"""Users 路由：Profile 读取。"""

from fastapi import APIRouter, Depends

from app.deps import compute_level, get_current_user
from app.models.user import User
from app.schemas.user import ProfileResponse

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)) -> ProfileResponse:
    """返回当前登录用户的 Profile。"""
    # level 按 xp 实时派生（避免 xp 更新后 level 不同步）
    profile = ProfileResponse.model_validate(current_user)
    profile.level = compute_level(current_user.xp)
    return profile
