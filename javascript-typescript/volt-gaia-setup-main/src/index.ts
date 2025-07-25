import { VoltAgent, Agent } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { createOpenAI} from "@ai-sdk/openai";
import { comprehensiveWorkflow } from "./workflows";

const openai = createOpenAI({
  baseURL: process.env.GAIA_BASE_URL // should be a string,
  apiKey: "gaia-api-key",
});

const agent = new Agent({
  name: "gaia-volt",
  instructions:
    "A helpful assistant that answers questions without using tools",
  llm: new VercelAIProvider(),
  model: openai("llama-3.2-1b"),
  tools: [],
});

new VoltAgent({
  agents: {
    agent,
  },
  workflows: {
    comprehensiveWorkflow,
  },
});
