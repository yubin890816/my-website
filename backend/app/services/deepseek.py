"""DeepSeek 上游适配层。

封装 DeepSeek chat/completions 流式调用与 system prompt 装配。
DeepSeek 兼容 OpenAI 协议，响应为 SSE 流。
"""

from collections.abc import Generator

import httpx

from app.config import settings
from app.models.user import User


# 自定义异常 ---------------------------------------------------------------
class LLMError(Exception):
    """LLM 调用基础异常。"""

    error_code = "LLM_UPSTREAM_ERROR"


class LLMNotConfiguredError(LLMError):
    """DeepSeek API key 未配置。"""

    error_code = "LLM_NOT_CONFIGURED"


class LLMUpstreamError(LLMError):
    """DeepSeek 返回非 2xx 或连接失败。"""


# system prompt 装配 -------------------------------------------------------
_SYSTEM_PROMPT_TEMPLATE = """你是 StudyPal 的 AI 学习教练，名字叫小帕。请基于以下用户学习数据给出针对性建议：
- 连续学习天数（streak）：{streak_days} 天
- 当前等级（level）：Lv {level}
- 经验值（xp）：{xp}
- 上次活动日期：{last_activity_date}

回复要求：
1. 用简体中文
2. 语气友好、鼓励为主
3. 结合用户数据给出可执行的具体建议
4. 回复使用 Markdown 格式，代码块标注语言
"""


def build_system_prompt(user: User) -> str:
    """根据用户学习画像构造 system prompt。

    缺失字段降级为"未知"，不抛异常。
    """
    xp = "未知" if user.xp is None else str(user.xp)
    last_activity = "未知" if user.last_activity_date is None else str(user.last_activity_date)
    return _SYSTEM_PROMPT_TEMPLATE.format(
        streak_days=user.streak_days or 0,
        level=user.level or 1,
        xp=xp,
        last_activity_date=last_activity,
    )


# 流式 chat -----------------------------------------------------------------
def stream_chat(messages: list[dict], system_prompt: str) -> Generator[str, None, None]:
    """调用 DeepSeek chat/completions（stream=True），逐 token yield 增量文本。

    Args:
        messages: 对话历史，每条 {"role": "user"|"assistant", "content": "..."}
        system_prompt: system prompt 内容

    Yields:
        str: 每个 delta 的文本片段

    Raises:
        LLMNotConfiguredError: api key 为空
        LLMUpstreamError: 上游非 2xx 或连接失败
    """
    if not settings.deepseek_api_key:
        raise LLMNotConfiguredError("DEEPSEEK_API_KEY is not configured")

    payload = {
        "model": settings.deepseek_model,
        "messages": [{"role": "system", "content": system_prompt}, *messages],
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {settings.deepseek_api_key}",
        "Content-Type": "application/json",
    }
    url = f"{settings.deepseek_base_url}/v1/chat/completions"

    try:
        with httpx.stream(
            "POST",
            url,
            json=payload,
            headers=headers,
            timeout=httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0),
        ) as response:
            if response.status_code != 200:
                # 读取 body 用于诊断（不打印 key）
                body = response.read().decode("utf-8", errors="replace")[:500]
                raise LLMUpstreamError(
                    f"DeepSeek returned {response.status_code}: {body}"
                )
            # 逐行解析 SSE：data: {...}
            for line in response.iter_lines():
                if not line or not line.startswith("data:"):
                    continue
                data = line[len("data:"):].strip()
                if data == "[DONE]":
                    break
                # 解析 JSON 取 choices[0].delta.content
                try:
                    import json

                    chunk = json.loads(data)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
                except (json.JSONDecodeError, IndexError, KeyError):
                    # 跳过无法解析的 chunk（如角色标记）
                    continue
    except httpx.TimeoutException as e:
        raise LLMUpstreamError(f"DeepSeek timeout: {e}") from e
    except httpx.HTTPError as e:
        raise LLMUpstreamError(f"DeepSeek connection error: {e}") from e
