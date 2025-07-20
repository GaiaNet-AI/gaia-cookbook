# 🧠 Gaia + Pydantic AI Agent Examples

This example is part of our AI Agent Cookbook and demonstrates how to use a local Gaia node (OpenAI-compatible) as the backend for structured AI agents powered by the Pydantic framework.

![chat responses from basic and tools](example-response.png)

## 🔍 What is Pydantic?

Pydantic is a Python library for data validation and settings management using Python type annotations. It's particularly useful when:

- You want type-safe models for inputs/outputs.
- You want clean JSON serialization.
- You're working with APIs (like OpenAI or Gaia) that return structured data.

## 🚀 What This Example Shows

✅ **1. `basic.py` – Simple Chat Inference with Gaia**
- Uses Pydantic to define OpenAI-style chat schema (model, messages, temperature).
- Supports system and user messages.
- Sends a prompt to a locally running Gaia node.
- Displays a terminal spinner animation while waiting for response.

✅ **2. `tools.py` – Tool (Function) Calling with Gaia**
- Demonstrates OpenAI-style function calling.
- Defines a sample `get_weather(location)` tool with a Pydantic schema.
- Sends tool schema to Gaia; Gaia chooses to invoke it.
- Simulates the tool's return and feeds it back into the model for final reasoning.

## 📦 Project Setup

### 🔧 Requirements

Install dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file:
```env
GAIA_API_BASE=http://localhost:8000/v1
GAIA_MODEL=gpt-4  # or whatever model name your Gaia node supports
```

### 🧪 Running the Examples

#### 🔹 Basic Chat
```bash
python basic.py
```
You should see something like:
```
Thinking... |/-\Done!
AI: Gravity is the force that pulls objects toward each other...
```

#### 🔹 Tool Calling
```bash
python tools.py
```
Output:
```bash
Calling Gaia... |/-\Done!
Waiting for AI response... |/-\Done!
AI: The weather in Tokyo is currently sunny and 27°C.
```

## 🧠 Why This Matters for AI Agent Devs

This example is a template for building your own agents with:

✅ Local inference using your own models via Gaia.
✅ Structured input/output using Pydantic.
✅ Full compatibility with OpenAI tool/function-calling workflows.
✅ Custom logic for executing tools and chaining them back into the agent loop.

**Perfect for:**
- Fast prototyping.
- Local-first AI dev.
- Open-source agent runtime integrations.

## 📁 Files Overview

| File               | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `basic.py`         | Basic system+user prompt chat with Gaia + Pydantic    |
| `tools.py`         | Tool/function-calling example with `get_weather()`    |
| `spinner.py`       | Simple terminal spinner while waiting for API         |
| `.env`             | Gaia node URL and model name config                   |
| `requirements.txt` | Python deps (requests, pydantic, dotenv)              |

## ✅ Next Steps

- Add more tools (functions).
- Integrate with FastAPI or CLI agent frameworks.
- Replace simulated tool logic with real APIs (e.g., weather, search).
- Extend with memory or multi-agent orchestration.