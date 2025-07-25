import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { groq } from '@ai-sdk/groq';
import { xai } from '@ai-sdk/xai';
import {createOpenAI} from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';


const openai = createOpenAI({
  apiKey: "Gaia",
  baseURL: process.env.GAIA_BASE_URL,
})
  
export const myProvider =
  customProvider({
    languageModels: {
      'chat-model': openai('Llama-3-Groq-8B-Tool'),
      'chat-model-reasoning': wrapLanguageModel({
        model: openai('Llama-3-Groq-8B-Tool'),
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      }),
      'title-model': openai('Llama-3-Groq-8B-Tool'),
      'artifact-model': openai('	Llama-3-Groq-8B-Tool'),
    },
  });

    


