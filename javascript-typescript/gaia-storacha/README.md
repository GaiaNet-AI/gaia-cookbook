# Gaia + Storacha Demo App

A simple web application that showcases the integration between **Gaia AI nodes** (OpenAI-compatible API) and **Storacha** (decentralized storage network).

https://github.com/user-attachments/assets/69cf5876-78be-45a6-8916-a823c34885ba


<img width="1109" height="295" alt="storacha-1" src="https://github.com/user-attachments/assets/a6ac3603-55a9-4ce6-9a60-9b9940e5b58e" />
<img width="1416" height="1159" alt="storacha-2" src="https://github.com/user-attachments/assets/f68676ee-948c-4329-a1de-375eaab03c3c" />
<img width="1416" height="1159" alt="storacha-3" src="https://github.com/user-attachments/assets/82c29e9e-a616-4c26-adcc-a863bb477784" />
<img width="1419" height="1162" alt="storacha-4" src="https://github.com/user-attachments/assets/07ede16a-7ec2-4cfc-8ee1-88ba013ac2cc" />
<img width="1418" height="1161" alt="storacha-5" src="https://github.com/user-attachments/assets/8d46493f-a7cc-42dc-98e7-40ebe6bc92d6" />


## Features

- 💬 **AI Chat Interface**: Chat with AI powered by Gaia nodes using OpenAI SDK
- ⚙️ **Custom System Prompts**: Edit and customize system prompts in real-time
- 🌐 **Decentralized Storage**: Conversations stored on Storacha with rich metadata
- 🪙 **Token Tracking**: Monitor token usage for each conversation
- 📚 **Conversation History**: Browse and reload previously stored conversations
- 🔗 **IPFS URLs**: Direct links to stored conversations via IPFS gateways
- 📈 **Rich Metadata**: Store model info, system prompts, token usage, and more

## How It Works

1. **User customizes system prompt** → Edit system prompt via UI (optional)
2. **User sends a message** → Frontend sends to `/api/chat` with custom prompt
3. **Server queries Gaia** → Gets AI response using OpenAI SDK with token tracking
4. **User manually stores** → Click "Store on Storacha" to save conversation
5. **Rich metadata stored** → Includes model, tokens, system prompt, space info
6. **IPFS access** → Get direct IPFS URLs for stored conversations
7. **Browse history** → View conversations with metadata and reload them

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Gaia Node Configuration
GAIA_API_URL=https://your-gaia-node.com/v1
GAIA_API_KEY=your-gaia-api-key

# Storacha Configuration  
STORACHA_KEY=Mg...  # Your agent private key
STORACHA_PROOF=...  # Your base64 delegation proof

# Server Configuration
PORT=3000
```

### 3. Run the App
```bash
npm start
```

Visit `http://localhost:3000` to start chatting!

## Configuration

### Gaia Setup
- Get a [Gaia node endpoint](https://docs.gaianet.ai/getting-started/quick-start/?ref=gaia-storacha-demo) that supports OpenAI-compatible API
- Obtain your [API key](https://docs.gaianet.ai/getting-started/authentication/) for authentication (Only required if your using a [Public Node](https://docs.gaianet.ai/nodes/) from Gaia)
- Update `GAIA_API_URL` and `GAIA_API_KEY` in `.env`

### Storacha Setup

**Quick Start**: The app includes working demo credentials in `.env.example`. Copy them to `.env` to test real Storacha storage:

```bash
cp .env.example .env
```

**For your own setup**:

1. **Install Storacha CLI**:
   ```bash
   npm install -g @storacha/cli
   ```

2. **Login and create a space**:
   ```bash
   storacha login your-email@example.com
   # Click the validation link in your email

   storacha space create gaia-storacha-demo

   storacha space use gaia-storacha-demo
   ```

3. **Generate agent key and delegation**:
   ```bash
   # Generate agent private key and DID
   storacha key create
   # ❗️ Copy the private key (starting with "Mg...") 
   
   # Create delegation from your space to the agent
   storacha delegation create <did_from_above_command> --base64
   # ❗️ Copy the base64 delegation proof
   ```

4. **Update your `.env` file**:
   ```env
   STORACHA_KEY=Mg...  # Your agent private key
   STORACHA_PROOF=...  # Your base64 delegation proof
   ```

## Demo Mode

The app works in demo mode even without credentials:
- **Mock Gaia responses** when API credentials aren't configured
- **Mock Storacha storage** when storage credentials aren't configured
- Perfect for testing the UI and understanding the flow

## API Endpoints

- `POST /api/chat` - Send message with optional system prompt, get AI response with token usage
- `GET /api/system-prompt` - Get current system prompt and default
- `POST /api/system-prompt` - Update custom system prompt
- `POST /api/store-conversation` - Store conversation on Storacha with metadata
- `GET /api/conversations` - List all stored conversation metadata
- `GET /api/conversations/:cid` - Retrieve specific conversation by CID

## Project Structure

```
├── server.js              # Express server
├── services/
│   ├── gaia.js            # Gaia AI service
│   └── storacha.js        # Storacha storage service
├── public/
│   ├── index.html         # Frontend UI
│   └── app.js             # Frontend JavaScript
├── package.json
├── .env.example
└── README.md
```

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **AI**: Gaia nodes with OpenAI Compatible APIs. [Launch your node](https://docs.gaianet.ai/getting-started/quick-start/?ref=gaia-storacha-demo).
- **Storage**: [Storacha decentralized network](http://storacha.network/referred?refcode=b7m7DtT7zFzNqLtq)
- **HTTP Client**: Axios (for metadata), OpenAI SDK (for chat)

## Stored Conversation Metadata

Each conversation stored on Storacha includes rich metadata:

```json
{
  "id": "conversation-id",
  "timestamp": "2025-01-08T...",
  "messages": [...],
  "metadata": {
    "stored_at": "2025-01-08T...",
    "model": "Llama-3-Groq-8B-Tool",
    "gaia_node_url": "https://your-gaia-node.com",
    "system_prompt": "Your custom system prompt...",
    "space_did": "did:key:z6Mk...",
    "space_name": "gaia-storacha-example",
    "total_tokens": 150,
    "file_size_bytes": 2048
  }
}
```

## Next Steps

This demo shows advanced Gaia + Storacha integration. You could extend it with:

- [ ] User authentication and personal conversation history
- [ ] Conversation sharing via CID links and IPFS URLs
- [ ] Advanced AI model selection and switching
- [ ] File upload and storage with conversations
- [ ] Real-time collaboration features
- [ ] Integration with other decentralized protocols
- [ ] Analytics dashboard for token usage and costs

Want to contribute? Do create a PR with one of the features from the above. 

## Learn More

- [Gaia Documentation](https://docs.gaianet.ai/?ref=gaia-storacha-demo)
- [Register on Storacha](http://storacha.network/referred?refcode=b7m7DtT7zFzNqLtq)
- [Storacha AI Quickstart](https://docs.storacha.network/quickstart/)
- [Storacha Documentation](https://docs.storacha.network/)

## Examples of Data Stored on Storacha

- [Example 1](https://bafkreidgsrpzupk7hgd2tewrsortcno6gcc7w34weryenb7zzwfvp7j34u.ipfs.w3s.link/)
- [Example 2](https://bafkreifvxkxveitbx264ijbacbjgm2xlqlnb7tgbcc6gqrsiz5fmeghnoy.ipfs.w3s.link/)
- [Example 3](https://bafkreicqz6eqejvp6uzcx7bpu64ae3rkofsyhfcz5cpo5mh4djjyhl6nfe.ipfs.w3s.link/)
- [Example 4](https://bafkreiex57hlkq7gsom44jmcrdn563w7cvgvyxcaxnofzyfzozf3d6x3ou.ipfs.w3s.link/)

## Questions?

Feel free to reach out to me on [Twitter](https://x.com/HarishKotra) or create an issue in this repo if you have any questions or feedback.
