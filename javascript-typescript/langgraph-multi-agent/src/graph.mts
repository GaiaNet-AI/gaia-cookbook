import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.mts";
import { chartGenNode, researcherNode } from "./agents.mts";
import { members, supervisorChain } from "./supervisor.mts";

// 1. Create the graph
const workflow = new StateGraph(AgentState)
  // 2. Add the nodes; these will do the work
  .addNode("researcher", researcherNode)
  .addNode("chart_generator", chartGenNode)
  .addNode("supervisor", supervisorChain);
// 3. Define the edges. We will define both regular and conditional ones
// After a worker completes, report to supervisor
members.forEach((member) => {
  workflow.addEdge(member, "supervisor");
});

workflow.addConditionalEdges(
  "supervisor",
  (x: typeof AgentState.State) => x.next
);

workflow.addEdge(START, "supervisor");

const graph = workflow.compile();

export { graph };
