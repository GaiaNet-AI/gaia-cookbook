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
import { Client, PrivateKey, Transaction } from '@hashgraph/sdk';
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

/**
 * The response from a 'RETURN_BYTES' agent contains the transaction bytes
 * within the 'intermediateSteps'. This function safely extracts them.
 */
function extractBytesFromAgentResponse(response) {
    if (
        response.intermediateSteps &&
        response.intermediateSteps.length > 0 &&
        response.intermediateSteps[0].observation
    ) {
        const obs = response.intermediateSteps[0].observation;
        try {
            const obsObj = typeof obs === 'string' ? JSON.parse(obs) : obs;
            if (obsObj.bytes) {
                return obsObj.bytes;
            }
        } catch (e) {
            console.error('Could not parse agent observation:', e);
        }
    }
    return undefined;
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

    const operatorAccountId = process.env.ACCOUNT_ID;
    const operatorPrivateKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY);

    // Section 2: Hedera Client Setup (Two Clients)
    const humanInTheLoopClient = Client.forTestnet().setOperator(
        operatorAccountId,
        operatorPrivateKey,
    );
    const agentClient = Client.forTestnet();
    
    // Section 3: Hedera Agent Toolkit & Tool Selection
    const { CREATE_FUNGIBLE_TOKEN_TOOL } = coreHTSPluginToolNames;
    const { TRANSFER_HBAR_TOOL } = coreAccountPluginToolNames;
    const { GET_HBAR_BALANCE_QUERY_TOOL } = coreQueriesPluginToolNames;

    const hederaAgentToolkit = new HederaLangchainToolkit({
        client: agentClient,
        configuration: {
            tools: [
                GET_HBAR_BALANCE_QUERY_TOOL,
                TRANSFER_HBAR_TOOL,
                CREATE_FUNGIBLE_TOKEN_TOOL
            ],
            context: {
                mode: AgentMode.RETURN_BYTES,
                accountId: operatorAccountId,
            },
            plugins: [coreHTSPlugin, coreAccountPlugin, coreConsensusPlugin, coreQueriesPlugin],
        },
    });

    // Section 4: Agent & Executor Setup
    // --- FIX: Add specific instructions to the system prompt to ensure correct data types. ---
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', `You are a helpful assistant that prepares Hedera transactions for execution.
IMPORTANT: When you use a tool, you MUST ensure that any parameter representing a currency amount (like 'hbarAmount' or 'amount') is passed as a STRING, not a number. For example, use "2.5", not 2.5.`],
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
        returnIntermediateSteps: true,
    });

    // Section 5: Main Application Loop
    console.log('Hedera "Return Bytes" Agent CLI — type "exit" to quit');
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

            const bytes = extractBytesFromAgentResponse(response);
            if (bytes) {
                const realBytes = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes.data);
                const tx = Transaction.fromBytes(realBytes);

                console.log('\n--- Transaction bytes received. Executing... ---');
                const result = await tx.execute(humanInTheLoopClient);
                const receipt = await result.getReceipt(humanInTheLoopClient);

                console.log('Transaction receipt:', receipt.status.toString());
                console.log('Transaction ID:', result.transactionId.toString());
                console.log('------------------------------------------------');
            } else {
                console.log('(No transaction bytes were returned. This is normal for queries.)');
            }
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

This agent prepares transactions but does not execute them. The script does.

1.  Ask for a transaction to be prepared:
    -   You: "prepare a transaction to send 2.5 hbar to 0.0.6532914"
    -   AI: "I have prepared the transaction to send 2.5 HBAR to account 0.0.6532914."
    -   (Console will then show the "Transaction bytes received. Executing..." message and the receipt.)

2.  Ask for a different transaction:
    -   You: "get the bytes to create a token called 'Wallet Token' with symbol 'WTK'"
    -   AI: "I have the transaction bytes ready for you to create the 'My Wallet Token' (MWT)."
    -   (Console will again show the execution and receipt.)

3.  Make a simple query (no bytes returned):
    -   You: "what's my balance"
    -   AI: "Your HBAR balance is 9984.5 ℏ."
    -   (Console will then show "(No transaction bytes were returned. This is normal for queries.)")
*/