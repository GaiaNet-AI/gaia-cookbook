import type { Hex } from "viem";
import type { DelegationStruct } from "@metamask/delegation-toolkit";
import {
  DelegationStorageClient,
  DelegationStoreFilter,
  DelegationStorageEnvironment,
} from "@metamask/delegation-toolkit";

let instance: DelegationStorageClient | null = null;

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
  console.log("Running on:", typeof window !== "undefined" ? "client" : "server");
  console.groupEnd();
};

export const getDelegationStorageClient = (): DelegationStorageClient => {
  if (!instance) {
    const apiKey = process.env.NEXT_PUBLIC_DELEGATION_STORAGE_API_KEY;
    const apiKeyId = process.env.NEXT_PUBLIC_DELEGATION_STORAGE_API_KEY_ID;

    // Log configuration for debugging
    logStorageConfig(apiKey, apiKeyId);

    if (!apiKey || !apiKeyId) {
      throw new Error("Delegation storage API key and key ID are required");
    }

    try {
      instance = new DelegationStorageClient({
        apiKey,
        apiKeyId,
        environment: DelegationStorageEnvironment.dev,
        // fetcher: typeof window !== "undefined" ? window.fetch.bind(window) : undefined,
      });
      console.log("DelegationStorageClient initialized successfully");
    } catch (error) {
      console.error("Error creating DelegationStorageClient:", error);
      throw error;
    }
  }
  return instance;
};

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

export const fetchDelegations = async (
  address: Hex,
  filter: DelegationStoreFilter, // <-- Proper enum type
) => {
  try {
    console.log("Fetching delegations for address:", address, "filter:", filter);
    const delegationStorageClient = getDelegationStorageClient();
    const result = await delegationStorageClient.fetchDelegations(address, filter);
    console.log("Delegations fetched:", result);
    return result;
  } catch (error) {
    console.error("Error fetching delegations:", error);
    throw error;
  }
};

export { DelegationStoreFilter };