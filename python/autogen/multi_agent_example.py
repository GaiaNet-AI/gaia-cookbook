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

# Stop those annoying warnings
warnings.filterwarnings("ignore", category=UserWarning, module="autogen_agentchat.agents._assistant_agent")

class LoadingSpinner:
    def __init__(self, msg="Working on it"):
        self.msg = msg
        self.spinner_chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧']
        self.stop_spinning = Event()
        self.spinner_thread = None
    
    def _spin(self):
        i = 0
        while not self.stop_spinning.is_set():
            sys.stdout.write(f'\r{self.msg} {self.spinner_chars[i % len(self.spinner_chars)]}')
            sys.stdout.flush()
            self.stop_spinning.wait(0.1)
            i += 1
    
    def start(self):
        self.spinner_thread = Thread(target=self._spin)
        self.spinner_thread.start()
    
    def stop(self):
        self.stop_spinning.set()
        if self.spinner_thread:
            self.spinner_thread.join()
        # Clear the line
        sys.stdout.write('\r' + ' ' * (len(self.msg) + 10) + '\r')
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

def get_actual_response(agent_response):
    """Pull out just the actual text response from all that AutoGen metadata"""
    
    # Try to find the assistant's actual message
    if hasattr(agent_response, 'messages') and agent_response.messages:
        for msg in agent_response.messages:
            # Look for messages from our agents (not user messages)
            if hasattr(msg, 'source') and msg.source != 'user':
                if hasattr(msg, 'content') and msg.content:
                    text = msg.content
                    # Remove any weird tool call stuff if it shows up
                    if '<tool_call>' in text:
                        text = text.split('<tool_call>')[0].strip()
                    return text
    
    # Fallback - just convert to string and hope for the best
    return str(agent_response)

async def simple_ai_chat():
    """Two AI agents having a quick conversation about Gaia nodes"""
    
    # Check if environment variables are set
    if not check_env_vars():
        return
    
    # Get config from environment
    gaia_url = os.getenv('GAIA_NODE_URL')
    gaia_key = os.getenv('GAIA_API_KEY')
    gaia_model = os.getenv('GAIA_MODEL_NAME')
    
    print("🤖 Two AI Experts Discussing Gaia Nodes")
    print("=" * 45)
    print(f"🌐 Using: {gaia_model} at {gaia_url}")
    print("=" * 45)
    
    # Connect to the Gaia node using environment variables
    gaia_client = OpenAIChatCompletionClient(
        model=gaia_model,
        base_url=gaia_url,
        api_key=gaia_key,
        model_info={
            "vision": False,
            "function_calling": False,
            "json_output": False,
            "family": ModelFamily.UNKNOWN,
            "structured_output": False,
        },
    )
    
    try:
        # First expert - the tech person
        tech_guy = AssistantAgent(
            "tech_guy",
            model_client=gaia_client,
            system_message="You're a tech expert who knows about decentralized AI. Keep answers short and to the point - 1-2 sentences max."
        )
        
        print("\n🔧 Asking the tech expert...")
        spinner = LoadingSpinner("🔧 Tech expert thinking")
        spinner.start()
        
        tech_answer = await asyncio.wait_for(
            tech_guy.run(task="What's the biggest advantage of Gaia nodes over regular cloud AI?"),
            timeout=30
        )
        
        spinner.stop()
        tech_text = get_actual_response(tech_answer)
        print(f"🔧 Tech Expert: {tech_text}")
        
        # Give the node a breather
        await asyncio.sleep(3)
        
        # Second expert - business person
        biz_person = AssistantAgent(
            "biz_person",
            model_client=gaia_client,
            system_message="You're a business strategist focused on AI opportunities. Keep responses brief - 1-2 sentences."
        )
        
        print("\n📊 Asking the business expert...")
        spinner = LoadingSpinner("📊 Business expert thinking")
        spinner.start()
        
        biz_answer = await asyncio.wait_for(
            biz_person.run(
                task=f"The tech expert said: '{tech_text}' - what business opportunity does this create?"
            ),
            timeout=30
        )
        
        spinner.stop()
        biz_text = get_actual_response(biz_answer)
        print(f"📊 Business Expert: {biz_text}")
        
        print("\n✅ Done! Both experts gave their take using Gaia infrastructure.")
        
    except asyncio.TimeoutError:
        if 'spinner' in locals():
            spinner.stop()
        print("\n⏰ Took too long - the Gaia node might be busy right now.")
        
    except Exception as error:
        if 'spinner' in locals():
            spinner.stop()
        
        error_text = str(error)
        if "504" in error_text:
            print("\n🌐 The Gaia node timed out - probably just overloaded. Try again in a bit.")
        else:
            print(f"\n❌ Something went wrong: {error}")
        
    finally:
        await gaia_client.close()

if __name__ == "__main__":
    asyncio.run(simple_ai_chat())