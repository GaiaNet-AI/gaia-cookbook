# Gaia + AutoGen: Examples

This project demonstrates how to combine **Microsoft's AutoGen** framework with **Gaia's decentralized AI nodes** to build powerful, privacy-preserving AI applications that don't depend on big tech companies.

## Why Gaia + AutoGen? 🚀

**AutoGen** is Microsoft's framework for creating multi-agent AI systems where different AI "experts" can collaborate on complex tasks. **Gaia** provides the decentralized infrastructure to run these AI models without depending on centralized services.

Together, they let you build sophisticated AI applications that are:
- **Decentralized**: Your AI runs on a distributed network
- **Collaborative**: Multiple AI agents work together on complex problems  
- **Private**: Your data stays where you want it
- **Cost-effective**: Often 70%+ cheaper than centralized alternatives

## What You'll Learn 📚

This project includes three practical examples that show different ways to use Gaia nodes with AutoGen:

1. **Simple Assistant** - Basic AI interaction with clean responses
2. **Multi-Agent Conversation** - Two AI experts collaborating on a problem
3. **Smart Analyst with Real Data** - AI that uses live market data to make recommendations

## Getting Started 🛠️

### Prerequisites

You'll need:
- Python 3.10 or later
- A Gaia node URL and API key
- Basic familiarity with running Python scripts

### Installation

1. **Clone this repository**
   ```bash
   git clone <your-repo-url>
   cd python/autogen
   ```

2. **Install dependencies**
   ```bash
   pip install -U "autogen-agentchat" "autogen-ext[openai]"
   pip install python-dotenv requests
   ```

3. **Set up your environment**
   
   Create a `.env` file in the project root:
   ```bash
   # .env
   GAIA_NODE_URL=https://your-gaia-node.domains/v1
   GAIA_API_KEY=your-gaia-api-key
   GAIA_MODEL_NAME=your-model-name
   ```

### Finding Your Gaia Node Details

1. **Launch your own Gaia node** by following this [tutorial](https://docs.gaianet.ai/getting-started/quick-start/).
2. **Find your API key** (if you're using a [public domain](https://docs.gaianet.ai/nodes) offered by Gaia)
3. **Check available models** by visiting `https://your-node-url/v1/models`

## The Three Examples Explained 📖

### 1. Simple Assistant (`simple_assistant.py`)

**What it does**: Creates a single AI assistant that gives clear, informative responses about Gaia nodes.

**Why it's useful**: Perfect for testing your setup and getting clean, readable responses without complexity.

```python
# Key code snippet showing basic Gaia + AutoGen setup
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

agent = AssistantAgent(
    "simple_assistant", 
    model_client=gaia_client,
    system_message="You are a helpful AI assistant. Provide clear, informative responses."
)

response = await agent.run(task="Explain what makes Gaia nodes special for AI development.")
```

**Run it**: `python simple_assistant.py`

### 2. Multi-Agent Conversation (`multi_agent_chat.py`)

**What it does**: Creates two specialized AI experts (technical and business) who discuss Gaia nodes and build on each other's insights.

**Why it's powerful**: Shows how different AI "personalities" can collaborate, each bringing their own expertise to solve complex problems.

```python
# Two experts with different specializations
tech_guy = AssistantAgent(
    "tech_guy",
    model_client=gaia_client,
    system_message="You're a tech expert who knows about decentralized AI. Keep answers short and to the point - 1-2 sentences max."
)

biz_person = AssistantAgent(
    "biz_person",
    model_client=gaia_client,
    system_message="You're a business strategist focused on AI opportunities. Keep responses brief - 1-2 sentences."
)

# They build on each other's responses
tech_answer = await tech_guy.run(task="What's the biggest advantage of Gaia nodes over regular cloud AI?")
biz_answer = await biz_person.run(task=f"The tech expert said: '{tech_text}' - what business opportunity does this create?")
```

**Run it**: `python multi_agent_chat.py`

### 3. Smart Analyst with Real Data (`smart_analyst.py`)

**What it does**: Creates an AI analyst that gathers real market data from APIs and uses it to make informed business recommendations.

**Why it's impressive**: Demonstrates how AI agents can integrate live data to provide current, actionable insights rather than just general knowledge.

```python
# Gathering real market data
def get_crypto_market_data() -> Dict[str, Any]:
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {
        'ids': 'ethereum,bitcoin,chainlink,filecoin,render-token',
        'vs_currencies': 'usd',
        'include_24hr_change': 'true',
        'include_market_cap': 'true'
    }
    response = requests.get(url, params=params, timeout=10)
    # Process and return market analysis...

# AI analyst with real-time context
analyst = AssistantAgent(
    "market_analyst",
    model_client=gaia_client,
    system_message=f"""You're a market analyst with access to real-time data:
    
    GAIA NODE STATUS: {node_status['message']}
    CRYPTO MARKET DATA: ETH price: {crypto_data['ethereum_price']}, Market trend: {crypto_data['market_trend']}
    
    Use this real data to provide insights. Be specific and reference the actual numbers."""
)
```

**Run it**: `python smart_analyst.py`

## Understanding the Output 📊

Each example produces different types of output:

### Simple Assistant
```
🎯 SIMPLE GAIA ASSISTANT TEST
==================================================
🌐 Using: MODEL_NAME at https://your-node.domains/v1
==================================================

📝 ASSISTANT RESPONSE:
------------------------------
Gaia nodes represent a paradigm shift in AI infrastructure by enabling truly decentralized AI inference...
```

### Multi-Agent Chat
```
🤖 Two AI Experts Discussing Gaia Nodes
=============================================

🔧 Tech Expert: Gaia nodes provide decentralized inference without relying on big tech companies, offering better privacy and cost control.

📊 Business Expert: This creates massive opportunities for startups to build AI services without the infrastructure costs and vendor lock-in of traditional cloud providers.
```

### Smart Analyst
```
🔬 Smart AI Analyst with Real Market Data
==================================================

✅ Gaia Node: Node working fine with 2 models, responded in 1.34s
✅ Crypto Data: AI/Blockchain tokens showing 2.3% average change today, total market cap 1.2T

📋 MARKET ANALYST RECOMMENDATION:
========================================
Based on current data showing ETH at $3,245 and positive 2.3% market sentiment, along with our Gaia node's 1.34s response time, the technical infrastructure is solid for migration...
```

## Troubleshooting 🔧

### Common Issues

**Environment Variables Not Found**
```
❌ Missing required environment variables:
   • GAIA_NODE_URL
   • GAIA_API_KEY
   • GAIA_MODEL_NAME
```
**Solution**: Make sure your `.env` file exists and contains all required variables.

**Gateway Timeout (504 Error)**
```
🌐 The Gaia node timed out - probably just overloaded. Try again in a bit.
```
**Solution**: The Gaia node is temporarily busy. Wait a few minutes and try again.

**Model Not Found**
```
❌ Something went wrong: Model 'wrong-model-name' not found
```
**Solution**: Check your model name by visiting `https://your-node-url/v1/models`

### Getting Help

1. **Check your Gaia node status** by visiting the `/models` endpoint
2. **Verify your API key** is correct and active
3. **Try the simple assistant first** to test basic connectivity
4. **Check the console output** for specific error messages

## Why This Matters 🌟

### For Developers
- **No vendor lock-in**: Switch between different Gaia nodes easily
- **Cost control**: Often 70%+ cheaper than OpenAI or similar services
- **Privacy**: Your data doesn't go through big tech companies
- **Reliability**: Distributed infrastructure is more resilient

### For Businesses
- **Competitive advantage**: Build AI features without depending on competitors' infrastructure
- **Compliance**: Keep sensitive data within your preferred geographic regions
- **Innovation**: Access cutting-edge models that might not be available on centralized platforms
- **Future-proofing**: Not dependent on any single company's business decisions

### For the AI Ecosystem
- **Democratization**: Makes advanced AI accessible to smaller players
- **Innovation**: Encourages diverse approaches to AI development
- **Resilience**: Creates a more robust, distributed AI infrastructure
- **Competition**: Breaks up the concentration of AI power

## Next Steps 🚀

Once you've got the examples working, consider:

1. **Building custom agents** for your specific use cases
2. **Integrating multiple Gaia nodes** for redundancy and load balancing
3. **Adding more sophisticated tools** for your AI agents to use
4. **Creating domain-specific multi-agent teams** for your industry
5. **Exploring different models** available on various Gaia nodes

## Resources 📚

- **AutoGen Documentation**: [https://microsoft.github.io/autogen/stable//index.html](https://microsoft.github.io/autogen/stable//index.html)
- **Gaia Network**: [Learn more]()https://gaianet.ai) about Gaia nodes and the decentralized AI ecosystem
- **OpenAI API Compatibility**: All Gaia nodes come with an [OpenAI compatible API](https://docs.gaianet.ai/getting-started/api-reference)