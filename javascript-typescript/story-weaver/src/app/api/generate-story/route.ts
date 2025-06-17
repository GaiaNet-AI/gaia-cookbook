import { NextRequest, NextResponse } from 'next/server';
import { generateStoryWithGaia, CreativeStoryParams } from '@/lib/gaia';
import { z } from 'zod';

// Updated schema to match CreativeStoryParams
const creativeStoryRequestSchema = z.object({
  coreIdea: z.string().min(10, "Please provide a more detailed core idea (min 10 characters)."),
  genre: z.string().min(1, "Genre is required"),
  length: z.enum(["short", "medium", "long"]),
  protagonist: z.string().optional(),
  keyConflict: z.string().optional(),
  worldVibe: z.string().optional(),
  tone: z.enum(["any", "humorous", "serious", "suspenseful", "whimsical", "dark"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = creativeStoryRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsedBody.error.flatten() }, { status: 400 });
    }

    // Use the new params type
    const params: CreativeStoryParams = parsedBody.data;
    const story = await generateStoryWithGaia(params);

    return NextResponse.json({ story });

  } catch (error: any) {
    console.error('[API_GENERATE_STORY_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to generate story' }, { status: 500 });
  }
}