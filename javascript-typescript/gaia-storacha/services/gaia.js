const axios = require('axios');
const OpenAI = require('openai');

class GaiaService {
  constructor() {
    this.apiUrl = process.env.GAIA_API_URL;
    this.apiKey = process.env.GAIA_API_KEY;
    this.metadata = null; // Cache for node metadata
    this.customSystemPrompt = null; // User-defined system prompt

    if (!this.apiUrl || !this.apiKey) {
      throw new Error('Gaia API credentials are required. Please set GAIA_API_URL and GAIA_API_KEY in your .env file.');
    }

    // Initialize OpenAI client with Gaia endpoint
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.apiUrl
    });
  }

  async chat(message, customSystemPrompt = null) {
    try {
      // Get metadata to determine the model
      const metadata = await this.fetchMetadata();
      
      // Build messages array
      const messages = [];
      
      // Add system prompt if available
      const systemPrompt = customSystemPrompt || this.customSystemPrompt || metadata.system_prompt;
      if (systemPrompt && systemPrompt !== 'No system prompt available') {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Add user message
      messages.push({ role: 'user', content: message });

      const response = await this.openai.chat.completions.create({
        model: metadata.model,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
      };
    } catch (error) {
      console.error('Gaia API error:', error.message);
      throw new Error(`Failed to get response from Gaia: ${error.message}`);
    }
  }

  setCustomSystemPrompt(prompt) {
    this.customSystemPrompt = prompt;
    console.log('✅ Custom system prompt updated');
  }

  getSystemPrompt() {
    return this.customSystemPrompt || this.metadata?.system_prompt || 'No system prompt available';
  }

  async fetchMetadata() {
    if (this.metadata) {
      return this.metadata; // Return cached metadata
    }

    try {
      // Extract base URL (remove /v1 if present)
      const baseUrl = this.apiUrl.replace('/v1', '');

      // Fetch models and config in parallel
      const [modelsResponse, configResponse] = await Promise.all([
        axios.get(`${this.apiUrl}/models`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        }),
        axios.get(`${baseUrl}/config_pub.json`)
      ]);

      const models = modelsResponse.data.data || [];
      const config = configResponse.data || {};

      // Filter out embedding models, keep only chat models
      const chatModels = models.filter(m => !m.id.toLowerCase().includes('embed'));
      
      this.metadata = {
        model: chatModels.length > 0 ? chatModels[0].id : 'unknown',
        gaia_node_url: baseUrl,
        system_prompt: config.system_prompt || 'No system prompt available'
      };

      console.log(`✅ Fetched Gaia node metadata: ${this.metadata.model}`);
      return this.metadata;

    } catch (error) {
      console.error('⚠️  Could not fetch Gaia metadata:', error.message);
      throw new Error(`Failed to fetch Gaia metadata: ${error.message}`);
    }
  }


}

module.exports = { GaiaService };