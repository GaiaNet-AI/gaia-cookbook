// server.js
import express from "express";
import { paymentMiddleware } from "x402-express";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

// --- Configuration from .env ---
const PORT = process.env.PORT || 4021;
const YOUR_RECEIVING_WALLET_ADDRESS = process.env.RECEIVING_WALLET_ADDRESS;
const GAIA_API_KEY = process.env.GAIA_API_KEY;
const GAIA_API_URL = process.env.GAIA_API_URL;

const PRICE_FULL_COMPLETION = process.env.PRICE_FULL_COMPLETION || "$0.001";
const PRICE_SUMMARY = process.env.PRICE_SUMMARY || "$0.0008";
const PRICE_ONE_WORD = process.env.PRICE_ONE_WORD || "$0.0002";

const NETWORK = process.env.NETWORK || "base-sepolia";
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.org/facilitator";

// Validate essential configurations
if (!YOUR_RECEIVING_WALLET_ADDRESS) {
  console.error("FATAL ERROR: RECEIVING_WALLET_ADDRESS is not set in the .env file.");
  process.exit(1);
}
if (!GAIA_API_KEY) {
  console.error("FATAL ERROR: GAIA_API_KEY is not set in the .env file.");
  process.exit(1);
}
if (YOUR_RECEIVING_WALLET_ADDRESS === "0xYourActualReceivingWalletAddressHere") {
    console.warn("\n!!! WARNING: Please set your actual RECEIVING_WALLET_ADDRESS in the .env file !!!\n");
}
if (GAIA_API_KEY === "gaia-YourGaiaAPIKeyHere") {
    console.warn("\n!!! WARNING: Please set your actual GAIA_API_KEY in the .env file !!!\n");
}


// System prompts for guiding the Gaia Node's model
const SYSTEM_PROMPT_SUMMARY = "You are a helpful assistant. Please provide a concise summary (e.g., 2-3 sentences) of the user's last message. If the user's message is a question, summarize the topic of the question.";
const SYSTEM_PROMPT_ONE_WORD = "You are a helpful assistant. Please provide a single-word answer or the most relevant single keyword based on the user's last message. If it's a question, provide a one-word answer if possible. Be extremely concise.";

// --- Payment Middleware Setup ---
app.use(
  paymentMiddleware(
    YOUR_RECEIVING_WALLET_ADDRESS,
    {
      "POST /api/gaia/chat": {
        price: PRICE_FULL_COMPLETION,
        network: NETWORK,
        description: "Chat Completions API (Full Response)",
      },
      "POST /api/gaia/chat/summary": {
        price: PRICE_SUMMARY,
        network: NETWORK,
        description: "Text Summarization Service",
      },
      "POST /api/gaia/chat/one-word": {
        price: PRICE_ONE_WORD,
        network: NETWORK,
        description: "One-Word Answer Service",
      },
    },
    {
      url: FACILITATOR_URL,
    }
  )
);

// Helper function to call the Gaia API
async function callGaiaApi(payload, res, endpointName) {
  console.log(`Proxying request to Gaia API for ${endpointName}...`);
  console.log("Payload to Gaia API:", JSON.stringify(payload, null, 2));
  try {
    const gaiaResponse = await axios.post(GAIA_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${GAIA_API_KEY}`
      },
    });
    res.status(gaiaResponse.status).json(gaiaResponse.data);
  } catch (error) {
    console.error(`Error proxying to Gaia API for ${endpointName}:`);
    if (error.response) {
      console.error("Data:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
      res
        .status(error.response.status)
        .json(error.response.data || { message: "Error from Gaia API" });
    } else if (error.request) {
      console.error("Request:", error.request);
      res.status(504).json({ message: "No response from Gaia API (Gateway Timeout)" });
    } else {
      console.error("Error Message:", error.message);
      res.status(500).json({ message: "Internal server error while proxying" });
    }
  }
}

app.post("/api/gaia/chat", async (req, res) => {
  console.log(`Payment successful for /api/gaia/chat. Forwarding request...`);
  console.log("Request body received:", req.body);
  await callGaiaApi(req.body, res, "/api/gaia/chat");
});

app.post("/api/gaia/chat/summary", async (req, res) => {
  console.log(`Payment successful for /api/gaia/chat/summary. Preparing summary request...`);
  console.log("Original request body:", req.body);
  const { messages: originalMessages = [], model = "llama70b", ...otherParams } = req.body;
  const summaryPayload = {
    model: model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT_SUMMARY },
      ...originalMessages
    ],
    ...otherParams,
  };
  await callGaiaApi(summaryPayload, res, "/api/gaia/chat/summary");
});

app.post("/api/gaia/chat/one-word", async (req, res) => {
  console.log(`Payment successful for /api/gaia/chat/one-word. Preparing one-word answer request...`);
  console.log("Original request body:", req.body);
  const { messages: originalMessages = [], model = "llama70b", ...otherParams } = req.body;
  const oneWordPayload = {
    model: model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT_ONE_WORD },
      ...originalMessages
    ],
    ...otherParams,
    max_tokens: 10,
  };
  await callGaiaApi(oneWordPayload, res, "/api/gaia/chat/one-word");
});

app.get("/", (req, res) => {
  res.send(
    `Gaia API Proxy with x402 payment is running. Protected endpoints:
    <ul>
      <li>POST /api/gaia/chat (Full Completion, Price: ${PRICE_FULL_COMPLETION})</li>
      <li>POST /api/gaia/chat/summary (Summarization, Price: ${PRICE_SUMMARY})</li>
      <li>POST /api/gaia/chat/one-word (One-Word Answer, Price: ${PRICE_ONE_WORD})</li>
    </ul>`
  );
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  console.log(`Your receiving wallet address: ${YOUR_RECEIVING_WALLET_ADDRESS}`);
  console.log(`GAIA_API_URL: ${GAIA_API_URL}`);
  console.log("\nProtected Endpoints & Prices (on " + NETWORK + "):");
  console.log(`- POST /api/gaia/chat (Price: ${PRICE_FULL_COMPLETION})`);
  console.log(`- POST /api/gaia/chat/summary (Price: ${PRICE_SUMMARY})`);
  console.log(`- POST /api/gaia/chat/one-word (Price: ${PRICE_ONE_WORD})`);
  console.log(`Facilitator URL: ${FACILITATOR_URL}`);
});