import os
import requests
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel
from spinner import Spinner

# Load environment
load_dotenv()
GAIA_API_BASE = os.getenv("GAIA_API_BASE")
GAIA_MODEL = os.getenv("GAIA_MODEL")

if not GAIA_API_BASE or not GAIA_MODEL:
    raise EnvironmentError("GAIA_API_BASE and GAIA_MODEL must be set in the .env file")


# ----- Pydantic Models -----

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str
    messages: List[Message]
    temperature: float = 0.7


class Choice(BaseModel):
    message: Message
    finish_reason: str


class ChatResponse(BaseModel):
    choices: List[Choice]


# ----- Chat with system + user role -----

def chat_with_gaia(user_prompt: str, system_prompt: str = None) -> str:
    messages = []
    if system_prompt:
        messages.append(Message(role="system", content=system_prompt))
    messages.append(Message(role="user", content=user_prompt))

    request_data = ChatRequest(
        model=GAIA_MODEL,
        messages=messages
    )

    with Spinner("Thinking..."):
        response = requests.post(
            f"{GAIA_API_BASE}/chat/completions",
            json=request_data.model_dump()
        )

    response.raise_for_status()
    result = ChatResponse(**response.json())
    return result.choices[0].message.content


# ----- Example -----

if __name__ == "__main__":
    system = "You are a helpful and precise assistant."
    user = "Explain gravity like I'm 10 years old."
    print("AI:", chat_with_gaia(user, system))