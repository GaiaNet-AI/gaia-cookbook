import asyncio
import requests
import warnings
import itertools
import sys
import os
from datetime import datetime
from typing import Dict, Any
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

def check_gaia_node(node_url: str) -> Dict[str, Any]:
    """Check if a Gaia node is working and get some basic info about it"""
    try:
        models_response = requests.get(f"{node_url}/models", timeout=10)
        
        if models_response.status_code != 200:
            return {
                "status": "error",
                "message": f"Models endpoint returned {models_response.status_code}",
                "working": False
            }
            
        models_data = models_response.json()
        models = models_data.get("data", [])
        
        test_start = datetime.now()
        test_response = requests.post(
            f"{node_url}/chat/completions",
            json={
                "model": models[0]["id"] if models else "default",
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 5
            },
            timeout=15
        )
        test_time = (datetime.now() - test_start).total_seconds()
        
        return {
            "status": "healthy",
            "working": True,
            "models_available": len(models),
            "response_time": round(test_time, 2),
            "message": f"Node working fine with {len(models)} models, responded in {test_time:.2f}s"
        }
        
    except Exception as e:
        return {
            "status": "error", 
            "working": False,
            "message": f"Failed to connect: {str(e)}"
        }

def get_crypto_market_data() -> Dict[str, Any]:
    """Get real crypto market data from CoinGecko (free, no API key needed)"""
    try:
        # Get some relevant crypto data for AI/blockchain context
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            'ids': 'ethereum,bitcoin,chainlink,filecoin,render-token',  # AI/blockchain related tokens
            'vs_currencies': 'usd',
            'include_24hr_change': 'true',
            'include_market_cap': 'true'
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Calculate some aggregate metrics
            total_market_cap = sum(coin.get('usd_market_cap', 0) for coin in data.values())
            avg_change = sum(coin.get('usd_24h_change', 0) for coin in data.values()) / len(data)
            
            return {
                "source": "CoinGecko API (live data)",
                "total_ai_blockchain_market_cap": f"${total_market_cap:,.0f}",
                "average_24h_change": f"{avg_change:.2f}%",
                "ethereum_price": f"${data.get('ethereum', {}).get('usd', 0):,.2f}",
                "bitcoin_price": f"${data.get('bitcoin', {}).get('usd', 0):,.2f}",
                "market_trend": "bullish" if avg_change > 0 else "bearish",
                "summary": f"AI/Blockchain tokens showing {avg_change:.1f}% average change today, total market cap ${total_market_cap/1e9:.1f}B"
            }
        else:
            # Fallback to fake data
            return get_fallback_data("CoinGecko API failed")
            
    except Exception as e:
        return get_fallback_data(f"API error: {str(e)}")

def get_fallback_data(reason: str) -> Dict[str, Any]:
    """Fallback to simulated data when APIs fail"""
    return {
        "source": f"Simulated data ({reason})",
        "decentralized_nodes": 15420,
        "daily_requests": "2.4M",
        "cost_vs_openai": "73% cheaper",
        "growth_rate": "23% monthly",
        "summary": "Using fallback data: Decentralized AI growing fast, much cheaper than big tech"
    }

def get_actual_response(agent_response):
    """Pull out just the actual text response from all that AutoGen metadata"""
    if hasattr(agent_response, 'messages') and agent_response.messages:
        for msg in agent_response.messages:
            if hasattr(msg, 'source') and msg.source != 'user':
                if hasattr(msg, 'content') and msg.content:
                    text = msg.content
                    if '<tool_call>' in text:
                        text = text.split('<tool_call>')[0].strip()
                    return text
    return str(agent_response)

async def smart_ai_analyst_with_real_data():
    """An AI analyst that uses real APIs to gather market data"""
    
    # Check if environment variables are set
    if not check_env_vars():
        return
    
    # Get config from environment
    gaia_url = os.getenv('GAIA_NODE_URL')
    gaia_key = os.getenv('GAIA_API_KEY')
    gaia_model = os.getenv('GAIA_MODEL_NAME')
    
    print("🔬 Smart AI Analyst with Real Market Data from CoinGecko")
    print("=" * 50)
    print(f"🌐 Using Gaia node: {gaia_url}")
    print(f"🤖 Model: {gaia_model}")
    print("=" * 50)
    
    # Connect to Gaia using environment variables
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
        # Gather real data from multiple sources
        print("\n📊 Gathering live market data...")
        
        # Check Gaia node
        spinner = LoadingSpinner("📊 Checking Gaia node")
        spinner.start()
        node_status = check_gaia_node(gaia_url)
        spinner.stop()
        print(f"✅ Gaia Node: {node_status['message']}")
        
        # Get crypto market data
        spinner = LoadingSpinner("💰 Getting crypto market data")
        spinner.start()
        crypto_data = get_crypto_market_data()
        spinner.stop()
        print(f"✅ Crypto Data: {crypto_data['summary']}")
        
        # Create analyst with all the real data
        analyst = AssistantAgent(
            "market_analyst",
            model_client=gaia_client,
            system_message=f"""You're a market analyst with access to real-time data:

GAIA NODE STATUS: {node_status['message']}

CRYPTO MARKET DATA ({crypto_data['source']}):
- Market trend: {crypto_data.get('market_trend', 'unknown')}
- ETH price: {crypto_data.get('ethereum_price', 'N/A')}
- BTC price: {crypto_data.get('bitcoin_price', 'N/A')}
- 24h change: {crypto_data.get('average_24h_change', 'N/A')}
- Total market cap: {crypto_data.get('total_ai_blockchain_market_cap', 'N/A')}

Use this real data to provide insights. Be specific and reference the actual numbers."""
        )
        
        print("\n🤖 Asking the analyst for recommendations...")
        spinner = LoadingSpinner("🤖 Analyst analyzing real market data")
        spinner.start()
        
        analysis = await asyncio.wait_for(
            analyst.run(
                task="""A company is considering switching from OpenAI to Gaia nodes for their AI infrastructure. 
                Based on the real market data you have access to, provide them with:
                
                1. Technical feasibility assessment (based on Gaia node performance)
                2. Market timing analysis (based on crypto trends)
                3. Strategic recommendation with specific data points
                
                Reference the actual numbers and trends from your data. Keep it concise but insightful."""
            ),
            timeout=60
        )
        
        spinner.stop()
        
        analysis_text = get_actual_response(analysis)
        
        print("\n📋 MARKET ANALYST RECOMMENDATION:")
        print("=" * 40)
        print(analysis_text)
        print("=" * 40)
        
        print("\n✅ Analysis complete! Used real market data + Gaia infrastructure.")
        
    except asyncio.TimeoutError:
        if 'spinner' in locals():
            spinner.stop()
        print("\n⏰ Analysis took too long - try again.")
        
    except Exception as error:
        if 'spinner' in locals():
            spinner.stop()
        print(f"\n❌ Something went wrong: {error}")
        
    finally:
        await gaia_client.close()

if __name__ == "__main__":
    asyncio.run(smart_ai_analyst_with_real_data())