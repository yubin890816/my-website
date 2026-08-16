"""Chat 相关 Pydantic schema。"""

from datetime import datetime

from pydantic import BaseModel, Field


class SessionOut(BaseModel):
    """会话对外响应。"""

    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SessionCreate(BaseModel):
    """创建会话请求。"""

    title: str = Field(default="新对话", max_length=100)


class MessageOut(BaseModel):
    """消息对外响应。"""

    id: int
    role: str
    content: str
    is_partial: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    """发送消息请求。content 长度 1-4000 字符。"""

    content: str = Field(min_length=1, max_length=4000)


class DeltaEvent(BaseModel):
    """SSE delta 事件 payload。"""

    content: str


class DoneEvent(BaseModel):
    """SSE done 事件 payload。"""

    message_id: int


class ErrorEvent(BaseModel):
    """SSE error 事件 payload。"""

    error_code: str
