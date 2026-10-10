import os
from openai import OpenAI
from typing import List,Dict

class TripAgentsLLM:
  def __init__(self, model: str = None, apiKey: str = None, baseUrl: str = None, timeout: int = None) -> None:
    self.model = model or os.getenv("LLM_MODEL_ID")
    apiKey = apiKey or os.getenv("LLM_API_KEY")
    baseUrl = baseUrl or os.getenv("LLM_BASE_URL")
    timeout = timeout or int(os.getenv("LLM_TIMEOUT", 60))

    if not all([self.model, apiKey, baseUrl]):
      raise ValueError("须先提供API密钥（sk-xxxx）、模型ID和服务地址")

    self.client = OpenAI(api_key=apiKey, base_url=baseUrl, timeout=timeout)

  def think(self, messages: List[Dict[str, str]], temperature: float = 0) -> str:

    print(f"🧠正在调用{self.model}模型ing...")
    try:
      response = self.client.chat.completions.create(
        model=self.model,
        messages=messages,
        temperature=temperature,
        stream=True
      )

      # 处理stream response
      print("✅ 模型响应成功：")
      collected_content = []
      for chunk in response:
        if not chunk.choices:
          continue
        content = chunk.choices[0].delta.content or ""
        print(content, end="", flush=True)
        collected_content.append(content)
      print() # stream response完换行
      return "".join(collected_content)

    except Exception as e:
      print(f"❌ LLM API调用时错误：{e}")
      return None
    

if __name__ == '__main__':
  try:

    llmClient = TripAgentsLLM()

    exampleMessages = [
      {"role": "system", "content": "You are a expert in python"},
      {"role": "user", "content": "write a "}
    ]
    print("--- 调用LLM ---")
    responseText = llmClient.think(exampleMessages)
    if responseText:
        print("\n\n--- 完整模型响应 ---")
        print(responseText)

  except ValueError as e:
      print(e)