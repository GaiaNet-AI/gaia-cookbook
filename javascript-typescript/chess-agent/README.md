# Chess Agent with Gaia

![Chess Agent](./chess-agent.gif)

An intelligent chess agent built with [Gaia](https://docs.gaianet.ai/intro/) that can play chess and provide strategic insights.

## About Gaia

[Gaia](https://docs.gaianet.ai/intro/) is a decentralized computing infrastructure that enables everyone to create, deploy, scale, and monetize their own AI agents. This project uses Gaia's AI capabilities to provide an intelligent chess agent that can play games and provide strategic analysis.

## Features

- **AI-Powered Chess Play**: Play chess against an intelligent AI agent
- **Strategic Analysis**: Get insights and analysis of chess positions
- **Natural Language Interaction**: Communicate with the chess agent using natural language
- **Customizable Difficulty**: Adjust the agent's playing strength to match your skill level
- **Position Analysis**: Get detailed analysis of any chess position

## Setting Up Your Gaia Node

To use your own Gaia node with this chess agent, follow these steps:

### Option 1: Run Your Own Node

1. **Install GaiaNet Node**:
   ```bash
   curl -sSfL 'https://github.com/GaiaNet-AI/gaianet-node/releases/latest/download/install.sh' | bash
   ```

2. **Initialize with Chess Configuration**:
   ```bash
   gaianet config \
   --snapshot https://huggingface.co/datasets/tobySolutions/chess-expert/resolve/main/default-4632527847563394-2025-05-21-00-06-53.snapshot.tar.gz \
   --embedding-url https://huggingface.co/gaianet/Nomic-embed-text-v1.5-Embedding-GGUF/resolve/main/nomic-embed-text-v1.5.f16.gguf \
   --system-prompt "You are a Chess expert capable of playing any game and any opponent. You have all the information necessary to play a game" \
   --rag-prompt "You are a Chess AI agent capable of playing Chess and you know a lot about Chess."
   ```

3. **Start the Node**:
   ```bash
   gaianet start
   ```

### Option 2: Get an API Key

1. **Create an Account**:
   - Go to [https://gaianet.ai](https://gaianet.ai) and click on **Launch App**
   - Connect your MetaMask wallet

2. **Generate an API Key**:
   - Click on your profile dropdown and select **Settings**
   - Navigate to **Gaia API Keys** and click **Create API Key**
   - Give your key a name and save it securely

## System Requirements

If running your own node, ensure your system meets these requirements:

| System | Minimum Requirements |
|--------|---------------------|
| OSX with Apple Silicon (M1-M4 chip) | 16GB RAM (32GB recommended) |
| Ubuntu Linux 20.04 with Nvidia CUDA 12 SDK | 8GB VRAM on GPU |
| Azure/AWS | Nvidia T4 GPU Instance |

## Getting Started

### Prerequisites

- Node.js installed
- Gaia node or API key
- Basic understanding of chess notation

### Setup

1. Clone the repository:
```bash
git clone https://github.com/meowyx/chess-agent.git
cd chess-agent
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the application:
```bash
pnpm start
```

## Architecture

- **AI Integration**: Gaia-powered chess engine
- **User Interface**: Interactive chess board
- **Analysis Engine**: Position evaluation and move suggestions
- **Natural Language Processing**: Command interpretation and response generation

## Resources

- [Gaia Documentation](https://docs.gaianet.ai/intro/)
- [Chess Notation Guide](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))
- [Chess Rules](https://www.fide.com/FIDE/handbook/LawsOfChess.pdf)

## Contributing

Want to contribute? Here's how:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to test your changes before submitting a PR.



