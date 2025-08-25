
# Haystack with Gaia Node Example

This example demonstrates how to use Haystack with a Gaia Node to create an AI agent that can perform web searches and answer questions using current information.

## What is Haystack?

Haystack is an open-source framework by deepset for building production-ready LLM applications, including retrieval-augmented generation (RAG) pipelines, agents, and question-answering systems. It provides:

- **Components**: Modular building blocks for LLM applications
- **Pipelines**: Ways to connect components together
- **Tools**: Capabilities that agents can use (like web search)
- **Agents**: AI systems that can use tools to accomplish tasks

## What is Gaia Node?

Gaia Node is a self-hosted inference server that allows you to run open-source LLMs locally or on your own infrastructure. It provides:

- **API compatibility** with OpenAI's API format
- **Multiple model support** for various open-source LLMs
- **Self-hosted deployment** for data privacy and control
- **Cost efficiency** by avoiding per-token pricing

## How This Example Works

This example creates an AI agent that:

1. **Uses a Gaia Node** as its LLM backend (instead of OpenAI)
2. **Has web search capability** through the SerperDev search API
3. **Answers questions** about current information like weather, news, and facts

When you ask a question like "How is the weather in Berlin?", the agent:

1. Uses the web search tool to find current information
2. Processes the search results through the Gaia Node LLM
3. Returns a summarized, helpful response based on the latest data

## Setup Instructions

1. **Install dependencies**:
   ```bash
   pip install haystack-ai python-dotenv
   ```

2. **Set up environment variables**:
   Create a `.env` file with your credentials:
   ```
   GAIA_API_KEY=your_gaia_node_api_key
   GAIA_NODE_URL=https://your-gaia-node-instance.com
   GAIA_MODEL_NAME=llama3b
   SERPERDEV_API_KEY=your_serperdev_api_key
   ```

3. **Run the example**:
   ```bash
   python main.py
   ```

## Key Components

- **Gaia Node Connection**: Uses OpenAIChatGenerator configured to point to your Gaia Node instance
- **Web Search Tool**: Uses SerperDevWebSearch to find current information
- **Intelligent Agent**: Combines the LLM with tools to answer questions effectively

This demonstrates how you can build powerful AI applications using open-source models through Gaia Node while maintaining data privacy and control over your infrastructure.