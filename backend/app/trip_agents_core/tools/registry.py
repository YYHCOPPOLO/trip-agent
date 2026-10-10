from typing import Dict, Any

class ToolRegistry:
    """
    工具注册中心，用于管理和注册各种工具。
    """
    def __init__(self):
        self._tools: Dict[str, Dict[str, Any]] = {}

    def registerTool(self, name: str, description: str, func: callable):
        """
        注册一个工具。
        """
        if name in self._tools:
          print(f"警告：工具{name}已存在，将被覆盖。")
        self._tools[name] = {"description": description, "func": func}
        print(f"工具{name}已注册。")

    def getTool(self, name: str) -> callable:
        """
        获取一个工具。
        """
        if name not in self._tools:
            raise ValueError(f"工具{name}不存在。")
        return self._tools.get(name, {}).get("func")

    def getAvailableTools(self) -> str:
        """
        获取可用的工具列表。
        """
        return "\n".join([
          f"- {name}: {info['description']}"
          for name, info in self._tools.items()
        ])
