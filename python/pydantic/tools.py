import os
import json
import requests
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from spinner import Spinner

# Load env vars
load_dotenv()
GAIA_API_BASE = os.getenv("GAIA_API_BASE")
GAIA_MODEL = os.getenv("GAIA_MODEL")

if not GAIA_API_BASE or not GAIA_MODEL:
    raise EnvironmentError("GAIA_API_BASE and GAIA_MODEL must be set in the .env file")


# ----- Tool schema -----

class GetWeatherInput(BaseModel):
    location: str = Field(..., description="The city name to get weather for")


# ----- Simulated tool function -----

def get_weather(location: str) -> str:
    return f"The weather in {location} is currently sunny and 27°C."  # Simulated


# ----- Tool-calling chat -----

def chat_with_tool_call(prompt: str):
    tools = [{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a given location.",
            "parameters": GetWeatherInput.model_json_schema()
        }
    }]

    messages = [{"role": "user", "content": prompt}]
    payload = {
        "model": GAIA_MODEL,
        "messages": messages,
        "tools": tools,
        "tool_choice": "auto"
    }

    # Initial model call
    with Spinner("Calling Gaia..."):
        res1 = requests.post(f"{GAIA_API_BASE}/chat/completions", json=payload)
    res1.raise_for_status()
    data1 = res1.json()

    tool_calls = data1["choices"][0]["message"].get("tool_calls", [])
    if tool_calls:
        tool_call = tool_calls[0]
        args = json.loads(tool_call["function"]["arguments"])
        result = get_weather(**args)

        messages.extend([
            {"role": "assistant", "tool_calls": [tool_call]},
            {
                "role": "tool",
                "tool_call_id": tool_call["id"],
                "name": tool_call["function"]["name"],
                "content": result
            }
        ])

        with Spinner("Waiting for AI response..."):
            res2 = requests.post(f"{GAIA_API_BASE}/chat/completions", json={
                "model": GAIA_MODEL,
                "messages": messages
            })
        res2.raise_for_status()
        return res2.json()["choices"][0]["message"]["content"]
    else:
        return data1["choices"][0]["message"]["content"]


# ----- Example -----

if __name__ == "__main__":
    reply = chat_with_tool_call("What's the weather like in Tokyo?")
    print("AI:", reply)
