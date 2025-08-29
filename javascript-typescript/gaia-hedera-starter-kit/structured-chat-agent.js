import {
    HederaLangchainToolkit,
    AgentMode,
    coreHTSPlugin,
    coreAccountPlugin,
    coreConsensusPlugin,
    coreQueriesPlugin,
    coreHTSPluginToolNames,
    coreQueriesPluginToolNames,
    coreConsensusPluginToolNames,
    coreAccountPluginToolNames
} from 'hedera-agent-kit';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { BufferMemory } from 'langchain/memory';
import { Client, PrivateKey } from '@hashgraph/sdk';
import prompts from 'prompts';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * A simple command-line loading animation.
 */
function loadingAnimation() {
    const chars = ['|', '/', '-', '\\'];
    let i = 0;
    return setInterval(() => {
        process.stdout.write(`\rThinking... ${chars[i++]}`);
        i = i % chars.length;
    }, 250);
}

async function bootstrap() {
    // Section 1: Language Model Configuration
    const llm = new ChatOpenAI({
        configuration: {
            baseURL: process.env.GAIA_NODE_URL,
            apiKey: process.env.GAIA_API_KEY,
        },
        model: process.env.GAIA_MODEL_NAME,
        temperature: 0,
    });

    // Section 2: Hedera Client Setup for Autonomous Execution
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY),
    );

    // Section 3: Hedera Agent Toolkit & Tool Selection
    // This agent is given more tools, including those for NFT creation.
    const {
        CREATE_FUNGIBLE_TOKEN_TOOL,
        CREATE_NON_FUNGIBLE_TOKEN_TOOL, // This tool allows for NFT creation.
        MINT_NON_FUNGIBLE_TOKEN_TOOL,
        MINT_FUNGIBLE_TOKEN_TOOL,
    } = coreHTSPluginToolNames;
    const { TRANSFER_HBAR_TOOL } = coreAccountPluginToolNames;
    const { CREATE_TOPIC_TOOL, SUBMIT_TOPIC_MESSAGE_TOOL } = coreConsensusPluginToolNames;
    const { GET_HBAR_BALANCE_QUERY_TOOL, GET_ACCOUNT_QUERY_TOOL, GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL, GET_TOPIC_MESSAGES_QUERY_TOOL } = coreQueriesPluginToolNames;

    const hederaAgentToolkit = new HederaLangchainToolkit({
        client,
        configuration: {
            // We explicitly list all tools we want to enable, excluding the incompatible 'airdrop-fungible-token'.
            tools: [
                CREATE_FUNGIBLE_TOKEN_TOOL,
                CREATE_NON_FUNGIBLE_TOKEN_TOOL,
                MINT_NON_FUNGIBLE_TOKEN_TOOL,
                TRANSFER_HBAR_TOOL,
                CREATE_TOPIC_TOOL,
                SUBMIT_TOPIC_MESSAGE_TOOL,
                GET_HBAR_BALANCE_QUERY_TOOL,
                GET_ACCOUNT_QUERY_TOOL,
                GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL,
                GET_TOPIC_MESSAGES_QUERY_TOOL,
                MINT_FUNGIBLE_TOKEN_TOOL,
            ],
            context: {
                mode: AgentMode.AUTONOMOUS,
            },
            plugins: [coreHTSPlugin, coreAccountPlugin, coreConsensusPlugin, coreQueriesPlugin],
        },
    });

    // Section 4: Agent & Executor Setup
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', 'You are a helpful assistant with advanced Hedera capabilities, including NFTs.'],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}'],
    ]);
    const tools = hederaAgentToolkit.getTools();
    const agent = createToolCallingAgent({ llm, tools, prompt });
    const agentExecutor = new AgentExecutor({
        agent,
        tools,
        memory: new BufferMemory({
            memoryKey: 'chat_history',
            inputKey: 'input',
            outputKey: 'output',
            returnMessages: true,
        }),
    });

    // Section 5: Main Application Loop
    console.log('Hedera NFT Agent CLI — type "exit" to quit');
    while (true) {
        const { userInput } = await prompts({
            type: 'text',
            name: 'userInput',
            message: 'You: ',
        });

        if (!userInput || ['exit', 'quit'].includes(userInput.trim().toLowerCase())) {
            console.log('Goodbye!');
            break;
        }
        
        const loader = loadingAnimation();
        try {
            const response = await agentExecutor.invoke({ input: userInput });
            clearInterval(loader);
            process.stdout.write('\r');
            console.log(`AI: ${response?.output ?? response}`);
        } catch (err) {
            clearInterval(loader);
            process.stdout.write('\r');
            console.error('Error:', err);
        }
    }
}

bootstrap().catch(err => {
    console.error('Fatal error during CLI bootstrap:', err);
    process.exit(1);
});

/*
--- Example Prompts ---

This agent has more tools enabled, specifically for NFTs.

1.  Create an NFT Collection (this will cost HBAR):
    -   You: "I want to create an NFT collection. Let's call it 'Gaia Art' with the symbol 'GART'. Make the max supply 500."
    -   AI: "I have created your NFT collection 'Gaia Art' (GART) with a maximum supply of 500. The new token ID is 0.0.123789."

2.  Mint an NFT from that collection (this will cost HBAR):
    -   You: "mint a new NFT for token 0.0.123789 with the metadata 'ipfs://Qm.../1.json'"
    -   AI: "I have minted a new NFT for token 0.0.123789 with the provided metadata. The new serial number is 1."

3.  Perform a more complex query:
    -   You: "get the complete account info for 0.0.987"
    -   AI: (The agent will return a detailed JSON object with all information about the account).

4.  Check token balances for a specific account:
    -   You: "what are the token balances for account 0.0.123789"
    -   AI: "Account 0.0.123789 holds the following tokens..."
*/