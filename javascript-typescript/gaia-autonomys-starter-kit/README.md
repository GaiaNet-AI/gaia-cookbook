# Gaia Node + Auto Drive Chat Application

A Node.js application that demonstrates integration between:
- **Gaia Node** for AI chat functionality (OpenAI-compatible API). [Launch your own node.](https://docs.gaianet.ai/getting-started/quick-start/)
- **Auto Drive** for decentralized storage on Autonomys Network
- **Autonomys EVM (tAI3)** for payments



https://github.com/user-attachments/assets/c9e0627c-d2ef-454b-8816-23ef54638dfd


<img width="1464" height="1615" alt="screencapture-localhost-3000-2025-08-14-21_29_03" src="https://github.com/user-attachments/assets/1533293a-4b9f-46f9-b912-6506a7856592" />

## Features

1. **Wallet Connection**: Connect using Reown/WalletConnect
2. **AI Chat**: Chat with a Gaia Node using OpenAI-compatible API
3. **Decentralized Storage**: Store chat transcripts on Auto Drive
4. **Payment Integration**: Pay using Autonomys EVM (tAI3)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```
PORT=3000
AUTODRIVE_API_KEY=your-auto-drive-api-key-here
GAIA_NODE_URL=https://your-node-id.gaia.domains
GAIA_API_KEY=your-gaia-api-key-here
REOWN_PROJECT_ID=your-reown-project-id-here
```

### 3. Reown Project ID

1. Go to [Reown Cloud](https://cloud.reown.com/)
2. Create a new project
3. Copy your Project ID
4. Add it to your `.env` file as `REOWN_PROJECT_ID=your-actual-project-id`

### 4. Auto Drive API Key

1. Visit [Auto Drive Dashboard](https://auto-drive.autonomys.xyz/)
2. Sign in with Google, Discord, or GitHub
3. Create an API key
4. Add it to your `.env` file

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. **Connect Wallet**: Click "Connect Wallet" to connect via Reown
2. **Start Chatting**: Type messages to chat with the Gaia Node AI
3. **Store Chat**: Click "Store on Auto Drive" to save the chat transcript
4. **View Stored Files**: Chat transcripts are stored with metadata including:
   - Session ID and wallet address
   - All messages with timestamps
   - System prompt and model information
   - Total tokens consumed
   - Storage timestamp

## API Endpoints

### Chat Endpoints
- `POST /api/chat/message` - Send a message to Gaia Node
- `GET /api/chat/session/:sessionId` - Get chat session data
- `GET /api/chat/models` - Get available models from Gaia Node
- `GET /api/chat/node-config` - Get Gaia Node public configuration
- `GET /api/chat/node-info` - Get Gaia Node information

### Storage Endpoints
- `POST /api/storage/store-chat` - Store chat transcript on Auto Drive
- `GET /api/storage/my-files` - List stored files
- `GET /api/storage/download/:cid` - Download file by CID

## Chat Transcript Format

Stored chat transcripts include:
```json
{
  "sessionId": "session_abc123_1234567890",
  "walletAddress": "0x...",
  "systemPrompt": "You are a helpful AI assistant...",
  "messages": [
    {
      "role": "user",
      "content": "Hello!",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "totalTokens": 150,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "storedAt": "2024-01-01T12:05:00.000Z",
  "model": "Llama-3.2-3B-Instruct",
  "gaiaNodeUrl": "https://0xebd3632ca5e7d758b88393f10b40ba8f59b0a396.gaia.domains"
}
```

## Architecture

- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Backend**: Node.js with ExpressJS
- **Wallet**: Reown AppKit for wallet connectivity
- **AI**: Gaia Node (OpenAI-compatible API) using OpenAI npm package
- **Storage**: Auto Drive on Autonomys Network (Autonomys EVM)
- **Node**: Pre-configured for `https://0xebd3632ca5e7d758b88393f10b40ba8f59b0a396.gaia.domains`

## Security Notes

- API keys are stored server-side only
- Chat sessions are stored in memory (use database in production)
- All Auto Drive uploads use compression
- Files can be encrypted with optional passwords

## Production Considerations

1. **Database**: Replace in-memory storage with a proper database
2. **Authentication**: Add proper user authentication
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Error Handling**: Enhanced error handling and logging
5. **HTTPS**: Use HTTPS in production
6. **Environment**: Use production Gaia Node and Auto Drive endpoints

## Examples of Stored Conversation

- [Example 1](https://gateway.autonomys.xyz/file/bafkr6id56ls6qzcvpngpjfuyjouo4sx3gqclmd32pgvnzru5u6h4rczfg4)
- [Example 2](https://gateway.autonomys.xyz/file/bafkr6igpejuqa46ioo26ftqowaxslsark64b2ovw66xn3ljuuppftkghla)
- [Example 3](https://gateway.autonomys.xyz/file/bafkr6igmnmiwaj33oaxcw3vqnwy72vhh4avoeh36vj2kuj6lomxbidmzqi)
