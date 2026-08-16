"""应用配置，从环境变量加载。"""

import os
import sys

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置，优先读取 .env 文件。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    jwt_secret: str = "change-me-to-a-random-secret-at-least-32-chars"
    jwt_algorithm: str = "HS256"
    jwt_access_expire_minutes: int = 30
    jwt_refresh_expire_days: int = 7

    cors_origins: str = "http://localhost:5173"

    # 默认指向 /data/studypal.db（Railway 持久化卷挂载点）
    # 本地开发可通过 .env 覆盖为 sqlite:///./studypal.db
    database_url: str = "sqlite:////data/studypal.db"

    # DeepSeek 配置（key 仅存后端 .env，不暴露给前端）
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"

    @property
    def cors_origin_list(self) -> list[str]:
        """将逗号分隔的 origin 字符串解析为列表。"""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


def _validate_production_config() -> None:
    """生产环境关键变量校验：jwt_secret 不能为默认值。

    通过 ENV=production 或 RAILWAY_ENVIRONMENT 触发严格校验。
    本地开发（无上述环境变量）跳过，使用默认 secret。
    """
    is_production = os.environ.get("ENV") == "production" or bool(
        os.environ.get("RAILWAY_ENVIRONMENT")
    )
    if not is_production:
        return
    if settings.jwt_secret == "change-me-to-a-random-secret-at-least-32-chars":
        print(
            "FATAL: JWT_SECRET 未配置，生产环境禁止使用默认值。"
            "请在 Railway 环境变量中设置强随机值（≥32 字符）。",
            file=sys.stderr,
        )
        sys.exit(1)


settings = Settings()
_validate_production_config()
