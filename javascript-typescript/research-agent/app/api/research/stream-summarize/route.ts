// app/api/research/execute/route.ts
import { WebSearchTool } from '@/lib/tools/WebSearchTool';
import { SummarizationTool } from '@/lib/tools/SummarizationTool';
import { ProcessedSearchResult } from '@/lib/types';
import { NextResponse } from 'next/server';
import { sessions } from '@/lib/store/sessions';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId || !sessions[sessionId]) {
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
      const searchTool = new WebSearchTool();
      const query = currentStep.action.params.query;
      
      if (!query) {
        throw new Error('Search query is required but was not provided');
      }
      
      const searchResults = await searchTool.search(query);
        
        if (!searchResults) {
          throw new Error('Search returned no results');
        }
        
        const processedResults = searchTool.processResults(searchResults);
        result = processedResults;
        
        // Store the artifact
        artifacts.push({
          taskId: currentStep.id,
          taskType: 'search',
          artifact: processedResults
        });
        break;
      }
      
      case 'summarize': {
        const summarizationTool = new SummarizationTool();
        const query = currentStep.action.params.query;
        
        if (!query) {
          throw new Error('Summarization query is required but was not provided');
        }
        
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
          throw new Error('No search results found for summarization');
        }
        
        const summary = await summarizationTool.summarize(query, searchResults);
        result = summary;
        
        // Store the artifact
        artifacts.push({
          taskId: currentStep.id,
          taskType: 'summarize',
          artifact: summary
        });
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