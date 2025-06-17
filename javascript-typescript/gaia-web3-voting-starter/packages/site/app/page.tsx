"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ConnectButton } from "@consensys/connect-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReadContract, useWriteContract } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contractAddress, contractAbi } from "@/constants";
import { Vote, Clock, User, CheckCircle2, MessageSquare, ExternalLink } from "lucide-react";
import { createPublicClient, createWalletClient, custom, http, parseAbi, encodeFunctionData } from 'viem';
import { lineaSepolia } from 'viem/chains';
import { toast } from "sonner"; // For notifications
import Chat from "@/components/chat/Chat";
import RobotLogo from "@/components/chat/RobotLogo";

// VotingBase contract ABI for individual voting instances
const votingAbi = [
  {
    "inputs": [],
    "name": "description",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllOptions",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
        ],
        "internalType": "struct VotingBase.Option[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isVotingActive",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votingEnd",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_optionIndex", "type": "uint256" }],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Types
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

export default function Home() {
  const { address, isConnected } = useAccount();
  const [showManualVoting, setShowManualVoting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [votings, setVotings] = useState<string[]>([]);
  const [votingDetails, setVotingDetails] = useState<Record<string, VotingDetails>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    options: ['', ''],
    durationType: 1
  });

  // Initialize public client (keep this)
  const publicClient = createPublicClient({
    chain: lineaSepolia,
    transport: http()
  });

  // Use Wagmi's hook instead (you already have this)
  const { data: walletClient } = useWalletClient();

  // Use deployedVotings array with index
  const fetchVotings = async () => {
    try {
      setIsLoading(true);
      let allVotings: string[] = [];
      let index = 0;
      
      // Keep fetching until we get an error (means we've reached the end)
      while (true) {
        try {
          const votingAddress = await publicClient.readContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'deployedVotings',
            args: [index], // Use number index, not BigInt
          });

          // Break if we get a zero address
          if (!votingAddress || votingAddress === '0x0000000000000000000000000000000000000000') {
            break;
          }

          allVotings.push(votingAddress as string);
          index++;
        } catch (error) {
          // Break the loop if we get an error (means we've reached the end)
          break;
        }
      }

      setVotings(allVotings);

      // Now fetch details for each voting
      for (const votingAddress of allVotings) {
        await fetchVotingDetails(votingAddress);
      }
    } catch (error) {
      handleError(error, 'Failed to fetch votings');
    } finally {
      setIsLoading(false);
    }
  };

  // Load votings when connected
  useEffect(() => {
    if (isConnected) {
      fetchVotings();
    }
  }, [isConnected]);

  // Create new voting
  const { writeContract, isPending } = useWriteContract();

  // Error handling wrapper
  const handleError = (error: any, message: string) => {
    console.error(message, error);
    if (error.message?.includes('user rejected')) {
      toast.error('Transaction rejected by user');
    } else if (error.message?.includes('insufficient funds')) {
      toast.error('Insufficient funds for transaction');
    } else {
      toast.error(`Error: ${message}`);
    }
  };

  // Fetch voting details
  const fetchVotingDetails = async (address: string) => {
    try {
      const [description, options, isActive, votingEnd] = await Promise.all([
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: votingAbi,
          functionName: 'description',
          args: [],
        }),
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: votingAbi,
          functionName: 'getAllOptions',
          args: [],
        }),
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: votingAbi,
          functionName: 'isVotingActive',
          args: [],
        }),
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: votingAbi,
          functionName: 'votingEnd',
          args: [],
        })
      ]);
      
      setVotingDetails(prev => ({
        ...prev,
        [address]: {
          description: description as string,
          options: options as VotingOption[],
          isActive: isActive as boolean,
          remainingTime: (BigInt(votingEnd as bigint) - BigInt(Math.floor(Date.now() / 1000)))
        }
      }));
    } catch (error) {
      handleError(error, 'Failed to fetch voting details');
    }
  };

  // Reset form after submission
  const resetForm = () => {
    setFormData({
      description: '',
      options: ['', ''],
      durationType: 1
    });
  };

  // Create new voting
  const createVoting = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionPending(true);

    try {
      if (!walletClient) {
        throw new Error('Wallet client not initialized');
      }
      
      const [account] = await walletClient.getAddresses();
      
      await writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'createVotingWithPredefinedDuration',
        args: [
          formData.description,
          formData.options.filter(opt => opt !== ''),
          formData.durationType
        ],
      });

      toast.success('Voting created successfully!');
      await fetchVotings();
      resetForm();
    } catch (error) {
      handleError(error, 'Failed to create voting');
    } finally {
      setTransactionPending(false);
    }
  };

  // Cast vote
  const castVote = async (votingAddress: string, optionIndex: number) => {
    setTransactionPending(true);
    try {
      await writeContract({
        address: votingAddress as `0x${string}`,
        abi: votingAbi,
        functionName: 'vote',
        args: [BigInt(optionIndex)],
      });

      toast.success('Vote submitted successfully!');
      await fetchVotingDetails(votingAddress);
    } catch (error) {
      handleError(error, 'Failed to cast vote');
    } finally {
      setTransactionPending(false);
    }
  };

  // Render voting card
  const VotingCard = ({ address }: { address: string }) => {
    const details = votingDetails[address];
    if (!details) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{details.description}</CardTitle>
          <div className="flex flex-col gap-1 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {details.isActive ? 
                `Time remaining: ${formatTime(details.remainingTime)}` : 
                'Voting ended'
              }
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Contract: {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {details.options.map((option, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{option.name}</span>
                <div className="space-x-2">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {option.voteCount.toString()} votes
                  </span>
                  {details.isActive && (
                    <Button
                      onClick={() => castVote(address, index)}
                      disabled={transactionPending}
                      size="sm"
                    >
                      <Vote className="mr-2 h-4 w-4" />
                      Vote
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => setShowManualVoting(false)} 
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <RobotLogo className="h-8 w-8" />
                <span className="ml-2 text-xl font-semibold">AI Voting DApp</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowManualVoting(!showManualVoting)}
                className="flex items-center"
              >
                <Vote className="h-4 w-4 mr-2" />
                {showManualVoting ? 'Show Chat' : 'Manual Voting'}
              </Button>
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!showManualVoting ? (
          <div className="bg-white rounded-lg shadow">
            <Chat 
              votings={votings}
              votingDetails={votingDetails}
              fetchVotings={fetchVotings}
              castVote={castVote}
              createVoting={async (description, options, durationType) => {
                await writeContract({
                  address: contractAddress,
                  abi: contractAbi,
                  functionName: 'createVotingWithPredefinedDuration',
                  args: [description, options, durationType],
                });
              }}
              isConnected={isConnected}
            />
            <div className="flex items-center justify-center pb-4">
              <a 
                href="https://docs.gaianet.ai/intro/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 hover:text-blue-500 transition-colors text-sm"
              >
                <span className="mr-1">Learn more About Gaia</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Existing voting content */}
            {isConnected ? (
              <>
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold">Active Votings</h1>
                  <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                    Create New Voting
                  </Button>
                </div>

                {showCreateForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Voting</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={createVoting} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <Input
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({ ...formData, description: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Options (one per line)
                          </label>
                          {formData.options.map((option, index) => (
                            <Input
                              key={index}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...formData.options];
                                newOptions[index] = e.target.value;
                                setFormData({ ...formData, options: newOptions });
                              }}
                              className="mt-2"
                            />
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                options: [...formData.options, ""],
                              })
                            }
                            className="mt-2"
                          >
                            Add Option
                          </Button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Duration
                          </label>
                          <select
                            value={formData.durationType}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                durationType: parseInt(e.target.value),
                              })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value={1}>1 Hour</option>
                            <option value={2}>1 Day</option>
                            <option value={3}>1 Week</option>
                          </select>
                        </div>
                        <Button type="submit" disabled={transactionPending}>
                          Create Voting
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {isLoading ? (
                  <div className="text-center">Loading votings...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {votings.map((address) => (
                      <VotingCard key={address} address={address} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-4">Welcome to Voting DApp</h2>
                <p className="text-gray-600 mb-4">
                  Please connect your wallet to view and participate in votings.
                </p>
                <ConnectButton />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Utility function to format time
function formatTime(seconds: bigint): string {
  const days = Number(seconds) / (24 * 60 * 60);
  const hours = (Number(seconds) % (24 * 60 * 60)) / (60 * 60);
  const minutes = (Number(seconds) % (60 * 60)) / 60;
  
  if (days >= 1) return `${Math.floor(days)}d ${Math.floor(hours)}h`;
  if (hours >= 1) return `${Math.floor(hours)}h ${Math.floor(minutes)}m`;
  return `${Math.floor(minutes)}m`;
}