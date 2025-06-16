// app/api/research/execute/route.ts
import { WebSearchTool } from '@/lib/tools/WebSearchTool';
import { SummarizationTool } from '@/lib/tools/SummarizationTool';
import { ProcessedSearchResult } from '@/lib/types';
import { NextResponse } from 'next/server';
import { sessions } from '@/lib/store/sessions';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    console.log('Executing step for session:', sessionId);
    console.log('Available sessions:', Object.keys(sessions));
    
    if (!sessions[sessionId]) {
      console.error('Session not found:', sessionId);
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }
    
    const session = sessions[sessionId];
    const { plan, currentStepIndex, artifacts } = session;
    
    if (currentStepIndex >= plan.steps.length) {
      return NextResponse.json({ error: 'Research plan complete', isComplete: true }, { status: 200 });
    }
    
    const currentStep = plan.steps[currentStepIndex];
    currentStep.status = 'in-progress';
    
    // Execute the appropriate action based on the step type
    let result: ProcessedSearchResult[] | string;
    
    switch (currentStep.action.type) {
      case 'search': {
        try {
          const searchTool = new WebSearchTool();
          const query = currentStep.action.params.query;
          
          if (!query) {
            throw new Error('Search query is required but was not provided');
          }
          
          console.log('Executing search for query:', query);
          
          const searchResults = await searchTool.search(query);
          console.log('Search results:', searchResults);
          
          const processedResults = searchTool.processResults(searchResults);
          console.log('Processed search results:', processedResults);
          
          result = processedResults;
          
          // Store the artifact
          artifacts.push({
            taskId: currentStep.id,
            taskType: 'search',
            artifact: processedResults
          });
        } catch (error) {
          console.error('Error in search step:', error);
          throw new Error(`Search step failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        break;
      }
      
      case 'summarize': {
        try {
          const summarizationTool = new SummarizationTool();
          const query = currentStep.action.params.query;
          
          if (!query) {
            throw new Error('Summarization query is required but was not provided');
          }
          
          console.log('Executing summarize for query:', query);
          
          // Find the search results from dependencies
          let searchResults: ProcessedSearchResult[] = [];
          
          if (currentStep.dependencies) {
            for (const depId of currentStep.dependencies) {
              const depArtifact = artifacts.find(a => a.taskId === depId);
              if (depArtifact && depArtifact.taskType === 'search') {
                searchResults = depArtifact.artifact as ProcessedSearchResult[];
              }
            }
          }
          
          if (searchResults.length === 0) {
            console.error('No search results found for summarization');
            throw new Error('No search results found for summarization');
          }
          
          console.log('Found search results for summarization:', searchResults);
          const summary = await summarizationTool.summarize(query, searchResults);
          console.log('Generated summary:', summary);
          
          result = summary;
          
          // Store the artifact
          artifacts.push({
            taskId: currentStep.id,
            taskType: 'summarize',
            artifact: summary
          });
        } catch (error) {
          console.error('Error in summarize step:', error);
          throw new Error(`Summarize step failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        break;
      }
      
      // Implement other action types here (fetch_webpage, fetch_paper, fetch_github)
      
      default:
        throw new Error(`Unsupported action type: ${currentStep.action.type}`);
    }
    
    // Update step status
    currentStep.status = 'completed';
    
    // Move to the next step
    session.currentStepIndex++;
    
    return NextResponse.json({
      result,
      stepId: currentStep.id,
      isComplete: session.currentStepIndex >= plan.steps.length
    });
  } catch (error) {
    console.error('Error executing research step:', error);
    return NextResponse.json({ 
      error: 'Failed to execute research step',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}