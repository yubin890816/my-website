"""StudyLog ORM 模型。"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StudyLog(Base):
    """学习日志表，按用户+日期唯一，记录当日学习时长与完成目标数。"""

    __tablename__ = "study_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_study_logs_user_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    study_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    goals_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )
