document.addEventListener('DOMContentLoaded', () => {
    const apiEndpointInput = document.getElementById('apiEndpoint');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const messagesContainer = document.getElementById('messages');
    const buttons = {
        summarize: document.getElementById('summarize'),
        suggest: document.getElementById('suggest'),
        research: document.getElementById('research')
    };

    // Load saved settings
    chrome.storage.sync.get(['apiEndpoint'], (result) => {
        if (result.apiEndpoint) {
            apiEndpointInput.value = result.apiEndpoint;
        }
    });

    function showMessage(content, type = 'response') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        // Handle numbered lists and formatting
        const formattedContent = content
            // Convert numbered lists like "1." into proper HTML list items
            .split(/(\d+\.\s)/)
            .map((part, index, array) => {
                if (/^\d+\.\s$/.test(part)) {
                    // This is a number prefix, combine it with the next part in a list item
                    return `<li class="numbered-item">${array[index + 1]}</li>`;
                } else if (/^\d+\.\s$/.test(array[index - 1])) {
                    // Skip the content part as it's already been handled
                    return '';
                }
                return `<p>${part}</p>`;
            })
            .join('')
            // Convert bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        messageDiv.innerHTML = formattedContent;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function setLoading(buttonId, isLoading) {
        const button = buttons[buttonId];
        const spinner = button.querySelector('.spinner');
        
        if (isLoading) {
            spinner.classList.remove('hidden');
            button.disabled = true;
            // Disable all other buttons during loading
            Object.values(buttons).forEach(btn => btn.disabled = true);
        } else {
            spinner.classList.add('hidden');
            Object.values(buttons).forEach(btn => btn.disabled = false);
        }
    }

    async function sendToGaia(message) {
        const apiEndpoint = apiEndpointInput.value;
        
        if (!apiEndpoint) {
            throw new Error('Please set your Gaia node URL first');
        }

        const response = await fetch(`${apiEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: message }],
                model: 'llama',
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error('Failed to connect to Gaia node');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async function handleAction(action) {
        // Clear previous responses
        while (messagesContainer.lastChild) {
            messagesContainer.removeChild(messagesContainer.lastChild);
        }

        setLoading(action, true);

        try {
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'getPageContent'
            });

            let prompt;
            switch(action) {
                case 'summarize':
                    prompt = `Please summarize the following Notion page content concisely: ${response.content}`;
                    break;
                case 'suggest':
                    prompt = `Please analyze this Notion page content and suggest specific improvements: ${response.content}`;
                    break;
                case 'research':
                    prompt = `Based on this Notion page content, what are the top 3-5 related topics I should research? ${response.content}`;
                    break;
            }

            const result = await sendToGaia(prompt);
            showMessage(result, 'response');
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            setLoading(action, false);
        }
    }

    // Save settings
    saveSettingsBtn.addEventListener('click', () => {
        const apiEndpoint = apiEndpointInput.value;
        if (!apiEndpoint.endsWith('/v1')) {
            showMessage('API endpoint should end with /v1 (e.g. https://yournode.gaianet.network/v1)', 'error');
            return;
        }
        
        chrome.storage.sync.set({ apiEndpoint }, () => {
            showMessage('Settings saved successfully!', 'success');
        });
    });

    // Attach action handlers
    Object.entries(buttons).forEach(([action, button]) => {
        button.addEventListener('click', () => handleAction(action));
    });

    const questionInput = document.getElementById('pageQuestion');
    const askQuestionBtn = document.getElementById('askQuestion');

    async function handleQuestion() {
        const question = questionInput.value.trim();
        if (!question) {
            showMessage('Please enter a question', 'error');
            return;
        }

        setLoading('askQuestion', true);

        try {
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'getPageContent'
            });

            // Create a prompt that includes both the page content and the specific question
            const prompt = `Given this Notion page content: 
            ${response.content}
            
            Please answer this specific question about the page:
            ${question}
            
            Provide a clear, direct answer using only information from the page content.`;

            const result = await sendToGaia(prompt);
            showMessage(result, 'response');
            
            // Clear the input after successful response
            questionInput.value = '';
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            setLoading('askQuestion', false);
        }
    }

    // Add event listeners for question input
    askQuestionBtn.addEventListener('click', handleQuestion);
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleQuestion();
        }
    });

    // Update setLoading function to handle the new button
    function setLoading(buttonId, isLoading) {
        const button = buttonId === 'askQuestion' ? 
            askQuestionBtn : 
            buttons[buttonId];
        const spinner = button.querySelector('.spinner');
        
        if (isLoading) {
            spinner.classList.remove('hidden');
            button.disabled = true;
            // Disable all buttons during loading
            Object.values(buttons).forEach(btn => btn.disabled = true);
            askQuestionBtn.disabled = true;
        } else {
            spinner.classList.add('hidden');
            Object.values(buttons).forEach(btn => btn.disabled = false);
            askQuestionBtn.disabled = false;
        }
    }
});