# Gaia x Arweave Agent Demo

This project demonstrates how to build AI agents that can interact with the Arweave blockchain using the `arweave-storage-sdk` and a custom Gaia node. It provides two main interfaces:

1.  **`index.html`**: A standard chat interface for interacting with a Gaia node, with the ability to upload the conversation history to Arweave.
2.  **`agent-demo.html`**: An advanced interface where an AI agent (powered by your Gaia node) uses natural language to perform actions on Arweave, such as storing chats, configurations, checking statuses, and listing uploads.

<img width="1246" height="3299" alt="screencapture-localhost-3000-2025-08-09-18_13_43" src="https://github.com/user-attachments/assets/4619efb2-0138-4422-a925-4922dd445ad0" />
<img width="1022" height="1070" alt="image" src="https://github.com/user-attachments/assets/92e76d36-10df-4d13-8410-2a8085d2d961" />
<img width="948" height="1025" alt="image" src="https://github.com/user-attachments/assets/05f47348-c0c9-47f8-9c17-1d75080e63ad" />


## Features

*   **Chat with Gaia**: Engage in a conversation with your Gaia AI model.
*   **Arweave Integration**: Store chat transcripts and other data permanently on the Arweave blockchain.
*   **Tool Calling Agent**: The agent in `agent-demo.html` can understand requests and call specific tools to interact with Arweave.
*   **Transaction Management**: Check the status of Arweave uploads and list previous uploads.
*   **Wallet Abstraction**: The backend handles Arweave interactions using a configured wallet (via `PRIVATE_KEY`).

## Prerequisites

*   **Node.js**: Version 18 or higher.
*   **Gaia Node**: Access to a Gaia node with an OpenAI-compatible API that supports tool calling.
*   **Arweave Wallet**: A wallet with sufficient USDC (or configured token) on the specified network (e.g., Base Sepolia) to pay for uploads.
*   **WalletConnect Project ID (Optional for Reown features)**: If you plan to integrate user wallet connections (as seen in earlier code versions), you'll need a project ID from [Reown Dashboard](https://dashboard.reown.com).

## Setup

1.  **Clone the Repository**:
    ```bash
    git clone <your-repo-url>
    cd <your-repo-directory>
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    # This installs dependencies listed in package.json, including:
    # express, http, socket.io, cors, arweave-storage-sdk, openai, dotenv
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory of the project and add the following variables:
    ```env
    # --- Gaia Node Configuration ---
    GAIA_API_KEY=your_gaia_api_key_here
    GAIA_NODE_URL=https://your.gaia.node.url/v1 # Base URL of your Gaia node API
    GAIA_MODEL=your_preferred_model_name # e.g., gpt-3.5-turbo

    # --- Arweave SDK Configuration ---
    # Private key of the wallet that will PAY for uploads via the arweave-storage-sdk
    PRIVATE_KEY=0xYOUR_ACTUAL_APP_WALLET_PRIVATE_KEY_HEX

    # --- Server Configuration ---
    PORT=3000

    # --- WalletConnect (Reown) Configuration (if used) ---
    # WALLETCONNECT_PROJECT_ID=your_reown_project_id_here
    ```

    *   Replace `your_gaia_api_key_here` with your actual API key for the Gaia node.
    *   Replace `https://your.gaia.node.url/v1` with the base URL of your Gaia node's API endpoint.
    *   Replace `your_preferred_model_name` with the name of the model you want to use (e.g., `gpt-3.5-turbo`).
    *   Replace `0xYOUR_ACTUAL_APP_WALLET_PRIVATE_KEY_HEX` with the **private key** (including `0x` prefix) of the Ethereum wallet that will be used by the backend application to pay for Arweave storage fees via the `arweave-storage-sdk`. **Keep this secret!**
    *   Optionally, add your Reown Project ID if integrating wallet connections.

4.  **Prepare Frontend Assets**:
    Ensure your `public/` directory contains the following files:
    *   `index.html`: The main chat interface.
    *   `agent-demo.html`: The AI agent interface.
    *   `main.js`: JavaScript logic for `index.html`.
    *   `agent-demo.js`: JavaScript logic for `agent-demo.html`.
    *   `gaia x arweave.png`: Your application logo (or replace the image source in HTML files).

## Running the Application

1.  **Start the Backend Server**:
    ```bash
    node main.js
    # Or if you have a 'dev' script in package.json using nodemon:
    # npm run dev
    ```
    The server should start and listen on the port specified in your `.env` file (default `3000`).

2.  **Access the Interfaces**:
    Open your web browser and navigate to:
    *   **Main Chat**: `http://localhost:3000`
    *   **Agent Demo**: `http://localhost:3000/agent-demo`

## Using the Interfaces

### `index.html` (Main Chat)

1.  Type your message into the input box and press Enter or click "Send".
2.  The AI response will appear in the chat window.
3.  Use the "Undo Last Message" button or `Ctrl+Z`/`Cmd+Z` to revert the last exchange.
4.  Click "Upload Chat to Arweave".
    *   The application will calculate the estimated cost.
    *   It will then upload the current conversation transcript to Arweave using the backend's configured wallet.
    *   A link to the stored data on Arweave will be provided once the transaction is confirmed.

### `agent-demo.html` (AI Agent)

1.  Type natural language requests into the input box. Examples:
    *   "Store the current chat conversation to Arweave."
    *   "Show me a list of my chats stored on Arweave."
    *   "What's the status of upload ID `abc123...`?" (Use the ID provided after an upload).
    *   "Store the Gaia node configuration to Arweave."
    *   "Check my wallet balance."
2.  The AI agent will process your request.
3.  If an action on Arweave is required, the agent will automatically call the appropriate tool (e.g., `store_chat_on_arweave`, `check_transaction_status`).
4.  The agent will then provide a response summarizing the outcome, including links to stored data when available.
5.  Use `Ctrl+Z`/`Cmd+Z` to undo the last message exchange.

## How It Works (Technical Overview)

### Backend (`main.js`)

*   **Express Server**: Serves static files from the `public/` directory and handles API requests.
*   **Gaia API Client**: Uses the `openai` library to communicate with your Gaia node.
*   **Arweave Storage SDK**:
    *   Initialized with the `PRIVATE_KEY` from `.env`.
    *   Provides functions for login, getting upload estimates (`getEstimates`), and uploading data (`quickUpload`).
    *   Used by both the main chat (`/upload-transcript`, `/get-estimates`) and the agent (`/agent-chat`) for interacting with Arweave.
*   **Endpoints**:
    *   `/` and `/agent-demo`: Serve the respective HTML files.
    *   `/socket.io/`: Handles real-time communication for `index.html` chat messages.
    *   `/get-estimates`, `/upload-transcript`: API endpoints for the main chat's Arweave functionality.
    *   `/agent-chat`: The core endpoint for the agent demo. It:
        *   Receives messages from the frontend.
        *   Prepares a conversation history and a list of available tools for the Gaia node.
        *   Calls the Gaia API (with `tools` and `tool_choice: "auto"`).
        *   Parses the Gaia response for `tool_calls`.
        *   Executes the requested tools locally (e.g., calling `storageClient.quickUpload`).
        *   Calls the Gaia API *again*, sending the results of the tool executions.
        *   Returns the final AI response, along with details of the tools called and their results, to the frontend.

### Frontend (`public/`)

*   **`index.html` & `main.js`**:
    *   Provides a chat UI.
    *   Uses Socket.IO for real-time messaging with the backend.
    *   Handles the "Upload Chat" button click, sending the transcript to the backend's `/upload-transcript` endpoint.
    *   Displays the Arweave link received from the backend.
    *   Implements local undo history (`Ctrl+Z`/`Cmd+Z`).
*   **`agent-demo.html` & `agent-demo.js`**:
    *   Provides a chat UI tailored for agent interactions.
    *   Uses standard `fetch` API to communicate with the backend's `/agent-chat` endpoint.
    *   Sends the user's message and the conversation history.
    *   Receives and displays the AI's response, tool calls made, and tool results.
    *   Formats tool results (like upload lists, status checks) for better readability.
    *   Implements local undo history (`Ctrl+Z`/`Cmd+Z`).

## Available Agent Tools

The AI agent in `agent-demo.html` can use the following tools (defined and executed in `main.js`):

*   `store_chat_on_arweave`: Stores the full conversation history to Arweave.
*   `store_gaia_config_on_arweave`: Fetches the Gaia node's public config (`/config_pub.json`) and stores it to Arweave.
*   `check_transaction_status`: Checks the status of an upload using its Receipt ID.
*   `list_user_uploads`: Retrieves a list of recent uploads made by the app's wallet.
*   `get_wallet_balance`: Gets the balance of the app's wallet.
*   `search_files_by_tag`: Searches for uploads based on specific tags (implementation may vary based on SDK capabilities).

## Development

*   **Adding New Tools**: Define the tool in the `tools` array within the `/agent-chat` endpoint in `main.js`. Then, add the corresponding execution logic in the tool handling loop.
*   **Frontend Customization**: Modify the HTML and CSS files in `public/` to change the look and feel.
*   **Backend Logic**: Modify `main.js` to change how the server handles requests, interacts with Gaia, or uses the Arweave SDK.

## Important Notes

*   **Wallet Funding**: The wallet corresponding to `PRIVATE_KEY` in `.env` must be funded with the required token (e.g., USDC on Base Sepolia) to pay for Arweave storage.
*   **Arweave Finality**: After an upload is initiated and an `arweaveTxId` is obtained (often after a short delay), it takes time for the transaction to be mined and propagated on the Arweave network. Links might not work immediately.
*   **Security**: Never expose your `PRIVATE_KEY` or `GAIA_API_KEY` in client-side code or public repositories.
*   **Gaia Tool Calling**: This application relies on your Gaia node supporting the OpenAI-like tool calling interface (`tools`, `tool_calls`, providing tool results). Ensure compatibility.
