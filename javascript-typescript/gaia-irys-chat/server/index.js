const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { OpenAI } = require('openai');
const Irys = require('@irys/sdk');
const { Uploader } = require('@irys/upload');
const { Ethereum } = require('@irys/upload-ethereum');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.GAIA_API_KEY,
  baseURL: process.env.GAIA_NODE_URL
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


const getIrysUploader = async () => {
  // Using Sepolia testnet RPC (chainId: 11155111)
  const rpcURL = "https://ethereum-sepolia-rpc.publicnode.com";
  
  const irysUploader = await Uploader(Ethereum)
    .withWallet(process.env.PRIVATE_KEY)
    .withRpc(rpcURL)
    .devnet();

  return irysUploader;
};

// Update the balance checking function to work with the new SDK
const checkBalance = async () => {
  try {
    const irys = await getIrysUploader();
    
    // Get loaded balance in atomic units
    const atomicBalance = await irys.getLoadedBalance();
    // Convert balance to standard units
    const convertedBalance = irys.utils.fromAtomic(atomicBalance);
    return convertedBalance.toNumber();
  } catch (error) {
    console.error('Error checking Irys balance:', error);
    return 0;
  }
};


const checkAndPrintBalance = async () => {
  try {
    const balance = await checkBalance();
    const threshold = 0.001; // Lower threshold for testnet

    if (Math.abs(balance) <= threshold) {
      console.log(`⚠️  Irys Balance ${balance} ETH is low, please fund for uploads.`);
    } else {
      console.log(`✅ Irys Balance: ${balance} ETH - Funding sufficient.`);
    }
    
    return balance;
  } catch (error) {
    console.error('Error checking and printing balance:', error);
    return 0;
  }
};

// Call the function immediately when server starts
checkAndPrintBalance();

// Then repeat every 30 minutes (or adjust as needed)
setInterval(checkAndPrintBalance, 30 * 60 * 1000);

app.get('/api/irys/balance', async (req, res) => {
  try {
    const balance = await checkBalance();
    res.json({ balance });
  } catch (error) {
    console.error('Error fetching Irys balance:', error);
    res.status(500).json({ error: 'Failed to fetch Irys balance', balance: 0 });
  }
});

// Gaia API endpoint
app.get('/api/config', async (req, res) => {
    try {
      // Fetch model info from Gaia
      const [infoResponse, modelsResponse, configResponse] = await Promise.all([
        fetch(`${process.env.GAIA_NODE_URL}/info`),
        fetch(`${process.env.GAIA_NODE_URL}/models`),
        fetch(`${process.env.GAIA_NODE_URL.replace('/v1', '')}/config_pub.json`)
      ]);
  
      const infoData = await infoResponse.json();
      const modelsData = await modelsResponse.json();
      const configData = await configResponse.json();
  
      // Get chat model name from info or models
      const chatModel = infoData.models?.chat?.name || 
                       (modelsData.data && modelsData.data.length > 0 ? modelsData.data[0].id : 'unknown');
  
        res.json({
        modelName: chatModel,
        systemPrompt: configData.system_prompt || '',
        nodeInfo: infoData,
        modelList: modelsData,
        gaiaNodeUrl: process.env.GAIA_NODE_URL // Add this line
        });
    } catch (error) {
      console.error('Error fetching Gaia configuration:', error);
      res.status(500).json({ 
        error: 'Failed to fetch Gaia configuration',
        modelName: process.env.GAIA_MODEL_NAME || "gpt-4" // fallback
      });
    }
});

app.get('/api/gaia/info', async (req, res) => {
    try {
      const response = await fetch(`${process.env.GAIA_NODE_URL.replace('/v1', '')}/info`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching Gaia info:', error);
      res.status(500).json({ error: 'Failed to fetch Gaia info' });
    }
  });
  
  app.get('/api/gaia/models', async (req, res) => {
    try {
      const response = await fetch(`${process.env.GAIA_NODE_URL}/models`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching Gaia models:', error);
      res.status(500).json({ error: 'Failed to fetch Gaia models' });
    }
  });
  
  app.get('/api/gaia/config', async (req, res) => {
    try {
      const response = await fetch(`${process.env.GAIA_NODE_URL.replace('/v1', '')}/config_pub.json`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching Gaia config:', error);
      res.status(500).json({ error: 'Failed to fetch Gaia config' });
    }
  });
  

// Update Gaia API endpoint to use user-provided config:
app.post('/api/gaia/completions', async (req, res) => {
  try {
      const { messages, model } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
          return res.status(400).json({ error: 'Messages array is required' });
      }
      
      // Use env variables for now - in a full implementation, you'd use user-provided config
      const openai = new OpenAI({
          apiKey: process.env.GAIA_API_KEY,
          baseURL: process.env.GAIA_NODE_URL
      });
      
      // Check if system prompt is already included in the messages
      const hasSystemPrompt = messages.some(msg => msg.role === 'system');
      
      let apiMessages = [...messages];
      
      // Only fetch and add system prompt if not already provided
      if (!hasSystemPrompt) {
          let systemPrompt = '';
          try {
              const configResponse = await fetch(`${process.env.GAIA_NODE_URL.replace('/v1', '')}/config_pub.json`);
              const configData = await configResponse.json();
              systemPrompt = configData.system_prompt || '';
          } catch (configError) {
              console.warn('Could not fetch system prompt, using empty string');
          }
          
          if (systemPrompt) {
              apiMessages.unshift({
                  role: 'system',
                  content: systemPrompt
              });
          }
      }
      
      const response = await openai.chat.completions.create({
          model: model || process.env.GAIA_MODEL_NAME || "gpt-4",
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 300
      });
      
      res.json(response);
  } catch (error) {
      console.error('Error calling Gaia API:', error);
      res.status(500).json({ error: 'Failed to get response from Gaia node' });
  }
});
  
// Irys upload endpoint
app.post('/api/irys/upload', async (req, res) => {
  try {
      const { data } = req.body;
      
      if (!data) {
          return res.status(400).json({ error: 'Data is required' });
      }
      
      // Use the modern Irys uploader
      const irys = await getIrysUploader();
      
      // Calculate price
      const dataSize = JSON.stringify(data).length;
      const price = await irys.getPrice(dataSize);
      const costInEth = irys.utils.fromAtomic(price).toNumber();
      
      // Add cost and dataSize to the metadata
      const enhancedData = {
        ...data,
        metadata: {
            ...data.metadata,
            upload_cost_eth: costInEth,
            data_size_bytes: dataSize,
            gaia_node_url: process.env.GAIA_NODE_URL,
            irys_node: "https://devnet.irys.xyz",
            upload_timestamp: new Date().toISOString(),
            token_type: "ethereum",
            chain_id: 11155111, // Sepolia testnet chain ID
            app_version: "1.0.0"
        }
      };
      
      // Upload data to Irys with tags
      const transaction = await irys.upload(JSON.stringify(enhancedData), {
          tags: [
              { name: "Content-Type", value: "application/json" },
              { name: "App-Name", value: "GAIA-NODE-CHAT" },
              { name: "User-Address", value: data.metadata?.user_id || 'unknown' }
          ]
      });
      
      res.json({
          id: transaction.id,
          url: `https://devnet.irys.xyz/${transaction.id}`,
          cost: costInEth
      });
  } catch (error) {
      console.error('Error uploading to Irys:', error);
      res.status(500).json({ error: 'Failed to upload to Irys' });
  }
});

// Update the /api/irys/user-transactions/:address endpoint:
app.get('/api/irys/user-transactions/:address', async (req, res) => {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({ error: 'Wallet address is required' });
      }
      
      // GraphQL query to fetch transactions by owner address
      const query = `
        query getByOwner {
          transactions(
            owners: ["${address}"]
          ) {
            edges {
              node {
                id
                address
                timestamp
              }
            }
          }
        }
      `;
      
      // Make GraphQL request to Irys
      const response = await fetch('https://uploader.irys.xyz/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {}
        })
      });
      
      const result = await response.json();
      //console.log(result);
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return res.status(500).json({ error: 'Failed to fetch transactions from Irys' });
      }
      
      // Process the results
      const transactions = result.data.transactions.edges.map(edge => {
        const node = edge.node;
        return {
          id: node.id,
          address: node.address,
          timestamp: node.timestamp,
          url: `https://gateway.irys.xyz/${node.id}`
        };
      });
      
      res.json({ transactions });
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      res.status(500).json({ error: 'Failed to fetch user transactions', transactions: [] });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GAIA_NODE_URL: ${process.env.GAIA_NODE_URL}`);
});