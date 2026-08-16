"""Chat 路由：会话管理 / 历史拉取 / 流式对话。"""

import json
from collections.abc import Generator

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.schemas.chat import (
    DeltaEvent,
    DoneEvent,
    ErrorEvent,
    MessageCreate,
    MessageOut,
    SessionCreate,
    SessionOut,
)
from app.services.deepseek import (
    LLMError,
    LLMNotConfiguredError,
    build_system_prompt,
    stream_chat,
)

router = APIRouter()

# 历史消息传给 LLM 的最大条数（防止 context 超限）
MAX_HISTORY_FOR_LLM = 20
# 拉取历史接口默认 limit
DEFAULT_HISTORY_LIMIT = 100


def _sse(event: str, payload: dict) -> str:
    """构造一个 SSE 帧。"""
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _get_owned_session(
    session_id: int, user: User, db: Session
) -> ChatSession:
    """获取属于当前用户的会话，不存在或非本人返回 404 SESSION_NOT_FOUND。"""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "SESSION_NOT_FOUND"},
        )
    return session


# ---------------------------------------------------------------------------
# 会话管理
# ---------------------------------------------------------------------------
@router.get("/sessions/current", response_model=SessionOut)
def get_current_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SessionOut:
    """获取当前用户最近活跃会话，无则隐式创建。"""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .first()
    )
    if session is None:
        session = ChatSession(user_id=current_user.id, title="新对话")
        db.add(session)
        db.commit()
        db.refresh(session)
    return SessionOut.model_validate(session)


@router.post(
    "/sessions",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    payload: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SessionOut:
    """显式创建新会话。"""
    session = ChatSession(user_id=current_user.id, title=payload.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionOut.model_validate(session)


# ---------------------------------------------------------------------------
# 历史消息
# ---------------------------------------------------------------------------
@router.get("/sessions/{session_id}/messages")
def list_messages(
    session_id: int,
    limit: int = DEFAULT_HISTORY_LIMIT,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """拉取会话历史消息，按时间升序。响应头 X-Total-Count 标明总数。"""
    session = _get_owned_session(session_id, current_user, db)
    limit = max(1, min(limit, DEFAULT_HISTORY_LIMIT))
    total = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .count()
    )
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    # 手动序列化以设置 X-Total-Count header
    payload = [MessageOut.model_validate(m).model_dump(mode="json") for m in messages]
    return Response(
        content=json.dumps(payload, ensure_ascii=False),
        media_type="application/json",
        headers={"X-Total-Count": str(total)},
    )


# ---------------------------------------------------------------------------
# 流式对话
# ---------------------------------------------------------------------------
def _stream_generator(
    session_id: int,
    user_message: str,
    user: User,
    db: Session,
) -> Generator[str, None, None]:
    """SSE 流生成器。

    职责：
    1. 写入用户消息
    2. 拉取最近历史 + system prompt
    3. 调用 DeepSeek 流式，逐 chunk 发 delta 事件
    4. 流结束写 assistant 消息并发 done 事件
    5. 异常发 error 事件
    6. 客户端断开（GeneratorExit）时保存 partial assistant 消息
    """
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
        .first()
    )
    if session is None:
        yield _sse("error", ErrorEvent(error_code="SESSION_NOT_FOUND").model_dump())
        return

    # 1. 写入用户消息
    user_msg = ChatMessage(
        session_id=session.id, role="user", content=user_message
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 2. 拉取最近历史构造 LLM messages
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    # 取最近 N 条（含刚写入的 user_msg）
    recent = history[-MAX_HISTORY_FOR_LLM:] if len(history) > MAX_HISTORY_FOR_LLM else history
    llm_messages = [{"role": m.role, "content": m.content} for m in recent]

    system_prompt = build_system_prompt(user)

    accumulated: list[str] = []
    completed = False
    error_sent = False

    try:
        try:
            for chunk in stream_chat(llm_messages, system_prompt):
                accumulated.append(chunk)
                yield _sse("delta", DeltaEvent(content=chunk).model_dump())

            # 流正常结束，写入完整 assistant 消息
            assistant_msg = ChatMessage(
                session_id=session.id,
                role="assistant",
                content="".join(accumulated),
                is_partial=False,
            )
            db.add(assistant_msg)
            db.commit()
            db.refresh(assistant_msg)
            completed = True
            yield _sse(
                "done",
                DoneEvent(message_id=assistant_msg.id).model_dump(),
            )
        except LLMNotConfiguredError:
            db.rollback()
            error_sent = True
            yield _sse(
                "error",
                ErrorEvent(error_code="LLM_NOT_CONFIGURED").model_dump(),
            )
        except LLMError:
            db.rollback()
            error_sent = True
            # 已累积的部分内容作为 partial 消息保存
            if accumulated:
                partial = ChatMessage(
                    session_id=session.id,
                    role="assistant",
                    content="".join(accumulated),
                    is_partial=True,
                )
                db.add(partial)
                db.commit()
                db.refresh(partial)
            yield _sse(
                "error",
                ErrorEvent(error_code="LLM_UPSTREAM_ERROR").model_dump(),
            )
        except Exception:
            # 兜底：未预期异常
            db.rollback()
            error_sent = True
            if accumulated:
                partial = ChatMessage(
                    session_id=session.id,
                    role="assistant",
                    content="".join(accumulated),
                    is_partial=True,
                )
                db.add(partial)
                db.commit()
            yield _sse(
                "error",
                ErrorEvent(error_code="LLM_UPSTREAM_ERROR").model_dump(),
            )
    finally:
        # 客户端断开（GeneratorExit）或正常退出但未完成时，保存 partial
        if not completed and accumulated and not error_sent:
            try:
                partial = ChatMessage(
                    session_id=session.id,
                    role="assistant",
                    content="".join(accumulated),
                    is_partial=True,
                )
                db.add(partial)
                db.commit()
            except Exception:
                db.rollback()


@router.post("/sessions/{session_id}/messages/stream")
def stream_message(
    session_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    """发送消息并以 SSE 流式返回 AI 回复。"""
    # 校验会话归属（404 在 generator 中处理会延迟，这里提前校验返回标准 404）
    _get_owned_session(session_id, current_user, db)

    return StreamingResponse(
        _stream_generator(session_id, payload.content, current_user, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # 禁用 nginx 缓冲
        },
    )
