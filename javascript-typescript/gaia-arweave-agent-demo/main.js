require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const readline = require('readline');
const { Configuration, StorageApi, Network, Token } = require('arweave-storage-sdk');
const { OpenAI } = require('openai');

// Gaia Node setup
const openai = new OpenAI({
  apiKey: process.env.GAIA_API_KEY,
  baseURL: process.env.GAIA_NODE_URL
});

// Arweave SDK setup
const config = new Configuration({
  appName: "Gaia Arweave CLI",
  privateKey: process.env.PRIVATE_KEY,
  network: Network.BASE_TESTNET,
  token: Token.USDC
});
const storageClient = new StorageApi(config);

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.get('/agent-demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agent-demo.html'));
});

// WebSocket Setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('chat_message', async (message) => {
    try {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant. Respond purely based on what you know. Do not call or use any external tools or plugins in your response. ' },
        ...message.history,
        { role: 'user', content: message.input }
      ];

      const resp = await openai.chat.completions.create({
        model: process.env.GAIA_MODEL || "gpt-3.5-turbo",
        messages
      });
      //console.log("Gaia Node response:", JSON.stringify(resp.choices, null, 2)); // Debugging
      const reply = resp.choices[0].message.content;

      // Emit response back to the client
      socket.emit('gaia_response', reply);
    } catch (error) {
      console.error("❌ Error:", error.message || error);
      socket.emit('error', error.message || error);
    }
  });
});

// API Endpoint: Get Arweave Upload Estimates
app.post('/get-estimates', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: 'Transcript is required' });
  }

  try {
    const buffer = Buffer.from(transcript, 'utf-8');
    await storageClient.api.login();
    const estimates = await storageClient.getEstimates(buffer.length);
    res.json(estimates);
  } catch (error) {
    console.error('Error getting estimates:', error);
    res.status(500).json({ error: 'Failed to get estimates', details: error.message });
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API Endpoint: Upload Transcript to Arweave
app.post('/upload-transcript', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: 'Transcript is required' });
  }

  try {
    const buffer = Buffer.from(transcript, 'utf-8');
    const receipt = await storageClient.quickUpload(buffer, {
      name: `gaia-chat-${Date.now()}.txt`,
      overrideFileName: true,
      dataContentType: 'text/plain',
      visibility: 'public',
      size: buffer.length,
      tags: [
        { name: "App", value: "GaiaArweaveChat" },
        { name: "Wallet", value: process.env.PRIVATE_KEY }, // Replace with user wallet later
        { name: "Gaia-Endpoint", value: process.env.GAIA_NODE_URL },
        { name: "Model", value: process.env.GAIA_MODEL },
        { name: "Timestamp", value: new Date().toISOString() }
      ]
    });

    console.log("Upload Receipt (containing uploadId):", JSON.stringify(receipt, null, 2));
    
    let arweaveTxId = null;
    let uploadDetails = null;
    const maxRetries = 10; // Try up to 10 times
    const retryDelayMs = 3000; // Wait 3 seconds between tries

    console.log("Attempting to fetch Arweave Tx ID...");
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to fetch upload details for ID: ${receipt.uploadId}`);
            uploadDetails = await storageClient.api.upload.getUploadById(receipt.uploadId);
            console.log(`Attempt ${attempt} successful. Upload Details:`, JSON.stringify(uploadDetails, null, 2));

            arweaveTxId = uploadDetails.arweaveTxId;

            if (arweaveTxId) {
                console.log(`Found Arweave Tx ID: ${arweaveTxId}`);
                break; // Success, exit the loop
            } else {
                console.warn(`Attempt ${attempt}: arweaveTxId not found in upload details yet. Status: ${uploadDetails.status}. Retrying in ${retryDelayMs}ms...`);
            }
        } catch (fetchTxError) {
            console.error(`Attempt ${attempt}: Error fetching upload details:`, fetchTxError.message || fetchTxError);
        }

        if (attempt < maxRetries) {
            console.log(`Waiting ${retryDelayMs}ms before next attempt...`);
            await sleep(retryDelayMs);
        }
    }

    if (!arweaveTxId) {
        console.warn(`Warning: Could not retrieve Arweave Tx ID after ${maxRetries} attempts. Upload might still be processing.`);
        console.warn(`Receipt ID provided: ${receipt.id}`);
        // We can still return the receipt ID. The user can potentially check status later.
        // Or, we could return an error indicating it's not ready yet.
        // Let's return the receipt ID for now, but indicate the Tx ID is pending.
    }

    // Send back the receipt, the arweaveTxId (if found), and a pre-built link if possible
    res.json({
        receipt: receipt,
        arweaveTxId: arweaveTxId,
        link: arweaveTxId ? `https://arweave.net/${arweaveTxId}` : null,
        message: arweaveTxId ? "Upload successful!" : "Upload initiated. Arweave transaction ID pending. Check back shortly or use the Receipt ID with the service's status API."
    });
    
    
  } catch (error) {
    console.error('Error uploading transcript:', error);
    // Handle specific errors like insufficient funds
    if (error.message && error.message.includes('Insufficient funds')) {
         res.status(402).json({ error: 'Upload failed: Insufficient funds in app wallet.', details: error.message }); // 402 Payment Required
    } else {
         res.status(500).json({ error: 'Failed to upload transcript', details: error.message });
    }
  }
});

// This fetches uploads associated with the wallet configured in the SDK (process.env.PRIVATE_KEY)
app.get('/get-my-uploads', async (req, res) => {
  try {
    // Ensure the SDK is logged in using the app's credentials
    await storageClient.api.login();
    console.log("Fetching uploads for app wallet...");

    const uploadsResponse = await storageClient.api.upload.getUploads({
      // Example parameters - adjust based on SDK docs
      limit: 20, // Number of items per page
      page: 1   // Page number (1-indexed)
      // offset: 0, // Alternative to page, if supported
      // sort: 'createdAt:desc' // Example sorting, if supported
    });
    let uploads = [];
    if (Array.isArray(uploadsResponse)) {
      uploads = uploadsResponse;
    } else if (uploadsResponse && Array.isArray(uploadsResponse.data)) {
      uploads = uploadsResponse.data;
    } else {
      console.warn("Unexpected uploads response structure:", uploadsResponse);
      uploads = [];
    }

    console.log(`Fetched ${uploads.length} uploads.`); // Log number of uploads

    // Send the list of uploads back to the frontend
    res.json(uploads);
  } catch (error) {
    console.error('Error fetching uploads:', error);

    // Provide more specific error messages based on common issues
    if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        res.status(401).json({ error: 'Unauthorized: Please check app wallet configuration.' });
    } else if (error.message && error.message.includes('login')) {
         res.status(500).json({ error: 'Backend configuration error: App wallet login failed for fetching uploads.', details: error.message });
    } else {
        res.status(500).json({ error: 'Failed to fetch uploads', details: error.message });
    }
  }
});

app.post('/agent-chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. Prepare messages for Gaia, including system prompt with tool definitions
    const systemPrompt = `
You are a helpful AI assistant integrated with Arweave storage tools.
You can perform actions like storing data or retrieving lists of items.
When a user asks you to do something related to Arweave storage, use the appropriate tool.
Always respond in a helpful and informative way.
If a tool provides a link, make sure to include it in your final response.
If a tool operation fails, explain the error to the user.

Available Tools:
1. store_chat_on_arweave: Stores the provided chat transcript to Arweave.
   Arguments:
     - transcript (string): The full text of the chat to store.
2. retrieve_user_chats: Retrieves a list of chats stored by the user (associated with the app wallet).
   Arguments:
     - limit (number, optional): Maximum number of chats to retrieve (default 10).
`;

    const messagesForGaia = [
      { role: 'system', content: systemPrompt.trim() },
      ...history, // Include conversation history
      { role: 'user', content: message }
    ];

    // 2. Define the tools for Gaia
    // Consult your Gaia node's documentation for the exact format.
    // This is a common OpenAI-like structure.
    const tools = [
    {
      type: "function",
      function: {
        name: "store_chat_on_arweave",
        description: "Store the provided chat transcript to Arweave using the app's wallet and return the link.",
        parameters: {
          type: "object",
          properties: {
            transcript: {
              type: "string",
              description: "The full text of the chat conversation to store."
            }
          },
          required: ["transcript"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "store_gaia_config_on_arweave",
        description: "Automatically fetch the public configuration from the Gaia node (GAIA_NODE_URL env var + /config_pub.json) and store it on Arweave.",
        parameters: {
          type: "object",
          properties: {}, // No arguments needed from the AI
          required: []
        }
      }
    },
    {
      type: "function",
      function: {
        name: "check_transaction_status",
        description: "Check the status of an Arweave upload transaction using its Receipt ID.",
        parameters: {
          type: "object",
          properties: {
            receipt_id: {
              type: "string",
              description: "The unique Receipt ID returned by the upload process."
            }
          },
          required: ["receipt_id"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "list_user_uploads",
        description: "Retrieve a list of recent uploads made by the app's wallet on Arweave.",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Maximum number of recent uploads to retrieve (default 10).",
              minimum: 1,
              maximum: 50
            }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_wallet_balance",
        description: "Get the current balance of the app's wallet for the configured token (e.g., USDC) on the specified network.",
        parameters: {
          type: "object",
          properties: {} // No specific arguments needed
        }
      }
    },
    {
      type: "function",
      function: {
        name: "search_files_by_tag",
        description: "Search for files uploaded by the app based on specific tags.",
        parameters: {
          type: "object",
          properties: {
            tags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" } // Exact match for value
                },
                required: ["name"] // Value is optional for search
              },
              description: "An array of tag objects to search for. e.g., [{ name: 'App', value: 'GaiaArweaveAgentDemo' }]"
            }
          },
          required: ["tags"]
        }
      }
    }
    // Add more tools here as needed
  ];

    // 3. Initial call to Gaia
    console.log("Calling Gaia with tools...");
    const gaiaResp1 = await openai.chat.completions.create({
      model: process.env.GAIA_MODEL || "gpt-3.5-turbo",
      messages: messagesForGaia,
      tools: tools, // Pass the tools
      tool_choice: "auto" // Let Gaia decide when to use them
    });

    const gaiaMessage1 = gaiaResp1.choices[0].message;
    console.log("Gaia Response 1:", JSON.stringify(gaiaMessage1, null, 2));

    // Prepare response data
    const responseData = {
      final_response: gaiaMessage1.content || "Agent performed actions.", // Initial response content
      tool_calls: gaiaMessage1.tool_calls || [], // Any tool calls requested
      tool_results: [] // To store results of tool executions
    };

    // 4. Check for and execute tool calls
    if (gaiaMessage1.tool_calls && gaiaMessage1.tool_calls.length > 0) {
      // Append the assistant's message (containing tool calls) to history for the next call
      messagesForGaia.push(gaiaMessage1);

      // Execute each tool call
      for (const toolCall of gaiaMessage1.tool_calls) {
        const toolName = toolCall.function.name;
        let parsedToolArgs; // Use a clear variable name for the parsed object
        try {
          // Parse the JSON string provided by Gaia into a JavaScript object
          parsedToolArgs = JSON.parse(toolCall.function.arguments);
          console.log(`Executing tool: ${toolName}`, parsedToolArgs); // Log the parsed object
        } catch (parseError) {
          console.error(`Error parsing arguments for tool ${toolName}:`, toolCall.function.arguments, parseError);
          responseData.tool_results.push({
            tool_name: toolName,
            error: `Failed to parse arguments: ${parseError.message}`
          });
          continue; // Skip this tool call
        }

        console.log(`Executing tool: ${toolName}`, parsedToolArgs);

        let toolResult;
        let toolError = null;

        try {
          if (toolName === "store_chat_on_arweave") {
            console.log("Reconstructing full chat transcript for storage...");

            // 1. Start with the history provided by the frontend
            let fullTranscriptLines = [];

            // Add history messages
            if (Array.isArray(history)) {
              history.forEach(msg => {
                if (msg.role && msg.content !== undefined) {
                  fullTranscriptLines.push(`${msg.role.toUpperCase()}: ${msg.content}`);
                }
              });
            }

            // 2. Add the latest user message that triggered this tool call
            fullTranscriptLines.push(`USER: ${message}`); 

            // 3. Add the AI's request to store the chat (this tool call message)
            fullTranscriptLines.push(`ASSISTANT: (Initiating storage of the conversation upon user request.)`);

            // 4. Join the lines into a single string
            const fullTranscript = fullTranscriptLines.join('\n\n');

            console.log("Full transcript reconstructed (first 200 chars):", fullTranscript.substring(0, 200) + (fullTranscript.length > 200 ? '...' : ''));

            if (!fullTranscript.trim()) {
              throw new Error("Cannot store chat: Reconstructed transcript is empty.");
            }

            // 5. Proceed with the upload using the reconstructed full transcript
            await storageClient.api.login();
            const buffer = Buffer.from(fullTranscript, 'utf-8');
            const receipt = await storageClient.quickUpload(buffer, {
              name: `agent-chat-full-${Date.now()}.txt`,
              overrideFileName: true,
              dataContentType: 'text/plain',
              visibility: 'public',
              size: buffer.length,
              tags: [
                { name: "App", value: "GaiaArweaveAgentDemo" },
                { name: "Action", value: "StoreFullChat" },
                { name: "Gaia-Endpoint", value: process.env.GAIA_NODE_URL },
                { name: "Model", value: process.env.GAIA_MODEL },
                { name: "Timestamp", value: new Date().toISOString() }
              ]
            });

            let arweaveTxId = null;
            const maxRetries = 5;
            const retryDelayMs = 2000;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const uploadDetails = await storageClient.api.upload.getUploadById(receipt.id);
                    arweaveTxId = uploadDetails.arweaveTxId;
                    if (arweaveTxId) break;
                } catch (fetchTxError) {
                    console.error(`Attempt ${attempt}: Error fetching Tx ID:`, fetchTxError.message);
                }
                if (attempt < maxRetries) {
                    console.log(`Waiting ${retryDelayMs}ms before retry ${attempt + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                }
            }

            if (arweaveTxId) {
              toolResult = {
                status: "success",
                message: "Chat stored successfully.",
                link: `https://arweave.net/${arweaveTxId}`,
                receipt_id: receipt.uploadId
              };
            } else {
              toolResult = {
                status: "pending",
                message: "Upload initiated, but Arweave transaction ID is pending. Check back later using the Receipt ID.",
                receipt_id: receipt.uploadId
              };
            }

          } else if (toolName === "store_gaia_config_on_arweave") {
              try {
                // 1. Get the Gaia Node URL from environment variables
                const gaiaNodeUrlEnv = process.env.GAIA_NODE_URL;
                if (!gaiaNodeUrlEnv) {
                  throw new Error("GAIA_NODE_URL is not set in the environment variables.");
                }

                let baseUrl = gaiaNodeUrlEnv.replace(/\/(v\d+|api)\/?$/, '');

                if (!baseUrl.endsWith('/')) {
                    baseUrl += '/';
                }
                const configUrl = `${baseUrl}config_pub.json`;

                console.log(`Fetching Gaia config from: ${configUrl}`);

                // 3. Fetch the configuration data
                const fetch = global.fetch || (await import('node-fetch')).default;

                const configResponse = await fetch(configUrl);
                if (!configResponse.ok) {
                  throw new Error(`Failed to fetch config from ${configUrl}. Status: ${configResponse.status} ${configResponse.statusText}`);
                }

                // 4. Get the raw text content of the config
                const configTextContent = await configResponse.text();
                console.log("Fetched config content (first 200 chars):", configTextContent.substring(0, 200) + (configTextContent.length > 200 ? '...' : ''));

                // 5. Prepare data for upload using arweave-storage-sdk
                await storageClient.api.login(); 

                const buffer = Buffer.from(configTextContent, 'utf-8');
                const fileName = `gaia-config-${new Date().toISOString().split('T')[0]}.txt`; // e.g., gaia-config-2025-08-05.txt

                const receipt = await storageClient.quickUpload(buffer, {
                  name: fileName,
                  overrideFileName: true,
                  dataContentType: 'text/plain', // Store as plain text
                  visibility: 'public',
                  size: buffer.length,
                  tags: [
                    { name: "App", value: "GaiaArweaveAgentDemo" },
                    { name: "Action", value: "StoreConfig" },
                    { name: "Gaia-Endpoint", value: gaiaNodeUrlEnv }, // Tag with the original endpoint
                    { name: "Config-Source-URL", value: configUrl }, // Tag with the fetched URL
                    { name: "Content-Type", value: "application/json" }, // Indicate original format in tags
                    { name: "Timestamp", value: new Date().toISOString() }
                    // The upload is done using the app's wallet (PRIVATE_KEY).
                  ]
                });

                console.log("Config upload receipt:", JSON.stringify(receipt, null, 2));

                // 6. Get Arweave Tx ID (with retry)
                let arweaveTxId = null;
                const maxRetries = 5;
                const retryDelayMs = 2000;
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        const uploadDetails = await storageClient.api.upload.getUploadById(receipt.id);
                        arweaveTxId = uploadDetails.arweaveTxId;
                        if (arweaveTxId) break;
                    } catch (fetchTxError) {
                        console.error(`Attempt ${attempt}: Error fetching Config Tx ID:`, fetchTxError.message);
                    }
                    if (attempt < maxRetries && !arweaveTxId) {
                        console.log(`Waiting ${retryDelayMs}ms before retry ${attempt + 1}...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                    }
                }

                // 7. Prepare tool result
                if (arweaveTxId) {
                  toolResult = {
                    status: "success",
                    message: "Gaia node configuration stored successfully.",
                    link: `https://arweave.net/${arweaveTxId}`,
                    receipt_id: receipt.uploadId,
                    stored_file_name: fileName
                  };
                } else {
                  toolResult = {
                    status: "pending",
                    message: "Config upload initiated, but Arweave transaction ID is pending. Check back later using the Receipt ID.",
                    receipt_id: receipt.uploadId,
                    stored_file_name: fileName
                  };
                }

              } catch (configError) {
                console.error(`Error in store_gaia_config_on_arweave tool:`, configError);
                toolError = `Failed to store Gaia config: ${configError.message}`;
              }
            } else if (toolName === "check_transaction_status") {
              const { receipt_id } = parsedToolArgs;
              if (!receipt_id) {
                throw new Error("Missing 'receipt_id' argument for check_transaction_status");
              }

              console.log(`Checking status for receipt ID: ${receipt_id}`);

              try {
                await storageClient.api.login();

              
                const limit = 20;
                let foundUpload = null;
                let page = 1;
                let hasMorePotential = true;

                while (!foundUpload && hasMorePotential) {
                    const uploadsResponse = await storageClient.api.upload.getUploads({
                        page: page,
                        limit: limit
                    });

                    let uploads = [];
                    if (Array.isArray(uploadsResponse)) {
                        uploads = uploadsResponse;
                    } else if (uploadsResponse && Array.isArray(uploadsResponse.data)) {
                        uploads = uploadsResponse.data;
                    } else {
                        console.warn("Unexpected getUploads response structure for check_transaction_status:", uploadsResponse);
                        hasMorePotential = false;
                        break;
                    }

                    foundUpload = uploads.find(u => u.id === receipt_id);

                    if (foundUpload) {
                        console.log(`Found upload for receipt ID ${receipt_id}:`, JSON.stringify(foundUpload, null, 2));
                    } else {
                        // If not found on this page and the page was full, try the next page
                        if (uploads.length < limit) {
                            hasMorePotential = false; // Reached the end of available uploads
                        } else {
                            page++;
                            console.log(`Receipt ID ${receipt_id} not found on page ${page - 1}, checking page ${page}...`);
                            // Optional: Add a small delay to be kind to the API
                            // await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }
                }

                if (foundUpload) {
                    toolResult = {
                        status: foundUpload.status || "unknown",
                        message: `Status for Receipt ID ${receipt_id}: ${foundUpload.status || "Unknown"}`,
                        receipt_id: foundUpload.uploadId,
                        arweaveTxId: foundUpload.arweaveTxId || null,
                        name: foundUpload.name,
                        size: foundUpload.size,
                        createdAt: foundUpload.createdAt,
                        // Optionally include tags if needed in the AI's response
                        // tags: foundUpload.tags
                    };
                    if (foundUpload.arweaveTxId) {
                        toolResult.link = `https://arweave.net/${foundUpload.arweaveTxId}`;
                    }
                } else {
                    toolResult = {
                        status: "not_found",
                        message: `Could not find an upload record for Receipt ID: ${receipt_id}. It might be incorrect or too old.`,
                        receipt_id_searched: receipt_id
                    };
                }

              } catch (statusError) {
                console.error(`Error in check_transaction_status tool:`, statusError);
                toolError = `Failed to check transaction status: ${statusError.message}`;
              }

            } else if (toolName === "list_user_uploads") {
              
              const { limit = 10 } = parsedToolArgs;

              try {
                await storageClient.api.login();
                console.log(`Fetching up to ${limit} recent uploads...`);

                const uploadsResponse = await storageClient.api.upload.getUploads({
                  page: 1,
                  limit: limit
                  // sort: 'createdAt:desc' // If supported
                });

                let uploads = [];
                if (Array.isArray(uploadsResponse)) {
                  uploads = uploadsResponse;
                } else if (uploadsResponse && Array.isArray(uploadsResponse.data)) {
                  uploads = uploadsResponse.data;
                }

                const formattedUploads = uploads.map(u => ({
                  receipt_id: u.id,
                  name: u.name,
                  status: u.status,
                  size_bytes: u.size,
                  created_at: u.createdAt,
                  arweave_tx_id: u.arweaveTxId || null
                }));

                toolResult = {
                  status: "success",
                  message: `Retrieved ${formattedUploads.length} recent uploads.`,
                  uploads: formattedUploads
                };

              } catch (listError) {
                console.error(`Error in list_user_uploads tool:`, listError);
                toolError = `Failed to list uploads: ${listError.message}`;
              }

            } else if (toolName === "get_wallet_balance") {
              try {
                await storageClient.api.login();
                console.log("Fetching wallet balance...");

                const profile = await storageClient.api.getUser(); // This often includes balance info
                console.log("User Profile (may contain balance):", JSON.stringify(profile, null, 2));
                const balanceInfo = profile.balances?.usdc || profile.wallet?.balance?.usdc || { amount: "N/A" };

                toolResult = {
                  status: "success",
                  message: "Wallet balance retrieved.",
                  balance: balanceInfo.amount,
                  token: "USDC", // Assuming USDC based on SDK config
                  wallet_address: profile.walletAddress // If available
                };

              } catch (balanceError) {
                console.error(`Error in get_wallet_balance tool:`, balanceError);
                toolError = `Failed to get wallet balance: ${balanceError.message}`;
              }

            } else if (toolName === "search_files_by_tag") {
              const { tags } = parsedToolArgs;
              if (!tags || !Array.isArray(tags)) {
                throw new Error("Invalid 'tags' argument for search_files_by_tag. Expected an array of tag objects.");
              }

              try {
                await storageClient.api.login();
                console.log("Searching files by tags:", tags);

                const allUploadsResponse = await storageClient.api.upload.getUploads({ page: 1, limit: 50 });
                let allUploads = [];
                if (Array.isArray(allUploadsResponse)) {
                    allUploads = allUploadsResponse;
                } else if (allUploadsResponse && Array.isArray(allUploadsResponse.data)) {
                    allUploads = allUploadsResponse.data;
                }

                const filteredUploads = allUploads.filter(upload => {
                    if (!upload.tags || !Array.isArray(upload.tags)) return false;
                    // Check if all search tags are present in the upload's tags
                    return tags.every(searchTag =>
                        upload.tags.some(uploadTag =>
                            uploadTag.name === searchTag.name &&
                            (searchTag.value === undefined || uploadTag.value === searchTag.value)
                        )
                    );
                });

                const formattedResults = filteredUploads.map(u => ({
                    receipt_id: u.uploadId,
                    name: u.name,
                    status: u.status,
                    arweave_tx_id: u.arweaveTxId || null,
                    created_at: u.createdAt
                }));

                toolResult = {
                    status: "success",
                    message: `Found ${formattedResults.length} uploads matching the tags.`,
                    search_tags: tags,
                    results: formattedResults
                };

              } catch (searchError) {
                console.error(`Error in search_files_by_tag tool:`, searchError);
                toolError = `Failed to search files by tag: ${searchError.message}`;
              }

            } else {
              throw new Error(`Unknown tool: ${toolName}`);
            }

        } catch (executionError) {
          console.error(`Error executing tool ${toolName}:`, executionError);
          toolError = executionError.message;
        }

        // Store the result or error
        responseData.tool_results.push({
          tool_name: toolName,
          result: toolError ? undefined : toolResult,
          error: toolError || undefined
        });

        // Add tool result message back to Gaia for context
        messagesForGaia.push({
          role: "tool",
          name: toolName,
          content: JSON.stringify(toolResult || { error: toolError }),
          tool_call_id: toolCall.id 
        });
      }

      // 5. Final call to Gaia with tool results
      console.log("Calling Gaia with tool results...");
      const gaiaResp2 = await openai.chat.completions.create({
        model: process.env.GAIA_MODEL || "gpt-3.5-turbo",
        messages: messagesForGaia
      });

      const gaiaMessage2 = gaiaResp2.choices[0].message;
      console.log("Gaia Response 2 (Final):", JSON.stringify(gaiaMessage2, null, 2));
      responseData.final_response = gaiaMessage2.content;
    }

    // 6. Send the complete response back to the frontend
    res.json(responseData);

  } catch (error) {
    console.error('Error in /agent-chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process agent request', details: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});