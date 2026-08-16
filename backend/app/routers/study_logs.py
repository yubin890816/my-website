"""Study logs 路由：记录学习日志（触发成就解锁检查）。"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.study_log import StudyLog
from app.models.user import User
from app.schemas.analytics import StudyLogCreate, StudyLogOut
from app.services.achievements import check_and_unlock

router = APIRouter()


@router.post(
    "",
    response_model=StudyLogOut,
    status_code=status.HTTP_201_CREATED,
    summary="记录学习日志",
)
def create_study_log(
    payload: StudyLogCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyLogOut:
    """写入学习日志。

    同一用户同一日期的记录通过 UNIQUE 约束处理：
    - 首次写入：INSERT
    - 重复写入：UPDATE 累加 study_minutes 与 goals_completed

    写入后触发成就解锁检查。
    """
    # 查询是否已有当日记录
    existing = (
        db.query(StudyLog)
        .filter(
            StudyLog.user_id == user.id,
            StudyLog.date == payload.date,
        )
        .first()
    )

    if existing is not None:
        # 累加更新
        existing.study_minutes += payload.study_minutes
        existing.goals_completed += payload.goals_completed
        db.flush()
        log = existing
    else:
        # 新增
        log = StudyLog(
            user_id=user.id,
            date=payload.date,
            study_minutes=payload.study_minutes,
            goals_completed=payload.goals_completed,
        )
        db.add(log)
        db.flush()

    # 触发成就解锁检查（同一事务内）
    check_and_unlock(user, db)

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "STUDY_LOG_CONFLICT"},
        ) from e

    db.refresh(log)
    return StudyLogOut.model_validate(log)
