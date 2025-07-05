"""
Basic Chat Demo using OpenAI Agents SDK with Gaia's Node
This demo shows a simple terminal-based chat interface.
Fixed version with proper Ctrl+C handling.
"""

from __future__ import annotations

import asyncio
import signal
import sys
from typing import Optional

from agents import Agent, Runner, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel

set_tracing_disabled(True)

class GaiaChat:
    def __init__(self, base_url: str, api_key: str = "dummy"):
        """Initialize the Gaia chat client.
        
        Args:
            base_url: The base URL for Gaia's Node API endpoint
            api_key: API key (can be dummy for local Gaia nodes)
        """
        self.agent = Agent(
            name="Gaia Assistant",
            instructions="""You are a helpful AI assistant running on Gaia's decentralized network. 
            You can help with various tasks including answering questions, providing explanations, 
            helping with code, and general conversation. Be friendly and informative.""",
            model=LitellmModel(
                model="openai/gpt-3.5-turbo",  # Use OpenAI-compatible format
                api_key=api_key,
                base_url=base_url
            ),
        )
        self._shutdown = False
    
    def shutdown(self):
        """Signal the chat to shutdown gracefully."""
        self._shutdown = True
    
    async def chat_loop(self):
        """Main chat loop for interactive conversation."""
        print("🌟 Gaia Chat Demo - OpenAI Agents SDK")
        print("Type 'quit', 'exit', or 'bye' to end the conversation")
        print("=" * 50)
        
        while not self._shutdown:
            try:
                # Get user input with timeout to check for shutdown
                try:
                    user_input = await asyncio.wait_for(
                        asyncio.to_thread(input, "\n💬 You: "),
                        timeout=1.0
                    )
                    user_input = user_input.strip()
                except asyncio.TimeoutError:
                    continue
                
                # Check for exit commands
                if user_input.lower() in ['quit', 'exit', 'bye', 'q']:
                    print("\n👋 Goodbye! Thanks for using Gaia Chat!")
                    break
                
                if not user_input:
                    continue
                
                # Show thinking indicator
                print("🤖 Gaia Assistant: ", end="", flush=True)
                
                # Get response from agent with timeout
                try:
                    result = await asyncio.wait_for(
                        Runner.run(self.agent, user_input),
                        timeout=30.0
                    )
                    
                    # Display response
                    print(result.final_output)
                    
                except asyncio.TimeoutError:
                    print("\n⏰ Request timed out. Please try again.")
                except Exception as e:
                    print(f"\n❌ Error: {e}")
                    print("Please try again or type 'quit' to exit.")
                
            except KeyboardInterrupt:
                print("\n\n👋 Chat interrupted. Goodbye!")
                break
            except Exception as e:
                if not self._shutdown:
                    print(f"\n❌ Unexpected error: {e}")
                    print("Please try again or type 'quit' to exit.")


async def main():
    """Main function to set up and run the chat demo."""
    
    # Configuration for Gaia's Node
    default_base_url = "https://your-node-id.gaia.domains/v1"  # Default Gaia Node URL
    default_api_key = "gaia"  # Can be any string for local nodes
    
    print("🚀 Setting up Gaia Chat Demo")
    print("=" * 40)
    
    # Get configuration from user
    base_url = input(f"Enter Gaia Node base URL (default: {default_base_url}): ").strip()
    if not base_url:
        base_url = default_base_url
    
    api_key = input(f"Enter API key (default: {default_api_key}): ").strip()
    if not api_key:
        api_key = default_api_key
    
    # Create chat instance
    chat = GaiaChat(base_url, api_key)
    
    # Set up signal handler for graceful shutdown
    def signal_handler():
        print("\n🛑 Shutting down gracefully...")
        chat.shutdown()
    
    # Register signal handlers
    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, lambda s, f: signal_handler())
    
    try:
        # Create and start chat
        await chat.chat_loop()
        
    except Exception as e:
        print(f"❌ Failed to initialize chat: {e}")
        print("Please check your Gaia Node URL and try again.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)