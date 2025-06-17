'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import _ from 'lodash';

const MAX_CHUNK_SIZE = 2000; // Maximum characters per chunk
const BATCH_SIZE = 3; // Number of chunks to process at once

const DynamicRAG = () => {
    const [inputText, setInputText] = useState('');
    const [repoUrl, setRepoUrl] = useState('');
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState('');
    const [inputMode, setInputMode] = useState('text'); // 'text' or 'repo'

  // Function to detect if text is likely code
  const isCodeBlock = (text) => {
    // Check for common code indicators
    const codeIndicators = [
      /^import\s+/m,          // import statements
      /^const\s+/m,           // const declarations
      /^let\s+/m,             // let declarations
      /^function\s+/m,        // function declarations
      /^class\s+/m,           // class declarations
      /=>/m,                  // arrow functions
      /{\s*$/m,              // opening braces at end of line
      /^\s*}/m,              // closing braces at start of line
      /^\s*return\s+/m,      // return statements
      /^\s*if\s*\(/m,        // if statements
      /^\s*for\s*\(/m,       // for loops
      /^\s*while\s*\(/m,     // while loops
    ];
    return codeIndicators.some(pattern => pattern.test(text));
  };

  // Function to find matching closing brace
  const findMatchingBrace = (text, startIndex) => {
    let count = 1;
    for (let i = startIndex + 1; i < text.length; i++) {
      if (text[i] === '{') count++;
      if (text[i] === '}') count--;
      if (count === 0) return i;
    }
    return text.length;
  };

  // Function to split text into reasonable chunks
  const createChunks = (text) => {
    // First pass: identify code blocks and regular text blocks
    const blocks = [];
    let currentBlock = '';
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // If we detect a code block
      if (isCodeBlock(line)) {
        // If we had accumulated non-code text, save it
        if (currentBlock && !isCodeBlock(currentBlock)) {
          blocks.push({ type: 'text', content: currentBlock.trim() });
          currentBlock = '';
        }
        
        // Start collecting the code block
        currentBlock += (currentBlock ? '\n' : '') + line;
        
        // If we see an opening brace, collect until matching closing brace
        if (line.includes('{')) {
          let braceCount = 1;
          while (i + 1 < lines.length && braceCount > 0) {
            i++;
            currentBlock += '\n' + lines[i];
            braceCount += (lines[i].match(/{/g) || []).length;
            braceCount -= (lines[i].match(/}/g) || []).length;
          }
        }
      } else {
        // For non-code text
        if (currentBlock && isCodeBlock(currentBlock)) {
          blocks.push({ type: 'code', content: currentBlock.trim() });
          currentBlock = '';
        }
        currentBlock += (currentBlock ? '\n' : '') + line;
      }
    }
    
    // Don't forget the last block
    if (currentBlock) {
      blocks.push({ 
        type: isCodeBlock(currentBlock) ? 'code' : 'text', 
        content: currentBlock.trim() 
      });
    }

    // Second pass: chunk blocks while preserving code structure
    const chunks = [];
    for (const block of blocks) {
      if (block.type === 'code') {
        // For code blocks, try to keep function/class definitions together
        if (block.content.length <= MAX_CHUNK_SIZE) {
          chunks.push(block.content);
        } else {
          // If code block is too large, split on function/class boundaries
          const lines = block.content.split('\n');
          let currentChunk = '';
          
          for (const line of lines) {
            if (currentChunk.length + line.length > MAX_CHUNK_SIZE) {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = line;
            } else {
              currentChunk += (currentChunk ? '\n' : '') + line;
            }
          }
          if (currentChunk) chunks.push(currentChunk.trim());
        }
      } else {
        // For text blocks, split on sentence boundaries
        if (block.content.length <= MAX_CHUNK_SIZE) {
          chunks.push(block.content);
        } else {
          const sentences = block.content.match(/[^.!?]+[.!?]+/g) || [block.content];
          let currentChunk = '';
          
          for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > MAX_CHUNK_SIZE) {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = sentence;
            } else {
              currentChunk += ' ' + sentence;
            }
          }
          if (currentChunk) chunks.push(currentChunk.trim());
        }
      }
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  // Process chunks in batches
  const processBatch = async (chunks, startIdx) => {
    const batchChunks = chunks.slice(startIdx, startIdx + BATCH_SIZE);
    //console.log('Processing batch chunks:', batchChunks);
    
    try {
      const embeddingResponse = await fetch('http://localhost:8080/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed',
          input: batchChunks
        })
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        console.error('Embedding response error:', errorText);
        throw new Error('Embedding creation failed');
      }
      
      const embeddings = await embeddingResponse.json();
      //console.log('Embedding response:', embeddings);

      const results = batchChunks.map((chunk, i) => {
        if (!embeddings.data[i]) {
          //console.error('Missing embedding for chunk:', i, chunk);
          return null;
        }
        return {
          text: chunk,
          embedding: embeddings.data[i].embedding
        };
      }).filter(item => item !== null);

      //console.log('Processed batch results:', results);
      return results;
    } catch (err) {
      //console.error('Batch processing error:', err);
      throw new Error(`Failed to process batch: ${err.message}`);
    }
};

const fetchGitRepo = async (url) => {
    try {
      setProgress('Fetching repository content...');
      const response = await fetch('/api/gitingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        //console.error('GitIngest error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch repository content');
      }
      
      const data = await response.json();
      return data.content;
    } catch (err) {
      console.error('Full error:', err);
      throw new Error(`Failed to fetch repository: ${err.message}`);
    }
  };

  // Create temporary snapshot from embeddings
  const createSnapshot = async (embeddingsData) => {
    try {
      const collectionName = `temp_${Date.now()}`;
      
      await fetch(`http://localhost:6333/collections/${collectionName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vectors: {
            size: 768,
            distance: 'Cosine'
          }
        })
      });

      // Insert vectors - modified to use new data structure
      const points = embeddingsData.map((item, i) => ({
        id: i,
        vector: item.embedding,
        payload: { text: item.text }
      }));

      await fetch(`http://localhost:6333/collections/${collectionName}/points`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points })
      });

      return collectionName;
    } catch (err) {
      throw new Error(`Failed to create snapshot: ${err.message}`);
    }
};

  const queryLLM = async (userQuery, context) => {
    const completion = await fetch('http://localhost:8080/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Use the provided context to answer questions.'
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nQuestion: ${userQuery}`
          }
        ]
      })
    });

    const result = await completion.json();
    return result.choices[0].message.content;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setProgress('');
    let collectionName = null;

    try {

        // Get content either from direct input or from GitHub
        let textToProcess;
        if (inputMode === 'repo') {
            textToProcess = await fetchGitRepo(repoUrl);
        } else {
            textToProcess = inputText;
        }
      // Split input text into chunks
      setProgress('Splitting text into chunks...');
      const chunks = createChunks(textToProcess);
      console.log('Created chunks:', chunks);
      
      const totalChunks = chunks.length;
      let processedEmbeddings = [];

      // Process chunks in batches
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        setProgress(`Processing chunks ${i + 1}-${Math.min(i + BATCH_SIZE, totalChunks)} of ${totalChunks}...`);
        const batchResults = await processBatch(chunks, i);
        if (batchResults && batchResults.length > 0) {
          processedEmbeddings = [...processedEmbeddings, ...batchResults];
        }
      }

      //console.log('All processed embeddings:', processedEmbeddings);

      if (processedEmbeddings.length === 0) {
        throw new Error('No embeddings were successfully created');
      }

      // Create snapshot with all embeddings
      setProgress('Creating vector database...');
      collectionName = await createSnapshot(processedEmbeddings);

      // Create embedding for query
      setProgress('Processing your question...');
      const queryEmbeddingResponse = await fetch('http://localhost:8080/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed',
          input: [query]
        })
      });

      const queryEmbedding = await queryEmbeddingResponse.json();
      //console.log('Query embedding:', queryEmbedding);

      // Search for relevant context
      const searchPayload = {
        vector: queryEmbedding.data[0].embedding,
        limit: 3,
        with_payload: true,  // Explicitly request payload to be returned
        with_vector: false   // We don't need the vectors back
      };
      //console.log('Search payload:', searchPayload);
      
      const searchResponse = await fetch(`http://localhost:6333/collections/${collectionName}/points/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchPayload)
      });
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Search error:', errorText);
        throw new Error(`Search failed: ${errorText}`);
      }
      
      const searchResults = await searchResponse.json();
      //console.log('Got search results:', searchResults);

        // Add error checking and fallbacks for search results
        const context = searchResults.result && Array.isArray(searchResults.result)
        ? searchResults.result
            .filter(r => r && r.payload && r.payload.text)  // Filter out any invalid results
            .map(r => r.payload.text)
            .join('\n\n')
        : '';

        // If no valid context was found, throw an error
        if (!context) {
        throw new Error('No relevant context found for the query');
        }

      // Get LLM response
      setProgress('Generating answer...');
      const answer = await queryLLM(query, context);
      setResponse(answer);
      setProgress('');

    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message);
    } finally {
      // Cleanup temporary collection
      if (collectionName) {
        try {
          await fetch(`http://localhost:6333/collections/${collectionName}`, {
            method: 'DELETE'
          });
        } catch (cleanupErr) {
          console.error('Failed to cleanup collection:', cleanupErr);
        }
      }
      setLoading(false);
    }
};

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Dynamic RAG System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          <div className="flex space-x-4 mb-4">
            <Button
              variant={inputMode === 'text' ? 'default' : 'outline'}
              onClick={() => setInputMode('text')}
            >
              Direct Text Input
            </Button>
            <Button
              variant={inputMode === 'repo' ? 'default' : 'outline'}
              onClick={() => setInputMode('repo')}
            >
              GitHub Repository
            </Button>
          </div>

          {inputMode === 'text' ? (
            <div>
              <label className="block mb-2 text-sm font-medium">Input Text</label>
              <textarea
                className="w-full h-32 p-2 border rounded-md"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your knowledge base text here..."
              />
            </div>
          ) : (
            <div>
              <label className="block mb-2 text-sm font-medium">GitHub Repository URL</label>
              <Input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the full GitHub repository URL to analyze its content
              </p>
            </div>
          )}

            <div>
                <label className="block mb-2 text-sm font-medium">Query</label>
                <div className="flex space-x-2">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your question..."
                />
                <Button 
                    onClick={handleSubmit}
                    disabled={loading || (!inputText && !repoUrl) || !query}
                >
                    {loading ? 'Processing...' : 'Submit'}
                </Button>
                </div>
            </div>

            {progress && (
              <Alert>
                <AlertDescription>{progress}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {response && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Response:</h3>
                <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicRAG;