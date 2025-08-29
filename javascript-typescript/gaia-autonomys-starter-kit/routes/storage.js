import express from 'express';
import { createAutoDriveApi } from '@autonomys/auto-drive';
import { NetworkId } from '@autonomys/auto-utils';
import { chatSessions } from './chat.js';

const router = express.Router();

let api = null;
function getAutoDriveApi() {
  if (!api) {
    if (!process.env.AUTODRIVE_API_KEY) {
      throw new Error('AUTODRIVE_API_KEY environment variable is required');
    }
    api = createAutoDriveApi({
      apiKey: process.env.AUTODRIVE_API_KEY,
      network: NetworkId.TAURUS
    });
  }
  return api;
}

router.post('/store-chat', async (req, res) => {
  try {
    const { sessionId, walletAddress, networkId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const validNetworks = [490000, 'eip155:490000'];
    if (networkId && !validNetworks.includes(networkId)) {
      return res.status(400).json({ error: 'Invalid network. Please connect to Autonomys EVM (Chain ID: 490000).' });
    }

    const session = chatSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    if (!session.messages || session.messages.length === 0) {
      return res.status(400).json({ error: 'No conversation found to store' });
    }

    const calculateStorageCost = (sizeInBytes) => {
      const costPerKB = 0.001;
      const sizeInKB = sizeInBytes / 1024;
      return Math.max(sizeInKB * costPerKB, 0.001);
    };

    const initialChatData = {
      sessionId,
      walletAddress,
      networkId: networkId || 'unknown',
      systemPrompt: session.systemPrompt,
      messages: session.messages,
      totalTokens: session.totalTokens,
      createdAt: session.createdAt,
      storedAt: new Date().toISOString(),
      model: session.model || 'default-model',
      gaiaNodeUrl: process.env.GAIA_NODE_URL,
      network: 'Autonomys EVM'
    };

    const initialJsonData = JSON.stringify(initialChatData, null, 2);
    const initialBuffer = Buffer.from(initialJsonData, 'utf8');
    const estimatedStorageCost = calculateStorageCost(initialBuffer.length);

    const chatData = {
      ...initialChatData,
      storage: {
        fileSizeBytes: initialBuffer.length,
        fileSizeKB: Math.round((initialBuffer.length / 1024) * 100) / 100,
        estimatedCostTAI3: Math.round(estimatedStorageCost * 1000000) / 1000000,
        costCalculation: {
          method: 'estimated',
          ratePerKB: 0.001,
          note: 'Actual cost may vary based on network conditions and AutoDrive pricing'
        }
      }
    };

    const jsonData = JSON.stringify(chatData, null, 2);
    const buffer = Buffer.from(jsonData, 'utf8');

    // Store inside folder named after wallet address
    const genericFile = {
      read: async function* () {
        yield buffer;
      },
      name: `chat-transcript-${sessionId}.json`,
      mimeType: 'application/json',
      size: buffer.length,
      path: `${walletAddress}/chat-transcript-${sessionId}.json`
    };

    const options = {
      compression: true
    };

    const autoDriveApi = getAutoDriveApi();
    const cid = await autoDriveApi.uploadFile(genericFile, options);

    let publicUrl;
    try {
      publicUrl = await autoDriveApi.publishObject(cid);
    } catch {
      publicUrl = null;
    }
    
    const gatewayUrl = `https://gateway.autonomys.xyz/file/${cid}`;

    res.json({
      success: true,
      cid,
      publicUrl,
      gatewayUrl,
      fileName: genericFile.name,
      size: buffer.length,
      sizeKB: Math.round((buffer.length / 1024) * 100) / 100,
      estimatedCostTAI3: chatData.storage.estimatedCostTAI3,
      storedAt: chatData.storedAt,
      storage: chatData.storage,
      note: publicUrl 
        ? 'File uploaded successfully. Use gatewayUrl for immediate access.' 
        : 'File uploaded successfully. Public URL creation failed, use gatewayUrl.'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to store chat transcript',
      details: error.message
    });
  }
});


router.get('/my-files', async (req, res) => {
  try {
    const { page = 0, limit = 10, walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const autoDriveApi = getAutoDriveApi();

    // Get files only inside this wallet's folder
    // const myFiles = await autoDriveApi.getMyFiles(parseInt(page), parseInt(limit), {
    //   prefix: `${walletAddress}/`
    // });

    const myFiles = await autoDriveApi.getMyFiles(parseInt(page), parseInt(limit));

    console.log(JSON.stringify(myFiles, null, 2));
    const userFiles = [];

    for (const file of myFiles.rows) {
      try {
        //const stream = await autoDriveApi.downloadFile(file.headCid);
        //let fileContent = Buffer.alloc(0);
    
        // for await (const chunk of stream) {
        //   fileContent = Buffer.concat([fileContent, chunk]);
        // }
    
        // const text = fileContent.toString();
        // console.log(`File ${file.name} content:`, text);
    
        //const jsonData = JSON.parse(text);
        
        // userFiles.push({
        //   ...file,
        //   chatData: {
        //     sessionId: jsonData.sessionId,
        //     createdAt: jsonData.createdAt,
        //     storedAt: jsonData.storedAt,
        //     totalTokens: jsonData.totalTokens,
        //     messageCount: jsonData.messages ? jsonData.messages.length : 0,
        //     model: jsonData.model,
        //     estimatedCost: jsonData.storage?.estimatedCostTAI3 || 0,
        //     fileSize: jsonData.storage?.fileSizeKB || 0
        //   },
        //   gatewayUrl: `https://gateway.autonomys.xyz/file/${file.headCid}`
        // });

        userFiles.push({
          ...file,
          createdAt: file.createdAt,
          size: file.size,
          name: file.name,
          gatewayUrl: `https://gateway.autonomys.xyz/file/${file.headCid}`
        });

      } catch (error) {
        console.error(`Failed to parse ${file.name}:`, error.message);
      }
    }

    res.json({
      files: userFiles,
      totalCount: myFiles.totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      walletAddress
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve files',
      details: error.message
    });
  }
});

router.get('/download/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    const autoDriveApi = getAutoDriveApi();
    const stream = await autoDriveApi.downloadFile(cid);
    let file = Buffer.alloc(0);

    for await (const chunk of stream) {
      file = Buffer.concat([file, chunk]);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat-transcript-${cid}.json"`);
    res.send(file);

  } catch (error) {
    // console.error('Download error:', error);
    res.status(500).json({
      error: 'Failed to download file',
      details: error.message
    });
  }
});

export { router as storageRoutes };