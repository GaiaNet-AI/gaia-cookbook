import { SearchResultItem, ProcessedSearchResult } from '../types';

export class WebSearchTool {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.BRAVE_API_KEY || '';
  }
  
  async search(query: string, params: Record<string, string> = {}): Promise<SearchResultItem[]> {
    try {
      if (!this.apiKey) {
        console.warn('BRAVE_API_KEY not set, using fallback search results');
        return this.getFallbackResults(query);
      }

      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.search = new URLSearchParams({ q: query, ...params }).toString();
      
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey,
        },
      });
      
      if (!response.ok) {
        console.error(`Brave Search API error: ${response.status}`);
        return this.getFallbackResults(query);
      }
      
      const data = await response.json();
      return data.web?.results || this.getFallbackResults(query);
    } catch (error) {
      console.error('Error in search method:', error);
      return this.getFallbackResults(query);
    }
  }
  
  private getFallbackResults(query: string): SearchResultItem[] {
    // Return a basic set of results for testing/development
    return [
      {
        title: `Search results for: ${query}`,
        description: `This is a fallback result for the query: ${query}. Please set up the BRAVE_API_KEY environment variable for real search results.`,
        url: 'https://example.com',
        page_age: new Date().toISOString(),
        profile: { name: 'Example Source' }
      }
    ];
  }
  
  processResults(searchResults: SearchResultItem[]): ProcessedSearchResult[] {
    if (!searchResults || searchResults.length === 0) {
      return this.getFallbackResults('').map(result => ({
        title: result.title,
        source: result.profile?.name || 'Unknown Source',
        url: result.url,
        date: new Date().toISOString().split('T')[0],
        summary: result.description,
        keyPoints: [],
        image: ''
      }));
    }
    
    // Deduplicate results by URL
    const uniqueResults = [...new Map(searchResults.map(item => [item.url, item])).values()];
    
    return uniqueResults.map(result => {
      // Extract and format date
      const dateStr = result.page_age || result.age || new Date().toISOString();
      let dateObj: Date;
      
      try {
        dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) {
          dateObj = new Date();
        }
      } catch {
        dateObj = new Date();
      }
      
      return {
        title: result.title,
        source: result.profile?.name || 'Unknown Source',
        url: result.url,
        date: dateObj.toISOString().split('T')[0],
        summary: result.description,
        keyPoints: result.extra_snippets?.slice(0, 2) || [],
        image: result.thumbnail?.src || ''
      };
    }).sort((a, b) => {
      // Sort by date, newest first
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }).slice(0, 10); // Limit to 10 results
  }
}