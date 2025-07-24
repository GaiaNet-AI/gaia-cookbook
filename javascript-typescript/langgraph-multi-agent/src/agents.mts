import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { chartTool, tavilyTool } from "./tools.mts";
import { llm } from "./supervisor.mts";
import { AgentState } from "./state.mts";

// Recall llm was defined as ChatOpenAI above
// It could be any other language model
const researcherAgent = createReactAgent({
  llm,
  tools: [tavilyTool],
  stateModifier: new SystemMessage(
    "You are a web researcher. You may use the Tavily search engine to search the web for" +
      " important information, so the Chart Generator in your team can make useful plots."
  ),
});

const researcherNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig
) => {
  const result = await researcherAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage.content, name: "Researcher" }),
    ],
  };
};

const chartGenAgent = createReactAgent({
  llm,
  tools: [chartTool],
  stateModifier: new SystemMessage(
    "You excel at generating bar charts. Use the researcher's information to generate the charts."
  ),
});

const chartGenNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig
) => {
  const result = await chartGenAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({
        content: lastMessage.content,
        name: "ChartGenerator",
      }),
    ],
  };
};

export {researcherNode, chartGenNode}