from pathlib import Path
from dotenv import load_dotenv
from .registry import ToolRegistry
from .search import search


if __name__ == "__main__":
    load_dotenv(Path(__file__).resolve().parents[3] / ".env")
    toolRegistry = ToolRegistry()

    search_description = "一个网页搜索工具，当你需要回答关于时事、事实以及在你的知识库中找不到的信息时，应使用此工具。"
    toolRegistry.registerTool("Search", search_description, search)

    print("\n--- 可用的工具 ---")
    print(toolRegistry.getAvailableTools())

    # 智能体Action调用
    print("\n--- 执行Action：Search['华为最新的手机是什么？'] ---")
    tool_name = "Search"
    tool_input = "华为最新的手机是什么？"

    tool_function = toolRegistry.getTool(tool_name)
    if (tool_function):
      observation = tool_function(tool_input)
      print("--- 观察（observation）")
      print(observation)
    else:
      print(f"--- 工具未找到：{tool_name}")
