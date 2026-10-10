import os

from serpapi import SerpApiClient
from tavily import TavilyClient


def _search_language(query: str) -> str:
    for char in query:
        if "\u4e00" <= char <= "\u9fff":
            return "zh-cn"
    return "en"


def _as_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        parts = [_as_text(item) for item in value]
        return "\n".join(part for part in parts if part)
    if isinstance(value, dict):
        for key in ("answer", "snippet", "result", "description", "title"):
            text = _as_text(value.get(key))
            if text:
                return text
        return ""
    return str(value).strip()


def search(query: str, backend: str = "tavily") -> str:
    """网页搜索。backend 取 tavily 或 serpapi。"""
    name = backend.strip().lower()
    if name == "tavily":
        return _search_tavily(query)
    if name == "serpapi":
        return _search_serpapi(query)
    return f"Error: 不支持的搜索后端 '{backend}'，请使用 tavily 或 serpapi。"


def _search_tavily(query: str) -> str:
    print(f"正在执行[Tavily]搜索：{query}")
    try:
        apiKey = os.environ.get("TAVILY_API_KEY")
        if not apiKey:
            return "Error: TAVILY_API_KEY未设置"

        params = {
            "query": query,
            "search_depth": "advanced",
            "include_answer": True,
            "language": _search_language(query),
            "filter_by_language": True,
        }

        tavilyClient = TavilyClient(apiKey)
        response = tavilyClient.search(**params)

        # 智能解析：优先寻找最直接的答案
        answer = response.get("answer")
        if answer:
            return answer

        results = response.get("results") or []
        if results:
            # 如果没有直接答案，则返回前三个结果的摘要
            snippets = [
                f"[{i + 1}] {res.get('title', '')}\n{res.get('content', '')}"
                for i, res in enumerate(results[:3])
            ]
            return "\n\n".join(snippets)

        return f"对不起，没有找到关于 '{query}' 的信息。"

    except Exception:
        return "Error"


def _search_serpapi(query: str) -> str:
    """SerpApi 网页搜索。优先返回直接答案或知识图谱，否则返回前三条摘要。"""
    print(f"正在执行[SerpApi]搜索：{query}")
    try:
        api_key = os.environ.get("SERPAPI_API_KEY")
        if not api_key:
            return "错误:SERPAPI_API_KEY 未在 .env 文件中配置。"

        params = {
            "engine": "google",
            "q": query,
            "api_key": api_key,
            "gl": "cn",
            "hl": "zh-cn",
        }
        results = SerpApiClient(params).get_dict()

        error = results.get("error")
        if error:
            return f"搜索时发生错误: {error}"

        # 智能解析：优先寻找最直接的答案
        if "answer_box_list" in results:
            text = _as_text(results["answer_box_list"])
            if text:
                return text

        answer_box = results.get("answer_box")
        if isinstance(answer_box, dict):
            answer = answer_box.get("answer")
            if answer is None:
                answer = answer_box.get("result") or answer_box.get("snippet")
            text = _as_text(answer)
            if text:
                return text

        knowledge_graph = results.get("knowledge_graph")
        if isinstance(knowledge_graph, dict):
            text = _as_text(knowledge_graph.get("description"))
            if text:
                return text

        organic_results = results.get("organic_results") or []
        if organic_results:
            snippets = [
                f"[{i + 1}] {res.get('title', '')}\n{res.get('snippet', '')}"
                for i, res in enumerate(organic_results[:3])
            ]
            return "\n\n".join(snippets)

        return f"对不起，没有找到关于 '{query}' 的信息。"

    except Exception as e:
        return f"搜索时发生错误: {e}"
