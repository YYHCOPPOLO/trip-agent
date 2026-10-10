"""用真实模型回答「华为最新手机型号及主要卖点」，并确认调用了 Search。

在 backend/ 下执行：

    uv run python -m app.trip_agents_core.agent.test_react
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from app.services.llm_service import TripAgentsLLM
from app.trip_agents_core.agent.react_agent import ReActAgent
from app.trip_agents_core.tools.registry import ToolRegistry
from app.trip_agents_core.tools.search import search

QUESTION = "华为最新手机型号及主要卖点"
TOOL_NAME = "Search"


def main() -> int:
    env_path = Path(__file__).resolve().parents[3] / ".env"
    load_dotenv(env_path)
    if _unusable_keys():
        return 1

    calls: list[tuple[str, str]] = []

    def tracked_search(query: str) -> str:
        result = search(query)
        calls.append((query, result))
        return result

    registry = ToolRegistry()
    registry.registerTool(
        TOOL_NAME,
        "一个网页搜索工具，当你需要回答关于时事、事实以及在你的知识库中找不到的信息时，应使用此工具。",
        tracked_search,
    )

    answer = ReActAgent(TripAgentsLLM(), registry, max_steps=5).run(QUESTION)
    if not calls or not answer:
        return 1
    if any(_search_failed(result) for _, result in calls):
        return 1
    return 0


def _search_failed(result: str) -> bool:
    return (
        result.startswith("Error")
        or result.startswith("错误")
        or result.startswith("搜索时发生错误")
    )


def _unusable_keys() -> list[str]:
    bad: list[str] = []
    for key in ("LLM_MODEL_ID", "LLM_API_KEY", "LLM_BASE_URL", "TAVILY_API_KEY"):
        value = (os.getenv(key) or "").strip()
        if not value or value.startswith("your-") or set(value) <= {"x", "X"}:
            bad.append(key)
    return bad


if __name__ == "__main__":
    sys.exit(main())
