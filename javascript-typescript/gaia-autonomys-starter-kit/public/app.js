let walletConnected = false;
let walletAddress = '';
let walletNetwork = null;
let sessionId = generateSessionId();
let totalTokens = 0;
let availableModels = [];
let currentModel = '';
let systemPromptData = null;
let hasConversation = false;
let appConfig = null;

document.getElementById('session-id').textContent = sessionId;
initializeApp();

// Reown AppKit configuration
let appKit = null;

async function initializeApp() {
  try {
    // Load app configuration
    const configResponse = await fetch('/api/config');
    if (configResponse.ok) {
      appConfig = await configResponse.json();
      // console.log('App configuration loaded:', appConfig);
    } else {
      // console.error('Failed to load app configuration');
      return;
    }

    // Initialize Reown AppKit
    await initializeReownAppKit();

    // Load node information
    await loadNodeInformation();

  } catch (error) {
    // console.error('Failed to initialize app:', error);
  }
}

// Initialize wallet connection using Web3
async function initializeReownAppKit() {
  try {
    if (!window.Web3) {
      showWalletError('Web3 library not loaded. Please check your internet connection and refresh the page.');
      return;
    }

    // console.log('Web3 library loaded successfully');

    // Check if MetaMask or other wallet is available
    if (typeof window.ethereum !== 'undefined') {
      // console.log('Ethereum wallet detected');

      // Set up wallet event listeners
      setupWalletEventListeners();

      // Check if already connected
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          updateWalletUI(true, accounts[0], { id: parseInt(chainId, 16) });
        }
      } catch (error) {
        // console.warn('Failed to check existing connection:', error);
      }

    } else {
      showWalletError('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
    }

  } catch (error) {
    // console.error('Failed to initialize wallet connection:', error);
    showWalletError(`Failed to initialize wallet connection: ${error.message}`);
  }
}

function showWalletError(message) {
  // console.error(message);

  // Update UI to show wallet is unavailable
  const connectBtn = document.getElementById('connect-wallet');
  const statusElement = document.getElementById('connection-status');

  connectBtn.textContent = 'Wallet Unavailable';
  connectBtn.disabled = true;
  connectBtn.classList.add('opacity-50', 'cursor-not-allowed');

  statusElement.textContent = 'Wallet connection unavailable';
  statusElement.className = 'text-red-600';

  // Show error in a less intrusive way
  const errorDiv = document.createElement('div');
  errorDiv.className = 'bg-red-50 border border-red-200 rounded-lg p-4 mt-4';
  errorDiv.innerHTML = `
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <p class="text-sm text-red-800">${message}</p>
      </div>
    </div>
  `;

  // Insert after the network warning
  const networkWarning = document.querySelector('.bg-yellow-50');
  if (networkWarning && networkWarning.parentNode) {
    networkWarning.parentNode.insertBefore(errorDiv, networkWarning.nextSibling);
  }
}

// Wallet connection handlers
document.getElementById('connect-wallet').addEventListener('click', async () => {
  try {
    if (!window.ethereum) {
      alert('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
      return;
    }

    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    if (accounts.length > 0) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkId = parseInt(chainId, 16);

      updateWalletUI(true, accounts[0], { id: networkId });

      // Check if on correct network
      if (networkId !== 490000) {
        // Try to switch to Autonomys Taurus testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x77A30' }], // 490000 in hex
          });
        } catch (switchError) {
          // If the chain hasn't been added to the user's wallet, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x77A30',
                  chainName: 'Autonomys EVM',
                  nativeCurrency: {
                    name: 'tAI3',
                    symbol: 'tAI3',
                    decimals: 18
                  },
                  rpcUrls: ['https://auto-evm.taurus.autonomys.xyz'],
                  blockExplorerUrls: ['https://explorer.taurus.autonomys.xyz']
                }]
              });
            } catch (addError) {
              // console.error('Failed to add network:', addError);
              alert('Failed to add Autonomys Taurus testnet. Please add it manually.');
            }
          } else {
            // console.error('Failed to switch network:', switchError);
          }
        }
      }
    }
  } catch (error) {
    // console.error('Failed to connect wallet:', error);
    alert('Failed to connect wallet. Please try again.');
  }
});

document.getElementById('disconnect-wallet').addEventListener('click', async () => {
  try {
    // Note: MetaMask doesn't have a programmatic disconnect method
    // We just update the UI to reflect disconnected state
    updateWalletUI(false, '', null);
    alert('To fully disconnect, please disconnect from your wallet extension.');
  } catch (error) {
    // console.error('Failed to disconnect wallet:', error);
  }
});

// Set up wallet event listeners
function setupWalletEventListeners() {
  if (window.ethereum) {
    try {
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          updateWalletUI(true, accounts[0], walletNetwork);
        } else {
          updateWalletUI(false, '', null);
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', (chainId) => {
        const networkId = parseInt(chainId, 16);
        updateWalletUI(walletConnected, walletAddress, { id: networkId });
      });

      // console.log('Wallet event listeners set up successfully');
    } catch (error) {
      // console.error('Failed to set up wallet event listeners:', error);
    }
  }
}

// Chat functionality
document.getElementById('send-message').addEventListener('click', () => {
  // console.log('Send button clicked!');

  // If wallet not connected, try to connect
  if (!walletConnected) {
    document.getElementById('connect-wallet').click();
    return;
  }

  sendMessage();
});

document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    // console.log('Enter key pressed!');

    // If wallet not connected, try to connect
    if (!walletConnected) {
      document.getElementById('connect-wallet').click();
      return;
    }

    sendMessage();
  }
});

// Storage functionality
document.getElementById('store-chat').addEventListener('click', storeChatOnAutoDrive);

// System prompt functionality
document.getElementById('edit-prompt-btn').addEventListener('click', editSystemPrompt);
document.getElementById('save-prompt-btn').addEventListener('click', saveSystemPrompt);
document.getElementById('cancel-edit-btn').addEventListener('click', cancelEditSystemPrompt);
document.getElementById('reset-prompt-btn').addEventListener('click', resetSystemPrompt);

document.getElementById('refresh-history').addEventListener('click', loadChatHistory);

// Functions
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function updateWalletUI(connected, address, network) {
  walletConnected = connected;
  walletAddress = address;
  walletNetwork = network;

  const statusElement = document.getElementById('connection-status');
  const addressElement = document.getElementById('wallet-address');
  const connectBtn = document.getElementById('connect-wallet');
  const disconnectBtn = document.getElementById('disconnect-wallet');
  const networkWarning = document.getElementById('network-warning');

  if (connected) {
    // Check if on correct network (Autonomys EVM)
    const isCorrectNetwork = network && (network.id === 490000 || network.id === 'eip155:490000');

    if (isCorrectNetwork) {
      statusElement.textContent = 'Connected (Autonomys EVM)';
      statusElement.className = 'text-green-600';
      // Hide network warning when connected to correct network
      if (networkWarning) {
        networkWarning.classList.add('hidden');
      }
    } else {
      statusElement.textContent = 'Connected (Wrong Network)';
      statusElement.className = 'text-yellow-600';
      // Show network warning when on wrong network
      if (networkWarning) {
        networkWarning.classList.remove('hidden');
      }
    }

    addressElement.textContent = address.slice(0, 6) + '...' + address.slice(-4);
    connectBtn.classList.add('hidden');
    disconnectBtn.classList.remove('hidden');
  } else {
    statusElement.textContent = 'Not connected';
    statusElement.className = 'text-gray-600';
    addressElement.textContent = '';
    connectBtn.classList.remove('hidden');
    disconnectBtn.classList.add('hidden');
    // Show network warning when not connected
    if (networkWarning) {
      networkWarning.classList.remove('hidden');
    }
  }

  // Update UI elements that require wallet connection
  updateChatUI();
  updateStoreChatButton();
  updateChatHistorySection();
}

function updateChatUI() {
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-message');
  const chatContainer = document.getElementById('chat-messages');

  const isCorrectNetwork = walletNetwork && (walletNetwork.id === 490000 || walletNetwork.id === 'eip155:490000');
  const canChat = walletConnected && isCorrectNetwork;

  if (canChat) {
    messageInput.disabled = false;
    messageInput.placeholder = 'Type your message...';
    sendButton.disabled = false;
    sendButton.textContent = 'Send';
  } else {
    messageInput.disabled = true;
    sendButton.disabled = true;

    if (!walletConnected) {
      messageInput.placeholder = 'Connect your wallet to start chatting...';
      sendButton.textContent = 'Connect Wallet';
    } else if (!isCorrectNetwork) {
      messageInput.placeholder = 'Switch to Autonomys EVM to chat...';
      sendButton.textContent = 'Wrong Network';
    }
  }
}

function updateStoreChatButton() {
  const storeChatBtn = document.getElementById('store-chat');
  const isCorrectNetwork = walletNetwork && (walletNetwork.id === 490000 || walletNetwork.id === 'eip155:490000');
  const canStore = walletConnected && isCorrectNetwork && hasConversation;

  storeChatBtn.disabled = !canStore;

  if (!walletConnected) {
    storeChatBtn.textContent = 'Connect Wallet to Store';
  } else if (!isCorrectNetwork) {
    storeChatBtn.textContent = 'Switch to Autonomys EVM';
  } else if (!hasConversation) {
    storeChatBtn.textContent = 'Start Conversation to Store';
  } else {
    // Estimate storage cost for preview
    const estimateStorageCost = () => {
      // Get current chat messages
      const messages = document.querySelectorAll('#chat-messages > div');
      let estimatedSize = 0;

      // Rough estimation based on visible messages
      messages.forEach(msg => {
        const text = msg.textContent || '';
        estimatedSize += text.length * 2; // Rough estimate including JSON structure
      });

      // Add base JSON structure size
      estimatedSize += 500; // Base structure

      const sizeInKB = Math.max(estimatedSize / 1024, 0.1);
      const estimatedCost = Math.max(sizeInKB * 0.001, 0.001);

      return {
        sizeKB: Math.round(sizeInKB * 100) / 100,
        cost: Math.round(estimatedCost * 1000000) / 1000000
      };
    };

    const estimate = estimateStorageCost();
    storeChatBtn.textContent = `Store Chat (~${estimate.cost} tAI3)`;
  }
}

async function sendMessage() {
  // Check wallet connection and network
  const isCorrectNetwork = walletNetwork && (walletNetwork.id === 490000 || walletNetwork.id === 'eip155:490000');

  if (!walletConnected) {
    alert('Please connect your wallet to start chatting.');
    return;
  }

  if (!isCorrectNetwork) {
    alert('Please switch to Autonomys EVM (Chain ID: 490000) to use this application.');
    return;
  }

  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();

  if (!message) return;

  // console.log('Sending message:', message);

  // Clear input and add user message to chat
  messageInput.value = '';
  addMessageToChat('user', message);

  // Show loading
  const loadingId = addMessageToChat('assistant', 'Thinking...');

  try {
    // console.log('Making API request to /api/chat/message');
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        sessionId,
        walletAddress // Include wallet address for tracking
      })
    });

    // console.log('Response status:', response.status);
    const data = await response.json();
    // console.log('Response data:', data);

    if (response.ok) {
      // Remove loading message and add actual response
      removeMessage(loadingId);
      addMessageToChat('assistant', data.response);

      // Mark that we have a conversation
      hasConversation = true;

      // Update token count and model info
      totalTokens = data.totalTokens;
      document.getElementById('token-count').textContent = totalTokens;

      if (data.model && data.model !== currentModel) {
        currentModel = data.model;
        document.getElementById('current-model').textContent = currentModel;
      }

      // Update store chat button
      updateStoreChatButton();
    } else {
      removeMessage(loadingId);
      addMessageToChat('assistant', `Error: ${data.error}`);
      // console.error('API Error:', data);
    }
  } catch (error) {
    removeMessage(loadingId);
    addMessageToChat('assistant', `Error: ${error.message}`);
    // console.error('Request failed:', error);
  }
}

function addMessageToChat(role, content) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

  const messageDiv = document.createElement('div');
  messageDiv.id = messageId;
  messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

  const messageContent = document.createElement('div');
  messageContent.className = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${role === 'user'
    ? 'bg-blue-500 text-white'
    : 'bg-gray-200 text-gray-800'
    }`;
  messageContent.innerHTML = content;

  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return messageId;
}

function removeMessage(messageId) {
  const messageElement = document.getElementById(messageId);
  if (messageElement) {
    messageElement.remove();
  }
}

async function loadNodeInformation() {
  try {
    // Load node URL from config
    document.getElementById('node-url').textContent = appConfig?.gaiaNodeUrl || 'Loading...';

    // Load available models
    const modelsResponse = await fetch('/api/chat/models');
    if (modelsResponse.ok) {
      const models = await modelsResponse.json();
      availableModels = models;
      const modelNames = models.map(m => m.id).join(', ');
      document.getElementById('available-models').textContent = modelNames || 'No models available';

      // Set current model to first available
      if (models.length > 0) {
        currentModel = models[0].id;
        document.getElementById('current-model').textContent = currentModel;
      }
    } else {
      document.getElementById('available-models').textContent = 'Failed to load models';
    }

    // Load system prompt information
    await loadSystemPrompt();

    // Load node configuration (optional)
    try {
      const configResponse = await fetch('/api/chat/node-config');
      if (configResponse.ok) {
        const config = await configResponse.json();
        // console.log('Node configuration:', config);
      }
    } catch (error) {
      // console.warn('Could not load node config:', error);
    }

  } catch (error) {
    // console.error('Failed to load node information:', error);
    document.getElementById('available-models').textContent = 'Error loading models';
  }
}

async function loadSystemPrompt() {
  try {
    const response = await fetch('/api/chat/system-prompt');
    if (response.ok) {
      systemPromptData = await response.json();
      updateSystemPromptDisplay();
    } else {
      document.getElementById('system-prompt-display').textContent = 'Failed to load system prompt';
    }
  } catch (error) {
    // console.error('Failed to load system prompt:', error);
    document.getElementById('system-prompt-display').textContent = 'Error loading system prompt';
  }
}

function updateSystemPromptDisplay() {
  const displayElement = document.getElementById('system-prompt-display');
  const resetBtn = document.getElementById('reset-prompt-btn');

  if (systemPromptData) {
    displayElement.textContent = systemPromptData.currentSystemPrompt;

    // Show reset button if using custom prompt
    if (systemPromptData.customSystemPrompt) {
      resetBtn.classList.remove('hidden');
    } else {
      resetBtn.classList.add('hidden');
    }
  }
}

function editSystemPrompt() {
  const displayElement = document.getElementById('system-prompt-display');
  const editorElement = document.getElementById('system-prompt-editor');
  const inputElement = document.getElementById('system-prompt-input');

  // Set current prompt in textarea
  inputElement.value = systemPromptData ? systemPromptData.currentSystemPrompt : '';

  // Toggle visibility
  displayElement.classList.add('hidden');
  editorElement.classList.remove('hidden');

  // Focus on textarea
  inputElement.focus();
}

function cancelEditSystemPrompt() {
  const displayElement = document.getElementById('system-prompt-display');
  const editorElement = document.getElementById('system-prompt-editor');

  // Toggle visibility back
  displayElement.classList.remove('hidden');
  editorElement.classList.add('hidden');
}

async function saveSystemPrompt() {
  const inputElement = document.getElementById('system-prompt-input');
  const newPrompt = inputElement.value.trim();

  try {
    const response = await fetch('/api/chat/system-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemPrompt: newPrompt
      })
    });

    if (response.ok) {
      // Reload system prompt data
      await loadSystemPrompt();
      cancelEditSystemPrompt();

      // Show success message
      alert('System prompt updated successfully!');
    } else {
      const error = await response.json();
      alert(`Failed to update system prompt: ${error.error}`);
    }
  } catch (error) {
    // console.error('Failed to save system prompt:', error);
    alert(`Error saving system prompt: ${error.message}`);
  }
}

async function resetSystemPrompt() {
  if (!confirm('Are you sure you want to reset to the node default system prompt?')) {
    return;
  }

  try {
    const response = await fetch('/api/chat/system-prompt', {
      method: 'DELETE'
    });

    if (response.ok) {
      // Reload system prompt data
      await loadSystemPrompt();
      alert('System prompt reset to node default!');
    } else {
      const error = await response.json();
      alert(`Failed to reset system prompt: ${error.error}`);
    }
  } catch (error) {
    // console.error('Failed to reset system prompt:', error);
    alert(`Error resetting system prompt: ${error.message}`);
  }
}

async function storeChatOnAutoDrive() {
  const isCorrectNetwork = walletNetwork && (walletNetwork.id === 490000 || walletNetwork.id === 'eip155:490000');

  if (!walletConnected) {
    alert('Please connect your wallet first');
    return;
  }

  if (!isCorrectNetwork) {
    alert('Please switch to Autonomys EVM (Chain ID: 490000) to store chat transcripts');
    return;
  }

  if (!hasConversation) {
    alert('Please have a conversation with the AI before storing');
    return;
  }

  const storeBtn = document.getElementById('store-chat');
  const originalText = storeBtn.textContent;
  storeBtn.textContent = 'Storing...';
  storeBtn.disabled = true;

  try {
    const response = await fetch('/api/storage/store-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        walletAddress,
        networkId: walletNetwork.id
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Show success message
      const resultDiv = document.getElementById('storage-result');
      document.getElementById('stored-cid').textContent = data.cid;

      // Display storage cost information
      document.getElementById('storage-cost').textContent = data.estimatedCostTAI3 || '0.001';
      document.getElementById('file-size').textContent = data.sizeKB || '0';

      // Use gateway URL as primary (it works immediately)
      const workingUrl = data.gatewayUrl || data.publicUrl;
      document.getElementById('stored-url').textContent = workingUrl;
      document.getElementById('stored-url').href = workingUrl;

      // Clear any previous additional info
      const existingInfo = resultDiv.querySelector('.additional-url-info');
      if (existingInfo) {
        existingInfo.remove();
      }

      // Show additional info if both URLs are available
      if (data.gatewayUrl && data.publicUrl) {
        const additionalInfo = document.createElement('div');
        additionalInfo.className = 'additional-url-info text-xs text-green-600 mt-3 pt-2 border-t';
        additionalInfo.innerHTML = `
          <p><strong>Alternative URLs:</strong></p>
          <div class="mt-1 space-y-1">
            <p><span class="font-medium">Gateway URL (immediate access):</span></p>
            <p><a href="${data.gatewayUrl}" target="_blank" class="text-blue-600 hover:underline break-all">${data.gatewayUrl}</a></p>
          </div>
        `;
        resultDiv.appendChild(additionalInfo);
      }

      resultDiv.classList.remove('hidden');

      // Show cost in alert as well
      const costMessage = `Chat transcript stored successfully on AutoDrive!\n\nStorage Cost: ${data.estimatedCostTAI3 || '0.001'} tAI3\nFile Size: ${data.sizeKB || '0'} KB\n\nUse the gateway URL for immediate access.`;
      alert(costMessage);
    } else {
      alert(`Failed to store chat: ${data.error}`);
    }
  } catch (error) {
    alert(`Error storing chat: ${error.message}`);
  } finally {
    updateStoreChatButton(); // Reset button state
  }
}

async function loadChatHistory() {
  try {
    if (!walletAddress) {
      alert('Connect your wallet first');
      return;
    }

    const historyContainer = document.getElementById('chat-history');
    historyContainer.innerHTML = '<p>Loading...</p>';

    const response = await fetch(`/api/storage/my-files?walletAddress=${walletAddress}`);
    const data = await response.json();

    if (response.ok) {
      if (data.files.length === 0) {
        historyContainer.innerHTML = '<p>No stored chats found.</p>';
        return;
      }

      historyContainer.innerHTML = '';
      data.files.forEach(file => {
        const fileEl = document.createElement('div');
        fileEl.className = 'p-2 border rounded mb-2';
        fileEl.innerHTML = `
          <p><strong>${file.name}</strong></p>
          <p>Size: ${file.size} bytes</p>
          <p>Created: ${new Date(file.createdAt).toLocaleString()}</p>
          <p><a href="${file.gatewayUrl}" target="_blank" class="text-blue-600 hover:underline">View File</a></p>
        `;
        historyContainer.appendChild(fileEl);
      });
    } else {
      historyContainer.innerHTML = `<p class="text-red-600">Error: ${data.error}</p>`;
    }

  } catch (err) {
    console.error('Failed to load chat history:', err);
    document.getElementById('chat-history').innerHTML =
      `<p class="text-red-600">Failed to load chat history: ${err.message}</p>`;
  }
}