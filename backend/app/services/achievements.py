"""成就定义与解锁逻辑服务。

成就定义硬编码在本模块（design.md Decision 2）。解锁检查在写入 study_logs 后触发，
遍历未解锁成就判断条件，满足则 INSERT 到 achievements 表（依赖 UNIQUE 约束防重复）。
"""

from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.achievement import Achievement
from app.models.study_log import StudyLog
from app.models.user import User

# 成就定义（顺序即未解锁时的展示顺序）
ACHIEVEMENTS: list[dict[str, str]] = [
    {
        "code": "first_log",
        "title": "初次打卡",
        "description": "记录第一条学习日志",
        "icon": "🌱",
    },
    {
        "code": "streak_7",
        "title": "一周坚持",
        "description": "连续学习 7 天",
        "icon": "🔥",
    },
    {
        "code": "streak_30",
        "title": "月度坚持",
        "description": "连续学习 30 天",
        "icon": "🏆",
    },
    {
        "code": "level_5",
        "title": "等级达人",
        "description": "达到 Lv 5",
        "icon": "⭐",
    },
    {
        "code": "goals_10",
        "title": "目标达人",
        "description": "累计完成 10 个目标",
        "icon": "🎯",
    },
]


def _compute_streak_days(user_id: int, db: Session) -> int:
    """从今日倒推连续有 study_logs 记录的天数。今日无记录时返回 0。"""
    last_date = (
        db.query(func.max(StudyLog.date))
        .filter(StudyLog.user_id == user_id)
        .scalar()
    )
    if last_date is None:
        return 0
    # 若最后记录日期是今天，从今天倒推；否则 streak 为 0（断签）
    if last_date != date.today():
        return 0
    streak = 0
    d = date.today()
    while (
        db.query(StudyLog)
        .filter(StudyLog.user_id == user_id, StudyLog.date == d)
        .first()
        is not None
    ):
        streak += 1
        d -= timedelta(days=1)
    return streak


def _total_goals_completed(user_id: int, db: Session) -> int:
    """累计完成目标数（sum goals_completed）。"""
    total = (
        db.query(func.sum(StudyLog.goals_completed))
        .filter(StudyLog.user_id == user_id)
        .scalar()
    )
    return int(total or 0)


def _has_any_log(user_id: int, db: Session) -> bool:
    """是否至少有一条 study_logs 记录。"""
    return (
        db.query(StudyLog.id)
        .filter(StudyLog.user_id == user_id)
        .first()
        is not None
    )


def _is_condition_met(code: str, user: User, db: Session) -> bool:
    """判断指定成就是否满足解锁条件。"""
    if code == "first_log":
        return _has_any_log(user.id, db)
    if code == "streak_7":
        return _compute_streak_days(user.id, db) >= 7
    if code == "streak_30":
        return _compute_streak_days(user.id, db) >= 30
    if code == "level_5":
        return user.level >= 5
    if code == "goals_10":
        return _total_goals_completed(user.id, db) >= 10
    return False


def check_and_unlock(user: User, db: Session) -> list[str]:
    """检查所有未解锁成就，满足条件则写入 achievements 表。

    返回本次新解锁的 code 列表（可能为空）。
    依赖 UNIQUE(user_id, code) 约束防止重复解锁。
    """
    # 查询已解锁的 code 集合
    unlocked_codes = {
        row[0]
        for row in db.query(Achievement.code)
        .filter(Achievement.user_id == user.id)
        .all()
    }
    newly_unlocked: list[str] = []
    for ach in ACHIEVEMENTS:
        code = ach["code"]
        if code in unlocked_codes:
            continue
        if _is_condition_met(code, user, db):
            db.add(Achievement(user_id=user.id, code=code))
            newly_unlocked.append(code)
    if newly_unlocked:
        db.flush()
    return newly_unlocked
