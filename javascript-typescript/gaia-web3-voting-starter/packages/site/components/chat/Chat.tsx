'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { tools } from '@/ai/tools';
import { GAIA_API_ENDPOINT, GAIA_MODEL, systemPrompt } from '@/app/api/chat/route';

// Define types for the voting data
interface VotingOption {
  name: string;
  voteCount: bigint;
}

interface VotingDetails {
  description: string;
  options: VotingOption[];
  isActive: boolean;
  remainingTime: bigint;
}

interface ChatProps {
  votings?: string[];
  votingDetails?: Record<string, VotingDetails>;
  fetchVotings?: () => Promise<void>;
  castVote?: (votingAddress: string, optionIndex: number) => Promise<void>;
  createVoting?: (description: string, options: string[], durationType: number) => Promise<void>;
  isConnected?: boolean;
}

// Helper function to convert BigInt to string for JSON serialization
const serializeForJSON = (data: any): any => {
  if (typeof data === 'bigint') {
    return data.toString();
  }
  
  if (Array.isArray(data)) {
    return data.map(serializeForJSON);
  }
  
  if (data && typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      result[key] = serializeForJSON(data[key]);
    }
    return result;
  }
  
  return data;
};

export default function Chat({ 
  votings = [], 
  votingDetails = {}, 
  fetchVotings = async () => {}, 
  castVote = async () => {},
  createVoting = async () => {}, 
  isConnected = false 
}: ChatProps) {
  // Serialize the data to handle BigInt values
  const serializedVotingDetails = serializeForJSON(votingDetails);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'system-1',
        role: 'system',
        content: `${systemPrompt}
        
        Current voting data:
        ${JSON.stringify(serializedVotingDetails)}
        
        Available voting addresses:
        ${JSON.stringify(votings)}
        
        Remember to be engaging while maintaining focus on being helpful.`
      }
    ],
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      model: GAIA_MODEL,
      maxSteps: 5,
      tools: Object.values(tools)
    }
  });

  // Function to generate unique message ID
  const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Function to handle special commands
  const handleSpecialCommands = async (userInput: string) => {
    const lowerInput = userInput.toLowerCase().trim();

    // Help command
    if (lowerInput === 'help' || lowerInput === 'commands' || lowerInput === 'show commands') {
      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: `Here are all the available commands:

<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
  <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 12px;">📋 Voting Commands</div>

  <div style="margin-bottom: 16px;">
    <div style="font-weight: 500; color: #2563eb; margin-bottom: 4px;">Create a New Voting</div>
    <code style="display: block; background: #f9fafb; padding: 8px; border-radius: 4px; margin-top: 4px;">create voting "Your voting description" options: option1, option2, option3 duration: &lt;number&gt;</code>
    <div style="color: #6b7280; margin-top: 4px; font-size: 0.875rem;">Duration: 1 (1 Hour), 2 (1 Day), 3 (1 Week)</div>
  </div>

  <div style="margin-bottom: 16px;">
    <div style="font-weight: 500; color: #2563eb; margin-bottom: 4px;">View Votings</div>
    <code style="display: block; background: #f9fafb; padding: 8px; border-radius: 4px; margin-top: 4px;">show all votings
show active votings
list votings</code>
  </div>

  <div style="margin-bottom: 16px;">
    <div style="font-weight: 500; color: #2563eb; margin-bottom: 4px;">Cast a Vote</div>
    <code style="display: block; background: #f9fafb; padding: 8px; border-radius: 4px; margin-top: 4px;">vote for [contract-address] option [number]</code>
  </div>

  <div style="margin-bottom: 16px;">
    <div style="font-weight: 500; color: #2563eb; margin-bottom: 4px;">Quick Status</div>
    <code style="display: block; background: #f9fafb; padding: 8px; border-radius: 4px; margin-top: 4px;">voting status
my votes</code>
  </div>
</div>

You can also ask me questions about voting, blockchain, or how to use any of these commands!`
      }]);
      return true;
    }

    // Quick status command
    if (lowerInput === 'voting status' || lowerInput === 'status') {
      if (!isConnected) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: 'You need to connect your wallet first to check voting status. Please connect your wallet and try again.'
        }]);
        return true;
      }

      const activeVotings = votings.filter(address => votingDetails[address]?.isActive);
      const endedVotings = votings.filter(address => !votingDetails[address]?.isActive);

      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: `📊 Voting Status Summary:

<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background-color: #ffffff;">
  <div style="margin-bottom: 8px;">
    <span style="color: #059669; font-weight: 600;">🟢 Active Votings:</span> ${activeVotings.length}
  </div>
  <div style="margin-bottom: 8px;">
    <span style="color: #6b7280; font-weight: 600;">⭕ Ended Votings:</span> ${endedVotings.length}
  </div>
  <div style="margin-top: 12px; font-size: 0.875rem; color: #6b7280;">
    Use 'show active votings' to see details of ongoing votings
  </div>
</div>`
      }]);
      return true;
    }

    // My votes command
    if (lowerInput === 'my votes' || lowerInput === 'show my votes') {
      if (!isConnected) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: 'You need to connect your wallet first to view your votes. Please connect your wallet and try again.'
        }]);
        return true;
      }

      // Note: This is a placeholder. You'll need to implement the actual vote tracking
      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: `To implement vote tracking, we'll need to add this functionality to the smart contract and update the UI accordingly. Would you like me to explain how we can add vote tracking to the system?`
      }]);
      return true;
    }

    // Command to create a new voting
    if (lowerInput.startsWith('create voting')) {
      if (!isConnected) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: 'You need to connect your wallet first to create a voting. Please connect your wallet and try again.'
        }]);
        return true;
      }

      // Parse the voting details from the message
      // Expected format: create voting "description" options: option1, option2, option3 duration: <1/2/3>
      const descriptionMatch = userInput.match(/"([^"]+)"/);
      const optionsMatch = userInput.match(/options:\s*([^]*?)(?:\s+duration:|$)/i);
      const durationMatch = userInput.match(/duration:\s*(\d+)/i);

      if (!descriptionMatch || !optionsMatch) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: `To create a voting, please use this format:

create voting "Your voting description" options: option1, option2, option3 duration: <number>

Duration options:
1 - 1 Hour
2 - 1 Day
3 - 1 Week

Example:
create voting "Best programming language" options: Python, JavaScript, TypeScript duration: 2`
        }]);
        return true;
      }

      const description = descriptionMatch[1];
      const options = optionsMatch[1]
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
      const durationType = parseInt(durationMatch?.[1] || '2'); // Default to 1 day if not specified

      if (options.length < 2) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: '❌ Please provide at least 2 options for the voting.'
        }]);
        return true;
      }

      try {
        // Show loading message
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: 'Creating your voting...'
        }]);

        await createVoting(description, options, durationType);
        await fetchVotings(); // Refresh the voting list

        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: `✅ Voting created successfully!

Description: ${description}
Options: ${options.join(', ')}
Duration: ${
            durationType === 1 ? '1 Hour' :
            durationType === 2 ? '1 Day' :
            '1 Week'
          }

I'll show you all active votings now...`
        }]);

        // Show all votings after creation
        if (votings.length > 0) {
          let response = 'Here are all the active votings:\n\n';
          
          votings.forEach((address, index) => {
            const details = votingDetails[address];
            if (details) {
              response += `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
  <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 8px;">${details.description}</div>
  
  <div style="color: #6b7280; margin-bottom: 4px;">
    ${details.isActive ? '🟢 Voting active' : '⭕ Voting ended'}
  </div>
  
  <div style="color: #6b7280; font-family: monospace; margin-bottom: 12px;">
    Contract: ${address}
  </div>

  <div style="margin-top: 12px;">
    <div style="font-weight: 500; margin-bottom: 8px;">Options:</div>
    ${details.options.map((option, optIndex) => `
    <div style="display: flex; justify-content: space-between; padding: 4px 0;">
      <span>${option.name}</span>
      <span>${option.voteCount.toString()} votes</span>
    </div>
    `).join('')}
  </div>

  <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
    To vote, use: <code>vote for ${address} option [1-${details.options.length}]</code>
  </div>
</div>\n`;
            }
          });
          
          setMessages(prev => [...prev, {
            id: generateMessageId(),
            role: 'assistant',
            content: response
          }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: `❌ Failed to create voting: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]);
      }
      return true;
    }

    // Command to fetch all votings - expanded pattern matching
    if (
      lowerInput === 'get all voting' ||
      lowerInput === 'get all votings' ||
      lowerInput === 'show votings' ||
      lowerInput === 'show all votings' ||
      lowerInput === 'list votings' ||
      lowerInput === 'show active votings' ||
      lowerInput === 'list active votings' ||
      lowerInput === 'get active votings'
    ) {
      if (!isConnected) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: 'You need to connect your wallet first to view votings. Please connect your wallet and try again.'
        }]);
        return true;
      }
      
      // Show loading message
      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Fetching votings...'
      }]);

      await fetchVotings();
      
      // Filter based on command
      const showOnlyActive = lowerInput.includes('active');
      const filteredVotings = showOnlyActive 
        ? votings.filter(address => votingDetails[address]?.isActive)
        : votings;
      
      if (filteredVotings.length === 0) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: showOnlyActive 
            ? 'There are no active votings at the moment.'
            : 'There are no votings available.'
        }]);
      } else {
        let response = showOnlyActive 
          ? 'Here are all the active votings:\n\n'
          : 'Here are all votings (including ended ones):\n\n';
        
        filteredVotings.forEach((address) => {
          const details = votingDetails[address];
          if (details) {
            // Create a card-like structure for each voting
            response += `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
  <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 8px;">${details.description}</div>
  
  <div style="color: #6b7280; margin-bottom: 4px;">
    ${details.isActive 
      ? '🟢 Voting active' 
      : '⭕ Voting ended'}
  </div>
  
  <div style="color: #6b7280; font-family: monospace; margin-bottom: 12px;">
    Contract: ${address}
  </div>

  <div style="margin-top: 12px;">
    <div style="font-weight: 500; margin-bottom: 8px;">Options:</div>
    ${details.options.map((option, optIndex) => `
    <div style="display: flex; justify-content: space-between; padding: 4px 0;">
      <span>${option.name}</span>
      <span>${option.voteCount.toString()} votes</span>
    </div>
    `).join('')}
  </div>

  ${details.isActive ? `
  <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
    To vote, use: <code>vote for ${address} option [1-${details.options.length}]</code>
  </div>
  ` : ''}
</div>\n`;
          }
        });
        
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: response
        }]);
      }
      
      return true;
    }
    
    // Command to cast a vote
    if (lowerInput.includes('vote for') || lowerInput.includes('cast vote')) {
      if (!isConnected) {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: 'You need to connect your wallet first to cast a vote. Please connect your wallet and try again.'
        }]);
        return true;
      }
      
      // Extract voting address and option from the message
      const addressMatch = userInput.match(/0x[a-fA-F0-9]{40}/);
      const optionMatch = userInput.match(/option (\d+)/i);
      
      if (addressMatch && optionMatch) {
        const address = addressMatch[0];
        const optionIndex = parseInt(optionMatch[1]) - 1;
        
        try {
          // Show loading message
          setMessages(prev => [...prev, {
            id: generateMessageId(),
            role: 'assistant',
            content: 'Processing your vote...'
          }]);

          await castVote(address, optionIndex);
          
          setMessages(prev => [...prev, {
            id: generateMessageId(),
            role: 'assistant',
            content: `✅ Vote cast successfully!\n\nVoted for option ${optionIndex + 1} in voting contract ${address}`
          }]);
        } catch (error) {
          setMessages(prev => [...prev, {
            id: generateMessageId(),
            role: 'assistant',
            content: `❌ Failed to cast vote: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          role: 'assistant',
          content: 'I couldn\'t understand which voting and option you want to vote for. Please use this format:\n\n"vote for [contract address] option [number]"\n\nFor example:\n"vote for 0x1234...5678 option 2"'
        }]);
      }
      
      return true;
    }
    
    return false;
  };

  // Custom submit handler
  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const currentInput = input;
    
    // Clear input immediately after sending
    handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);

    // Add user message immediately
    setMessages(prev => [...prev, {
      id: generateMessageId(),
      role: 'user',
      content: currentInput
    }]);

    // Check for special commands first
    const isSpecialCommand = await handleSpecialCommands(currentInput);
    
    if (!isSpecialCommand) {
      // Show thinking message
      setMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Thinking...'
      }]);

      try {
        const response = await fetch(`${GAIA_API_ENDPOINT}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `${systemPrompt}
                
                Current voting data:
                ${JSON.stringify(serializedVotingDetails)}
                
                Available voting addresses:
                ${JSON.stringify(votings)}
                
                Remember to be engaging while maintaining focus on being helpful.`
              },
              ...messages.filter(msg => 
                msg.role !== 'system' && 
                msg.role !== 'assistant' && 
                msg.content !== 'Thinking...'
              ).map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              { role: 'user', content: currentInput }
            ],
            model: GAIA_MODEL,
            max_tokens: 1000,
            temperature: 0.7,
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        // Remove the thinking message
        setMessages(prev => prev.filter(msg => msg.content !== 'Thinking...'));

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        let accumulatedResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Convert the chunk to text
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;

              try {
                const jsonData = JSON.parse(jsonStr);
                if (jsonData.choices?.[0]?.delta?.content) {
                  accumulatedResponse += jsonData.choices[0].delta.content;
                  
                  // Update the message with accumulated response
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content = accumulatedResponse;
                    } else {
                      newMessages.push({
                        id: generateMessageId(),
                        role: 'assistant',
                        content: accumulatedResponse
                      });
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }

      } catch (error) {
        console.error('Chat error:', error);
        // Remove the thinking message and show error
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.content !== 'Thinking...');
          return [...filtered, {
            id: generateMessageId(),
            role: 'assistant',
            content: "I apologize, but I'm having trouble processing that request. Feel free to ask about voting-related tasks or type 'show commands' to see what I can help you with!"
          }];
        });
      }
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)] w-full p-6 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg min-w-0 border border-gray-100">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.filter(msg => msg.role !== 'system').map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-2xl px-6 py-3 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : message.content === 'Thinking...' || message.content === 'Processing your vote...' || message.content === 'Fetching votings...' || message.content === 'Creating your voting...'
                    ? 'bg-gray-50 text-gray-800 border border-gray-100'
                    : 'bg-gray-50 text-gray-800 border border-gray-100'
                } whitespace-pre-wrap break-words`}
              >
                {message.role === 'assistant' && (message.content === 'Thinking...' || message.content === 'Processing your vote...' || message.content === 'Fetching votings...' || message.content === 'Creating your voting...') ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce mx-1" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <div className="ml-3 text-gray-600">
                      {message.content === 'Processing your vote...' ? 'Processing vote' :
                       message.content === 'Fetching votings...' ? 'Fetching votings' :
                       message.content === 'Creating your voting...' ? 'Creating voting' :
                       'AI is thinking'}
                    </div>
                    <div className="ml-2 text-xs text-gray-400 animate-pulse">
                      {message.content === 'Processing your vote...' ? '(blockchain transaction)' :
                       message.content === 'Fetching votings...' ? '(querying chain)' :
                       message.content === 'Creating your voting...' ? '(deploying contract)' :
                       '(generating response)'}
                    </div>
                  </div>
                ) : message.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: message.content }} className="prose prose-sm max-w-none" />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <form onSubmit={customHandleSubmit} className="flex gap-3">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message... (e.g., 'show all votings' or 'vote for [address] option 1')"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 text-white px-8 py-3 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors duration-200 font-medium shadow-sm"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Commands Panel */}
      <div className="w-80 bg-white rounded-xl shadow-lg p-6 flex-shrink-0 overflow-y-auto border border-gray-100">
        <div>
          <h2 className="text-xl font-semibold text-blue-800 mb-6">Available Commands</h2>
          
          <div className="space-y-6">
            <div className="border border-blue-100 rounded-xl p-4 hover:border-blue-200 transition-colors duration-200">
              <h3 className="font-medium text-blue-700 text-lg mb-3">1. Create a New Voting</h3>
              <div className="text-sm">
                <div className="text-gray-700 font-medium">Format:</div>
                <code className="block bg-gray-50 p-3 rounded-lg mt-2 text-xs break-all border border-gray-100">
                  create voting "Your voting description" options: option1, option2, option3 duration: &lt;number&gt;
                </code>
                <div className="text-gray-700 font-medium mt-3">Duration options:</div>
                <div className="text-gray-600 ml-2 mt-1 text-xs space-y-1">
                  1 - 1 Hour<br/>
                  2 - 1 Day<br/>
                  3 - 1 Week
                </div>
              </div>
            </div>

            <div className="border border-blue-100 rounded-xl p-4 hover:border-blue-200 transition-colors duration-200">
              <h3 className="font-medium text-blue-700 text-lg mb-3">2. View All Votings</h3>
              <div className="text-sm">
                <div className="text-gray-700 font-medium">Show all votings (including ended):</div>
                <code className="block bg-gray-50 p-3 rounded-lg mt-2 text-xs border border-gray-100">
                  show all votings<br/>
                  get all votings<br/>
                  list votings
                </code>
                <div className="text-gray-700 font-medium mt-3">Show only active votings:</div>
                <code className="block bg-gray-50 p-3 rounded-lg mt-2 text-xs border border-gray-100">
                  show active votings<br/>
                  list active votings<br/>
                  get active votings
                </code>
              </div>
            </div>

            <div className="border border-blue-100 rounded-xl p-4 hover:border-blue-200 transition-colors duration-200">
              <h3 className="font-medium text-blue-700 text-lg mb-3">3. Cast a Vote</h3>
              <div className="text-sm">
                <div className="text-gray-700 font-medium">Format:</div>
                <code className="block bg-gray-50 p-3 rounded-lg mt-2 text-xs break-all border border-gray-100">
                  vote for [contract-address] option [number]
                </code>
                <div className="text-gray-700 font-medium mt-3">Example:</div>
                <code className="block bg-gray-50 p-3 rounded-lg mt-2 text-xs border border-gray-100">
                  vote for 0x1234...5678 option 2
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 