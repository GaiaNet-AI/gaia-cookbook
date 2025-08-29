// DOM Elements
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletStatus = document.getElementById('walletStatus');
const chatHistory = document.getElementById('chatHistory');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const transactionsList = document.getElementById('transactionsList');
const modelInfo = document.getElementById('modelInfo');
const costInfo = document.getElementById('costInfo');

const systemPromptModal = document.getElementById('systemPromptModal');
const systemPromptTextarea = document.getElementById('systemPromptTextarea');
const editPromptBtn = document.createElement('button');
const closeModal = document.querySelector('.close-modal');
const cancelPromptBtn = document.getElementById('cancelPromptBtn');
const savePromptBtn = document.getElementById('savePromptBtn');
const clearChatBtn = document.getElementById('clearChatBtn');

const walletConnectArea = document.getElementById('walletConnectArea');
const walletDisconnectArea = document.getElementById('walletDisconnectArea');
const connectedAddress = document.getElementById('connectedAddress');
const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');

// State
let userAddress = null;
let chatMessages = [];
let transactions = [];
let gaiaNodeUrl = '';
let gaiaModelName = 'unknown';
let systemPrompt = '';
let nodeInfo = null;

function initializeEditPromptButton() {
    if (modelInfo.querySelector('.edit-prompt-btn')) return;
    
    editPromptBtn.className = 'edit-prompt-btn';
    editPromptBtn.textContent = 'Edit';
    editPromptBtn.addEventListener('click', openSystemPromptModal);
    modelInfo.appendChild(editPromptBtn);
}

function openSystemPromptModal() {
    systemPromptTextarea.value = systemPrompt;
    systemPromptModal.style.display = 'block';
}

function closeSystemPromptModal() {
    systemPromptModal.style.display = 'none';
}

document.getElementById('cancelPromptBtn').addEventListener('click', function() {
    systemPromptModal.style.display = 'none';
});

async function saveSystemPrompt() {
    const newPrompt = systemPromptTextarea.value.trim();
    
    // Update the global systemPrompt variable
    systemPrompt = newPrompt;
    
    // Update the display
    updateModelInfoDisplay();
    
    // Close the modal
    closeSystemPromptModal();
    
    // Optionally, you could save this to localStorage or send to server
    localStorage.setItem('customSystemPrompt', newPrompt);
}

function updateModelInfoDisplay() {
    modelInfo.innerHTML = `
        <p>Using AI Model: <strong>${gaiaModelName}</strong></p>
        ${systemPrompt ? `<p class="system-prompt">System: ${systemPrompt.substring(0, 100)}${systemPrompt.length > 100 ? '...' : ''}</p>` : ''}
    `;
    initializeEditPromptButton();
}

clearChatBtn.addEventListener('click', () => {
    if (chatMessages.length === 0) return;
    
    // Confirm before clearing
    if (confirm('Are you sure you want to clear the chat? This cannot be undone.')) {
        // Clear chat messages
        chatMessages = [];
        
        // Update UI
        renderChatHistory();
        
        // Disable upload button since there's nothing to upload
        uploadBtn.disabled = true;
        
        // Remove from localStorage
        localStorage.removeItem('chatMessages');
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
        walletStatus.textContent = 'MetaMask not detected. Please install MetaMask to use this app.';
        connectWalletBtn.disabled = true;
    }
    
    // Get model name and other info from server
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        gaiaModelName = config.modelName;
        systemPrompt = config.systemPrompt || '';
        nodeInfo = config.nodeInfo || null;
        gaiaNodeUrl = config.gaiaNodeUrl || '';
        
        updateModelInfoDisplay();
    } catch (error) {
        console.error('Error fetching config:', error);
        modelInfo.innerHTML = `<p>Using AI Model: <strong>${gaiaModelName}</strong> (default)</p>`;
    }
    
    // Check for saved wallet connection
    const savedAddress = localStorage.getItem('userAddress');
    if (savedAddress) {
        userAddress = savedAddress;
        connectedAddress.textContent = formatAddress(userAddress);
        walletConnectArea.style.display = 'none';
        walletDisconnectArea.style.display = 'flex';
        
        // Fetch user's previous transactions
        await fetchUserTransactions();
        renderTransactions();
    } else {
        // Show default message for unconnected users on initial load
        renderTransactions();
    }
    
    // Check Irys balance
  await updateIrysBalance();
  
    // Load any existing data from localStorage
    const savedTransactions = localStorage.getItem('aiTransactions');
    if (savedTransactions && userAddress) {
        transactions = JSON.parse(savedTransactions);
    }
    
    const savedChat = localStorage.getItem('chatMessages');
    if (savedChat) {
        chatMessages = JSON.parse(savedChat);
        renderChatHistory();
    }
    
    // Enable upload button if there are messages
    uploadBtn.disabled = chatMessages.length === 0;
    
    // Initialize clear button state
    clearChatBtn.disabled = chatMessages.length === 0;

    closeModal.addEventListener('click', closeSystemPromptModal);
    cancelPromptBtn.addEventListener('click', closeSystemPromptModal); // This line should be present
    savePromptBtn.addEventListener('click', saveSystemPrompt);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === systemPromptModal) {
            closeSystemPromptModal();
        }
    });
});

// Send Prompt Function
sendBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert('Please enter a prompt');
        return;
    }
    
    if (!userAddress) {
        alert('Please connect your wallet first');
        return;
    }
    
    // Disable button during processing
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="loading"></span> Processing...';
    
    try {
        // Add user message to chat
        const userMessage = {
            role: "user",
            content: prompt,
            timestamp: new Date().toISOString()
        };
        
        chatMessages.push(userMessage);
        renderChatHistory();
        promptInput.value = '';
        
        // Call Gaia API
        const aiResponse = await callGaiaAPI();
        
        // Add AI response to chat
        const aiMessage = {
            role: "assistant",
            content: aiResponse.choices[0].message.content,
            timestamp: new Date().toISOString()
        };
        
        chatMessages.push(aiMessage);
        renderChatHistory();
        
        // Save to localStorage
        localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
        
        // Enable upload button
        uploadBtn.disabled = false;
        
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = {
            role: "assistant",
            content: 'Error processing your request. Please try again.',
            timestamp: new Date().toISOString()
        };
        
        chatMessages.push(errorMessage);
        renderChatHistory();
    } finally {
        // Re-enable button
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
});

// Upload to Irys Function
uploadBtn.addEventListener('click', async () => {
    if (chatMessages.length === 0) {
        alert('No messages to upload');
        return;
    }
    
    if (!userAddress) {
        alert('Please connect your wallet first');
        return;
    }
    
    // Disable button during processing
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="loading"></span> Uploading...';
    costInfo.innerHTML = '';
    
    try {
        // Prepare data for upload (without cost and dataSize for now)
        const uploadData = {
            conversation: chatMessages,
            created_at: new Date().toISOString(),
            metadata: {
                user_id: userAddress,
                model: gaiaModelName,
                system_prompt: systemPrompt,
                gaia_node_url: gaiaNodeUrl,
                irys_node: "https://devnet.irys.xyz",
                upload_timestamp: new Date().toISOString(),
                token_type: "ethereum",
                chain_id: 11155111, // Sepolia testnet chain ID
                app_version: "1.0.0"
            }
        };
        
        // Upload to Irys
        const transaction = await storeOnIrys(uploadData);
        
        // Add transaction to list
        transactions.unshift(transaction);
        localStorage.setItem('aiTransactions', JSON.stringify(transactions));
        renderTransactions();
        
        // Display cost information
        if (transaction.cost) {
            costInfo.innerHTML = `<p>Upload cost: <strong>${transaction.cost} ETH</strong></p>`;
        }
        
        // Clear chat messages after successful upload
        chatMessages = [];
        localStorage.removeItem('chatMessages');
        renderChatHistory();
        
        // Disable upload button
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Upload to Irys';
        
    } catch (error) {
        console.error('Error uploading to Irys:', error);
        costInfo.innerHTML = `<p class="error">Failed to upload to Irys. Please try again.</p>`;
    } finally {
        // Re-enable button
        if (chatMessages.length > 0) {
            uploadBtn.disabled = false;
        }
        uploadBtn.textContent = 'Upload to Irys';
    }
});
// Call Gaia API
async function callGaiaAPI() {
    // Prepare messages with system prompt
    let apiMessages = [...chatMessages];
    
    // Use custom system prompt if it exists
    if (systemPrompt) {
        // Add system message at the beginning if it doesn't already exist
        if (!apiMessages[0] || apiMessages[0].role !== 'system') {
            apiMessages.unshift({
                role: 'system',
                content: systemPrompt
            });
        }
    }
    
    const response = await fetch('/api/gaia/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: apiMessages,
            model: gaiaModelName
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to get response from AI');
    }
    
    return await response.json();
}
// Store on Irys
async function storeOnIrys(data) {
    const uploadResponse = await fetch('/api/irys/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data })
    });
    
    if (!uploadResponse.ok) {
        throw new Error('Failed to upload to Irys');
    }
    
    const result = await uploadResponse.json();
    
    return {
        id: result.id,
        url: result.url,
        timestamp: new Date().toISOString(),
        status: 'success',
        cost: result.cost ? result.cost.toFixed(6) : 'N/A'
    };
}

// Render chat history
function renderChatHistory() {
    chatHistory.innerHTML = '';
    
    // Enable/disable clear button based on messages
    clearChatBtn.disabled = chatMessages.length === 0;
    
    if (chatMessages.length === 0) {
        chatHistory.innerHTML = '<p class="placeholder">No messages yet. Start a conversation with the AI.</p>';
        return;
    }
    
    chatMessages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}-message`;
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        messageHeader.textContent = message.role === 'user' ? 'You' : 'AI Assistant';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message.content;
        
        messageDiv.appendChild(messageHeader);
        messageDiv.appendChild(messageContent);
        chatHistory.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

disconnectWalletBtn.addEventListener('click', () => {
    // Confirm before disconnecting
    if (confirm('Are you sure you want to disconnect your wallet? This will clear your chat history and uploaded transactions.')) {
        // Clear user address
        userAddress = null;
        
        // Update UI
        walletConnectArea.style.display = 'flex';
        walletDisconnectArea.style.display = 'none';
        walletStatus.textContent = 'Not connected';
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.disabled = false;
        
        // Clear localStorage
        localStorage.removeItem('userAddress');
        
        // Clear chat history
        chatMessages = [];
        localStorage.removeItem('chatMessages');
        renderChatHistory();
        
        // Clear transactions
        transactions = [];
        localStorage.removeItem('aiTransactions');
        renderTransactions();
        
        // Disable upload button
        uploadBtn.disabled = true;
    }
});

// Update the renderTransactions function to handle disconnected state:
function renderTransactions() {
    transactionsList.innerHTML = '';
    
    if (!userAddress) {
        // Show default message for unconnected users
        transactionsList.innerHTML = `
            <p class="placeholder">
                Connect your wallet to view your on-chain transactions.
            </p>
        `;
        return;
    }
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<p class="placeholder">No transactions yet. Upload your conversation to store it on-chain.</p>';
        return;
    }
    
    transactions.forEach(transaction => {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'transaction';
        
        const transactionInfo = document.createElement('div');
        transactionInfo.className = 'transaction-info';
        
        const transactionId = document.createElement('div');
        transactionId.className = 'transaction-id';
        transactionId.textContent = `ID: ${transaction.id}`;
        
        const transactionTime = document.createElement('div');
        transactionTime.className = 'transaction-time';
        const date = new Date(transaction.timestamp);
        transactionTime.textContent = `Uploaded: ${date.toLocaleString()}`;
        
        transactionInfo.appendChild(transactionId);
        transactionInfo.appendChild(transactionTime);
        
        const transactionLink = document.createElement('a');
        transactionLink.className = 'transaction-link';
        transactionLink.href = transaction.url;
        transactionLink.target = '_blank';
        transactionLink.textContent = 'View on Irys';
        
        const statusSpan = document.createElement('span');
        statusSpan.className = `status ${transaction.status}`;
        statusSpan.textContent = transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1);
        
        const costSpan = document.createElement('span');
        costSpan.className = 'cost';
        costSpan.textContent = transaction.cost ? `Cost: ${transaction.cost} ETH` : '';
        
        transactionDiv.appendChild(transactionInfo);
        transactionDiv.appendChild(statusSpan);
        transactionDiv.appendChild(costSpan);
        transactionDiv.appendChild(transactionLink);
        
        transactionsList.appendChild(transactionDiv);
    });
}

async function updateIrysBalance() {
    try {
      const response = await fetch('/api/irys/balance');
      const result = await response.json();
      
      if (response.ok) {
        const balanceElement = document.getElementById('irysBalance');
        if (balanceElement) {
          balanceElement.textContent = `Irys Balance: ${result.balance.toFixed(6)} ETH`;
          
          // Add warning class if balance is low
          if (result.balance < 0.001) {
            balanceElement.className = 'balance-warning';
          } else {
            balanceElement.className = 'balance-normal';
          }
        }
      }
    } catch (error) {
      console.error('Error checking Irys balance:', error);
      const balanceElement = document.getElementById('irysBalance');
      if (balanceElement) {
        balanceElement.textContent = 'Irys Balance: Error fetching balance.';
      }
    }
  }
  
  // Update the connect wallet function to fetch balance after connection
  connectWalletBtn.addEventListener('click', async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed!');
      return;
    }
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      userAddress = accounts[0];
      
      // Update UI
      connectedAddress.textContent = formatAddress(userAddress);
      walletConnectArea.style.display = 'none';
      walletDisconnectArea.style.display = 'flex';
      
      // Fetch user's previous transactions
      await fetchUserTransactions();
      renderTransactions();
      
      // Fetch and display Irys balance
      await updateIrysBalance();
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      walletStatus.textContent = 'Error connecting wallet';
    }
  });

async function fetchUserTransactions() {
    if (!userAddress) return;

    try {
        
        const response = await fetch(`/api/irys/user-transactions/${userAddress}`);
        const result = await response.json();
        
        if (response.ok && result.transactions) {
            // Process transactions and add to local storage
            transactions = result.transactions.map(tx => ({
                id: tx.id,
                url: tx.url,
                timestamp: new Date(tx.timestamp).toISOString(),
                status: 'success',
                cost: 'N/A' // Cost isn't available from GraphQL, would need to store in tags
            }));
            
            // Save to localStorage
            localStorage.setItem('aiTransactions', JSON.stringify(transactions));
        } else {
            console.error('Error fetching transactions:', result.error);
            // Clear any existing transactions
            transactions = [];
            localStorage.removeItem('aiTransactions');
        }
    } catch (error) {
        console.error('Error fetching user transactions:', error);
        // Clear any existing transactions
        transactions = [];
        localStorage.removeItem('aiTransactions');
    }
}
// Format Ethereum address
function formatAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}