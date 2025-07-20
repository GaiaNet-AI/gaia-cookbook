import os
from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
from spinner import Spinner

# Load .env variables
load_dotenv()
model_name = os.getenv("GAIA_MODEL")
base_url = os.getenv("GAIA_API_BASE")
api_key = os.getenv("GAIA_API_KEY")  # Optional if your local Gaia node doesn't require auth

# Define model using OpenAI-compatible interface
model = OpenAIModel(
    model_name,
    provider=OpenAIProvider(base_url=base_url, api_key=api_key)
)

# Create agent
agent = Agent(
    model=model,
    system_prompt="You are a helpful assistant. Answer clearly and concisely."
)

if __name__ == "__main__":
    prompt = "Explain how rainbows form."

    with Spinner("Calling Gaia..."):
        result = agent.run_sync(prompt)

    print("AI:", result.output)