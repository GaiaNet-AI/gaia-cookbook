# Gaia Node + Google ADK Demo

This project demonstrates how to integrate Gaia nodes with Google's Agent Development Kit (ADK) using LiteLLM for both basic conversational AI and tool calling capabilities.

## 📁 Project Structure

```
google-adk/
├── .env                    # Environment configuration
├── requirements.txt        # Python dependencies
├── basic_example.py     # Basic conversational AI demo
├── tool_calling_example.py   # Tool calling capabilities demo
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or create the project directory
mkdir google-adk
cd google-adk

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

Copy the `.env` file and update it with your details:

```bash
# .env
GAIA_NODE_BASE_URL=https://your-gaia-node.gaia.domains/v1
GAIA_NODE_API_KEY=your-api-key
GAIA_MODEL_NAME=your-model-name

# Get a free API key from: https://openweathermap.org/api
OPENWEATHER_API_KEY=your-openweather-api-key
```

**To get your free OpenWeatherMap API key:**
1. Visit [OpenWeatherMap API](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to "My API keys" in your account
4. Copy the API key and add it to your `.env` file

### 3. Run the Demos

**Basic Chat Demo (No Tools):**
```bash
python basic_example.py
```

**Tool Calling Demo:**
```bash
python tool_calling_example.py
```

## 📋 Demo Features

### Basic Chat Demo (`basic_example.py`)
- ✨ Pure conversational AI without tool calling
- 🤖 Multiple demo queries showcasing different AI capabilities
- 📊 Clean, emoji-enhanced output for easy reading
- 🔧 Comprehensive error handling and troubleshooting

**Demo Topics:**
- General greetings and capabilities
- Technical explanations (blockchain concepts)
- Creative tasks (haiku generation)
- Domain knowledge (decentralized AI benefits)
- Brainstorming (startup naming)
- Educational content (ML vs Deep Learning)
- Opinion-based responses

### Tool Calling Demo (`tool_calling_example.py`)
- 🌤️ **Real Weather API**: Live weather data from OpenWeatherMap
- 🎯 **Focused Demo**: Clean, weather-only tool calling showcase
- 📊 **Real-time API Calls**: Demonstrates actual external API integration
- 🌍 **Global Coverage**: Works with cities worldwide

**Available Tool:**
1. **get_current_weather**: Real weather data using OpenWeatherMap API
   - Current temperature, humidity, wind speed, conditions
   - Supports any city worldwide
   - Handles API errors gracefully

**Sample Weather Queries:**
- "What's the weather in London?"
- "How's the weather in Tokyo right now?"
- "Compare weather between Sydney and Melbourne"
- "What's the temperature and humidity in Paris?"

## 🌟 Key Benefits

- **Decentralized AI**: Leverage Gaia's distributed infrastructure
- **Easy Integration**: Simple setup with Google ADK and LiteLLM
- **Flexible Configuration**: Environment-based configuration
- **Multiple Capabilities**: Both basic chat and advanced tool calling
- **Production Ready**: Error handling and validation included

## 🔧 Troubleshooting

### Common Issues

1. **"Session not found" Error**
   - Ensure you're using the latest version of google-adk
   - Check that the session creation is properly awaited

2. **Connection Errors**
   - Verify your Gaia node URL is accessible
   - Test the endpoint with curl:
   ```bash
   curl -X POST "https://your-gaia-node.gaia.domains/v1/chat/completions" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your-api-key" \
     -d '{"model": "your-model", "messages": [{"role": "user", "content": "Hello"}]}'
   ```

3. **Model Not Found**
   - Check that your model name matches exactly what's available on your Gaia node
   - Try listing available models on your node

4. **Tool Calling Issues**
   - Verify your Gaia node supports function calling
   - Check model compatibility with tool calling features

### Environment Variables

Make sure all required environment variables are set in your `.env` file:

- `GAIA_NODE_BASE_URL`: Your Gaia node's OpenAI-compatible endpoint
- `GAIA_NODE_API_KEY`: API key for authentication (use "gaia" for public nodes)
- `GAIA_MODEL_NAME`: Exact model name available on your node

## 📖 Learn More

- [Gaia Network Documentation](https://docs.gaianet.ai/)
- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [LiteLLM Documentation](https://docs.litellm.ai/)
