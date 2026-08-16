"""Analytics 路由：统计概览 / 日历热力图 / 成就列表。"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.achievement import Achievement
from app.models.study_log import StudyLog
from app.models.user import User
from app.schemas.analytics import (
    AchievementOut,
    AnalyticsOverview,
    CalendarDay,
)
from app.services.achievements import ACHIEVEMENTS, _compute_streak_days

router = APIRouter()


def _level_for_minutes(minutes: int) -> int:
    """学习时长分档：0 / 1-15 / 16-30 / 31-60 / 60+ → level 0-4。"""
    if minutes <= 0:
        return 0
    if minutes <= 15:
        return 1
    if minutes <= 30:
        return 2
    if minutes <= 60:
        return 3
    return 4


@router.get(
    "/overview",
    response_model=AnalyticsOverview,
    summary="统计概览聚合数据",
)
def get_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsOverview:
    """返回当前用户的今日/本周学习时长、完成目标数、连续打卡天数、周排名。"""
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # 周一作为一周起点
    week_end = week_start + timedelta(days=6)

    # 今日聚合
    today_row = (
        db.query(
            func.sum(StudyLog.study_minutes),
            func.sum(StudyLog.goals_completed),
        )
        .filter(StudyLog.user_id == user.id, StudyLog.date == today)
        .first()
    )
    today_minutes = int(today_row[0] or 0)
    today_goals_completed = int(today_row[1] or 0)

    # 本周聚合
    week_row = (
        db.query(func.sum(StudyLog.study_minutes))
        .filter(
            StudyLog.user_id == user.id,
            StudyLog.date >= week_start,
            StudyLog.date <= week_end,
        )
        .first()
    )
    week_minutes = int(week_row[0] or 0)

    # 连续打卡天数（从 study_logs 派生，不依赖 user.streak_days 冗余字段）
    streak_days = _compute_streak_days(user.id, db)

    # 周排名：按本周学习时长降序，并列时按 user_id 升序
    week_rank_query = (
        db.query(
            StudyLog.user_id,
            func.sum(StudyLog.study_minutes).label("week_total"),
        )
        .filter(
            StudyLog.date >= week_start,
            StudyLog.date <= week_end,
        )
        .group_by(StudyLog.user_id)
        .order_by(func.sum(StudyLog.study_minutes).desc(), StudyLog.user_id.asc())
        .all()
    )
    weekly_rank = 0
    for idx, (uid, _total) in enumerate(week_rank_query, start=1):
        if uid == user.id:
            weekly_rank = idx
            break

    return AnalyticsOverview(
        today_minutes=today_minutes,
        week_minutes=week_minutes,
        today_goals_completed=today_goals_completed,
        streak_days=streak_days,
        weekly_rank=weekly_rank,
    )


@router.get(
    "/calendar",
    response_model=list[CalendarDay],
    summary="学习日历热力图数据",
)
def get_calendar(
    days: int = Query(default=90, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CalendarDay]:
    """返回近 N 天每日学习活跃度，level 0-4 分档。"""
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    # 查询近 N 天的聚合数据
    rows = (
        db.query(
            StudyLog.date,
            func.sum(StudyLog.study_minutes).label("total_minutes"),
        )
        .filter(
            StudyLog.user_id == user.id,
            StudyLog.date >= start_date,
            StudyLog.date <= today,
        )
        .group_by(StudyLog.date)
        .all()
    )
    minutes_map = {row.date: int(row.total_minutes or 0) for row in rows}

    # 构造完整 N 天数组（含 level 0 的日期）
    result: list[CalendarDay] = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        minutes = minutes_map.get(d, 0)
        result.append(CalendarDay(date=d, level=_level_for_minutes(minutes)))

    return result


@router.get(
    "/achievements",
    response_model=list[AchievementOut],
    summary="成就列表与解锁状态",
)
def get_achievements(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AchievementOut]:
    """返回成就列表，已解锁优先 + unlocked_at 降序，未解锁按预定义顺序。"""
    # 查询已解锁记录
    unlocked_map = {
        row.code: row.unlocked_at
        for row in db.query(Achievement)
        .filter(Achievement.user_id == user.id)
        .all()
    }

    unlocked_list: list[AchievementOut] = []
    locked_list: list[AchievementOut] = []
    for ach in ACHIEVEMENTS:
        unlocked_at = unlocked_map.get(ach["code"])
        out = AchievementOut(
            code=ach["code"],
            title=ach["title"],
            description=ach["description"],
            icon=ach["icon"],
            unlocked=unlocked_at is not None,
            unlocked_at=unlocked_at,
        )
        if out.unlocked:
            unlocked_list.append(out)
        else:
            locked_list.append(out)

    # 已解锁按 unlocked_at 降序
    unlocked_list.sort(key=lambda x: x.unlocked_at, reverse=True)
    # 未解锁按预定义顺序（已是原顺序）
    return unlocked_list + locked_list
