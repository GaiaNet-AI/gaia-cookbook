class GaiaStorachaApp {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.storeBtn = document.getElementById('storeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.systemPromptBtn = document.getElementById('systemPromptBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.conversationsList = document.getElementById('conversationsList');
        this.status = document.getElementById('status');
        this.systemPromptDisplay = document.getElementById('systemPromptDisplay');

        // Modal elements
        this.modal = document.getElementById('systemPromptModal');
        this.closeModal = document.getElementById('closeModal');
        this.systemPromptTextarea = document.getElementById('systemPromptTextarea');
        this.savePromptBtn = document.getElementById('savePromptBtn');
        this.cancelPromptBtn = document.getElementById('cancelPromptBtn');
        this.resetPromptBtn = document.getElementById('resetPromptBtn');

        this.currentConversation = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            messages: []
        };
        this.isLoading = false;
        this.currentSystemPrompt = null;
        this.defaultSystemPrompt = null;

        this.initEventListeners();
        this.loadSystemPrompt();
        this.loadStoredConversations();

        // Add initial welcome message
        this.addMessage('assistant', 'Welcome! I\'m powered by Gaia AI and you can store our conversations permanently on the Storacha decentralized network. Ask me anything!');
    }

    initEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.storeBtn.addEventListener('click', () => this.storeConversation());
        this.clearBtn.addEventListener('click', () => this.clearChat());
        this.systemPromptBtn.addEventListener('click', () => this.openSystemPromptModal());

        // Modal event listeners
        this.closeModal.addEventListener('click', () => this.closeSystemPromptModal());
        this.cancelPromptBtn.addEventListener('click', () => this.closeSystemPromptModal());
        this.savePromptBtn.addEventListener('click', () => this.saveSystemPrompt());
        this.resetPromptBtn.addEventListener('click', () => this.resetSystemPrompt());

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeSystemPromptModal();
            }
        });

        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;

        this.isLoading = true;
        this.updateUI();

        // Add user message to chat and conversation
        this.addMessage('user', message);
        this.currentConversation.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        this.messageInput.value = '';

        // Show loading state
        const loadingId = this.addLoadingMessage();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    systemPrompt: this.currentSystemPrompt
                })
            });

            const data = await response.json();

            // Remove loading message
            this.removeLoadingMessage(loadingId);

            if (data.success) {
                // Add AI response to chat and conversation
                this.addMessage('assistant', data.message);
                this.currentConversation.messages.push({
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toISOString(),
                    usage: data.usage
                });

                // Enable store button now that we have a conversation
                this.storeBtn.disabled = false;

            } else {
                this.showStatus('error', `❌ Error: ${data.error}`);
            }

        } catch (error) {
            this.removeLoadingMessage(loadingId);
            this.showStatus('error', `❌ Network error: ${error.message}`);
        }

        this.isLoading = false;
        this.updateUI();
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? 'U' : 'AI';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // Format content based on role and content type
        if (role === 'assistant' && this.containsMarkdown(content)) {
            messageContent.className += ' formatted';
            messageContent.innerHTML = this.formatContent(content);

            // Highlight code blocks after rendering
            setTimeout(() => {
                if (window.Prism) {
                    Prism.highlightAllUnder(messageContent);
                }
            }, 10);
        } else {
            messageContent.textContent = content;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    containsMarkdown(text) {
        // Check for common markdown patterns
        const markdownPatterns = [
            /```[\s\S]*?```/, // Code blocks
            /`[^`]+`/, // Inline code
            /^\s*#{1,6}\s/, // Headers
            /^\s*[-*+]\s/, // Lists
            /^\s*\d+\.\s/, // Numbered lists
            /\*\*[^*]+\*\*/, // Bold
            /\*[^*]+\*/, // Italic
            /\[[^\]]+\]\([^)]+\)/, // Links
            /^\s*>\s/, // Blockquotes
            /^\s*\|.*\|/, // Tables
        ];

        return markdownPatterns.some(pattern => pattern.test(text));
    }

    formatContent(content) {
        if (!window.marked || !window.DOMPurify) {
            return content.replace(/\n/g, '<br>');
        }

        try {
            // Configure marked for better code highlighting
            marked.setOptions({
                highlight: function (code, lang) {
                    if (window.Prism && lang && Prism.languages[lang]) {
                        return Prism.highlight(code, Prism.languages[lang], lang);
                    }
                    return code;
                },
                breaks: true,
                gfm: true
            });

            // Parse markdown
            const html = marked.parse(content);

            // Sanitize HTML to prevent XSS
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: [
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'p', 'br', 'strong', 'em', 'u', 's',
                    'ul', 'ol', 'li',
                    'blockquote',
                    'code', 'pre',
                    'table', 'thead', 'tbody', 'tr', 'th', 'td',
                    'a', 'hr'
                ],
                ALLOWED_ATTR: ['href', 'class', 'target', 'rel']
            });
        } catch (error) {
            console.error('Error formatting content:', error);
            return content.replace(/\n/g, '<br>');
        }
    }

    addLoadingMessage() {
        const loadingId = `loading-${Date.now()}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        messageDiv.id = loadingId;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';

        const loadingContent = document.createElement('div');
        loadingContent.className = 'message-content loading';
        loadingContent.innerHTML = '<div class="spinner"></div> Thinking and  responding...';

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(loadingContent);

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        return loadingId;
    }

    removeLoadingMessage(loadingId) {
        const loadingMessage = document.getElementById(loadingId);
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    async loadStoredConversations() {
        try {
            const response = await fetch('/api/conversations');
            const data = await response.json();

            if (data.success && data.conversations.length > 0) {
                this.renderConversationsList(data.conversations);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    renderConversationsList(conversations) {
        this.conversationsList.innerHTML = '';

        conversations.reverse().forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';

            const sizeInfo = conv.fileSizeBytes ? ` | ${conv.fileSizeBytes} bytes` : '';
            const modelInfo = conv.model ? ` | ${conv.model}` : '';

            // Generate IPFS URL for viewing raw data
            const ipfsUrl = `https://${conv.cid}.ipfs.w3s.link/`;

            item.innerHTML = `
                <div class="conversation-preview" onclick="event.stopPropagation(); app.loadConversation('${conv.cid}')" style="cursor: pointer;">
                    ${conv.preview}
                </div>
                <div class="conversation-meta">
                    CID: ${conv.cid.substring(0, 12)}...${modelInfo}${sizeInfo}<br>
                    ${new Date(conv.timestamp).toLocaleString()}
                </div>
                <div class="conversation-actions">
                    <button class="action-btn load-btn" onclick="event.stopPropagation(); app.loadConversation('${conv.cid}')">
                        📖 Load Chat
                    </button>
                    <button class="action-btn view-btn" onclick="event.stopPropagation(); window.open('${ipfsUrl}', '_blank')">
                        🔗 View on Storacha
                    </button>
                </div>
            `;

            this.conversationsList.appendChild(item);
        });
    }

    async loadConversation(cid) {
        try {
            const response = await fetch(`/api/conversations/${cid}`);
            const data = await response.json();

            if (data.success) {
                // Clear current chat and load the stored conversation
                this.chatMessages.innerHTML = '';

                // Add welcome message
                this.addMessage('assistant', 'Welcome! I\'m powered by Gaia AI and you can store our conversations permanently on the Storacha decentralized network. Ask me anything!');

                data.conversation.messages.forEach(msg => {
                    this.addMessage(msg.role, msg.content);
                });

                // Update current conversation to the loaded one
                this.currentConversation = data.conversation;

                // Enable store button if there are messages
                this.storeBtn.disabled = data.conversation.messages.length === 0;

                this.showStatus('success', `📖 Loaded conversation from Storacha (CID: ${cid.substring(0, 12)}...)`);
            }
        } catch (error) {
            this.showStatus('error', `❌ Failed to load conversation: ${error.message}`);
        }
    }

    showStatus(type, message) {
        this.status.className = `status ${type}`;
        this.status.textContent = message;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.status.textContent = '';
            this.status.className = '';
        }, 5000);
    }

    showStatusWithLink(type, message, url, linkText) {
        this.status.className = `status ${type}`;
        this.status.innerHTML = `${message} | <a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;

        // Auto-hide after 8 seconds (longer for links)
        setTimeout(() => {
            this.status.textContent = '';
            this.status.className = '';
        }, 8000);
    }



    clearChat() {
        // Clear the chat messages and add welcome message
        this.chatMessages.innerHTML = '';
        this.addMessage('assistant', 'Welcome! I\'m powered by Gaia AI and you can store our conversations permanently on the Storacha decentralized network. Ask me anything!');

        // Reset conversation
        this.currentConversation = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            messages: []
        };

        // Disable store button
        this.storeBtn.disabled = true;

        // Clear any status messages
        this.status.textContent = '';
        this.status.className = '';
    }

    async loadSystemPrompt() {
        try {
            const response = await fetch('/api/system-prompt');
            const data = await response.json();

            if (data.success) {
                this.currentSystemPrompt = data.systemPrompt;
                this.defaultSystemPrompt = data.defaultSystemPrompt;
                this.updateSystemPromptDisplay();
            }
        } catch (error) {
            console.error('Failed to load system prompt:', error);
        }
    }

    openSystemPromptModal() {
        this.systemPromptTextarea.value = this.currentSystemPrompt || this.defaultSystemPrompt || '';
        this.modal.style.display = 'block';
    }

    closeSystemPromptModal() {
        this.modal.style.display = 'none';
    }

    async saveSystemPrompt() {
        const newPrompt = this.systemPromptTextarea.value.trim();

        try {
            const response = await fetch('/api/system-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ systemPrompt: newPrompt })
            });

            const data = await response.json();

            if (data.success) {
                this.currentSystemPrompt = newPrompt;
                this.updateSystemPromptDisplay();
                this.showStatus('success', '✅ System prompt updated successfully');
                this.closeSystemPromptModal();
            } else {
                this.showStatus('error', `❌ Failed to update system prompt: ${data.error}`);
            }
        } catch (error) {
            this.showStatus('error', `❌ Error updating system prompt: ${error.message}`);
        }
    }

    resetSystemPrompt() {
        this.systemPromptTextarea.value = this.defaultSystemPrompt || '';
    }

    async storeConversation() {
        if (this.currentConversation.messages.length === 0) {
            this.showStatus('error', '❌ No conversation to store');
            return;
        }

        try {
            this.storeBtn.disabled = true;
            this.storeBtn.textContent = '📦 Storing...';

            const response = await fetch('/api/store-conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation: this.currentConversation
                })
            });

            const data = await response.json();

            if (data.success) {
                const cidShort = data.storageCid.substring(0, 12);
                this.showStatusWithLink('success', `✅ Stored on Storacha: ${cidShort}...`, data.ipfsUrl, 'View on IPFS');
                this.loadStoredConversations();
            } else {
                this.showStatus('error', `❌ Storage failed: ${data.error}`);
                this.storeBtn.disabled = false;
            }

        } catch (error) {
            this.showStatus('error', `❌ Storage error: ${error.message}`);
            this.storeBtn.disabled = false;
        }

        this.storeBtn.textContent = '📦 Store on Storacha';
    }

    updateSystemPromptDisplay() {
        const prompt = this.currentSystemPrompt || this.defaultSystemPrompt || 'No system prompt available';
        const truncated = prompt.length > 150 ? prompt.substring(0, 150) + '...' : prompt;
        this.systemPromptDisplay.textContent = truncated;
    }

    updateUI() {
        this.sendBtn.disabled = this.isLoading;
        this.messageInput.disabled = this.isLoading;

        if (this.isLoading) {
            this.sendBtn.textContent = 'Sending...';
        } else {
            this.sendBtn.textContent = 'Send';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GaiaStorachaApp();
});