const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables with defaults
const DEFAULT_GAIA_NODE_URL = process.env.GAIA_NODE_URL || 'http://localhost:8080';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gpt-4';
const DEFAULT_API_KEY = process.env.GAIA_API_KEY || 'dummy-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// DIA Data API base URL
const DIA_API_BASE = 'https://api.diadata.org/v1';

// DIA Data API Tools Definition
const DIA_TOOLS = [
    {
        type: "function",
        function: {
            name: "get_crypto_price",
            description: "Get the current price and market data for a cryptocurrency by symbol",
            parameters: {
                type: "object",
                properties: {
                    symbol: {
                        type: "string",
                        description: "The cryptocurrency symbol (e.g., BTC, ETH, SOL)"
                    }
                },
                required: ["symbol"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_forex_rate",
            description: "Get the latest exchange rate for fiat currency pairs",
            parameters: {
                type: "object",
                properties: {
                    pair: {
                        type: "string",
                        description: "Currency pair (e.g., EUR-USD, GBP-USD, JPY-USD, NGN-USD, BRL-USD, CHF-USD)"
                    }
                },
                required: ["pair"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_commodity_price",
            description: "Get the latest price of commodities like gold, silver, copper in USD",
            parameters: {
                type: "object",
                properties: {
                    symbol: {
                        type: "string",
                        description: "Commodity symbol (e.g., XAU-USD for Gold, XAGG-USD for Silver, XG-USD for Copper)"
                    }
                },
                required: ["symbol"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_etf_price",
            description: "Get the latest price of ETFs in USD",
            parameters: {
                type: "object",
                properties: {
                    symbol: {
                        type: "string",
                        description: "ETF symbol (e.g., IVV for iShares Core S&P 500, URTH for iShares MSCI World, EEM for iShares MSCI Emerging Markets)"
                    }
                },
                required: ["symbol"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "calculate_diversified_portfolio",
            description: "Calculate portfolio value including cryptocurrencies, forex, commodities, and ETFs",
            parameters: {
                type: "object",
                properties: {
                    assets: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: { 
                                    type: "string",
                                    enum: ["crypto", "forex", "commodity", "etf"],
                                    description: "Asset type"
                                },
                                symbol: { type: "string" },
                                amount: { type: "number" }
                            }
                        },
                        description: "Array of diversified assets with type, symbol and amount"
                    }
                },
                required: ["assets"]
            }
        }
    }
];

// Create OpenAI client instance for Gaia Node communication
function createGaiaClient(gaiaNodeUrl, apiKey = DEFAULT_API_KEY) {
    return new OpenAI({
        baseURL: `${gaiaNodeUrl}/v1`,
        apiKey: apiKey,
        timeout: 30000,
        maxRetries: 2
    });
}

// DIA API Functions
async function getCryptoPrice(symbol) {
    try {
        console.log(`Fetching crypto price for ${symbol} from DIA Data API...`);
        const response = await axios.get(`${DIA_API_BASE}/quotation/${symbol.toUpperCase()}`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Gaia-DIA-Integration/1.0'
            }
        });
        
        console.log(`Successfully fetched ${symbol} price: $${response.data.Price}`);
        const data = response.data;
        
        const priceChange = data.Price - data.PriceYesterday;
        const priceChangePercent = (priceChange / data.PriceYesterday * 100);
        
        return {
            symbol: data.Symbol,
            name: data.Name,
            price: data.Price,
            priceYesterday: data.PriceYesterday,
            priceChange: priceChange,
            priceChangePercent: priceChangePercent,
            volume24h: data.VolumeYesterdayUSD,
            blockchain: data.Blockchain,
            lastUpdated: data.Time,
            source: "DIA Data"
        };
    } catch (error) {
        console.error(`Error fetching crypto price for ${symbol}:`, error.message);
        throw new Error(`Failed to fetch ${symbol} price: ${error.message}`);
    }
}

async function getForexRate(pair) {
    try {
        console.log(`Fetching forex rate for ${pair} from DIA Data API...`);
        const response = await axios.get(`${DIA_API_BASE}/rwa/Fiat/${pair}`, {
            timeout: 10000
        });
        console.log(`Successfully fetched ${pair} rate: ${response.data.Price}`);
        const data = response.data;
        
        return {
            ticker: data.Ticker,
            price: data.Price,
            timestamp: data.Timestamp,
            type: 'forex',
            baseCurrency: pair.split('-')[0],
            quoteCurrency: pair.split('-')[1]
        };
    } catch (error) {
        console.error(`Error fetching forex rate for ${pair}:`, error.message);
        throw new Error(`Failed to fetch ${pair} rate: ${error.message}`);
    }
}

async function getCommodityPrice(symbol) {
    try {
        console.log(`Fetching commodity price for ${symbol} from DIA Data API...`);
        const response = await axios.get(`${DIA_API_BASE}/rwa/Commodities/${symbol}`, {
            timeout: 10000
        });
        console.log(`Successfully fetched ${symbol} price: $${response.data.Price}`);
        const data = response.data;
        
        return {
            ticker: data.Ticker,
            name: data.Name,
            price: data.Price,
            timestamp: data.Timestamp,
            type: 'commodity',
            currency: 'USD'
        };
    } catch (error) {
        console.error(`Error fetching commodity price for ${symbol}:`, error.message);
        throw new Error(`Failed to fetch ${symbol} price: ${error.message}`);
    }
}

async function getETFPrice(symbol) {
    try {
        console.log(`Fetching ETF price for ${symbol} from DIA Data API...`);
        const response = await axios.get(`${DIA_API_BASE}/rwa/ETF/${symbol}`, {
            timeout: 10000
        });
        console.log(`Successfully fetched ${symbol} price: $${response.data.Price}`);
        const data = response.data;
        
        return {
            symbol: symbol,
            name: data.Name || `${symbol} ETF`,
            price: data.Price,
            timestamp: data.Timestamp,
            type: 'etf',
            currency: 'USD'
        };
    } catch (error) {
        console.error(`Error fetching ETF price for ${symbol}:`, error.message);
        throw new Error(`Failed to fetch ${symbol} price: ${error.message}`);
    }
}

async function calculateDiversifiedPortfolio(assets) {
    try {
        console.log(`Calculating diversified portfolio for ${assets.length} assets...`);
        const portfolioData = [];
        let totalValueUSD = 0;
        
        for (const asset of assets) {
            try {
                let assetData;
                
                switch (asset.type) {
                    case 'crypto':
                        assetData = await getCryptoPrice(asset.symbol);
                        break;
                    case 'forex':
                        assetData = await getForexRate(asset.symbol);
                        break;
                    case 'commodity':
                        assetData = await getCommodityPrice(asset.symbol);
                        break;
                    case 'etf':
                        assetData = await getETFPrice(asset.symbol);
                        break;
                    default:
                        throw new Error(`Unknown asset type: ${asset.type}`);
                }
                
                const value = asset.amount * assetData.price;
                totalValueUSD += value;
                
                portfolioData.push({
                    ...asset,
                    currentPrice: assetData.price,
                    value: value,
                    assetData: assetData
                });
                
            } catch (error) {
                console.error(`Error processing asset ${asset.symbol}:`, error.message);
                portfolioData.push({
                    ...asset,
                    error: `Failed to get price for ${asset.symbol}: ${error.message}`
                });
            }
        }
        
        // Calculate allocation percentages
        portfolioData.forEach(item => {
            if (!item.error) {
                item.allocationPercent = (item.value / totalValueUSD) * 100;
            }
        });
        
        // Calculate diversification metrics
        const assetTypeDistribution = {};
        portfolioData.forEach(item => {
            if (!item.error) {
                assetTypeDistribution[item.type] = (assetTypeDistribution[item.type] || 0) + item.allocationPercent;
            }
        });
        
        console.log(`Portfolio calculation complete. Total value: $${totalValueUSD.toFixed(2)}`);
        
        return {
            portfolio: portfolioData,
            summary: {
                totalValueUSD: totalValueUSD,
                assetCount: assets.length,
                successfulAssets: portfolioData.filter(item => !item.error).length,
                assetTypeDistribution: assetTypeDistribution,
                diversificationScore: Object.keys(assetTypeDistribution).length * 25
            }
        };
    } catch (error) {
        console.error(`Error calculating diversified portfolio:`, error.message);
        throw new Error(`Failed to calculate portfolio: ${error.message}`);
    }
}

// Tool execution function
async function executeTool(toolName, parameters) {
    console.log(`🔧 Starting execution of tool: ${toolName} with parameters:`, parameters);
    
    try {
        let result;
        
        switch (toolName) {
            case 'get_crypto_price':
                result = await getCryptoPrice(parameters.symbol);
                break;
                
            case 'get_forex_rate':
                result = await getForexRate(parameters.pair);
                break;
                
            case 'get_commodity_price':
                result = await getCommodityPrice(parameters.symbol);
                break;
                
            case 'get_etf_price':
                result = await getETFPrice(parameters.symbol);
                break;
                
            case 'calculate_diversified_portfolio':
                result = await calculateDiversifiedPortfolio(parameters.assets);
                break;
                
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
        
        console.log(`✅ Successfully executed tool: ${toolName}`);
        return result;
        
    } catch (error) {
        console.error(`❌ Error executing tool ${toolName}:`, error.message);
        return {
            error: true,
            message: `Failed to execute ${toolName}: ${error.message}`,
            toolName: toolName,
            parameters: parameters
        };
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get environment configuration
app.get('/api/config', (req, res) => {
    res.json({
        defaultGaiaNodeUrl: DEFAULT_GAIA_NODE_URL,
        defaultModel: DEFAULT_MODEL,
        hasApiKey: !!DEFAULT_API_KEY && DEFAULT_API_KEY !== 'dummy-key'
    });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { 
            message, 
            gaiaNodeUrl = DEFAULT_GAIA_NODE_URL, 
            model = DEFAULT_MODEL, 
            temperature = 0.7, 
            apiKey = DEFAULT_API_KEY 
        } = req.body;
        
        if (!gaiaNodeUrl) {
            return res.status(400).json({
                error: 'Gaia Node URL is required'
            });
        }
        
        const gaiaClient = createGaiaClient(gaiaNodeUrl, apiKey);
        console.log(`Using Gaia Node: ${gaiaNodeUrl} with model: ${model}`);
        
        // Initial chat completion with tools
        const chatCompletion = await gaiaClient.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: `You are a sophisticated financial assistant with access to real-time financial data across cryptocurrencies, forex, commodities, and ETFs.

CRITICAL INSTRUCTIONS:
1. You MUST use the provided tools to get current data.
2. When a user asks for MULTIPLE pieces of data, you MUST call MULTIPLE tools.
3. Call ALL relevant tools for the user's request.
4. If you identify a need for a tool, respond ONLY with the tool call, do not include any other text or explanation in that initial response.

EXACT TOOL NAMES (use these exactly):
- get_crypto_price: For cryptocurrency prices (symbol: "BTC", "ETH", etc.)
- get_forex_rate: For currency exchange rates (pair: "EUR-USD", "GBP-USD, JPY-USD, NGN-USD, BRL-USD, CHF-USD)"
- get_commodity_price: For commodity prices (symbol: "XAU-USD" for Gold, "XAGG-USD" for Silver, "XG-USD" for Copper)
- get_etf_price: For ETF prices (symbol: "IVV" for iShares Core S&P 500, "URTH" for iShares MSCI World, "EEM" for iShares MSCI Emerging Markets)
- calculate_diversified_portfolio: For portfolio calculations

EXAMPLES:
- If user asks "Bitcoin price and EUR-USD rate" → Call BOTH get_crypto_price(symbol:"BTC") AND get_forex_rate(pair:"EUR-USD")
- If user asks "Gold and silver prices" → Call BOTH get_commodity_price(symbol:"XAU-USD") AND get_commodity_price(symbol:"XAGG-USD")

Always use tools first, then analyze the results to provide helpful insights.`
                },
                {
                    role: "user", 
                    content: message
                }
            ],
            tools: DIA_TOOLS,
            tool_choice: "auto",
            temperature: temperature,
            max_tokens: 2000
        });
        
        const initialResponse = chatCompletion.choices[0].message;
        console.log('Initial response received from Gaia Node');
        console.log('Initial response content:', initialResponse.content); // Log this to see if it contains unexpected text
        console.log('Tool calls received:', JSON.stringify(initialResponse.tool_calls, null, 2));
        
        let finalOutputContent = null; 
        let toolCallDetails = []; 
        let responseApproach = "direct"; 

        // Handle tool calls
        if (initialResponse.tool_calls && initialResponse.tool_calls.length > 0) {
            console.log(`Processing ${initialResponse.tool_calls.length} tool calls`);
            
            toolCallDetails = []; 

            // Execute all tool calls
            for (const toolCall of initialResponse.tool_calls) {
                let toolName, parameters;
                
                if (toolCall.function && toolCall.function.name) {
                    toolName = toolCall.function.name;
                    try {
                        parameters = JSON.parse(toolCall.function.arguments);
                    } catch (e) {
                        console.error('Failed to parse tool arguments:', toolCall.function.arguments, e);
                        toolCallDetails.push({
                            toolCall: toolCall,
                            result: { error: true, message: `Invalid arguments for tool '${toolName}': ${e.message}. Arguments received: '${toolCall.function.arguments}'` }
                        });
                        continue; 
                    }
                } else {
                    console.error('Malformed tool call structure detected:', toolCall);
                    toolCallDetails.push({
                        toolCall: toolCall,
                        result: { error: true, message: `Malformed tool call structure: missing function name or arguments.` }
                    });
                    continue; 
                }
                
                const result = await executeTool(toolName, parameters);
                toolCallDetails.push({
                    toolCall: toolCall,
                    result: result
                });
            }
            
            // Proceed only if there were tool calls to process (even if some failed)
            if (toolCallDetails.length > 0) {
                const followUpMessages = [
                    {
                        role: "system",
                        content: `You are a sophisticated financial assistant.
                        Your task is to analyze the provided tool call results and synthesize them into a comprehensive, user-friendly natural language response.
                        
                        Instructions:
                        1. Clearly state the results for each successful data retrieval (e.g., "The current Bitcoin price is X").
                        2. If any tool calls failed or returned an error, politely inform the user about the failure and, if possible, suggest rephrasing or trying again.
                        3. Combine information from multiple successful tool calls logically.
                        4. Maintain a helpful and informative tone.
                        5. Format the response clearly with proper headings, bullet points, or clear paragraphs for readability.
                        6. CRITICAL: Your final response MUST be in natural language. DO NOT output raw JSON, XML, or any tool call syntax (e.g., <tool_code>, <tool_call>) in your final content. Focus solely on summarizing the information from the tool results for the user.` 
                    },
                    {
                        role: "user",
                        content: message
                    },
                    initialResponse, 
                    ...toolCallDetails.map(tr => ({ 
                        role: "tool",
                        tool_call_id: tr.toolCall.id,
                        content: JSON.stringify(tr.result)
                    }))
                ];
                
                console.log('Sending follow-up request to Gaia Node with tool results...');
                
                const followUpCompletion = await gaiaClient.chat.completions.create({
                    model: model,
                    messages: followUpMessages,
                    temperature: temperature,
                    max_tokens: 2000
                });
                
                finalOutputContent = followUpCompletion.choices[0].message.content;
                responseApproach = "standard";
                console.log('Final response content from LLM (standard):', finalOutputContent); 
                
                // Robust check and fallback for malformed or empty content from LLM
                if (!finalOutputContent || finalOutputContent.trim() === '' || 
                    finalOutputContent.trim().startsWith('<tool_call>') || 
                    finalOutputContent.trim().startsWith('{"id":') || // Check if it's raw JSON
                    finalOutputContent.trim().includes('tool_code')) { // Check if it includes other tool syntax

                    let fallbackSummary = "I retrieved the following information based on your request:\n\n";
                    let anySuccessfulResult = false;

                    toolCallDetails.forEach(tc => {
                        const toolName = tc.toolCall?.function?.name || 'unknown_tool';
                        if (tc.result && !tc.result.error) {
                            anySuccessfulResult = true;
                            // Attempt to format known successful results gracefully
                            if (toolName === 'get_crypto_price' && tc.result.price) {
                                fallbackSummary += `*   The current price of **${tc.result.name || tc.result.symbol}** is **$${tc.result.price.toFixed(2)}**.\n`;
                            } else if (toolName === 'get_forex_rate' && tc.result.price) {
                                fallbackSummary += `*   The exchange rate for **${tc.result.ticker || tc.result.pair}** is **${tc.result.price.toFixed(4)}**.\n`;
                            } else if (toolName === 'get_commodity_price' && tc.result.price) {
                                fallbackSummary += `*   The current price of **${tc.result.name || tc.result.symbol}** is **$${tc.result.price.toFixed(2)}**.\n`;
                            } else if (toolName === 'get_etf_price' && tc.result.price) {
                                fallbackSummary += `*   The current price of **${tc.result.name || tc.result.symbol}** is **$${tc.result.price.toFixed(2)}**.\n`;
                            } else if (toolName === 'calculate_diversified_portfolio' && tc.result.summary?.totalValueUSD) {
                                fallbackSummary += `*   Your portfolio's total estimated value is **$${tc.result.summary.totalValueUSD.toFixed(2)}**.\n`;
                            } else {
                                fallbackSummary += `*   Retrieved data for **${toolName}**: ${JSON.stringify(tc.result, null, 2).substring(0, 100)}...\n`; // Truncate long JSON
                            }
                        } else {
                            fallbackSummary += `*   **Failed** to retrieve data for **${toolName}**: ${tc.result?.message || 'An unknown error occurred.'}\n`;
                        }
                    });

                    if (!anySuccessfulResult && toolCallDetails.length > 0) {
                        fallbackSummary = "I attempted to retrieve data for your request, but all tool calls encountered errors. Please check the symbols or try again.";
                    } else if (toolCallDetails.length === 0) {
                         fallbackSummary = "I couldn't process your request as no valid tools were identified or executed.";
                    } else if (anySuccessfulResult) {
                        fallbackSummary += "";
                    }
                    
                    finalOutputContent = fallbackSummary;
                    responseApproach = "standard_fallback_content_issue"; 
                }
                
            } else {
                // If initial tool_calls were present but all were invalid/skipped (e.g., parsing arguments failed)
                console.log('No valid tool calls were processed for follow-up (due to parsing/structure issues), returning initial or general fallback.');
                finalOutputContent = initialResponse.content || "I encountered an issue processing the tool calls from the AI model. Please try rephrasing your question.";
                responseApproach = "fallback_no_valid_tools";
            }
            
        } 
        // Handle cases where AI might not make explicit tool calls but intent is clear (e.g., "Bitcoin and EUR-USD")
        else if (
            (initialResponse.content && 
                (initialResponse.content.includes('"name"') || 
                 initialResponse.content.includes('getPrice') ||
                 initialResponse.content.includes('fetchCurrentPrice') ||
                 initialResponse.content.includes('getCurrency') ||
                 initialResponse.content.includes('get_') // Generic check for tool names
                )
            ) ||
            (
                // Explicitly check for multi-asset queries that might need manual tool triggering
                (message.toLowerCase().includes('bitcoin') && message.toLowerCase().includes('eur-usd')) ||
                (message.toLowerCase().includes('gold') && message.toLowerCase().includes('silver')) ||
                (message.toLowerCase().includes('portfolio')) ||
                // If the LLM sent some content but no tool_calls, and the content looks like it *should* have been a tool call
                (initialResponse.content && initialResponse.content.includes('function_call')) // Common pattern for direct tool text
            )
        ) {
            
            console.log('Detected potential incomplete or malformed tool calls from text or complex multi-asset query, attempting manual tools...');
            
            toolCallDetails = []; 
            
            // Manual trigger for common multi-asset requests if not directly captured by tool_calls
            if (message.toLowerCase().includes('bitcoin') && message.toLowerCase().includes('eur-usd')) {
                console.log('Executing both Bitcoin price and EUR-USD rate tools as manual fallback...');
                
                // Create a mock tool call structure for logging consistency
                const btcToolCall = { id: `manual_btc_${Date.now()}`, function: { name: 'get_crypto_price', arguments: '{"symbol": "BTC"}' } };
                const btcResult = await executeTool(btcToolCall.function.name, JSON.parse(btcToolCall.function.arguments));
                toolCallDetails.push({ toolCall: btcToolCall, result: btcResult });

                const eurUsdToolCall = { id: `manual_eur_${Date.now() + 1}`, function: { name: 'get_forex_rate', arguments: '{"pair": "EUR-USD"}' } };
                const eurUsdResult = await executeTool(eurUsdToolCall.function.name, JSON.parse(eurUsdToolCall.function.arguments));
                toolCallDetails.push({ toolCall: eurUsdToolCall, result: eurUsdResult });

            } else if (message.toLowerCase().includes('gold') && message.toLowerCase().includes('silver')) {
                console.log('Executing both Gold and Silver price tools as manual fallback...');
                const goldToolCall = { id: `manual_gold_${Date.now()}`, function: { name: 'get_commodity_price', arguments: '{"symbol": "XAU-USD"}' } };
                const goldResult = await executeTool(goldToolCall.function.name, JSON.parse(goldToolCall.function.arguments));
                toolCallDetails.push({ toolCall: goldToolCall, result: goldResult });

                const silverToolCall = { id: `manual_silver_${Date.now() + 1}`, function: { name: 'get_commodity_price', arguments: '{"symbol": "XAGG-USD"}' } };
                const silverResult = await executeTool(silverToolCall.function.name, JSON.parse(silverToolCall.function.arguments));
                toolCallDetails.push({ toolCall: silverToolCall, result: silverResult });
            } else if (message.toLowerCase().includes('portfolio')) {
                // This is a complex one, the current `calculate_diversified_portfolio` tool needs an `assets` array.
                // A simple text match won't provide enough info to construct it.
                // For simplicity here, we'll just log and proceed without executing, or provide a generic error.
                console.warn('Portfolio calculation requested, but not enough info for manual execution without specific asset details.');
                toolCallDetails.push({
                    toolCall: { id: `manual_portfolio_${Date.now()}`, function: { name: 'calculate_diversified_portfolio', arguments: '{}' } },
                    result: { error: true, message: 'Portfolio calculation requires specific asset details (type, symbol, amount) which were not fully detected from text.' }
                });
            }
            
            // Try to parse JSON-like tool call descriptions from text (if not already handled by direct tool calls or manual explicit triggers)
            const responseContent = initialResponse.content || '';
            const toolNameMapping = {
                'getPrice': 'get_crypto_price', 'fetchCurrentPrice': 'get_crypto_price', 'getCryptoPrice': 'get_crypto_price',
                'getCurrentPrice': 'get_crypto_price', 'getCurrencyRate': 'get_forex_rate', 'getForexRate': 'get_forex_rate',
                'getExchangeRate': 'get_forex_rate', 'getCommodityPrice': 'get_commodity_price', 'getETFPrice': 'get_etf_price',
                'calculatePortfolio': 'calculate_diversified_portfolio' // Ensure this maps
            };
            
            const jsonMatches = responseContent.match(/\{[^}]*"name"[^}]*\}/g);
            if (jsonMatches) {
                for (const match of jsonMatches) {
                    try {
                        const toolCallData = JSON.parse(match);
                        let toolName = toolCallData.name;
                        const parameters = toolCallData.arguments || {};
                        
                        if (toolNameMapping[toolName]) {
                            toolName = toolNameMapping[toolName];
                        }
                        
                        console.log(`Executing mapped tool from text: ${toolName} with parameters:`, parameters);
                        
                        const result = await executeTool(toolName, parameters);
                        toolCallDetails.push({
                            toolCall: { 
                                id: `manual_text_${Date.now()}_${toolName}`,
                                function: { name: toolName, arguments: JSON.stringify(parameters) } 
                            },
                            result: result
                        });
                    } catch (parseError) {
                        console.error('Failed to parse tool call from text:', match, parseError);
                        toolCallDetails.push({
                            toolCall: { id: `manual_text_parse_error_${Date.now()}`, function: { name: 'parsing_error', arguments: match } },
                            result: { error: true, message: `Failed to parse potential tool call from text: ${parseError.message}` }
                        });
                    }
                }
            }
            
            if (toolCallDetails.length > 0) {
                const enhancedPrompt = `The user asked: "${message}"

I have executed the following tools and got these results:
${toolCallDetails.map(tr => `
Tool: ${tr.toolCall.function.name}
Parameters: ${tr.toolCall.function.arguments}
Result: ${JSON.stringify(tr.result, null, 2)}
`).join('\n')}

Please provide a comprehensive, user-friendly response based on this data. Format numbers clearly, show all relevant data (e.g., Bitcoin price, EUR-USD exchange rate if applicable), and provide actionable insights. If any tool call failed, clearly state that it was unable to retrieve data for that specific request and suggest alternatives.
CRITICAL: Your final response MUST be in natural language. DO NOT output raw JSON, XML, or any tool call syntax (e.g., <tool_code>, <tool_call>) in your final content. Focus solely on summarizing the information from the tool results for the user.`;
                
                const enhancedCompletion = await gaiaClient.chat.completions.create({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: `You are a sophisticated financial assistant. Analyze the provided tool results and give a clear, helpful, and user-friendly response to the user's question. Make sure to address all the data provided and explicitly mention any data that could not be retrieved due to tool errors. Your response must be in natural language, not code or tool call syntax.`
                        },
                        {
                            role: "user",
                            content: enhancedPrompt
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 2000
                });
                
                finalOutputContent = enhancedCompletion.choices[0].message.content;
                responseApproach = "manual_execution";
                console.log('Final response content from LLM (manual execution):', finalOutputContent);

                // Robust check and fallback for malformed or empty content from LLM after manual execution
                if (!finalOutputContent || finalOutputContent.trim() === '' || 
                    finalOutputContent.trim().startsWith('<tool_call>') || 
                    finalOutputContent.trim().startsWith('{"id":') ||
                    finalOutputContent.trim().includes('tool_code')) {
                    
                    console.warn("LLM returned malformed, empty, or tool-call-like content after manual execution. Generating a fallback summary.");
                    
                    let fallbackSummary = "I retrieved the following information based on your request (manual execution fallback):\n\n";
                    let anySuccessfulResult = false;

                    toolCallDetails.forEach(tc => {
                        const toolName = tc.toolCall?.function?.name || 'unknown_tool';
                        if (tc.result && !tc.result.error) {
                            anySuccessfulResult = true;
                            // Attempt to format known successful results gracefully
                            if (toolName === 'get_crypto_price' && tc.result.price) {
                                fallbackSummary += `*   The current price of **${tc.result.name || tc.result.symbol}** is **$${tc.result.price.toFixed(2)}**.\n`;
                            } else if (toolName === 'get_forex_rate' && tc.result.price) {
                                fallbackSummary += `*   The exchange rate for **${tc.result.ticker || tc.result.pair}** is **${tc.result.price.toFixed(4)}**.\n`;
                            } else if (toolName === 'get_commodity_price' && tc.result.price) {
                                fallbackSummary += `*   The current price of **${tc.result.name || tc.result.symbol}** is **$${tc.result.price.toFixed(2)}**.\n`;
                            } else if (toolName === 'get_etf_price' && tc.result.price) {
                                fallbackSummary += `*   The current price of **${tc.result.name || tc.result.symbol}** is **$${tc.result.price.toFixed(2)}**.\n`;
                            } else if (toolName === 'calculate_diversified_portfolio' && tc.result.summary?.totalValueUSD) {
                                fallbackSummary += `*   Your portfolio's total estimated value is **$${tc.result.summary.totalValueUSD.toFixed(2)}**.\n`;
                            } else {
                                fallbackSummary += `*   Retrieved data for **${toolName}**: ${JSON.stringify(tc.result, null, 2).substring(0, 100)}...\n`; // Truncate long JSON
                            }
                        } else {
                            fallbackSummary += `*   **Failed** to retrieve data for **${toolName}**: ${tc.result?.message || 'An unknown error occurred.'}\n`;
                        }
                    });

                    if (!anySuccessfulResult && toolCallDetails.length > 0) {
                        fallbackSummary = "I attempted to retrieve data for your request, but all tool calls encountered errors during manual execution. Please check the symbols or try again.";
                    } else if (toolCallDetails.length === 0) {
                         fallbackSummary = "I couldn't process your request as no valid tools were identified or executed during manual fallback.";
                    } else if (anySuccessfulResult) {
                        fallbackSummary += "\nI apologize that the full natural language summary from the AI is not available at this moment. This is a fallback response based on the directly retrieved data.";
                    }
                    
                    finalOutputContent = fallbackSummary;
                    responseApproach = "manual_fallback_content_issue"; 
                }

            } else {
                console.log('No manual tool execution was possible, falling back to direct response or general message.');
                finalOutputContent = initialResponse.content || "I couldn't identify specific financial data to retrieve for your request. Could you please rephrase?";
                responseApproach = "text_fallback"; 
            }
        } else {
            // No tool calls made and no manual execution triggered
            console.log('No tool calls detected or manually triggered, sending direct response.');
            finalOutputContent = initialResponse.content || "I'm sorry, I couldn't understand your request or retrieve the necessary data.";
            responseApproach = "direct"; 
        }
        
        // Send the final response
        res.json({
            response: finalOutputContent,
            toolCalls: toolCallDetails, // Ensure this always contains the executed tool calls
            usage: chatCompletion.usage || {}, 
            model: model,
            gaiaNode: gaiaNodeUrl,
            approach: responseApproach
        });
        
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        
        if (error instanceof OpenAI.APIConnectionError) {
            res.status(503).json({
                error: 'Cannot connect to Gaia Node. Please check the URL and ensure the node is running.',
                details: error.message
            });
        } else if (error instanceof OpenAI.APIError) {
            res.status(error.status || 500).json({
                error: `Gaia Node API error: ${error.message}`,
                code: error.code,
                type: error.type
            });
        } else {
            res.status(500).json({
                error: 'Internal server error: ' + error.message
            });
        }
    }
});

// Test Gaia Node connectivity
app.post('/api/test-gaia', async (req, res) => {
    try {
        const { 
            gaiaNodeUrl = DEFAULT_GAIA_NODE_URL, 
            model = DEFAULT_MODEL, 
            apiKey = DEFAULT_API_KEY 
        } = req.body;
        
        if (!gaiaNodeUrl) {
            return res.status(400).json({
                error: 'Gaia Node URL is required'
            });
        }
        
        const gaiaClient = createGaiaClient(gaiaNodeUrl, apiKey);
        
        const testCompletion = await gaiaClient.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "user",
                    content: "Hello! Please respond with 'Connection successful' to confirm you're working."
                }
            ],
            max_tokens: 50,
            temperature: 0
        });
        
        res.json({
            status: 'success',
            message: 'Gaia Node connection successful',
            response: testCompletion.choices[0].message.content,
            model: model,
            usage: testCompletion.usage
        });
        
    } catch (error) {
        console.error('Gaia Node test error:', error);
        
        if (error instanceof OpenAI.APIConnectionError) {
            res.status(503).json({
                status: 'error',
                error: 'Cannot connect to Gaia Node',
                details: error.message
            });
        } else {
            res.status(500).json({
                status: 'error',
                error: 'Gaia Node test failed',
                details: error.message
            });
        }
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'Gaia-DIA Integration Server',
        config: {
            defaultGaiaNodeUrl: DEFAULT_GAIA_NODE_URL,
            defaultModel: DEFAULT_MODEL,
            hasApiKey: !!DEFAULT_API_KEY && DEFAULT_API_KEY !== 'dummy-key'
        }
    });
});

// Get available tools
app.get('/api/tools', (req, res) => {
    res.json(DIA_TOOLS);
});

// Test DIA Data API connectivity
app.get('/api/test-dia', async (req, res) => {
    try {
        const response = await axios.get(`${DIA_API_BASE}/quotation/BTC`, {
            timeout: 10000
        });
        res.json({
            status: 'ok',
            message: 'DIA Data API is accessible',
            sampleData: response.data
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'Cannot connect to DIA Data API',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Gaia-DIA Integration Server running on port ${PORT}`);
    console.log(`📊 Visit http://localhost:${PORT} to start chatting`);
    console.log(`🔧 Configuration:`);
    console.log(`   - Default Gaia Node URL: ${DEFAULT_GAIA_NODE_URL}`);
    console.log(`   - Default Model: ${DEFAULT_MODEL}`);
    console.log(`   - API Key configured: ${!!DEFAULT_API_KEY && DEFAULT_API_KEY !== 'dummy-key'}`);
    console.log(`🔧 API endpoints:`);
    console.log(`   - POST /api/chat - Main chat interface`);
    console.log(`   - GET /api/config - Get environment configuration`);
    console.log(`   - POST /api/test-gaia - Test Gaia Node connectivity`);
    console.log(`   - GET /api/tools - Available DIA Data tools`);
    console.log(`   - GET /api/test-dia - Test DIA API connectivity`);
    console.log(`   - GET /api/health - Health check`);
    console.log(`\n💡 Using OpenAI Node.js SDK for Gaia Node communication`);
});