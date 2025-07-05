"""
Weather Tool Calling Demo - Gaia Node + Google ADK
==================================================
This demo showcases real weather API tool calling using a Gaia node
with Google's Agent Development Kit (ADK) and OpenWeatherMap API.
"""

import os
import asyncio
import aiohttp
import json
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

# Load environment variables
load_dotenv()

# Configuration from .env file
GAIA_NODE_BASE_URL = os.getenv("GAIA_NODE_BASE_URL")
GAIA_NODE_API_KEY = os.getenv("GAIA_NODE_API_KEY")
GAIA_MODEL_NAME = os.getenv("GAIA_MODEL_NAME")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

async def get_current_weather(city: str) -> dict:
    """Gets the current weather for a specified city using OpenWeatherMap API.
    
    Args:
        city (str): The name of the city (e.g., "London", "New York", "Tokyo").
    
    Returns:
        dict: A dictionary containing the weather information.
    """
    print(f"🌤️  Tool Called: get_current_weather('{city}')")
    
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your-openweather-api-key-here":
        return {
            "status": "error",
            "error_message": "OpenWeatherMap API key not configured. Please add your API key to the .env file."
        }
    
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": city,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"  # Use Celsius
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    weather_info = {
                        "status": "success",
                        "city": data["name"],
                        "country": data["sys"]["country"],
                        "temperature": data["main"]["temp"],
                        "feels_like": data["main"]["feels_like"],
                        "humidity": data["main"]["humidity"],
                        "pressure": data["main"]["pressure"],
                        "description": data["weather"][0]["description"],
                        "wind_speed": data["wind"]["speed"],
                        "visibility": data.get("visibility", "N/A")
                    }
                    
                    return {
                        "status": "success",
                        "weather": weather_info,
                        "summary": f"Current weather in {weather_info['city']}, {weather_info['country']}: "
                                  f"{weather_info['temperature']}°C, {weather_info['description']}. "
                                  f"Feels like {weather_info['feels_like']}°C. "
                                  f"Humidity: {weather_info['humidity']}%, Wind: {weather_info['wind_speed']} m/s"
                    }
                elif response.status == 404:
                    return {
                        "status": "error",
                        "error_message": f"City '{city}' not found. Please check the spelling and try again."
                    }
                else:
                    return {
                        "status": "error",
                        "error_message": f"Weather API error: {response.status}"
                    }
                    
    except aiohttp.ClientError as e:
        return {
            "status": "error",
            "error_message": f"Network error when fetching weather data: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Unexpected error: {str(e)}"
        }

async def chat_with_agent(query: str, runner, user_id, session_id):
    """Sends a query to the agent and prints the response."""
    print(f"\n🤖 User: {query}")

    # Prepare the user's message in ADK format
    content = types.Content(role='user', parts=[types.Part(text=query)])
    
    final_response_text = "Agent did not produce a response."
    
    # Execute the agent and get the response
    async for event in runner.run_async(
        user_id=user_id, 
        session_id=session_id, 
        new_message=content
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
            break
            
    print(f"🧠 Gaia Agent: {final_response_text}")

async def main():
    print("🌟 Gaia Node + Google ADK - Weather Tool Calling Demo")
    print("====================================================")
    print(f"📡 Connected to: {GAIA_NODE_BASE_URL}")
    print(f"🤖 Using model: {GAIA_MODEL_NAME}")
    print("🌤️  Available tool: get_current_weather")
    
    # Check API key configuration
    if OPENWEATHER_API_KEY and OPENWEATHER_API_KEY != "your-openweather-api-key-here":
        print("🌤️  OpenWeatherMap API: ✅ Configured")
    else:
        print("🌤️  OpenWeatherMap API: ⚠️  Not configured (get free key from openweathermap.org)")
    
    print("-" * 60)
    
    # Validate environment variables
    if not all([GAIA_NODE_BASE_URL, GAIA_NODE_API_KEY, GAIA_MODEL_NAME]):
        print("❌ Error: Missing environment variables!")
        print("Please check your .env file and ensure all required variables are set.")
        return
    
    try:
        # Create an agent with weather tool calling capability
        agent = Agent(
            name="gaia_weather_assistant",
            model=LiteLlm(
                model=f"openai/{GAIA_MODEL_NAME}",
                api_key=GAIA_NODE_API_KEY,
                api_base=GAIA_NODE_BASE_URL
            ),
            description="A helpful weather assistant powered by Gaia node with real weather API access",
            instruction="You are a helpful weather assistant running on the Gaia decentralized network. "
                       "Use the 'get_current_weather' tool to get real weather information for any city worldwide. "
                       "Provide detailed, helpful weather information and explain what the conditions mean for users. "
                       "Always be friendly and informative in your responses.",
            tools=[get_current_weather],
        )

        # Set up session
        session_service = InMemorySessionService()
        session = await session_service.create_session(
            app_name="gaia_weather_app",
            user_id="demo_user",
            session_id="weather_session"
        )

        # Create runner
        runner = Runner(
            agent=agent,
            app_name="gaia_weather_app",
            session_service=session_service
        )

        print("✅ Agent setup complete! Starting weather demo...\n")

        # Weather-focused demo queries
        demo_queries = [
            "What's the current weather in London?",
            "How's the weather in Tokyo right now?",
            "Can you tell me the weather conditions in New York City?",
            "What's the temperature and humidity in Paris?",
            "Compare the weather between Sydney and Melbourne"
        ]

        for i, query in enumerate(demo_queries, 1):
            print(f"📋 Weather Query {i}/{len(demo_queries)}:")
            await chat_with_agent(
                query,
                runner=runner,
                user_id="demo_user",
                session_id="weather_session"
            )
            
            # Add a delay between requests to be respectful to the weather API
            if i < len(demo_queries):
                await asyncio.sleep(3)
                print("\n" + "="*60)

        print("\n🎉 Weather tool calling demo completed successfully!")
        print("💡 This demonstrates how Gaia nodes can access real weather data with Google ADK!")

    except Exception as e:
        print(f"❌ Error occurred: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Verify your Gaia node is accessible and supports tool calling")
        print("2. Check that the model name is correct in your .env file")
        print("3. Ensure google-adk and litellm are properly installed")
        print("4. Get a free OpenWeatherMap API key from openweathermap.org")
        print("5. Add your API key to the .env file")

if __name__ == "__main__":
    asyncio.run(main())