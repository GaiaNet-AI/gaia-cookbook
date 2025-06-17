import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const NoteProcessingSchema = z.object({
  category: z.enum([
    "Content Creation",
    "Health & Wellness",
    "Work & Career",
    "Learning & Education",
    "Shopping & Errands",
    "Finance",
    "General",
  ]),
  priority: z.enum(["low", "medium", "high"]),
  deadline: z.string().nullable().describe("ISO date string if deadline detected, null otherwise"),
  deadlinePhrase: z.string().nullable().describe("The natural language phrase that indicated the deadline"),
  tags: z.array(z.string()).describe("Relevant tags for this note (max 3)"),
  enhancedContent: z
    .string()
    .describe("Cleaned up version of the original content, keeping the same meaning but more organized"),
  reasoning: z.string().describe("Brief explanation of categorization and priority decisions"),
})

export async function POST(request: Request) {
  try {
    const { content } = await request.json()

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: NoteProcessingSchema,
      prompt: `
        Analyze this note and extract structured information:
        "${content}"
        
        Instructions:
        1. Categorize based on the main intent/topic
        2. Set priority based on urgency indicators (high: urgent/ASAP, medium: specific deadlines, low: general tasks)
        3. Extract any deadline from natural language (today, tomorrow, next week, by Friday, etc.)
        4. Generate 1-3 relevant tags
        5. Clean up the content while preserving meaning
        6. Provide brief reasoning for your decisions
        
        Current date context: ${new Date().toISOString()}
      `,
    })

    return Response.json(result.object)
  } catch (error) {
    console.error("AI processing failed:", error)
    return Response.json({ error: "Failed to process note" }, { status: 500 })
  }
}
