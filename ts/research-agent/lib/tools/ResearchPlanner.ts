import { ResearchPlan } from '../types';
import { streamText } from 'ai';
import { openai, GAIA_MODEL, systemPrompt } from '../ai/config';
import { z } from 'zod';

interface PlanStep {
  id: number;
  description: string;
  action: {
    type: 'search' | 'summarize';
    params: {
      query: string;
    };
  };
  dependencies?: number[];
}

export class ResearchPlanner {
  async createPlan(query: string): Promise<ResearchPlan> {
    // For simple queries, we can use a basic plan
    if (query.length < 10 || query.split(' ').length < 3) {
      return this.createBasicPlan(query);
    }
    
    // For more complex queries, generate a plan with AI
    try {
      const result = await streamText({
        model: openai(GAIA_MODEL),
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Create a research plan for this query: "${query}"`
          }
        ],
        tools: {
          createPlan: {
            description: 'Create a research plan with steps',
            parameters: z.object({
              steps: z.array(z.object({
                id: z.number(),
                description: z.string(),
                action: z.object({
                  type: z.enum(['search', 'summarize']),
                  params: z.object({
                    query: z.string()
                  })
                }),
                dependencies: z.array(z.number()).optional()
              }))
            }),
            execute: async ({ steps }: { steps: PlanStep[] }) => {
              // Add status to each step
              const stepsWithStatus = steps.map(step => ({
                ...step,
                status: 'pending' as const
              }));
              
              return {
                query,
                steps: stepsWithStatus
              };
            }
          }
        }
      });

      // Get the final result from the stream
      const stream = result.toDataStreamResponse();
      const reader = stream.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read stream');
      }

      let finalResult: ResearchPlan | null = null;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'tool_call' && parsed.tool === 'createPlan') {
                finalResult = parsed.result;
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }

      if (!finalResult) {
        throw new Error('Failed to generate research plan');
      }

      return finalResult;
    } catch (error) {
      console.error('Error generating research plan:', error);
      // Fall back to basic plan if AI plan generation fails
      return this.createBasicPlan(query);
    }
  }
  
  private createBasicPlan(query: string): ResearchPlan {
    return {
      query,
      steps: [
        {
          id: 1,
          description: "Search for information",
          status: 'pending',
          action: {
            type: "search",
            params: {
              query: query,
            },
          },
        },
        {
          id: 2,
          description: "Summarize findings",
          status: 'pending',
          dependencies: [1],
          action: {
            type: "summarize",
            params: {
              query: `Summarize the search results about: ${query}`,
            },
          },
        },
      ],
    };
  }
}