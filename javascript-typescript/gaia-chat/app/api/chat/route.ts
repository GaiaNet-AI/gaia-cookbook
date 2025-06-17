import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export const maxDuration = 30

// Model configurations for your Gaia domains
const getModelProvider = (modelId: string, apiKey: string) => {
  const modelConfigs = {
    metamask: "https://metamask.gaia.domains/v1",
    base: "https://base.gaia.domains/v1",
    polygon: "https://polygon.gaia.domains/v1",
    scroll: "https://scroll.gaia.domains/v1",
    zksync: "https://zksync.gaia.domains/v1",
  }

  const baseURL = modelConfigs[modelId as keyof typeof modelConfigs]

  if (baseURL) {
    const provider = createOpenAI({
      baseURL,
      apiKey,
    })
    return provider("llama")
  }

  // Fallback to OpenAI if model not found
  const openai = createOpenAI({ apiKey }) //using GAIA API KEY
  return openai("llama")
}

export async function POST(req: Request) {
  try {
    const { messages, modelId } = await req.json()

    console.log("Received request:", { modelId, messagesCount: messages?.length })

    const apiKey = process.env.GAIA_API_KEY

    if (!apiKey) {
      console.error("API key not configured")
      return new Response("API key not configured", { status: 500 })
    }

    console.log("Using model:", modelId)
    const model = getModelProvider(modelId || "metamask", apiKey)

    const result = streamText({
      model,
      messages,
      temperature: 0.7,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(`Internal server error: ${error.message}`, { status: 500 })
  }
}
