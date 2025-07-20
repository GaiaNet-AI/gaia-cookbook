import os
import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.tools import Tool
from spinner import Spinner

# Load environment variables from .env file
load_dotenv()

# Define a Pydantic model for the tool's output
class WeatherData(BaseModel):
    """Represents the weather data for a specific location."""
    location: str = Field(..., description="The city and region of the weather reading.")
    temperature_celsius: float = Field(..., description="The current temperature in Celsius.")
    feels_like_celsius: float = Field(..., description="The 'feels like' temperature in Celsius.")
    condition: str = Field(..., description="A description of the current weather condition.")
    wind_kph: float = Field(..., description="The current wind speed in kilometers per hour.")

# Define the tool function to call the wttr.in service
def get_current_weather(city: str) -> WeatherData:
    """
    Gets the current weather for a specified city using the wttr.in service.

    Args:
        city: The name of the city (e.g., "Paris", "New York").
    """
    url = f"https://wttr.in/{city}?format=j1"
    try:
        response = httpx.get(url)
        response.raise_for_status()
        data = response.json()
        current_condition = data['current_condition'][0]
        nearest_area = data['nearest_area'][0]
        return WeatherData(
            location=f"{nearest_area['areaName'][0]['value']}, {nearest_area['region'][0]['value']}",
            temperature_celsius=float(current_condition['temp_C']),
            feels_like_celsius=float(current_condition['FeelsLikeC']),
            condition=current_condition['weatherDesc'][0]['value'],
            wind_kph=float(current_condition['windspeedKmph']),
        )
    except httpx.HTTPStatusError as e:
        return f"Error fetching weather data: {e.response.status_code} for city '{city}'."
    except (KeyError, IndexError):
        return f"Error parsing weather data for city '{city}'. The location might not be found."
    except Exception as e:
        return f"An unexpected error occurred: {e}"


# Configure Pydantic AI to use the GAIA Node
gaia_model_name = os.getenv("GAIA_MODEL")
gaia_api_base = os.getenv("GAIA_API_BASE")
gaia_api_key = os.getenv("GAIA_API_KEY")

if not all([gaia_model_name, gaia_api_base, gaia_api_key]):
    raise ValueError(
        "Please set the GAIA_MODEL, GAIA_API_BASE, and GAIA_API_KEY environment variables."
    )

# Correctly initialize the model provider
provider = OpenAIProvider(base_url=gaia_api_base, api_key=gaia_api_key)

# Define the model instance
model = OpenAIModel(gaia_model_name, provider=provider)

# Create an agent and register the tool
weather_tool = Tool(get_current_weather)
agent = Agent(model=model, tools=[weather_tool])

# Run the agent with sample queries
if __name__ == "__main__":
    prompt = "What's the weather like in Berlin?"
    print(f"User: {prompt}")

    # 2. Use the Spinner as a context manager around the agent call
    with Spinner("Calling Gaia for Berlin's weather..."):
        result = agent.run_sync(prompt)

    # 3. The result is printed after the spinner finishes
    print(f"Agent: {result.output}")

    # --- Second example ---
    prompt_oslo = "How about in Oslo?"
    print(f"\nUser: {prompt_oslo}")

    with Spinner("Calling Gaia for Oslo's weather..."):
        result_oslo = agent.run_sync(prompt_oslo)

    print(f"Agent: {result_oslo.output}")