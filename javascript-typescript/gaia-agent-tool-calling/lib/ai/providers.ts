import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { groq } from '@ai-sdk/groq';
import { xai } from '@ai-sdk/xai';
import {createOpenAI} from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';

import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

const openai = createOpenAI({
  apiKey: "Gaia",
  baseURL: "https://0x00cfd37ffb149a55f031588da81110ab085fd9b6.gaia.domains/v1",
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

    


