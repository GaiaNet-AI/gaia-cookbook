from os import getenv
from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from agno.tools.yfinance import YFinanceTools

# Load environment variables
load_dotenv()

agent = Agent(
    model=OpenAILike(
        id=getenv("GAIA_MODEL_NAME"),
        api_key=getenv("GAIA_API_KEY"),
        base_url=getenv("GAIA_NODE_URL"),
    ),
    tools=[YFinanceTools(stock_price=True)],
    instructions="Use tables to display data. Don't include any other text.",
    markdown=True,
)

agent.print_response("What is the stock price of Tesla?", stream=True)
