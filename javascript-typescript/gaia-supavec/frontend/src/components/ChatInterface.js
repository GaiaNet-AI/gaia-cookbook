import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { searchEmbeddings, askQuestion } from '../utils/api';

export function ChatInterface({ selectedFiles }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || selectedFiles.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // First, search for relevant context
      const searchResponse = await searchEmbeddings(question, selectedFiles);
      const context = searchResponse.documents
        .map(doc => doc.content)
        .join('\n\n');

      // Then, ask Gaia using the context
      const answer = await askQuestion(question, context);

      setMessages(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: formatResponse(answer.choices[0].message.content) }
      ]);

      setQuestion('');
    } catch (error) {
      console.error('Error asking question:', error);
      setError(error.message);
      setMessages(prev => [
        ...prev,
        { role: 'user', content: question },
        { 
          role: 'system', 
          content: '❌ Sorry, I encountered an error processing your question. Please try again.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Format the response to enhance readability
  const formatResponse = (content) => {
    // Add proper markdown formatting for questions and answers
    return content.replace(/\*\*Question \d+\*\*/g, '\n### $&\n')
                 .replace(/\*\*Answer\*\*/g, '\n#### Answer ')
                 .replace(/([A-D]\.)(?=\s)/g, '\n$1') // Add newlines before options
                 .trim();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-[calc(100vh-200px)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Chat</h2>
            {selectedFiles.length > 0 && (
                <span className="text-sm text-gray-500">
                {selectedFiles.length} file(s) selected
                </span>
            )}
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {messages.map((message, index) => (
            <div
                key={index}
                className={`p-4 rounded-lg ${
                message.role === 'user'
                    ? 'bg-blue-50 ml-8'
                    : message.role === 'system'
                    ? 'bg-red-50'
                    : 'bg-gray-50 mr-8'
                }`}
            >
                <p className="text-sm font-medium mb-2 text-gray-600">
                {message.role === 'user' ? '👤 You' : 
                message.role === 'system' ? '⚠️ System' : '🤖 Assistant'}
                </p>
                <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                    code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                        <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                        );
                    },
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-md font-medium mt-3 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    }}
                >
                    {message.content}
                </ReactMarkdown>
                </div>
            </div>
            ))}

            {loading && (
            <div className="flex items-center justify-center p-4">
                <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                </div>
            </div>
            )}
        </div>

        {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
            {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={selectedFiles.length === 0 
                ? "Please select documents first..." 
                : "Ask a question about the selected documents..."}
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={selectedFiles.length === 0 || loading}
            />
            <button
            type="submit"
            disabled={!question.trim() || selectedFiles.length === 0 || loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
            {loading ? 'Thinking...' : 'Ask'}
            </button>
        </form>
    </div>
  );
}