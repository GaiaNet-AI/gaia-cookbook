// public/agent-demo.js
document.addEventListener('DOMContentLoaded', () => {
  // Note: This page doesn't use Socket.IO for streaming, it uses fetch for request/response
  const messagesList = document.getElementById('messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const agentStatus = document.getElementById('agent-status');

  let messages = []; // Conversation history for this page
  let historyStack = [];

  // Function to save the current state to the history stack
  function saveState() {
      // Save a deep copy of the current messages array
      historyStack.push(JSON.parse(JSON.stringify(messages)));
      console.log("State saved. History stack length:", historyStack.length);
  }

  // Function to append a message to the chat
  function appendMessage(role, content, extraClass = '') {
    const li = document.createElement('li');
    li.classList.add('mb-2');

    let messageData = null;
    // Only store user and assistant messages in the undo history in a simple format
    // Tool calls/results are part of the interaction flow and undoing them is complex.
    // For a basic undo, reverting the main conversation is sufficient.
    if (role === 'user' || role === 'assistant') {
        messageData = { role: role, content: content };
    } else if (role === 'tool_call' || role === 'tool_result' || role === 'tool_error') {
         // Store tool interactions if needed for more complex undo, but keep it simple for now
         // For this basic implementation, we won't store tool messages in historyStack
         // but we will display them.
         messageData = { type: role, content: content };
    }

    if (role === 'user') {
      li.innerHTML = `
        <div class="message-container-sender">
          <div>
            <div class="message-sender">
              ${content}
            </div>
          </div>
        </div>
      `;
    } else if (role === 'assistant') {
      li.innerHTML = `
        <div class="message-container-receiver">
          <div>
            <div class="message-receiver">
              ${content}
            </div>
          </div>
        </div>
      `;
    } else if (role === 'tool_call') {
        li.innerHTML = `<div class="tool-call"><strong>Agent Action:</strong> ${content}</div>`;
    } else if (role === 'tool_result') {
         li.innerHTML = `<div class="tool-result"><strong>Action Result:</strong> ${content}</div>`;
    } else if (role === 'tool_error') {
         li.innerHTML = `<div class="tool-error"><strong>Action Error:</strong> ${content}</div>`;
    }

    if (extraClass) {
        li.classList.add(extraClass);
    }

    messagesList.appendChild(li);
    messagesList.scrollTop = messagesList.scrollHeight;

    if (messageData && messageData.role === 'user') {
         saveState();
    }
  }

  // Function to save the current state to the history stack
  function saveState() {
      // Save a deep copy of the current messages array
      historyStack.push(JSON.parse(JSON.stringify(messages)));
      console.log("State saved. History stack length:", historyStack.length);
  }

  // Function to perform the undo action
  function performUndo() {
      if (historyStack.length === 0) {
          const originalStatus = agentStatus.innerHTML;
          agentStatus.textContent = "⚠️ Nothing to undo.";
          console.log("Ctrl+Z: Nothing to undo.");
          setTimeout(() => {
              if (agentStatus.textContent === "⚠️ Nothing to undo.") {
                  agentStatus.innerHTML = originalStatus;
              }
          }, 2000);
          return;
      }

      // Pop the last state and update the messages array
      const previousMessages = historyStack.pop();
      messages.length = 0; // Clear current messages
      messages.push(...previousMessages); // Restore previous messages
      updateChatDisplay(); // Refresh the UI

      const originalStatus = agentStatus.innerHTML;
      agentStatus.innerHTML = `<i class="bi bi-arrow-counterclockwise me-1"></i> Last action undone.`;
      console.log("Ctrl+Z: Last action undone.");
      setTimeout(() => {
          if (agentStatus.innerHTML.includes("Last action undone.")) {
              agentStatus.innerHTML = originalStatus;
          }
      }, 2000);
  }

  // Function to update the chat display based on the messages array
  function updateChatDisplay() {
      // Clear the current chat display
      messagesList.innerHTML = '';

      // Re-append all messages
      messages.forEach(msg => {
          // Determine role and content for display
          // This logic depends on how you store messages.
          // Assuming messages are stored like { role: 'user', content: '...' } or { role: 'assistant', content: '...' }
          // For tool calls/results, you might have a different structure.
          // Let's adapt the existing appendMessage logic slightly.
          if (msg.role === 'user' || msg.role === 'assistant') {
              appendMessage(msg.role, msg.content); // Reuse existing function
          } else if (msg.type === 'tool_call') {
              appendMessage('tool_call', msg.content);
          } else if (msg.type === 'tool_result') {
              // Check if it's an error or success
              if (msg.content && msg.content.error) {
                  appendMessage('tool_error', `Error in <code>${msg.content.tool_name}</code>: ${msg.content.error}`);
              } else {
                  // This is a simplified re-display. You might want to format it better.
                  appendMessage('tool_result', `Result from <code>${msg.content.tool_name}</code>: <pre class="mb-0 small">${JSON.stringify(msg.content.result, null, 2)}</pre>`);
              }
          }
          // Add other message types as needed (e.g., tool_error if stored separately)
      });
  }

  // Add the keyboard event listener for Ctrl+Z
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault(); 
        console.log("Cmd/Ctrl+Z detected in agent demo.");
        performUndo();
    }
});

  // Function to send a message to the agent backend
  async function sendAgentMessage(message) {

    saveState();

    const userMessage = { role: 'user', content: message };
    messages.push(userMessage);
    appendMessage('user', message);

    // Show loading status
    agentStatus.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Agent is thinking and acting...`;
    userInput.disabled = true;
    sendButton.disabled = true;

    try {
      const response = await fetch('/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message, history: messages.slice(0, -1) }) // Send history excluding the just-added user message
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle potential tool calls and final response
      if (data.tool_calls && data.tool_calls.length > 0) {
         // Display tool calls
         data.tool_calls.forEach(tc => {
             appendMessage('tool_call', `Calling <code>${tc.function.name}</code> with arguments: <pre class="mb-0 small">${tc.function.arguments}</pre>`);
         });
      }

      if (data.tool_results && data.tool_results.length > 0) {
        data.tool_results.forEach(tr => {
          if (tr.error) {
            appendMessage('tool_error', `❌ Error in <code>${tr.tool_name}</code>: ${tr.error}`);
          } else {
            let resultHtml = `<strong>✅ (<code>${tr.tool_name}</code>):</strong><br>`;
            const result = tr.result;

            if (tr.tool_name === "store_chat_on_arweave" || tr.tool_name === "store_gaia_config_on_arweave") {
              resultHtml += `
                <div class="mt-1">
                  <strong>Status:</strong> ${result.status}<br>
                  <strong>Message:</strong> ${result.message}<br>
              `;
              if (result.link) {
                resultHtml += `<strong>Link:</strong> <a href="${result.link}" target="_blank">${result.link}</a><br>`;
              }
              if (result.receipt_id) {
                //resultHtml += `<strong>Receipt ID:</strong> <code>${result.receipt_id}</code><br>`;
                resultHtml += `<strong>Upload ID:</strong> <code>${result.receipt_id}</code><br>`;
              }
              resultHtml += `</div>`;

            } else if (tr.tool_name === "check_transaction_status") {
              resultHtml += `
                <div class="mt-1">
                  <strong>Status:</strong> ${result.status}<br>
                  <strong>Message:</strong> ${result.message}<br>
              `;
              if (result.link) {
                // If the backend provided a direct link
                resultHtml += `<strong>Link:</strong> <a href="${result.link}" target="_blank" class="arweave-link">View on Arweave</a><br>`;
              } else if (result.arweaveTxId) {
                // If backend provided arweaveTxId, construct the link
                const arweaveUrl = `https://arweave.net/${result.arweaveTxId}`;
                resultHtml += `<strong>Link:</strong> <a href="${arweaveUrl}" target="_blank" class="arweave-link">View on Arweave</a><br>`;
              }

              if (result.arweaveTxId && !result.link) { // Only show TxId if link wasn't shown above
                  resultHtml += `<strong>Arweave Tx ID:</strong> <code>${result.arweaveTxId}</code><br>`;
              }
              
              
              resultHtml += `
                  <strong>Name:</strong> ${result.name || 'N/A'}<br>
                  <strong>Size:</strong> ${result.size || 'N/A'} bytes<br>
                  <strong>Created:</strong> ${result.createdAt || 'N/A'}<br>
                </div>
              `;

            } else if (tr.tool_name === "list_user_uploads") {
              resultHtml += `<div class="mt-1">${result.message}</div>`;
              if (result.uploads && result.uploads.length > 0) {
                resultHtml += `<ul class="list-group list-group-flush mt-2 small">`;
                result.uploads.forEach(upload => {
                  resultHtml += `<li class="list-group-item px-2 py-1">
                    <strong>${upload.name || 'Unnamed File'}</strong> (ID: <code>${upload.receipt_id.substring(0, 8)}...</code>)
                    <br>Status: <span class="badge bg-secondary">${upload.status}</span>
                    Size: ${(upload.size_bytes / 1024).toFixed(2)} KB
                    ${upload.arweave_tx_id ? `<br>Arweave Tx: <code>${upload.arweave_tx_id.substring(0, 10)}...</code>` : ''}
                  </li>`;
                });
                resultHtml += `</ul>`;
              }

            } else if (tr.tool_name === "get_wallet_balance") {
              resultHtml += `
                <div class="mt-1">
                  <strong>Message:</strong> ${result.message}<br>
                  <strong>Balance:</strong> ${result.balance} ${result.token}<br>
                  <strong>Wallet Address:</strong> <code>${result.wallet_address?.substring(0, 10)}...</code><br>
                </div>
              `;

            } else if (tr.tool_name === "search_files_by_tag") {
              resultHtml += `<div class="mt-1">${result.message}</div>`;
              if (result.results && result.results.length > 0) {
                  resultHtml += `<ul class="list-group list-group-flush mt-2 small">`;
                  result.results.forEach(file => {
                    resultHtml += `<li class="list-group-item px-2 py-1">
                      <strong>${file.name || 'Unnamed File'}</strong> (ID: <code>${file.receipt_id.substring(0, 8)}...</code>)
                      <br>Status: <span class="badge bg-secondary">${file.status}</span>
                      ${file.arweave_tx_id ? `<br>Arweave Tx: <code>${file.arweave_tx_id.substring(0, 10)}...</code>` : ''}
                      <br>Created: ${file.created_at || 'N/A'}
                    </li>`;
                  });
                  resultHtml += `</ul>`;
              } else {
                  resultHtml += `<div class="mt-1 text-muted">No files matched the search criteria.</div>`;
              }

            } else {
              // Fallback for other tools or unexpected structures
              resultHtml += `<pre class="mb-0 small mt-1">${JSON.stringify(result, null, 2)}</pre>`;
            }

            appendMessage('tool_result', resultHtml);
          }
        });
      }

      // Display the final AI response
      if (data.final_response) {
          const assistantMessage = { role: 'assistant', content: data.final_response };
          messages.push(assistantMessage);
          appendMessage('assistant', data.final_response);
      } else {
          appendMessage('assistant', "Agent completed actions but provided no final response.");
      }


    } catch (error) {
      console.error("Agent interaction error:", error);
      appendMessage('assistant', `❌ Sorry, an error occurred: ${error.message}`);
    } finally {
      agentStatus.textContent = '';
      userInput.disabled = false;
      sendButton.disabled = false;
      userInput.value = '';
      userInput.focus();
    }
  }

  // Event listener for the chat form
  document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = userInput.value.trim();
    if (!input) return;

    await sendAgentMessage(input);
  });

  // Initial welcome message
  window.onload = function() {
     setTimeout(() => {
         appendMessage('assistant', "Hello! I'm an AI agent that can interact with Arweave. Ask me to store chats, retrieve them, or other actions!");
     }, 500); // Small delay for visual effect
  };
});