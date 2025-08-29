
# 🌌 Gaia Node + Langfuse Integration Demo

A Streamlit application demonstrating seamless integration between Gaia Node (with OpenAI-compatible API) and Langfuse for comprehensive observability, tracing, and monitoring of AI inference calls.

## 🚀 Overview

This demo showcases how developers can leverage Gaia Node's OpenAI-compatible API with Langfuse's powerful observability platform to build, monitor, and optimize AI agents and inference pipelines. The integration provides automatic tracing, performance monitoring, and rich analytics for all your AI operations.

<img width="1014" height="1636" alt="gaia-langfuse-1" src="https://github.com/user-attachments/assets/a73f7a21-f9c6-4ca9-806f-81afeb3dcfe4" />
<img width="1934" height="1237" alt="gaia-langfuse" src="https://github.com/user-attachments/assets/09b87fc4-6ab8-4092-a6b4-a1bdc448b8fb" />

## ✨ Key Features

- **Automatic Tracing**: Every Gaia Node API call is automatically traced in Langfuse
- **Nested Operations**: Complex workflows with multiple LLM calls are grouped into single traces
- **Rich Metadata**: User IDs, session tracking, tags, and custom metadata support
- **Performance Monitoring**: Token usage, latency, and cost tracking
- **Batch Processing**: Efficient handling of multiple concurrent requests
- **Real-time Dashboard**: Live monitoring and analytics in Langfuse

## 🛠️ Installation

```
# Clone the repository
git clone <your-repo-url>
cd gaia-langfuse-demo

# Install dependencies
pip install -r requirements.txt
```

## 📋 Requirements

```bash
langfuse
openai
streamlit
```

## ⚙️ Configuration

1. **Gaia Node Credentials**:
   - API Key: Your Gaia Node authentication key (if you're using one of our public domains. Get your API key [here](https://docs.gaianet.ai/getting-started/authentication/). If you're using your own Gaia node, just use `gaia` as your API key.)
   - Base URL: Your Gaia Node endpoint URL (See how to launch your own [Gaia Node](https://docs.gaianet.ai/getting-started/quick-start/)) (Ex: https://your-node-id.gaia.domains/v1)

2. **Langfuse Credentials**:
   - Public Key: From your Langfuse project settings
   - Secret Key: From your Langfuse project settings

## 🎯 Usage

```bash
# Run the Streamlit application
streamlit run app.py
```

The application will be available at `http://localhost:8501`

## 🏗️ Architecture

```
Streamlit App → Langfuse OpenAI Wrapper → Gaia Node API → Langfuse Dashboard
```

## 🌟 Why This Integration Matters for AI Developers

### For AI Agent Development

#### 1. **Complete Visibility into Agent Operations**
```python
@observe()
def ai_agent_workflow(user_query: str):
    # Step 1: Understand user intent
    intent = client.chat.completions.create(
        name="intent-classification",
        model="Qwen3-4B-Q5_K_M",
        messages=[...],
        metadata={"step": "intent_analysis"}
    )
    
    # Step 2: Gather relevant information
    context = client.chat.completions.create(
        name="context-retrieval",
        model="Qwen3-4B-Q5_K_M", 
        messages=[...],
        metadata={"step": "context_gathering"}
    )
    
    # Step 3: Generate final response
    response = client.chat.completions.create(
        name="response-generation",
        model="Qwen3-4B-Q5_K_M",
        messages=[...],
        metadata={"step": "final_response"}
    )
    
    return response
```

**Benefits:**
- Trace complex multi-step agent workflows
- Identify bottlenecks in agent reasoning chains
- Monitor success rates for different agent steps
- Debug failed agent executions

#### 2. **Performance Optimization**
- Track token usage across different agent components
- Monitor latency for each processing step
- Identify expensive operations for optimization
- Compare performance across different models

### For AI Inference Pipelines

#### 1. **Production Monitoring**
```python
# Automatic monitoring for inference endpoints
response = client.chat.completions.create(
    model="Qwen3-4B-Q5_K_M",
    messages=[...],
    user_id="user_123",          # Track per-user usage
    session_id="session_456",    # Track conversation sessions
    tags=["production", "v1.2"], # Version tracking
    metadata={                   # Business context
        "feature": "customer_support",
        "priority": "high"
    }
)
```

**Benefits:**
- Real-time monitoring of production inference
- Usage analytics per customer/feature
- Performance degradation detection
- Cost allocation and optimization

#### 2. **Quality Assurance**
- Track input/output patterns
- Monitor for model drift or degradation
- Capture edge cases and failures
- Maintain quality metrics over time

## 🎨 Demo Features

### 1. Simple Chat Demo
- Basic Gaia Node API integration
- Automatic tracing and monitoring
- Token usage analytics

### 2. Nested Operations
- Complex workflows with multiple LLM calls
- Hierarchical tracing structure
- End-to-end workflow monitoring

### 3. Batch Processing
- Efficient processing of multiple requests
- Concurrent operation tracing
- Bulk operation analytics

### 4. Advanced Tracing
- User and session tracking
- Custom metadata and tags
- Rich contextual information

## 📊 Langfuse Dashboard Benefits

### 1. **Trace Explorer**
- View all Gaia Node API calls in one place
- Filter by model, user, session, or custom metadata
- Search through prompts and responses

### 2. **Performance Analytics**
- Monitor latency and token usage
- Track costs across different models
- Identify performance trends

### 3. **Quality Monitoring**
- Track success/failure rates
- Monitor response quality
- Detect anomalies and regressions

### 4. **Collaboration Features**
- Share traces with team members
- Annotate and comment on specific calls
- Collaborative debugging and optimization

## 🚀 Getting Started with Your Own Project

### Basic Integration
```python
from langfuse.openai import openai

# Initialize Gaia Node client
client = openai.OpenAI(
    base_url="https://your-gaia-node-id.gaia.domains/v1",
    api_key="your-gaia-api-key",
    default_headers={
        "HTTP-Referer": "your-app-url",
        "X-Title": "Your App Name",
    }
)

# Automatic tracing enabled!
response = client.chat.completions.create(
    model="Qwen3-4B-Q5_K_M",
    messages=[...],
    name="your-operation-name"
)
```

### Advanced Workflow Tracing
```python
from langfuse import observe

@observe()
def complex_agent_workflow(input_data):
    # Multiple Gaia Node calls automatically traced
    step1 = client.chat.completions.create(...)
    step2 = client.chat.completions.create(...)
    step3 = client.chat.completions.create(...)
    
    return final_result
```

## 📈 Use Cases

### 1. **Customer Support Agents**
- Monitor conversation quality
- Track resolution rates
- Optimize support workflows

### 2. **Content Generation Pipelines**
- Monitor content quality
- Track generation costs
- Optimize prompt engineering

### 3. **Data Processing Workflows**
- Monitor processing accuracy
- Track pipeline performance
- Debug complex transformations

### 4. **Research and Development**
- Experiment tracking
- Model comparison
- Performance bench-marking

## 📚 Resources

- [Langfuse Documentation](https://langfuse.com/docs)
- [Gaia Node Documentation](https://docs.gaianet.ai/?ref=langfuse)

*This code is provided "as is," without any warranties or guarantees of any kind. There is no assurance that it will be free from bugs, errors, or security vulnerabilities.*
