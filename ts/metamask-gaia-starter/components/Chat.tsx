"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { FACTORY_CONTRACT_ADDRESS, FACTORY_ABI } from "@/constants";
import { publicClient } from "@/wagmi.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLinkIcon } from "@radix-ui/react-icons";

export const Chat = () => {
  const { address } = useAccount();
  const [delegationEnabled, setDelegationEnabled] = useState(false);
  const [createdTokens, setCreatedTokens] = useState<
    {
      name: string;
      symbol: string;
      address: string;
      transactionHash: string;
    }[]
  >([]);

  // Check if delegation is set up
  useEffect(() => {
    const checkDelegation = () => {
      const delegateInfo = sessionStorage.getItem("aiDelegateInfo");
      setDelegationEnabled(!!delegateInfo);
    };

    // Check initially
    checkDelegation();

    // Set up event listener to detect changes in session storage
    window.addEventListener("storage", checkDelegation);

    return () => {
      window.removeEventListener("storage", checkDelegation);
    };
  }, []);

  // Load tokens when delegation is enabled
  useEffect(() => {
    if (delegationEnabled && address) {
      loadCreatedTokens();
    }
  }, [delegationEnabled, address]);

  const loadCreatedTokens = async () => {
    try {
      // Get token count
      const count = (await publicClient.readContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getTokenCount",
      })) as bigint;

      if (count > BigInt(0)) {
        // Get all tokens
        const tokenAddresses = (await publicClient.readContract({
          address: FACTORY_CONTRACT_ADDRESS,
          abi: FACTORY_ABI,
          functionName: "getAllTokens",
        })) as `0x${string}`[];

        // We'll check localStorage for any additional token info we've saved
        const newTokens = [];

        for (const tokenAddress of tokenAddresses) {
          // Try to get token info from localStorage
          const storedTokenInfo = localStorage.getItem(
            `token_${tokenAddress.toLowerCase()}`
          );
          let tokenInfo = {
            name: "",
            symbol: "",
            address: tokenAddress,
            transactionHash: "",
          };

          if (storedTokenInfo) {
            tokenInfo = JSON.parse(storedTokenInfo);
          } else {
            // If not in localStorage, try to fetch basic info from the token contract
            try {
              // Basic ERC20 ABI for name and symbol
              const minimalERC20ABI = [
                {
                  inputs: [],
                  name: "name",
                  outputs: [
                    { internalType: "string", name: "", type: "string" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
                {
                  inputs: [],
                  name: "symbol",
                  outputs: [
                    { internalType: "string", name: "", type: "string" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
              ];

              const name = (await publicClient.readContract({
                address: tokenAddress,
                abi: minimalERC20ABI,
                functionName: "name",
              })) as string;

              const symbol = (await publicClient.readContract({
                address: tokenAddress,
                abi: minimalERC20ABI,
                functionName: "symbol",
              })) as string;

              tokenInfo.name = name;
              tokenInfo.symbol = symbol;
            } catch (error) {
              console.log(
                `Couldn't fetch token info for ${tokenAddress}`,
                error
              );
            }
          }

          newTokens.push(tokenInfo);
        }

        setCreatedTokens(newTokens);
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      initialMessages: [
        {
          role: "system",
          content: `You have connected your wallet successfully. Your wallet address is ${address}. ${
            delegationEnabled
              ? "You have delegated token creation permissions to me. I can deploy ERC20 tokens on your behalf through a factory contract. Just ask me to create a token and specify the name, symbol, and initial supply."
              : "You can delegate token creation permissions to me using the delegation manager above. Once set up, I'll be able to create custom ERC20 tokens for you with limited permissions."
          }`,
          id: "system",
        },
      ],
    });

  // Save token info to localStorage when a new token is deployed
  useEffect(() => {
    messages.forEach((message) => {
      if (message.toolInvocations) {
        message.toolInvocations.forEach((toolInvocation) => {
          if (
            toolInvocation.toolName === "deployERC20" &&
            toolInvocation.state === "result"
          ) {
            const { result } = toolInvocation;
            if (
              result.success &&
              result.tokenAddress &&
              result.tokenAddress !== "Address extraction failed"
            ) {
              // Save token info to localStorage
              localStorage.setItem(
                `token_${result.tokenAddress.toLowerCase()}`,
                JSON.stringify({
                  name: result.tokenName,
                  symbol: result.tokenSymbol,
                  address: result.tokenAddress,
                  transactionHash: result.transactionHash,
                })
              );

              // Reload tokens to update the list
              loadCreatedTokens();
            }
          }
        });
      }
    });
  }, [messages]);

  return (
    <div className="h-full w-full space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="border h-[400px] rounded-md p-4 space-y-6 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  <div className="flex w-full justify-start">
                    <div className="w-fit max-w-[80%] bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-md p-3">
                      <p className="text-sm font-medium mb-1">You</p>
                      <p>{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full justify-end">
                    <div className="w-fit max-w-[80%] bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-gray-50 rounded-md p-3">
                      <p className="text-sm font-medium mb-1">AI Assistant</p>
                      <p>{message.content}</p>
                    </div>
                  </div>
                )}
                <div className="mt-2">
                  {message.toolInvocations && (
                    <pre>
                      {JSON.stringify(message.toolInvocations, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
          <form className="flex gap-3 mt-4" onSubmit={handleSubmit}>
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={
                delegationEnabled
                  ? "Ask me to create a token for you..."
                  : "Type a message..."
              }
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Send"
              )}
            </Button>
          </form>
        </div>

        {/* Token List Panel */}
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Your Tokens
                <Badge variant="outline" className="ml-2">
                  {createdTokens.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {createdTokens.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {createdTokens.map((token, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-1">
                        {token.name && (
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{token.name}</p>
                            <Badge variant="secondary">{token.symbol}</Badge>
                          </div>
                        )}
                        <p className="text-xs font-mono break-all text-gray-500 dark:text-gray-400">
                          {token.address}
                        </p>
                        {token.transactionHash && (
                          <a
                            href={`https://sepolia.etherscan.io/token/${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center mt-1"
                          >
                            View Token
                            <ExternalLinkIcon className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : delegationEnabled ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No tokens created yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Ask the AI to create a token for you
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    Delegation not set up
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Set up delegation to create tokens
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
