import { HumanMessage } from "@langchain/core/messages";
import { graph } from "./graph.mts";

let streamResults = graph.stream(
  {
    messages: [
      new HumanMessage({
        content: "Give me reviews of the iPhone 16 pro max online.",
      }),
    ],
  },
  { recursionLimit: 100 }
);

for await (const output of await streamResults) {
  if (!output?.__end__) {
    console.log(output);
    console.log("----");
  }
}
