"""
Basic Chat Demo - Gaia Node + Google ADK
========================================
This demo showcases basic conversational AI using a Gaia node
with Google's Agent Development Kit (ADK) without tool calling.
"""

import os
import asyncio
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
    print("🌟 Gaia Node + Google ADK - Basic Chat Demo")
    print("===========================================")
    print(f"📡 Connected to: {GAIA_NODE_BASE_URL}")
    print(f"🤖 Using model: {GAIA_MODEL_NAME}")
    print("-" * 60)
    
    # Validate environment variables
    if not all([GAIA_NODE_BASE_URL, GAIA_NODE_API_KEY, GAIA_MODEL_NAME]):
        print("❌ Error: Missing environment variables!")
        print("Please check your .env file and ensure all required variables are set.")
        return
    
    try:
        # Create a simple conversational agent (no tools)
        agent = Agent(
            name="gaia_chat_assistant",
            model=LiteLlm(
                model=f"openai/{GAIA_MODEL_NAME}",
                api_key=GAIA_NODE_API_KEY,
                api_base=GAIA_NODE_BASE_URL
            ),
            description="A friendly conversational AI assistant powered by Gaia's decentralized network",
            instruction="You are a helpful, friendly AI assistant running on the Gaia decentralized network. "
                       "You can help with general questions, provide information, assist with creative tasks, "
                       "explain concepts, and have engaging conversations. Be concise but informative in your responses.",
        )

        # Set up session
        session_service = InMemorySessionService()
        session = await session_service.create_session(
            app_name="gaia_basic_chat",
            user_id="demo_user",
            session_id="basic_chat_session"
        )

        # Create runner
        runner = Runner(
            agent=agent,
            app_name="gaia_basic_chat",
            session_service=session_service
        )

        print("✅ Agent setup complete! Starting conversation demo...\n")

        # Demo conversation - various types of queries
        demo_queries = [
            "Hello! What can you help me with?",
            "Can you explain what blockchain technology is in simple terms?",
            "Write a short haiku about artificial intelligence",
            "What are the benefits of decentralized AI networks?",
            "Can you help me brainstorm 3 creative names for a tech startup?",
            "Explain the difference between machine learning and deep learning",
            "What's your favorite programming language and why?"
        ]

        for i, query in enumerate(demo_queries, 1):
            print(f"📋 Demo Question {i}/{len(demo_queries)}:")
            await chat_with_agent(
                query,
                runner=runner,
                user_id="demo_user",
                session_id="basic_chat_session"
            )
            
            # Add a small delay between questions for readability
            if i < len(demo_queries):
                await asyncio.sleep(2)
                print("\n" + "="*60)

        print("\n🎉 Basic chat demo completed successfully!")
        print("💡 This demonstrates conversational AI with Gaia nodes and Google ADK!")

    except Exception as e:
        print(f"❌ Error occurred: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Verify your Gaia node is accessible")
        print("2. Check that the model name is correct in your .env file")
        print("3. Ensure google-adk and litellm are properly installed")
        print("4. Test the Gaia node endpoint directly if issues persist")

if __name__ == "__main__":
    asyncio.run(main())