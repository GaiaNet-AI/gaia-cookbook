import express from 'express';
import OpenAI from 'openai';
import axios from 'axios';
import { marked } from 'marked';

const router = express.Router();
const chatSessions = new Map();

let nodeInfo = null;
let availableModels = null;
let nodeConfig = null;
let openai = null;
let customSystemPrompt = null;

function getOpenAIClient() {
    if (!openai) {
        if (!process.env.GAIA_NODE_URL) {
            throw new Error('GAIA_NODE_URL environment variable is required');
        }
        const baseURL = `${process.env.GAIA_NODE_URL}/v1`;
        // console.log('Initializing OpenAI client with baseURL:', baseURL);

        openai = new OpenAI({
            baseURL,
            apiKey: process.env.GAIA_API_KEY || 'dummy-key',
        });
    }
    return openai;
}

async function ensureModelsLoaded() {
    if (!availableModels) {
        try {
            const client = getOpenAIClient();
            const modelsResponse = await client.models.list();
            availableModels = modelsResponse.data;
            // console.log('Loaded available models:', availableModels.map(m => m.id));
        } catch (error) {
            // console.warn('Could not fetch models:', error.message);
            availableModels = [{ id: 'default-model' }];
        }
    }
    return availableModels;
}

router.post('/message', async (req, res) => {
    try {
        const { message, sessionId, systemPrompt, model, walletAddress } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!nodeConfig) {
            try {
                const configResponse = await axios.get(`${process.env.GAIA_NODE_URL}/config_pub.json`);
                nodeConfig = configResponse.data;
            } catch (error) {
                // console.warn('Could not fetch node config:', error.message);
                nodeConfig = { system_prompt: "You are a helpful AI assistant." };
            }
        }

        const effectiveSystemPrompt = customSystemPrompt || systemPrompt || nodeConfig.system_prompt || "You are a helpful AI assistant.";

        await ensureModelsLoaded();

        const selectedModel = model || availableModels[0]?.id || 'default-model';
        // console.log('Selected model:', selectedModel);

        let session = chatSessions.get(sessionId) || {
            messages: [],
            totalTokens: 0,
            createdAt: new Date().toISOString(),
            systemPrompt: effectiveSystemPrompt,
            model: selectedModel,
            gaiaNodeUrl: process.env.GAIA_NODE_URL,
            walletAddress: walletAddress
        };

        session.systemPrompt = effectiveSystemPrompt;
        if (walletAddress) {
            session.walletAddress = walletAddress;
        }

        session.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        const apiMessages = [
            { role: 'system', content: effectiveSystemPrompt },
            ...session.messages.map(msg => ({ role: msg.role, content: msg.content }))
        ];

        const client = getOpenAIClient();

        const completion = await client.chat.completions.create({
            model: selectedModel,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 1000,
        });

        // console.log('Received response from Gaia Node:', completion);

        const aiResponse = completion.choices[0].message.content;
        const tokensUsed = completion.usage?.total_tokens || 0;

        session.messages.push({
            role: 'assistant',
            content: marked.parse(aiResponse),
            timestamp: new Date().toISOString()
        });

        session.totalTokens += tokensUsed;
        session.lastUpdated = new Date().toISOString();
        session.model = selectedModel;

        chatSessions.set(sessionId, session);

        res.json({
            response: marked.parse(aiResponse),
            sessionId,
            totalTokens: session.totalTokens,
            tokensUsed,
            model: selectedModel
        });

    } catch (error) {
        // console.error('Chat error details:');
        // console.error('- Error message:', error.message);
        // console.error('- Error status:', error.status);
        // console.error('- Error code:', error.code);
        // console.error('- Full error:', error);

        res.status(500).json({
            error: 'Failed to process chat message',
            details: error.message,
            status: error.status,
            code: error.code
        });
    }
});

router.get('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = chatSessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
});

// Get Gaia Node configuration
router.get('/node-config', async (req, res) => {
    try {
        const configResponse = await axios.get(`${process.env.GAIA_NODE_URL}/config_pub.json`);
        nodeConfig = configResponse.data;
        res.json(configResponse.data);
    } catch (error) {
        // console.error('Failed to fetch node config:', error.message);
        res.status(500).json({ error: 'Failed to fetch node configuration' });
    }
});

router.get('/system-prompt', async (req, res) => {
    try {
        if (!nodeConfig) {
            try {
                const configResponse = await axios.get(`${process.env.GAIA_NODE_URL}/config_pub.json`);
                nodeConfig = configResponse.data;
            } catch (error) {
                // console.warn('Could not fetch node config:', error.message);
                nodeConfig = { system_prompt: "You are a helpful AI assistant." };
            }
        }

        res.json({
            nodeSystemPrompt: nodeConfig.system_prompt || "You are a helpful AI assistant.",
            customSystemPrompt: customSystemPrompt,
            currentSystemPrompt: customSystemPrompt || nodeConfig.system_prompt || "You are a helpful AI assistant."
        });
    } catch (error) {
        // console.error('Failed to get system prompt:', error.message);
        res.status(500).json({ error: 'Failed to get system prompt' });
    }
});

router.post('/system-prompt', async (req, res) => {
    try {
        const { systemPrompt } = req.body;

        if (typeof systemPrompt !== 'string') {
            return res.status(400).json({ error: 'System prompt must be a string' });
        }

        customSystemPrompt = systemPrompt.trim() || null;

        res.json({
            success: true,
            customSystemPrompt: customSystemPrompt,
            message: customSystemPrompt ? 'Custom system prompt updated' : 'Custom system prompt cleared, using node default'
        });
    } catch (error) {
        // console.error('Failed to update system prompt:', error.message);
        res.status(500).json({ error: 'Failed to update system prompt' });
    }
});

router.delete('/system-prompt', async (req, res) => {
    try {
        customSystemPrompt = null;
        res.json({
            success: true,
            message: 'Custom system prompt cleared, using node default'
        });
    } catch (error) {
        // console.error('Failed to reset system prompt:', error.message);
        res.status(500).json({ error: 'Failed to reset system prompt' });
    }
});

router.get('/models', async (req, res) => {
    try {
        const models = await ensureModelsLoaded();
        res.json(models);
    } catch (error) {
        // console.error('Failed to fetch models:', error.message);
        res.status(500).json({ error: 'Failed to fetch available models' });
    }
});

// Export chat sessions for storage route
export { chatSessions };
export { router as chatRoutes };