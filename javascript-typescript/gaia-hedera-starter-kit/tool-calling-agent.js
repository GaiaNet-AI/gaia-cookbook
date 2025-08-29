import {
    HederaLangchainToolkit,
    AgentMode,
    coreHTSPlugin,
    coreAccountPlugin,
    coreConsensusPlugin,
    coreQueriesPlugin,
    coreHTSPluginToolNames,
    coreAccountPluginToolNames,
    coreConsensusPluginToolNames,
    coreQueriesPluginToolNames
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
    // Initializes the connection to your local Gaia node, treating it as an OpenAI-compatible API.
    const llm = new ChatOpenAI({
        // The 'configuration' object is used to specify the endpoint and credentials.
        configuration: {
            baseURL: process.env.GAIA_NODE_URL,
            apiKey: process.env.GAIA_API_KEY,
        },
        model: process.env.GAIA_MODEL_NAME, // The specific model your Gaia node is serving.
        temperature: 0, // A temperature of 0 makes the model's responses more deterministic.
    });

    // Section 2: Hedera Client Setup
    // Configures the Hedera client that will execute transactions.
    // This client is given your credentials and will pay for/sign all transactions.
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY),
    );

    // Section 3: Hedera Agent Toolkit & Tool Selection
    // This is where we define which Hedera capabilities our agent will have.
    const {
        CREATE_FUNGIBLE_TOKEN_TOOL,
        MINT_FUNGIBLE_TOKEN_TOOL,
    } = coreHTSPluginToolNames;
    const { TRANSFER_HBAR_TOOL } = coreAccountPluginToolNames;
    const { CREATE_TOPIC_TOOL, SUBMIT_TOPIC_MESSAGE_TOOL } = coreConsensusPluginToolNames;
    const { GET_HBAR_BALANCE_QUERY_TOOL, GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL } = coreQueriesPluginToolNames;

    const hederaAgentToolkit = new HederaLangchainToolkit({
        client, // The client that will perform the actions.
        configuration: {
            // We explicitly list the tools compatible with the Gaia node to prevent schema errors.
            tools: [
                GET_HBAR_BALANCE_QUERY_TOOL,
                GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL,
                TRANSFER_HBAR_TOOL,
                CREATE_TOPIC_TOOL,
                SUBMIT_TOPIC_MESSAGE_TOOL,
                CREATE_FUNGIBLE_TOKEN_TOOL,
                MINT_FUNGIBLE_TOKEN_TOOL
            ],
            // AUTONOMOUS mode means the agent will execute transactions directly.
            context: {
                mode: AgentMode.AUTONOMOUS,
            },
            plugins: [coreHTSPlugin, coreAccountPlugin, coreConsensusPlugin, coreQueriesPlugin],
        },
    });

    // Section 4: Agent & Executor Setup
    // We create the agent, giving it the LLM and the tools it can use.
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', 'You are a helpful assistant that can interact with the Hedera blockchain.'],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}'],
    ]);
    const tools = hederaAgentToolkit.getTools();
    const agent = createToolCallingAgent({ llm, tools, prompt });

    // The AgentExecutor is responsible for running the agent and managing its state.
    const agentExecutor = new AgentExecutor({
        agent,
        tools,
        // BufferMemory gives the agent short-term memory of the conversation.
        memory: new BufferMemory({
            memoryKey: 'chat_history',
            inputKey: 'input',
            outputKey: 'output',
            returnMessages: true,
        }),
    });

    // Section 5: Main Application Loop
    console.log('Hedera Agent CLI Chatbot — type "exit" to quit');
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
            process.stdout.write('\r'); // Clear the loader line
            console.log(`AI: ${response?.output ?? response}`);
        } catch (err) {
            clearInterval(loader);
            process.stdout.write('\r'); // Clear the loader line
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

This agent executes transactions autonomously.

1.  Check your HBAR balance:
    -   You: "what is my hbar balance"
    -   AI: "Your HBAR balance is 10000 ℏ."

2.  Create a new Hedera Consensus Service Topic:
    -   You: "create a new topic for our project updates"
    -   AI: "I have created a new topic for you. The topic ID is 0.0.123456."

3.  Submit a message to that topic:
    -   You: "submit 'hello world' to topic 0.0.123456"
    -   AI: "The message has been submitted successfully."

4.  Create a new Fungible Token (this will cost HBAR):
    -   You: "create a fungible token called 'Starter Token' with symbol 'STK' and an initial supply of 10000"
    -   AI: "I've created the 'Starter Token' (STK) token for you with an initial supply of 10000. The new token ID is 0.0.654321."

5.  Transfer HBAR to another account (this will cost HBAR):
    -   You: "send 10 hbar to account 0.0.987"
    -   AI: "I have transferred 10 HBAR to account 0.0.987."
*/