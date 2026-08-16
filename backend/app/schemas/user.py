"""User Profile 相关 Pydantic schema。"""

from datetime import date, datetime

from pydantic import BaseModel


class ProfileResponse(BaseModel):
    """用户档案响应。"""

    id: int
    email: str
    avatar_url: str | None
    streak_days: int
    level: int
    created_at: datetime

    model_config = {"from_attributes": True}
