const { create } = require('@storacha/client');

// Polyfill File for Node.js
if (typeof File === 'undefined') {
  global.File = class File {
    constructor(chunks, filename, options = {}) {
      this.name = filename;
      this.type = options.type || '';
      this.size = 0;
      this._chunks = chunks;
      
      // Calculate size
      for (const chunk of chunks) {
        if (chunk instanceof Buffer) {
          this.size += chunk.length;
        } else if (typeof chunk === 'string') {
          this.size += Buffer.byteLength(chunk);
        }
      }
    }
    
    stream() {
      const { Readable } = require('stream');
      return Readable.from(this._chunks);
    }
    
    arrayBuffer() {
      return Promise.resolve(Buffer.concat(this._chunks.map(chunk => 
        chunk instanceof Buffer ? chunk : Buffer.from(chunk)
      )));
    }
  };
}

class StorachaService {
  constructor() {
    this.agentKey = process.env.STORACHA_KEY;
    this.delegationProof = process.env.STORACHA_PROOF;
    this.client = null;
    this.conversationCids = []; // In-memory storage for demo
    
    if (!this.agentKey || !this.delegationProof) {
      throw new Error('Storacha credentials are required. Please set STORACHA_KEY and STORACHA_PROOF in your .env file.');
    }
  }

  async initClient() {
    if (this.client) return;
    
    try {
      // Create the basic client
      this.client = await create();
      console.log('✅ Storacha client created');
      console.log('🔧 Delegation proof configured, will attempt to use delegated space');
    } catch (error) {
      console.error('Failed to initialize Storacha client:', error);
      throw new Error(`Failed to initialize Storacha client: ${error.message}`);
    }
  }

  async storeConversation(conversation, gaiaMetadata = null) {
    await this.initClient();

    try {
      // Calculate total tokens from all messages
      const totalTokens = conversation.messages.reduce((sum, msg) => {
        return sum + (msg.usage?.total_tokens || 0);
      }, 0);

      // Create enhanced conversation object with metadata
      const enhancedConversation = {
        ...conversation,
        metadata: {
          stored_at: new Date().toISOString(),
          model: gaiaMetadata?.model || 'unknown',
          gaia_node_url: gaiaMetadata?.gaia_node_url || 'unknown',
          system_prompt: gaiaMetadata?.system_prompt || 'No system prompt available',
          space_did: 'did:key:z6MkuhC39q11h2DuHhWSyS4vExybvUhq2HJCZmp2ut9NGwQj', // Your actual space DID
          space_name: 'gaia-storacha-example',
          total_tokens: totalTokens,
          file_size_bytes: 0 // Will be calculated
        }
      };
      
      // Convert to JSON and calculate size
      const conversationData = JSON.stringify(enhancedConversation, null, 2);
      const fileSizeBytes = Buffer.byteLength(conversationData, 'utf8');
      
      // Update file size in metadata
      enhancedConversation.metadata.file_size_bytes = fileSizeBytes;
      
      // Re-stringify with updated metadata
      const finalConversationData = JSON.stringify(enhancedConversation, null, 2);
      
      // Create a proper File object with the JSON data
      const file = new File([finalConversationData], `conversation-${conversation.id}.json`, {
        type: 'application/json'
      });
      
      console.log(`📤 Uploading conversation file: ${file.name} (${fileSizeBytes} bytes)`);
      
      // Upload using the uploadFile method
      const result = await this.client.uploadFile(file);
      
      // Extract CID from result - the result should be the root CID
      const cid = result.toString();
      const ipfsUrl = `https://${cid}.ipfs.w3s.link/`;
      
      // Keep track of stored conversations
      this.conversationCids.push({
        cid: cid,
        id: conversation.id,
        timestamp: conversation.timestamp,
        preview: conversation.messages[0]?.content?.substring(0, 100) + '...',
        fileSizeBytes: fileSizeBytes,
        model: enhancedConversation.metadata.model
      });
      
      console.log(`✅ Conversation stored on Storacha with CID: ${cid}`);
      console.log(`🔗 IPFS URL: ${ipfsUrl}`);
      
      return {
        cid: cid,
        ipfsUrl: ipfsUrl,
        fileSizeBytes: fileSizeBytes
      };
      
    } catch (error) {
      console.error('Storacha storage error:', error);
      
      if (error.cause && error.cause.name === 'InsufficientStorage') {
        const spaceDid = error.cause.message.split(' ')[0];
        console.log('💡 Your Storacha space needs storage provisioning:');
        console.log(`   Space DID: ${spaceDid}`);
        console.log('     1. npm install -g @storacha/cli');
        console.log('     2. storacha login your-email@example.com');
        console.log(`     3. storacha space provision ${spaceDid}`);
        throw new Error(`Storacha space needs storage provisioning. Space DID: ${spaceDid}`);
      }
      
      throw new Error(`Failed to store conversation on Storacha: ${error.message}`);
    }
  }

  async retrieveConversation(cid) {
    await this.initClient();

    try {
      // Retrieve from Storacha using CID
      const response = await fetch(`https://gateway.storacha.network/ipfs/${cid}`);
      const conversationData = await response.json();
      
      return conversationData;
      
    } catch (error) {
      console.error('Storacha retrieval error:', error);
      throw new Error(`Failed to retrieve conversation: ${error.message}`);
    }
  }

  async getStoredConversations() {
    return this.conversationCids;
  }


}

module.exports = { StorachaService };