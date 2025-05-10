import OpenAI from 'openai';

if (!process.env.GAIA_API_KEY) {
  throw new Error('Missing GAIA_API_KEY in .env.local');
}

if (!process.env.GAIA_API_ENDPOINT) {
    throw new Error('Missing GAIA_API_ENDPOINT in .env.local');
}

if (!process.env.GAIA_API_MODEL) {
    throw new Error('Missing GAIA_API_MODEL in .env.local');
}

const GAIA_API_ENDPOINT = process.env.GAIA_API_ENDPOINT || 'https://llama70b.gaia.domains/v1';
const GAIA_API_MODEL = process.env.GAIA_API_MODEL || 'llama70b'; // Default to a common model

const gaiaClient = new OpenAI({
  apiKey: process.env.GAIA_API_KEY,
  baseURL: GAIA_API_ENDPOINT,
});

export type StoryLength = 'short' | 'medium' | 'long';
export type StoryTone = 'any' | 'humorous' | 'serious' | 'suspenseful' | 'whimsical' | 'dark';

// New, more creative input parameters
export interface CreativeStoryParams {
  coreIdea: string; // Main premise or what-if scenario
  genre: string;
  length: StoryLength;
  protagonist?: string; // Brief description of the main character
  keyConflict?: string; // The central problem or challenge
  worldVibe?: string; // e.g., "Cyberpunk megacity", "Enchanted ancient forest"
  tone?: StoryTone;
  // Optional: You could add more fields like "Antagonist", "Key Plot Twist Idea", etc.
}

export async function generateStoryWithGaia(params: CreativeStoryParams): Promise<string> {
  const { coreIdea, genre, length, protagonist, keyConflict, worldVibe, tone } = params;

  const lengthWords = {
    short: 300,
    medium: 800,
    long: 1500,
  };

  // Construct a more narrative prompt
  let prompt = `You are a master storyteller. Based on the following elements, write a ${length} story in the ${genre} genre.
The story should be approximately ${lengthWords[length]} words and have a clear beginning, middle, and end.

Core Idea/Premise: ${coreIdea}
`;

  if (protagonist) {
    prompt += `\nMain Character (Protagonist): ${protagonist}`;
  }
  if (keyConflict) {
    prompt += `\nKey Conflict/Challenge: ${keyConflict}`;
  }
  if (worldVibe) {
    prompt += `\nSetting's Atmosphere/Vibe: ${worldVibe}`;
  }
  if (tone && tone !== 'any') {
    prompt += `\nDesired Tone: ${tone}`;
  }

  prompt += `\n\nFocus on making the story engaging, well-structured, and imaginative. Bring the characters and world to life.
Begin the story now:\n`;

  console.log("Sending creative prompt to Gaia API:", prompt);

  try {
    const completion = await gaiaClient.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: `${process.env.GAIA_API_MODEL}`,
      temperature: 0.75, // Slightly higher for more creativity
      max_tokens: lengthWords[length] + 250, // Buffer for prompt and structure
    });

    const storyContent = completion.choices[0]?.message?.content?.trim() || '';
    console.log("Received story from Gaia API (first 100 chars):", storyContent.substring(0,100));
    return storyContent;

  } catch (error: any) {
    if (error instanceof OpenAI.APIError) {
      console.error("Gaia API Error:", error.status, error.name, error.headers, error.message);
      throw new Error(`Failed to generate story: ${error.message} (Status: ${error.status})`);
    } else {
      console.error("Error calling Gaia API (Non-APIError):", error.message || error);
      throw new Error(`Failed to generate story: ${error.message || 'An unknown error occurred'}`);
    }
  }
}