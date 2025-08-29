document.addEventListener('DOMContentLoaded', () => {
  const socket = io(); // Connect to Socket.IO server

  const messagesList = document.getElementById('messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const undoButton = document.getElementById('undo-button');
  const uploadButton = document.getElementById('upload-button');
  const uploadStatus = document.getElementById('upload-status');
  const refreshUploadsButton = document.getElementById('refresh-uploads-btn');
  const uploadsListContainer = document.getElementById('uploads-list-container');
  const uploadsListContent = document.getElementById('uploads-list-content');

  const timelineContainer = document.getElementById('arweave-timeline-container');
  const toggleTimelineButton = document.getElementById('toggle-timeline');
  const timelineSteps = {
    estimates: document.getElementById('timeline-step-estimates'),
    upload: document.getElementById('timeline-step-upload'),
    finalize: document.getElementById('timeline-step-finalize')
  };
  const timelineDetails = {
    estimates: document.getElementById('estimates-details'),
    upload: document.getElementById('upload-details'),
    finalize: document.getElementById('finalize-details')
  };
  const timelineTimes = {
    estimates: document.getElementById('estimates-time'),
    upload: document.getElementById('upload-time'),
    finalize: document.getElementById('finalize-time')
  };

  let messages = [];
  let historyStack = [];
  let isChatUploaded = false;

  function performUndo() {
    if (historyStack.length === 0) {
      // Use uploadStatus or a dedicated info area if you have one, or temporarily show in chat
      // For simplicity, let's use uploadStatus for now, but you might want a dedicated info spot.
      const originalStatus = uploadStatus.innerHTML; // Save current status
      uploadStatus.textContent = "⚠️ Nothing to undo.";
      console.log("Ctrl+Z: Nothing to undo.");
      // Optional: Clear the "Nothing to undo" message after a delay
      setTimeout(() => {
         // Only clear if the message hasn't been changed by another process
         if (uploadStatus.textContent === "⚠️ Nothing to undo.") {
             uploadStatus.innerHTML = originalStatus; // Restore original status
         }
      }, 2000);
      return;
    }

    const previousMessages = historyStack.pop();
    messages.length = 0;
    messages.push(...previousMessages);
    updateChatDisplay(); // Refresh the entire chat display

    // Update status message
    const originalStatus = uploadStatus.innerHTML;
    uploadStatus.innerHTML = `<i class="bi bi-arrow-counterclockwise me-1"></i> Last message undone.`;
    console.log("Ctrl+Z: Last message undone.");
    // Optional: Clear the undo confirmation message after a delay
     setTimeout(() => {
         if (uploadStatus.innerHTML.includes("Last message undone.")) {
             uploadStatus.innerHTML = originalStatus; // Restore original status
         }
     }, 2000);
  }

  // 2. Add the keyboard event listener for Ctrl+Z
  document.addEventListener('keydown', (event) => {
    // Check if Ctrl key (or Cmd on Mac) and Z key are pressed
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      // Prevent the browser's default undo behavior (e.g., in input fields)
      event.preventDefault();
      console.log("Ctrl+Z detected.");
      performUndo();
    }
  });
  document.getElementById('undo-button').addEventListener('click', () => {
     console.log("Undo button clicked.");
     performUndo();
  });

  // Function to append a message to the chat
  function appendMessage(role, content) {
    const li = document.createElement('li');
    li.classList.add('mb-2');
    li.classList.add('mt-2');

    if (role === 'user') {
        // User message
        li.innerHTML = `
        <div class="d-flex justify-content-start">
            <div class="flex-shrink-0 me-3">
            <img src="https://res.cloudinary.com/mhmd/image/upload/v1564960395/avatar_usae7z.svg" alt="User" width="50" height="50" class="rounded-circle">
            </div>
            <div class="media-body ml-4">
            <div class="d-flex align-items-center justify-content-between mb-1">
                <h6 class="mb-0">You</h6><small class="small font-weight-bold">Just now</small>
            </div>
            <p class="font-italic mb-0 text-small">${content}</p>
            </div>
        </div>
        `;
    } else if (role === 'assistant') {
        // Gaia message
        li.innerHTML = `
        <div class="d-flex justify-content-end">
            <div class="media-body mr-4">
            <div class="d-flex align-items-center justify-content-between mb-1">
                <h6 class="mb-0">Gaia</h6><small class="small font-weight-bold">Just now</small>
            </div>
            <p class="font-italic mb-0">${content}</p>
            </div>
            <div class="flex-shrink-0 ms-3">
            <img src="https://www.gaianet.ai/favicon.ico" alt="Gaia" width="50" height="50" class="rounded-circle">
            </div>
        </div>
        `;
    }

    console.log("Appending message:", role, content); // Debugging
    messagesList.appendChild(li);
    messagesList.scrollTop = messagesList.scrollHeight; // Auto-scroll to bottom
  }

  function showTimeline() {
    timelineContainer.style.display = 'block';
    if (toggleTimelineButton) {
        toggleTimelineButton.style.display = 'inline-block';
    }
    resetTimeline(); // Reset state on show
    }

    function hideTimeline() {
        timelineContainer.style.display = 'none';
        // Don't hide the toggle button itself, just the container
    }

    function resetTimeline() {
        // Reset all steps to default state
        Object.keys(timelineSteps).forEach(key => {
            const step = timelineSteps[key];
            const detail = timelineDetails[key];
            const time = timelineTimes[key];
            step.classList.remove('completed', 'in-progress', 'error');
            if (detail) detail.textContent = '...'; // Reset detail text
            if (time) time.textContent = ''; // Clear time
        });
    }

    function updateTimelineStep(stepKey, status, details = '', time = new Date()) {
        const step = timelineSteps[stepKey];
        const detail = timelineDetails[stepKey];
        const timeElement = timelineTimes[stepKey];

        if (step) {
            // Remove existing status classes
            step.classList.remove('completed', 'in-progress', 'error');
            // Add new status class
            step.classList.add(status);
        }
        if (detail) {
            detail.textContent = details;
        }
        if (timeElement) {
            // Format time (e.g., HH:MM:SS)
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            const seconds = time.getSeconds().toString().padStart(2, '0');
            timeElement.textContent = `${hours}:${minutes}:${seconds}`;
        }
    }

  function showLoading(message = "Processing...") {
    // Use Bootstrap Icons spinner
    uploadStatus.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${message}`;
    // Disable buttons during loading
    if (uploadButton) uploadButton.disabled = true;
    if (undoButton) undoButton.disabled = true;
    // sendButton usually stays enabled for chat, but you can disable if needed
    // if (sendButton) sendButton.disabled = true;
  }

  function hideLoading() {
    // Re-enable buttons
    if (uploadButton) uploadButton.disabled = false;
    if (undoButton) undoButton.disabled = false;
    // if (sendButton) sendButton.disabled = false;
    // Optionally clear the status or leave the last message
    // uploadStatus.innerHTML = '';
  }

  // Function to send a chat message
  document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = userInput.value.trim();
    if (!input) return;

    historyStack.push(JSON.parse(JSON.stringify(messages)));

    messages.push({ role: 'user', content: input });
    appendMessage('user', input);

    // Send message to backend via WebSocket
    socket.emit('chat_message', { history: messages, input });

    userInput.value = '';
    userInput.focus();

    // Remove any existing listener first to avoid duplicates
    socket.off('gaia_response'); // Remove previous listener

    // Wait for Gaia response
    socket.on('gaia_response', (reply) => {
      console.log("Received gaia_response:", reply); // Debugging

      messages.push({ role: 'assistant', content: reply });
      appendMessage('assistant', reply);
    });

    socket.on('error', (error) => {
      appendMessage('Error', error);
    });
  });

  // Function to undo the last message
  document.getElementById('undo-button').addEventListener('click', () => {
    if (historyStack.length === 0) {
      appendMessage('System', 'Nothing to undo.');
      return;
    }

    const previousMessages = historyStack.pop();
    messages.length = 0;
    messages.push(...previousMessages);
    updateChatDisplay();
    appendMessage('System', 'Last message undone.');
  });

  if (refreshUploadsButton) {
    refreshUploadsButton.addEventListener('click', async () => {
        // Add a temporary spinning icon to the button
        const originalHtml = refreshUploadsButton.innerHTML;
        refreshUploadsButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Refreshing...';
        refreshUploadsButton.disabled = true; // Disable button while fetching

        try {
            await fetchAndDisplayUploads();
        } catch (error) {
            console.error("Error triggering fetchAndDisplayUploads:", error);
            // Optionally show a brief error message near the button or in status
            if(uploadStatus) { // Reuse uploadStatus for error if specific area not available
                 const originalStatus = uploadStatus.innerHTML;
                 uploadStatus.textContent = "❌ Failed to refresh uploads.";
                 setTimeout(() => { uploadStatus.innerHTML = originalStatus; }, 3000);
            }
        } finally {
            // Restore button state
            refreshUploadsButton.innerHTML = originalHtml;
            refreshUploadsButton.disabled = false;
        }
    });
}

  // Function to update chat display
  function updateChatDisplay() {
    messagesList.innerHTML = ''; // Clear
    messages.forEach(msg => {
      if (msg.role !== 'system') {
        appendMessage(msg.role, msg.content);
      }
    });
  }

  // Function to get Arweave upload estimates
  async function getEstimates(transcript) {
    showLoading("Getting Arweave upload estimates...");

    try {
      const response = await fetch('/get-estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const estimates = await response.json();
      updateTimelineStep('estimates', 'completed', `Estimated cost: ${estimates.usdc.amount} USDC`);
        
      //uploadStatus.textContent = `Estimated cost: ${estimates.usdc.amount} USDC`;
              uploadStatus.innerHTML = `Estimated cost: <strong>${estimates.usdc.amount} USDC</strong>`; // Use innerHTML for bold
      return estimates;
    } catch (error) {
      //uploadStatus.textContent = `Error getting estimates: ${error.message}`;
      updateTimelineStep('estimates', 'error', `Error: ${error.message.substring(0, 50)}...`); // Truncate long errors
        
      uploadStatus.innerHTML = `❌ <strong>Error getting estimates:</strong> <code>${error.message}</code>`;
      throw error;
    }
  }

  // Function to upload chat to Arweave
  async function uploadToArweave(transcript) {
    try {
      const estimates = await getEstimates(transcript);

        updateTimelineStep('upload', 'in-progress', "Sending data to Arweave bundler...");
       showLoading("Uploading transcript to Arweave...");
      const response = await fetch('/upload-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const { receipt, arweaveTxId, link } = data;
      updateTimelineStep('upload', 'completed', "Data sent to bundler.");
        updateTimelineStep('finalize', 'in-progress', "Waiting for Arweave confirmation...");
        
      if (link) {
            updateTimelineStep('finalize', 'completed', "Transaction confirmed on Arweave!");ML = `✅ <strong>Uploaded successfully!</strong> The data is being finalized on Arweave. <a href="${link}" target="_blank" class="alert-link">View on Arweave</a> (link might take a few seconds to work).`;
        } else if (arweaveTxId) {
            updateTimelineStep('finalize', 'completed', "Transaction confirmed on Arweave!");
            uploadStatus.innerHTML = `✅ <strong>Uploaded successfully!</strong> The data is being finalized on Arweave. View at: <a href="https://arweave.net/${arweaveTxId}" target="_blank" class="alert-link">https://arweave.net/${arweaveTxId}</a> (link might take a few seconds to work).`;
        } else {
            updateTimelineStep('finalize', 'in-progress', "Upload initiated. Finalization pending. Check Receipt ID.");
            uploadStatus.innerHTML = `🔄 <strong>Upload initiated.</strong> The data is being processed for Arweave. Check back shortly using the Receipt ID: <code>${receipt.id}</code>.`;
        }
        isChatUploaded = true;
        if (uploadButton) {
            uploadButton.disabled = true;
            uploadButton.classList.add('btn-secondary');
            uploadButton.classList.remove('btn-success');
        }
        if (toggleTimelineButton) {
            toggleTimelineButton.style.display = 'inline-block';
        }
        if (uploadsListContainer) {
             uploadsListContainer.style.display = 'block';
        }
        setTimeout(() => {
             fetchAndDisplayUploads(); // This will show loading, then the list
        }, 500); // 500ms delay
    } catch (error) {
      console.error("Upload/Estimates error:", error);

       if (timelineSteps.estimates && timelineSteps.estimates.classList.contains('completed')) {
             // If estimates were successful, the error is likely in upload or finalize
             if (timelineSteps.upload && !timelineSteps.upload.classList.contains('completed')) {
                 updateTimelineStep('upload', 'error', `Error: ${error.message.substring(0, 50)}...`);
             } else if (timelineSteps.finalize && !timelineSteps.finalize.classList.contains('completed')) {
                 updateTimelineStep('finalize', 'error', `Error: ${error.message.substring(0, 50)}...`);
             }
        } else {
            if (timelineSteps.estimates && !timelineSteps.estimates.classList.contains('error') && !timelineSteps.estimates.classList.contains('completed')) {
                updateTimelineStep('estimates', 'error', `Error: ${error.message.substring(0, 50)}...`);
            }
        }
      //uploadStatus.innerHTML = `❌ Upload failed: <code>${error.message}</code>`; // Use innerHTML for code tag
      let errorMessage = error.message;
        if (error.message.includes("Failed to fetch")) {
            errorMessage = "Could not connect to the server. Please check your connection and try again.";
        } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
            errorMessage = "Authorization failed. Please ensure the application is configured correctly."; // Internal issue
        } else if (error.message.includes("402") || error.message.includes("Insufficient funds")) {
             errorMessage = "Upload failed: Insufficient funds in the app wallet."; // Internal issue
        }

      uploadStatus.innerHTML = `❌ <strong>Upload failed:</strong> ${errorMessage}`;
    } finally {
      hideLoading();
      if (uploadButton) uploadButton.disabled = false; // Re-enable in case of error
        if (undoButton) undoButton.disabled = false;
    }
  }

  async function fetchAndDisplayUploads() {
  if (!uploadsListContainer || !uploadsListContent) {
    console.error("Uploads list elements not found in DOM.");
    return; // Exit if elements are missing
  }

  // Show loading indicator in the uploads list area
  uploadsListContent.innerHTML = `<div class="text-center"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading uploads...</div>`;
  uploadsListContainer.style.display = 'block'; // Ensure the container is visible

  try {
    console.log("Fetching user uploads from backend...");
    const response = await fetch('/get-my-uploads');

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      // Try to get error details from the response body
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error("Backend error details:", errorData);
      } catch (e) {
        // If parsing JSON fails, use the status text
        errorMessage = `${errorMessage} - ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const uploads = await response.json();
    console.log("Uploads fetched successfully:", uploads);

    if (!Array.isArray(uploads) || uploads.length === 0) {
      uploadsListContent.innerHTML = '<p class="text-muted small mb-0">No uploads found for this wallet.</p>';
      return;
    }

    // Sort uploads by createdAt date, newest first (assuming createdAt is an ISO string)
    uploads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Build the HTML for the list
    let uploadsHtml = '<ul class="list-group list-group-flush">';
    uploads.forEach(upload => {
      // Determine status badge class and text
      let statusBadgeClass = 'bg-secondary'; // Default
      let statusText = upload.status || 'Unknown';
      if (upload.status === 'SUCCESS' || upload.status === 'CONFIRMED') {
        statusBadgeClass = 'bg-success';
      } else if (upload.status === 'FAILED') {
        statusBadgeClass = 'bg-danger';
      } else if (upload.status === 'PENDING' || upload.status === 'PROCESSING') {
        statusBadgeClass = 'bg-warning text-dark'; // text-dark for better contrast on warning
      } else if (upload.status === 'PAID') {
         statusBadgeClass = 'bg-info'; // Example for PAID status
      }
      let formattedDate = 'N/A';
      if (upload.createdAt) {
         const date = new Date(upload.createdAt);
         // Example format: "Aug 05, 2025 10:30 AM"
         formattedDate = date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }

      // Build the list item HTML
      uploadsHtml += `
        <li class="list-group-item px-0 py-2">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-bold small">${upload.name || `Upload ${upload.id.substring(0, 8)}`}</div>
              <small class="text-muted">ID: ${upload.id.substring(0, 8)}...</small>
            </div>
            <span class="badge ${statusBadgeClass} rounded-pill">${statusText}</span>
          </div>
          <div class="d-flex justify-content-between small text-muted mt-1">
            <span>${formattedDate}</span>
            <span>${upload.size ? `${(upload.size / 1024).toFixed(2)} KB` : 'N/A'}</span>
          </div>
          ${
            upload.arweaveTxId
              ? `<div class="mt-1"><a href="https://arweave.net/${upload.arweaveTxId}" target="_blank" class="small">View on Arweave <i class="bi bi-box-arrow-up-right ms-1"></i></a></div>`
              : `<div class="mt-1"><span class="small text-muted">Arweave Tx ID pending...</span></div>`
          }
        </li>
      `;
    });
    uploadsHtml += '</ul>';

    // Populate the uploads list content area
    uploadsListContent.innerHTML = uploadsHtml;

  } catch (error) {
    console.error("Error fetching/uploads:", error);
    // Display error message in the uploads list area
    uploadsListContent.innerHTML = `<p class="text-danger small mb-0">❌ Error loading uploads: ${error.message}</p>`;
    // Optionally, hide the container again if preferred on error
    // uploadsListContainer.style.display = 'none';
  }
}

  // Button to upload chat to Arweave
  document.getElementById('upload-button').addEventListener('click', async () => {
    if (isChatUploaded) {
        uploadStatus.innerHTML = `<i class="bi bi-info-circle-fill me-1"></i> This chat has already been uploaded.`;
        return; // Exit early if already uploaded
    }

    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    if (!transcript.trim()) {
        uploadStatus.textContent = "Nothing to upload.";
        return;
    }
     showTimeline();
    await uploadToArweave(transcript);
  });

  if (toggleTimelineButton) {
    toggleTimelineButton.addEventListener('click', () => {
        if (timelineContainer.style.display === 'none' || timelineContainer.style.display === '') {
            timelineContainer.style.display = 'block';
            toggleTimelineButton.innerHTML = '<i class="bi bi-list-task"></i> Hide Timeline'; // Update button text/icon
        } else {
            timelineContainer.style.display = 'none';
            toggleTimelineButton.innerHTML = '<i class="bi bi-list-task"></i> Timeline'; // Update button text/icon
        }
    });
}
});