// client.js
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import inquirer from "inquirer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const BASE_SERVER_URL = process.env.CLIENT_TARGET_SERVER_BASE_URL || "http://localhost:4021";
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || baseSepolia.rpcUrls.default.http[0];
const BURNER_WALLET_PRIVATE_KEY = process.env.BURNER_WALLET_PRIVATE_KEY;

// Endpoint configurations (paths and models are fairly static, prices are for display from .env)
const ENDPOINT_CONFIGS = {
  full: {
    path: "/api/gaia/chat",
    description: "Full Chat Completion (e.g., detailed explanation)",
    price: process.env.CLIENT_DISPLAY_PRICE_FULL || "$0.001",
    model: "llama70b", // Model could also be in .env if frequently changed per endpoint
  },
  summary: {
    path: "/api/gaia/chat/summary",
    description: "Text Summarization (e.g., summarize this text)",
    price: process.env.CLIENT_DISPLAY_PRICE_SUMMARY || "$0.0008",
    model: "llama70b",
  },
  oneWord: {
    path: "/api/gaia/chat/one-word",
    description: "One-Word Answer (e.g., main topic of this text)",
    price: process.env.CLIENT_DISPLAY_PRICE_ONE_WORD || "$0.0002",
    model: "llama70b",
  },
};

// Validate essential client configurations
if (!BURNER_WALLET_PRIVATE_KEY) {
  console.error("FATAL ERROR: BURNER_WALLET_PRIVATE_KEY is not set in the .env file.");
  console.error("This private key is for the client's temporary wallet to make payments.");
  process.exit(1);
}
if (BURNER_WALLET_PRIVATE_KEY === "0xYourBurnerPrivateKeyHere" || BURNER_WALLET_PRIVATE_KEY.length !== 66) {
    console.warn("\n!!! WARNING: Please set a valid BURNER_WALLET_PRIVATE_KEY in the .env file for the client. !!!\n");
    // Potentially exit if it's clearly a placeholder, or let it fail at account creation.
}


let burnerAccount;
try {
  burnerAccount = privateKeyToAccount(BURNER_WALLET_PRIVATE_KEY);
} catch (error) {
  console.error("FATAL ERROR: Invalid BURNER_WALLET_PRIVATE_KEY in .env file.", error.message);
  process.exit(1);
}

console.log("--------------------------------------------------------------------");
console.log("🔥 Using Burner Wallet for this session (from .env via x402-fetch) 🔥");
console.log(`Address: ${burnerAccount.address}`);
console.log("ACTION REQUIRED: Before proceeding, please fund this address with:");
console.log("1. USDC on Base Sepolia (for API payments - amounts vary by endpoint)");
console.log("   Check endpoint costs when selecting an option.");
console.log("Once funded, the script will allow you to choose an API and make a call.");
console.log("--------------------------------------------------------------------");

await new Promise(resolve => {
    process.stdin.once('data', () => {
        console.log("Continuing...");
        resolve();
    });
    console.log("Press ENTER to continue after funding the address above...");
});

const account = burnerAccount;

const publicClient = createWalletClient({
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC_URL),
}).extend(publicActions);

const fetchWithPayment = wrapFetchWithPayment(fetch, account, {
    publicClient: publicClient,
});

async function callPaidGaiaApi(endpointConfig, userContent) {
  const PROTECTED_API_URL = BASE_SERVER_URL + endpointConfig.path;
  console.log(`\nAttempting to call: POST ${PROTECTED_API_URL} for "${endpointConfig.description}"`);
  console.log(`Estimated cost (display only, server determines actual): ${endpointConfig.price}`);
  console.log(`Using wallet address: ${account.address}`);

  const payload = {
    model: endpointConfig.model,
    messages: [ { role: "user", content: userContent } ],
  };

  try {
    const response = await fetchWithPayment(PROTECTED_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorBody = `HTTP error! status: ${response.status}`;
      try { const errorJson = await response.json(); errorBody += ` - ${JSON.stringify(errorJson)}`; } catch (e) {/* ignore */}
      throw new Error(errorBody);
    }

    const responseData = await response.json();
    console.log("\n✅ API Call Successful!");
    console.log("Status:", response.status);
    console.log("Gaia API Response Data:", JSON.stringify(responseData, null, 2));

    const xPaymentResponseHeader = response.headers.get("x-payment-response");
    if (xPaymentResponseHeader) {
      try {
        const paymentReceipt = decodeXPaymentResponse(xPaymentResponseHeader);
        console.log("\n🧾 Payment Receipt Details (from x-payment-response header):");
        console.log(JSON.stringify(paymentReceipt, null, 2));
      } catch (e) {
        console.warn("Could not decode x-payment-response header:", e.message);
      }
    } else {
        console.log("\n(No x-payment-response header found on the final successful response, which is normal as payment is already handled by the wrapper)")
    }
  } catch (error) {
    console.error("\n❌ API Call Failed!");
    if (error.message.startsWith("HTTP error!")) {
        console.error("Error details:", error.message);
    } else if (error.response && error.response.data) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        if (error.response.status === 402) {
         console.error("This is a 402 Payment Required error. The x402-fetch wrapper should handle this.");
         console.error("Ensure your wallet has enough USDC for payment on Base Sepolia for the selected service.");
        }
    } else {
        console.error("Error Message:", error.message);
    }
    console.error("\nDEBUGGING INFO:");
    console.error(`- Server running at ${BASE_SERVER_URL}? (Check CLIENT_TARGET_SERVER_BASE_URL in .env)`);
    console.error(`- Wallet ${account.address} funded (USDC)?`);
    console.error(`- RPC URL '${BASE_SEPOLIA_RPC_URL}' correct & accessible? (Check BASE_SEPOLIA_RPC_URL in .env)`);
  }
}

async function main() {
  let keepGoing = true;
  while (keepGoing) {
    const { chosenEndpointKey } = await inquirer.prompt([
      {
        type: "list",
        name: "chosenEndpointKey",
        message: "Which Gaia API service would you like to use?",
        choices: Object.keys(ENDPOINT_CONFIGS).map(key => ({
            name: `${ENDPOINT_CONFIGS[key].description} (Cost: ${ENDPOINT_CONFIGS[key].price})`,
            value: key,
        })),
      },
    ]);

    const selectedConfig = ENDPOINT_CONFIGS[chosenEndpointKey];
    const { userPrompt } = await inquirer.prompt([
      {
        type: "input",
        name: "userPrompt",
        message: `Enter your prompt for "${selectedConfig.description}":`,
        validate: (input) => input.trim().length > 0 || "Prompt cannot be empty.",
      },
    ]);

    await callPaidGaiaApi(selectedConfig, userPrompt);

    const { anotherOne } = await inquirer.prompt([
      { type: "confirm", name: "anotherOne", message: "Do you want to make another API call?", default: true },
    ]);
    keepGoing = anotherOne;
  }
  console.log("\n👋 Exiting Gaia API client. Goodbye!");
}

if (typeof fetch === 'undefined') {
    console.error("Global 'fetch' is not defined. Node.js 18+ is recommended.");
} else {
    main().catch(error => {
      console.error("An unexpected error occurred in the main application:", error);
    });
}