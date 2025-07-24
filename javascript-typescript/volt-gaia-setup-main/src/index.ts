import { VoltAgent, Agent } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { createOpenAI} from "@ai-sdk/openai";
import { comprehensiveWorkflow } from "./workflows";

const openai = createOpenAI({
  baseURL: "https://0xf8967cce76d3caef3014a106ad0dd20340a062ee.gaia.domains/v1",
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
