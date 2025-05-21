# Gaia <> x402 Demo

This project demonstrates how to create a paid API service that proxies requests to a Gaia Node's API endpoint, using the **x402 protocol** for per-request payments on EVM-compatible chains like Base Sepolia.

The server is built with Express.js and `x402-express` middleware, allowing you to charge users in cryptocurrency (e.g., USDC) for accessing different AI functionalities. The client is an interactive terminal application built with Node.js, Viem.js, and `x402-fetch` to handle the payment flow and API interaction.

https://github.com/user-attachments/assets/30965d85-4f40-4c21-b4e7-7fc364bea6af

## Features

*   **Server-Side (`server.js`):**
    *   Uses Express.js to define API endpoints.
    *   Integrates `x402-express` middleware to protect endpoints and require payment.
    *   Supports multiple API endpoints with differential pricing:
        *   Full Chat Completion
        *   Text Summarization
        *   One-Word Answer
    *   Proxies validated, paid requests to a configured Gaia Node's OpenAI compatible API.
    *   Configurable via `.env` file (receiving wallet, API keys, pricing, network).
*   **Client-Side (`client.js`):**
    *   Interactive terminal interface using `inquirer`.
    *   Allows users to select an API service and enter a prompt.
    *   Uses `x402-fetch` and Viem.js to:
        *   Handle the 402 Payment Required flow.
        *   Make on-chain payments (e.g., USDC on Base Sepolia) using a burner wallet.
    *   Displays API responses and payment receipt details.
    *   Configurable via `.env` file (burner wallet private key, RPC URL, server URL).
*   **Payment Protocol:** Leverages the [x402 Payment Protocol Standard](https://x402.org) for micropayments.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v18+ recommended for global `fetch`)
*   [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)
*   An EVM-compatible wallet to receive payments (for `server.js`).
*   A burner wallet for the client to make payments.
*   Run your own [Gaia Node](https://docs.gaianet.ai/getting-started/quick-start) or use one of our [Public Nodes](https://docs.gaianet.ai/nodes/). Public Nodes require an API key that you can get [here](https://docs.gaianet.ai/getting-started/authentication).
*   Funds on the chosen testnet (e.g. USDC for payments).

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Copy the `.env.example` file to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill in the required values:
    *   `PORT`: Port for the server (e.g., `4021`).
    *   `RECEIVING_WALLET_ADDRESS`: Your wallet address to receive API payments.
    *   `LLAMA_API_KEY`: Your API key for the Llama/Gaia service.
    *   `LLAMA_API_URL`: The base URL for the Llama/Gaia API.
    *   `NETWORK`: The blockchain network (e.g., `base-sepolia`).
    *   `FACILITATOR_URL`: The x402 facilitator URL for the chosen network.
    *   `PRICE_FULL_COMPLETION`, `PRICE_SUMMARY`, `PRICE_ONE_WORD`: Prices for each service.
    *   `BURNER_WALLET_PRIVATE_KEY`: The private key for the client's burner wallet (must start with `0x`).
    *   `BASE_SEPOLIA_RPC_URL`: RPC URL for the client to interact with Base Sepolia.
    *   `CLIENT_TARGET_SERVER_BASE_URL`: URL where the client will find your `server.js`.
    *   `CLIENT_DISPLAY_PRICE_FULL`, etc.: Prices shown to the client (should match server).

    **IMPORTANT:** Never commit your `.env` file with sensitive data to a public repository. The `.gitignore` file should already be configured to ignore it.

4.  **Fund Wallets:**
    *   **Server's Receiving Wallet:** No pre-funding needed other than being a valid address.
    *   **Client's Burner Wallet:** The address derived from `BURNER_WALLET_PRIVATE_KEY` needs to be funded on the specified `NETWORK` (e.g., Base Sepolia) with:
        *   The payment token (e.g., USDC on Base Sepolia) to cover API costs.

## Running the Application

1.  **Start the Server:**
    Open a terminal and run:
    ```bash
    node server.js
    ```
    The server will start, listening on the configured `PORT`. You'll see logs indicating the receiving wallet address and protected endpoints.

2.  **Run the Client:**
    Open another terminal and run:
    ```bash
    node client.js
    ```
    *   The client will display the burner wallet address that needs funding.
    *   Press ENTER after you have funded the burner wallet.
    *   You will then be prompted to choose an API service and enter your prompt.
    *   The client will handle the x402 payment and display the API response.
