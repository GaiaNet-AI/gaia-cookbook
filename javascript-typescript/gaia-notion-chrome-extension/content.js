// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
      // Get the main content from Notion page
      const content = document.querySelector('.notion-page-content');
      sendResponse({
        content: content ? content.innerText : 'Could not find page content'
      });
    }
    return true;
  });
  
  // Add floating action button to Notion interface
  const fab = document.createElement('div');
  fab.className = 'gaia-fab';
  // Create an img element for the icon
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('icons/icon48.png'); // Using the 48x48 icon size
  icon.alt = 'Gaia Assistant';
  // Add the image to the FAB
  fab.appendChild(icon);
  fab.title = 'Ask Gaia Assistant';

  // Update the CSS for the FAB and icon
  const style = document.createElement('style');
  style.textContent = `
    .gaia-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      background-color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9999;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .gaia-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    }

    .gaia-fab img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
  `;
  document.head.appendChild(style);
  
  fab.addEventListener('click', () => {
    // Open popup or initiate chat interface
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  document.body.appendChild(fab);

  console.log('Content script loaded on Notion');