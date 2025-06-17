import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const GAIA_API_ENDPOINT = "https://llama70b.gaia.domains/v1";
const GAIA_MODEL = "llama70b";

const systemPrompt = `You are a helpful chess assistant that provides commentary and strategic thinking for a chess game.
You should respond in a conversational, natural way as if you're a chess player explaining your thoughts.
Keep responses brief (1-3 sentences) and focused on the chess position.

When analyzing a position or suggesting a move:
- Consider piece development, center control, king safety, and material balance
- Explain your reasoning clearly but concisely
- Use standard chess notation when referring to moves
- Maintain the persona of a thoughtful chess player

Avoid technical jargon unless necessary and focus on making your commentary engaging and educational.`;

// Create OpenAI client with Gaia configuration
const openai = createOpenAI({
  baseURL: GAIA_API_ENDPOINT,
  apiKey: process.env.GAIA_API_KEY || ""
});

export async function POST(request: Request) {
  try {
    console.log('API Key:', process.env.GAIA_API_KEY ? 'Present' : 'Missing');
    console.log('API Endpoint:', GAIA_API_ENDPOINT);
    
    const { messages, prompt } = await request.json();
    console.log('Received request:', { messages, prompt });

    // Use either messages array or single prompt
    const messageContent = messages?.[0]?.content || prompt;
    if (!messageContent) {
      throw new Error('No message content provided');
    }

    console.log('Sending to AI:', messageContent);

    // Use streamText from the AI SDK with Gaia configuration
    const result = await streamText({
      model: openai(GAIA_MODEL),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: messageContent }
      ],
      maxSteps: 5
    });

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Detailed error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
