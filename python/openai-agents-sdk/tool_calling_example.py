"""
Weather Tool Demo using OpenAI Agents SDK with Gaia's Node
This demo shows tool calling capabilities with OpenWeatherMap API.
Fixed version with proper Ctrl+C handling.
"""

from __future__ import annotations

import asyncio
import json
import signal
import sys
from typing import Optional

import aiohttp
from agents import Agent, Runner, function_tool, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel

set_tracing_disabled(True)

# OpenWeatherMap API tool
@function_tool
async def get_weather(city: str, country_code: Optional[str] = None) -> str:
    """Get current weather information for a city.
    
    Args:
        city: Name of the city
        country_code: Optional 2-letter country code (e.g., 'US', 'GB')
    
    Returns:
        Current weather information as a formatted string
    """
    api_key = get_weather._api_key
    
    if not api_key:
        return "❌ Weather API key not configured. Please set your OpenWeatherMap API key."
    
    # Build the query string
    if country_code:
        location = f"{city},{country_code}"
    else:
        location = city
    
    url = f"http://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": location,
        "appid": api_key,
        "units": "metric"  # Use Celsius
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Extract weather information
                    temp = data["main"]["temp"]
                    feels_like = data["main"]["feels_like"]
                    humidity = data["main"]["humidity"]
                    pressure = data["main"]["pressure"]
                    description = data["weather"][0]["description"].title()
                    wind_speed = data["wind"]["speed"]
                    
                    # Format the response
                    weather_info = f"""
🌤️  Weather in {data['name']}, {data['sys']['country']}:
• Temperature: {temp}°C (feels like {feels_like}°C)
• Condition: {description}
• Humidity: {humidity}%
• Pressure: {pressure} hPa
• Wind Speed: {wind_speed} m/s
                    """.strip()
                    
                    return weather_info
                
                elif response.status == 404:
                    return f"❌ City '{city}' not found. Please check the spelling and try again."
                else:
                    error_data = await response.json()
                    return f"❌ Weather API error: {error_data.get('message', 'Unknown error')}"
                    
    except aiohttp.ClientError as e:
        return f"❌ Network error while fetching weather: {str(e)}"
    except Exception as e:
        return f"❌ Error getting weather data: {str(e)}"


@function_tool
async def get_forecast(city: str, days: int = 5) -> str:
    """Get weather forecast for a city.
    
    Args:
        city: Name of the city
        days: Number of days to forecast (1-5)
    
    Returns:
        Weather forecast as a formatted string
    """
    api_key = get_weather._api_key
    
    if not api_key:
        return "❌ Weather API key not configured."
    
    # Limit days to valid range
    days = max(1, min(days, 5))
    
    url = f"http://api.openweathermap.org/data/2.5/forecast"
    params = {
        "q": city,
        "appid": api_key,
        "units": "metric",
        "cnt": days * 8  # 8 forecasts per day (every 3 hours)
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    forecast_info = f"📅 {days}-day forecast for {data['city']['name']}, {data['city']['country']}:\n\n"
                    
                    # Group forecasts by day
                    current_date = None
                    day_count = 0
                    
                    for item in data["list"]:
                        if day_count >= days:
                            break
                            
                        date = item["dt_txt"].split(" ")[0]
                        time = item["dt_txt"].split(" ")[1]
                        
                        if date != current_date:
                            current_date = date
                            day_count += 1
                            if day_count > 1:
                                forecast_info += "\n"
                            forecast_info += f"📆 {date}:\n"
                        
                        temp = item["main"]["temp"]
                        description = item["weather"][0]["description"].title()
                        forecast_info += f"  {time}: {temp}°C, {description}\n"
                    
                    return forecast_info.strip()
                
                else:
                    return f"❌ Error getting forecast: HTTP {response.status}"
                    
    except Exception as e:
        return f"❌ Error getting forecast: {str(e)}"


class GaiaWeatherAgent:
    def __init__(self, base_url: str, api_key: str, weather_api_key: str):
        """Initialize the Gaia weather agent.
        
        Args:
            base_url: The base URL for Gaia's Node API endpoint
            api_key: API key for Gaia Node
            weather_api_key: OpenWeatherMap API key
        """
        # Store weather API key in the function
        get_weather._api_key = weather_api_key
        
        self.agent = Agent(
            name="Gaia Weather Assistant",
            instructions="""You are a helpful weather assistant running on Gaia's decentralized network.
            You can provide current weather information and forecasts for any city worldwide.
            
            When users ask about weather, use the available tools to get real-time data.
            Always be helpful and provide clear, formatted weather information.
            
            If users ask about weather comparisons or travel advice, you can get weather for multiple cities.
            """,
            model=LitellmModel(
                model="openai/Llama-3-Groq-8B-Tool",
                api_key=api_key,
                base_url=base_url
            ),
            tools=[get_weather, get_forecast],
        )
        self._shutdown = False
    
    def shutdown(self):
        """Signal the agent to shutdown gracefully."""
        self._shutdown = True
    
    async def chat_loop(self):
        """Main chat loop for weather queries."""
        print("🌦️  Gaia Weather Assistant - Tool Calling Demo")
        print("Ask about weather in any city worldwide!")
        print("Type 'quit' to exit")
        print("=" * 60)
        
        while not self._shutdown:
            try:
                # Get user input with timeout to check for shutdown
                try:
                    user_input = await asyncio.wait_for(
                        asyncio.to_thread(input, "\n🌤️  Ask about weather: "),
                        timeout=1.0
                    )
                    user_input = user_input.strip()
                except asyncio.TimeoutError:
                    continue
                
                if user_input.lower() in ['quit', 'exit', 'bye', 'q']:
                    print("\n👋 Thanks for using Gaia Weather Assistant!")
                    break
                
                if not user_input:
                    continue
                
                print("🤖 Gaia Assistant: ", end="", flush=True)
                
                # Run the agent with tools
                try:
                    result = await asyncio.wait_for(
                        Runner.run(self.agent, user_input),
                        timeout=30.0
                    )
                    
                    print(result.final_output)
                    
                except asyncio.TimeoutError:
                    print("\n⏰ Request timed out. Please try again.")
                except Exception as e:
                    print(f"\n❌ Error: {e}")
                    print("Please try again or type 'quit' to exit.")
                
            except KeyboardInterrupt:
                print("\n\n👋 Weather chat interrupted. Goodbye!")
                break
            except Exception as e:
                if not self._shutdown:
                    print(f"\n❌ Unexpected error: {e}")
                    print("Please try again or type 'quit' to exit.")


async def main():
    """Main function to set up and run the weather demo."""
    
    print("🚀 Setting up Gaia Weather Tool Demo")
    print("=" * 45)
    
    # Configuration
    default_base_url = "https://your-node-id.gaia.domains/v1"
    default_api_key = "gaia"
    
    # Get Gaia Node configuration
    base_url = input(f"Enter Gaia Node base URL (default: {default_base_url}): ").strip()
    if not base_url:
        base_url = default_base_url
    
    api_key = input(f"Enter Gaia API key (default: {default_api_key}): ").strip()
    if not api_key:
        api_key = default_api_key
    
    # Get OpenWeatherMap API key
    weather_api_key = input("Enter your OpenWeatherMap API key: ").strip()
    
    if not weather_api_key:
        print("❌ OpenWeatherMap API key is required for this demo.")
        print("Get a free API key at: https://openweathermap.org/api")
        sys.exit(1)
    
    # Create weather agent instance
    weather_agent = GaiaWeatherAgent(base_url, api_key, weather_api_key)
    
    # Set up signal handler for graceful shutdown
    def signal_handler():
        print("\n🛑 Shutting down gracefully...")
        weather_agent.shutdown()
    
    # Register signal handlers
    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, lambda s, f: signal_handler())
    
    try:
        # Create and start weather agent
        await weather_agent.chat_loop()
        
    except Exception as e:
        print(f"❌ Failed to initialize weather agent: {e}")
        print("Please check your configuration and try again.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)