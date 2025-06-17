(function() {
    // CSS styles
    const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: "Inter", sans-serif;
      }
      body {
        background: #f5f5f5;
      }
      .chatbot-toggler {
        background: ${CHATBOT_CONFIG.brandColor};
      }
      .chatbot header {
        color: ${CHATBOT_CONFIG.chatHeaderTextColor};
        background: ${CHATBOT_CONFIG.chatHeaderBackground};
      }
      .chatbox .incoming span {
        background: ${CHATBOT_CONFIG.brandColor};
      }
      .chatbox .chat p {
        color: ${CHATBOT_CONFIG.chatBubbleTextColorUser};
        background: ${CHATBOT_CONFIG.chatBubbleBackgroundUser};
      }
      .chatbox .incoming p {
        color: ${CHATBOT_CONFIG.chatBubbleTextColorBot};
        background: ${CHATBOT_CONFIG.chatBubbleBackgroundBot};
      }
      .chat-input span {
        color: ${CHATBOT_CONFIG.brandColor};
      }
      .suggested-question {
        color: ${CHATBOT_CONFIG.brandColor};
        border: 1px solid ${CHATBOT_CONFIG.brandColor};
      }
      .suggested-question:hover {
        background: ${CHATBOT_CONFIG.brandColorHover};
        color: #fff;
      }
    .chatbot-toggler {
        position: fixed;
        bottom: 30px;
        right: 35px;
        outline: none;
        border: none;
        height: 50px;
        width: 50px;
        display: flex;
        cursor: pointer;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #000000;
        transition: all 0.2s ease;
    }
    body.show-chatbot .chatbot-toggler {
        transform: rotate(90deg);
    }
    .chatbot-toggler span {
        color: #fff;
        position: absolute;
    }
    .chatbot-toggler span:last-child,
        body.show-chatbot .chatbot-toggler span:first-child {
        opacity: 0;
    }
    body.show-chatbot .chatbot-toggler span:last-child {
        opacity: 1;
    }
    .chatbot {
        position: fixed;
        right: 35px;
        bottom: 90px;
        width: 420px;
        background: #fff;
        border-radius: 15px;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
        transform: scale(0.5);
        transform-origin: bottom right;
        box-shadow: 0 0 128px 0 rgba(0,0,0,0.1), 0 32px 64px -48px rgba(0,0,0,0.5);
        transition: all 0.1s ease;
    }

    body.show-chatbot .chatbot {
        opacity: 1;
        pointer-events: auto;
        transform: scale(1);
    }

    .chatbot header {
        padding: 16px 0;
        position: relative;
        text-align: center;
        color: #000;
        background: #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .chatbot header span {
        position: absolute;
        right: 15px;
        top: 50%;
        display: none;
        cursor: pointer;
        transform: translateY(-50%);
    }
    header h2 {
        font-size: 1rem;
    }
    .chatbot .chatbox {
        overflow-y: auto;
        height: 510px;
        padding: 30px 20px 100px;
    }
    .chatbot :where(.chatbox, textarea)::-webkit-scrollbar {
        width: 6px;
    }
    .chatbot :where(.chatbox, textarea)::-webkit-scrollbar-track {
        background: #fff;
        border-radius: 25px;
    }
    .chatbot :where(.chatbox, textarea)::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 25px;
    }
    .chatbox .chat {
        display: flex;
        list-style: none;
    }
    .chatbox .outgoing {
        margin: 20px 0;
        justify-content: flex-end;
    }
    .chatbox .incoming p {
        border-radius: 10px 10px 10px 0;
    }
    .chatbox .incoming span {
        width: 32px;
        height: 32px;
        color: #fff;
        cursor: default;
        text-align: center;
        line-height: 32px;
        align-self: flex-end;
        background: #000000;
        border-radius: 4px;
        margin: 0 10px 7px 0;
    }
    .chatbox .chat p {
        white-space: pre-wrap;
        padding: 12px 16px;
        border-radius: 10px 10px 0 10px;
        max-width: 75%;
        color: #fff;
        font-size: 0.95rem;
        background: #724ae8;
    }
    .chatbox .chat p.error {
        color: #721c24;
        background: #f8d7da;
    }
    .chatbot .chat-input {
        display: flex;
        gap: 5px;
        position: absolute;
        bottom: 0;
        width: 100%;
        background: #fff;
        padding: 3px 20px;
        border-top: 1px solid #ddd;
    }
    .chat-input textarea {
        height: 55px;
        width: 100%;
        border: none;
        outline: none;
        resize: none;
        max-height: 180px;
        padding: 15px 15px 15px 0;
        font-size: 0.95rem;
    }
    .chat-input span {
        align-self: flex-end;
        color: #000000;
        cursor: pointer;
        height: 55px;
        display: flex;
        align-items: center;
        visibility: hidden;
        font-size: 1.35rem;
    }
    .chat-input textarea:valid ~ span {
        visibility: visible;
    }
    .chatbox .chat p code {
        background-color: #2b2b2b;
        padding: 2px 4px;
        border-radius: 4px;
        color: yellow;
    }
    .chatbox .chat p a {
        color: #18a82c;
        text-decoration: underline;
        word-break: break-all;
    }
    .chatbox .chat p pre {
        background-color: #2b2b2b;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
    }
    .chatbox .chat p ul, .chatbox .chat p ol {
        margin-left: 20px;
    }
    .chatbox .incoming p {
        border-radius: 10px 10px 10px 0;
        background: #f2f2f2;
        color: #000;
    }
    .suggested-questions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
        margin-bottom: 10px;
    }
    .suggested-question {
        background: transparent;
        color: #000000;
        border: 1px solid #000000;
        padding: 8px 12px;
        border-radius: 20px;
        cursor: pointer;
        text-align: left;
        transition: background 0.3s, color 0.3s;
        font-size: 0.9rem;
        white-space: nowrap;
    }
    .suggested-question:hover {
        background: #000000;
        color: #fff;
    }
    @media (max-width: 490px) {
        .chatbot-toggler {
            right: 20px;
            bottom: 20px;
        }
        .chatbot {
            right: 0;
            bottom: 0;
            height: 100%;
            border-radius: 0;
            width: 100%;
        }
        .chatbot .chatbox {
            height: 90%;
            padding: 25px 15px 100px;
        }
        .chatbot .chat-input {
            padding: 5px 15px;
        }
        .chatbot header span {
            display: block;
        }
    }
    .chatbot .chat-input {
        background: #fff;
        z-index: 1;
    }
    .chatbot .chatbox {
        overflow-y: auto;
        height: 510px;
        padding: 30px 20px 100px;
    }

    .chatbot .chat {
        display: flex;
        list-style: none;
        margin-bottom: 20px;
    }

    .chatbot .incoming {
        flex-direction: row;
        align-items: flex-start;
    }

    .chatbot .outgoing {
        justify-content: flex-end;
    }

    .chatbot .chat .message {
        max-width: 75%;
        padding: 15px;
        border-radius: 10px;
        font-size: 0.95rem;
        line-height: 1.5;
    }

    .chatbot .incoming .message {
        background: #f2f2f2;
        color: #000;
        border-top-left-radius: 0;
    }

    .chatbot .outgoing .message {
        background: #000000;
        color: #fff;
        border-top-right-radius: 0;
    }

    .chatbot .chat .message-content {
        width: 100%;
    }

    .chatbot .chat .message-content > *:first-child {
        margin-top: 0;
    }

    .chatbot .chat .message-content > *:last-child {
        margin-bottom: 0;
    }

    .chatbot .chat .message-content p {
        margin: 0 0 10px 0;
    }

    .chatbot .incoming span {
        width: 32px;
        height: 32px;
        color: #fff;
        background: #000000;
        border-radius: 4px;
        text-align: center;
        line-height: 32px;
        margin-right: 10px;
    }

    /* Ensure paragraphs within messages don't have extra margins */
    .chatbot .chat .message p {
        margin: 0 0 10px 0;
    }

    .chatbot .chat .message p:last-child {
        margin-bottom: 0;
    }

    /* Adjust for mobile devices */
    @media (max-width: 490px) {
        .chatbot .chat .message {
            max-width: 85%;
        }
    }
    /* Styling for lists within messages */
    .chatbot .chat .message-content ul,
    .chatbot .chat .message-content ol {
        margin: 10px 0;
        padding-left: 20px;
    }

    .chatbot .chat .message-content li {
        margin-bottom: 5px;
    }

    .chatbot .chat .message-content li:last-child {
        margin-bottom: 0;
    }

    /* Remove default list-style for unordered lists and add custom bullet */
    .chatbot .chat .message-content ul {
        list-style-type: none;
    }

    .chatbot .chat .message-content ul li::before {
        content: "•";
        color: currentColor;
        display: inline-block;
        width: 1em;
        margin-left: -1em;
    }

    /* Ensure proper spacing for paragraphs */
    .chatbot .chat .message-content p {
        margin: 0 0 10px 0;
    }

    .chatbot .chat .message-content > *:first-child {
        margin-top: 0;
    }

    .chatbot .chat .message-content > *:last-child {
        margin-bottom: 0;
    }
    .material-symbols-outlined { background: transparent !important; }
    /* Adjust for mobile devices */
    @media (max-width: 490px) {
        .chatbot .chat .message {
            max-width: 85%;
        }
    }
    `;

    // HTML structure
    const htmlStructure = `
      <button class="chatbot-toggler">
        <span class="material-symbols-outlined">chat</span>
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="chatbot">
        <header>
          <h2>${CHATBOT_CONFIG.botTitle}</h2>
          <p style="font-size: 0.5rem">Powered by <a href="https://www.gaianet.ai target="_blank" rel="noopener noreferrer">Gaia</a></p>
          <span class="close-btn material-symbols-outlined">close</span>
        </header>
        <ul class="chatbox">
          <li class="chat incoming">
            <span class="material-symbols-outlined">🤖</span>
            <p>${CHATBOT_CONFIG.welcomeMessage}</p>
          </li>
          <li class="chat suggested-questions"></li>
        </ul>
        <div class="chat-input">
          <textarea placeholder="${CHATBOT_CONFIG.placeholderText}" required></textarea>
          <span id="send-btn" class="material-symbols-outlined">send</span>
        </div>
      </div>
    `;
  
    // Inject CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  
    
  
    // Load Material Icons
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0';
    document.head.appendChild(linkElement);
  
    // Load DOMPurify
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.3.10/purify.min.js';
    document.head.appendChild(scriptElement);

    const markedscriptElement = document.createElement('script');
    markedscriptElement.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(markedscriptElement);

    // Inject HTML
    const chatbotElement = document.createElement('div');
    chatbotElement.id = 'chatbot-container';
    chatbotElement.innerHTML = htmlStructure;
    document.body.appendChild(chatbotElement);

    // Main chatbot logic
    function initChatbot() {
      const chatbotToggler = document.querySelector(".chatbot-toggler");
      const closeBtn = document.querySelector(".close-btn");
      const chatbox = document.querySelector(".chatbox");
      const chatInput = document.querySelector(".chat-input textarea");
      const sendChatBtn = document.querySelector(".chat-input span");
      const suggestedQuestionsContainer = document.querySelector(".suggested-questions");
  
      let userMessage = null;
      const inputInitHeight = chatInput.scrollHeight;
  
      // API configuration
      const API_KEY = window.CHATBOT_CONFIG?.apiKey || "";
      const API_URL = window.CHATBOT_CONFIG?.apiUrl || `https://mantle.us.gaianet.network/v1/chat/completions`;
  
      const createChatLi = (message, className) => {
        const chatLi = document.createElement("li");
        chatLi.classList.add("chat", `${className}`);
        let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">🤖</span><p></p>`;
        chatLi.innerHTML = chatContent;
        chatLi.querySelector("p").textContent = message;
        return chatLi;
      }
  
      const generateResponse = async (chatElement) => {
        const messageElement = chatElement.querySelector("p");
        //console.log(userMessage);
        const requestOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            messages: [{ 
              role: "system", 
              content: CHATBOT_CONFIG.systemMessage
            },
            { 
              role: "user", 
              content: userMessage
            }],
            max_tokens: CHATBOT_CONFIG.maxResponseTokens,
            temperature: CHATBOT_CONFIG.temperatureValue
          }),
        }
  
        try {
          //console.log("Request Options:", requestOptions);
          const response = await fetch(API_URL, requestOptions);
          const data = await response.json();
          //console.log("API Response:", data);
  
          if (!response.ok) throw new Error(data.error?.message || 'Unknown error occurred');
  
          let responseMessage = '';
          if (data.choices && data.choices[0] && data.choices[0].message) {
            responseMessage = data.choices[0].message.content;
          } else if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            responseMessage = data.candidates[0].content.parts[0].text;
          } else {
            throw new Error('Unexpected response structure');
          }
  
          responseMessage = convertLinksToAnchors(responseMessage);
          responseMessage = marked.parse(responseMessage);
          messageElement.innerHTML = DOMPurify.sanitize(responseMessage, {
                ALLOWED_TAGS: ['br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'code', 'pre', 'a'],
                ALLOWED_ATTR: ['href', 'target', 'rel']
          });
        } catch (error) {
          console.error("Error:", error);
          messageElement.classList.add("error");
          messageElement.textContent = error.message || 'An error occurred while fetching the response';
        } finally {
          chatbox.scrollTo(0, chatbox.scrollHeight);
        }
      }
      
      const loadSuggestedQuestions = () => {
        // const questions = [
        //   "What is Mantle?",
        //   "How do I deploy on Mantle?",
        //   "What makes Mantle unique?",
        //   "Explain the transaction process on Mantle"
        // ];
        // questions.forEach(addSuggestedQuestion);
        CHATBOT_CONFIG.suggestedQuestions.forEach(addSuggestedQuestion);
      }

      const handleChat = () => {
        userMessage = chatInput.value.trim();
        if (!userMessage) return;
  
        chatInput.value = "";
        chatInput.style.height = `${inputInitHeight}px`;
  
        chatbox.appendChild(createChatLi(userMessage, "outgoing"));
        chatbox.scrollTo(0, chatbox.scrollHeight);
  
        setTimeout(() => {
          const incomingChatLi = createChatLi("Thinking...", "incoming");
          chatbox.appendChild(incomingChatLi);
          chatbox.scrollTo(0, chatbox.scrollHeight);
          generateResponse(incomingChatLi);
        }, 600);
      }
  
      function convertLinksToAnchors(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function(url) {
          return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
      }
  
      chatInput.addEventListener("input", () => {
        chatInput.style.height = `${inputInitHeight}px`;
        chatInput.style.height = `${chatInput.scrollHeight}px`;
      });
  
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
          e.preventDefault();
          handleChat();
        }
      });
      
      // Modify the addSuggestedQuestion function to handle the transaction process explanation
      const addSuggestedQuestion = (question) => {
        const button = document.createElement('button');
        button.classList.add('suggested-question');
        button.textContent = question;
        button.addEventListener('click', () => {
            chatInput.value = question;
            handleChat();
        });
        suggestedQuestionsContainer.appendChild(button);
      }

      // Load suggested questions when the chatbot initializes
      loadSuggestedQuestions();

      sendChatBtn.addEventListener("click", handleChat);
      closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
      chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
    }
  
    // Initialize chatbot when DOMPurify is loaded
    if (window.DOMPurify) {
      initChatbot();
    } else {
      scriptElement.onload = initChatbot;
    }
})();
