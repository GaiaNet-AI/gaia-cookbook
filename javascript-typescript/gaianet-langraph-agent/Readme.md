# LangChain ReAct Agent Demo

This repository demonstrates how to create a ReAct agent (Reasoning and Acting) using LangChain. The agent can use tools to answer questions, such as fetching weather information.

## Features

- Creates a ReAct agent with LangChain
- Implements a custom search tool for weather information
- Uses Llama 3 models via Gaianet
- Uses environment variables for API keys

## Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn
- API keys for your chosen LLM provider

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your API keys:

```
GAIANET_API_KEY=your_gaia_api_key
```

## Usage

```javascript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define your tools
const myTool = tool(
  async ({ query }) => {
    // Tool implementation
    return "Result of the tool";
  },
  {
    name: "toolName",
    description: "Description of what this tool does",
    schema: z.object({
      query: z.string().describe("Description of the query parameter"),
    }),
  }
);

// Configure your LLM
const model = new ChatOpenAI({
  // Configuration options
});

// Create the agent
const agent = createReactAgent({
  llm: model,
  tools: [myTool],
});

// Invoke the agent
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Your query here",
    },
  ],
});

console.log(result);
```

## Example

The repository includes an example that creates a weather search tool. When queried about San Francisco's weather, it returns "60 degrees and foggy". For all other locations, it returns "90 degrees and sunny".

```javascript
// Define a simple search tool
const search = tool(
  async ({ query }) => {
    if (
      query.toLowerCase().includes("sf") ||
      query.toLowerCase().includes("san francisco")
    ) {
      return "It's 60 degrees and foggy.";
    }
    return "It's 90 degrees and sunny.";
  },
  {
    name: "search",
    description: "Call to surf the web.",
    schema: z.object({
      query: z.string().describe("The query to use in your search."),
    }),
  }
);

// Create and invoke the agent
const agent = createReactAgent({
  llm: model,
  tools: [search],
});

const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Can you search for the weather in SF for today?",
    },
  ],
});
```

## LLM Configuration

This project uses Gaianet to access Llama 3 models. You'll need a Gaianet API key to run this code.

```javascript
const model = new ChatOpenAI({
  configuration: {
    apiKey: process.env.GAIANET_API_KEY,
    model: "Llama-3-Groq-8B-Tool",
    baseURL: "https://0x5cea2cf8e0e8307a3e8655cb3f4fd1065f4a3ab5.gaia.domains/v1",
  },
});
```

The code includes a commented-out configuration for Anthropic Claude that you can use as an alternative:

```javascript
const model = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-3-7-sonnet-latest"
});
```

## License

[MIT](LICENSE)