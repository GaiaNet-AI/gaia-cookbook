from os import getenv
from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.openai.like import OpenAILike

# Load environment variables
load_dotenv()

agent = Agent(
    model=OpenAILike(
        id=getenv("GAIA_MODEL_NAME"),
        api_key=getenv("GAIA_API_KEY"),
        base_url=getenv("GAIA_NODE_URL"),
    )
)

# Print the response in the terminal
agent.print_response("Share a 2 sentence horror story.")