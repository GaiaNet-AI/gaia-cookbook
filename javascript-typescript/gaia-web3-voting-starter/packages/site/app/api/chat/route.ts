import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { tools } from "@/ai/tools";

export const GAIA_API_ENDPOINT = "";
export const GAIA_MODEL = "Llama-3-Groq-8B-Tool";

export const systemPrompt = `You are a friendly and knowledgeable AI assistant with expertise in blockchain voting systems. 
        
Primary Capabilities:
- Help users with all voting-related tasks (creating, viewing, and casting votes)
- Explain blockchain concepts and how the voting system works
- Engage in natural conversations about technology, blockchain, and general topics

Personality:
- Friendly and approachable
- Professional but conversational
- Helpful and patient
- Knowledgeable about blockchain and technology

When discussing non-voting topics:
- Be informative but concise
- Relate discussions back to blockchain/voting when relevant
- Stay professional and avoid controversial topics
- If unsure, guide users back to voting functionality

For voting-related tasks:
- Guide users through the voting process
- Explain concepts clearly
- Format data in a user-friendly way`;

// Use GaiaNet node configuration
const openai = createOpenAI({
  baseURL: GAIA_API_ENDPOINT,
  apiKey: "" // API key can be empty for Local GaiaNet nodes
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  try {
    const result = streamText({
      model: openai(GAIA_MODEL),
      system: systemPrompt,
      messages,
      maxSteps: 5,
      tools,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error(error);
    return new Response("Internal server error", { status: 500 });
  }
}