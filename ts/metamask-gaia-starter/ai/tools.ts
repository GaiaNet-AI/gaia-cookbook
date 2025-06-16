import type { Hex } from "viem";
import type {
  DelegationStruct,
  ExecutionMode,
  ExecutionStruct,
} from "@metamask/delegation-toolkit";
import {
  DelegationStorageClient,
  DelegationStoreFilter,
  DelegationStorageEnvironment,
  DelegationFramework,
  SINGLE_DEFAULT_MODE,
} from "@metamask/delegation-toolkit";
import { tool as createTool } from "ai";
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

// Delegation Storage Singleton
let delegationStorageInstance: DelegationStorageClient | null = null;

// Helper function to log storage configuration
const logStorageConfig = (apiKey?: string, apiKeyId?: string) => {
  console.group("=== Delegation Storage Configuration ===");
  console.log("API Key format check:", {
    exists: !!apiKey,
    length: apiKey?.length,
    firstChars: apiKey?.substring(0, 4),
    lastChars: apiKey?.substring(apiKey.length - 4),
    hasSpecialChars: apiKey?.match(/[^a-zA-Z0-9]/) ? true : false,
  });
  console.log("API Key ID format check:", {
    exists: !!apiKeyId,
    length: apiKeyId?.length,
    firstChars: apiKeyId?.substring(0, 4),
    lastChars: apiKeyId?.substring(apiKeyId.length - 4),
    hasSpecialChars: apiKeyId?.match(/[^a-zA-Z0-9]/) ? true : false,
  });
  console.log("Environment:", DelegationStorageEnvironment.dev);
  console.log(
    "Running on:",
    typeof window !== "undefined" ? "client" : "server"
  );
  console.groupEnd();
};

/**
 * Gets the delegation storage client, initializing it if necessary
 * @returns A configured DelegationStorageClient instance
 */
export const getDelegationStorageClient = (): DelegationStorageClient => {
  if (!delegationStorageInstance) {
    const apiKey = process.env.NEXT_PUBLIC_DELEGATION_STORAGE_API_KEY;
    const apiKeyId = process.env.NEXT_PUBLIC_DELEGATION_STORAGE_API_KEY_ID;

    logStorageConfig(apiKey, apiKeyId);

    if (!apiKey || !apiKeyId) {
      throw new Error("Delegation storage API key and key ID are required");
    }

    try {
      delegationStorageInstance = new DelegationStorageClient({
        apiKey,
        apiKeyId,
        environment: DelegationStorageEnvironment.dev,
        fetcher:
          typeof window !== "undefined" ? window.fetch.bind(window) : undefined,
      });
      console.log("DelegationStorageClient initialized successfully");
    } catch (error) {
      console.error("Error creating DelegationStorageClient:", error);
      throw error;
    }
  }
  return delegationStorageInstance;
};

/**
 * Stores a delegation in the delegation storage service
 * @param delegation The delegation to store
 * @returns The result of the store operation
 */
export const storeDelegation = async (delegation: DelegationStruct) => {
  try {
    console.group("=== Storing Delegation ===");
    console.log("Delegation details:", {
      delegate: delegation.delegate,
      delegator: delegation.delegator,
      hasSignature: !!delegation.signature,
      salt: delegation.salt.toString(),
    });

    const delegationStorageClient = getDelegationStorageClient();
    const result = await delegationStorageClient.storeDelegation(delegation);

    console.log("Delegation stored successfully:", result);
    console.groupEnd();
    return result;
  } catch (error: any) {
    console.error("Delegation storage error:", {
      name: error.name,
      message: error.message,
      status: error.status,
      details: error.details,
      stack: error.stack,
    });
    console.groupEnd();
    throw error;
  }
};

/**
 * Retrieves a delegation chain by its hash
 * @param hash The hash of the delegation chain to retrieve
 * @returns The delegation chain
 */
export const getDelegationChain = async (hash: Hex) => {
  try {
    console.log("Fetching delegation chain for hash:", hash);
    const delegationStorageClient = getDelegationStorageClient();
    const result = await delegationStorageClient.getDelegationChain(hash);
    console.log("Delegation chain fetched:", result);
    return result;
  } catch (error) {
    console.error("Error fetching delegation chain:", error);
    throw error;
  }
};

/**
 * Fetches delegations for a specific address
 * @param address The address to fetch delegations for
 * @param filter Whether to fetch given or received delegations
 * @returns The delegations for the address
 */
export const fetchDelegations = async (
  address: Hex,
  filter: DelegationStoreFilter
) => {
  try {
    console.log(
      "Fetching delegations for address:",
      address,
      "filter:",
      filter
    );
    const delegationStorageClient = getDelegationStorageClient();
    const result = await delegationStorageClient.fetchDelegations(
      address,
      filter
    );
    console.log("Delegations fetched:", result);
    return result;
  } catch (error) {
    console.error("Error fetching delegations:", error);
    throw error;
  }
};

/**
 * Gets delegation info from session storage (if available)
 * @returns The delegation info or null if not found
 */
export const getDelegationInfoFromSession = () => {
  if (typeof window === "undefined") return null;

  try {
    const delegationInfoStr = sessionStorage.getItem("aiDelegateInfo");
    if (!delegationInfoStr) return null;

    return JSON.parse(delegationInfoStr);
  } catch (error) {
    console.error("Error retrieving delegation info from session:", error);
    return null;
  }
};

/**
 * Gets the full delegation from session storage (if available)
 * @returns The full delegation or null if not found
 */
export const getFullDelegationFromSession = () => {
  if (typeof window === "undefined") return null;

  try {
    const delegationStr = sessionStorage.getItem("delegation");
    if (!delegationStr) return null;

    const delegation = JSON.parse(delegationStr);

    // Convert string salt back to BigInt
    if (delegation && typeof delegation.salt === "string") {
      delegation.salt = BigInt(delegation.salt);
    }

    return delegation;
  } catch (error) {
    console.error("Error retrieving delegation from session:", error);
    return null;
  }
};

/**
 * Clears delegation info from session storage
 */
export const clearDelegationSession = () => {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem("aiDelegateInfo");
  sessionStorage.removeItem("delegation");
  sessionStorage.removeItem("aiDelegatePrivateKey");
};



const createTokenTool = createTool({""});

export const tools = {
  createToken: createTokenTool,
};
