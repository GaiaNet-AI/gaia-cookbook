import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { tools } from "@/ai/tools";

// No need to explicitly import .env - Next.js automatically loads it

export async function POST(request: Request) {
  const { messages } = await request.json();

  // Use environment variables instead of hardcoded values
  const openai = createOpenAI({
    baseURL: process.env.NEXT_PUBLIC_GAIA_API_BASE_URL,
    apiKey: process.env.NEXT_PUBLIC_GAIA_API_KEY 
  });

  try {
    const result = streamText({
      model: openai("llama"),
      system: "you are a friendly assistant",
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
