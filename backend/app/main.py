"""FastAPI 应用入口。"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import analytics, auth, chat, study_logs, users

app = FastAPI(
    title="StudyPal API",
    version="0.1.0",
    description="StudyPal 学习助手后端 API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Total-Count"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(study_logs.router, prefix="/api/study-logs", tags=["study-logs"])


@app.get("/health")
def health_check() -> dict[str, str]:
    """健康检查端点。"""
    return {"status": "ok"}
