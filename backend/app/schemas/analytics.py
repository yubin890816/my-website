"""Analytics 相关 Pydantic schema。"""

from datetime import date, datetime

from pydantic import BaseModel, Field


class AnalyticsOverview(BaseModel):
    """统计概览响应。所有数值非负整数，缺失为 0。"""

    today_minutes: int = 0
    week_minutes: int = 0
    today_goals_completed: int = 0
    streak_days: int = 0
    weekly_rank: int = 0


class CalendarDay(BaseModel):
    """日历热力图单日数据。level 0-4，0 表示无记录。"""

    date: date
    level: int = Field(ge=0, le=4)


class AchievementOut(BaseModel):
    """成就对外响应。unlocked_at 在未解锁时为 null。"""

    code: str
    title: str
    description: str
    icon: str
    unlocked: bool = False
    unlocked_at: datetime | None = None


class StudyLogCreate(BaseModel):
    """学习日志写入请求。date 为 YYYY-MM-DD，study_minutes 与 goals_completed 非负。"""

    date: date
    study_minutes: int = Field(default=0, ge=0, le=1440)
    goals_completed: int = Field(default=0, ge=0, le=100)


class StudyLogOut(BaseModel):
    """学习日志对外响应。"""

    id: int
    user_id: int
    date: date
    study_minutes: int
    goals_completed: int

    model_config = {"from_attributes": True}
