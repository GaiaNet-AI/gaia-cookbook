import asyncio
import itertools
import sys
import warnings
import os
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_core.models import ModelFamily
from threading import Thread, Event
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

warnings.filterwarnings("ignore", category=UserWarning, module="autogen_agentchat.agents._assistant_agent")

class LoadingAnimation:
    def __init__(self, message="🤖 Getting response from Gaia node"):
        self.message = message
        self.spinner = itertools.cycle(['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧'])
        self.stop_event = Event()
        self.thread = None
    
    def _animate(self):
        while not self.stop_event.is_set():
            sys.stdout.write(f'\r{self.message} {next(self.spinner)}')
            sys.stdout.flush()
            self.stop_event.wait(0.1)
    
    def start(self):
        self.thread = Thread(target=self._animate)
        self.thread.start()
    
    def stop(self):
        self.stop_event.set()
        if self.thread:
            self.thread.join()
        sys.stdout.write('\r' + ' ' * (len(self.message) + 5) + '\r')
        sys.stdout.flush()

def check_env_vars():
    """Make sure all required environment variables are set"""
    required_vars = ['GAIA_NODE_URL', 'GAIA_API_KEY', 'GAIA_MODEL_NAME']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   • {var}")
        print("\nCreate a .env file with these variables:")
        print("GAIA_NODE_URL=your_node_url")
        print("GAIA_API_KEY=your_api_key") 
        print("GAIA_MODEL_NAME=your_model_name")
        return False
    
    return True

async def simple_working_example():
    """Simple example guaranteed to work with clean text output."""
    
    # Check if environment variables are set
    if not check_env_vars():
        return
    
    # Get config from environment
    gaia_url = os.getenv('GAIA_NODE_URL')
    gaia_key = os.getenv('GAIA_API_KEY')
    gaia_model = os.getenv('GAIA_MODEL_NAME')
    
    model_client = OpenAIChatCompletionClient(
        model=gaia_model,
        base_url=gaia_url,
        api_key=gaia_key,
        model_info={
            "vision": False,
            "function_calling": False,  # Explicitly disable
            "json_output": False,
            "family": ModelFamily.UNKNOWN,
            "structured_output": False,
        },
    )
    
    agent = AssistantAgent(
        "simple_assistant", 
        model_client=model_client,
        system_message="You are a helpful AI assistant. Provide clear, informative responses."
    )
    
    print("🎯 Basic Gaia + AutoGen Example")
    print("=" * 50)
    print(f"🌐 Using: {gaia_model} at {gaia_url}")
    print("=" * 50)
    
    try:
        # Start loading animation
        loader = LoadingAnimation("🤖 Getting response from Gaia node")
        loader.start()
        response = await agent.run(task="In 2-3 paragraphs, explain what makes Gaia nodes special for AI development.")
        
        # Multiple ways to extract clean content
        content = None
        # Stop loading animation
        loader.stop()

        if hasattr(response, 'messages') and response.messages:
            # Get the last assistant message
            for msg in reversed(response.messages):
                if hasattr(msg, 'source') and 'assistant' in msg.source:
                    content = msg.content
                    break
        
        if not content and hasattr(response, 'content'):
            content = response.content
        
        if not content:
            content = str(response)
        
        # Clean up the content (remove any tool call artifacts)
        if content and '<tool_call>' in content:
            # Extract text before tool call
            content = content.split('<tool_call>')[0].strip()
            if not content:
                content = "The assistant tried to use tools. Please disable function_calling in your model_info."
        
        print("📝 ASSISTANT RESPONSE:")
        print("-" * 30)
        print(content)
        
    except Exception as e:
        loader.stop()
        print(f"❌ Error: {e}")
    finally:
        await model_client.close()

if __name__ == "__main__":
    asyncio.run(simple_working_example())