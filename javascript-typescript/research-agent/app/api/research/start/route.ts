// app/api/research/start/route.ts
import { ResearchPlanner } from '@/lib/tools/ResearchPlanner';
import { ResearchSession } from '@/lib/types';
import { NextResponse } from 'next/server';
import { generateSessionId } from '@/lib/types/utils';
import { sessions } from '@/lib/store/sessions';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    const planner = new ResearchPlanner();
    const plan = await planner.createPlan(query);
    
    const sessionId = generateSessionId();
    const session: ResearchSession = {
      id: sessionId,
      plan,
      currentStepIndex: 0,
      artifacts: [],
      createdAt: new Date().toISOString()
    };
    
    // Store the session
    sessions[sessionId] = session;
    console.log('Created new session:', sessionId);
    console.log('Current sessions:', Object.keys(sessions));
    
    return NextResponse.json({ 
      sessionId, 
      plan 
    });
  } catch (error) {
    console.error('Error creating research plan:', error);
    return NextResponse.json({ error: 'Failed to create research plan' }, { status: 500 });
  }
}