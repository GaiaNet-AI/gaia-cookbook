const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { StorachaService } = require('./services/storacha');
const { GaiaService } = require('./services/gaia');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize services
const storachaService = new StorachaService();
const gaiaService = new GaiaService();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chat endpoint - just chat, don't store automatically
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemPrompt } = req.body;
    
    // Get AI response from Gaia with optional custom system prompt
    const aiResponse = await gaiaService.chat(message, systemPrompt);
    
    res.json({
      success: true,
      message: aiResponse.content,
      usage: aiResponse.usage
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current system prompt
app.get('/api/system-prompt', async (req, res) => {
  try {
    const metadata = await gaiaService.fetchMetadata();
    res.json({
      success: true,
      systemPrompt: gaiaService.getSystemPrompt(),
      defaultSystemPrompt: metadata.system_prompt
    });
  } catch (error) {
    console.error('Get system prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update system prompt
app.post('/api/system-prompt', async (req, res) => {
  try {
    const { systemPrompt } = req.body;
    gaiaService.setCustomSystemPrompt(systemPrompt);
    
    res.json({
      success: true,
      message: 'System prompt updated successfully'
    });
  } catch (error) {
    console.error('Update system prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Store conversation endpoint
app.post('/api/store-conversation', async (req, res) => {
  try {
    const { conversation } = req.body;
    
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation data'
      });
    }
    
    // Fetch Gaia metadata
    const gaiaMetadata = await gaiaService.fetchMetadata();
    
    // Store on Storacha with metadata
    const result = await storachaService.storeConversation(conversation, gaiaMetadata);
    
    res.json({
      success: true,
      storageCid: result.cid,
      ipfsUrl: result.ipfsUrl,
      message: 'Conversation stored on Storacha successfully'
    });
    
  } catch (error) {
    console.error('Store conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get stored conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await storachaService.getStoredConversations();
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Retrieve specific conversation by CID
app.get('/api/conversations/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const conversation = await storachaService.retrieveConversation(cid);
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Retrieve conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Gaia + Storacha Demo running on http://localhost:${PORT}`);
  console.log('📝 Make sure to configure your .env file with Gaia and Storacha credentials');
});