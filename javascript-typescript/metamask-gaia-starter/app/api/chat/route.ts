import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import type {
  ExecutionMode,
  ExecutionStruct,
} from "@metamask/delegation-toolkit";
import {
  DelegationStoreFilter,
  DelegationFramework,
  SINGLE_DEFAULT_MODE,
} from "@metamask/delegation-toolkit";
import { z } from "zod";
import { encodeFunctionData } from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { publicClient } from "@/wagmi.config";
import { privateKeyToAccount } from "viem/accounts";
import { bundler, pimlicoClient } from "@/lib/services/bundler";
import { FACTORY_ABI } from "@/constants";
import { getDelegationStorageClient } from "@/delegationStorage";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const openai = createOpenAI({
    baseURL: process.env.GAIA_MODEL_BASE_URL,
    apiKey: process.env.GAIA_API_KEY,
  });

  try {
    // Simple version without tools
    const result = streamText({
      model: openai("llama"),
      system: "You are a helpful assistant.",
      messages,
      tools: {
        createTokenTool: tool({
          description:
            "create a token token with token name, symbol, and total supply",
          parameters: z.object({
            name: z.string().describe("The name of the token"),
            symbol: z.string().describe("The symbol of the token"),
            totalSupply: z.string().describe("The total supply of the token"),
          }),
          execute: async ({ name, symbol, totalSupply }) => {
            const aiAccount = privateKeyToAccount(
              "0xd02f38f8a3c1ce96a09a2049cc86e2469e350f54ddbf13e7322259559edea629"
            );

            const aiSmartAccount = await toMetaMaskSmartAccount({
              client: publicClient,
              implementation: Implementation.Hybrid,
              deployParams: [aiAccount.address, [], [], []],
              deploySalt: "0x1231245", // need to store this somewhere to  be able to access this wallet later
              signatory: { account: aiAccount },
            });

            console.log(
              "Fetching delegations for address:",
              aiSmartAccount.address
            );
            const delegationStorageClient = getDelegationStorageClient();
            const result = await delegationStorageClient.fetchDelegations(
              aiSmartAccount.address,
              DelegationStoreFilter.Given
            );

            console.log("Delegations: ", result, "Delegate: ", aiSmartAccount.address);

            const mode: ExecutionMode = SINGLE_DEFAULT_MODE;

            try {
              const createTokenCalldata = encodeFunctionData({
                abi: FACTORY_ABI,
                functionName: "createToken",
                args: [name, symbol, totalSupply],
              });

              const executions: ExecutionStruct[] = [
                {
                  target: process.env
                    .NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS! as `0x${string}`, // the address being called as a hex string
                  value: BigInt(0), // the value of the call as a bigint
                  callData: createTokenCalldata,
                },
              ];

              const redeemDelegationCalldata =
                DelegationFramework.encode.redeemDelegations(
                  [result],
                  [mode],
                  [executions]
                );

              const { fast: fees } =
                await pimlicoClient.getUserOperationGasPrice();

              const userOperationHash = await bundler.sendUserOperation({
                account: aiSmartAccount,
                calls: [
                  {
                    to: aiSmartAccount.address,
                    data: redeemDelegationCalldata,
                  },
                ],
                ...fees,
              });

              console.log("User operation hash:", userOperationHash);

              return {
                userOperationHash,
              };
            } catch (error) {
              console.log("Error:", error);
              return {
                error: error,
              };
            }
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API route:", error);
    // Add more detailed error logging
    console.log("Error details:", JSON.stringify(error, null, 2));
    return new Response("Internal server error", { status: 500 });
  }
}
