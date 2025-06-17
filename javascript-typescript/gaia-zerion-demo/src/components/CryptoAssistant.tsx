'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Wallet } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ethers } from 'ethers'; // Import ethers
import { useToast } from '@/hooks/use-toast';

const GAIA_NODE_URL = process.env.NEXT_PUBLIC_GAIA_NODE_URL;
const GAIA_API_KEY = process.env.NEXT_PUBLIC_GAIA_API_KEY;
const ZERION_BASE_URL = process.env.NEXT_PUBLIC_ZERION_BASE_URL;
const ZERION_API_KEY = process.env.NEXT_PUBLIC_ZERION_API_KEY;

const ChatMessage = ({ role, content }) => (
  <div
    className={cn(
      'flex mb-4',
      role === 'user' ? 'justify-end' : 'justify-start',
    )}
  >
    <div
      className={cn(
        'flex items-start gap-2 max-w-[80%] rounded-lg p-3',
        role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
      )}
    >
      {role === 'assistant' && (
        <Avatar className="w-8 h-8">
          <AvatarImage src="https://avatar.iran.liara.run/public/girl" alt="Gaia AI" />
          <AvatarFallback>GA</AvatarFallback>
        </Avatar>
      )}
      <div>{content}</div>
      {role === 'user' && (
        <Avatar className="w-8 h-8">
          <AvatarImage src="https://avatar.iran.liara.run/public" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  </div>
);

const CryptoAssistant = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState(''); // Wallet address state
  const scrollAreaRef = useRef(null);
  const scrollableContentRef = useRef(null);
  const { toast } = useToast(); // Use the toast

  // Function to connect to wallet
  const connectWallet = useCallback(async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []); // Request account access
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        toast({
          title: 'Wallet Connected',
          description: `Connected to ${address}`,
        });
      } else {
        toast({
          title: 'No Wallet Detected',
          description:
            'Please install MetaMask or another Ethereum-compatible wallet.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      toast({
        title: 'Wallet Connection Error',
        description: error.message || 'Failed to connect to wallet.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Function to disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletAddress('');
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  }, [toast]);

  // Function to fetch wallet balance from Zerion API
  const getWalletBalance = useCallback(
    async (address) => {
      try {
        const response = await fetch(
          `${ZERION_BASE_URL}/wallets/${address}/portfolio?currency=usd`,
          {
            headers: {
              accept: 'application/json',
              authorization: `Basic ${ZERION_API_KEY}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch wallet data');
        }

        const data = await response.json();
        if (!data.data || !data.data.attributes) {
          throw new Error('Invalid response structure');
        }

        // Extract relevant data
        const totalValue = data.data.attributes.total?.positions || 0;
        const chainDistribution = Object.entries(
          data.data.attributes.positions_distribution_by_chain || {},
        )
          .map(([chain, value]) => `${chain.toUpperCase()}: $${value.toFixed(2)}`)
          .join('\n');
        const changes = data.data.attributes.changes
          ? `📈 24h Change: $${data.data.attributes.changes.absolute_1d.toFixed(
              2,
            )} (${data.data.attributes.changes.percent_1d.toFixed(2)}%)`
          : 'No recent changes.';

        return {
          total: totalValue.toFixed(2),
          chainDistribution,
          changes,
        };
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        throw error;
      }
    },
    [],
  );

  // Generic function to call Zerion API endpoints
  const callZerionApi = useCallback(
    async (endpoint, params = {}) => {
      try {
        const url = new URL(`${ZERION_BASE_URL}${endpoint}`);
        Object.keys(params).forEach((key) =>
          url.searchParams.append(key, params[key]),
        );

        const response = await fetch(url.toString(), {
          headers: {
            accept: 'application/json',
            authorization: `Basic ${ZERION_API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error calling Zerion API:', error);
        throw error;
      }
    },
    [],
  );

  // Function to get wallet transactions
  const getWalletTransactions = useCallback(
    async (address) => {
      try {
        const data = await callZerionApi(
          `/wallets/${address}/transactions/?currency=usd&page[size]=100&filter[trash]=only_non_trash`,
        );
        console.log('Wallet Transactions:', data);
        return data; // Or format and return the data as needed
      } catch (error) {
        console.error('Error getting wallet transactions:', error);
        // Handle the error
        return null;
      }
    },
    [callZerionApi],
  );

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollableContentRef.current) {
      scrollableContentRef.current.scrollTop =
        scrollableContentRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!walletAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to use this feature.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Call GaiaNet LLM for function calling
      const llmResponse = await fetch(`${GAIA_NODE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GAIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama70b',
          messages: [
            {
              role: 'system',
              content: `You are a crypto portfolio assistant with access to the Zerion API through function calls. 
The user has already connected their wallet, so you know their wallet address.  When users ask about wallet balances or holdings, you will make a tool call.  
Generate your response in the following format:
<tool_call>
{"id": 0, "name": "get_balance"}
</tool_call>
or
<tool_call>
{"id": 1, "name": "get_wallet_transactions"}
</tool_call>`,
            },
            { role: 'user', content: userMessage },
          ],
        }),
      });

      const llmData = await llmResponse.json();
      const assistantResponse = llmData.choices[0].message.content;

      let functionName;
      let functionArgs = {};
      const address = walletAddress;

      if (assistantResponse.includes('<tool_call>')) {
        const match = assistantResponse.match(
          /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/,
        );
        if (match && match[1]) {
          try {
            const toolCall = JSON.parse(match[1]);
            functionName = toolCall.name;
            functionArgs = toolCall.arguments || {};
          } catch (e) {
            console.error('Error parsing tool call:', e);
          }
        }
      }

      try {
        let formattedResponse;
        switch (functionName) {
          case 'get_balance': {
            const balanceData = await getWalletBalance(address);
            formattedResponse = `📊 *Wallet Balance Summary for ${address}:*
💰 *Total Portfolio Value:* $${balanceData.total}

🌐 *Chain Distribution:*
${balanceData.chainDistribution}

${balanceData.changes}

🕒 Last updated: ${new Date().toLocaleTimeString()}`;
            break;
          }
          case 'get_wallet_transactions': {
            const transactionsData = await getWalletTransactions(address);
            if (transactionsData && transactionsData.data) {
              formattedResponse = `💰 *Last 100 Transactions for ${address}:*\n` +
                transactionsData.data.map(tx => `- ${tx.attributes.operation_type} (${tx.attributes.hash})`).join('\n');
            } else {
              formattedResponse = `❌ Error fetching wallet transactions.`;
            }
            break;
          }
          default:
            formattedResponse = `❌ Unknown function call.`;
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: formattedResponse },
        ]);
      } catch (error) {
        console.error('Error executing function call:', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '❌ Error fetching data. Please try again later.',
          },
        ]);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Error processing your request. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt) => {
    const updatedPrompt = prompt;
    setInput(updatedPrompt);
  };

  const suggestedPrompts = [
    'What is my balance?',
    'Analyze my portfolio',
    'Show me my holdings',
    'List my latest transactions',
  ];

  return (
    walletAddress ? (
      <div className="flex flex-col h-screen">
        {/* Full-screen container */}
        <Card className="flex-grow mx-auto w-full max-w-3xl flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold">
                Gaia's AI + Zerion = 🚀
              </CardTitle>
              <CardDescription>
                Ask me about wallet balances and portfolio information
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://avatar.iran.liara.run/public" alt="Connected Wallet" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Button variant="secondary" onClick={disconnectWallet}>
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                &nbsp; - Disconnect
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="h-full pr-4">
              <div ref={scrollableContentRef}>
                {messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {loading && (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter>
            <div className="flex flex-col w-full">
              <div className="flex flex-wrap justify-start mb-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePromptClick(prompt)}
                    className="mr-2 mb-2"
                    disabled={loading}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
              <div className="flex w-full gap-2">
                <Input
                  placeholder="Ask about wallet balances..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button onClick={handleSend} disabled={loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    ) : (
      <div className="flex flex-col h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Gaia's AI + Zerion = 🚀</CardTitle>
            <CardDescription>
              Please connect your wallet to use the AI assistant powered by Zerion and Gaia.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <Button onClick={connectWallet}>
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  );
};

export default CryptoAssistant;