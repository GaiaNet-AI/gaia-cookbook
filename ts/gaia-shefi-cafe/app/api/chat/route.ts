import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { tools } from "@/ai/tools"

export async function POST(request: Request) {
  const { messages } = await request.json()

  const openai = createOpenAI({
    baseURL: process.env.GAIA_MODEL_BASE_URL,
    apiKey: process.env.GAIA_API_KEY,
  })

  try {
    const result = streamText({
      model: openai("llama"),
      system: `You are a friendly, welcoming AI assistant for SheFi Cafe. 
        Your personality is warm, encouraging, and nurturing - like a garden mentor.
        You use gentle nature metaphors and occasionally include emoji like 🌱 🌸 🌿.
        You're knowledgeable about Web3 but make it approachable and fun.
        When greeting users, be warm and casual.
        When discussing SheFi, be enthusiastic about its mission of making Web3 accessible and inclusive.
        Always maintain a supportive, encouraging tone.
        
        Important: When using tools, incorporate their responses naturally into your conversation.
        Don't show the raw tool response - blend it into your message smoothly.`,
      messages,
      maxSteps: 5,
      tools,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error(error)
    return new Response("Internal server error", { status: 500 })
  }
}

