require('dotenv').config();
const OpenAI = require('openai');
const readlineSync = require('readline-sync');
const { ankrTools } = require('./ankrTools');

const GAIA_API_KEY = process.env.GAIA_API_KEY;
const GAIA_API_ENDPOINT = process.env.GAIA_API_ENDPOINT;
const GAIA_MODEL_NAME = process.env.GAIA_MODEL_NAME || "llama70b";
const ANKR_API_KEY = process.env.ANKR_API_KEY;

if (!GAIA_API_KEY || !GAIA_API_ENDPOINT) {
    console.error("Error: GAIA_API_KEY or GAIA_API_ENDPOINT is not set in .env file.");
    process.exit(1);
}
if (!ANKR_API_KEY) {
    console.warn("Warning: ANKR_API_KEY is not set in .env file. Real Ankr API calls will fail.");
}

const gaia = new OpenAI({
    apiKey: GAIA_API_KEY,
    baseURL: GAIA_API_ENDPOINT,
});

const ANKR_RPC_BASE_URL = `https://rpc.ankr.com/multichain/${ANKR_API_KEY || 'YOUR_ANKR_KEY_MISSING'}`;
let ankrRequestId = 1;

// --- Helper Functions for Parameter Preparation ---
function prepareBlockchainParam(blockchainArg) {
    if (!blockchainArg || blockchainArg.trim() === "") {
        return undefined; // For "all chains" where API expects blockchain to be omitted or params empty
    }
    if (blockchainArg.includes(',')) {
        return blockchainArg.split(',').map(s => s.trim()).filter(s => s);
    }
    return blockchainArg; // Single blockchain string
}

function prepareAddressParam(addressArg) {
    if (!addressArg) return undefined;
    if (Array.isArray(addressArg)) return addressArg;
    // If LLM provides a comma-separated string for an address list
    if (typeof addressArg === 'string' && addressArg.includes(',')) {
        return addressArg.split(',').map(s => s.trim()).filter(s => s);
    }
    return [addressArg]; // API often expects array even for single address
}

const toBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
    }
    return undefined; // Let Ankr API use its default if undefined
};

const toNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num)) return num;
    }
    return undefined; // Let Ankr API use its default if undefined
};

// --- Ankr API Tool Caller ---
async function callAnkrTool(functionName, args) {
    console.log(`\n📞 Attempting to call Ankr tool: ${functionName} with args:`, args);

    const payload = {
        id: ankrRequestId++,
        jsonrpc: "2.0",
        method: functionName,
        params: {}
    };
    const p = payload.params;

    switch (functionName) {
        // --- Query API Methods ---
        case "ankr_getBlockchainStats":
            if (args.blockchain) p.blockchain = args.blockchain; // API takes single string or empty params for all
            else payload.params = {}; // Empty params for all chains
            break;
        case "ankr_getBlocks":
            p.blockchain = args.blockchain;
            p.fromBlock = toNumber(args.fromBlock);
            p.toBlock = toNumber(args.toBlock);
            if (args.decodeLogs !== undefined) p.decodeLogs = toBoolean(args.decodeLogs);
            if (args.decodeTxData !== undefined) p.decodeTxData = toBoolean(args.decodeTxData);
            if (args.descOrder !== undefined) p.descOrder = toBoolean(args.descOrder);
            if (args.includeLogs !== undefined) p.includeLogs = toBoolean(args.includeLogs);
            if (args.includeTxs !== undefined) p.includeTxs = toBoolean(args.includeTxs);
            break;
        case "ankr_getLogs":
            p.blockchain = prepareBlockchainParam(args.blockchain);
            if (args.address) p.address = prepareAddressParam(args.address);
            if (args.fromBlock !== undefined) p.fromBlock = toNumber(args.fromBlock);
            if (args.toBlock !== undefined) p.toBlock = toNumber(args.toBlock);
            if (args.fromTimestamp !== undefined) p.fromTimestamp = toNumber(args.fromTimestamp);
            if (args.toTimestamp !== undefined) p.toTimestamp = toNumber(args.toTimestamp);
            if (args.topics) p.topics = args.topics;
            if (args.decodeLogs !== undefined) p.decodeLogs = toBoolean(args.decodeLogs);
            if (args.descOrder !== undefined) p.descOrder = toBoolean(args.descOrder);
            if (args.pageSize !== undefined) p.pageSize = toNumber(args.pageSize);
            if (args.pageToken) p.pageToken = args.pageToken;
            break;
        case "ankr_getTransactionsByHash":
            p.transactionHash = args.transactionHash;
            if (args.blockchain) p.blockchain = prepareBlockchainParam(args.blockchain); // Can be string, array, or empty
            if (args.decodeLogs !== undefined) p.decodeLogs = toBoolean(args.decodeLogs);
            if (args.decodeTxData !== undefined) p.decodeTxData = toBoolean(args.decodeTxData);
            if (args.includeLogs !== undefined) p.includeLogs = toBoolean(args.includeLogs);
            break;
        case "ankr_getTransactionsByAddress":
            p.address = args.address; // API takes single string
            if (args.blockchain) p.blockchain = prepareBlockchainParam(args.blockchain); // Can be string, array, or empty
            if (args.fromBlock !== undefined) p.fromBlock = toNumber(args.fromBlock);
            if (args.toBlock !== undefined) p.toBlock = toNumber(args.toBlock);
            if (args.fromTimestamp !== undefined) p.fromTimestamp = toNumber(args.fromTimestamp);
            if (args.toTimestamp !== undefined) p.toTimestamp = toNumber(args.toTimestamp);
            if (args.includeLogs !== undefined) p.includeLogs = toBoolean(args.includeLogs);
            if (args.descOrder !== undefined) p.descOrder = toBoolean(args.descOrder);
            if (args.pageSize !== undefined) p.pageSize = toNumber(args.pageSize);
            if (args.pageToken) p.pageToken = args.pageToken;
            break;
        case "ankr_getInteractions":
            p.address = args.address; // API takes single string
            break;

        // --- NFT API Methods ---
        case "ankr_getNFTsByOwner":
            p.walletAddress = args.walletAddress;
            const blockchainForNftOwner = prepareBlockchainParam(args.blockchain); // string, array, or empty
            if (blockchainForNftOwner !== undefined) p.blockchain = blockchainForNftOwner;
            if (args.pageSize !== undefined) p.pageSize = toNumber(args.pageSize);
            if (args.pageToken) p.pageToken = args.pageToken;
            if (args.filter && Array.isArray(args.filter) && args.filter.length > 0) p.filter = args.filter;
            break;
        case "ankr_getNFTMetadata":
            p.contractAddress = args.contractAddress;
            p.tokenId = args.tokenId; // Ankr API expects integer, but string often works. Forcing toNumber can be safer.
                                      // Let's try sending as string first as LLM provides it. If Ankr errors, use toNumber(args.tokenId).
            p.blockchain = args.blockchain;
            if (args.forceFetch !== undefined) p.forceFetch = toBoolean(args.forceFetch);
            if (args.skipSyncCheck !== undefined) p.skipSyncCheck = toBoolean(args.skipSyncCheck);
            break;
        case "ankr_getNFTHolders":
            p.contractAddress = args.contractAddress;
            p.blockchain = args.blockchain;
            if (args.pageSize !== undefined) p.pageSize = toNumber(args.pageSize);
            if (args.pageToken) p.pageToken = args.pageToken;
            break;
        case "ankr_getNftTransfers":
            p.address = prepareAddressParam(args.address); // API requires array of strings
            const blockchainForNftTransfers = prepareBlockchainParam(args.blockchain); // string, array, or empty
            if (blockchainForNftTransfers !== undefined) p.blockchain = blockchainForNftTransfers;
            if (args.fromBlock !== undefined) p.fromBlock = toNumber(args.fromBlock);
            if (args.toBlock !== undefined) p.toBlock = toNumber(args.toBlock);
            if (args.fromTimestamp !== undefined) p.fromTimestamp = toNumber(args.fromTimestamp);
            if (args.toTimestamp !== undefined) p.toTimestamp = toNumber(args.toTimestamp);
            if (args.descOrder !== undefined) p.descOrder = toBoolean(args.descOrder);
            if (args.pageSize !== undefined) p.pageSize = toNumber(args.pageSize);
            if (args.pageToken) p.pageToken = args.pageToken;
            break;

        // --- Token API Methods ---
        case "ankr_getAccountBalance":
            p.walletAddress = args.walletAddress;
            const blockchainForBalance = prepareBlockchainParam(args.blockchain); // string, array, or empty
            if (blockchainForBalance !== undefined) p.blockchain = blockchainForBalance;
            if (args.nativeFirst !== undefined) p.nativeFirst = toBoolean(args.nativeFirst);
            if (args.onlyWhitelisted !== undefined) p.onlyWhitelisted = toBoolean(args.onlyWhitelisted);
            if (args.pageSize !== undefined) p.pageSize = toNumber(args.pageSize);
            if (args.pageToken) p.pageToken = args.pageToken;
            break;
        case "ankr_getCurrencies":
            p.blockchain = args.blockchain;
            break;
        case "ankr_getTokenPrice":
            p.blockchain = args.blockchain;
            if (args.contractAddress) p.contractAddress = args.contractAddress; // Optional
            break;
        case "ankr_getTokenHolders":
            p.contractAddress = args.contractAddress;
            p.blockchain = args.blockchain;
            if (args.pageSize !== undefined) p.pageSize = toNumber(args.pageSize);
            if (args.pageToken) p.pageToken = args.pageToken;
            break;
        case "ankr_getTokenHoldersCount":
            p.contractAddress = args.contractAddress;
            p.blockchain = args.blockchain;
            // API docs say pageSize is string, but example shows int. Assume int.
            if (args.pageSize !== undefined) p.pageSize = toNumber(args.pageSize);
            if (args.pageToken) p.pageToken = args.pageToken;
            break;
        case "ankr_getTokenTransfers":
            p.address = prepareAddressParam(args.address); // API requires array of strings
            const blockchainForTokenTransfers = prepareBlockchainParam(args.blockchain); // string, array, or empty
            if (blockchainForTokenTransfers !== undefined) p.blockchain = blockchainForTokenTransfers;
            if (args.fromBlock !== undefined) p.fromBlock = toNumber(args.fromBlock);
            if (args.toBlock !== undefined) p.toBlock = toNumber(args.toBlock);
            if (args.fromTimestamp !== undefined) p.fromTimestamp = toNumber(args.fromTimestamp);
            if (args.toTimestamp !== undefined) p.toTimestamp = toNumber(args.toTimestamp);
            if (args.descOrder !== undefined) p.descOrder = toBoolean(args.descOrder);
            if (args.pageSize !== undefined) p.pageSize = toNumber(args.pageSize);
            if (args.pageToken) p.pageToken = args.pageToken;
            break;

        default:
            console.error(`❌ Unknown Ankr function or param handling not implemented: ${functionName}`);
            return { error: "Unknown or unhandled Ankr function", functionName: functionName, args: args };
    }

    // Remove undefined params explicitly before sending, as Ankr API might be strict
    Object.keys(p).forEach(key => {
        if (p[key] === undefined) { // Remove keys if their processed value is undefined
            delete p[key];
        }
    });

    if (!ANKR_API_KEY || ANKR_API_KEY === 'YOUR_ANKR_KEY_MISSING') {
        console.warn("❗ ANKR_API_KEY is not configured. Cannot make real API call.");
        return { error: "ANKR_API_KEY is not configured. Cannot make real API call." };
    }

    const nodeFetch = (await import('node-fetch')).default;
    try {
        console.log("📤 Sending to Ankr:", JSON.stringify(payload, null, 2));
        const response = await nodeFetch(ANKR_RPC_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok || responseData.error) {
            const errorDetails = responseData.error || { code: response.status, message: response.statusText, ankrBody: responseData };
            console.error("Ankr API Error:", errorDetails);
            if (responseData.error) { // Log full Ankr error if present
                console.error("Raw Ankr Error Response Body:", JSON.stringify(responseData, null, 2));
            }
            return {
                error: "Ankr API Error",
                details: errorDetails,
            };
        }
        console.log("📥 Received from Ankr (SUCCESS):", JSON.stringify(responseData, null, 2));
        return responseData.result;

    } catch (error) {
        console.error(`🚨 Error calling Ankr API for ${functionName}:`, error);
        return { error: "Failed to call Ankr API", details: error.message };
    }
}


// --- Function to parse Llama 3.1 style tool calls ---
function parseLlamaToolCall(content) {
    if (!content || typeof content !== 'string') {
        return null;
    }

    const pythonTagStart = "<|python_tag|>";
    const eomIdEnd = "<|eom_id|>";
    const toolCalls = [];
    let currentIndex = 0;

    while (currentIndex < content.length) {
        const startIndex = content.indexOf(pythonTagStart, currentIndex);
        if (startIndex === -1) break;

        let jsonStr;
        let endOfJsonIndex = -1; // Tracks the end of the successfully parsed JSON string within content

        // Attempt to find balanced JSON, robustly
        let potentialJsonStrStart = startIndex + pythonTagStart.length;
        let openBraces = 0;
        let inString = false;
        let escapeNext = false;

        for (let i = potentialJsonStrStart; i < content.length; i++) {
            const char = content[i];
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (char === '\\') {
                escapeNext = true;
                continue;
            }
            if (char === '"') {
                // Only toggle inString if this quote is not escaped
                if (i === potentialJsonStrStart || content[i-1] !== '\\') {
                     inString = !inString;
                }
            }
            if (!inString) {
                if (char === '{') {
                    openBraces++;
                } else if (char === '}') {
                    openBraces--;
                    if (openBraces === 0) {
                        // Found the end of a JSON object
                        jsonStr = content.substring(potentialJsonStrStart, i + 1).trim();
                        endOfJsonIndex = i + 1;
                        break;
                    }
                }
            }
        }

        if (!jsonStr) { // If no balanced JSON found this way
             // Fallback: check for eomIdEnd if primary JSON parsing failed or wasn't conclusive
            const eomIndex = content.indexOf(eomIdEnd, startIndex + pythonTagStart.length);
            if (eomIndex !== -1) {
                jsonStr = content.substring(startIndex + pythonTagStart.length, eomIndex).trim();
                endOfJsonIndex = eomIndex + eomIdEnd.length;
            } else {
                console.warn("Could not reliably find JSON end in Llama python_tag. Moving past tag.", content.substring(startIndex));
                currentIndex = startIndex + pythonTagStart.length;
                continue;
            }
        }


        try {
            const parsedJson = JSON.parse(jsonStr);
            if (parsedJson.name && parsedJson.parameters) {
                toolCalls.push({
                    id: `llama_tool_call_${Date.now()}_${toolCalls.length}`,
                    type: "function",
                    function: {
                        name: parsedJson.name,
                        arguments: JSON.stringify(parsedJson.parameters)
                    }
                });
            } else {
                console.warn("Parsed JSON from Llama tag missing 'name' or 'parameters':", parsedJson);
            }
        } catch (e) {
            console.error("Error parsing Llama tool call JSON:", jsonStr, e);
        }
        currentIndex = endOfJsonIndex > -1 ? endOfJsonIndex : (startIndex + pythonTagStart.length + (jsonStr ? jsonStr.length : 0));
        if (endOfJsonIndex > -1 && content.substring(endOfJsonIndex - eomIdEnd.length, endOfJsonIndex) === eomIdEnd) {
        } else if (content.includes(eomIdEnd, startIndex) && (endOfJsonIndex === -1 || !jsonStr.endsWith("}"))) {
            let eomActualIndex = content.indexOf(eomIdEnd, (endOfJsonIndex > -1 ? endOfJsonIndex : startIndex + pythonTagStart.length));
            if(eomActualIndex > -1) currentIndex = eomActualIndex + eomIdEnd.length;
        }

    }
    return toolCalls.length > 0 ? toolCalls : null;
}

async function getGaiaResponse(messages) {
    try {
        const modelToUse = `${GAIA_MODEL_NAME}`;
        console.log(`\n💬 Sending to Gaia (model: ${modelToUse})...`);

        const requestBody = {
            model: modelToUse,
            messages: messages,
            tools: ankrTools,
            tool_choice: "auto"
        };
        // console.log("Gaia Request Body:", JSON.stringify(requestBody, null, 2));
        const response = await gaia.chat.completions.create(requestBody);
        return response;
    } catch (error) {
        console.error("Error calling Gaia API via OpenAI library:", error);
        if (error instanceof OpenAI.APIError) {
            console.error("Status:", error.status);
            console.error("Message:", error.message);
            console.error("Code:", error.code);
            console.error("Param:", error.param);
            console.error("Type:", error.type);
            console.error("Headers:", error.headers);
        }
        return null;
    }
}
async function runConversation() {
    const history = [
        {
            role: "system",
            content: `You are a helpful assistant that uses Ankr blockchain tools to answer user questions.
            When you need to use a tool, if you have any introductory text, provide it first, then on a new line provide the tool call in the format: <|python_tag|>{"name": "tool_name", "parameters": {"param1": "value1", ...}}<|eom_id|>
            If the tool call is the only thing, just provide the tag.
            Available tools cover blockchain stats, blocks, logs, transactions, NFTs, and token information.
            - For 'blockchain' parameters that can take multiple chains, if the user asks for multiple (e.g., "on eth and bsc"), provide them as a comma-separated string (e.g., "eth,bsc"). The underlying function will handle splitting this.
            - For 'address' parameters that can take multiple addresses (like in ankr_getNftTransfers or ankr_getTokenTransfers), if the user provides multiple, you can provide them as a comma-separated string or an array of strings. The underlying function will handle this.
            - If a required parameter for a tool is missing from the user's query, ask the user for it before calling the tool.
            - For 'ankr_getNFTsByOwner', the 'filter' parameter is an array of objects, where each object has a contract address as a key and an array of token IDs as its value (or an empty array for all tokens from that contract). For example: [{'0xcontract1': []}, {'0xcontract2': ['tokenId1']}].
            - Be concise in your final answers unless asked for verbosity.`
        }
    ];

    while (true) {
        const userInput = readlineSync.question("You: ");
        if (userInput.toLowerCase() === 'exit') {
            console.log("Exiting chat.");
            break;
        }

        history.push({ role: "user", content: userInput });

        let gaiaOpenAIResponse = await getGaiaResponse(history);

        if (!gaiaOpenAIResponse || !gaiaOpenAIResponse.choices || gaiaOpenAIResponse.choices.length === 0) {
            console.log("🤖 Gaia: I encountered an error or got an empty response. Please try again.");
            history.pop();
            continue;
        }

        let assistantMessage = gaiaOpenAIResponse.choices[0].message;
        let originalContentBeforeToolParse = assistantMessage.content;

        if (!assistantMessage.tool_calls && assistantMessage.content) {
            const parsedLlamaTools = parseLlamaToolCall(assistantMessage.content);
            if (parsedLlamaTools && parsedLlamaTools.length > 0) {
                assistantMessage.tool_calls = parsedLlamaTools;
                //console.log("ℹ️ Parsed Llama-style tool call from content.");
                let cleanedOriginalContent = originalContentBeforeToolParse
                                                .replace(/<\|python_tag\|>.*?<\|eom_id\|>/gs, '')
                                                .replace(/<\|python_tag\|>[\s\S]*?}(\s*<\|eom_id\|>)?/gs, '')
                                                .trim();
                if (cleanedOriginalContent === "") {
                    assistantMessage.content = null;
                } else {
                    assistantMessage.content = cleanedOriginalContent;
                }
            }
        }
        history.push(assistantMessage);
        let finalUserFacingMessageContent = assistantMessage.content;

        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            // If there was introductory text before the tool call, print it now.
            if (finalUserFacingMessageContent) {
                console.log(`🤖 Gaia: ${finalUserFacingMessageContent}`);
            }
            console.log(`\n🛠️ Gaia wants to use tool(s): ${assistantMessage.tool_calls.map(tc => tc.function.name).join(', ')}`);

            const toolPromises = assistantMessage.tool_calls.map(async (toolCall) => {
                // ... (existing robust toolCall.function and argument parsing logic) ...
                if (!toolCall || !toolCall.function) { /* ... */ }
                const functionName = toolCall.function.name;
                let functionArgs = {};
                try { functionArgs = JSON.parse(toolCall.function.arguments); } catch (e) { /* ... */ }
                
                const toolResponseContent = await callAnkrTool(functionName, functionArgs);
                return {
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: functionName,
                    content: JSON.stringify(toolResponseContent)
                };
            });

            const toolResponses = await Promise.all(toolPromises);
            toolResponses.forEach(response => history.push(response));
            gaiaOpenAIResponse = await getGaiaResponse(history);

            if (!gaiaOpenAIResponse || !gaiaOpenAIResponse.choices || gaiaOpenAIResponse.choices.length === 0) {
                console.log("🤖 Gaia: I encountered an error after tool use. Please try again.");
                continue;
            }
            
            let messageAfterToolResult = gaiaOpenAIResponse.choices[0].message;
            originalContentBeforeToolParse = messageAfterToolResult.content;

            if (!messageAfterToolResult.tool_calls && messageAfterToolResult.content) {
                const parsedLlamaTools = parseLlamaToolCall(messageAfterToolResult.content);
                if (parsedLlamaTools && parsedLlamaTools.length > 0) {
                    messageAfterToolResult.tool_calls = parsedLlamaTools;
                    console.log("ℹ️ Parsed Llama-style tool call from content after tool response.");
                    let cleanedOriginalContent = originalContentBeforeToolParse
                                                .replace(/<\|python_tag\|>.*?<\|eom_id\|>/gs, '')
                                                .replace(/<\|python_tag\|>[\s\S]*?}(\s*<\|eom_id\|>)?/gs, '')
                                                .trim();
                    if (cleanedOriginalContent === "") {
                        messageAfterToolResult.content = null; 
                    } else {
                        messageAfterToolResult.content = cleanedOriginalContent; 
                    }
                }
            }
            history.push(messageAfterToolResult);
            finalUserFacingMessageContent = messageAfterToolResult.content;
        }

        if (finalUserFacingMessageContent) {
            let cleanedDisplayContent = finalUserFacingMessageContent
                                        .replace(/<\|python_tag\|>.*?<\|eom_id\|>/gs, '')
                                        .replace(/<\|python_tag\|>[\s\S]*?}(\s*<\|eom_id\|>)?/gs, '')
                                        .trim();
            if (cleanedDisplayContent) {
                 console.log(`🤖 Gaia: ${cleanedDisplayContent}`);
            } else if (!assistantMessage.tool_calls && !(gaiaOpenAIResponse.choices[0].message.tool_calls)) { 
                // Only log this if there were no tool calls in the very last assistant message
                console.log("🤖 Gaia: (No further text content to display for this turn)");
            }
        } else if (!(assistantMessage.tool_calls || (gaiaOpenAIResponse && gaiaOpenAIResponse.choices[0].message.tool_calls))) {
            // If there's no content AND no tool_calls in the latest message from Gaia
            console.log("🤖 Gaia: I'm not sure how to respond to that (no content and no tool call in final message).");
        }
    }
}

runConversation();