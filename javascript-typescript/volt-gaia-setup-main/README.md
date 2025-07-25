# gaia-volt

An [VoltAgent](https://github.com/vercel/voltagent) application.

## Getting Started

### Prerequisites

- Node.js (v20 or newer)
- npm, yarn, or pnpm

### Installation

1. Clone this repository
2. Install dependencies

```bash
npm install
# or
yarn
# or
pnpm install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Features

This project uses VoltAgent, a framework for building AI agents with the following capabilities:

- **Core** - The foundation for building and running AI agents
- **Vercel AI Provider** - Integration with Vercel AI SDK for LLM access
- **Gaia model setup** - https://docs.gaianet.ai/getting-started/quick-start/
- **Custom Tools** - Add your own capabilities for your agents
- **Comprehensive Workflow** - Multi-step, AI-powered workflow for text analysis

## Gaia setup

This project uses the Gaia OpenAI-compatible API for LLM access. Both the agent and the workflow are configured to use this model endpoint. You must provide the correct base URL and API key as shown below:

```ts
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  baseURL: "https://domain-url/v1",
  apiKey: "gaia-api-key", // Replace with your Gaia API key
});
```

This setup is required in both `src/index.ts` (for the agent) and `src/workflows/index.ts` (for the workflow's AI steps). For more details, see the [Gaia quick start guide](https://docs.gaianet.ai/getting-started/quick-start/).

## Project Structure

```
.
├── src/
│   ├── index.ts            # Main application entry point with agent and workflow registration
│   └── workflows/
│       └── index.ts        # Defines the comprehensiveWorkflow
├── .voltagent/             # Auto-generated folder for agent memory
├── package.json
├── tsconfig.json
└── README.md
```

## Workflows

### comprehensiveWorkflow

This workflow demonstrates a full-featured, multi-step process for analyzing and processing text. It is registered with the VoltAgent and can be triggered as part of the agent's capabilities.

**Steps in the workflow:**

1. **Preprocess Text:** Cleans up the input text (trims and lowercases).
2. **Sentiment Analysis:** Uses an AI agent to determine if the sentiment is positive, negative, or neutral.
3. **Parallel Calculations:** Calculates word count and character count in parallel.
4. **Race Condition:** Simulates two services racing to respond, and records the fastest.
5. **Conditional Warning:** If the sentiment is negative, adds a warning to the output.

**Input:**

```json
{
  "text": "string"
}
```

**Output:**

```json
{
  "processedText": "string",
  "sentiment": "positive | negative | neutral",
  "calculations": [
    { "operation": "word_count", "value": number },
    { "operation": "char_count", "value": number }
  ],
  "raceWinner": "fast-service | slow-service",
  "warning": "Negative sentiment detected!" // optional
}
```

## How It Works

- The workflow is registered in `src/index.ts` and made available to the VoltAgent instance.
- When the agent receives a request that triggers this workflow, it processes the input text through all the steps above and returns the structured output.

## License

MIT
