# Gaia <> Ankr: Your AI-Powered Blockchain Assistant 🤖🔗

This an **example application** demonstrating how you can combine the power of **Gaia's OpenAI-compatible API** (that's your own self-hosted or managed AI node!) with **Ankr's comprehensive blockchain data APIs**. Think of it as building a smart assistant that understands your natural language requests and fetches blockchain information for you.



https://github.com/user-attachments/assets/d9b76af3-ac05-432d-8209-19a089a4afb4



![ankr-1](https://github.com/user-attachments/assets/cdc76be3-4cf4-4b97-b7da-2b0a516dc895)
![ankr-2](https://github.com/user-attachments/assets/bb3c0f9e-ea21-4b95-82d1-6a38a31bbe8a)
![ankr-3](https://github.com/user-attachments/assets/222199fb-a6a0-4c59-b3b3-045fd2808f82)
![ankr-4](https://github.com/user-attachments/assets/bb1614ba-1e99-46f7-8182-416d4d6eda1f)

## What's Cool About This? 🤩

*   **Natural Language Interface:** Instead of crafting specific JSON-RPC requests, you can just ask:
    *   "Show me the balance for wallet 0xbDe71618Ef4Da437b0406DA72C16E80b08d6cD45 on Ethereum."
    *   "What are the latest transactions for Vitalik's address on Polygon?"
    *   "Get me the metadata for NFT contract 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d, token ID 1234 on eth."
*   **Leverage Your Gaia Node:** Use your own Gaia instance, giving you control over the AI model, costs, and data privacy.
*   **Ankr's Data Prowess:** Tap into Ankr's rich dataset across dozens of blockchains for information on:
    *   Blockchain stats
    *   Account balances (native and tokens)
    *   NFTs (owned, metadata, holders, transfers)
    *   Token details (price, holders, transfers)
    *   Transaction histories
    *   And much more!
*   **Tool Calling Magic:** This project showcases OpenAI's "Tool Calling" (or "Function Calling") feature. Gaia intelligently figures out which Ankr API endpoint to call based on your question and extracts the necessary parameters.
*   **Extensible Foundation:** This is a starting point! You can easily:
    *   Add more Ankr API tools.
    *   Integrate other blockchain services.
    *   Build this into a Discord bot, a web app, or any other application you can dream up.

## How It Works (The Gist) 🤓

1.  You type a question into the simple command-line interface.
2.  The app sends your question, along with a list of "tools" (which describe Ankr's API functions), to your Gaia node.
3.  Gaia analyzes your question and, if appropriate, decides to "call a tool." It tells our app *which* Ankr function to use and *what parameters* (like wallet addresses, blockchain names) it extracted from your question.
4.  Our Node.js app takes these instructions, formats a proper request to the Ankr API, and fires it off.
5.  Ankr sends back the blockchain data.
6.  The app sends this data *back* to Gaia.
7.  Gaia then uses this data to formulate a friendly, human-readable answer to your original question.

It's like having a conversation where your AI assistant can go off and do some research (on the blockchain!) before getting back to you.

## Getting Your Own Version Up and Running 🚀

Ready to try this with your own Gaia node and Ankr API key? Here's how:

**Prerequisites:**

*   **Node.js:** (v18+ recommended for built-in `fetch`, though `node-fetch` is used here for broader compatibility).
*   **A Gaia Node:** You need your Gaia API endpoint and an API key. Make sure it's an OpenAI-compatible endpoint (usually ends in `/v1`).
*   **Ankr API Key:** Sign up at [Ankr RPC Service](https://www.ankr.com/rpc/?utm_referral=uLW8gqj8P6) to get a free API key for their multichain APIs.
*   **A Gaia API Key:** If you're using one of Gaia's [Public Nodes](https://docs.gaianet.ai/nodes/), you will need an API Key. Please get your Free API Key from Gaia [here](https://docs.gaianet.ai/getting-started/authentication).

**Steps:**

1.  **Clone/Download this Project:**
2.  **Install Dependencies:**
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```
    This will install the `openai` library (for talking to Gaia), `node-fetch` (for Ankr calls), `dotenv` (for managing API keys), and `readline-sync` (for the command-line chat).

3.  **Set Up Your API Keys (`.env` file):**
    Create a file named `.env` in the root of the project directory. Copy the contents of `.env.example` (if provided) or add the following lines, replacing the placeholders with your actual keys and endpoint:

    ```env
    GAIA_API_KEY=your_gaia_api_key_here
    GAIA_API_ENDPOINT=https://YOUR_NODE_ID.gaia.domains/v1
    GAIA_MODEL_NAME=name_of_the_model
    ANKR_API_KEY=your_ankr_api_key_here
    ```
    *   **Important for `GAIA_API_ENDPOINT`:** This should be the *base URL* of your Gaia's OpenAI-compatible API. For example, if your chat completions endpoint is `https://YOUR_NODE_ID.gaia.domains/v1/chat/completions`, your `GAIA_API_ENDPOINT` should be `https://YOUR_NODE_ID.gaia.domains/v1`.

4.  **Run the Application:**
    ```bash
    node app.js
    ```

5.  **Start Chatting!**
    You'll see a `You: ` prompt. Ask your blockchain questions! Try some examples:
    *   "Show me stats for eth"
    *   "What's the balance of 0x6B0031518934952C485d5a7E76f1729B50e67486 on polygon?"
    *   "Show me NFTs owned by 0x0E11A192d574b342C51be9e306694C41547185DD on bsc"
    *   Type `exit` to quit.

## Diving Deeper & Customizing 🛠️

*   **`ankrTools.js`:** This is where the magic of defining Ankr's API capabilities for Gaia happens. Each "tool" is described in a JSON schema format that Gaia understands. If Ankr adds new API methods or you want to use different ones, you'd add or modify definitions here. Pay attention to the `description` fields – they help Gaia choose the right tool!
*   **`app.js`:**
    *   The `callAnkrTool` function is the bridge to Ankr. When Gaia decides to use a tool, this function takes the tool name and arguments, constructs the actual Ankr API request, sends it, and processes the response. This is where you'd add the logic if you add new tools.
    *   Notice the type conversions (e.g., `toBoolean`, `toNumber`) in `callAnkrTool`. These are important because LLMs might return parameters like booleans or numbers as strings.
    *   The `system` prompt given to Gaia in `runConversation` helps guide its behavior and how it should use the tools. You can tweak this!
*   **Error Handling:** The current error handling is basic. For a production app, you'd want to make this more robust.
*   **Supported Blockchains:** Check the `getBlockchainEnum()` in `ankrTools.js` and Ankr's documentation for the latest list of supported chains.

## Building Your Own Apps 💡

This project provides a solid foundation. You can take this code and:

*   **Build a Web Interface:** Use a framework like Express.js (Node.js) or Flask/Django (Python) to create a web app where users can type their queries.
*   **Create a Chatbot:** Integrate it into Discord, Telegram, Slack, or other platforms.
*   **Automate Reporting:** Set up scripts to ask recurring questions and log the data.
*   **Enhance DeFi Dashboards:** Add natural language querying to your existing crypto tools.

The possibilities are vast when you combine flexible AI with rich blockchain data!
