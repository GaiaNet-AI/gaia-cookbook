
# Gaia × Irys Chat Application

A decentralized application that enables users to interact with locally hosted AI models via Gaia nodes and permanently store conversation histories on the Irys network.



https://github.com/user-attachments/assets/34d09621-4892-4d93-99e7-7c360251ff90

![Screenshot - 1](https://github.com/user-attachments/assets/8227e4ed-1a14-4d66-94c4-460f15796b7f)
![Screenshot - 2](https://github.com/user-attachments/assets/4c9c7828-a3bd-4588-b0f0-153e07bafd6f)
![Screenshot - 3](https://github.com/user-attachments/assets/61b7ade7-a91c-45d6-99ca-4ea47eab29c6)
![Screenshot - 4](https://github.com/user-attachments/assets/2e56b4de-a655-429b-9e50-de7193d80bd4)
<img width="1113" height="1222" alt="uploading" src="https://github.com/user-attachments/assets/2b98f2ee-3937-4e06-bd25-9749dddaadc0" />
![Screenshot - 5](https://github.com/user-attachments/assets/fea73bf6-a93a-4483-aa23-d1d2ad457803)


## Overview

This application demonstrates how developers can build powerful decentralized AI applications by combining:
- **Gaia Nodes**: For running local AI models including 200+ open-source models
- **Irys Network**: For permanent, decentralized storage of AI interactions

Users can connect their Ethereum wallets, chat with their locally hosted AI models, and store conversation transcripts on-chain for permanent record keeping.

## Features

- 🔗 **Wallet Integration**: Connect via MetaMask to authenticate and manage on-chain interactions
- 🤖 **Gaia Node Integration**: Connect to any Gaia node running local AI models
- 💾 **Permanent Storage**: Store conversation transcripts on Irys for immutable record keeping
- 📜 **Transaction History**: View all stored conversations directly from the blockchain
- 🛠️ **Customizable Prompts**: Edit system prompts to customize AI behavior
- ⚖️ **Cost Transparency**: View upload costs before storing data on Irys

## Example Stored Conversations

Here are example conversations stored on Irys devnet:

1. [Conversation 1](https://devnet.irys.xyz/EfZ2ArvPDKNWoKDCmYiQPbAZv2CgqusJhL4jfADS9ZXF)
2. [Conversation 2](https://devnet.irys.xyz/iVJsz2VrfRzH7LRfE4QmsQEaRQ3Jnadpwb7bWBaSeC4)
3. [Conversation 3](https://devnet.irys.xyz/GUAEm3xt6u6J2ntCJoUR3T5QEcXfYHmJqbgkV19tXNsw)
4. [Conversation 4](https://devnet.irys.xyz/6auUSye7Gafqh8TRQYxFmx3a6gqN3ycE32rWggebTkev)
5. [Conversation 5](https://devnet.irys.xyz/7SH3SXAhKsCbTfiqC36DR6ipoJgBY11E5wWZN68yP9y7)
6. [Conversation 6](https://devnet.irys.xyz/HRcj3Eia3jTSGZQVFvxbuJim6JQDBezGXA8p7Vh7xiRo)

## Prerequisites

1. Node.js (v16 or higher)
2. npm or yarn
3. MetaMask wallet
4. Access to a Gaia node (local or remote)
5. Ethereum wallet with Sepolia testnet ETH (for Irys uploads)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/harishkotra/gaia-irys-chat.git
cd gaia-irys-chat
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Gaia configuration
GAIA_NODE_URL=https://your-node-id.gaia.domains/v1
GAIA_API_KEY=your_gaia_api_key_here
# Irys Configuration
PRIVATE_KEY=your_ethereum_private_key_here

# Server Configuration
PORT=3001
```

### 4. Start the Application

```bash
# Start the server
npm run dev
```

The application will be available at `http://localhost:3001`

## How It Works

### Gaia Integration

The application connects to Gaia nodes which can run various AI models locally:

1. **Model Support**: Works with over 200+ open-source models as listed [here](https://huggingface.co/gaianet).
2. **Local Processing**: All AI inference happens on your Gaia node
3. **Privacy First**: Conversations never leave your local network (unless stored on Irys)

### Irys Integration

Conversation transcripts are stored permanently on the Irys network:

1. **Decentralized Storage**: Data is stored across a distributed network
2. **Immutable Records**: Stored conversations cannot be altered or deleted
3. **Cost Efficient**: Pay only for the storage you use
4. **Permanent Access**: Retrieve conversations anytime using the transaction ID

## Development

### Project Structure

```
gaia-irys-chat/
├── public/                 # Frontend assets
│   ├── index.html          # Main HTML file
│   ├── script.js           # Client-side JavaScript
│   └── style.css           # Stylesheet
├── server/                 # Server-side code
│   ├── index.js            # Main server file
│   └── package.json        # Server dependencies
├── .env                    # Environment variables
└── README.md               # This file
```

### Key Components

1. **Frontend**: Vanilla JavaScript UI with wallet integration
2. **Backend**: Express.js server handling API requests
3. **Gaia API**: Integration with OpenAI-compatible endpoints
4. **Irys SDK**: Permanent storage using Irys network

### Customization

If you're a builder, you can extend this application by:

1. Adding support for different AI models
2. Implementing additional Irys token support
3. Creating custom UI components
4. Adding analytics or visualization features

## Contributing

Here's how you can help:

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Areas for Contribution

- **UI/UX Improvements**: Enhance the user interface and experience
- **New Features**: Add support for additional AI models or storage networks
- **Documentation**: Improve README and code comments
- **Bug Fixes**: Resolve any issues found in the application
- **Performance**: Optimize code for better efficiency
- **Testing**: Add unit and integration tests


## Acknowledgments

- [Gaia Network](https://gaianet.ai) for decentralized AI infrastructure.
- [Irys Network](https://irys.xyz) for permanent data storage.
- [Gaia Docs](https://docs.gaianet.ai) for running your own local AI inference.
- [Irys Docs](https://docs.irys.xyz/build/d/guides/ai-prompts) for storing AI prompts on-chain.
