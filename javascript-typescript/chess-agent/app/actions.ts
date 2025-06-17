"use server"

export async function generateChessResponse(prompt: string) {
  try {
    // Get the base URL from environment or use a default
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Clean up the prompt by removing any error messages or extra whitespace
    const cleanPrompt = prompt.replace(/3:"An error occurred."/g, '').trim();
    
    console.log('Sending request to API:', cleanPrompt);
    
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: cleanPrompt
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    // Read the streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let text = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    console.log('Received response:', text);

    // Try to parse as JSON, but if it fails, use the text directly
    try {
      const data = JSON.parse(text);
      return {
        text: data.text || text,
        error: null,
      };
    } catch {
      // If parsing fails, use the text directly
      return {
        text: text,
        error: null,
      };
    }
  } catch (error) {
    console.error("Error in generateChessResponse:", error);
    return {
      text: "I'm thinking about my next move...",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
