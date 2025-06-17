// npm install @langchain-anthropic
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI, OpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import dotenv from "dotenv";

dotenv.config();

import { z } from "zod";

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

const model = new ChatOpenAI({
  configuration: {
    apiKey: process.env.GAIANET_API_KEY,
    model: "Llama-3-Groq-8B-Tool",
    baseURL:
      "https://0x5cea2cf8e0e8307a3e8655cb3f4fd1065f4a3ab5.gaia.domains/v1",
  },
});

// const model = new ChatAnthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
//   model: "claude-3-7-sonnet-latest"
// });

const agent = createReactAgent({
  llm: model,
  tools: [search],
});

const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "You have the ability to call for search. Can you search for the weather in sf for today?",
    },
  ],
});

console.log(result);
