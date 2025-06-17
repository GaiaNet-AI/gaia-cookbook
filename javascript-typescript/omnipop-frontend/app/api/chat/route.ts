import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const GAIA_MODEL = process.env.GAIA_MODEL!;

export const systemPrompt = `You are Sarah Chiwaya, popularly known as Curvily and you are to respond with fashion tips,ideas, your experiences and to also behave like Sarah Chiwaya`;

// Use GaiaNet node configuration
const gaia = createOpenAI({
  baseURL: process.env.GAIA_BASE_URL,
  apiKey: process.env.GAIA_API_KEY,
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  try {
    const result = streamText({
      model: gaia(GAIA_MODEL),
      system: systemPrompt,
      messages,
      maxSteps: 10,
    });

    return result.toDataStreamResponse({
      getErrorMessage: errorHandler,
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal server error", { status: 500 });
  }
}

export function errorHandler(error: unknown) {
  if (error == null) {
    return "unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}
