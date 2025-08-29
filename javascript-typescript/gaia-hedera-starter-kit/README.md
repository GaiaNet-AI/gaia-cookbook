# Gaia-Hedera Agent Starter Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This starter kit provides a launchpad for developers in the Gaia and Hedera communities to build powerful, AI-driven applications. It demonstrates how to connect a local **Gaia Node**, which provides an OpenAI-compatible API for tool-calling, with the **Hedera Agent Kit** to interact with the Hedera Network using natural language.

The examples provided are built with simple, framework-free NodeJS and are designed to be clear, educational, and easily extensible.

## Core Features

-   **Local LLM Integration**: Connects directly to your local Gaia node, keeping your interactions private and fast.
-   **Hedera Blockchain Interaction**: Uses the `hedera-agent-kit` to perform queries and execute real transactions on the Hedera network.
-   **Autonomous Agents**: Run agents that can understand a prompt, select the right Hedera tool, and execute a transaction on their own.
-   **Wallet Simulation (Human-in-the-Loop)**: Run an agent that prepares a transaction and returns the raw bytes, simulating how a wallet application would ask a user for a signature before broadcasting.
-   **Extensible & Educational**: The code is heavily commented to explain *how* and *why* things work, making it easy to learn from and build upon.

## Getting Started

Follow these steps to get your starter kit up and running.

### 1. Prerequisites

-   **Node.js**: You must have Node.js v18 or higher installed.
-   **Gaia Node**: You need a running instance of a Gaia node. Please refer to the [official Gaia documentation](https://docs.gaianet.ai/getting-started/quick-start?ref=gaia-hedera-starter-kit) for setup instructions.
-   **Hedera Testnet Account**: You need an account ID and an ECDSA private key from the [Hedera Portal](https://portal.hedera.com/dashboard).

### 2. Project Setup

First, clone the repository (or download the files) and install the dependencies.

```bash
# Clone the repository
git clone https://github.com/harishkotra/gaia-hedera-starter-kit.git
cd gaia-hedera-starter-kit

# Install dependencies
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project directory.

```bash
touch .env
```

Copy the following configuration into the `.env` file and fill it with your own credentials.

```env
# Hedera Testnet Credentials from https://portal.hedera.com
ACCOUNT_ID="0.0.xxxxxx"
PRIVATE_KEY="0x..."

# Your Local Gaia Node Configuration
GAIA_NODE_URL="https://node-id.gaia.domains/v1"
GAIA_API_KEY="not-needed" #not needed for your own nodes
GAIA_MODEL_NAME="llama3b"
```

## Running the Agents

This kit includes three different agent examples, each demonstrating a unique functionality. You can run them using the `npm run` scripts defined in `package.json`.

### 1. The Autonomous Agent (`tool-calling-agent.js`)

This agent autonomously executes queries and transactions on your behalf.

**To Run:**
```bash
npm run start:autonomous
```

**Example Prompts:**
-   `"what is my hbar balance"`
-   `"create a fungible token called 'My First Coin' with symbol 'MFC' and an initial supply of 50000"`
-   `"send 10 hbar to account 0.0.987"`

<img width="906" height="397" alt="image" src="https://github.com/user-attachments/assets/8fd3aecd-91d0-447c-8a3a-417a2030c46b" />

https://github.com/user-attachments/assets/66899ccb-8f39-4388-aad0-7e3aec11b835


### 2. The NFT Agent (`structured-chat-agent.js`)

This is another autonomous agent but is pre-configured with a wider range of tools, including those for creating and minting NFTs.

**To Run:**
```bash
npm run start:nft
```

**Example Prompts:**
-   `"I want to create an NFT collection. Let's call it 'Digital Wonders' with the symbol 'DW'. Make the max supply 100."`
-   `"mint a new NFT for token 0.0.xxxxxx with the metadata 'ipfs://Qm.../1.json'"`

<img width="900" height="437" alt="image" src="https://github.com/user-attachments/assets/e6755276-b764-41a4-8835-2c6b4d8379b0" />

https://github.com/user-attachments/assets/370bf385-a0e7-483b-a55e-6d9cc6885858


### 3. The Wallet Simulator Agent (`return-bytes-agent.js`)

This agent demonstrates the "human-in-the-loop" model. It prepares a transaction but does not execute it. Instead, it returns the raw transaction bytes, and the script then executes them, simulating how a wallet would seek user approval.

**To Run:**
```bash
npm run start:wallet-sim
```

**Example Prompts:**
-   `"prepare a transaction to send 2.5 hbar to 0.0.6532914"`
-   `"get the bytes to create a token called 'Wallet Token' with symbol 'WTK'"`
-   (For queries): `"what's my balance"` - This will not return bytes, as it's not a transaction.


<img width="901" height="561" alt="image" src="https://github.com/user-attachments/assets/490345be-78a1-4c84-89b9-d4e5de87c306" />

https://github.com/user-attachments/assets/65e67345-c4bd-4eb2-a9de-505b646d1e13


## How to Contribute

Contributions from the community are welcome and highly encouraged! Whether it's fixing a bug, adding a new example, or improving documentation, your help is appreciated.

### Contribution Flow

1.  **Fork the repository** to your own GitHub account.
2.  **Create a new feature branch** from the `main` branch (`git checkout -b my-new-feature`).
3.  **Make your changes** and commit them with clear, descriptive messages.
4.  **Push your branch** to your fork (`git push origin my-new-feature`).
5.  **Open a Pull Request** back to the original repository's `main` branch.

### Areas for Contribution

-   **Add New Tools**: Implement a new tool from the Hedera Agent Kit that isn't used in the examples.
-   **Improve Comments & Docs**: If you find a part of the code that is unclear, clarifying it is a great contribution.
-   **Create New Examples**: Build a new agent file that demonstrates a different use case.
-   **Bug Fixes**: Find and fix a bug.

If you plan to make a significant change, please **open an issue** first to discuss your proposal.
