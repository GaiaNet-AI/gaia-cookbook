# Gaia Nodes + OpenAI Agents SDK Integration

This repository demonstrates how to integrate **Gaia's decentralized AI network** with **OpenAI's Agents SDK** to build powerful, distributed AI applications with tool calling capabilities.

![gaia-openai-agents-sdk-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/908f35fb-6586-4019-a0e9-48355a7d5089)

## 🌟 What is This Integration?

**Gaia Nodes** provide decentralized AI inference through OpenAI-compatible APIs, while **OpenAI's Agents SDK** offers a robust framework for building AI agents with tool calling, memory, and workflow capabilities. Together, they enable:

- **Decentralized AI**: Run AI agents on Gaia's distributed network instead of centralized services
- **Tool Integration**: Seamlessly connect external APIs and services to your AI agents
- **Cost Efficiency**: Leverage Gaia's competitive pricing and node diversity
- **Privacy**: Keep sensitive data processing distributed across the network
- **Reliability**: Benefit from Gaia's fault-tolerant, multi-node architecture

## 🚀 Quick Start

### Prerequisites

```bash
# Install required packages
pip install "openai-agents[litellm]" aiohttp python-dotenv

# Optional: For weather demo
# Get free API key at https://openweathermap.org/api
```

### Basic Setup

1. **Get a Gaia Node URL**:
   - Deploy your own node or use a public one
   - Format: `https://your-node-id.gaia.domains/v1`

2. **Run the Examples**:
   ```bash
   # Basic chat demo
   python basic_example.py
   
   # Weather tool calling demo
   python tool_calling_example.py
   ```

## 📁 Example Files

### 1. `basic_example.py` - Simple Chat Interface
A terminal-based chat application showcasing basic Gaia + Agents SDK integration.

**Features**:
- Interactive chat loop
- Configurable Gaia node endpoints
- Clean error handling and graceful exits
- Emoji-enhanced UI

### 2. `tool_calling_example.py` - Weather Tools Demo
Advanced example demonstrating tool calling capabilities with real external APIs.

**Features**:
- Current weather lookup
- Multi-day weather forecasts
- Async HTTP requests
- Error handling for API failures
- Formatted weather data presentation

## 🛠️ How It Works

### Architecture Overview

```
User Input → OpenAI Agents SDK → LiteLLM → Gaia Node → AI Model → Response
                ↓
        Tool Calls (if needed)
                ↓
        External APIs (Weather, etc.)
                ↓
        Formatted Results → Final Response
```

### Key Components

1. **LitellmModel**: Bridges Agents SDK with Gaia's OpenAI-compatible API
2. **Function Tools**: Decorated Python functions that agents can call
3. **Agent Instructions**: Define agent behavior and capabilities
4. **Runner**: Executes agent workflows and handles tool calling

### Configuration

```python
# Basic Gaia connection
model = LitellmModel(
    model="openai/gpt-3.5-turbo",  # OpenAI-compatible format
    api_key="gaia",                # Can be any string for public nodes
    base_url="https://your-node-id.gaia.domains/v1"
)

# Create agent with tools
agent = Agent(
    name="My Agent",
    instructions="Your agent's instructions here",
    model=model,
    tools=[my_tool_function]  # Optional tools
)
```

## 🎯 Use Cases & Project Ideas

### 💼 Business Applications

**1. Customer Support Bots**
- Deploy on Gaia for cost-effective 24/7 support
- Integrate with CRM tools, knowledge bases, and ticketing systems
- Handle multiple languages and complex queries

**2. Sales & Marketing Assistants**
- Lead qualification and nurturing
- Product recommendation engines
- Content generation and social media management
- Market research and competitive analysis

**3. Financial Analysis Tools**
- Real-time market data integration
- Risk assessment and portfolio management
- Automated trading strategies
- Compliance and regulatory reporting

### 🔬 Research & Development

**4. Scientific Research Assistants**
- Literature review and citation management
- Data analysis and visualization
- Experiment planning and methodology
- Grant writing and proposal generation

**5. Code Analysis & Development**
- Automated code review and suggestions
- Documentation generation
- Bug detection and security analysis
- Architecture planning and optimization

### 🌐 IoT & Smart Systems

**6. Smart Home Controllers**
- Voice-activated home automation
- Energy optimization and monitoring
- Security system integration
- Predictive maintenance alerts

**7. Agricultural Monitoring**
- Weather-based crop recommendations
- Soil analysis and irrigation scheduling
- Pest detection and treatment planning
- Yield prediction and harvest optimization

### 📚 Education & Training

**8. Personalized Learning Assistants**
- Adaptive curriculum generation
- Student progress tracking
- Interactive tutoring systems
- Assessment and feedback tools

**9. Language Learning Platforms**
- Conversation practice with native-level AI
- Grammar correction and explanation
- Cultural context and etiquette guidance
- Progress tracking and goal setting

### 🎮 Creative & Entertainment

**10. Content Creation Studios**
- Story and screenplay writing
- Music composition and arrangement
- Game narrative development
- Social media content planning

**11. Virtual Event Assistants**
- Conference planning and coordination
- Real-time Q&A and moderation
- Networking facilitation
- Follow-up and engagement tracking

### 🏥 Healthcare & Wellness

**12. Health Monitoring Systems**
- Symptom tracking and analysis
- Medication reminders and interactions
- Fitness goal planning and motivation
- Mental health check-ins and support

**13. Medical Research Tools**
- Clinical trial patient matching
- Literature review and meta-analysis
- Drug interaction checking
- Treatment protocol optimization

### 🌍 Environmental & Sustainability

**14. Climate Monitoring Networks**
- Environmental data collection and analysis
- Carbon footprint tracking and reduction
- Renewable energy optimization
- Conservation strategy planning

**15. Supply Chain Optimization**
- Route planning and logistics
- Inventory management and forecasting
- Supplier evaluation and selection
- Sustainability impact assessment

## 🔧 Advanced Features

### Multi-Tool Integration
```python
@function_tool
async def search_web(query: str) -> str:
    # Web search implementation
    pass

@function_tool
async def send_email(to: str, subject: str, body: str) -> str:
    # Email sending implementation
    pass

@function_tool
async def query_database(sql: str) -> str:
    # Database query implementation
    pass

# Agent with multiple tools
agent = Agent(
    name="Multi-Tool Assistant",
    model=gaia_model,
    tools=[search_web, send_email, query_database]
)
```

### Memory and Context Management
```python
# Agents SDK handles conversation memory automatically
# You can also implement custom memory systems
class CustomMemory:
    def __init__(self):
        self.conversation_history = []
        self.user_preferences = {}
    
    def add_interaction(self, user_input, agent_response):
        self.conversation_history.append({
            "user": user_input,
            "agent": agent_response,
            "timestamp": datetime.now()
        })
```

### Error Handling and Reliability
```python
async def robust_agent_call(agent, user_input, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = await Runner.run(agent, user_input)
            return result
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
```

## 🔒 Security & Best Practices

### API Key Management
```python
import os
from dotenv import load_dotenv

load_dotenv()

# Store sensitive keys in environment variables
weather_api_key = os.getenv('OPENWEATHER_API_KEY')
gaia_api_key = os.getenv('GAIA_API_KEY', 'gaia')
```

### Input Validation
```python
@function_tool
async def safe_web_search(query: str) -> str:
    # Validate and sanitize input
    if not query or len(query) > 500:
        return "Invalid search query"
    
    # Implement rate limiting
    # Add content filtering
    # Log requests for monitoring
```

### Rate Limiting and Quotas
```python
import asyncio
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, max_requests=100, time_window=3600):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = defaultdict(list)
    
    async def check_limit(self, user_id):
        now = datetime.now()
        # Clean old requests
        self.requests[user_id] = [
            req_time for req_time in self.requests[user_id]
            if now - req_time < timedelta(seconds=self.time_window)
        ]
        
        if len(self.requests[user_id]) >= self.max_requests:
            return False
        
        self.requests[user_id].append(now)
        return True
```

## 📊 Performance Optimization

### Async Operations
- Use `aiohttp` for external API calls
- Implement connection pooling
- Add request timeouts and retries

### Caching Strategies
```python
import aioredis
from functools import wraps

def cache_result(ttl=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Check cache first
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            cached = await redis.get(cache_key)
            
            if cached:
                return json.loads(cached)
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await redis.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator
```

### Monitoring and Logging
```python
import logging
import time
from functools import wraps

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def monitor_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"{func.__name__} completed in {duration:.2f}s")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"{func.__name__} failed after {duration:.2f}s: {e}")
            raise
    return wrapper
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test with multiple Gaia nodes
5. Submit a pull request

## 🆘 Support & Resources

- **Gaia Documentation**: [Gaia Network Docs](https://docs.gaianet.ai)
- **OpenAI Agents SDK**: [Official Documentation](https://openai.github.io/openai-agents-python/)
- **LiteLLM**: [Provider Documentation](https://docs.litellm.ai/docs/)
- **Issues**: Report bugs and request features via GitHub Issues

## 🌟 Community Showcase

Share your Gaia + Agents SDK projects:
- Tag us on social media with #GaiaAgents
- Submit to our community showcase
- Join our Discord for real-time support

---

**Built with ❤️ for the decentralized AI future**
