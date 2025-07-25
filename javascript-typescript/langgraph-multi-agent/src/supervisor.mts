import { END, Annotation } from "@langchain/langgraph";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

const members = ["researcher", "chart_generator"] as const;

const systemPrompt =
  "You are a supervisor tasked with managing a conversation between the" +
  " following workers: {members}. Given the following user request," +
  " respond with the worker to act next. Each worker will perform a" +
  " task and respond with their results and status. When finished," +
  " respond with FINISH.";
const options = [END, ...members];

// Define the routing function
const routingTool = {
  name: "route",
  description: "Select the next role.",
  schema: z.object({
    next: z.enum([END, ...members]),
  }),
};

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  [
    "human",
    "Given the conversation above, who should act next?" +
      " Or should we FINISH? Select one of: {options}",
  ],
]);

const formattedPrompt = await prompt.partial({
  options: options.join(", "),
  members: members.join(", "),
});

const llm = new ChatOpenAI({
  model: "Qwen3-8B-Q5_K_M",
  configuration: {
    apiKey: process.env.GAIA_API_KEY,
    baseURL: process.env.GAIA_BASE_URL,
  },
});

const supervisorChain = formattedPrompt
  .pipe(
    llm.bindTools([routingTool], {
      tool_choice: "route",
    })
  )
  // select the first one
  .pipe((x) => x.tool_calls[0]?.args);

await supervisorChain.invoke({
  messages: [
    new HumanMessage({
      content: "write a report on birds.",
    }),
  ],
});

export { llm, routingTool, supervisorChain, members };
