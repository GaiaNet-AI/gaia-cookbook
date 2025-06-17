// lib/types/index.ts
export interface ResearchStep {
    id: number;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    action: {
      type: 'search' | 'summarize' | 'fetch_webpage' | 'fetch_paper' | 'fetch_github';
      params: {
        query?: string;
        url?: string;
        paperId?: string;
        repoUrl?: string;
        artifactIds?: string[];
        focusQuestion?: string;
        [key: string]: unknown;  // For any additional properties
      };
    };
    dependencies?: number[];
  }
  
  export interface ResearchPlan {
    query: string;
    steps: ResearchStep[];
  }
  
  export interface SearchResultItem {
    title: string;
    url: string;
    description: string;
    profile?: {
      name: string;
      long_name?: string;
      img?: string;
    };
    age?: string;
    extra_snippets?: string[];
    page_age?: string;
    thumbnail?: {
      src: string;
    };
  }
  
  export interface ProcessedSearchResult {
    title: string;
    source: string;
    url: string;
    date: string;
    summary: string;
    keyPoints: string[];
    image?: string;
  }
  
export interface ResearchArtifact {
  taskId: number;
  taskType: string;
  artifact: string | ProcessedSearchResult[] | Record<string, unknown>; // More specific than any
}
  
  export interface ResearchSession {
    id: string;
    plan: ResearchPlan;
    currentStepIndex: number;
    artifacts: ResearchArtifact[];
    createdAt: string;
  }