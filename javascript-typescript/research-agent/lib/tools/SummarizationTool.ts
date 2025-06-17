import { ProcessedSearchResult } from '../types';

export class SummarizationTool {
  private readonly API_URL = 'https://llama70b.gaia.domains/v1/chat/completions';

  async summarize(query: string, searchResults: ProcessedSearchResult[]): Promise<string> {
    try {
      if (!process.env.GAIA_API_KEY) {
        throw new Error('GAIA_API_KEY environment variable is not set');
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GAIA_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama70b',
          messages: [
            {
              role: "system",
              content: `Use the following step-by-step instructions to respond to the user's inputs.
              
              step 1 - The user will provide you with a search query and a list of search results.
              step 2 - Understand the user's query and the information they are looking for.
              step 3 - Synthesize the information in 4 to 6 sentences from the search results to provide a comprehensive answer to the user's query.
              step 4 - Use only plain text without any markdown or formatting.
              step 5 - Provide proper citations when referencing specific information.`
            },
            {
              role: "user",
              content: `
              query: ${query}
              search results: ${JSON.stringify(searchResults.slice(0, 3))}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestBody: {
            model: 'llama70b',
            messages: [
              {
                role: "system",
                content: "System message..."
              },
              {
                role: "user",
                content: `query: ${query}`
              }
            ]
          }
        });
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        console.error('Unexpected API response format:', data);
        throw new Error('Invalid response format from API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in summarize method:', error);
      throw error;
    }
  }
  
  async *summarizeStreaming(query: string, searchResults: ProcessedSearchResult[]): AsyncGenerator<string> {
    try {
      if (!process.env.GAIA_API_KEY) {
        throw new Error('GAIA_API_KEY environment variable is not set');
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GAIA_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama70b',
          messages: [
            {
              role: "system",
              content: `Use the following step-by-step instructions to respond to the user's inputs.
              
              step 1 - The user will provide you with a search query and a list of search results.
              step 2 - Understand the user's query and the information they are looking for.
              step 3 - Synthesize the information in 4 to 6 sentences from the search results to provide a comprehensive answer to the user's query.
              step 4 - Use only plain text without any markdown or formatting.
              step 5 - Provide proper citations when referencing specific information.`
            },
            {
              role: "user",
              content: `
              query: ${query}
              search results: ${JSON.stringify(searchResults.slice(0, 3))}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestBody: {
            model: 'llama70b',
            messages: [
              {
                role: "system",
                content: "System message..."
              },
              {
                role: "user",
                content: `query: ${query}`
              }
            ]
          }
        });
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.error('Error parsing streaming response:', e, 'Line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in summarizeStreaming method:', error);
      throw error;
    }
  }
}