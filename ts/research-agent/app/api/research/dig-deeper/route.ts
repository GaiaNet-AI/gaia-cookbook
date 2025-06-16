// app/api/research/dig-deeper/route.ts
import { NextResponse } from 'next/server';
import { sessions } from '@/lib/store/sessions';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { ResearchStep } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId || !sessions[sessionId]) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }
    
    const session = sessions[sessionId];
    const { plan, artifacts } = session;
    
    // Generate additional research steps
    const { text: additionalStepsText } = await generateText({
      model: openai('gpt-4'),
      messages: [
        {
          role: "system",
          content: `You are a Research Planning Agent tasked with digging deeper into a topic.
          Based on the initial research results, identify gaps or areas that need more investigation.
          Create 2-3 additional research steps to explore the topic in more depth.
          
          For each step, provide:
          - id (number) - should continue from the last step ID in the current plan
          - description (string) - what this step will investigate
          - action: { type: string, params: object } - how to execute this step
          - dependencies (array of step IDs, optional) - which previous steps this depends on
          
          Available action types:
          - search: Search the web for specific information
          - fetch_webpage: Extract content from a specific URL
          - fetch_paper: Access academic paper information
          - fetch_github: Explore a GitHub repository
          - summarize: Summarize findings from previous steps
          
          Format your response as a JSON array of steps.`
        },
        {
          role: "user",
          content: `The original query was: "${plan.query}"
          
          Current research plan:
          ${JSON.stringify(plan.steps)}
          
          Research artifacts collected so far:
          ${JSON.stringify(artifacts)}
          
          What 2-3 additional research steps would provide deeper insights?`
        }
      ]
    });
    
    let additionalSteps: ResearchStep[] = [];
    
    try {
      additionalSteps = JSON.parse(additionalStepsText);
    } catch {
      // Try to extract JSON array from the text using regex if direct parsing fails
      const jsonMatch = additionalStepsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        additionalSteps = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse additional steps');
      }
    }
    
    // Add status to each step
    additionalSteps = additionalSteps.map(step => ({
      ...step,
      status: 'pending'
    }));
    
    // Add the steps to the session
    session.plan.steps = [...session.plan.steps, ...additionalSteps];
    
    return NextResponse.json({
      additionalSteps
    });
  } catch (error) {
    console.error('Error generating additional research steps:', error);
    return NextResponse.json({ error: 'Failed to generate additional research steps' }, { status: 500 });
  }
}